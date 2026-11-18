import Razorpay from 'razorpay';
import type { Settlements } from 'razorpay/dist/types/settlements';
import { db } from '../config/firebase';

export interface Settlement {
  kind: 'payment' | 'refund'; entityId: string; paymentId: string; orgId: string; loanId: string;
  amount: number; currency: string; settlementId: string; postedAt: number;
}
type Data = FirebaseFirestore.DocumentData;
const validId = (v: unknown): v is string => typeof v === 'string' && /^[\w-]{1,128}$/.test(v);

function totalPaid(rows: Data[]) {
  return rows.reduce((sum,row) => sum + (row.status === 'Paid' ? Math.round((row.paidAmount || 0) * 100) : 0),0) / 100;
}

export function discrepancies(s: Settlement, payment?: Data, refund?: Data, schedules: Data[] = []) {
  const errors: string[] = [];
  if (!payment) errors.push('Missing payment');
  else if (payment.orgId && payment.orgId !== s.orgId) return ['Ownership conflict'];
  if (s.kind === 'refund') {
    if (!refund || refund.status !== 'processed' || refund.razorpayPaymentId !== s.paymentId ||
        Math.round(refund.amount * 100) !== s.amount) errors.push('Refund ledger mismatch');
    if (payment && (!['refunded','partial_refunded'].includes(payment.status) ||
        Math.round((payment.refundedAmount || 0) * 100) < s.amount)) errors.push('Payment refund total mismatch');
  } else {
    if (payment && (Math.round(payment.amount * 100) !== s.amount || payment.currency !== s.currency ||
        !['captured','partial_refunded','refunded'].includes(payment.status))) errors.push('Capture ledger mismatch');
    if (s.loanId) {
      const rows = schedules.flatMap(d => d.schedules || []).filter(r => r.paymentId === s.paymentId);
      if (rows.length !== 1 || rows[0].status !== 'Paid' || Math.round(rows[0].paidAmount * 100) !== s.amount)
        errors.push('Repayment allocation mismatch');
      if (schedules.length === 1) {
        const schedule = schedules[0], paid = totalPaid(schedule.schedules || []);
        if (Math.round(schedule.totalPaid * 100) !== Math.round(paid * 100) ||
            Math.round(schedule.totalOutstanding * 100) !== Math.round((schedule.totalScheduledAmount - paid) * 100))
          errors.push('Schedule totals mismatch');
      }
    }
  }
  return errors;
}

function provider() {
  const key_id = process.env.RAZORPAY_KEY_ID, key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) throw Error('Razorpay settlement credentials are missing');
  return new Razorpay({ key_id, key_secret });
}
export function queue(org: string) { return db.collection('organizations').doc(org).collection('settlement_review'); }

export async function importPage(org: string, date: string, skip: number, api: Pick<Razorpay, 'settlements' | 'payments'> = provider()) {
  const [year, month, day] = date.split('-').map(Number);
  const count = 50;
  const report = await api.settlements.reports({ year, month, day, skip, count });
  // The installed SDK declares an individual row, but the combined report is paginated.
  const items: Settlements.RazorpaySettlementRecon[] = Reflect.get(report, 'items');
  if (!Array.isArray(items)) throw Error('Invalid settlement report response');
  let reviewed = 0;
  for (const row of items) {
    if (!row.settled || !['payment','refund'].includes(row.type) || !validId(row.entity_id)) continue;
    const paymentId = row.type === 'payment' ? row.entity_id : row.payment_id;
    if (!validId(paymentId)) continue;
    const payment = await db.collection('payments').doc(paymentId).get();
    // Use trusted local ownership or provider-side payment notes. Never trust an operator-supplied tenant.
    const metadata = payment.get('orgId') ? payment.data()! : (await api.payments.fetch(paymentId)).notes || {};
    if (metadata.orgId !== org || (row.notes?.orgId && row.notes.orgId !== org)) continue;
    const amount = Number(row.amount);
    if (!Number.isSafeInteger(amount) || amount <= 0) throw Error('Invalid provider settlement amount');
    const s: Settlement = { kind: row.type as Settlement['kind'], entityId: row.entity_id, orgId: org,
      paymentId, loanId: String(metadata.loanId || ''), amount, currency: row.currency,
      settlementId: row.settlement_id, postedAt: row.settled_at };
    await reconcile(s, false);
    reviewed++;
  }
  return { reviewed, next: items.length === count ? skip + count : null };
}

export async function reconcile(s: Settlement, repair: boolean, actor = '', reason = '', emiNo?: number) {
  const issue = queue(s.orgId).doc(s.kind + '_' + s.entityId);
  return db.runTransaction(async tx => {
    const previous = (await tx.get(issue)).data();
    if (repair && (!previous || previous.status !== 'open')) return { errors: [], status: 'closed' };
    if (repair) {
      if (previous?.settlement.orgId !== s.orgId) throw Error('Ownership conflict');
      s = previous.settlement;
    }
    const paymentRef = db.collection('payments').doc(s.paymentId);
    const refundRef = db.collection('refunds').doc(s.entityId);
    const payment = (await tx.get(paymentRef)).data();
    const refund = s.kind === 'refund' ? (await tx.get(refundRef)).data() : undefined;
    const scheduleDocs = s.loanId && s.kind === 'payment' ? (await tx.get(db.collection('repayment_schedules')
      .where('orgId','==',s.orgId).where('loanId','==',s.loanId))).docs : [];
    const schedules = scheduleDocs.map(d => d.data());
    const errors = discrepancies(s, payment, refund, schedules);
    const refundRows = s.kind === 'refund' ? (await tx.get(db.collection('refunds').where('razorpayPaymentId','==',s.paymentId))).docs : [];
    const refundTotal = refundRows.reduce((sum,d) => sum + (d.id !== s.entityId && d.get('status') === 'processed' ? Math.round(d.get('amount') * 100) : 0), s.amount);
    if (s.kind === 'refund' && payment && (Math.round((payment.refundedAmount || 0) * 100) !== refundTotal ||
        payment.status !== (refundTotal === Math.round(payment.amount * 100) ? 'refunded' : 'partial_refunded')) &&
        !errors.includes('Payment refund total mismatch')) errors.push('Payment refund total mismatch');
    if (!repair || !errors.length) {
      if (errors.length || previous) tx.set(issue, { settlement: s, errors, status: errors.length ? 'open' : 'closed', checkedAt: new Date() });
      return { errors, status: errors.length ? 'open' : 'closed' };
    }
    if (payment?.orgId && payment.orgId !== s.orgId) throw Error('Ownership conflict');
    if (s.currency !== 'INR' || (payment?.currency && payment.currency !== s.currency))
      throw Error('Currency conflict requires manual review');
    const money = s.amount / 100;
    const now = new Date();
    const audit = db.collection('audit_logs').doc();
    if (s.kind === 'payment') {
      if (s.loanId && errors.includes('Repayment allocation mismatch')) {
        if (scheduleDocs.length !== 1 || emiNo === undefined) throw Error('Choose an installment on a unique repayment schedule');
        const schedule = schedules[0], rows = [...schedule.schedules];
        const i = rows.findIndex(row => row.emiNo === emiNo);
        const target = rows[i];
        if (!target || rows.some((row,j) => j !== i && row.paymentId === s.paymentId) ||
            (target.paymentId && target.paymentId !== s.paymentId) || target.status === 'Waived' ||
            Math.round((target.status === 'Paid' ? target.paidAmount : target.emiAmount) * 100) !== s.amount)
          throw Error('Selected installment conflicts with the settlement');
        rows[i] = { ...target, paymentId: s.paymentId, paidAmount: money, status: 'Paid', paidDate: target.paidDate || now };
        const paid = totalPaid(rows);
        tx.update(scheduleDocs[0].ref, { schedules: rows, totalPaid: paid, totalOutstanding: schedule.totalScheduledAmount - paid, updatedAt: now });
      } else if (errors.includes('Schedule totals mismatch')) {
        const paid = totalPaid(schedules[0].schedules);
        tx.update(scheduleDocs[0].ref, { totalPaid: paid, totalOutstanding: schedules[0].totalScheduledAmount - paid, updatedAt: now });
      }
      const refunded = payment?.refundedAmount || 0;
      tx.set(paymentRef, { orgId: s.orgId, id: s.paymentId, razorpayPaymentId: s.paymentId, loanId: s.loanId,
        currency: s.currency, amount: money, capturedAt: payment?.capturedAt || now,
        createdAt: payment?.createdAt || now, status: refunded >= money ? 'refunded' : refunded > 0 ? 'partial_refunded' : 'captured' }, { merge: true });
    } else {
      if (!payment?.amount || (refund?.razorpayPaymentId && refund.razorpayPaymentId !== s.paymentId)) throw Error('Resolve the payment record first');
      const total = refundTotal;
      if (total > Math.round(payment.amount * 100)) throw Error('Refund total exceeds the captured payment');
      tx.set(refundRef, { id: s.entityId, razorpayPaymentId: s.paymentId, amount: money, status: 'processed', processedAt: now }, { merge: true });
      tx.update(paymentRef, { refundedAmount: total / 100, status: total === Math.round(payment.amount * 100) ? 'refunded' : 'partial_refunded' });
    }
    const event = s.kind === 'payment' ? 'payment.captured' : 'refund.processed';
    tx.set(db.collection('payment_webhook_receipts').doc(event + '_' + s.entityId),
      { event, entityId: s.entityId, processedAt: now }, { merge: true });
    tx.update(issue, { errors: [], status: 'closed', checkedAt: now, auditId: audit.id });
    tx.create(audit, { action: 'SETTLEMENT_REPAIRED', orgId: s.orgId, targetId: s.entityId,
      actor, reason, discrepancies: errors, settlementId: s.settlementId, emiNo: emiNo ?? null, timestamp: now });
    return { errors: [], status: 'closed' };
  });
}
