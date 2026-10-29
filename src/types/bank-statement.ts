/**
 * Bank Statement Analysis Types
 */

export interface TransactionCategory {
  salary: number;
  emi: number;
  utilities: number;
  groceries: number;
  shopping: number;
  entertainment: number;
  transport: number;
  investments: number;
  insurance: number;
  healthcare: number;
  other: number;
}

export interface ParsedBankStatement {
  userId: string;
  applicationId: string;
  fileName: string;
  uploadedAt: Date;
  
  // Income Analysis
  monthlyRecurringIncome: number;
  incomeVariation: number;
  avgMonthlyIncome: number;
  
  // Expense Analysis
  monthlyRecurringExpenses: number;
  avgMonthlyExpense: number;
  variableExpenses: number;
  
  // EMI & Obligations
  existingEmiAmount: number;
  existingLoanCount: number;
  
  // Financial Health
  savingsRatio: number;
  emiToIncomeRatio: number;
  
  // Spending Breakdown
  spendingBreakdown: TransactionCategory;
  
  // Trends
  incomeStability: 'high' | 'medium' | 'low';
  spendingTrend: 'increasing' | 'stable' | 'decreasing';
  savingsTrend: 'improving' | 'stable' | 'deteriorating';
  
  // Red Flags & Signals
  redFlags: string[];
  positiveSignals: string[];
  
  // Raw Analysis
  transactionCount: number;
  analysisDataPoints: number;
  bankName?: string;
  accountType?: string;
  
  // Metadata
  parsedAt: Date;
  confidence: number;
}

export interface StatementAnalysisResponse {
  success: boolean;
  data: ParsedBankStatement;
}

export interface StatementSummary {
  monthlyRecurringIncome: number;
  avgMonthlyExpense: number;
  existingEmiAmount: number;
  savingsRatio: number;
  emiToIncomeRatio: number;
  incomeStability: 'high' | 'medium' | 'low';
  redFlags: string[];
  positiveSignals: string[];
  confidence: number;
}
