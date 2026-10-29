import { Router, Response, Request } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { db } from '../config/firebase';

const router = Router();

router.get('/applications', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    let query: any = db.collection('applications').where('orgId', '==', req.orgId);
    
    if (status) {
      query = query.where('status', '==', status);
    }
    
    const skip = (Number(page) - 1) * Number(limit);
    query = query.orderBy('submittedAt', 'desc').limit(Number(limit)).offset(skip);
    
    const snapshot = await query.get();
    const applications = snapshot.docs.map((doc: FirebaseFirestore.DocumentSnapshot) => ({ id: doc.id, ...doc.data() }));
    
    res.status(200).json({ applications, page: Number(page), limit: Number(limit) });
  } catch (error) {
    console.error('Error listing applications:', error);
    res.status(500).json({ error: 'Failed to list applications' });
  }
});

router.get('/applications/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const doc = await db.collection('applications').doc(req.params.id).get();
    
    if (!doc.exists || doc.data()?.orgId !== req.orgId) {
      return res.status(404).json({ error: 'Application not found' });
    }
    
    res.status(200).json({ id: doc.id, ...doc.data() });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get application' });
  }
});

router.post('/applications', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { applicantName, phone, email, monthlyIncome, loanAmount, tenure, purpose } = req.body;
    
    if (!applicantName || !phone || !loanAmount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const docRef = await db.collection('applications').add({
      orgId: req.orgId,
      applicantName,
      phone,
      email: email || '',
      monthlyIncome: monthlyIncome || 0,
      loanAmount,
      tenure: tenure || 36,
      purpose: purpose || 'personal',
      status: 'pending',
      submittedAt: new Date(),
      riskFlags: [],
    });
    
    res.status(201).json({ id: docRef.id, message: 'Application created' });
  } catch (error) {
    console.error('Error creating application:', error);
    res.status(500).json({ error: 'Failed to create application' });
  }
});

router.patch('/applications/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const docRef = db.collection('applications').doc(req.params.id);
    const doc = await docRef.get();
    
    if (!doc.exists || doc.data()?.orgId !== req.orgId) {
      return res.status(404).json({ error: 'Application not found' });
    }
    
    await docRef.update({
      ...req.body,
      updatedAt: new Date()
    });
    
    res.status(200).json({ success: true, message: 'Application updated' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update application' });
  }
});

router.post('/applications/:id/kyc', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { aadhaar, pan } = req.body;
    const docRef = db.collection('applications').doc(req.params.id);
    const doc = await docRef.get();
    
    if (!doc.exists || doc.data()?.orgId !== req.orgId) {
      return res.status(404).json({ error: 'Application not found' });
    }
    
    await docRef.update({
      aadhaar: aadhaar || doc.data()?.aadhaar,
      pan: pan || doc.data()?.pan,
      status: 'kyc_verified',
      kycVerifiedAt: new Date()
    });
    
    res.status(200).json({ success: true, message: 'KYC data saved' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save KYC data' });
  }
});

router.post('/bulk-upload', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { applications } = req.body;
    
    if (!Array.isArray(applications)) {
      return res.status(400).json({ error: 'applications must be an array' });
    }
    
    const results = [];
    for (const app of applications) {
      const docRef = await db.collection('applications').add({
        orgId: req.orgId,
        ...app,
        status: 'pending',
        submittedAt: new Date(),
        bulkUploaded: true,
      });
      results.push({ id: docRef.id, name: app.applicantName });
    }
    
    res.status(201).json({ 
      success: true, 
      message: `Uploaded ${results.length} applications`,
      results 
    });
  } catch (error) {
    console.error('Bulk upload error:', error);
    res.status(500).json({ error: 'Failed to bulk upload' });
  }
});

export default router;