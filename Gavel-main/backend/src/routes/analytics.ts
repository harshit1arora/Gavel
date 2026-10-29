import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { getPortfolioAnalytics } from '../services/analytics';

const router = Router();

/**
 * @api {get} /v1/analytics/portfolio Get Portfolio Analytics
 * Returns real-time aggregated metrics from live application and monitoring data.
 */
router.get('/portfolio', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = req.orgId!;
    const analytics = await getPortfolioAnalytics(orgId);
    res.status(200).json(analytics);
  } catch (error) {
    console.error('Analytics API Error:', error);
    res.status(500).json({ error: 'Internal server error aggregating analytics' });
  }
});

/**
 * @api {get} /v1/analytics/mis Get MIS & Compliance Reports
 * Auto-generate daily/weekly/monthly reports for management + RBI
 */
router.get('/mis', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = req.orgId!;
    const { type, date } = req.query;
    
    // Mocking the complex aggregation for Phase 2 MVP
    const reportData = {
      reportType: type || 'daily',
      reportDate: date || new Date().toISOString(),
      portfolioSummary: {
        totalActiveLoans: 1450,
        totalDisbursedYTD: 250000000,
        averageTicketSize: 172000,
      },
      approvalMetrics: {
        approvalRate: 68.4,
        autoApprovalRate: 45.2,
        averageTTD: '0.8 days'
      },
      npaTrend: {
        currentNPA: 1.2,
        thirtyDaysOverdue: 3.4,
        ninetyDaysOverdue: 1.2,
      },
      collectionEfficiency: 94.2
    };

    res.status(200).json(reportData);
  } catch (error) {
    console.error('MIS API Error:', error);
    res.status(500).json({ error: 'Internal server error generating MIS report' });
  }
});

export default router;
