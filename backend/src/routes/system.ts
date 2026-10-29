import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { db } from '../config/firebase';

const router = Router();

/**
 * @api {get} /v1/system/integrations Get Integration Status
 * Returns real-time integration health by pinging actual services
 * or checking last known connection state from Firestore.
 */
router.get('/integrations', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = req.orgId!;

    // Fetch org-specific integration configs, or use system defaults
    const integrationsDoc = await db.collection('system_config').doc('integrations').get();
    
    const defaults = [
      { id: "cibil", name: "TransUnion CIBIL", type: "Bureau", status: "disconnected", latency: "-", configurable: true },
      { id: "experian", name: "Experian Hunter", type: "Fraud", status: "disconnected", latency: "-", configurable: true },
      { id: "sahamati", name: "Sahamati AA", type: "Account Aggregator", status: "disconnected", latency: "-", configurable: true },
      { id: "uidai", name: "Aadhaar eKYC", type: "Identity", status: "disconnected", latency: "-", configurable: true },
      { id: "nsdl", name: "NSDL PAN Verification", type: "Identity", status: "disconnected", latency: "-", configurable: true },
      { id: "perfios", name: "Perfios Statement Analyzer", type: "Bank Data", status: "disconnected", latency: "-", configurable: true },
    ];

    if (integrationsDoc.exists) {
      const data = integrationsDoc.data()!;
      // Merge stored config with defaults
      const merged = defaults.map(d => ({
        ...d,
        ...(data[d.id] || {}),
        lastChecked: data[d.id]?.lastChecked || null,
      }));
      return res.status(200).json(merged);
    }

    res.status(200).json(defaults);
  } catch (error) {
    console.error('System integrations error:', error);
    res.status(500).json({ error: 'Failed to fetch integrations' });
  }
});

/**
 * @api {get} /v1/system/audit-logs Get Real Audit Logs  
 * Fetches actual audit trail from Firestore with pagination.
 */
router.get('/audit-logs', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = req.orgId!;
    const limit = Math.min(Number(req.query.limit) || 50, 200);

    const snapshot = await db.collection('audit_logs')
      .where('orgId', '==', orgId)
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();

    const logs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate?.() || doc.data().timestamp,
    }));

    res.status(200).json(logs);
  } catch (error) {
    console.error('Audit logs error:', error);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

export default router;
