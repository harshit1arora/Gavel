import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { getUsageROI } from '../services/roi';

const router = Router();

/**
 * @api {get} /v1/roi/usage Get ROI Metrics
 * Returns this month, last month, and all-time ROI metrics
 */
router.get('/usage', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const costPerDecision = parseFloat(req.query.costPerDecision as string) || 7.50;
    const roi = await getUsageROI(req.orgId!, costPerDecision);
    res.status(200).json(roi);
  } catch (error) {
    console.error('Error fetching ROI metrics:', error);
    res.status(500).json({ error: 'Failed to fetch ROI metrics' });
  }
});

export default router;
