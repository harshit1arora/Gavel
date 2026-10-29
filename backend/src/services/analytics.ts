import { db } from '../config/firebase';
import { FieldValue } from 'firebase-admin/firestore';

export interface PortfolioAnalytics {
  volume30Days: { month: string; applications: number; approved: number }[];
  riskDistribution: { range: string; count: number }[];
  npaRatio: number;
  totalDisbursalYtd: number;
  healthMetrics: {
    approvalRate: number;
    avgDecisionTimeMs: number;
  };
}

/**
 * Aggregates portfolio analytics using Firestore COUNT queries and
 * pre-filtered date ranges to avoid loading entire collections.
 */
export const getPortfolioAnalytics = async (orgId: string): Promise<PortfolioAnalytics> => {
  const now = new Date();
  const sixMonthsAgo = new Date(now);
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  // Only fetch last 6 months of data, not the entire history
  const appSnapshot = await db.collection('applications')
.where('orgId', '==', orgId)
.where('createdAt', '>=', sixMonthsAgo)
.orderBy('createdAt', 'desc')
.limit(5000) // Hard cap to prevent OOM
.get();

  const applications = appSnapshot.docs.map(doc => doc.data());

  // Aggregate Volume by Month
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const volumeMap: Record<string, { month: string, applications: number, approved: number }> = {};

  applications.forEach(app => {
    const date = app.createdAt?.toDate ? app.createdAt.toDate(): new Date(app.createdAt);
    const monthName = months[date.getMonth()];
    if (!volumeMap[monthName]) {
      volumeMap[monthName] = { month: monthName, applications: 0, approved: 0 };
    }
    volumeMap[monthName].applications++;
    if (app.status === 'Approved') {
      volumeMap[monthName].approved++;
    }
  });

  // Risk Distribution
  const riskRanges = [
    { label: "300-500", min: 300, max: 500, count: 0 },
    { label: "500-600", min: 500, max: 600, count: 0 },
    { label: "600-700", min: 600, max: 700, count: 0 },
    { label: "700-800", min: 700, max: 800, count: 0 },
    { label: "800+", min: 800, max: 1000, count: 0 },
  ];

  applications.forEach(app => {
    if (app.aiScore) {
      const range = riskRanges.find(r => app.aiScore >= r.min && app.aiScore < r.max);
      if (range) range.count++;
    }
  });

  // Sentinel NPA Ratio, use count query instead of loading all docs
  const monitoredSnapshot = await db.collection('monitored_borrowers')
.where('orgId', '==', orgId)
.select('riskCategory') // Only fetch the field we need
.get();

  const monitoredCount = monitoredSnapshot.size;
  const redCount = monitoredSnapshot.docs.filter(doc => doc.data().riskCategory === 'Red').length;
  const npaRatio = monitoredCount > 0 ? (redCount / monitoredCount) * 100: 0;

  // Total Disbursal YTD
  const ytdStart = new Date(now.getFullYear(), 0, 1);
  const approvedApps = applications.filter(app => {
    const date = app.createdAt?.toDate ? app.createdAt.toDate(): new Date(app.createdAt);
    return app.status === 'Approved' && date >= ytdStart;
  });
  const totalDisbursalYtd = approvedApps.reduce((sum, app) => sum + (app.loanAmount || 0), 0);

  // Average Decision Time
  const decidedApps = applications.filter(a => a.decidedAt && a.createdAt);
  let avgDecisionTimeMs = 0;
  if (decidedApps.length > 0) {
    const totalTime = decidedApps.reduce((sum, app) => {
      const created = app.createdAt?.toDate ? app.createdAt.toDate(): new Date(app.createdAt);
      const decided = app.decidedAt?.toDate ? app.decidedAt.toDate(): new Date(app.decidedAt);
      return sum + (decided.getTime() - created.getTime());
    }, 0);
    avgDecisionTimeMs = totalTime / decidedApps.length;
  }

  return {
    volume30Days: Object.values(volumeMap).slice(-6),
    riskDistribution: riskRanges.map(r => ({ range: r.label, count: r.count })),
    npaRatio: parseFloat(npaRatio.toFixed(1)),
    totalDisbursalYtd,
    healthMetrics: {
      approvalRate: applications.length > 0 ? (applications.filter(a => a.status === 'Approved').length / applications.length) * 100: 0,
      avgDecisionTimeMs,
    }
  };
};
