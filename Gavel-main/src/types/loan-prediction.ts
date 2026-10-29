/**
 * Loan Prediction Types
 */

export interface LoanPredictionResult {
  applicationId?: string;
  approvalScore: number; // 0-100
  approvalProbability: number; // 0-1.0
  maxApprovableAmount: number;
  recommendedTenure: number;
  estimatedMonthlyEmi: number;
  riskCategory: 'low' | 'medium' | 'high';
  riskScore: number; // 0-100
  incomeStability: 'high' | 'medium' | 'low';
  emiCapacity: number; // %
  debtToIncomeRatio: number; // %
  positiveFactors: string[];
  negativeFactors: string[];
  decision: 'approve' | 'conditional' | 'reject';
  decisionReason: string;
  recommendations: string[];
  confidence: number; // 0-100
  modelVersion: string;
  predictedAt: Date;
}

export interface PredictionResponse {
  success: boolean;
  data: LoanPredictionResult;
}

export interface QuickEstimateRequest {
  monthlyIncome: number;
  existingEmi?: number;
  creditScore?: number;
  employmentType?: string;
  loanAmount: number;
}

export interface QuickEstimate {
  approvalScore: number;
  approvalProbability: number;
  maxApprovableAmount: number;
  estimatedMonthlyEmi: number;
  riskCategory: 'low' | 'medium' | 'high';
  decision: 'approve' | 'conditional' | 'reject';
}

export interface ScenarioComparison {
  scenario: {
    loanAmount: number;
    tenure?: number;
    purpose?: string;
  };
  prediction: LoanPredictionResult;
}
