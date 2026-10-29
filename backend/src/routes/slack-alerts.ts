import { Router, Response } from 'express';
import { AuthenticatedRequest, authenticateFirebaseToken } from '../middleware/auth';
import { db, Timestamp } from '../config/firebase';
import {
  sendSlackMessage,
  notifySlackLowUsage,
  notifySlackNewDeal,
  notifySlackCollectionsAlert,
  getSlackConfig,
  updateSlackConfig,
  sendDailyDigest,
  SlackConfig,
} from '../services/slack';

const router = Router();

// ==================== SLACK CONFIG ====================

router.get('/config', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const config = await getSlackConfig(req.orgId!);
    res.status(200).json(config || { enabled: false });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/config', authenticateFirebaseToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { webhookUrl, enabled } = req.body;

    if (webhookUrl && !webhookUrl.startsWith('https://hooks.slack.com/')) {
      return res.status(400).json({ error: 'Invalid Slack webhook URL' });
    }

    await updateSlackConfig(req.orgId!, {
      webhookUrl: webhookUrl || '',
      enabled: enabled || false,
    });

    if (webhookUrl) {
      const test = await sendSlackMessage(webhookUrl, {
        text: '✅ Gavel AI has been connected to your Slack workspace! You will now receive real-time alerts for deals, collections, and compliance events.',
      });
      if (!test) {
        return res.status(400).json({ error: 'Failed to send test message. Please check the webhook URL.' });
      }
    }

    await db.collection('audit_logs').add({
      orgId: req.orgId!,
      action: 'SLACK_CONFIG_UPDATED',
      targetId: req.orgId!,
      detail: `Slack ${enabled ? 'enabled' : 'disabled'}`,
      timestamp: Timestamp.now(),
    });

    res.status(200).json({ success: true, message: 'Slack configuration updated' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== DEAL ALERTS ====================

router.post('/alerts/deal', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const config = await getSlackConfig(req.orgId!);
    if (!config?.enabled || !config.webhookUrl) {
      return res.status(200).json({ sent: false, reason: 'Slack not configured' });
    }

    const { prospectName, prospectCompany, valueEstimate } = req.body;
    if (!prospectName || !prospectCompany) {
      return res.status(400).json({ error: 'prospectName and prospectCompany required' });
    }

    const sent = await notifySlackNewDeal(config.webhookUrl, {
      prospectName,
      prospectCompany,
      valueEstimate: valueEstimate || 0,
    });

    await db.collection('audit_logs').add({
      orgId: req.orgId!,
      action: 'SLACK_ALERT_NEW_DEAL',
      targetId: prospectCompany,
      detail: `New deal alert: ${prospectCompany}`,
      timestamp: Timestamp.now(),
    });

    res.status(200).json({ sent, channel: config.channelId || 'default' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== COLLECTIONS ALERTS ====================

router.post('/alerts/collections', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const config = await getSlackConfig(req.orgId!);
    if (!config?.enabled || !config.webhookUrl) {
      return res.status(200).json({ sent: false, reason: 'Slack not configured' });
    }

    const { borrowerName, loanId, riskLevel, daysOverdue, amountOutstanding } = req.body;
    if (!borrowerName || !loanId) {
      return res.status(400).json({ error: 'borrowerName and loanId required' });
    }

    if (!['high', 'medium', 'low'].includes(riskLevel)) {
      return res.status(400).json({ error: 'riskLevel must be high, medium, or low' });
    }

    const sent = await notifySlackCollectionsAlert(config.webhookUrl, {
      borrowerName,
      loanId,
      riskLevel,
      daysOverdue: daysOverdue || 0,
      amountOutstanding: amountOutstanding || 0,
    });

    await db.collection('audit_logs').add({
      orgId: req.orgId!,
      action: 'SLACK_ALERT_COLLECTIONS',
      targetId: loanId,
      detail: `Collections alert: ${borrowerName} (${riskLevel} risk, ${daysOverdue} DPD)`,
      timestamp: Timestamp.now(),
    });

    res.status(200).json({ sent });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== COMPLIANCE ALERTS ====================

router.post('/alerts/compliance', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const config = await getSlackConfig(req.orgId!);
    if (!config?.enabled || !config.webhookUrl) {
      return res.status(200).json({ sent: false, reason: 'Slack not configured' });
    }

    const { eventType, message, severity, details } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'message required' });
    }

    const severityColor = severity === 'critical' ? '#dc2626' : severity === 'high' ? '#f59e0b' : '#3b82f6';

    const sent = await sendSlackMessage(config.webhookUrl, {
      attachments: [{
        color: severityColor,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `🚨 *Compliance Alert: ${(eventType || 'Event').replace(/_/g, ' ').toUpperCase()}*`,
            },
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: message,
            },
          },
          ...(details ? [{
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `\`\`\`${JSON.stringify(details, null, 2)}\`\`\``,
            },
          }] : []),
        ],
      }],
    });

    await db.collection('audit_logs').add({
      orgId: req.orgId!,
      action: 'SLACK_ALERT_COMPLIANCE',
      targetId: req.orgId!,
      detail: `Compliance alert: ${eventType || 'Event'}`,
      timestamp: Timestamp.now(),
    });

    res.status(200).json({ sent });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== NPA ALERTS ====================

router.post('/alerts/npa', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const config = await getSlackConfig(req.orgId!);
    if (!config?.enabled || !config.webhookUrl) {
      return res.status(200).json({ sent: false, reason: 'Slack not configured' });
    }

    const { borrowerName, loanId, classification, daysOverdue, overdueAmount, outstandingAmount } = req.body;
    if (!borrowerName || !loanId) {
      return res.status(400).json({ error: 'borrowerName and loanId required' });
    }

    const sent = await sendSlackMessage(config.webhookUrl, {
      attachments: [{
        color: '#dc2626',
        blocks: [
          {
            type: 'header',
            text: { type: 'plain_text', text: '🔴 NPA Alert' },
          },
          {
            type: 'section',
            fields: [
              { type: 'mrkdwn', text: `*Borrower*\n${borrowerName}` },
              { type: 'mrkdwn', text: `*Loan ID*\n${loanId}` },
              { type: 'mrkdwn', text: `*Classification*\n${classification || 'NPA'}` },
              { type: 'mrkdwn', text: `*Days Overdue*\n${daysOverdue || 0}` },
              { type: 'mrkdwn', text: `*Overdue Amount*\n₹${(overdueAmount || 0).toLocaleString('en-IN')}` },
              { type: 'mrkdwn', text: `*Outstanding*\n₹${(outstandingAmount || 0).toLocaleString('en-IN')}` },
            ],
          },
          {
            type: 'actions',
            elements: [{
              type: 'button',
              text: { type: 'plain_text', text: 'View Loan' },
              url: `https://app.gavel.ai/loans/${loanId}`,
              action_id: 'view_loan',
            }],
          },
        ],
      }],
    });

    await db.collection('audit_logs').add({
      orgId: req.orgId!,
      action: 'SLACK_ALERT_NPA',
      targetId: loanId,
      detail: `NPA alert: ${borrowerName} classified as ${classification || 'NPA'}`,
      timestamp: Timestamp.now(),
    });

    res.status(200).json({ sent });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== LOW USAGE ALERTS ====================

router.post('/alerts/low-usage', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const config = await getSlackConfig(req.orgId!);
    if (!config?.enabled || !config.webhookUrl) {
      return res.status(200).json({ sent: false, reason: 'Slack not configured' });
    }

    const { orgName, daysSinceUsage } = req.body;
    if (!orgName || !daysSinceUsage) {
      return res.status(400).json({ error: 'orgName and daysSinceUsage required' });
    }

    const sent = await notifySlackLowUsage(config.webhookUrl, orgName, daysSinceUsage);
    res.status(200).json({ sent });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== DAILY DIGEST ====================

router.post('/digest', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const config = await getSlackConfig(req.orgId!);
    if (!config?.enabled || !config.webhookUrl) {
      return res.status(200).json({ sent: false, reason: 'Slack not configured' });
    }

    const { decisionsMadeToday, newApplications, approvalsToday, collectionsAlerts, lowUsageWarnings } = req.body;

    const sent = await sendDailyDigest(config.webhookUrl, {
      decisionsMadeToday: decisionsMadeToday || 0,
      newApplications: newApplications || 0,
      approvalsToday: approvalsToday || 0,
      collectionsAlerts: collectionsAlerts || 0,
      lowUsageWarnings: lowUsageWarnings || 0,
    });

    await db.collection('audit_logs').add({
      orgId: req.orgId!,
      action: 'SLACK_DAILY_DIGEST',
      targetId: req.orgId!,
      detail: 'Daily digest sent',
      timestamp: Timestamp.now(),
    });

    res.status(200).json({ sent });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== SEND CUSTOM MESSAGE ====================

router.post('/send', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const config = await getSlackConfig(req.orgId!);
    if (!config?.enabled || !config.webhookUrl) {
      return res.status(200).json({ sent: false, reason: 'Slack not configured' });
    }

    const { text, blocks, attachments } = req.body;
    if (!text && !blocks && !attachments) {
      return res.status(400).json({ error: 'text, blocks, or attachments required' });
    }

    const sent = await sendSlackMessage(config.webhookUrl, { text, blocks, attachments });
    res.status(200).json({ sent });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== ALERT HISTORY ====================

router.get('/history', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { type, page = '1', limit = '50' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    const query: any = db.collection('audit_logs')
      .where('orgId', '==', req.orgId!)
      .where('action', 'in', [
        'SLACK_ALERT_NEW_DEAL', 'SLACK_ALERT_COLLECTIONS',
        'SLACK_ALERT_COMPLIANCE', 'SLACK_ALERT_NPA',
        'SLACK_ALERT_LOW_USAGE', 'SLACK_DAILY_DIGEST',
        'SLACK_CONFIG_UPDATED',
      ]);

    const snapshot = await query
      .orderBy('timestamp', 'desc')
      .offset((pageNum - 1) * limitNum)
      .limit(limitNum)
      .get();

    const alerts = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      action: doc.data().action,
      detail: doc.data().detail,
      timestamp: doc.data().timestamp?.toDate?.() || doc.data().timestamp,
    }));

    res.status(200).json({ alerts, page: pageNum, limit: limitNum });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;