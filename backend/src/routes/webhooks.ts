import express from 'express';
import crypto from 'crypto';
import fetch from 'node-fetch';
import { db } from '../config/firebase';

const router = express.Router();

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || '';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';
const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || '';
const RAZORPAY_API_URL = 'https://api.razorpay.com/v1';

const isConfigured = () => RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET;

async function razorpayRequest(endpoint: string, method: string = 'GET', body?: object) {
  if (!isConfigured()) throw new Error('Razorpay not configured');

  const auth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');
  const response = await fetch(`${RAZORPAY_API_URL}${endpoint}`, {
    method,
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body): undefined,
  });

  const data = await response.json() as any;
  if (!response.ok) throw new Error(data.error?.description || 'Razorpay API error');
  return data;
}

function verifyWebhookSignature(body: string, signature: string, secret: string): boolean {
  const expected = crypto.createHmac('sha256', secret).update(body).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

async function markScheduleEMIAsPaid(loanId: string, amount: number, method: string) {
  const scheduleSnapshot = await db.collection('repayment_schedules')
.where('loanId', '==', loanId)
.limit(1)
.get();

  if (scheduleSnapshot.empty) return;

  const schedule = scheduleSnapshot.docs[0];
  const scheduleData = schedule.data();
  const updatedSchedules = [...scheduleData.schedules];
  const unpaidIndex = updatedSchedules.findIndex((s: any) => s.status !== 'Paid');

  if (unpaidIndex !== -1) {
    updatedSchedules[unpaidIndex] = {
...updatedSchedules[unpaidIndex],
      status: 'Paid',
      paidDate: new Date(),
      paidAmount: amount,
      paidVia: method?.toUpperCase() || 'ONLINE',
    };

    const totalPaid = updatedSchedules
.filter((s: any) => s.status === 'Paid')
.reduce((sum: number, s: any) => sum + (s.paidAmount || 0), 0);

    await schedule.ref.update({
      schedules: updatedSchedules,
      totalPaid,
      totalOutstanding: scheduleData.totalScheduledAmount - totalPaid,
      updatedAt: new Date(),
    });
  }
}

router.post('/razorpay', async (req: express.Request, res: express.Response) => {
  try {
    const signature = req.headers['x-razorpay-signature'] as string;

    if (!signature) {
      return res.status(400).json({ error: 'Missing webhook signature' });
    }

    if (!RAZORPAY_WEBHOOK_SECRET) {
      console.warn('[Webhook] RAZORPAY_WEBHOOK_SECRET not set, rejecting webhook for security');
      return res.status(500).json({ error: 'Webhook secret not configured' });
    }
    const rawBody = req.body as Buffer;
    const bodyStr = rawBody.toString();

    if (!verifyWebhookSignature(bodyStr, signature, RAZORPAY_WEBHOOK_SECRET)) {
      console.error('[Razorpay Webhook] Invalid signature');
      return res.status(400).json({ error: 'Invalid signature' });
    }

    const event = JSON.parse(req.body.toString());
    const entity = event.payload?.payment?.entity;

    if (!entity) {
      return res.status(400).json({ error: 'Invalid payload' });
    }

    const { id: razorpayPaymentId, order_id: razorpayOrderId, status, amount, method, notes, error_description } = entity;
    const loanAmount = amount / 100;
    const loanId = notes?.loanId || '';
    const orgId = notes?.orgId || '';

    console.log(`[Razorpay Webhook] ${event.type}: ${razorpayPaymentId} - ${status} - Rs${loanAmount}`);

    if (event.type === 'payment.captured') {
      await db.collection('payments').doc(razorpayPaymentId).set({
        id: razorpayPaymentId,
        loanId,
        orgId,
        amount: loanAmount,
        currency: 'INR',
        status: 'captured',
        razorpayOrderId,
        razorpayPaymentId,
        method,
        capturedAt: new Date(),
        createdAt: new Date(),
      }, { merge: true });

      if (orgId) {
        await db.collection('audit_logs').add({
          orgId,
          action: 'PAYMENT_CAPTURED',
          targetId: razorpayPaymentId,
          detail: `Payment captured for loan ${loanId}: Rs${loanAmount} via ${method}`,
          timestamp: new Date(),
        });
      }

      if (loanId) await markScheduleEMIAsPaid(loanId, loanAmount, method);
    } else if (event.type === 'payment.failed') {
      await db.collection('payments').doc(razorpayPaymentId).set({
        id: razorpayPaymentId,
        loanId,
        orgId,
        amount: loanAmount,
        status: 'failed',
        razorpayOrderId,
        razorpayPaymentId,
        method,
        failureReason: error_description || 'Payment failed',
        createdAt: new Date(),
      }, { merge: true });

      if (orgId) {
        await db.collection('audit_logs').add({
          orgId,
          action: 'PAYMENT_FAILED',
          targetId: razorpayPaymentId,
          detail: `Payment failed for loan ${loanId}: ${error_description}`,
          timestamp: new Date(),
        });
      }
    } else if (event.type === 'refund.processed') {
      const refundEntity = event.payload?.refund?.entity;
      const refundId = refundEntity?.id;
      const refundAmount = (refundEntity?.amount || 0) / 100;

      if (refundId) {
        await db.collection('refunds').doc(refundId).set({
          id: refundId,
          razorpayPaymentId,
          amount: refundAmount,
          status: 'processed',
          processedAt: new Date(),
          createdAt: new Date(),
        }, { merge: true });

        const paymentDoc = await db.collection('payments').doc(razorpayPaymentId).get();
        if (paymentDoc.exists) {
          const paymentData = paymentDoc.data()!;
          const newStatus = refundAmount >= paymentData.amount ? 'refunded': 'partial_refunded';
          await paymentDoc.ref.update({ status: newStatus, razorpayRefundId: refundId });
        }
      }
    }

    res.status(200).json({ received: true });
  } catch (error: any) {
    console.error('[Razorpay Webhook] Error:', error.message);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

export default router;