import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { db } from '../config/firebase';

const router = Router();

router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = req.orgId!;
    const policiesQuery = await db.collection('policies').where('orgId', '==', orgId).limit(1).get();
    
    if (policiesQuery.empty) {
      return res.status(200).json({
        "auto-approve": [],
        "auto-reject": [{ field: "bureau_score", op: "<", value: "600", description: "Auto-reject low bureau scores" }],
        "manual-review": []
      });
    }

    res.status(200).json({ id: policiesQuery.docs[0].id, ...policiesQuery.docs[0].data() });
  } catch (error) {
    console.error('Fetch Policies API Error:', error);
    res.status(500).json({ error: 'Failed to fetch policies' });
  }
});

router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = req.orgId!;
    const payload = req.body;

    // Validate policy structure
    const validBuckets = ['auto-approve', 'auto-reject', 'manual-review'];
    for (const bucket of validBuckets) {
      if (payload[bucket] && !Array.isArray(payload[bucket])) {
        return res.status(400).json({ error: `${bucket} must be an array of rules` });
      }
      if (payload[bucket]) {
        for (const rule of payload[bucket]) {
          if (!rule.field || !rule.op || rule.value === undefined) {
            return res.status(400).json({ error: `Each rule must have field, op, and value` });
          }
        }
      }
    }
    
    const policiesQuery = await db.collection('policies').where('orgId', '==', orgId).limit(1).get();
    
    let docId;
    if (policiesQuery.empty) {
      const docRef = await db.collection('policies').add({ orgId, ...payload, updatedAt: new Date() });
      docId = docRef.id;
    } else {
      docId = policiesQuery.docs[0].id;
      await db.collection('policies').doc(docId).update({ ...payload, updatedAt: new Date() });
    }

    // Audit log
    await db.collection('audit_logs').add({
      orgId,
      action: 'POLICY_UPDATED',
      targetId: docId,
      detail: `Policy rules modified: ${JSON.stringify(Object.keys(payload))}`,
      actor: req.apiKeyId || 'system',
      timestamp: new Date()
    });

    return res.status(200).json({ id: docId, ...payload });
  } catch (error) {
    console.error('Update Policies API Error:', error);
    res.status(500).json({ error: 'Failed to update policies' });
  }
});

export default router;
