import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import {
  createDisbursement,
  getDisbursement,
  listDisbursements,
  updateDisbursementStatus,
  updateTrancheStatus,
  bulkCreateDisbursements,
  generateProofOfDisbursement,
  sendDisbursementConfirmation,
  Disbursement,
  Tranche,
} from '../services/disbursement';
import { db } from '../config/firebase';

const router = Router();

// Get all disbursements for the organization
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const status = req.query.status as string | undefined;
    const loanId = req.query.loanId as string | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;

    const disbursements = await listDisbursements(req.orgId!, {
      status,
      loanId,
      limit,
    });

    res.status(200).json(disbursements);
  } catch (error) {
    console.error('Error listing disbursements:', error);
    res.status(500).json({ error: 'Failed to list disbursements' });
  }
});

// Get specific disbursement
router.get('/:disbursementId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const disbursement = await getDisbursement(req.orgId!, req.params.disbursementId);
    if (!disbursement) {
      return res.status(404).json({ error: 'Disbursement not found' });
    }

    res.status(200).json(disbursement);
  } catch (error) {
    console.error('Error getting disbursement:', error);
    res.status(500).json({ error: 'Failed to get disbursement' });
  }
});

// Create new disbursement (for approved application)
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      loanId,
      applicationId,
      tranches,
      bankAccount,
      borrowerUPI,
      borrowerName,
      borrowerPhone,
      borrowerEmail,
    } = req.body;

    // Validate required fields
    if (!loanId || !applicationId || !tranches || !Array.isArray(tranches) || tranches.length === 0) {
      return res.status(400).json({
        error: 'loanId, applicationId, and tranches (non-empty array) are required',
      });
    }

    // Validate tranches
    for (const tranche of tranches) {
      if (typeof tranche.amount !== 'number' || tranche.amount <= 0) {
        return res.status(400).json({ error: 'Each tranche must have a positive amount' });
      }
      if (!tranche.dueDate) {
        return res.status(400).json({ error: 'Each tranche must have a dueDate' });
      }
      if (!['NEFT', 'RTGS', 'UPI', 'Check', 'Cash'].includes(tranche.method)) {
        return res.status(400).json({ error: 'Invalid disbursement method' });
      }
    }

    // Add IDs to tranches
    const tranchesWithIds: Tranche[] = tranches.map((t: Tranche, index: number) => ({
      ...t,
      id: `tranche_${index}`,
      status: 'Pending' as const,
    }));

    const totalAmount = tranchesWithIds.reduce((sum: number, t: Tranche) => sum + Number(t.amount), 0);

    const disbursementId = await createDisbursement(req.orgId!, {
      orgId: req.orgId!,
      loanId,
      applicationId,
      status: 'Pending',
      tranches: tranchesWithIds,
      bankAccount,
      borrowerUPI,
      borrowerName,
      borrowerPhone,
      borrowerEmail,
      totalAmount,
      auditTrail: [
        {
          action: 'Disbursement created',
          timestamp: new Date(),
        },
      ],
    });

    res.status(201).json({
      id: disbursementId,
      message: 'Disbursement created successfully',
    });
  } catch (error) {
    console.error('Error creating disbursement:', error);
    res.status(500).json({ error: 'Failed to create disbursement' });
  }
});

// Initiate disbursement (mark as in-transit)
router.post('/:disbursementId/initiate', async (req: AuthenticatedRequest, res: Response) => {
  try {
    // ── RAZORPAY X SIMULATION ──
    // In production, this would use the official razorpay SDK:
    // const instance = new Razorpay({ key_id, key_secret });
    // const payout = await instance.payouts.create({
    //   account_number: "2323230076759752", amount: 1000000, currency: "INR", mode: "NEFT", ...
    // });
    
    const simulatedPayoutId = `pout_${Math.random().toString(36).substring(2, 10)}`;
    const payoutStatus = 'In Transit';
    
    await updateDisbursementStatus(
      req.orgId!,
      req.params.disbursementId,
      payoutStatus,
      `Disbursement initiated via RazorpayX (Payout ID: ${simulatedPayoutId})`,
      req.apiKeyId || req.uid || 'system'
    );

    res.status(200).json({ 
      success: true, 
      message: 'Disbursement initiated via RazorpayX Sandbox',
      payoutId: simulatedPayoutId 
    });
  } catch (error) {
    console.error('Error initiating disbursement:', error);
    res.status(500).json({ error: 'Failed to initiate disbursement' });
  }
});

// Mark disbursement as completed
router.post('/:disbursementId/mark-completed', async (req: AuthenticatedRequest, res: Response) => {
  try {
    await updateDisbursementStatus(
      req.orgId!,
      req.params.disbursementId,
      'Completed',
      'Disbursement completed',
      req.apiKeyId || req.uid || 'system'
    );

    res.status(200).json({ success: true, message: 'Disbursement marked as completed' });
  } catch (error) {
    console.error('Error marking disbursement as completed:', error);
    res.status(500).json({ error: 'Failed to mark disbursement as completed' });
  }
});

// Mark disbursement as failed
router.post('/:disbursementId/mark-failed', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { reason } = req.body;

    await updateDisbursementStatus(
      req.orgId!,
      req.params.disbursementId,
      'Failed',
      `Disbursement failed: ${reason || 'Unknown reason'}`,
      req.apiKeyId || req.uid || 'system'
    );

    res.status(200).json({ success: true, message: 'Disbursement marked as failed' });
  } catch (error) {
    console.error('Error marking disbursement as failed:', error);
    res.status(500).json({ error: 'Failed to mark disbursement as failed' });
  }
});

// Mark disbursement as recalled
router.post('/:disbursementId/recall', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { reason } = req.body;

    await updateDisbursementStatus(
      req.orgId!,
      req.params.disbursementId,
      'Recalled',
      `Disbursement recalled: ${reason || 'Unknown reason'}`,
      req.apiKeyId || req.uid || 'system'
    );

    res.status(200).json({ success: true, message: 'Disbursement recalled' });
  } catch (error) {
    console.error('Error recalling disbursement:', error);
    res.status(500).json({ error: 'Failed to recall disbursement' });
  }
});

// Update specific tranche status
router.patch('/:disbursementId/tranches/:trancheId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status } = req.body;

    if (!['Pending', 'In Transit', 'Completed', 'Failed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid tranche status' });
    }

    await updateTrancheStatus(
      req.orgId!,
      req.params.disbursementId,
      req.params.trancheId,
      status,
      req.apiKeyId || req.uid || 'system'
    );

    res.status(200).json({ success: true, message: 'Tranche status updated' });
  } catch (error) {
    console.error('Error updating tranche status:', error);
    res.status(500).json({ error: 'Failed to update tranche status' });
  }
});

// Bulk create disbursements
router.post('/bulk/create', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { disbursements } = req.body;

    if (!Array.isArray(disbursements) || disbursements.length === 0) {
      return res.status(400).json({ error: 'disbursements array is required and must not be empty' });
    }

    const ids = await bulkCreateDisbursements(req.orgId!, disbursements);

    res.status(201).json({
      ids,
      message: `${ids.length} disbursements created successfully`,
    });
  } catch (error) {
    console.error('Error bulk creating disbursements:', error);
    res.status(500).json({ error: 'Failed to bulk create disbursements' });
  }
});

// Bulk initiate disbursements
router.post('/bulk-initiate', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { disbursementIds } = req.body;

    if (!Array.isArray(disbursementIds) || disbursementIds.length === 0) {
      return res.status(400).json({ error: 'disbursementIds array is required' });
    }

    const batch = db.batch();
    const timestamp = new Date();
    
    for (const id of disbursementIds) {
      const docRef = db.collection('disbursements').doc(id);
      batch.update(docRef, { 
        status: 'In Transit',
        updatedAt: timestamp 
      });
      
      const auditRef = db.collection('audit_logs').doc();
      batch.set(auditRef, {
        orgId: req.orgId,
        action: 'DISBURSEMENT_STATUS_CHANGED',
        targetId: id,
        detail: 'Disbursement initiated via bulk operation',
        timestamp,
        agentId: req.uid || 'system'
      });
    }

    await batch.commit();

    res.status(200).json({
      success: true,
      message: `${disbursementIds.length} disbursements initiated successfully`,
    });
  } catch (error) {
    console.error('Error bulk initiating disbursements:', error);
    res.status(500).json({ error: 'Failed to bulk initiate disbursements' });
  }
});

// Generate proof of disbursement
router.post('/:disbursementId/proof', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { trancheId } = req.body;

    const proof = await generateProofOfDisbursement(
      req.orgId!,
      req.params.disbursementId,
      trancheId
    );

    res.status(200).json(proof);
  } catch (error) {
    console.error('Error generating proof of disbursement:', error);
    res.status(500).json({ error: 'Failed to generate proof of disbursement' });
  }
});

// Send disbursement confirmation
router.post('/:disbursementId/send-confirmation', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { channel } = req.body;

    const result = await sendDisbursementConfirmation(
      req.orgId!,
      req.params.disbursementId,
      channel || 'SMS'
    );

    res.status(200).json(result);
  } catch (error) {
    console.error('Error sending disbursement confirmation:', error);
    res.status(500).json({ error: 'Failed to send disbursement confirmation' });
  }
});

export default router;
