import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { db } from '../config/firebase';
import fetch from 'node-fetch';

const router = Router();

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || '';
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || '';
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER || '';
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || '';
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@gavel.ai';

const isTwilioConfigured = () => !!(TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN);
const isSendGridConfigured = () => !!(SENDGRID_API_KEY);

interface NotificationRecord {
  id: string;
  orgId: string;
  type: 'sms' | 'email' | 'push' | 'whatsapp';
  to: string;
  templateId?: string;
  subject?: string;
  body: string;
  status: 'pending' | 'sent' | 'failed' | 'delivered';
  sentAt?: Date;
  failureReason?: string;
  createdAt: Date;
}

async function saveNotification(record: NotificationRecord) {
  await db.collection('notifications').doc(record.id).set({
    ...record,
    createdAt: new Date(),
    sentAt: record.status === 'sent' || record.status === 'delivered' ? new Date() : null,
  });

  await db.collection('audit_logs').add({
    orgId: record.orgId,
    action: 'NOTIFICATION_' + record.status.toUpperCase(),
    targetId: record.id,
    detail: `${record.type.toUpperCase()} to ${record.to}: ${record.status}`,
    timestamp: new Date(),
  });
}

async function sendTwilioSMS(to: string, body: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!isTwilioConfigured()) {
    console.log(`[SMS-STUB] To: ${to}, Body: ${body.substring(0, 50)}...`);
    return { success: true, messageId: `sms_${Date.now()}`, error: undefined };
  }

  try {
    const auth = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64');
    const cleanTo = to.startsWith('+') ? to : `+91${to}`;

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: cleanTo,
          From: TWILIO_PHONE_NUMBER,
          Body: body,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      return { success: false, error };
    }

    const result = await response.json() as any;
    return { success: true, messageId: result.sid };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function sendSendGridEmail(
  to: string,
  subject: string,
  htmlBody: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!isSendGridConfigured()) {
    console.log(`[Email-STUB] To: ${to}, Subject: ${subject}`);
    return { success: true, messageId: `email_${Date.now()}`, error: undefined };
  }

  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: SENDGRID_FROM_EMAIL },
        subject,
        content: [{ type: 'text/html', value: htmlBody }],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return { success: false, error };
    }

    const messageId = response.headers.get('x-message-id') || `email_${Date.now()}`;
    return { success: true, messageId };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

router.get('/templates', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const snapshot = await db.collection('notification_templates')
      .where('orgId', '==', req.orgId!)
      .where('isActive', '==', true)
      .get();

    const templates = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));

    const defaultTemplates = [
      { id: 'loan_approved', name: 'Loan Approved', type: 'sms', body: 'Congratulations! Your loan of Rs{{amount}} has been approved. Loan ID: {{loanId}}. Disbursement within 24 hours.' },
      { id: 'payment_reminder', name: 'Payment Reminder', type: 'sms', body: 'Reminder: EMI of Rs{{amount}} due on {{dueDate}}. Pay now to avoid late fees.' },
      { id: 'payment_received', name: 'Payment Received', type: 'sms', body: 'Payment of Rs{{amount}} received. Thank you! Remaining balance: Rs{{balance}}.' },
    ];

    res.status(200).json(templates.length > 0 ? templates : defaultTemplates);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/templates', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, type, subject, body, variables } = req.body;

    if (!name || !type || !body) {
      return res.status(400).json({ error: 'Name, type, and body required' });
    }

    const templateId = `tmpl_${Date.now()}`;

    await db.collection('notification_templates').doc(templateId).set({
      id: templateId,
      orgId: req.orgId!,
      name,
      type,
      subject,
      body,
      variables: variables || extractVariables(body),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    res.status(201).json({ id: templateId, name, type, status: 'active' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/send', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { to, type, subject, body, templateId, data } = req.body;

    if (!to || !body) {
      return res.status(400).json({ error: 'Recipient and body required' });
    }

    const notificationId = `notif_${Date.now()}`;
    const renderedBody = data ? renderTemplate(body, data) : body;

    let status: 'sent' | 'failed' = 'sent';
    let messageId: string | undefined;
    let errorMsg: string | undefined;

    if (type === 'sms' || !type) {
      const result = await sendTwilioSMS(to, renderedBody);
      messageId = result.messageId;
      if (!result.success) {
        status = 'failed';
        errorMsg = result.error;
      }
    } else if (type === 'email') {
      const result = await sendSendGridEmail(to, subject || 'Notification', `<p>${renderedBody}</p>`);
      messageId = result.messageId;
      if (!result.success) {
        status = 'failed';
        errorMsg = result.error;
      }
    }

    const record: NotificationRecord = {
      id: notificationId,
      orgId: req.orgId!,
      type: type || 'sms',
      to,
      templateId,
      subject,
      body: renderedBody,
      status,
      sentAt: status === 'sent' ? new Date() : undefined,
      failureReason: errorMsg,
      createdAt: new Date(),
    };

    await saveNotification(record);

    res.status(202).json({
      id: notificationId,
      status,
      messageId,
      sentAt: record.sentAt?.toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/bulk', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { recipients } = req.body;

    if (!Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ error: 'recipients array required' });
    }

    if (recipients.length > 1000) {
      return res.status(400).json({ error: 'Max 1000 recipients per batch' });
    }

    const results = [];
    let sent = 0;
    let failed = 0;

    for (const r of recipients) {
      const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      const renderedBody = r.data ? renderTemplate(r.body || r.template, r.data) : (r.body || r.message);

      let status: 'sent' | 'failed' = 'sent';

      if (r.type === 'email' || r.type === undefined) {
        const result = await sendSendGridEmail(r.to, r.subject || 'Notification', `<p>${renderedBody}</p>`);
        if (!result.success) { status = 'failed'; failed++; }
        else sent++;
      } else {
        const result = await sendTwilioSMS(r.to, renderedBody);
        if (!result.success) { status = 'failed'; failed++; }
        else sent++;
      }

      await db.collection('notifications').doc(notificationId).set({
        id: notificationId,
        orgId: req.orgId!,
        type: r.type || 'sms',
        to: r.to,
        body: renderedBody,
        status,
        createdAt: new Date(),
      });

      results.push({ id: notificationId, to: r.to, status });
    }

    res.status(200).json({ total: results.length, sent, failed, results });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/history', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { type, status, page = '1', limit = '50' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    let query: any = db.collection('notifications').where('orgId', '==', req.orgId!);
    if (type) query = query.where('type', '==', type);
    if (status) query = query.where('status', '==', status);

    const snapshot = await query
      .orderBy('createdAt', 'desc')
      .offset((pageNum - 1) * limitNum)
      .limit(limitNum)
      .get();

    const notifications = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
    const total = (await query.get()).size;

    res.status(200).json({ total, page: pageNum, limit: limitNum, notifications });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/stats', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const snapshot = await db.collection('notifications').where('orgId', '==', req.orgId!).get();
    const notifications = snapshot.docs.map((doc: any) => doc.data());

    const sent = notifications.filter(n => n.status === 'sent' || n.status === 'delivered').length;
    const failed = notifications.filter(n => n.status === 'failed').length;
    const pending = notifications.filter(n => n.status === 'pending').length;

    const byType: Record<string, number> = {};
    notifications.forEach(n => {
      byType[n.type] = (byType[n.type] || 0) + 1;
    });

    res.status(200).json({
      total: notifications.length,
      sent,
      failed,
      pending,
      successRate: notifications.length > 0 ? Math.round((sent / notifications.length) * 100) : 0,
      byType,
      twilioConfigured: isTwilioConfigured(),
      sendGridConfigured: isSendGridConfigured(),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

function renderTemplate(template: string, data: Record<string, any>): string {
  let result = template;
  for (const [key, value] of Object.entries(data)) {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
  }
  return result;
}

function extractVariables(body: string): string[] {
  const matches = body.match(/\{\{(\w+)\}\}/g) || [];
  return [...new Set(matches.map(m => m.replace(/\{\{|\}\}/g, '')))];
}

export default router;