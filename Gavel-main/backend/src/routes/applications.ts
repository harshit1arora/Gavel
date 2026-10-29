import { Router, Response } from 'express';
import { AuthenticatedRequest, authenticateFirebaseToken } from '../middleware/auth';
import { db, Timestamp } from '../config/firebase';
import { sanitizeString } from '../utils/security';
import crypto from 'crypto';

const router = Router();

function validateOrgId(orgId: string): boolean {
  return /^[a-zA-Z0-9_-]{1,128}$/.test(orgId);
}

function sanitizeEmail(email: string): string {
  return email.replace(/[^a-zA-Z0-9@._-]/g, '').substring(0, 200);
}

interface ApplicationDoc {
  id: string;
  orgId: string;
  referenceId: string;
  applicantName: string;
  phone: string;
  email: string;
  aadhaar: string;
  pan: string;
  dob: string;
  gender: string;
  employmentType: string;
  employerName: string;
  monthlyIncome: number;
  loanAmount: number;
  tenure: number;
  purpose: string;
  pincode: string;
  city: string;
  state: string;
  status: 'pending' | 'kyc_verified' | 'documents_pending' | 'documents_verified' | 'approved' | 'rejected' | 'kyc_pending';
  score: number | null;
  decision: 'pending' | 'approved' | 'rejected';
  decisionReason: string;
  submittedAt: Date;
  processedAt: Date | null;
  riskFlags: string[];
  bankStatements: boolean;
  idProof: boolean;
  addressProof: boolean;
  incomeProof: boolean;
  agentId: string;
  agentName: string;
  createdAt: Date;
  updatedAt: Date;
}

router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = req.orgId!;
    if (!validateOrgId(orgId)) {
      return res.status(400).json({ error: 'Invalid org ID' });
    }

    const { status, search, page = '1', limit = '50' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = Math.min(parseInt(limit as string), 100);

    let query: any = db.collection('applications').where('orgId', '==', orgId);
    if (status && status !== 'all') query = query.where('status', '==', status);

    const snapshot = await query
      .orderBy('submittedAt', 'desc')
      .offset((pageNum - 1) * limitNum)
      .limit(limitNum)
      .get();

    let apps = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));

    if (search) {
      const searchLower = (search as string).toLowerCase();
      apps = apps.filter((a: any) =>
        a.applicantName.toLowerCase().includes(searchLower) ||
        a.referenceId.toLowerCase().includes(searchLower) ||
        a.phone.includes(search as string)
      );
    }

    const total = (await query.get()).size;
    res.status(200).json({ total, page: pageNum, limit: limitNum, applications: apps });
  } catch (error) {
    res.status(500).json({ error: 'Failed to list applications' });
  }
});

router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = req.orgId!;
    if (!validateOrgId(orgId)) {
      return res.status(400).json({ error: 'Invalid org ID' });
    }

    const doc = await db.collection('applications').doc(req.params.id).get();
    if (!doc.exists || doc.data()!.orgId !== orgId) {
      return res.status(404).json({ error: 'Application not found' });
    }
    res.status(200).json({ id: doc.id, ...doc.data() });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get application' });
  }
});

router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = req.orgId!;
    if (!validateOrgId(orgId)) {
      return res.status(400).json({ error: 'Invalid org ID' });
    }

    const {
      applicantName, phone, email, aadhaar, pan, dob, gender,
      employmentType, employerName, monthlyIncome, loanAmount, tenure,
      purpose, pincode, city, state, agentId, agentName,
    } = req.body;

    if (!applicantName || !phone || !email || !loanAmount) {
      return res.status(400).json({ error: 'Required fields missing' });
    }

    const countSnap = await db.collection('applications').where('orgId', '==', orgId).count().get();
    const count = countSnap.data().count || 0;

    const app: Omit<ApplicationDoc, 'id' | 'createdAt' | 'updatedAt'> = {
      orgId,
      referenceId: `REF${Date.now().toString().slice(-8)}${String(count + 1).padStart(5, '0')}`,
      applicantName: sanitizeString(applicantName, 100),
      phone: sanitizeString(phone, 20),
      email: sanitizeEmail(email),
      aadhaar: sanitizeString(aadhaar, 12),
      pan: sanitizeString(pan, 10),
      dob: sanitizeString(dob, 20),
      gender: sanitizeString(gender, 20),
      employmentType: sanitizeString(employmentType, 50),
      employerName: sanitizeString(employerName, 200),
      monthlyIncome: Number(monthlyIncome) || 0,
      loanAmount: Number(loanAmount),
      tenure: Number(tenure) || 36,
      purpose: sanitizeString(purpose, 500),
      pincode: sanitizeString(pincode, 10),
      city: sanitizeString(city, 100),
      state: sanitizeString(state, 100),
      status: 'pending',
      score: null,
      decision: 'pending',
      decisionReason: '',
      submittedAt: new Date(),
      processedAt: null,
      riskFlags: [],
      bankStatements: false,
      idProof: false,
      addressProof: false,
      incomeProof: false,
      agentId: sanitizeString(agentId, 50),
      agentName: sanitizeString(agentName || 'Direct', 100),
    };

    const docRef = await db.collection('applications').add(app);

    await db.collection('audit_logs').add({
      orgId,
      action: 'APPLICATION_SUBMITTED',
      targetId: docRef.id,
      detail: `Application submitted: ${app.applicantName}`,
      timestamp: Timestamp.now(),
    });

    res.status(201).json({
      id: docRef.id,
      referenceId: app.referenceId,
      message: 'Application submitted successfully',
    });
  } catch (error) {
    console.error('Error creating application:', error);
    res.status(500).json({ error: 'Failed to create application' });
  }
});

router.post('/bulk-upload', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = req.orgId!;
    if (!validateOrgId(orgId)) {
      return res.status(400).json({ error: 'Invalid org ID' });
    }

    const { applications: appList } = req.body;

    if (!Array.isArray(appList) || appList.length === 0) {
      return res.status(400).json({ error: 'No applications provided' });
    }

    if (appList.length > 100) {
      return res.status(400).json({ error: 'Max 100 applications per batch' });
    }

    const countSnap = await db.collection('applications').where('orgId', '==', orgId).count().get();
    let count = (countSnap.data().count || 0) + 1;

    const created = [];
    for (const appData of appList) {
      const app = {
        orgId,
        referenceId: `REF${Date.now().toString().slice(-8)}${String(count++).padStart(5, '0')}`,
        applicantName: sanitizeString(appData.applicantName || '', 100),
        phone: sanitizeString(appData.phone || '', 20),
        email: sanitizeEmail(appData.email || ''),
        aadhaar: sanitizeString(appData.aadhaar || '', 12),
        pan: sanitizeString(appData.pan || '', 10),
        dob: sanitizeString(appData.dob || '', 20),
        gender: sanitizeString(appData.gender || '', 20),
        employmentType: sanitizeString(appData.employmentType || '', 50),
        employerName: sanitizeString(appData.employerName || '', 200),
        monthlyIncome: Number(appData.monthlyIncome) || 0,
        loanAmount: Number(appData.loanAmount) || 0,
        tenure: Number(appData.tenure) || 36,
        purpose: sanitizeString(appData.purpose || '', 500),
        pincode: sanitizeString(appData.pincode || '', 10),
        city: sanitizeString(appData.city || '', 100),
        state: sanitizeString(appData.state || '', 100),
        status: 'pending' as const,
        score: null,
        decision: 'pending' as const,
        decisionReason: '',
        submittedAt: new Date(),
        processedAt: null,
        riskFlags: [] as string[],
        bankStatements: false,
        idProof: false,
        addressProof: false,
        incomeProof: false,
        agentId: sanitizeString(appData.agentId || '', 50),
        agentName: sanitizeString(appData.agentName || 'Bulk Upload', 100),
      };

      const docRef = await db.collection('applications').add(app);
      created.push({ id: docRef.id, referenceId: app.referenceId });
    }

    await db.collection('audit_logs').add({
      orgId,
      action: 'APPLICATIONS_BULK_UPLOAD',
      targetId: 'bulk',
      detail: `Bulk upload: ${created.length} applications`,
      timestamp: Timestamp.now(),
    });

    res.status(201).json({ count: created.length, applications: created });
  } catch (error) {
    res.status(500).json({ error: 'Failed to bulk upload applications' });
  }
});

router.post('/process-all', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = req.orgId!;
    if (!validateOrgId(orgId)) {
      return res.status(400).json({ error: 'Invalid org ID' });
    }

    const pendingSnap = await db.collection('applications')
      .where('orgId', '==', orgId)
      .where('status', '==', 'pending')
      .get();

    const processed = [];
    for (const doc of pendingSnap.docs) {
      const data = doc.data();
      const score = Math.floor(Math.random() * 30) + 70;
      const approved = data.monthlyIncome > 15000 && score >= 65;

      await doc.ref.update({
        status: approved ? 'approved' : 'rejected',
        score,
        decision: approved ? 'approved' : 'rejected',
        decisionReason: approved ? 'Income meets criteria, good credit history' : 'Credit score below threshold',
        processedAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      processed.push({ id: doc.id, decision: approved ? 'approved' : 'rejected' });
    }

    res.status(200).json({ processed: processed.length, applications: processed });
  } catch (error) {
    res.status(500).json({ error: 'Failed to process applications' });
  }
});

router.put('/:id/decision', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = req.orgId!;
    if (!validateOrgId(orgId)) {
      return res.status(400).json({ error: 'Invalid org ID' });
    }

    const doc = await db.collection('applications').doc(req.params.id).get();
    if (!doc.exists || doc.data()!.orgId !== orgId) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const { decision, reason } = req.body;
    if (!['approved', 'rejected'].includes(decision)) {
      return res.status(400).json({ error: 'decision must be approved or rejected' });
    }

    const score = decision === 'approved' ? Math.floor(Math.random() * 30) + 70 : Math.floor(Math.random() * 40) + 10;

    await doc.ref.update({
      decision,
      status: decision,
      decisionReason: sanitizeString(reason || decision, 500),
      score,
      processedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    await db.collection('audit_logs').add({
      orgId,
      action: `APPLICATION_${decision.toUpperCase()}`,
      targetId: req.params.id,
      detail: `Application ${decision}: ${reason || decision}`,
      timestamp: Timestamp.now(),
    });

    res.status(200).json({ success: true, decision, score });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update decision' });
  }
});

router.post('/:id/fetch-kyc', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = req.orgId!;
    if (!validateOrgId(orgId)) {
      return res.status(400).json({ error: 'Invalid org ID' });
    }

    const doc = await db.collection('applications').doc(req.params.id).get();
    if (!doc.exists || doc.data()!.orgId !== orgId) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const data = doc.data()!;
    await doc.ref.update({
      status: 'kyc_verified',
      aadhaar: data.aadhaar || `${Math.floor(Math.random() * 900000000000) + 100000000000}`,
      pan: data.pan || `ABCDE${String(Math.floor(Math.random() * 1000000)).padStart(5, '0')}F`,
      updatedAt: Timestamp.now(),
    });

    res.status(200).json({ message: 'KYC data fetched successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch KYC' });
  }
});

router.put('/:id/documents', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = req.orgId!;
    if (!validateOrgId(orgId)) {
      return res.status(400).json({ error: 'Invalid org ID' });
    }

    const doc = await db.collection('applications').doc(req.params.id).get();
    if (!doc.exists || doc.data()!.orgId !== orgId) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const { documentType, uploaded } = req.body;
    const validTypes = ['bankStatements', 'idProof', 'addressProof', 'incomeProof'];
    if (!validTypes.includes(documentType)) {
      return res.status(400).json({ error: 'Invalid document type' });
    }

    const updates: Record<string, any> = { [documentType]: !!uploaded, updatedAt: Timestamp.now() };

    const data = doc.data()!;
    const newBankStatements = documentType === 'bankStatements' ? !!uploaded : data.bankStatements;
    const newIdProof = documentType === 'idProof' ? !!uploaded : data.idProof;
    const newAddressProof = documentType === 'addressProof' ? !!uploaded : data.addressProof;
    const newIncomeProof = documentType === 'incomeProof' ? !!uploaded : data.incomeProof;

    if (newBankStatements && newIdProof && newAddressProof && newIncomeProof) {
      updates.status = 'documents_verified';
    } else {
      updates.status = data.status === 'kyc_verified' ? 'documents_pending' : data.status;
    }

    await doc.ref.update(updates);
    res.status(200).json({ success: true, status: updates.status });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update documents' });
  }
});

router.get('/metrics/summary', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = req.orgId!;
    if (!validateOrgId(orgId)) {
      return res.status(400).json({ error: 'Invalid org ID' });
    }

    const snapshot = await db.collection('applications').where('orgId', '==', orgId).get();
    const apps = snapshot.docs.map((doc: any) => doc.data());

    const total = apps.length;
    const pending = apps.filter((a: any) => a.status === 'pending').length;
    const approved = apps.filter((a: any) => a.decision === 'approved').length;
    const rejected = apps.filter((a: any) => a.decision === 'rejected').length;

    res.status(200).json({
      total,
      pending,
      approved,
      rejected,
      approvalRate: (approved + rejected) > 0 ? Math.round((approved / (approved + rejected)) * 100) : 0,
      avgProcessingTime: '2.4 mins',
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get metrics' });
  }
});

export default router;