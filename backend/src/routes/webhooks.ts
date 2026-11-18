import { Request, Response } from 'express';
import crypto from 'crypto';
import { db } from '../config/firebase';

export default async function razorpayWebhook(req: Request, res: Response) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return res.status(503).json({ error: 'Webhook secret not configured' });
  const signature = req.get('x-razorpay-signature') || '';
  if (!Buffer.isBuffer(req.body) || !/^[0-9a-f]{64}$/i.test(signature)) {
    return res.status(400).json({ error: 'Invalid signed payload' });
  }
  const expected = crypto.createHmac('sha256', secret).update(req.body).digest();
  if (!crypto.timingSafeEqual(expected, Buffer.from(signature, 'hex'))) {
    return res.status(400).json({ error: 'Invalid signature' });
  }

  let event;
  try {
    event = JSON.parse(req.body.toString('utf8'));
  } catch {
    return res.status(400).json({ error: 'Invalid JSON' });
  }
  const kind = event?.event ?? event?.type;
  if (!kind) return res.status(400).json({ error: 'Missing event type' });
  if (!['payment.captured', 'payment.failed', 'refund.processed'].includes(kind)) {
    return res.json({ received: true });
  }
  const refund = kind === 'refund.processed';
  const entity = refund ? event.payload?.refund?.entity : event.payload?.payment?.entity;
  const id = refund ? entity?.payment_id : entity?.id;
  if (typeof id !== 'string' || !id || id.includes('/') ||
      typeof entity?.id !== 'string' || !entity.id || entity.id.includes('/') ||
      !Number.isSafeInteger(entity.amount) || entity.amount < 0) {
    return res.status(400).json({ error: 'Invalid event entity' });
  }
  const amount = entity.amount / 100;
  const loanId = entity.notes?.loanId || '';
  const orgId = entity.notes?.orgId || '';
  const payment = db.collection('payments').doc(id);
  const receipt = db.collection('payment_webhook_receipts').doc(kind + '_' + entity.id);
  try {
    await db.runTransaction(async tx => {
      if ((await tx.get(receipt)).exists) return;
      const previous = (await tx.get(payment)).data();
      const now = new Date();
      if (kind === 'payment.captured' && previous?.capturedAt) {
        // Previously processed by a gateway version that did not write receipts.
        tx.create(receipt, { event: kind, entityId: entity.id, processedAt: now });
        return;
      }
      if (refund) {
        // A refund may arrive before capture. Preserve the cumulative amount.
        const refundRef = db.collection('refunds').doc(entity.id);
        const existing = (await tx.get(refundRef)).data();
        const total = (previous?.refundedAmount || 0) + amount;
        tx.set(refundRef, { id: entity.id, razorpayPaymentId: id, amount, status: 'processed',
          processedAt: now, createdAt: existing?.createdAt || now }, { merge: true });
        tx.set(payment, { refundedAmount: total, razorpayRefundId: entity.id,
          status: previous?.amount && total >= previous.amount ? 'refunded' : 'partial_refunded' }, { merge: true });
      } else if (kind === 'payment.captured' || !['captured', 'refunded', 'partial_refunded'].includes(previous?.status)) {
        const captured = kind === 'payment.captured';
        if (captured && loanId && orgId) {
          const result = await tx.get(db.collection('repayment_schedules').where('orgId', '==', orgId).where('loanId', '==', loanId).limit(1));
          const schedule = result.docs[0];
          if (schedule) {
            const rows = [...schedule.get('schedules')];
            const index = rows.findIndex(row => row.status !== 'Paid');
            if (index >= 0) {
              rows[index] = { ...rows[index], status: 'Paid', paymentId: id, paidDate: now, paidAmount: amount,
                paidVia: (entity.method || 'ONLINE').toUpperCase() };
              const totalPaid = rows.reduce((sum, row) => sum + (row.status === 'Paid' ? row.paidAmount || 0 : 0), 0);
              tx.update(schedule.ref, { schedules: rows, totalPaid,
                totalOutstanding: schedule.get('totalScheduledAmount') - totalPaid, updatedAt: now });
            }
          }
        }
        const refunded = previous?.refundedAmount || 0;
        const status = captured ? (refunded > 0 ? (refunded >= amount ? 'refunded' : 'partial_refunded') : 'captured') : 'failed';
        tx.set(payment, { id, loanId, orgId, amount, status, currency: entity.currency || 'INR',
          razorpayOrderId: entity.order_id || null, razorpayPaymentId: id, method: entity.method || null,
          createdAt: previous?.createdAt || now,
          ...(captured ? { capturedAt: now } : { failureReason: entity.error_description || 'Payment failed' }) }, { merge: true });
        if (orgId) tx.set(db.collection('audit_logs').doc(), { orgId, targetId: id, timestamp: now,
          action: captured ? 'PAYMENT_CAPTURED' : 'PAYMENT_FAILED', detail: kind + ' for loan ' + loanId });
      }
      tx.create(receipt, { event: kind, entityId: entity.id, processedAt: now });
    });
    return res.json({ received: true });
  } catch (error) {
    console.error('Payment webhook transaction failed', error);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
}
