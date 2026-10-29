import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { getMonitoredBorrowers, ingestSignal } from '../services/sentinel';

const router = Router();

/**
 * @api {get} /v1/sentinel/borrowers Get Monitored Borrowers
 * Real-time monitoring list for an organization's portfolio.
 */
router.get('/borrowers', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = req.orgId!;
    if (!/^[a-zA-Z0-9_-]{1,128}$/.test(orgId)) {
      return res.status(400).json({ error: 'Invalid org ID' });
    }
    const borrowers = await getMonitoredBorrowers(orgId);
    res.status(200).json(borrowers);
  } catch (error) {
    console.error('Sentinel API Error:', error);
    res.status(500).json({ error: 'Internal server error fetching borrowers' });
  }
});

/**
 * @api {post} /v1/sentinel/ingest Ingest External Signal
 * Real-world integration point for GSTN, UPI, and AA webhooks.
 * Validates signal, recalculates credit health, and updates history.
 */
router.post('/ingest/:borrowerId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { borrowerId } = req.params;
    const { type, value } = req.body;

    if (!type || value === undefined) {
      return res.status(400).json({ error: 'Missing signal type or value' });
    }

    const result = await ingestSignal(borrowerId, {
      type,
      value,
      timestamp: new Date()
    });

    res.status(200).json(result);
  } catch (error) {
    console.error('Signal Ingestion Error:', error);
    res.status(500).json({ error: 'Failed to ingest signal' });
  }
});

export default router;
