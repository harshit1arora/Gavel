import { db } from '../config/firebase';
import nodemailer from 'nodemailer';

export interface CollectionTriggerResult {
  caseId: string;
  action: 'created' | 'updated' | 'escalated';
  smsSent: boolean;
  emailSent: boolean;
  priority: 'Low' | 'Medium' | 'High';
  missedEmis: number;
}

export interface LoanInfo {
  id: string;
  borrowerId: string;
  borrowerName: string;
  borrowerPhone: string;
  borrowerEmail: string;
  loanAmount: number;
  outstandingAmount: number;
  firstEmiDueDate: Date;
  emiAmount: number;
  orgId: string;
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'noreply@gavel.ai',
    pass: process.env.EMAIL_PASSWORD || '',
  },
});

export const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || '';
export const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || '';
export const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER || '';

async function sendTwilioSMS(to: string, body: string): Promise<boolean> {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
    console.log(`[SMS-STUB] To: ${to}, Body: ${body}`);
    return true;
  }

  try {
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: to,
          From: TWILIO_PHONE_NUMBER,
          Body: body,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Twilio SMS failed:', error);
      return false;
    }

    const result = await response.json();
    console.log('SMS sent:', result.sid);
    return true;
  } catch (error) {
    console.error('Twilio SMS error:', error);
    return false;
  }
}

async function sendLenderAlertEmail(
  orgId: string,
  loan: LoanInfo,
  missedEmis: number,
  daysOverdue: number
): Promise<boolean> {
  try {
    const orgDoc = await db.collection('organizations').doc(orgId).get();
    const org = orgDoc.data();

    if (!org || !org.email) {
      console.log('No org email found, skipping lender alert');
      return false;
    }

    const overdueAmount = missedEmis * loan.emiAmount;
    const isEscalated = missedEmis >= 2;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: ${isEscalated ? '#dc2626' : '#f59e0b'}; padding: 20px; color: white; border-radius: 8px 8px 0 0;">
          <h2 style="margin: 0;">⚠️ ${isEscalated ? 'HIGH RISK' : 'PAYMENT ALERT'}: Borrower at Risk</h2>
        </div>

        <div style="padding: 20px; background: #f9fafb; border: 1px solid #e5e7eb;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px; color: #6b7280;">Borrower Name</td>
              <td style="padding: 8px; font-weight: 600;">${loan.borrowerName}</td>
            </tr>
            <tr style="background: #f3f4f6;">
              <td style="padding: 8px; color: #6b7280;">Loan ID</td>
              <td style="padding: 8px; font-weight: 600;">${loan.id}</td>
            </tr>
            <tr>
              <td style="padding: 8px; color: #6b7280;">Contact</td>
              <td style="padding: 8px;">${loan.borrowerPhone} | ${loan.borrowerEmail}</td>
            </tr>
            <tr style="background: #f3f4f6;">
              <td style="padding: 8px; color: #6b7280;">Loan Amount</td>
              <td style="padding: 8px; font-weight: 600;">₹${loan.loanAmount.toLocaleString('en-IN')}</td>
            </tr>
            <tr>
              <td style="padding: 8px; color: #6b7280;">Outstanding</td>
              <td style="padding: 8px; font-weight: 600; color: #dc2626;">₹${loan.outstandingAmount.toLocaleString('en-IN')}</td>
            </tr>
            <tr style="background: #f3f4f6;">
              <td style="padding: 8px; color: #6b7280;">Missed EMIs</td>
              <td style="padding: 8px; font-weight: 600; color: #dc2626;">${missedEmis}</td>
            </tr>
            <tr>
              <td style="padding: 8px; color: #6b7280;">Days Overdue</td>
              <td style="padding: 8px; font-weight: 600; color: #dc2626;">${daysOverdue}</td>
            </tr>
            <tr style="background: #f3f4f6;">
              <td style="padding: 8px; color: #6b7280;">Amount at Risk</td>
              <td style="padding: 8px; font-weight: 600; color: #dc2626;">₹${overdueAmount.toLocaleString('en-IN')}</td>
            </tr>
          </table>

          ${isEscalated ? `
          <div style="background: #fef2f2; border: 2px solid #dc2626; padding: 15px; border-radius: 8px; margin-top: 20px;">
            <h3 style="color: #dc2626; margin: 0 0 10px 0;">🚨 ESCALATION REQUIRED</h3>
            <p style="color: #991b1b; margin: 0;">This account has missed 2+ consecutive payments. Please review immediately and consider:</p>
            <ul style="color: #991b1b; margin: 10px 0 0 0; padding-left: 20px;">
              <li>Field visit assignment</li>
              <li>Legal notice preparation</li>
              <li>NPA classification review</li>
            </ul>
          </div>
          ` : `
          <div style="background: #fffbeb; border: 1px solid #f59e0b; padding: 15px; border-radius: 8px; margin-top: 20px;">
            <p style="color: #92400e; margin: 0;">Automated reminders sent to borrower. Monitor for payment or further escalation.</p>
          </div>
          `}

          <a href="${process.env.APP_URL || 'https://app.gavel.ai'}/collections/loan/${loan.id}"
             style="display: inline-block; background: #667eea; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: 600; margin-top: 20px;">
            View Collection Case →
          </a>
        </div>

        <div style="text-align: center; padding: 15px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 12px;">
          Gavel AI Collections Automation • ${new Date().toLocaleString()}
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: 'Gavel Collections <collections@gavel.ai>',
      to: org.email,
      subject: `${isEscalated ? '🚨 URGENT' : '⚠️ Alert'}: ${loan.borrowerName} - ${missedEmis} EMI(s) overdue by ${daysOverdue} days`,
      html,
    });

    return true;
  } catch (error) {
    console.error('Lender alert email failed:', error);
    return false;
  }
}

async function createOrUpdateCollectionCase(
  loan: LoanInfo,
  missedEmis: number,
  daysOverdue: number
): Promise<{ caseId: string; action: 'created' | 'updated' | 'escalated' }> {
  const existingQuery = await db.collection('collections')
    .where('loanId', '==', loan.id)
    .limit(1)
    .get();

  const isEscalated = missedEmis >= 2;
  const npaCategory = daysOverdue > 90 ? '90+ DPD' : daysOverdue > 60 ? '60-90 DPD' : '30-60 DPD';

  const caseData = {
    loanId: loan.id,
    borrowerId: loan.borrowerId,
    borrowerName: loan.borrowerName,
    borrowerPhone: loan.borrowerPhone,
    borrowerEmail: loan.borrowerEmail,
    loanAmount: loan.loanAmount,
    loanDate: loan.firstEmiDueDate,
    status: 'Overdue' as const,
    daysOverdue,
    amountOutstanding: loan.outstandingAmount,
    lastEmiDueDate: loan.firstEmiDueDate,
    missedEmis,
    reminders: [],
    actions: [],
    recoveryNotes: [],
    npaStartDate: isEscalated ? new Date() : undefined,
    npaAge: isEscalated ? daysOverdue : undefined,
    npaCategory: isEscalated ? npaCategory : undefined,
    priority: (isEscalated ? 'High' : missedEmis === 1 ? 'Medium' : 'Low') as 'High' | 'Medium' | 'Low',
  };

  if (existingQuery.empty) {
    const docRef = await db.collection('collections').add({
      ...caseData,
      orgId: loan.orgId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await db.collection('audit_logs').add({
      orgId: loan.orgId,
      action: 'COLLECTION_CASE_AUTO_CREATED',
      targetId: docRef.id,
      detail: `Auto-created collection case for ${loan.borrowerName} (${missedEmis} EMI(s) missed)`,
      timestamp: new Date()
    });

    return { caseId: docRef.id, action: 'created' };
  } else {
    const existingDoc = existingQuery.docs[0];
    const existingData = existingDoc.data();

    await db.collection('collections').doc(existingDoc.id).update({
      ...caseData,
      updatedAt: new Date(),
      npaStartDate: isEscalated && !existingData.npaStartDate ? new Date() : existingData.npaStartDate,
      npaAge: isEscalated ? daysOverdue : undefined,
      npaCategory: isEscalated ? npaCategory : undefined,
      priority: isEscalated ? 'High' : existingData.priority,
    });

    await db.collection('audit_logs').add({
      orgId: loan.orgId,
      action: isEscalated ? 'COLLECTION_CASE_ESCALATED' : 'COLLECTION_CASE_AUTO_UPDATED',
      targetId: existingDoc.id,
      detail: `${isEscalated ? 'Escalated' : 'Updated'} collection case for ${loan.borrowerName} (${missedEmis} EMI(s) missed)`,
      timestamp: new Date()
    });

    return { caseId: existingDoc.id, action: isEscalated ? 'escalated' : 'updated' };
  }
}

export async function triggerCollectionWorkflow(
  orgId: string,
  loan: LoanInfo,
  missedEmis: number,
  daysOverdue: number
): Promise<CollectionTriggerResult> {
  console.log(`[CollectionWorkflow] Processing loan ${loan.id} for org ${orgId}: ${missedEmis} missed EMIs, ${daysOverdue} days overdue`);

  const { caseId, action } = await createOrUpdateCollectionCase(loan, missedEmis, daysOverdue);

  const borrowerSMS = missedEmis === 1
    ? `Hi ${loan.borrowerName}, your EMI of ₹${loan.emiAmount.toLocaleString('en-IN')} is overdue. Please pay by EOD to avoid penalties. Ref: ${loan.id}`
    : `Hi ${loan.borrowerName}, your account has ${missedEmis} EMI(s) overdue totaling ₹${(missedEmis * loan.emiAmount).toLocaleString('en-IN')}. Please contact us immediately at 1800-XXX-XXXX. Ref: ${loan.id}`;

  const smsSent = await sendTwilioSMS(loan.borrowerPhone, borrowerSMS);

  const emailSent = await sendLenderAlertEmail(orgId, loan, missedEmis, daysOverdue);

  const isEscalated = missedEmis >= 2;
  const priority: 'Low' | 'Medium' | 'High' = isEscalated ? 'High' : missedEmis === 1 ? 'Medium' : 'Low';

  console.log(`[CollectionWorkflow] Complete for loan ${loan.id}: caseId=${caseId}, action=${action}, sms=${smsSent}, email=${emailSent}, priority=${priority}`);

  return {
    caseId,
    action,
    smsSent,
    emailSent,
    priority,
    missedEmis,
  };
}

export async function processOverdueLoans(orgId?: string): Promise<{
  processed: number;
  triggered: number;
  failed: number;
  results: CollectionTriggerResult[];
}> {
  console.log('[CollectionWorkflow] Starting daily overdue check...');

  const results: CollectionTriggerResult[] = [];
  let failed = 0;

  try {
    let query: any = db.collection('repayment_schedules');

    if (orgId) {
      query = query.where('orgId', '==', orgId);
    }

    const snapshot = await query.get();

    for (const doc of snapshot.docs) {
      const schedule = doc.data();

      const overdueItems = schedule.schedules.filter((s: any) => {
        if (s.status === 'Overdue') return true;
        if (s.status === 'Pending' && new Date(s.dueDate) < new Date()) return true;
        return false;
      });

      if (overdueItems.length === 0) continue;

      const missedEmis = overdueItems.length;
      const latestOverdue = overdueItems[overdueItems.length - 1];
      const dueDate = new Date(latestOverdue.dueDate);
      const daysOverdue = Math.max(1, Math.floor((Date.now() - dueDate.getTime()) / (1000 * 60 * 60 * 24)));

      const loan: LoanInfo = {
        id: schedule.loanId,
        borrowerId: schedule.borrowerId,
        borrowerName: schedule.borrowerName,
        borrowerPhone: schedule.borrowerPhone || '+919876543210',
        borrowerEmail: schedule.borrowerEmail || 'borrower@example.com',
        loanAmount: schedule.loanAmount,
        outstandingAmount: schedule.totalOutstanding,
        firstEmiDueDate: new Date(schedule.firstEmiDate),
        emiAmount: schedule.emiAmount,
        orgId: schedule.orgId,
      };

      try {
        const result = await triggerCollectionWorkflow(schedule.orgId, loan, missedEmis, daysOverdue);
        results.push(result);
      } catch (error) {
        console.error(`Failed to process loan ${schedule.loanId}:`, error);
        failed++;
      }
    }

    console.log(`[CollectionWorkflow] Complete: processed=${snapshot.size}, triggered=${results.length}, failed=${failed}`);

    return {
      processed: snapshot.size,
      triggered: results.length,
      failed,
      results,
    };
  } catch (error) {
    console.error('[CollectionWorkflow] Process error:', error);
    throw error;
  }
}

export async function runDailyCollectionCheck(): Promise<void> {
  try {
    console.log('[Scheduler] Running daily collection check...');

    const snapshot = await db.collection('organizations').get();

    for (const orgDoc of snapshot.docs) {
      const orgId = orgDoc.id;
      try {
        await processOverdueLoans(orgId);
      } catch (error) {
        console.error(`Collection check failed for org ${orgId}:`, error);
      }
    }

    console.log('[Scheduler] Daily collection check complete');
  } catch (error) {
    console.error('[Scheduler] Daily check error:', error);
  }
}