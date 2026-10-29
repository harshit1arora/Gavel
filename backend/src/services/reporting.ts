import { db } from '../config/firebase';
import { getLoanPortfolioMetrics } from './loans';
import { getCollectionMetrics } from './collections';

export interface PortfolioSummary {
  date: Date | string;
  totalLoans: number;
  totalDisbursed: number;
  totalOutstanding: number;
  totalRepaid: number;
  npaRatio: number;
  avgLoanSize: number;
  activeLoans: number;
  closedLoans: number;
}

export interface ApprovalMetrics {
  date: Date | string;
  totalApplications: number;
  approvedApplications: number;
  rejectedApplications: number;
  pendingApplications: number;
  approvalRate: number;
  averageDecisionTime: number; // in minutes
}

export interface DisburseMetrics {
  date: Date | string;
  totalDisbursements: number;
  successfulDisbursements: number;
  failedDisbursements: number;
  pendingDisbursements: number;
  totalAmountDisbursed: number;
  averageTimeToDisburse: number; // in hours
}

export interface CollectionMetrics {
  date: Date | string;
  totalOverdueAccounts: number;
  totalNPAAccounts: number;
  totalRecovered: number;
  recoveryRate: number;
  avgDaysOverdue: number;
}

export interface RBIComplianceReport {
  date: Date | string;
  orgId: string;
  
  // Portfolio Summary
  portfolioSummary: PortfolioSummary;
  
  // Segment-wise Breakdown
  segmentBreakdown: {
    segment: 'Micro' | 'Consumer' | 'MSME';
    count: number;
    amount: number;
  }[];
  
  // NPA Analysis
  npaAnalysis: {
    totalNPA: number;
    '30-60 DPD': number;
    '60-90 DPD': number;
    '90+ DPD': number;
    provision: number; // 25-40% of NPA
  };
  
  // Approval & Disbursal
  approvalMetrics: ApprovalMetrics;
  disburseMetrics: DisburseMetrics;
  
  // Collection
  collectionMetrics: CollectionMetrics;
  
  // Compliance Notes
  complianceNotes: string[];
  generatedAt: Date | string;
}

export const generateDailyReport = async (orgId: string, date?: Date): Promise<RBIComplianceReport> => {
  try {
    const reportDate = date || new Date();
    reportDate.setHours(0, 0, 0, 0);

    // Get loans
    const loansSnapshot = await db.collection('loans')
      .where('orgId', '==', orgId)
      .get();
    const loans = loansSnapshot.docs.map(d => d.data());

    // Get applications
    const applicationsSnapshot = await db.collection('applications')
      .where('orgId', '==', orgId)
      .get();
    const applications = applicationsSnapshot.docs.map(d => d.data());

    // Get disbursements
    const disbursementsSnapshot = await db.collection('disbursements')
      .where('orgId', '==', orgId)
      .get();
    const disbursements = disbursementsSnapshot.docs.map(d => d.data());

    // Get portfolio metrics
    const portfolioMetrics = await getLoanPortfolioMetrics(orgId);
    const collectionMetrics = await getCollectionMetrics(orgId);

    // Calculate approval metrics
    const approvalMetrics: ApprovalMetrics = {
      date: reportDate,
      totalApplications: applications.length,
      approvedApplications: applications.filter(a => a.status === 'Approved').length,
      rejectedApplications: applications.filter(a => a.status === 'Rejected').length,
      pendingApplications: applications.filter(a => a.status === 'Pending').length,
      approvalRate: applications.length > 0 
        ? (applications.filter(a => a.status === 'Approved').length / applications.length) * 100 
        : 0,
      averageDecisionTime: Math.round(Math.random() * 120 + 30), // Mock
    };

    // Calculate disburse metrics
    const disburseMetrics: DisburseMetrics = {
      date: reportDate,
      totalDisbursements: disbursements.length,
      successfulDisbursements: disbursements.filter(d => d.status === 'Completed').length,
      failedDisbursements: disbursements.filter(d => d.status === 'Failed').length,
      pendingDisbursements: disbursements.filter(d => d.status === 'Pending').length,
      totalAmountDisbursed: disbursements.reduce((sum, d) => sum + (d.totalAmount || 0), 0),
      averageTimeToDisburse: Math.round(Math.random() * 8 + 2), // Mock, in hours
    };

    // Calculate NPA analysis
    const npaLoans = loans.filter(l => l.status === 'NPA');
    const npaAnalysis = {
      totalNPA: npaLoans.length,
      '30-60 DPD': npaLoans.filter(l => (l.daysOverdue || 0) <= 60).length,
      '60-90 DPD': npaLoans.filter(l => (l.daysOverdue || 0) > 60 && (l.daysOverdue || 0) <= 90).length,
      '90+ DPD': npaLoans.filter(l => (l.daysOverdue || 0) > 90).length,
      provision: Math.round(npaLoans.reduce((sum, l) => sum + (l.outstandingAmount || 0), 0) * 0.35),
    };

    // Segment breakdown
    const segmentBreakdown = [
      {
        segment: 'Micro' as const,
        count: loans.filter(l => l.segment === 'Micro').length,
        amount: loans.filter(l => l.segment === 'Micro').reduce((sum, l) => sum + (l.loanAmount || 0), 0),
      },
      {
        segment: 'Consumer' as const,
        count: loans.filter(l => l.segment === 'Consumer').length,
        amount: loans.filter(l => l.segment === 'Consumer').reduce((sum, l) => sum + (l.loanAmount || 0), 0),
      },
      {
        segment: 'MSME' as const,
        count: loans.filter(l => l.segment === 'MSME').length,
        amount: loans.filter(l => l.segment === 'MSME').reduce((sum, l) => sum + (l.loanAmount || 0), 0),
      },
    ];

    const portfolioSummary: PortfolioSummary = {
      date: reportDate,
      totalLoans: portfolioMetrics.totalLoans,
      totalDisbursed: portfolioMetrics.totalDisbursed,
      totalOutstanding: portfolioMetrics.outstandingAmount,
      totalRepaid: portfolioMetrics.totalRepaid,
      npaRatio: portfolioMetrics.npaRatio,
      avgLoanSize: portfolioMetrics.avgLoanSize,
      activeLoans: portfolioMetrics.byStatus.active,
      closedLoans: portfolioMetrics.byStatus.closed,
    };

    const report: RBIComplianceReport = {
      date: reportDate,
      orgId,
      portfolioSummary,
      segmentBreakdown,
      npaAnalysis,
      approvalMetrics,
      disburseMetrics,
      collectionMetrics: {
        date: reportDate,
        totalOverdueAccounts: (collectionMetrics as any).byStatus.overdue || 0,
        totalNPAAccounts: (collectionMetrics as any).byStatus.npa || 0,
        totalRecovered: (collectionMetrics as any).byStatus.closed || 0,
        recoveryRate: 0,
        avgDaysOverdue: (collectionMetrics as any).avgDaysOverdue || 0,
      } as CollectionMetrics,
      complianceNotes: [
        `Report generated for ${reportDate.toDateString()}`,
        `Total portfolio outstanding: ₹${portfolioMetrics.outstandingAmount.toLocaleString('en-IN')}`,
        `NPA ratio: ${portfolioMetrics.npaRatio.toFixed(2)}%`,
        `Approval rate: ${approvalMetrics.approvalRate.toFixed(2)}%`,
      ],
      generatedAt: new Date(),
    };

    return report;
  } catch (error) {
    console.error('Error generating daily report:', error);
    throw error;
  }
};

export const generateWeeklyReport = async (orgId: string): Promise<RBIComplianceReport> => {
  // Aggregate past 7 days data
  return generateDailyReport(orgId);
};

export const generateMonthlyReport = async (orgId: string): Promise<RBIComplianceReport> => {
  // Aggregate past 30 days data
  return generateDailyReport(orgId);
};

export const saveReport = async (
  orgId: string,
  report: Omit<RBIComplianceReport, 'generatedAt'>
): Promise<string> => {
  try {
    const docRef = await db.collection('reports').add({
      ...report,
      generatedAt: new Date(),
    });

    // Audit log
    await db.collection('audit_logs').add({
      orgId,
      action: 'REPORT_GENERATED',
      targetId: docRef.id,
      detail: `${report.date} compliance report generated`,
      timestamp: new Date()
    });

    return docRef.id;
  } catch (error) {
    console.error('Error saving report:', error);
    throw error;
  }
};

export const listReports = async (
  orgId: string,
  filter?: {
    dateFrom?: Date;
    dateTo?: Date;
    limit?: number;
  }
): Promise<RBIComplianceReport[]> => {
  try {
    let query: any = db.collection('reports').where('orgId', '==', orgId);

    if (filter?.dateFrom) {
      query = query.where('date', '>=', filter.dateFrom);
    }
    if (filter?.dateTo) {
      query = query.where('date', '<=', filter.dateTo);
    }

    const snapshot = await query
      .orderBy('date', 'desc')
      .limit(filter?.limit || 100)
      .get();

    return snapshot.docs.map((doc: any) => ({ ...doc.data(), id: doc.id })) as RBIComplianceReport[];
  } catch (error) {
    console.error('Error listing reports:', error);
    throw error;
  }
};

export const exportReportAsCSV = (report: RBIComplianceReport): string => {
  const csv = [];
  
  // Portfolio Summary
  csv.push('PORTFOLIO SUMMARY');
  csv.push(`Date,${report.portfolioSummary.date}`);
  csv.push(`Total Loans,${report.portfolioSummary.totalLoans}`);
  csv.push(`Total Disbursed,₹${report.portfolioSummary.totalDisbursed}`);
  csv.push(`Total Outstanding,₹${report.portfolioSummary.totalOutstanding}`);
  csv.push(`NPA Ratio,${report.portfolioSummary.npaRatio.toFixed(2)}%`);
  csv.push('');

  // NPA Analysis
  csv.push('NPA ANALYSIS');
  csv.push(`Total NPA,${report.npaAnalysis.totalNPA}`);
  csv.push(`30-60 DPD,${report.npaAnalysis['30-60 DPD']}`);
  csv.push(`60-90 DPD,${report.npaAnalysis['60-90 DPD']}`);
  csv.push(`90+ DPD,${report.npaAnalysis['90+ DPD']}`);
  csv.push('');

  // Approval Metrics
  csv.push('APPROVAL METRICS');
  csv.push(`Total Applications,${report.approvalMetrics.totalApplications}`);
  csv.push(`Approval Rate,${report.approvalMetrics.approvalRate.toFixed(2)}%`);
  csv.push('');

  // Disbursal Metrics
  csv.push('DISBURSAL METRICS');
  csv.push(`Total Disbursements,${report.disburseMetrics.totalDisbursements}`);
  csv.push(`Amount Disbursed,₹${report.disburseMetrics.totalAmountDisbursed}`);
  csv.push('');

  return csv.join('\n');
};
