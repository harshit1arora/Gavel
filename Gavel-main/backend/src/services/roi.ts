import {
  db,
  getDocs,
  query,
  where,
  collection,
  Timestamp,
} from '../config/firebase';

export interface ROIMetrics {
  decisions: number;
  hoursSaved: number;
  costSaved: number; // ₹
  timePeriod: 'week' | 'month' | 'allTime';
  trend: {
    previousPeriod: number;
    percentageChange: number;
  };
}

export interface UsageROI {
  thisMonth: ROIMetrics;
  lastMonth: ROIMetrics;
  allTime: ROIMetrics;
  projectedAnnualSavings: number;
  costPerDecision: number; // Model cost
  annualAnalystHours: number; // Decisions * 0.5 hours / 12
}

// Constants
const ANALYST_HOURLY_RATE = 500; // ₹ per hour
const HOURS_PER_DECISION = 0.5; // 30 minutes per manual underwriting

/**
 * Calculate ROI metrics for a specific time period
 */
export async function calculateROIForPeriod(
  orgId: string,
  startDate: Date,
  endDate: Date,
  costPerDecision: number = 7.50 // Default Gemini cost
): Promise<ROIMetrics> {
  try {
    const applicationsRef = collection(db, `organizations/${orgId}/applications`);
    
    const snapshot = await getDocs(
      query(
        applicationsRef,
        where('createdAt', '>=', Timestamp.fromDate(startDate)),
        where('createdAt', '<=', Timestamp.fromDate(endDate))
      )
    );

    const decisions = snapshot.size;
    const hoursSaved = decisions * HOURS_PER_DECISION;
    const costSaved = hoursSaved * ANALYST_HOURLY_RATE;

    return {
      decisions,
      hoursSaved: Math.round(hoursSaved * 10) / 10,
      costSaved: Math.round(costSaved),
      timePeriod: 'month',
      trend: {
        previousPeriod: 0,
        percentageChange: 0,
      },
    };
  } catch (error) {
    console.error('Error calculating ROI for period:', error);
    throw error;
  }
}

/**
 * Get comprehensive ROI metrics for this month, last month, and all time
 */
export async function getUsageROI(
  orgId: string,
  costPerDecision: number = 7.50
): Promise<UsageROI> {
  try {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const allTimeStart = new Date(2020, 0, 1); // From beginning of time

    const [thisMonth, lastMonth, allTime] = await Promise.all([
      calculateROIForPeriod(orgId, thisMonthStart, thisMonthEnd, costPerDecision),
      calculateROIForPeriod(orgId, lastMonthStart, lastMonthEnd, costPerDecision),
      calculateROIForPeriod(orgId, allTimeStart, now, costPerDecision),
    ]);

    // Calculate trend
    const percentageChange =
      lastMonth.decisions > 0
        ? ((thisMonth.decisions - lastMonth.decisions) / lastMonth.decisions) * 100
        : 0;

    thisMonth.trend = {
      previousPeriod: lastMonth.decisions,
      percentageChange: Math.round(percentageChange * 10) / 10,
    };

    // Annual projections
    const projectedAnnualDecisions = thisMonth.decisions * 12;
    const projectedAnnualSavings = projectedAnnualDecisions * HOURS_PER_DECISION * ANALYST_HOURLY_RATE;
    const annualAnalystHours = projectedAnnualDecisions * HOURS_PER_DECISION;

    return {
      thisMonth,
      lastMonth,
      allTime,
      projectedAnnualSavings: Math.round(projectedAnnualSavings),
      costPerDecision,
      annualAnalystHours: Math.round(annualAnalystHours * 10) / 10,
    };
  } catch (error) {
    console.error('Error getting usage ROI:', error);
    throw error;
  }
}

/**
 * Calculate savings for a given number of decisions
 */
export function calculateSavings(decisions: number): {
  hours: number;
  cost: number;
  days: number;
} {
  const hours = decisions * HOURS_PER_DECISION;
  const cost = hours * ANALYST_HOURLY_RATE;
  const days = hours / 8; // Assuming 8-hour workday

  return {
    hours: Math.round(hours * 10) / 10,
    cost: Math.round(cost),
    days: Math.round(days * 10) / 10,
  };
}
