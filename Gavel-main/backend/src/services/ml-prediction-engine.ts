import admin from 'firebase-admin';
import { ParsedBankStatement } from './bank-statement-parser';

/**
 * Loan Prediction Engine
 * 
 * Uses feature engineering and rules-based scoring.
 * 
 * Features:
 * - Credit score analysis (bureau data)
 * - Income stability (bank statement analysis)
 * - EMI capacity calculation
 * - Risk assessment
 * - Loan amount recommendation
 * - Approval probability calibration
 */

export interface LoanPredictionRequest {
  userId: string;
  applicationId: string;
  
  // Personal Info
  age?: number;
  employmentType?: 'salaried' | 'self_employed' | 'business' | 'student' | 'other';
  
  // Financial Info (from application)
  monthlyIncome: number;
  existingEmi?: number;
  
  // Bureau Data (optional, from credit bureau)
  creditScore?: number;
  accountsActive?: number;
  accountsDelinquent?: number;
  maxDpd?: number;
  inquiries90Days?: number;
  
  // Bank Statement Analysis (optional)
  bankStatementId?: string;
  
  // Loan Requirements
  requestedLoanAmount: number;
  requestedTenure?: number; // months
  loanPurpose?: string;
}

export interface LoanPredictionResult {
  approvalScore: number; // 0-100, calibrated to actual approval rates
  approvalProbability: number; // 0-1.0
  
  // Loan Recommendations
  maxApprovableAmount: number;
  recommendedTenure: number; // months
  estimatedMonthlyEmi: number;
  
  // Risk Assessment
  riskCategory: 'low' | 'medium' | 'high';
  riskScore: number; // 0-100 (higher = more risk)
  
  // Detailed Analysis
  incomeStability: 'high' | 'medium' | 'low';
  emiCapacity: number; // % of income available for new EMI
  debtToIncomeRatio: number;
  
  // Factors (what drove the decision)
  positiveFactors: string[];
  negativeFactors: string[];
  
  // Detailed Decision
  decision: 'approve' | 'conditional' | 'reject';
  decisionReason: string;
  
  // Actionable Recommendations
  recommendations: string[];
  
  // Metadata
  confidence: number; // 0-100
  modelVersion: string;
  predictedAt: Date;
}

class MLPredictionEngine {
  private static readonly MODEL_VERSION = 'RuleEngine-1.0';
  private static readonly DEFAULT_BUREAU_SCORE = 700; // If no bureau data
  private static readonly REPO_RATE = 4.5; // Current RBI repo rate %
  
  /**
   * Main prediction method
   */
  static async predictLoanApproval(request: LoanPredictionRequest): Promise<LoanPredictionResult> {
    try {
      // 1. Feature Engineering
      const features = await this.engineerFeatures(request);
      
      // 2. Score Calculation (rule-based)
      const scores = this.calculateScores(features);
      
      // 3. Generate Result
      const result = this.buildPredictionResult(scores, features, request);
      
      return result;
    } catch (error) {
      console.error('Prediction error:', error);
      throw error;
    }
  }

  /**
   * Feature engineering from raw inputs
   */
  private static async engineerFeatures(request: LoanPredictionRequest) {
    // Get bank statement data if available
    let bankStatementData: any = {};
    if (request.bankStatementId) {
      try {
        const db = admin.firestore();
        const stmtDoc = await db.collection('bankStatementAnalysis').doc(request.bankStatementId).get();
        if (stmtDoc.exists) {
          bankStatementData = stmtDoc.data();
        }
      } catch (e) {
        console.warn('Failed to fetch bank statement:', e);
      }
    }

    // Use bureau score or default
    const creditScore = request.creditScore || this.DEFAULT_BUREAU_SCORE;

    // Calculate derived features
    const monthlyIncome = request.monthlyIncome;
    const existingEmi = request.existingEmi || 0;
    const availableIncome = Math.max(0, monthlyIncome - existingEmi);

    // Income stability (from bank statement or infer from employment type)
    let incomeStability: 'high' | 'medium' | 'low' = 'medium';
    if (bankStatementData.incomeStability) {
      incomeStability = bankStatementData.incomeStability;
    } else {
      incomeStability = request.employmentType === 'salaried' ? 'high' : 'medium';
    }

    // Debt to income ratio
    const debtToIncomeRatio = monthlyIncome > 0 ? (existingEmi / monthlyIncome) * 100 : 0;

    // EMI capacity (% of available income suitable for new loan)
    // Standard lending rule: new EMI should not exceed 40% of income after existing EMI
    const maxNewEmiRatio = 0.40;
    const maxNewEmi = availableIncome * maxNewEmiRatio;
    const emiCapacity = monthlyIncome > 0 ? (maxNewEmi / monthlyIncome) * 100 : 0;

    // Savings ratio (from bank statement)
    const savingsRatio = bankStatementData.savingsRatio || this.inferSavingsRatio(creditScore);

    // Credit history quality
    const creditHistoryQuality = this.scoreCreditHistory(
      creditScore,
      request.accountsActive,
      request.accountsDelinquent,
      request.maxDpd,
      request.inquiries90Days
    );

    // Age factor (younger = lower risk for longer tenors, older = repayment focus)
    const ageFactor = request.age ? this.scoreAgeFactor(request.age) : 0.5;

    // Employment stability score
    const employmentStabilityScore = this.scoreEmploymentType(request.employmentType);

    return {
      creditScore,
      monthlyIncome,
      existingEmi,
      availableIncome,
      incomeStability,
      debtToIncomeRatio,
      maxNewEmi,
      emiCapacity,
      savingsRatio,
      creditHistoryQuality,
      ageFactor,
      employmentStabilityScore,
      bankStatementData,
      loanAmount: request.requestedLoanAmount,
      tenor: request.requestedTenure || 60,
    };
  }

  /**
   * Calculate approval and risk scores
   */
  private static calculateScores(features: any) {
    // Credit score component (0-30 points)
    const creditScoreFactor = Math.min(30, (features.creditScore / 1000) * 30);

    // Income stability (0-20 points)
    const incomeStabilityFactor = features.incomeStability === 'high'
      ? 20
      : features.incomeStability === 'medium'
      ? 12
      : 5;

    // EMI capacity (0-20 points)
    const emiCapacityScore = Math.min(20, Math.max(0, features.emiCapacity / 2));

    // Savings ratio (0-15 points)
    const savingsRatioScore = Math.min(15, Math.max(0, features.savingsRatio * 0.6));

    // Credit history quality (0-10 points)
    const creditHistoryScore = features.creditHistoryQuality * 10;

    // Employment stability (0-5 points)
    const employmentStabilityScore = features.employmentStabilityScore * 5;

    // Total approval score (0-100)
    let approvalScore = Math.round(
      creditScoreFactor +
      incomeStabilityFactor +
      emiCapacityScore +
      savingsRatioScore +
      creditHistoryScore +
      employmentStabilityScore
    );

    // Risk score (inverse of approval score + specific risk factors)
    let riskScore = 100 - approvalScore;

    // Adjust for specific risk factors
    if (features.debtToIncomeRatio > 50) riskScore += 10;
    if (features.debtToIncomeRatio > 75) riskScore += 15;
    if (features.creditScore < 600) riskScore += 20;
    if (features.accountsDelinquent && features.accountsDelinquent > 0) riskScore += 15;

    riskScore = Math.min(100, Math.max(0, riskScore));

    // Severe risk factors knock-out adjustments to approval score
    if (features.creditScore < 600) {
      approvalScore = Math.max(0, approvalScore - 25);
    }
    if (features.accountsDelinquent && features.accountsDelinquent > 0) {
      approvalScore = Math.max(0, approvalScore - 20);
    }
    if (features.debtToIncomeRatio > 75) {
      approvalScore = Math.max(0, approvalScore - 15);
    }

    // Convert to probability (calibrated curve)
    // Use logistic function: 1 / (1 + e^(-k*(x-x0)))
    // Calibration parameters (k=0.1, x0=50)
    let approvalProbability = 1 / (1 + Math.exp(-0.1 * (approvalScore - 50)));

    // Capping probabilities for high-risk classifications to avoid false approvals
    if (riskScore > 75) {
      approvalProbability = Math.min(approvalProbability, 0.3);
    } else if (riskScore > 60) {
      approvalProbability = Math.min(approvalProbability, 0.45);
    }

    return {
      approvalScore,
      approvalProbability,
      riskScore,
    };
  }

  /**
   * Build final prediction result
   */
  private static buildPredictionResult(scores: any, features: any, request: LoanPredictionRequest) {
    // Determine approval decision based on probability
    let decision: 'approve' | 'conditional' | 'reject';
    if (scores.approvalProbability >= 0.7) {
      decision = 'approve';
    } else if (scores.approvalProbability >= 0.4) {
      decision = 'conditional';
    } else {
      decision = 'reject';
    }

    // Determine risk category
    let riskCategory: 'low' | 'medium' | 'high';
    if (scores.riskScore < 30) {
      riskCategory = 'low';
    } else if (scores.riskScore < 70) {
      riskCategory = 'medium';
    } else {
      riskCategory = 'high';
    }

    // Calculate max approvable amount (based on EMI capacity)
    // Max EMI = 40% of monthly income, for tenor months
    const maxMonthlyEmi = features.monthlyIncome * 0.40;
    const monthlyRate = this.REPO_RATE / 12 / 100 + 0.005; // Add 50 bps spread
    const tenor = request.requestedTenure || 60;
    const maxLoanAmount = this.calculateLoanAmount(maxMonthlyEmi, monthlyRate, tenor);

    // Recommended EMI and loan amount (slightly conservative)
    const recommendedMonthlyEmi = Math.min(features.maxNewEmi * 0.85, features.availableIncome * 0.30);
    const recommendedAmount = this.calculateLoanAmount(recommendedMonthlyEmi, monthlyRate, tenor);

    // Determine if requested amount is approvable
    const requestedAmount = request.requestedLoanAmount;
    let approvableAmount = maxLoanAmount;

    // Apply additional constraints
    if (scores.riskScore > 70) {
      approvableAmount *= 0.5; // High risk = 50% of max
    } else if (scores.riskScore > 50) {
      approvableAmount *= 0.7; // Medium-high risk = 70% of max
    }

    // Factors analysis
    const positiveFactors: string[] = [];
    const negativeFactors: string[] = [];

    if (features.creditScore >= 750) positiveFactors.push('Excellent credit score');
    else if (features.creditScore < 600) negativeFactors.push('Low credit score');

    if (features.incomeStability === 'high') positiveFactors.push('Stable, salaried income');
    else if (features.incomeStability === 'low') negativeFactors.push('Unstable income');

    if (features.emiCapacity > 20) positiveFactors.push('Good EMI capacity');
    else if (features.emiCapacity < 5) negativeFactors.push('Limited EMI capacity');

    if (features.savingsRatio > 20) positiveFactors.push('Good savings ratio');
    else if (features.savingsRatio < 5) negativeFactors.push('Low savings ratio');

    if (features.debtToIncomeRatio > 50) negativeFactors.push('High existing debt burden');

    if (features.accountsDelinquent && features.accountsDelinquent > 0) {
      negativeFactors.push(`${features.accountsDelinquent} delinquent accounts`);
    }

    // Decision reason
    let decisionReason = '';
    if (decision === 'approve') {
      decisionReason = `Strong financial profile with ${scores.approvalScore}/100 approval score`;
    } else if (decision === 'conditional') {
      decisionReason = `Profile requires review. Can approve lower amounts or with additional documentation`;
    } else {
      decisionReason = `Low approval probability due to ${negativeFactors.slice(0, 2).join(', ')}`;
    }

    // Recommendations
    const recommendations: string[] = [];
    if (features.debtToIncomeRatio > 50) {
      recommendations.push('Pay off existing loans to reduce debt burden');
    }
    if (features.savingsRatio < 10) {
      recommendations.push('Increase savings to strengthen application');
    }
    if (features.creditScore < 700) {
      recommendations.push('Improve credit score by ensuring timely payments');
    }
    if (features.emiCapacity < 10) {
      recommendations.push('Consider a longer tenure or lower loan amount');
    }
    if (!features.bankStatementData.monthlyRecurringIncome) {
      recommendations.push('Upload your last 3-6 months bank statements for better assessment');
    }

    // Confidence (based on data availability)
    let confidence = 70;
    if (request.creditScore) confidence += 15;
    if (request.bankStatementId) confidence += 15;
    confidence = Math.min(100, confidence);

    const estimatedEmi = this.calculateMonthlyEmi(
      Math.min(requestedAmount, approvableAmount),
      monthlyRate,
      tenor
    );

    return {
      approvalScore: scores.approvalScore,
      approvalProbability: scores.approvalProbability,
      maxApprovableAmount: Math.round(approvableAmount),
      recommendedTenure: tenor,
      estimatedMonthlyEmi: Math.round(estimatedEmi),
      riskCategory,
      riskScore: scores.riskScore,
      incomeStability: features.incomeStability,
      emiCapacity: Math.round(features.emiCapacity),
      debtToIncomeRatio: Math.round(features.debtToIncomeRatio * 10) / 10,
      positiveFactors: positiveFactors.slice(0, 4),
      negativeFactors: negativeFactors.slice(0, 4),
      decision,
      decisionReason,
      recommendations: recommendations.slice(0, 3),
      confidence,
      modelVersion: this.MODEL_VERSION,
      predictedAt: new Date(),
    };
  }

  /**
   * Helper: Calculate loan amount from monthly EMI
   */
  private static calculateLoanAmount(monthlyEmi: number, monthlyRate: number, tenor: number): number {
    if (monthlyRate === 0 || monthlyEmi === 0) return 0;
    // P = EMI * [((1 + r)^n - 1) / (r * (1 + r)^n)]
    const numerator = Math.pow(1 + monthlyRate, tenor) - 1;
    const denominator = monthlyRate * Math.pow(1 + monthlyRate, tenor);
    return monthlyEmi * (numerator / denominator);
  }

  /**
   * Helper: Calculate monthly EMI
   */
  private static calculateMonthlyEmi(loanAmount: number, monthlyRate: number, tenor: number): number {
    if (monthlyRate === 0) return loanAmount / tenor;
    // EMI = P * [r(1 + r)^n] / [(1 + r)^n - 1]
    const numerator = loanAmount * monthlyRate * Math.pow(1 + monthlyRate, tenor);
    const denominator = Math.pow(1 + monthlyRate, tenor) - 1;
    return numerator / denominator;
  }

  /**
   * Helper: Infer savings ratio from credit score
   */
  private static inferSavingsRatio(creditScore: number): number {
    // Heuristic: credit score correlates with savings discipline
    if (creditScore >= 750) return 25;
    if (creditScore >= 700) return 20;
    if (creditScore >= 650) return 15;
    if (creditScore >= 600) return 10;
    return 5;
  }

  /**
   * Helper: Score credit history quality (0-1)
   */
  private static scoreCreditHistory(
    score: number,
    accountsActive?: number,
    accountsDelinquent?: number,
    maxDpd?: number,
    inquiries90Days?: number
  ): number {
    let score_factor = 0;

    // Credit score component
    if (score >= 750) score_factor += 0.4;
    else if (score >= 700) score_factor += 0.3;
    else if (score >= 650) score_factor += 0.2;
    else if (score >= 600) score_factor += 0.1;

    // Account health
    if (!accountsDelinquent || accountsDelinquent === 0) score_factor += 0.3;
    else score_factor -= 0.2;

    // Payment history (max DPD)
    if (!maxDpd || maxDpd === 0) score_factor += 0.2;
    else if (maxDpd > 90) score_factor -= 0.1;

    // Recent inquiries (too many = applying everywhere)
    if (!inquiries90Days || inquiries90Days === 0) score_factor += 0.1;
    else if (inquiries90Days > 3) score_factor -= 0.1;

    return Math.min(1, Math.max(0, score_factor));
  }

  /**
   * Helper: Score employment type
   */
  private static scoreEmploymentType(type?: string): number {
    switch (type) {
      case 'salaried': return 1.0;
      case 'business': return 0.7;
      case 'self_employed': return 0.6;
      case 'student': return 0.2;
      default: return 0.5;
    }
  }

  /**
   * Helper: Score age factor
   */
  private static scoreAgeFactor(age: number): number {
    // Sweet spot: 25-45 years (best risk profile)
    if (age >= 25 && age <= 45) return 1.0;
    if (age > 45 && age <= 55) return 0.9;
    if (age >= 20 && age < 25) return 0.8;
    if (age > 55) return 0.7;
    return 0.5; // Too young or invalid
  }


}

export default MLPredictionEngine;
