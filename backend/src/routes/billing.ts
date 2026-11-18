import { Router, Response } from 'express';
import { AuthenticatedRequest, authenticateFirebaseToken } from '../middleware/auth';
import { db, Timestamp } from '../config/firebase';
import crypto, { randomUUID } from 'crypto';

const router = Router();

let razorpay: any = null;

const getRazorpay = () => {
  if (!razorpay) {
    const Razorpay = require('razorpay');
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return razorpay;
};

const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';

function validateOrgId(orgId: string): boolean {
  return /^[a-zA-Z0-9_-]{1,128}$/.test(orgId);
}

router.post('/create-order', authenticateFirebaseToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = req.orgId!;
    if (!validateOrgId(orgId)) {
      return res.status(400).json({ error: 'Invalid org ID' });
    }

    if (!RAZORPAY_KEY_SECRET || !process.env.RAZORPAY_KEY_ID) {
      return res.status(503).json({ error: 'Payment gateway not configured' });
    }

    const razorpayInstance = getRazorpay();
    const options = {
      amount: 2500000,
      currency: 'INR',
      receipt: randomUUID(),
    };

    const order = await razorpayInstance.orders.create(options);

    const batch = db.batch();
    batch.create(db.collection('billing_orders').doc(order.id), {
      orgId, amount: order.amount, currency: order.currency, status: 'created',
    });
    batch.create(db.collection('audit_logs').doc(), {
      orgId, action: 'BILLING_ORDER_CREATED', targetId: order.id,
      detail: 'Enterprise upgrade order created', timestamp: Timestamp.now(),
    });
    await batch.commit();

    res.status(200).json({
      keyId: process.env.RAZORPAY_KEY_ID,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    res.status(500).json({ error: 'Failed to create payment order' });
  }
});

router.post('/verify', authenticateFirebaseToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = req.orgId!;
    if (!validateOrgId(orgId)) {
      return res.status(400).json({ error: 'Invalid org ID' });
    }

    if (!RAZORPAY_KEY_SECRET || !process.env.RAZORPAY_KEY_ID) {
      return res.status(503).json({ error: 'Payment gateway not configured' });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: 'All fields required' });
    }

    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (razorpay_signature !== expectedSignature) {
      await db.collection('audit_logs').add({
        orgId,
        action: 'BILLING_VERIFY_FAILED',
        targetId: razorpay_order_id,
        detail: 'Payment verification failed: invalid signature',
        timestamp: Timestamp.now(),
      });
      return res.status(400).json({ error: 'Invalid signature' });
    }

    const orderRef = db.collection('billing_orders').doc(razorpay_order_id);
    let order = (await orderRef.get()).data();
    if (!order) {
      // Existing checkout sessions recorded ownership in the audit log.
      const history = await db.collection('audit_logs').where('targetId', '==', razorpay_order_id).get();
      if (history.docs.some(row => row.get('orgId') === orgId && row.get('action') === 'BILLING_ORDER_CREATED')) {
        order = { orgId, amount: 2500000, currency: 'INR' };
      }
    }
    if (!order || order.orgId !== orgId) return res.status(404).json({ error: 'Billing order not found' });
    const payment = await getRazorpay().payments.fetch(razorpay_payment_id);
    if (payment.order_id !== razorpay_order_id || payment.status !== 'captured' ||
        Number(payment.amount) !== Number(order.amount) || payment.currency !== order.currency) {
      return res.status(409).json({ error: 'Payment has not settled for this order' });
    }
    await db.runTransaction(async tx => {
      const existing = await tx.get(orderRef);
      if (existing.get('status') === 'paid') return;
      const now = Timestamp.now();
      tx.set(orderRef, { ...order, status: 'paid', paymentId: razorpay_payment_id, paidAt: now }, { merge: true });
      tx.set(db.collection('usage_stats').doc(orgId), {
        tier: 'enterprise', upgradedAt: now, updatedAt: now,
        razorpayOrderId: razorpay_order_id, razorpayPaymentId: razorpay_payment_id,
      }, { merge: true });
      tx.create(db.collection('audit_logs').doc(), {
        orgId, action: 'BILLING_UPGRADE_SUCCESS', targetId: razorpay_order_id,
        detail: 'Organization upgraded to Enterprise tier', timestamp: now,
      });
    });

    res.status(200).json({ success: true, message: 'Upgraded to Enterprise successfully' });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ error: 'Failed to verify payment' });
  }
});

router.get('/usage', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = req.orgId!;
    if (!validateOrgId(orgId)) {
      return res.status(400).json({ error: 'Invalid org ID' });
    }

    const usageDoc = await db.collection('usage_stats').doc(orgId).get();

    if (!usageDoc.exists) {
      return res.status(200).json({
        tier: 'startup',
        apiCalls: 0,
        limit: 100,
        usagePercent: 0,
      });
    }

    const data = usageDoc.data()!;
    const usagePercent = data.limit ? Math.round((data.apiCalls / data.limit) * 100) : 0;

    res.status(200).json({ ...data, usagePercent });
  } catch (error) {
    console.error('Error fetching usage stats:', error);
    res.status(500).json({ error: 'Failed to fetch usage stats' });
  }
});

router.post('/usage/reset', authenticateFirebaseToken, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.billingAdmin) return res.status(403).json({ error: 'Billing administrator required' });
  try {
    const orgId = req.orgId!;
    if (!validateOrgId(orgId)) {
      return res.status(400).json({ error: 'Invalid org ID' });
    }

    const usageRef = db.collection('usage_stats').doc(orgId);
    await usageRef.update({
      apiCalls: 0,
      updatedAt: Timestamp.now(),
    });

    res.status(200).json({ success: true, message: 'Usage counters reset' });
  } catch (error) {
    res.status(500).json({ error: (error as any).message });
  }
});

export default router;