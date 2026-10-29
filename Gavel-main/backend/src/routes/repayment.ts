import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import {
  createRepaymentSchedule,
  recordRepayment,
  markEMIOverdue,
  getOverdueEMIs,
  calculateEMI,
  generateRepaymentSchedule,
} from '../services/repayment';

const router = Router();

// Calculate EMI
router.post('/calculate-emi', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { principal, annualRate, tenorMonths } = req.body;

    if (typeof principal !== 'number' || typeof annualRate !== 'number' || typeof tenorMonths !== 'number') {
      return res.status(400).json({ error: 'principal, annualRate, and tenorMonths are required' });
    }

    const emiAmount = calculateEMI(principal, annualRate, tenorMonths);

    res.status(200).json({
      principal,
      annualRate,
      tenorMonths,
      emiAmount,
      totalAmount: emiAmount * tenorMonths,
      totalInterest: (emiAmount * tenorMonths) - principal,
    });
  } catch (error) {
    console.error('Error calculating EMI:', error);
    res.status(500).json({ error: 'Failed to calculate EMI' });
  }
});

// Generate repayment schedule for a loan
router.post('/generate-schedule', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      loanId,
      borrowerId,
      borrowerName,
      principal,
      annualRate,
      tenorMonths,
      startDate,
    } = req.body;

    if (!loanId || !borrowerId || !borrowerName || typeof principal !== 'number' ||
        typeof annualRate !== 'number' || typeof tenorMonths !== 'number' || !startDate) {
      return res.status(400).json({
        error: 'loanId, borrowerId, borrowerName, principal, annualRate, tenorMonths, and startDate are required',
      });
    }

    const schedule = generateRepaymentSchedule(
      loanId,
      borrowerId,
      borrowerName,
      principal,
      annualRate,
      tenorMonths,
      new Date(startDate)
    );

    const scheduleId = await createRepaymentSchedule(req.orgId!, {
      ...schedule,
      orgId: req.orgId!,
    });

    res.status(201).json({
      id: scheduleId,
      schedule,
      message: 'Repayment schedule generated',
    });
  } catch (error) {
    console.error('Error generating schedule:', error);
    res.status(500).json({ error: 'Failed to generate schedule' });
  }
});

// Get repayment schedule for a loan
router.get('/loan/:loanId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Return mock data for demo
    const schedule = {
      id: `SCH-${req.params.loanId}`,
      loanId: req.params.loanId,
      schedules: [],
      totalRepaid: 0,
      outstandingAmount: 0,
      nextEmiDueDate: new Date().toISOString(),
    };
    res.status(200).json(schedule);
  } catch (error) {
    console.error('Error getting schedule:', error);
    res.status(500).json({ error: 'Failed to get schedule' });
  }
});

// Record payment for an EMI
router.post('/:scheduleId/record-payment', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { emiNo, amountPaid, paidVia, notes } = req.body;

    if (typeof emiNo !== 'number' || typeof amountPaid !== 'number' || !paidVia) {
      return res.status(400).json({ error: 'emiNo, amountPaid, and paidVia are required' });
    }

    await recordRepayment(req.orgId!, req.params.scheduleId, emiNo, amountPaid, paidVia, notes);

    res.status(200).json({ success: true, message: 'Payment recorded' });
  } catch (error) {
    console.error('Error recording payment:', error);
    res.status(500).json({ error: 'Failed to record payment' });
  }
});

// Mark EMI as overdue
router.post('/:scheduleId/mark-overdue', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { emiNo } = req.body;

    if (typeof emiNo !== 'number') {
      return res.status(400).json({ error: 'emiNo is required' });
    }

    await markEMIOverdue(req.orgId!, req.params.scheduleId, emiNo);

    res.status(200).json({ success: true, message: 'EMI marked as overdue' });
  } catch (error) {
    console.error('Error marking EMI overdue:', error);
    res.status(500).json({ error: 'Failed to mark EMI overdue' });
  }
});

// Get overdue EMIs
router.get('/overdue', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const loanId = req.query.loanId as string | undefined;
    const overdueEMIs = await getOverdueEMIs(req.orgId!, loanId);

    res.status(200).json(overdueEMIs);
  } catch (error) {
    console.error('Error getting overdue EMIs:', error);
    res.status(500).json({ error: 'Failed to get overdue EMIs' });
  }
});

export default router;
