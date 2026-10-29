import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { db } from '../config/firebase';
import crypto from 'crypto';
import fetch from 'node-fetch';

const router = Router();

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || '';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';
const SETU_BANKING_URL = process.env.SETU_BANKING_URL || '';
const SETU_BANKING_KEY = process.env.SETU_BANKING_KEY || '';
const RAZORPAY_BANKING_URL = 'https://api.razorpay.com/v1';

interface DisbursementRequest {
  loanId: string;
  bankAccountNumber: string;
  ifscCode: string;
  beneficiaryName: string;
  amount: number;
  paymentMode: 'upi' | 'bank_transfer' | 'rtgs' | 'neft';
  purpose?: string;
}

const isConfigured = () => RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET;

function validateIFSC(ifsc: string): boolean {
  return /^[A-Z]{4}0[A-Z0-9]{6}$/i.test(ifsc);
}

function validateAccountNumber(acc: string): boolean {
  return /^\d{9,18}$/.test(acc);
}

async function razorpayBankRequest(endpoint: string, method: string = 'POST', body?: object) {
  const auth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');
  const response = await fetch(`${RAZORPAY_BANKING_URL}${endpoint}`, {
    method,
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json() as any;
  if (!response.ok) throw new Error(data.error?.description || 'Razorpay Banking API error');
  return data;
}

async function saveDisbursement(record: any) {
  await db.collection('disbursements').doc(record.transactionId).set({
    ...record,
    createdAt: new Date(),
    updatedAt: new Date(),
  }, { merge: true });

  if (record.orgId) {
    await db.collection('audit_logs').add({
      orgId: record.orgId,
      action: 'DISBURSEMENT_' + record.status.toUpperCase(),
      targetId: record.transactionId,
      detail: `Disbursement ${record.status}: Rs${record.amount} for loan ${record.loanId}${record.utrNumber ? `, UTR: ${record.utrNumber}` : ''}`,
      timestamp: new Date(),
    });
  }
}

router.post('/initiate', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { loanId, bankAccountNumber, ifscCode, beneficiaryName, amount, paymentMode, purpose } = req.body;

    if (!loanId || !bankAccountNumber || !ifscCode || !beneficiaryName || !amount) {
      return res.status(400).json({ error: 'All payment details required' });
    }

    if (!validateAccountNumber(bankAccountNumber)) {
      return res.status(400).json({ error: 'Invalid bank account number format' });
    }

    if (!validateIFSC(ifscCode)) {
      return res.status(400).json({ error: 'Invalid IFSC code format' });
    }

    if (amount <= 0 || amount > 50000000) {
      return res.status(400).json({ error: 'Invalid amount (max Rs5 Cr)' });
    }

    const transactionId = `txn_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

    const record = {
      transactionId,
      loanId,
      orgId: req.orgId!,
      bankAccountNumber,
      ifscCode: ifscCode.toUpperCase(),
      beneficiaryName,
      amount,
      paymentMode: paymentMode || 'bank_transfer',
      purpose: purpose || 'Loan Disbursement',
      status: 'pending' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await saveDisbursement(record);

    if (isConfigured()) {
      processDisbursement(transactionId, record).catch(err => {
        console.error(`[Disbursement] ${transactionId} failed:`, err.message);
      });
    }

    res.status(202).json({
      transactionId,
      status: 'pending',
      message: isConfigured() ? 'Disbursement initiated' : 'Disbursement queued (stub mode)',
      stub: !isConfigured(),
    });
  } catch (error: any) {
    console.error('Error initiating disbursement:', error.message);
    res.status(500).json({ error: error.message });
  }
});

async function processDisbursement(transactionId: string, payment: any) {
  try {
    await db.collection('disbursements').doc(transactionId).update({
      status: 'processing',
      updatedAt: new Date(),
    });

    const razorpayFundAccount = await razorpayBankRequest('/fund-accounts', 'POST', {
      account_type: 'bank_account',
      bank_account: {
        name: payment.beneficiaryName,
        ifsc: payment.ifscCode,
        account_number: payment.bankAccountNumber,
      },
      contact: {
        name: payment.beneficiaryName,
        type: 'customer',
      },
    });

    const razorpayPayout = await razorpayBankRequest('/payouts', 'POST', {
      account_number: process.env.RAZORPAY_ACCOUNT_NUMBER || '',
      amount: Math.round(payment.amount * 100),
      currency: 'INR',
      mode: payment.paymentMode?.toUpperCase() || 'NEFT',
      purpose: payment.purpose || 'Disbursement',
      fund_account_id: razorpayFundAccount.id,
      queue_if_low_balance: true,
      reference_id: payment.transactionId,
      notes: {
        loanId: payment.loanId,
        orgId: payment.orgId,
      },
    });

    await db.collection('disbursements').doc(transactionId).update({
      status: razorpayPayout.status === 'processed' ? 'success' : 'processing',
      razorpayFundAccountId: razorpayFundAccount.id,
      razorpayPayoutId: razorpayPayout.id,
      utrNumber: razorpayPayout.utr,
      bankReference: razorpayPayout.reference_id,
      processedAt: razorpayPayout.created_at ? new Date(razorpayPayout.created_at * 1000) : new Date(),
      updatedAt: new Date(),
    });

    if (payment.loanId) {
      await db.collection('loans').doc(payment.loanId).update({
        disbursementStatus: razorpayPayout.status,
        disbursementAmount: payment.amount,
        disbursementDate: new Date(),
        utrNumber: razorpayPayout.utr,
        updatedAt: new Date(),
      });
    }

    console.log(`[Disbursement] ${transactionId}: ${razorpayPayout.status}, UTR: ${razorpayPayout.utr}`);
  } catch (error: any) {
    console.error(`[Disbursement] ${transactionId} failed:`, error.message);

    await db.collection('disbursements').doc(transactionId).update({
      status: 'failed',
      failureReason: error.message,
      updatedAt: new Date(),
    });
  }
}

router.get('/status/:transactionId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const doc = await db.collection('disbursements').doc(req.params.transactionId).get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const data = doc.data()!;
    if (data.orgId !== req.orgId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    if (isConfigured() && data.status === 'processing' && data.razorpayPayoutId) {
      try {
        const payout = await razorpayBankRequest(`/payouts/${data.razorpayPayoutId}`);
        if (payout.status !== data.status) {
          await doc.ref.update({
            status: payout.status,
            utrNumber: payout.utr,
            failureReason: payout.failure_reason,
            updatedAt: new Date(),
          });
          data.status = payout.status;
          data.utrNumber = payout.utr;
          data.failureReason = payout.failure_reason;
        }
      } catch {
        // Ignore polling errors
      }
    }

    res.status(200).json({ id: doc.id, ...data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status, loanId, page = '1', limit = '50' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    let query: any = db.collection('disbursements').where('orgId', '==', req.orgId!);
    if (loanId) query = query.where('loanId', '==', loanId);
    if (status && status !== 'all') query = query.where('status', '==', status);

    const snapshot = await query
      .orderBy('createdAt', 'desc')
      .offset((pageNum - 1) * limitNum)
      .limit(limitNum)
      .get();

    const disbursements = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
    const total = (await query.get()).size;

    res.status(200).json({ total, page: pageNum, limit: limitNum, disbursements });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/bulk', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { disbursements: disburseList } = req.body;

    if (!Array.isArray(disburseList) || disburseList.length === 0) {
      return res.status(400).json({ error: 'disbursements array required' });
    }

    if (disburseList.length > 100) {
      return res.status(400).json({ error: 'Max 100 disbursements per batch' });
    }

    const results = [];
    for (const d of disburseList) {
      const transactionId = `txn_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

      const record = {
        transactionId,
        loanId: d.loanId,
        orgId: req.orgId!,
        bankAccountNumber: d.bankAccountNumber,
        ifscCode: d.ifscCode?.toUpperCase(),
        beneficiaryName: d.beneficiaryName,
        amount: d.amount,
        paymentMode: d.paymentMode || 'bank_transfer',
        purpose: d.purpose || 'Loan Disbursement',
        status: 'pending' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await saveDisbursement(record);
      results.push({ transactionId, loanId: d.loanId, status: 'pending' });

      if (isConfigured()) {
        processDisbursement(transactionId, record).catch(console.error);
      }
    }

    res.status(202).json({
      batchId: `batch_${Date.now()}`,
      total: results.length,
      initiated: results.length,
      results,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:transactionId/reverse', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const doc = await db.collection('disbursements').doc(req.params.transactionId).get();

    if (!doc.exists) return res.status(404).json({ error: 'Transaction not found' });

    const data = doc.data()!;
    if (data.orgId !== req.orgId) return res.status(403).json({ error: 'Unauthorized' });
    if (data.status !== 'success') return res.status(400).json({ error: 'Can only reverse successful transactions' });

    if (!isConfigured()) {
      await doc.ref.update({ status: 'reversed', failureReason: 'Reversal initiated (stub)', updatedAt: new Date() });
      return res.status(200).json({ status: 'reversed', reversedAt: new Date().toISOString(), stub: true });
    }

    const reversal = await razorpayBankRequest('/reversals', 'POST', {
      payout_id: data.razorpayPayoutId,
      amount: Math.round(data.amount * 100),
      reason: req.body.reason || 'Customer request',
    });

    await doc.ref.update({
      status: 'reversed',
      reversalId: reversal.id,
      reversedAt: new Date(),
      updatedAt: new Date(),
    });

    res.status(200).json({
      status: 'reversed',
      reversalId: reversal.id,
      reversedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/analytics/summary', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const snapshot = await db.collection('disbursements').where('orgId', '==', req.orgId!).get();
    const disbursements = snapshot.docs.map((doc: any) => doc.data());

    const total = disbursements.reduce((sum, d) => sum + (d.amount || 0), 0);
    const success = disbursements.filter(d => d.status === 'success');
    const failed = disbursements.filter(d => d.status === 'failed');
    const pending = disbursements.filter(d => d.status === 'pending' || d.status === 'processing');

    res.status(200).json({
      totalDisbursed: total,
      totalTransactions: disbursements.length,
      successCount: success.length,
      failedCount: failed.length,
      pendingCount: pending.length,
      successRate: disbursements.length > 0 ? Math.round((success.length / disbursements.length) * 100) : 0,
      configured: isConfigured(),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;