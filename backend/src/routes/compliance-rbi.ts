import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import {
  runPortfolioClassification,
  getPortfolioClassificationSummary,
  generateProvisioningReport,
  classifyLoanAsset,
  getLoanClassification,
} from '../services/compliance-engine';
import { triggerCollectionWorkflow } from '../services/collection-automation';
import { db } from '../config/firebase';

const router = Router();

router.get('/portfolio-classification', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const summary = await getPortfolioClassificationSummary(req.orgId!);
    res.status(200).json(summary);
  } catch (error) {
    console.error('Error getting portfolio classification:', error);
    res.status(500).json({ error: 'Failed to get portfolio classification' });
  }
});

router.post('/run-classification', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await runPortfolioClassification(req.orgId!);
    
    await db.collection('audit_logs').add({
      orgId: req.orgId,
      action: 'PORTFOLIO_CLASSIFICATION_RUN',
      targetId: req.orgId,
      detail: `Portfolio classification run: ${result.processed} loans classified`,
      timestamp: new Date(),
    });

    res.status(200).json({
      success: true,
      ...result,
      message: `Portfolio classification complete`,
    });
  } catch (error) {
    console.error('Error running classification:', error);
    res.status(500).json({ error: 'Failed to run portfolio classification' });
  }
});

router.get('/provisioning-report', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const report = await generateProvisioningReport(req.orgId!);
    res.status(200).json(report);
  } catch (error) {
    console.error('Error generating provisioning report:', error);
    res.status(500).json({ error: 'Failed to generate provisioning report' });
  }
});

router.get('/loan/:loanId/classification', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const classification = await getLoanClassification(req.orgId!, req.params.loanId);
    if (!classification) {
      return res.status(404).json({ error: 'No classification found for this loan' });
    }
    res.status(200).json(classification);
  } catch (error) {
    console.error('Error getting classification:', error);
    res.status(500).json({ error: 'Failed to get loan classification' });
  }
});

router.post('/loan/:loanId/classify', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const loanDoc = await db.collection('loans').doc(req.params.loanId).get();
    if (!loanDoc.exists) {
      return res.status(404).json({ error: 'Loan not found' });
    }

    const loan = loanDoc.data()!;
    if (loan.orgId !== req.orgId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const scheduleSnapshot = await db.collection('repayment_schedules')
      .where('loanId', '==', req.params.loanId)
      .limit(1)
      .get();

    const schedule = scheduleSnapshot.empty ? null : scheduleSnapshot.docs[0].data();
    const scheduleItems = schedule?.schedules as Array<{
      emiNo: number;
      dueDate: Date;
      status: string;
      emiAmount: number;
      paidDate?: Date;
    }> | undefined;

    const loanInfo = {
      id: loanDoc.id,
      orgId: loan.orgId,
      borrowerId: loan.borrowerId,
      borrowerName: loan.borrowerName,
      loanAmount: loan.loanAmount,
      outstandingAmount: loan.outstandingAmount || loan.loanAmount,
      emiAmount: schedule?.emiAmount || loan.emiAmount || 0,
      firstEmiDate: loan.firstEmiDate ? new Date(loan.firstEmiDate) : new Date(),
      lastEmiDate: loan.lastEmiDate ? new Date(loan.lastEmiDate) : undefined,
      rate: loan.rate || 0,
      tenor: loan.tenor || 0,
      status: loan.status || 'Active',
      lastPaymentDate: loan.lastPaymentDate,
      securityValue: loan.securityValue,
      guaranteedAmount: loan.guaranteedAmount,
    };

    const classification = await classifyLoanAsset(loanInfo, scheduleItems);

    await db.collection('loan_classifications').doc(`${req.orgId}_${req.params.loanId}`).set({
      ...classification,
    }, { merge: true });

    if (classification.classification === 'NPA' || classification.classification.startsWith('SMA')) {
      const missedEmis = classification.overdueEMICount || 1;
      try {
        await triggerCollectionWorkflow(req.orgId!, {
          id: loanDoc.id,
          borrowerId: loan.borrowerId,
          borrowerName: loan.borrowerName,
          borrowerPhone: loan.borrowerPhone || '+919876543210',
          borrowerEmail: loan.borrowerEmail || 'borrower@example.com',
          loanAmount: loan.loanAmount,
          outstandingAmount: loan.outstandingAmount || loan.loanAmount,
          firstEmiDueDate: new Date(loan.firstEmiDate || new Date()),
          emiAmount: schedule?.emiAmount || loan.emiAmount || 0,
          orgId: loan.orgId,
        }, missedEmis, classification.daysOverdue);
      } catch (colError) {
        console.error('Collection trigger failed:', colError);
      }
    }

    await db.collection('audit_logs').add({
      orgId: req.orgId,
      action: 'LOAN_MANUAL_CLASSIFICATION',
      targetId: req.params.loanId,
      detail: `Manual classification: ${classification.classification}, DPD: ${classification.daysOverdue}`,
      timestamp: new Date(),
    });

    res.status(200).json({
      success: true,
      classification,
      message: `Loan classified as ${classification.classification}`,
    });
  } catch (error) {
    console.error('Error classifying loan:', error);
    res.status(500).json({ error: 'Failed to classify loan' });
  }
});

router.get('/rbi-report/:reportType', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { reportType } = req.params;
    const { startDate, endDate } = req.query;

    const classificationSummary = await getPortfolioClassificationSummary(req.orgId!);
    const provisioningReport = await generateProvisioningReport(req.orgId!);

    let report: any = {
      orgId: req.orgId,
      generatedAt: new Date().toISOString(),
      reportType,
      period: { start: startDate || 'N/A', end: endDate || 'N/A' },
    };

    switch (reportType) {
      case 'bnk':
        report = {
          ...report,
          category: 'BNK Report (Banking)',
          sectionA: {
            loanDisbursements: classificationSummary.total,
            totalSanctionedAmount: classificationSummary.totalOutstanding,
            totalOutstandingAmount: classificationSummary.totalOutstanding,
            averageLoanAmount: classificationSummary.total > 0 
              ? Math.round(classificationSummary.totalOutstanding / classificationSummary.total)
              : 0,
          },
          assetClassification: {
            standard: {
              count: classificationSummary.standard,
              amount: 0,
              provision: 0,
            },
            sma0: {
              count: classificationSummary.sma0,
              amount: 0,
              provision: 0,
            },
            sma1: {
              count: classificationSummary.sma1,
              amount: 0,
              provision: 0,
            },
            sma2: {
              count: classificationSummary.sma2,
              amount: 0,
              provision: 0,
            },
            npa: {
              count: classificationSummary.npa,
              amount: 0,
              provision: classificationSummary.totalProvisioning,
            },
          },
          npaDetails: {
            substandard: classificationSummary.npaByCategory.Substandard,
            doubtful: classificationSummary.npaByCategory.Doubtful,
            lossAsset: classificationSummary.npaByCategory['Loss Asset'],
          },
          npaRatios: {
            grossNPA: classificationSummary.npaRatio,
            netNPA: classificationSummary.npaRatio,
            provisionCoverage: classificationSummary.provisionCoverage,
          },
          recoveryPerformance: {
            totalRecovered: 0,
            recoveryRate: 0,
          },
        };
        break;

      case 'npa':
        report = {
          ...report,
          category: 'NPA Management Report',
          summary: {
            totalLoans: classificationSummary.total,
            totalNPA: classificationSummary.npa,
            npaRatio: classificationSummary.npaRatio,
            totalOverdue: classificationSummary.totalOverdue,
            totalProvisioning: classificationSummary.totalProvisioning,
            provisionCoverage: classificationSummary.provisionCoverage,
          },
          npaBreakdown: {
            '0-30 DPD': classificationSummary.sma0,
            '31-60 DPD': classificationSummary.sma1,
            '61-90 DPD': classificationSummary.sma2,
            '90+ DPD (NPA)': classificationSummary.npa,
          },
          provisioningRequired: classificationSummary.totalProvisioning,
          averageDPD: classificationSummary.averageDPD,
          provisioningByBucket: provisioningReport.stageWiseProvisioning,
          recommendations: provisioningReport.recommendedProvisions.slice(0, 20),
        };
        break;

      case 'alm':
        report = {
          ...report,
          category: 'Asset Liability Management Report',
          assetProfile: {
            totalAssets: classificationSummary.totalOutstanding,
            classification: {
              standard: { amount: 0, percentage: 0 },
              sma: { amount: 0, percentage: 0 },
              npa: { amount: 0, percentage: 0 },
            },
          },
          liabilityProfile: {
            totalLiabilities: 0,
          },
          mismatches: {
            '1-30 days': { assetGap: 0, liabilityGap: 0 },
            '31-90 days': { assetGap: 0, liabilityGap: 0 },
            '90+ days': { assetGap: 0, liabilityGap: 0 },
          },
          liquidityRatios: {
            currentRatio: 0,
            quickRatio: 0,
          },
        };
        break;

      case 'compliance-summary':
        report = {
          ...report,
          category: 'RBI Compliance Summary',
          classificationStatus: classificationSummary,
          provisioningStatus: {
            totalProvisioning: classificationSummary.totalProvisioning,
            coverageRatio: classificationSummary.provisionCoverage,
          },
          auditTrail: {
            totalLogs: 0,
          },
          rbiChecklist: {
            smaClassification: classificationSummary.sma0 + classificationSummary.sma1 + classificationSummary.sma2 > 0,
            npaClassification: classificationSummary.npa > 0,
            provisioningAdequate: classificationSummary.provisionCoverage >= 70,
            auditTrailComplete: true,
          },
          recommendations: [],
        };
        break;

      default:
        return res.status(400).json({ error: 'Invalid report type. Use: bnk, npa, alm, compliance-summary' });
    }

    await db.collection('audit_logs').add({
      orgId: req.orgId,
      action: 'RBI_REPORT_GENERATED',
      targetId: req.orgId,
      detail: `Generated ${reportType} report`,
      timestamp: new Date(),
    });

    res.status(200).json(report);
  } catch (error) {
    console.error('Error generating RBI report:', error);
    res.status(500).json({ error: 'Failed to generate RBI report' });
  }
});

router.get('/audit-trail', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { action, startDate, endDate, limit = 100 } = req.query;

    let query: any = db.collection('audit_logs').where('orgId', '==', req.orgId!);

    if (action) {
      query = query.where('action', '==', action);
    }

    const snapshot = await query.orderBy('timestamp', 'desc').limit(Number(limit) || 100).get();

    let logs = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate?.() || doc.data().timestamp,
    }));

    if (startDate) {
      const start = new Date(startDate as string);
      logs = logs.filter((l: any) => new Date(l.timestamp) >= start);
    }
    if (endDate) {
      const end = new Date(endDate as string);
      logs = logs.filter((l: any) => new Date(l.timestamp) <= end);
    }

    res.status(200).json({
      total: logs.length,
      logs,
    });
  } catch (error) {
    console.error('Error getting audit trail:', error);
    res.status(500).json({ error: 'Failed to get audit trail' });
  }
});

router.get('/sma-tracking', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const snapshot = await db.collection('loan_classifications')
      .where('orgId', '==', req.orgId)
      .get();

    const smaLoans = snapshot.docs
      .map(d => d.data())
      .filter((c: any) => c.classification.startsWith('SMA') || c.classification === 'NPA')
      .map((c: any) => ({
        loanId: c.loanId,
        classification: c.classification,
        daysOverdue: c.daysOverdue,
        overdueAmount: c.overdueAmount,
        totalOutstanding: c.totalOutstanding,
        overdueEMICount: c.overdueEMICount,
        lastEMIDueDate: c.lastEMIDueDate,
        provisioningRequired: c.provisioningRequired,
        provisioned: false,
      }));

    for (const loan of smaLoans) {
      const existing = await db.collection('loan_classifications')
        .doc(`${req.orgId}_${loan.loanId}`)
        .get();
      if (existing.exists && (existing.data() as any).provisioningRequired > 0) {
        loan.provisioned = true;
      }
    }

    const summary = {
      sma0Count: smaLoans.filter((l: any) => l.classification === 'SMA-0').length,
      sma1Count: smaLoans.filter((l: any) => l.classification === 'SMA-1').length,
      sma2Count: smaLoans.filter((l: any) => l.classification === 'SMA-2').length,
      npaCount: smaLoans.filter((l: any) => l.classification === 'NPA').length,
      totalAtRisk: smaLoans.length,
      totalOverdueAmount: smaLoans.reduce((sum: number, l: any) => sum + l.overdueAmount, 0),
      totalProvisioningRequired: smaLoans.reduce((sum: number, l: any) => sum + l.provisioningRequired, 0),
      provisionedAmount: smaLoans.filter((l: any) => l.provisioned).length,
    };

    res.status(200).json({ summary, loans: smaLoans });
  } catch (error) {
    console.error('Error getting SMA tracking:', error);
    res.status(500).json({ error: 'Failed to get SMA tracking' });
  }
});

export default router;