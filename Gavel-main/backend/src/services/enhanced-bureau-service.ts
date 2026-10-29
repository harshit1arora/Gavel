import admin from 'firebase-admin';
import { CreditBureauReport } from './bureau-service';

/**
 * Enhanced Bureau Service Wrapper
 * - Adds caching to reduce API calls
 * - Implements retry logic
 * - Better error handling and fallbacks
 * - Integration with ML prediction engine
 */

export interface CreditMetrics {
  score: number;
  scoreBand: string;
  debtToIncomeRatio: number;
  paymentHistoryScore: number; // 0-100
  creditMixScore: number; // 0-100
  ageScore: number; // 0-100
  inquiryScore: number; // 0-100
  riskCategory: 'excellent' | 'good' | 'fair' | 'poor';
  metrics: {
    accountsActive: number;
    accountsDelinquent: number;
    writtenOff: number;
    settled: number;
    currentDPD: number;
    maxDPD: number;
    inquiries90Days: number;
    inquiries180Days: number;
  };
}

class EnhancedBureauService {
  private static readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAY = 1000; // ms
  private static readonly FETCH_TIMEOUT = 10000; // 10 seconds

  /**
   * Fetch credit report with caching and retry logic
   */
  static async fetchCreditReportWithCache(
    userId: string,
    pan: string,
    borrowerId: string,
    orgId: string,
    forceRefresh = false
  ): Promise<CreditBureauReport | null> {
    const db = admin.firestore();

    // Check cache
    if (!forceRefresh) {
      const cached = await this.getCachedReport(userId, pan);
      if (cached) {
        console.log('Using cached bureau report for user:', userId);
        return cached;
      }
    }

    // Fetch with retries
    try {
      let report: CreditBureauReport | null = null;

      for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
        try {
          // Import the bureau service function dynamically to avoid circular dependency
          const { fetchCreditReport } = await import('./bureau-service');
          report = await Promise.race([
            fetchCreditReport(userId, pan, borrowerId, orgId),
            new Promise<null>((_, reject) =>
              setTimeout(
                () => reject(new Error('Bureau API timeout')),
                this.FETCH_TIMEOUT
              )
            ),
          ]);

          if (report) {
            break; // Success, exit retry loop
          }
        } catch (error) {
          console.warn(`Bureau fetch attempt ${attempt} failed:`, error);

          if (attempt < this.MAX_RETRIES) {
            // Exponential backoff
            await new Promise(resolve =>
              setTimeout(resolve, this.RETRY_DELAY * Math.pow(2, attempt - 1))
            );
          }
        }
      }

      if (report) {
        // Cache the report
        await this.cacheReport(userId, report);
        return report;
      }

      return null;
    } catch (error) {
      console.error('Failed to fetch credit report after retries:', error);
      return null;
    }
  }

  /**
   * Get cached bureau report
   */
  private static async getCachedReport(
    userId: string,
    pan: string
  ): Promise<CreditBureauReport | null> {
    try {
      const db = admin.firestore();
      const doc = await db
        .collection('creditBureauCache')
        .doc(userId)
        .get();

      if (!doc.exists) return null;

      const data = doc.data();
      if (!data) return null;

      // Check if cache is still valid
      const cachedAt = data.fetchedAt?.toDate?.() || new Date(data.fetchedAt);
      const age = Date.now() - cachedAt.getTime();

      if (age > this.CACHE_DURATION) {
        // Cache expired
        return null;
      }

      return data as CreditBureauReport;
    } catch (error) {
      console.warn('Cache retrieval failed:', error);
      return null;
    }
  }

  /**
   * Cache bureau report
   */
  private static async cacheReport(
    userId: string,
    report: CreditBureauReport
  ): Promise<void> {
    try {
      const db = admin.firestore();
      await db.collection('creditBureauCache').doc(userId).set(report, { merge: true });
    } catch (error) {
      console.warn('Cache storage failed:', error);
    }
  }

  /**
   * Calculate credit metrics from bureau report
   * Returns scores suitable for ML model input
   */
  static calculateCreditMetrics(report: CreditBureauReport | null): CreditMetrics {
    if (!report) {
      // Fallback metrics if no bureau data available
      return this.getDefaultMetrics();
    }

    const score = report.bureauFields?.totalAccounts
      ? report.score || 700
      : 700;

    // Payment History Score (0-100)
    const delinquentAccounts = report.bureauFields?.delinquentAccounts || 0;
    const settledAccounts = report.bureauFields?.settledAccounts || 0;
    const writtenOff = report.bureauFields?.writtenOffAccounts || 0;
    const totalAccounts = report.bureauFields?.totalAccounts || 1;

    const paymentHistoryScore =
      100 -
      (delinquentAccounts * 25 + settledAccounts * 10 + writtenOff * 50) /
        Math.max(totalAccounts, 1);

    // Credit Mix Score (0-100)
    const creditMix = report.bureauFields?.creditMix || [];
    const uniqueTypes = new Set(creditMix.map(m => m.type)).size;
    const creditMixScore = Math.min(100, uniqueTypes * 20);

    // Age Score (0-100) - based on average account age
    const avgAge = report.bureauFields?.averageAccountAge || 0;
    let ageScore = 30;
    if (avgAge > 10) ageScore = 100;
    else if (avgAge > 5) ageScore = 80;
    else if (avgAge > 3) ageScore = 60;
    else if (avgAge > 1) ageScore = 40;

    // Inquiry Score (0-100) - fewer recent inquiries is better
    const inquiries90 = report.bureauFields?.inquiriesLast90Days || 0;
    const inquiryScore = Math.max(0, 100 - inquiries90 * 15);

    // Debt to Income (from current balance vs sanctioned)
    const currentBalance = report.bureauFields?.currentBalance || 0;
    const securedAmount = report.bureauFields?.securedAmount || 0;
    const unsecuredAmount = report.bureauFields?.unsecuredAmount || 0;
    const totalCredit = securedAmount + unsecuredAmount || 1;
    const debtToIncomeRatio =
      totalCredit > 0 ? (currentBalance / totalCredit) * 100 : 0;

    // Determine Risk Category
    let riskCategory: 'excellent' | 'good' | 'fair' | 'poor';
    if (score >= 800) riskCategory = 'excellent';
    else if (score >= 750) riskCategory = 'good';
    else if (score >= 650) riskCategory = 'fair';
    else riskCategory = 'poor';

    const currentDPD = report.bureauFields?.currentDPD || 0;
    const maxDPD = report.bureauFields?.maxDPD || 0;

    if (currentDPD > 30 || maxDPD > 90 || delinquentAccounts > 1) {
      riskCategory = 'poor';
    }

    return {
      score,
      scoreBand: report.scoreBand || 'Not Available',
      debtToIncomeRatio: Math.round(debtToIncomeRatio * 10) / 10,
      paymentHistoryScore: Math.max(0, Math.round(paymentHistoryScore)),
      creditMixScore: Math.round(creditMixScore),
      ageScore: Math.round(ageScore),
      inquiryScore: Math.round(inquiryScore),
      riskCategory,
      metrics: {
        accountsActive: report.bureauFields?.activeAccounts || 0,
        accountsDelinquent: delinquentAccounts,
        writtenOff,
        settled: settledAccounts,
        currentDPD,
        maxDPD,
        inquiries90Days: inquiries90,
        inquiries180Days: report.bureauFields?.inquiriesLast180Days || 0,
      },
    };
  }

  /**
   * Get default metrics when bureau data unavailable
   */
  private static getDefaultMetrics(): CreditMetrics {
    return {
      score: 700, // Conservative default
      scoreBand: 'Not Available',
      debtToIncomeRatio: 0,
      paymentHistoryScore: 60,
      creditMixScore: 50,
      ageScore: 50,
      inquiryScore: 70,
      riskCategory: 'fair',
      metrics: {
        accountsActive: 0,
        accountsDelinquent: 0,
        writtenOff: 0,
        settled: 0,
        currentDPD: 0,
        maxDPD: 0,
        inquiries90Days: 0,
        inquiries180Days: 0,
      },
    };
  }

  /**
   * Batch fetch credit reports for multiple users
   */
  static async batchFetchReports(
    users: Array<{ userId: string; pan: string; borrowerId: string; orgId: string }>
  ): Promise<Map<string, CreditBureauReport | null>> {
    const results = new Map<string, CreditBureauReport | null>();

    // Fetch with concurrency control (5 concurrent)
    const batchSize = 5;
    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);

      const batchResults = await Promise.allSettled(
        batch.map(u =>
          this.fetchCreditReportWithCache(u.userId, u.pan, u.borrowerId, u.orgId)
        )
      );

      batch.forEach((user, idx) => {
        const result = batchResults[idx];
        results.set(
          user.userId,
          result.status === 'fulfilled' ? result.value : null
        );
      });
    }

    return results;
  }

  /**
   * Clear expired cache entries
   */
  static async clearExpiredCache(): Promise<number> {
    try {
      const db = admin.firestore();
      const now = Date.now();
      const expiryTime = now - this.CACHE_DURATION;

      const snapshot = await db.collection('creditBureauCache').get();

      let deletedCount = 0;
      const batch = db.batch();

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const fetchedAt = data.fetchedAt?.toDate?.()?.getTime?.() || 0;

        if (fetchedAt < expiryTime) {
          batch.delete(doc.ref);
          deletedCount++;
        }
      });

      await batch.commit();
      console.log(`Cleared ${deletedCount} expired bureau cache entries`);
      return deletedCount;
    } catch (error) {
      console.error('Cache cleanup failed:', error);
      return 0;
    }
  }

  /**
   * Get bureau report summary for dashboard
   */
  static generateBureauSummary(metrics: CreditMetrics): string {
    const lines: string[] = [];

    lines.push(`Credit Score: ${metrics.score} (${metrics.scoreBand})`);
    lines.push(`Risk Category: ${metrics.riskCategory.toUpperCase()}`);
    lines.push(`Active Accounts: ${metrics.metrics.accountsActive}`);

    if (metrics.metrics.accountsDelinquent > 0) {
      lines.push(`⚠️ Delinquent Accounts: ${metrics.metrics.accountsDelinquent}`);
    }

    if (metrics.metrics.currentDPD > 0) {
      lines.push(`⚠️ Current Days Overdue: ${metrics.metrics.currentDPD}`);
    }

    if (metrics.metrics.inquiries90Days > 2) {
      lines.push(`⚠️ Recent Inquiries: ${metrics.metrics.inquiries90Days}`);
    }

    return lines.join('\n');
  }
}

export default EnhancedBureauService;
