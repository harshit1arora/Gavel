import {
  db,
  getDocs,
  query,
  where,
  collection,
  Timestamp,
  orderBy,
  limit,
} from '../config/firebase';

export type RiskLevel = 'green' | 'amber' | 'red';

export interface BorrowerRiskScore {
  borrowerId: string;
  loanId: string;
  borrowerName: string;
  riskLevel: RiskLevel;
  riskScore: number; // 0-100
  daysOverdue: number;
  emissedCount: number;
  gstTurnoverTrend: 'improving' | 'stable' | 'declining';
  riskFactors: string[];
  recommendation: string;
  lastUpdated: Date;
}

export interface CollectionsMetrics {
  totalBorrowersAtRisk: number;
  highRiskCount: number;
  mediumRiskCount: number;
  lowRiskCount: number;
  overdueAmount: number;
  collectionRate: number; // % of overdue recovered in last 30 days
  avgDaysToRecover: number;
}

/**
 * Calculate risk score for a borrower (0-100)
 * Factors:
 * - Days overdue (0-30 = 10-30 pts, 30-60 = 30-50 pts, 60+ = 50-100 pts)
 * - EMIs missed (each = 5 pts, max 25 pts)
 * - Utilization rate (if >80% = 10 pts)
 * - GST turnover trend (declining = 15 pts, stable = 0, improving = -5 pts)
 */
export async function calculateBorrowerRiskScore(
  borrowerData: {
    daysOverdue: number;
    missedEmis: number;
    utilizationRate?: number;
    gstTrend?: 'improving' | 'stable' | 'declining';
    loanAmount: number;
    lastPaymentDate: Date;
    phone: string;
  }
): Promise<{
  riskScore: number;
  riskLevel: RiskLevel;
  factors: string[];
  recommendation: string;
}> {
  let score = 0;
  const factors: string[] = [];

  // 1. Days overdue scoring
  if (borrowerData.daysOverdue > 60) {
    score += 50;
    factors.push(`Severely overdue: ${borrowerData.daysOverdue} days`);
  } else if (borrowerData.daysOverdue > 30) {
    score += 30;
    factors.push(`Moderately overdue: ${borrowerData.daysOverdue} days`);
  } else if (borrowerData.daysOverdue > 0) {
    score += 10;
    factors.push(`Slightly overdue: ${borrowerData.daysOverdue} days`);
  }

  // 2. Missed EMIs scoring
  const emiScore = Math.min(borrowerData.missedEmis * 5, 25);
  score += emiScore;
  if (borrowerData.missedEmis > 0) {
    factors.push(`${borrowerData.missedEmis} EMIs missed`);
  }

  // 3. Utilization rate
  if (borrowerData.utilizationRate && borrowerData.utilizationRate > 80) {
    score += 10;
    factors.push(`High utilization: ${borrowerData.utilizationRate}%`);
  }

  // 4. GST turnover trend
  if (borrowerData.gstTrend === 'declining') {
    score += 15;
    factors.push('GST turnover trending down');
  } else if (borrowerData.gstTrend === 'improving') {
    score = Math.max(0, score - 5);
    factors.push('GST turnover improving (positive signal)');
  }

  // Determine risk level
  let riskLevel: RiskLevel;
  if (score >= 60) {
    riskLevel = 'red';
  } else if (score >= 30) {
    riskLevel = 'amber';
  } else {
    riskLevel = 'green';
  }

  // Recommendation engine
  let recommendation = '';
  if (riskLevel === 'red') {
    recommendation =
      'Immediate action required. Consider loan restructuring or legal action. Send SMS/call reminder.';
  } else if (riskLevel === 'amber') {
    recommendation = 'Monitor closely. Suggest restructuring or payment plan. Weekly follow-up recommended.';
  } else {
    recommendation = 'Low risk. Continue normal monitoring.';
  }

  return {
    riskScore: Math.min(score, 100),
    riskLevel,
    factors,
    recommendation,
  };
}

/**
 * Get collections metrics for an organization
 */
export async function getCollectionsMetrics(orgId: string): Promise<CollectionsMetrics> {
  try {
    const collectionsRef = collection(db, `organizations/${orgId}/collection_cases`);

    const [allCases, highRiskCases, mediumRiskCases, lowRiskCases] = await Promise.all([
      getDocs(collectionsRef),
      getDocs(query(collectionsRef, where('riskLevel', '==', 'red'))),
      getDocs(query(collectionsRef, where('riskLevel', '==', 'amber'))),
      getDocs(query(collectionsRef, where('riskLevel', '==', 'green'))),
    ]);

    let totalOverdueAmount = 0;
    const collectedAmount = 0;
    let totalDaysToRecover = 0;
    let recoveredCount = 0;

    allCases.forEach((docSnap: any) => {
      const data = docSnap.data();
      if (data.amountOutstanding) {
        totalOverdueAmount += data.amountOutstanding;
      }
      if (data.status === 'recovered' && data.recoveryDate && data.createdAt) {
        const daysToRecover = Math.floor(
          (data.recoveryDate.toDate().getTime() - data.createdAt.toDate().getTime()) /
            (1000 * 60 * 60 * 24)
        );
        totalDaysToRecover += daysToRecover;
        recoveredCount += 1;
      }
    });

    // Calculate collection rate (% recovered in last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recoveredLast30 = allCases.docs.filter((doc: any) => {
      const data = doc.data();
      return (
        data.status === 'recovered' &&
        data.recoveryDate?.toDate?.() > thirtyDaysAgo
      );
    });
    const collectionRate =
      allCases.size > 0 ? (recoveredLast30.length / allCases.size) * 100 : 0;

    return {
      totalBorrowersAtRisk: allCases.size,
      highRiskCount: highRiskCases.size,
      mediumRiskCount: mediumRiskCases.size,
      lowRiskCount: lowRiskCases.size,
      overdueAmount: Math.round(totalOverdueAmount),
      collectionRate: Math.round(collectionRate * 10) / 10,
      avgDaysToRecover: recoveredCount > 0 ? Math.round(totalDaysToRecover / recoveredCount) : 0,
    };
  } catch (error) {
    console.error('Error calculating collections metrics:', error);
    throw error;
  }
}

/**
 * Get borrowers at highest risk (for alerts)
 */
export async function getHighestRiskBorrowers(
  orgId: string,
  limit_count: number = 10
): Promise<BorrowerRiskScore[]> {
  try {
    const collectionsRef = collection(db, `organizations/${orgId}/collection_cases`);

    const snapshot = await getDocs(
      query(
        collectionsRef,
        where('riskLevel', '==', 'red'),
        orderBy('daysOverdue', 'desc'),
        limit(limit_count)
      )
    );

    const borrowers: BorrowerRiskScore[] = [];
    snapshot.forEach((docSnap: any) => {
      const data = docSnap.data();
      borrowers.push({
        borrowerId: data.borrowerId,
        loanId: data.loanId,
        borrowerName: data.borrowerName,
        riskLevel: data.riskLevel,
        riskScore: data.riskScore || 0,
        daysOverdue: data.daysOverdue || 0,
        emissedCount: data.missedEmis || 0,
        gstTurnoverTrend: data.gstTrend || 'stable',
        riskFactors: data.riskFactors || [],
        recommendation: data.recommendation || '',
        lastUpdated: data.updatedAt?.toDate?.() || new Date(),
      });
    });

    return borrowers;
  } catch (error) {
    console.error('Error getting highest risk borrowers:', error);
    throw error;
  }
}

/**
 * Generate collections action plan
 */
export function generateActionPlan(riskScore: number, daysOverdue: number): string[] {
  const actions: string[] = [];

  if (daysOverdue > 60) {
    actions.push('Day 1: Escalate to senior management');
    actions.push('Day 2: Send legal notice');
    actions.push('Day 5: Consider NPA classification');
    actions.push('Day 10: Assess legal recovery options');
  } else if (daysOverdue > 30) {
    actions.push('Send SMS reminder with payment link');
    actions.push('Schedule phone call for payment negotiation');
    actions.push('Offer payment plan or restructuring');
    actions.push('Daily monitoring and follow-up');
  } else if (daysOverdue > 0) {
    actions.push('Auto-SMS reminder (friendly tone)');
    actions.push('Optional: Personal phone call');
    actions.push('Check for payment blocks or technical issues');
  }

  return actions;
}
