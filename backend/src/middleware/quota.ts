import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';
import { db } from '../config/firebase';

export const enforceQuota = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const orgId = req.orgId;
    if (!orgId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const usageRef = db.collection('usage_stats').doc(orgId);
    
    await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(usageRef);
      
      let data = doc.data();
      if (!doc.exists || !data) {
        data = {
          tier: 'startup',
          apiCalls: 0,
          limit: 100,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        transaction.set(usageRef, data);
      }

      if (data.tier === 'startup' && data.apiCalls >= (data.limit || 100)) {
        throw new Error('QUOTA_EXCEEDED');
      }

      // Increment quota
      transaction.update(usageRef, {
        apiCalls: (data.apiCalls || 0) + 1,
        updatedAt: new Date(),
      });
    });

    next();
  } catch (err: any) {
    if (err.message === 'QUOTA_EXCEEDED') {
      return res.status(402).json({ 
        error: 'Payment Required', 
        message: 'You have exhausted your free 100 analysis calls. Please upgrade to the Enterprise tier.' 
      });
    }
    console.error('Quota enforcement error:', err);
    return res.status(500).json({ error: 'Failed to verify usage quota' });
  }
};
