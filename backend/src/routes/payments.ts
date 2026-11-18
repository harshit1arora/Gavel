import { Router, Response } from 'express';
import { AuthenticatedRequest, authenticateAnyToken } from '../middleware/auth';
import { db } from '../config/firebase';
import crypto from 'crypto';
import fetch from 'node-fetch';

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || '';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';
const RAZORPAY_API_URL = 'https://api.razorpay.com/v1';

interface Payment {
  id: string;
  loanId: string;
  orgId: string;
  amount: number;
  currency: string;
  status: 'created' | 'pending' | 'captured' | 'failed' | 'refunded' | 'partial_refunded';
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpayRefundId?: string;
  method?: string;
  description?: string;
  reference?: string;
  failureReason?: string;
  createdAt: Date;
  capturedAt?: Date;
}

const router = Router();

router.use(authenticateAnyToken);

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

async function savePayment(payment: Payment) {
  await db.collection('payments').doc(payment.id).set({
...payment,
    createdAt: new Date(),
    capturedAt: payment.capturedAt ? new Date(payment.capturedAt): null,
  });

  await db.collection('audit_logs').add({
    orgId: payment.orgId,
    action: 'PAYMENT_' + payment.status.toUpperCase(),
    targetId: payment.id,
    detail: `Payment ${payment.status} for loan ${payment.loanId}: Rs${payment.amount}`,
    timestamp: new Date(),
  });
}

async function markScheduleEMIAsPaid(orgId: string, loanId: string, amount: number, method: string) {
  const scheduleSnapshot = await db.collection('repayment_schedules')
.where('orgId', '==', orgId)
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

router.post('/order', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { loanId, amount, customerName, customerEmail, customerPhone, description } = req.body;

    if (!loanId || !Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ error: 'loanId and valid amount required' });
    }

    const paymentId = `pay_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

    if (!isConfigured()) {
      if (process.env.NODE_ENV === 'production') {
        return res.status(503).json({ error: 'Payment gateway not configured' });
      }
      const orderId = `order_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
      await db.collection('payments').doc(paymentId).set({
        id: paymentId,
        loanId,
        orgId: req.orgId!,
        amount,
        currency: 'INR',
        status: 'created',
        razorpayOrderId: orderId,
        description,
        stubMode: true,
        createdAt: new Date(),
      });

      return res.status(201).json({
        id: orderId,
        entity: 'order',
        amount: amount * 100,
        currency: 'INR',
        status: 'created',
        created_at: Date.now(),
        stub: true,
      });
    }

    const razorpayOrder = await razorpayRequest('/orders', 'POST', {
      amount: Math.round(amount * 100),
      currency: 'INR',
      receipt: paymentId,
      description: description || `Loan Payment - ${loanId}`,
      customer: { name: customerName, email: customerEmail, contact: customerPhone },
      notes: { loanId, orgId: req.orgId!, paymentId },
    });

    await savePayment({
      id: paymentId,
      loanId,
      orgId: req.orgId!,
      amount,
      currency: 'INR',
      status: 'created',
      razorpayOrderId: razorpayOrder.id,
      description,
      createdAt: new Date(),
    });

    res.status(201).json({
      id: razorpayOrder.id,
      entity: razorpayOrder.entity,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      status: razorpayOrder.status,
      created_at: razorpayOrder.created_at,
    });
  } catch (error: any) {
    console.error('Create order error:', error.message);
    res.status(500).json({ error: error.message || 'Failed to create order' });
  }
});

router.post('/link', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { loanId, amount, description, customerName, customerEmail, customerPhone } = req.body;

    if (!loanId || !Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ error: 'loanId and valid amount required' });
    }

    if (!isConfigured()) {
      return res.status(503).json({
        error: 'Payment gateway not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET',
        stub: true,
      });
    }

    const paymentLink = await razorpayRequest('/payment_links', 'POST', {
      amount: Math.round(amount * 100),
      currency: 'INR',
      description: description || `Loan Payment - ${loanId}`,
      customer: { name: customerName, email: customerEmail, contact: customerPhone },
      options: { emit_notify: 1, retain_amount: 0 },
      notes: { loanId, orgId: req.orgId! },
    });

    res.status(201).json({
      id: paymentLink.id,
      short_url: paymentLink.short_url,
      url: paymentLink.url,
      amount: paymentLink.amount,
      currency: paymentLink.currency,
      status: paymentLink.status,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to create payment link' });
  }
});

router.post('/verify', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: 'All fields required' });
    }

    if (!isConfigured()) return res.status(503).json({ error: 'Razorpay not configured', stub: true });

    const expected = crypto
.createHmac('sha256', RAZORPAY_KEY_SECRET)
.update(`${razorpay_order_id}|${razorpay_payment_id}`)
.digest('hex');

    if (razorpay_signature !== expected) return res.status(400).json({ error: 'Invalid signature' });

    const razorpayPayment = await razorpayRequest(`/payments/${razorpay_payment_id}`);

    res.status(200).json({
      id: razorpayPayment.id,
      status: razorpayPayment.status,
      amount: razorpayPayment.amount / 100,
      method: razorpayPayment.method,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Verification failed' });
  }
});

router.get('/:paymentId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Org-scoped: resolve our own record first so a payment owned by another
    // org is indistinguishable from one that does not exist (404, no cross-org
    // read or existence leak), same pattern as the audit-log lookups.
    const doc = await db.collection('payments').doc(req.params.paymentId).get();
    if (!doc.exists || doc.data()!.orgId !== req.orgId) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    const data = doc.data()!;

    if (!isConfigured()) {
      return res.status(200).json({...data, stub: true });
    }

    const razorpayId = data.razorpayPaymentId || req.params.paymentId;
    const razorpayPayment = await razorpayRequest(`/payments/${razorpayId}`);
    res.status(200).json({
      id: razorpayPayment.id,
      status: razorpayPayment.status,
      amount: razorpayPayment.amount / 100,
      method: razorpayPayment.method,
    });
  } catch (error: any) {
    res.status(error.message.includes('not found') ? 404: 500)
.json({ error: error.message });
  }
});

router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { loanId, status, page = '1', limit = '50' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    let query: any = db.collection('payments').where('orgId', '==', req.orgId!);
    if (loanId) query = query.where('loanId', '==', loanId);
    if (status) query = query.where('status', '==', status);

    const snapshot = await query
.orderBy('createdAt', 'desc')
.offset((pageNum - 1) * limitNum)
.limit(limitNum)
.get();

    const payments = snapshot.docs.map((doc: any) => ({ id: doc.id,...doc.data() }));
    const total = (await query.get()).size;

    res.status(200).json({ total, page: pageNum, limit: limitNum, payments });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/record', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { loanId, amount, method, reference, notes } = req.body;

    if (!loanId || !Number.isFinite(amount) || amount <= 0 || !method) {
      return res.status(400).json({ error: 'loanId, amount, and method required' });
    }

    const paymentId = `pay_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const capturedAt = new Date();

    const payment: Payment = {
      id: paymentId,
      loanId,
      orgId: req.orgId!,
      amount,
      currency: 'INR',
      status: 'captured',
      method,
      reference,
      description: notes,
      capturedAt,
      createdAt: capturedAt,
    };

    await savePayment(payment);
    await markScheduleEMIAsPaid(req.orgId!, loanId, amount, method);

    res.status(201).json({
      id: paymentId,
      status: 'captured',
      amount,
      capturedAt: capturedAt.toISOString(),
      message: 'Payment recorded',
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to record payment' });
  }
});

router.post('/refund', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { paymentId, amount, reason } = req.body;

    if (!paymentId || !Number.isFinite(amount) || amount <= 0 || !reason) {
      return res.status(400).json({ error: 'paymentId, amount, and reason required' });
    }

    const paymentDoc = await db.collection('payments').doc(paymentId).get();
    if (!paymentDoc.exists) return res.status(404).json({ error: 'Payment not found' });

    const paymentData = paymentDoc.data()!;
    // Org-scoped: never refund another org's payment (404, no existence leak).
    if (paymentData.orgId !== req.orgId) return res.status(404).json({ error: 'Payment not found' });
    if (paymentData.status !== 'captured') return res.status(400).json({ error: 'Can only refund captured payments' });
    if (amount > paymentData.amount) return res.status(400).json({ error: 'Refund amount exceeds payment amount' });

    if (!isConfigured()) {
      if (process.env.NODE_ENV === 'production') {
        return res.status(503).json({ error: 'Payment gateway not configured' });
      }
      const refundId = `ref_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
      await db.collection('refunds').doc(refundId).set({
        id: refundId,
        razorpayPaymentId: paymentId,
        amount,
        reason,
        status: 'processed',
        stubMode: true,
        processedAt: new Date(),
        createdAt: new Date(),
      });

      await paymentDoc.ref.update({ status: amount >= paymentData.amount ? 'refunded': 'partial_refunded' });

      return res.status(200).json({ id: refundId, status: 'processed', stub: true });
    }

    const refund = await razorpayRequest(`/payments/${encodeURIComponent(paymentData.razorpayPaymentId || paymentId)}/refund`, 'POST', {
      amount: Math.round(amount * 100),
      notes: { reason },
    });

    await db.collection('refunds').doc(refund.id).set({
      id: refund.id,
      razorpayPaymentId: paymentId,
      amount,
      reason,
      status: 'processed',
      processedAt: new Date(),
      createdAt: new Date(),
    });

    await paymentDoc.ref.update({
      status: amount >= paymentData.amount ? 'refunded': 'partial_refunded',
      razorpayRefundId: refund.id,
    });

    res.status(200).json({
      id: refund.id,
      status: 'processed',
      amount: refund.amount / 100,
      processedAt: new Date(refund.created_at * 1000).toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to process refund' });
  }
});

router.get('/analytics/summary', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const snapshot = await db.collection('payments').where('orgId', '==', req.orgId!).get();
    const payments = snapshot.docs.map((doc: any) => doc.data());

    const captured = payments.filter(p => p.status === 'captured');
    const failed = payments.filter(p => p.status === 'failed');
    const total = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalCaptured = captured.reduce((sum, p) => sum + (p.amount || 0), 0);

    const byMethod: Record<string, { count: number; amount: number }> = {};
    captured.forEach(p => {
      const m = p.method || 'unknown';
      if (!byMethod[m]) byMethod[m] = { count: 0, amount: 0 };
      byMethod[m].count++;
      byMethod[m].amount += p.amount || 0;
    });

    res.status(200).json({
      totalPayments: payments.length,
      totalAmount: total,
      capturedCount: captured.length,
      totalCapturedAmount: totalCaptured,
      failedCount: failed.length,
      successRate: payments.length > 0 ? Math.round((captured.length / payments.length) * 100): 0,
      byMethod,
      configured: isConfigured(),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;