import express, { Request, Response } from 'express';
import admin from 'firebase-admin';
import EnhancedBureauService, { CreditMetrics } from '../services/enhanced-bureau-service';

const router = express.Router();
const db = admin.firestore();

/**
 * POST /bureau/fetch-report
 * Fetch credit report for user (with caching and retry logic)
 */
router.post('/fetch-report', async (req: Request, res: Response) => {
  try {
    const { userId, pan, borrowerId, orgId, forceRefresh } = req.body;

    if (!userId || !pan) {
      return res.status(400).json({ error: 'Missing required fields: userId, pan' });
    }

    // Validate PAN format (10 alphanumeric)
    if (!/^[A-Z0-9]{10}$/.test(pan)) {
      return res.status(400).json({ error: 'Invalid PAN format' });
    }

    // Fetch with caching
    const report = await EnhancedBureauService.fetchCreditReportWithCache(
      userId,
      pan,
      borrowerId || userId,
      orgId || 'default',
      forceRefresh || false
    );

    if (!report) {
      return res.status(404).json({
        error: 'Unable to fetch bureau report',
        message:
          'Credit bureau service is temporarily unavailable. Please try again later.',
      });
    }

    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error('Bureau fetch error:', error);
    res.status(500).json({
      error: 'Failed to fetch bureau report',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /bureau/calculate-metrics
 * Calculate credit metrics for ML model
 */
router.post('/calculate-metrics', async (req: Request, res: Response) => {
  try {
    const { userId, pan, borrowerId, orgId } = req.body;

    if (!userId || !pan) {
      return res.status(400).json({ error: 'Missing required fields: userId, pan' });
    }

    // Fetch report (with cache)
    const report = await EnhancedBureauService.fetchCreditReportWithCache(
      userId,
      pan,
      borrowerId || userId,
      orgId || 'default'
    );

    // Calculate metrics (returns defaults if no report)
    const metrics = EnhancedBureauService.calculateCreditMetrics(report);

    res.json({
      success: true,
      data: {
        metrics,
        cached: !!report,
        reportAvailable: !!report,
      },
    });
  } catch (error) {
    console.error('Metrics calculation error:', error);
    res.status(500).json({
      error: 'Failed to calculate metrics',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /bureau/metrics/:userId
 * Get cached metrics for user
 */
router.get('/metrics/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // Try to get cached report
    const cacheDoc = await db.collection('creditBureauCache').doc(userId).get();

    if (!cacheDoc.exists) {
      return res.json({
        success: true,
        data: {
          metrics: EnhancedBureauService.calculateCreditMetrics(null),
          cached: false,
        },
      });
    }

    const report = cacheDoc.data() as any;
    const metrics = EnhancedBureauService.calculateCreditMetrics(report);

    res.json({
      success: true,
      data: {
        metrics,
        cached: true,
        cachedAt: report?.fetchedAt,
      },
    });
  } catch (error) {
    console.error('Metrics fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

/**
 * POST /bureau/batch-fetch
 * Batch fetch reports for multiple users
 */
router.post('/batch-fetch', async (req: Request, res: Response) => {
  try {
    const { users } = req.body;

    if (!Array.isArray(users) || users.length === 0) {
      return res.status(400).json({ error: 'Invalid users array' });
    }

    if (users.length > 100) {
      return res.status(400).json({ error: 'Maximum 100 users per request' });
    }

    const results = await EnhancedBureauService.batchFetchReports(users);

    const data = Array.from(results.entries()).map(([userId, report]) => ({
      userId,
      report,
      metrics: EnhancedBureauService.calculateCreditMetrics(report),
    }));

    res.json({
      success: true,
      data,
      total: data.length,
      successful: data.filter(d => d.report).length,
      failed: data.filter(d => !d.report).length,
    });
  } catch (error) {
    console.error('Batch fetch error:', error);
    res.status(500).json({ error: 'Failed to batch fetch reports' });
  }
});

/**
 * POST /bureau/cache/clear
 * Admin endpoint to clear expired cache
 */
router.post('/cache/clear', async (req: Request, res: Response) => {
  try {
    // Verify admin (basic check)
    const token = (req.headers.authorization || '').split('Bearer ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const cleared = await EnhancedBureauService.clearExpiredCache();

    res.json({
      success: true,
      data: {
        cleared,
        message: `Cleared ${cleared} expired cache entries`,
      },
    });
  } catch (error) {
    console.error('Cache clear error:', error);
    res.status(500).json({ error: 'Failed to clear cache' });
  }
});

/**
 * GET /bureau/summary/:userId
 * Get bureau report summary
 */
router.get('/summary/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const cacheDoc = await db.collection('creditBureauCache').doc(userId).get();
    if (!cacheDoc.exists) {
      return res.status(404).json({ error: 'No bureau data found' });
    }

    const report = cacheDoc.data() as any;
    const metrics = EnhancedBureauService.calculateCreditMetrics(report);
    const summary = EnhancedBureauService.generateBureauSummary(metrics);

    res.json({
      success: true,
      data: {
        summary,
        metrics,
      },
    });
  } catch (error) {
    console.error('Summary error:', error);
    res.status(500).json({ error: 'Failed to generate summary' });
  }
});

export default router;
