import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import {
  createSalesDeal,
  getSalesPipeline,
  getSalesDeal,
  updateSalesDeal,
  deleteSalesDeal,
  moveStage,
  SalesDeal,
} from '../services/sales';

const router = Router();

/**
 * @api {get} /v1/sales/pipeline Get Sales Pipeline
 * Returns all deals grouped by stage (prospecting, negotiating, signed) with metrics
 */
router.get('/pipeline', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const pipeline = await getSalesPipeline(req.orgId!);
    res.status(200).json(pipeline);
  } catch (error) {
    console.error('Error fetching sales pipeline:', error);
    res.status(500).json({ error: 'Failed to fetch sales pipeline' });
  }
});

/**
 * @api {get} /v1/sales/:dealId Get Single Deal
 */
router.get('/:dealId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const deal = await getSalesDeal(req.orgId!, req.params.dealId);
    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' });
    }
    res.status(200).json(deal);
  } catch (error) {
    console.error('Error fetching deal:', error);
    res.status(500).json({ error: 'Failed to fetch deal' });
  }
});

/**
 * @api {post} /v1/sales Create New Deal
 */
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      prospectName,
      prospectCompany,
      prospectEmail,
      prospectPhone,
      stage,
      valueEstimate,
      winProbability,
      expectedCloseDate,
      notes,
      assignedTo,
    } = req.body;

    if (!prospectName || !prospectCompany || !valueEstimate) {
      return res.status(400).json({
        error: 'prospectName, prospectCompany, and valueEstimate are required',
      });
    }

    const dealId = await createSalesDeal(req.orgId!, {
      prospectName,
      prospectCompany,
      prospectEmail,
      prospectPhone,
      stage: stage || 'prospecting',
      valueEstimate: parseInt(valueEstimate),
      winProbability: winProbability || 10,
      expectedCloseDate: expectedCloseDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      notes: notes || '',
      assignedTo: assignedTo || req.userId,
    });

    res.status(201).json({ id: dealId, message: 'Deal created successfully' });
  } catch (error) {
    console.error('Error creating deal:', error);
    res.status(500).json({ error: 'Failed to create deal' });
  }
});

/**
 * @api {put} /v1/sales/:dealId Update Deal
 */
router.put('/:dealId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { stage, winProbability, valueEstimate, expectedCloseDate, notes, status } = req.body;

    const updates: Partial<SalesDeal> = {};
    if (stage) updates.stage = stage;
    if (winProbability) updates.winProbability = winProbability;
    if (valueEstimate) updates.valueEstimate = parseInt(valueEstimate);
    if (expectedCloseDate) updates.expectedCloseDate = expectedCloseDate;
    if (notes) updates.notes = notes;

    await updateSalesDeal(req.orgId!, req.params.dealId, updates);
    res.status(200).json({ message: 'Deal updated successfully' });
  } catch (error) {
    console.error('Error updating deal:', error);
    res.status(500).json({ error: 'Failed to update deal' });
  }
});

/**
 * @api {put} /v1/sales/:dealId/stage Move Deal to New Stage
 */
router.put('/:dealId/stage', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { stage } = req.body;
    if (!['prospecting', 'negotiating', 'signed'].includes(stage)) {
      return res.status(400).json({ error: 'Invalid stage' });
    }

    await moveStage(req.orgId!, req.params.dealId, stage);
    res.status(200).json({ message: `Deal moved to ${stage}` });
  } catch (error) {
    console.error('Error moving deal stage:', error);
    res.status(500).json({ error: 'Failed to move deal' });
  }
});

/**
 * @api {delete} /v1/sales/:dealId Delete Deal
 */
router.delete('/:dealId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    await deleteSalesDeal(req.orgId!, req.params.dealId);
    res.status(200).json({ message: 'Deal deleted successfully' });
  } catch (error) {
    console.error('Error deleting deal:', error);
    res.status(500).json({ error: 'Failed to delete deal' });
  }
});

export default router;
