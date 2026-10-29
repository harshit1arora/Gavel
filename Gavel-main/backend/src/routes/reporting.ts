import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import {
  generateDailyReport,
  generateWeeklyReport,
  generateMonthlyReport,
  saveReport,
  listReports,
  exportReportAsCSV,
} from '../services/reporting';

const router = Router();

// Generate daily report
router.post('/generate-daily', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const date = req.body.date ? new Date(req.body.date) : new Date();

    const report = await generateDailyReport(req.orgId!, date);

    // Save report
    const reportId = await saveReport(req.orgId!, {
      date: report.date,
      orgId: report.orgId,
      portfolioSummary: report.portfolioSummary,
      segmentBreakdown: report.segmentBreakdown,
      npaAnalysis: report.npaAnalysis,
      approvalMetrics: report.approvalMetrics,
      disburseMetrics: report.disburseMetrics,
      collectionMetrics: report.collectionMetrics,
      complianceNotes: report.complianceNotes,
    });

    res.status(201).json({
      id: reportId,
      report,
      message: 'Daily report generated',
    });
  } catch (error) {
    console.error('Error generating daily report:', error);
    res.status(500).json({ error: 'Failed to generate daily report' });
  }
});

// Generate weekly report
router.post('/generate-weekly', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const report = await generateWeeklyReport(req.orgId!);

    const reportId = await saveReport(req.orgId!, {
      date: report.date,
      orgId: report.orgId,
      portfolioSummary: report.portfolioSummary,
      segmentBreakdown: report.segmentBreakdown,
      npaAnalysis: report.npaAnalysis,
      approvalMetrics: report.approvalMetrics,
      disburseMetrics: report.disburseMetrics,
      collectionMetrics: report.collectionMetrics,
      complianceNotes: report.complianceNotes,
    });

    res.status(201).json({
      id: reportId,
      report,
      message: 'Weekly report generated',
    });
  } catch (error) {
    console.error('Error generating weekly report:', error);
    res.status(500).json({ error: 'Failed to generate weekly report' });
  }
});

// Generate monthly report
router.post('/generate-monthly', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const report = await generateMonthlyReport(req.orgId!);

    const reportId = await saveReport(req.orgId!, {
      date: report.date,
      orgId: report.orgId,
      portfolioSummary: report.portfolioSummary,
      segmentBreakdown: report.segmentBreakdown,
      npaAnalysis: report.npaAnalysis,
      approvalMetrics: report.approvalMetrics,
      disburseMetrics: report.disburseMetrics,
      collectionMetrics: report.collectionMetrics,
      complianceNotes: report.complianceNotes,
    });

    res.status(201).json({
      id: reportId,
      report,
      message: 'Monthly report generated',
    });
  } catch (error) {
    console.error('Error generating monthly report:', error);
    res.status(500).json({ error: 'Failed to generate monthly report' });
  }
});

// Get reports
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined;
    const dateTo = req.query.dateTo ? new Date(req.query.dateTo as string) : undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;

    const reports = await listReports(req.orgId!, {
      dateFrom,
      dateTo,
      limit,
    });

    res.status(200).json(reports);
  } catch (error) {
    console.error('Error listing reports:', error);
    res.status(500).json({ error: 'Failed to list reports' });
  }
});

// Export report as CSV
router.get('/:reportId/export-csv', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const reports = await listReports(req.orgId!, { limit: 1 });
    if (reports.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const csv = exportReportAsCSV(reports[0]);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="report-${new Date().toISOString()}.csv"`);
    res.send(csv);
  } catch (error) {
    console.error('Error exporting report:', error);
    res.status(500).json({ error: 'Failed to export report' });
  }
});

export default router;
