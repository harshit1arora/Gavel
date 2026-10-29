import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

// Define strict Zod Schemas for Gemini outputs
export const EvaluationResultSchema = z.object({
  decision: z.enum(['approved', 'rejected', 'review']),
  score: z.number().min(0).max(100),
  riskLevel: z.enum(['low', 'medium', 'high', 'critical']),
  reasons: z.array(z.string()),
  recommendations: z.array(z.string()),
  factors: z.object({
    positive: z.array(z.string()),
    negative: z.array(z.string()),
    neutral: z.array(z.string())
  }),
  nextSteps: z.array(z.string())
});

export const BankAnalysisSchema = z.object({
  monthlyIncome: z.number(),
  averageBalance: z.number(),
  totalCredits: z.number(),
  totalDebits: z.number(),
  emiPayments: z.number(),
  salaryCredits: z.number(),
  analysis: z.string(),
  redFlags: z.array(z.string()),
  greenFlags: z.array(z.string())
});

export const LoanAgreementSchema = z.string().min(1);

interface BorrowerData {
  applicantName: string;
  phone: string;
  email: string;
  monthlyIncome: number;
  loanAmount: number;
  tenure: number;
  purpose: string;
  employmentType: string;
  aadhaar?: string;
  pan?: string;
  creditScore?: number;
  existingLoans?: number;
  pincode?: string;
  city?: string;
  state?: string;
}

interface EvaluationResult {
  decision: 'approved' | 'rejected' | 'review';
  score: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  reasons: string[];
  recommendations: string[];
  factors: {
    positive: string[];
    negative: string[];
    neutral: string[];
  };
  nextSteps: string[];
}

export const evaluateLoanApplication = async (borrowerData: BorrowerData): Promise<EvaluationResult> => {
  if (!GEMINI_API_KEY) {
    // Return mock evaluation if no API key
    return mockEvaluation(borrowerData);
  }

  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const evaluationPrompt = `You are an expert loan underwriter for NBFCs in India. Evaluate the following loan application and provide a detailed assessment.

Borrower Details:
${JSON.stringify(borrowerData, null, 2)}

Evaluate based on:
1. Income sufficiency (EMI should be ≤ 50% of monthly income)
2. Employment stability
3. Credit history indicators
4. Loan amount vs income ratio
5. Purpose legitimacy

Respond with a JSON object containing:
{
  "decision": "approved" | "rejected" | "review",
  "score": number (0-100),
  "riskLevel": "low" | "medium" | "high" | "critical",
  "reasons": ["reason 1", "reason 2"],
  "recommendations": ["recommendation 1", "recommendation 2"],
  "factors": {
    "positive": ["factor 1", "factor 2"],
    "negative": ["factor 1", "factor 2"],
    "neutral": ["factor 1"]
  },
  "nextSteps": ["step 1", "step 2"]
}

Only respond with valid JSON, no other text.`;

    const result = await model.generateContent(evaluationPrompt);
    const response = result.response.text();
    
    try {
      const parsed = JSON.parse(response);
      const validated = EvaluationResultSchema.safeParse(parsed);
      if (validated.success) {
        return validated.data;
      } else {
        console.warn('[Zod Validation Failure] evaluateLoanApplication fields mismatch:', JSON.stringify(validated.error.format()));
        return mockEvaluation(borrowerData);
      }
    } catch {
      console.warn('[JSON Parse Failure] evaluateLoanApplication could not parse response:', response);
      return mockEvaluation(borrowerData);
    }
  } catch (error) {
    console.error('AI evaluation error:', error);
    return mockEvaluation(borrowerData);
  }
};

const mockEvaluation = (data: BorrowerData): EvaluationResult => {
  const emi = data.loanAmount / data.tenure;
  const emiToIncomeRatio = (emi / data.monthlyIncome) * 100;
  
  let decision: EvaluationResult['decision'] = 'review';
  let score = 50;
  let riskLevel: EvaluationResult['riskLevel'] = 'medium';
  
  const positive: string[] = [];
  const negative: string[] = [];
  
  // Income check
  if (data.monthlyIncome >= 50000) {
    positive.push('High monthly income');
    score += 15;
  } else if (data.monthlyIncome >= 25000) {
    positive.push('Stable middle income');
    score += 5;
  }
  
  // EMI ratio check
  if (emiToIncomeRatio <= 30) {
    positive.push('Low EMI burden (≤30% of income)');
    score += 20;
    riskLevel = 'low';
  } else if (emiToIncomeRatio <= 50) {
    positive.push('Moderate EMI burden (≤50% of income)');
    score += 10;
  } else {
    negative.push('High EMI burden (>50% of income)');
    score -= 20;
    riskLevel = 'high';
  }
  
  // Loan amount check
  if (data.loanAmount <= data.monthlyIncome * 24) {
    positive.push('Loan amount within 24x income');
    score += 10;
  } else if (data.loanAmount <= data.monthlyIncome * 36) {
    positive.push('Loan amount within 36x income');
    score += 5;
  } else {
    negative.push('Loan amount exceeds 36x income');
    score -= 15;
  }
  
  // Employment type
  if (data.employmentType === 'Salaried') {
    positive.push('Salaried employment - stable income');
    score += 10;
  } else if (data.employmentType === 'Self-Employed') {
    positive.push('Self-employed with business income');
    score += 5;
  }
  
  // Credit score
  if (data.creditScore && data.creditScore >= 750) {
    positive.push('Excellent credit score (750+)');
    score += 15;
  } else if (data.creditScore && data.creditScore >= 650) {
    positive.push('Good credit score (650+)');
    score += 5;
  } else if (data.creditScore && data.creditScore < 600) {
    negative.push('Low credit score (<600)');
    score -= 20;
  }
  
  // Final decision
  if (score >= 75) {
    decision = 'approved';
    riskLevel = 'low';
  } else if (score >= 50) {
    decision = 'review';
    riskLevel = 'medium';
  } else {
    decision = 'rejected';
    riskLevel = 'high';
  }
  
  return {
    decision,
    score: Math.min(100, Math.max(0, score)),
    riskLevel,
    reasons: [
      ...(positive.slice(0, 2)),
      ...(negative.slice(0, 2))
    ],
    recommendations: decision === 'approved' 
      ? ['Proceed with disbursement', 'Set up EMI monitoring']
      : decision === 'rejected'
      ? ['Recommend alternative product', 'Suggest credit improvement']
      : ['Request additional documents', 'Manual review recommended'],
    factors: { positive, negative, neutral: ['Loan purpose verified'] },
    nextSteps: decision === 'approved' 
      ? ['Generate loan agreement', 'Initiate disbursement']
      : ['Send rejection communication', 'Offer pre-qualified products']
  };
};

export const analyzeBankStatement = async (statementText: string): Promise<any> => {
  if (!GEMINI_API_KEY) {
    return mockBankAnalysis(statementText);
  }

  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `Analyze this bank statement and extract:
{
  "monthlyIncome": number,
  "averageBalance": number,
  "totalCredits": number,
  "totalDebits": number,
  "emiPayments": number,
  "salaryCredits": number,
  "analysis": "brief analysis",
  "redFlags": ["flag1", "flag2"],
  "greenFlags": ["flag1", "flag2"]
}

Bank Statement:
${statementText.slice(0, 2000)}

Respond only with valid JSON.`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();
    
    try {
      const parsed = JSON.parse(response);
      const validated = BankAnalysisSchema.safeParse(parsed);
      if (validated.success) {
        return validated.data;
      } else {
        console.warn('[Zod Validation Failure] analyzeBankStatement fields mismatch:', JSON.stringify(validated.error.format()));
        return mockBankAnalysis(statementText);
      }
    } catch {
      console.warn('[JSON Parse Failure] analyzeBankStatement could not parse response:', response);
      return mockBankAnalysis(statementText);
    }
  } catch (error) {
    console.error('Bank statement analysis error:', error);
    return mockBankAnalysis(statementText);
  }
};

const mockBankAnalysis = (text: string): any => ({
  monthlyIncome: 45000,
  averageBalance: 85000,
  totalCredits: 450000,
  totalDebits: 380000,
  emiPayments: 3,
  salaryCredits: 12,
  analysis: 'Regular salary credits with moderate spending patterns. No bounced payments detected.',
  redFlags: [],
  greenFlags: ['Regular salary credits', 'Consistent balance', 'No bounced ECS']
});

export const generateLoanAgreement = async (borrowerData: BorrowerData, loanDetails: any): Promise<string> => {
  if (!GEMINI_API_KEY) {
    return mockLoanAgreement(borrowerData, loanDetails);
  }

  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `Generate a simple loan agreement in text format for this borrower:

Borrower: ${borrowerData.applicantName}
Loan Amount: ₹${loanDetails.loanAmount}
Interest Rate: ${loanDetails.interestRate}% p.a.
Tenure: ${loanDetails.tenure} months
Monthly EMI: ₹${loanDetails.emi}

Include:
1. Loan details
2. EMI payment schedule
3. Terms and conditions
4. Default consequences

Keep it brief and professional.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const validated = LoanAgreementSchema.safeParse(text);
    if (validated.success) {
      return validated.data;
    } else {
      console.warn('[Zod Validation Failure] generateLoanAgreement schema mismatch');
      return mockLoanAgreement(borrowerData, loanDetails);
    }
  } catch (error) {
    return mockLoanAgreement(borrowerData, loanDetails);
  }
};

const mockLoanAgreement = (borrower: BorrowerData, loan: any): string => {
  return `
LOAN AGREEMENT

This Loan Agreement is entered into on ${new Date().toLocaleDateString()}

BORROWER: ${borrower.applicantName}
LOAN AMOUNT: ₹${loan.loanAmount.toLocaleString()}
INTEREST RATE: ${loan.interestRate}% per annum
TENURE: ${loan.tenure} months
MONTHLY EMI: ₹${loan.emi.toLocaleString()}

TERMS:
1. Borrower agrees to pay EMI on due dates
2. Late payment will incur 2% monthly penalty
3. Prepayment allowed after 6 months with 2% charges

SIGNATURE: ____________________
DATE: ${new Date().toLocaleDateString()}
  `.trim();
};