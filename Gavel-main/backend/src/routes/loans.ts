import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { db } from '../config/firebase';
import { generateLoanAgreementPdf } from '../services/pdf-generator';

const router = Router();

export interface LoanRecord {
  id?: string;
  applicationId: string;
  orgId: string;
  borrowerName: string;
  borrowerPhone: string;
  borrowerEmail: string;
  loanAmount: number;
  tenor: number;
  rate: number;
  emiAmount: number;
  startDate?: Date | string;
  endDate?: Date | string;
  status: 'Pending' | 'Approved' | 'Active' | 'Closed' | 'Defaulted';
  agreementUrl?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

// Create loan record from approved application
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      applicationId,
      borrowerName,
      borrowerPhone,
      borrowerEmail,
      loanAmount,
      tenor,
      rate,
    } = req.body;

    if (!applicationId || !borrowerName || !borrowerPhone || !loanAmount || !tenor || !rate) {
      return res.status(400).json({
        error: 'applicationId, borrowerName, borrowerPhone, loanAmount, tenor, and rate are required',
      });
    }

    // Calculate EMI
    const monthlyRate = rate / 12 / 100;
    const emiAmount = Math.round(
      (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, tenor)) /
      (Math.pow(1 + monthlyRate, tenor) - 1)
    );

    // Calculate dates
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + tenor);

    const loanRecord: Omit<LoanRecord, 'id'> = {
      applicationId,
      orgId: req.orgId!,
      borrowerName,
      borrowerPhone,
      borrowerEmail,
      loanAmount,
      tenor,
      rate,
      emiAmount,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      status: 'Approved',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const docRef = await db.collection('loans').add(loanRecord);

    // Audit log
    await db.collection('audit_logs').add({
      orgId: req.orgId,
      action: 'LOAN_CREATED',
      targetId: docRef.id,
      detail: `Loan created for application ${applicationId}`,
      timestamp: new Date()
    });

    res.status(201).json({
      id: docRef.id,
      ...loanRecord,
      message: 'Loan record created successfully',
    });
  } catch (error) {
    console.error('Error creating loan:', error);
    res.status(500).json({ error: 'Failed to create loan' });
  }
});

// Get loan details
router.get('/:loanId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const doc = await db.collection('loans').doc(req.params.loanId).get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Loan not found' });
    }

    const data = doc.data()!;
    if (data.orgId !== req.orgId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    res.status(200).json({ id: doc.id, ...data });
  } catch (error) {
    console.error('Error getting loan:', error);
    res.status(500).json({ error: 'Failed to get loan' });
  }
});

// List loans for organization
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const status = req.query.status as string | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;

    let query: any = db.collection('loans').where('orgId', '==', req.orgId!);

    if (status) {
      query = query.where('status', '==', status);
    }

    query = query.orderBy('createdAt', 'desc').limit(limit);

    const snapshot = await query.get();
    const loans = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));

    res.status(200).json(loans);
  } catch (error) {
    console.error('Error listing loans:', error);
    res.status(500).json({ error: 'Failed to list loans' });
  }
});

// Generate loan agreement PDF
router.post('/:loanId/generate-agreement', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const doc = await db.collection('loans').doc(req.params.loanId).get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Loan not found' });
    }

    const loan = doc.data() as LoanRecord;
    if (loan.orgId !== req.orgId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Return agreement data (frontend will generate PDF)
    const agreementData = {
      borrowerName: loan.borrowerName,
      borrowerPhone: loan.borrowerPhone,
      borrowerEmail: loan.borrowerEmail,
      loanAmount: loan.loanAmount,
      tenor: loan.tenor,
      rate: loan.rate,
      emiAmount: loan.emiAmount,
      startDate: loan.startDate,
      endDate: loan.endDate,
      disbursalMethod: 'Bank Transfer',
      purpose: 'Personal Loan',
    };

    // Generate and get mock PDF URL
    const agreementUrl = await generateLoanAgreementPdf(req.orgId!, req.params.loanId, agreementData);

    // Audit log
    await db.collection('audit_logs').add({
      orgId: req.orgId,
      action: 'AGREEMENT_GENERATED',
      targetId: req.params.loanId,
      detail: `Agreement generated for loan ${req.params.loanId}`,
      timestamp: new Date()
    });

    res.status(200).json({
      ...agreementData,
      agreementUrl
    });
  } catch (error) {
    console.error('Error generating agreement:', error);
    res.status(500).json({ error: 'Failed to generate agreement' });
  }
});

export default router;
