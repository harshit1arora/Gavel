import { Router, Response } from 'express';
import { AuthenticatedRequest, authenticateFirebaseToken } from '../middleware/auth';
import { db, Timestamp } from '../config/firebase';
import { sanitizeString } from '../utils/security';
import crypto from 'crypto';

const router = Router();

function validateOrgId(orgId: string): boolean {
  return /^[a-zA-Z0-9_-]{1,128}$/.test(orgId);
}

function generateMonthlyPerformance() {
  return [
    { month: 'Nov', loans: Math.floor(Math.random() * 10) + 3, approved: Math.floor(Math.random() * 7) + 2, commission: Math.floor(Math.random() * 15000) + 5000 },
    { month: 'Dec', loans: Math.floor(Math.random() * 10) + 3, approved: Math.floor(Math.random() * 7) + 2, commission: Math.floor(Math.random() * 15000) + 5000 },
    { month: 'Jan', loans: Math.floor(Math.random() * 10) + 3, approved: Math.floor(Math.random() * 7) + 2, commission: Math.floor(Math.random() * 15000) + 5000 },
    { month: 'Feb', loans: Math.floor(Math.random() * 10) + 3, approved: Math.floor(Math.random() * 7) + 2, commission: Math.floor(Math.random() * 15000) + 5000 },
    { month: 'Mar', loans: Math.floor(Math.random() * 10) + 3, approved: Math.floor(Math.random() * 7) + 2, commission: Math.floor(Math.random() * 15000) + 5000 },
  ];
}

interface AgentDoc {
  id: string;
  orgId: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  joinedDate: string;
  status: 'active' | 'inactive';
  totalLoans: number;
  approvedLoans: number;
  rejectedLoans: number;
  disbursedAmount: number;
  totalCommission: number;
  pendingPayout: number;
  disbursedPayout: number;
  approvalRate: number;
  avgTicketSize: number;
  rank: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  kycStatus: 'verified' | 'pending';
  documents: { aadhaar: boolean; pan: boolean; bankAccount: boolean; photo: boolean };
  monthlyPerformance: any[];
  createdAt: Date;
  updatedAt: Date;
}

router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = req.orgId!;
    if (!validateOrgId(orgId)) {
      return res.status(400).json({ error: 'Invalid org ID' });
    }

    const { status, search } = req.query;

    let query: any = db.collection('agents').where('orgId', '==', orgId);
    if (status && status !== 'all') query = query.where('status', '==', status);

    const snapshot = await query.orderBy('rank', 'asc').get();
    let agents = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));

    if (search) {
      const searchLower = (search as string).toLowerCase();
      agents = agents.filter((a: any) =>
        a.name.toLowerCase().includes(searchLower) ||
        a.phone.includes(search as string) ||
        a.location.toLowerCase().includes(searchLower)
      );
    }

    res.status(200).json(agents);
  } catch (error) {
    console.error('Error listing agents:', error);
    res.status(500).json({ error: 'Failed to list agents' });
  }
});

router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = req.orgId!;
    if (!validateOrgId(orgId)) {
      return res.status(400).json({ error: 'Invalid org ID' });
    }

    const doc = await db.collection('agents').doc(req.params.id).get();
    if (!doc.exists || doc.data()!.orgId !== orgId) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    res.status(200).json({ id: doc.id, ...doc.data() });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get agent' });
  }
});

router.post('/', authenticateFirebaseToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = req.orgId!;
    if (!validateOrgId(orgId)) {
      return res.status(400).json({ error: 'Invalid org ID' });
    }

    const { name, email, phone, location } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ error: 'Name and phone are required' });
    }

    const countSnap = await db.collection('agents').where('orgId', '==', orgId).count().get();
    const count = countSnap.data().count || 0;

    const agent: Omit<AgentDoc, 'id' | 'createdAt' | 'updatedAt'> = {
      orgId,
      name: sanitizeString(name, 100),
      email: sanitizeString(email, 200) || '',
      phone: sanitizeString(phone, 20),
      location: sanitizeString(location, 100) || '',
      joinedDate: new Date().toISOString().split('T')[0],
      status: 'active',
      totalLoans: 0,
      approvedLoans: 0,
      rejectedLoans: 0,
      disbursedAmount: 0,
      totalCommission: 0,
      pendingPayout: 0,
      disbursedPayout: 0,
      approvalRate: 0,
      avgTicketSize: 0,
      rank: count + 1,
      tier: 'bronze',
      kycStatus: 'pending',
      documents: { aadhaar: false, pan: false, bankAccount: false, photo: false },
      monthlyPerformance: generateMonthlyPerformance(),
    };

    const docRef = await db.collection('agents').add(agent);

    await db.collection('audit_logs').add({
      orgId,
      action: 'AGENT_CREATED',
      targetId: docRef.id,
      detail: `Agent created: ${name}`,
      timestamp: Timestamp.now(),
    });

    res.status(201).json({ id: docRef.id, ...agent });
  } catch (error) {
    console.error('Error creating agent:', error);
    res.status(500).json({ error: 'Failed to create agent' });
  }
});

router.put('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = req.orgId!;
    if (!validateOrgId(orgId)) {
      return res.status(400).json({ error: 'Invalid org ID' });
    }

    const doc = await db.collection('agents').doc(req.params.id).get();
    if (!doc.exists || doc.data()!.orgId !== orgId) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    const allowedFields = ['name', 'email', 'phone', 'location', 'status', 'tier'];
    const updates: Record<string, any> = { updatedAt: Timestamp.now() };

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = sanitizeString(req.body[field], 200);
      }
    }

    await doc.ref.update(updates);
    res.status(200).json({ id: doc.id, ...doc.data(), ...updates });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update agent' });
  }
});

router.put('/:id/documents', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = req.orgId!;
    if (!validateOrgId(orgId)) {
      return res.status(400).json({ error: 'Invalid org ID' });
    }

    const doc = await db.collection('agents').doc(req.params.id).get();
    if (!doc.exists || doc.data()!.orgId !== orgId) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    const { documentType, uploaded } = req.body;
    const validTypes = ['aadhaar', 'pan', 'bankAccount', 'photo'];
    if (!validTypes.includes(documentType)) {
      return res.status(400).json({ error: 'Invalid document type' });
    }

    const current = doc.data()!.documents || {};
    current[documentType] = !!uploaded;

    const allVerified = Object.values(current).every(v => v);
    if (allVerified) {
      current.kycStatus = 'verified';
    }

    await doc.ref.update({ documents: current, kycStatus: allVerified ? 'verified' : 'pending', updatedAt: Timestamp.now() });
    res.status(200).json({ id: doc.id, ...doc.data() });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update documents' });
  }
});

router.post('/:id/process-payout', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = req.orgId!;
    if (!validateOrgId(orgId)) {
      return res.status(400).json({ error: 'Invalid org ID' });
    }

    const doc = await db.collection('agents').doc(req.params.id).get();
    if (!doc.exists || doc.data()!.orgId !== orgId) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    const data = doc.data()!;
    const payoutAmount = data.pendingPayout;

    await doc.ref.update({
      disbursedPayout: (data.disbursedPayout || 0) + payoutAmount,
      pendingPayout: 0,
      updatedAt: Timestamp.now(),
    });

    await db.collection('audit_logs').add({
      orgId,
      action: 'AGENT_PAYOUT_PROCESSED',
      targetId: req.params.id,
      detail: `Payout of ₹${payoutAmount} processed for agent ${data.name}`,
      timestamp: Timestamp.now(),
    });

    res.status(200).json({ success: true, amount: payoutAmount });
  } catch (error) {
    res.status(500).json({ error: 'Failed to process payout' });
  }
});

router.get('/metrics/leaderboard', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = req.orgId!;
    if (!validateOrgId(orgId)) {
      return res.status(400).json({ error: 'Invalid org ID' });
    }

    const snapshot = await db.collection('agents')
      .where('orgId', '==', orgId)
      .orderBy('totalCommission', 'desc')
      .limit(5)
      .get();

    const leaderboard = snapshot.docs.map((doc: any, idx: number) => ({
      rank: idx + 1,
      id: doc.id,
      name: doc.data().name,
      totalLoans: doc.data().totalLoans,
      totalCommission: doc.data().totalCommission,
      tier: doc.data().tier,
    }));

    res.status(200).json(leaderboard);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get leaderboard' });
  }
});

router.get('/metrics/summary', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = req.orgId!;
    if (!validateOrgId(orgId)) {
      return res.status(400).json({ error: 'Invalid org ID' });
    }

    const snapshot = await db.collection('agents').where('orgId', '==', orgId).get();
    const agents = snapshot.docs.map((doc: any) => doc.data());

    const activeAgents = agents.filter((a: any) => a.status === 'active');
    const totalLoans = agents.reduce((sum: number, a: any) => sum + (a.totalLoans || 0), 0);
    const approvedLoans = agents.reduce((sum: number, a: any) => sum + (a.approvedLoans || 0), 0);
    const totalCommission = agents.reduce((sum: number, a: any) => sum + (a.totalCommission || 0), 0);
    const pendingPayout = agents.reduce((sum: number, a: any) => sum + (a.pendingPayout || 0), 0);
    const topPerformer = agents.sort((a: any, b: any) => (b.totalCommission || 0) - (a.totalCommission || 0))[0];

    res.status(200).json({
      totalAgents: agents.length,
      activeAgents: activeAgents.length,
      totalLoans,
      approvedLoans,
      approvalRate: totalLoans > 0 ? Math.round((approvedLoans / totalLoans) * 100) : 0,
      totalCommission,
      pendingPayout,
      topPerformer: topPerformer ? { id: snapshot.docs.find((d: any) => d.id === topPerformer)?.id, name: topPerformer.name, totalCommission: topPerformer.totalCommission } : null,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get metrics' });
  }
});

export default router;