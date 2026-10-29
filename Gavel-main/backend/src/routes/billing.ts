import { Router, Response } from 'express';
import { AuthenticatedRequest, authenticateFirebaseToken } from '../middleware/auth';
import { db, Timestamp } from '../config/firebase';
import crypto from 'crypto';

const router = Router();

let razorpay: any = null;

const getRazorpay = () => {
  if (!razorpay) {
    const Razorpay = require('razorpay');
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_missing_key',
      key_secret: process.env.RAZORPAY_KEY_SECRET || 'missing_secret',
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

    if (!RAZORPAY_KEY_SECRET) {
      return res.status(503).json({ error: 'Payment gateway not configured' });
    }

    const razorpayInstance = getRazorpay();
    const options = {
      amount: 2500000,
      currency: 'INR',
      receipt: `receipt_${orgId}_${Date.now()}`,
    };

    const order = await razorpayInstance.orders.create(options);

    await db.collection('audit_logs').add({
      orgId,
      action: 'BILLING_ORDER_CREATED',
      targetId: order.id,
      detail: 'Enterprise upgrade order created',
      timestamp: Timestamp.now(),
    });

    res.status(200).json({
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

    if (!RAZORPAY_KEY_SECRET) {
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

    const usageRef = db.collection('usage_stats').doc(orgId);
    await usageRef.set({
      tier: 'enterprise',
      upgradedAt: Timestamp.now(),
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      updatedAt: Timestamp.now(),
    }, { merge: true });

    await db.collection('audit_logs').add({
      orgId,
      action: 'BILLING_UPGRADE_SUCCESS',
      targetId: razorpay_order_id,
      detail: 'Organization upgraded to Enterprise tier',
      timestamp: Timestamp.now(),
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