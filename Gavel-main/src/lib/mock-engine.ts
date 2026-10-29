// Contract types are single-sourced in./underwriting-types and re-exported
// here so existing imports (`from '@/lib/mock-engine'`) keep working.
import type {
  DecisionType,
  AnalysisResult,
  Reason,
  Rule,
  ErrorResult,
} from './underwriting-types';

export type { DecisionType, AnalysisResult, Reason, Rule, ErrorResult };

export interface Persona {
  id: string;
  label: string;
  name: string;
  income: number;
  description: string;
  expected: DecisionType;
  badge: string;
}

const delay = (ms: number) =>
  new Promise(r => setTimeout(r, ms));

const jitter = (base: number, v: number) =>
  Math.round(base + (Math.random() - 0.5) * v);

export const PERSONAS: Persona[] = [
  {
    id: 'strong',
    label: 'Strong Borrower',
    badge: '✅',
    name: 'Rajesh Kumar',
    income: 44800,
    description: 'Salaried, HDFC, 6 months stable',
    expected: 'APPROVE',
  },
  {
    id: 'highrisk',
    label: 'High Risk',
    badge: '❌',
    name: 'Priya Sharma',
    income: 38000,
    description: 'High EMI burden, irregular credits',
    expected: 'REJECT',
  },
  {
    id: 'review',
    label: 'Review Case',
    badge: '⚠️',
    name: 'Amit Verma',
    income: 31000,
    description: 'Self-employed, volatile cashflow',
    expected: 'REVIEW',
  },
  {
    id: 'threshold',
    label: 'Below Threshold',
    badge: '❌',
    name: 'Sunita Devi',
    income: 16500,
    description: 'Income below ₹20k minimum',
    expected: 'REJECT',
  },
  {
    id: 'insufficient',
    label: 'Insufficient Data',
    badge: '⚠️',
    name: 'Karan Mehta',
    income: 0,
    description: 'Only 1 month of bank data',
    expected: 'REJECT',
  },
];

export const PAYLOADS: Record<string, object> = {
  strong: {
    applicant: {
      name: 'Rajesh Kumar',
      pan: 'ABCPK1234D',
      monthly_income_declared: 45000,
    },
    bank_statement: {
      account_number: 'XXXX4521',
      bank: 'HDFC',
      period: '6 months',
      transactions: [
        { date: '2024-01-03', description: 'SALARY CREDIT - INFOSYS LTD', amount: 44800, type: 'credit', balance: 52300 },
        { date: '2024-01-07', description: 'EMI PAYMENT - BAJAJ FINANCE', amount: -8500, type: 'debit', balance: 43800 },
        { date: '2024-01-15', description: 'UPI - SWIGGY', amount: -340, type: 'debit', balance: 43460 },
      ],
    },
    loan_request: {
      amount: 200000,
      tenure_months: 24,
      purpose: 'business_expansion',
    },
  },
  highrisk: {
    applicant: {
      name: 'Priya Sharma',
      pan: 'XYZPS5678K',
      monthly_income_declared: 38000,
    },
    bank_statement: {
      account_number: 'XXXX8832',
      bank: 'SBI',
      period: '6 months',
      transactions: [
        { date: '2024-01-05', description: 'SALARY NEFT', amount: 38000, type: 'credit', balance: 12000 },
        { date: '2024-01-06', description: 'EMI - HDFC BANK', amount: -15000, type: 'debit', balance: 0 },
        { date: '2024-01-08', description: 'EMI - FULLERTON', amount: -12400, type: 'debit', balance: 0 },
      ],
    },
    loan_request: {
      amount: 300000,
      tenure_months: 36,
      purpose: 'personal',
    },
  },
  review: {
    applicant: {
      name: 'Amit Verma',
      pan: 'MNOPV9012R',
      monthly_income_declared: 35000,
    },
    bank_statement: {
      account_number: 'XXXX2291',
      bank: 'ICICI',
      period: '6 months',
      transactions: [
        { date: '2024-01-10', description: 'TRANSFER CREDIT', amount: 55000, type: 'credit', balance: 61000 },
        { date: '2024-02-12', description: 'CLIENT PAYMENT', amount: 18000, type: 'credit', balance: 22000 },
        { date: '2024-03-08', description: 'BUSINESS RECEIPT', amount: 42000, type: 'credit', balance: 48000 },
      ],
    },
    loan_request: {
      amount: 150000,
      tenure_months: 18,
      purpose: 'working_capital',
    },
  },
  threshold: {
    applicant: {
      name: 'Sunita Devi',
      pan: 'PQRSD3456T',
      monthly_income_declared: 16000,
    },
    bank_statement: {
      account_number: 'XXXX6610',
      bank: 'PNB',
      period: '6 months',
      transactions: [
        { date: '2024-01-01', description: 'SALARY', amount: 16500, type: 'credit', balance: 4200 },
      ],
    },
    loan_request: {
      amount: 50000,
      tenure_months: 12,
      purpose: 'personal',
    },
  },
  insufficient: {
    applicant: {
      name: 'Karan Mehta',
      pan: 'ABCKM7890Z',
      monthly_income_declared: 40000,
    },
    bank_statement: {
      account_number: 'XXXX3301',
      bank: 'AXIS',
      period: '1 month',
      transactions: [
        { date: '2024-01-02', description: 'SALARY CREDIT', amount: 40000, type: 'credit', balance: 41000 },
      ],
    },
    loan_request: {
      amount: 100000,
      tenure_months: 12,
      purpose: 'education',
    },
  },
};

export const TERMINAL_LINES = [
  '> Gavel Engine v2.1.0 initialized',
  '> 24 underwriting policies loaded',
  '> RBI compliance mode: active',
  '> Sandbox environment ready',
  '> Awaiting transaction data...',
];

export const PROCESSING_LINES = [
  '> Parsing bank statement...',
  '> Detecting income patterns...',
  '> Running 24 policy rules...',
  '> Calculating risk score...',
  '> Generating audit record...',
  '> Decision ready.',
];

export async function runAnalysis(personaId: string): Promise<AnalysisResult> {
  const auditId = `gavel_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

  await delay(jitter(1400, 400));

  if (personaId === 'insufficient') {
    return {
      decision: 'REJECT',
      credit_limit: 0,
      risk_score: 0,
      confidence: 1,
      processing_time_ms: jitter(980, 150),
      engine_version: '2.1.0',
      audit_id: auditId,
      reasons: [],
      rules_fired: [],
      flags: [],
      error: {
        code: 'E001',
        message: 'Insufficient transaction history',
        detail: 'Minimum 3 months of bank statement required. Only 1 month detected in submitted data. Request a full 6-month statement from applicant.',
      },
    };
  }

  if (personaId === 'strong') {
    return {
      decision: 'APPROVE',
      credit_limit: 240000,
      risk_score: jitter(72, 3),
      confidence: 0.94,
      processing_time_ms: jitter(1240, 200),
      engine_version: '2.1.0',
      audit_id: auditId,
      flags: [],
      reasons: [
        { code: 'STABLE_INCOME', label: 'Stable Monthly Income', weight: 0.35, sentiment: 'positive', detail: '6 consecutive salary credits from verified employer' },
        { code: 'LOW_EMI_RATIO', label: 'Healthy Debt-to-Income Ratio', weight: 0.28, sentiment: 'positive', detail: 'EMI obligations at 18.9% of income (threshold: 50%)' },
        { code: 'POSITIVE_BALANCE', label: 'Consistent Positive Balance', weight: 0.22, sentiment: 'positive', detail: 'Average end-of-month balance ₹43,200' },
        { code: 'EMPLOYER_VERIFIED', label: 'Employer Credit Verified', weight: 0.15, sentiment: 'positive', detail: 'INFOSYS LTD, recognized employer, stable sector' },
      ],
      rules_fired: [
        { id: 'R001', name: 'Minimum Income Check', condition: 'income >= 20000', result: true, skipped: false },
        { id: 'R007', name: 'EMI Ratio Acceptable', condition: 'emi_ratio <= 0.50', result: true, skipped: false },
        { id: 'R012', name: 'Salary Regularity', condition: 'salary_credits >= 3 of last 6', result: true, skipped: false },
        { id: 'R019', name: 'Self Employment Flag', condition: 'income_type = variable', result: false, skipped: true },
      ],
    };
  }

  if (personaId === 'highrisk') {
    return {
      decision: 'REJECT',
      credit_limit: 0,
      risk_score: jitter(28, 3),
      confidence: 0.91,
      processing_time_ms: jitter(1100, 150),
      engine_version: '2.1.0',
      audit_id: auditId,
      flags: ['HIGH_OBLIGATION_RATIO', 'LOW_RESIDUAL_BALANCE'],
      reasons: [
        { code: 'HIGH_EMI_RATIO', label: 'Excessive EMI Burden', weight: 0.45, sentiment: 'negative', detail: 'EMI obligations at 72.1% of income (threshold: 50%)' },
        { code: 'LOW_RESIDUAL', label: 'Near-Zero Residual Balance', weight: 0.35, sentiment: 'negative', detail: 'Average post-EMI balance ₹0, no buffer detected' },
        { code: 'MULTIPLE_EMIS', label: 'Multiple Active Loan EMIs', weight: 0.20, sentiment: 'negative', detail: '2 active EMI deductions detected in statement' },
      ],
      rules_fired: [
        { id: 'R001', name: 'Minimum Income Check', condition: 'income >= 20000', result: true, skipped: false },
        { id: 'R007', name: 'EMI Ratio Acceptable', condition: 'emi_ratio <= 0.50', result: false, skipped: false },
        { id: 'R014', name: 'Residual Balance Check', condition: 'avg_residual > 5000', result: false, skipped: false },
        { id: 'R021', name: 'Multiple EMI Flag', condition: 'emi_count <= 1', result: false, skipped: false },
      ],
    };
  }

  if (personaId === 'review') {
    return {
      decision: 'REVIEW',
      credit_limit: 120000,
      risk_score: jitter(54, 3),
      confidence: 0.71,
      processing_time_ms: jitter(1380, 200),
      engine_version: '2.1.0',
      audit_id: auditId,
      flags: ['SELF_EMPLOYED', 'IRREGULAR_INCOME'],
      reasons: [
        { code: 'IRREGULAR_INCOME', label: 'Irregular Income Pattern', weight: 0.38, sentiment: 'negative', detail: 'Credit amounts vary ₹18k–₹55k, non-salary pattern' },
        { code: 'ADEQUATE_VOLUME', label: 'Adequate Credit Volume', weight: 0.30, sentiment: 'positive', detail: 'Total 6-month credits ₹1,85,000, sufficient' },
        { code: 'SELF_EMPLOYED_FLAG', label: 'Self-Employment Detected', weight: 0.32, sentiment: 'neutral', detail: 'No consistent employer, manual review advised' },
      ],
      rules_fired: [
        { id: 'R001', name: 'Minimum Income Check', condition: 'income >= 20000', result: true, skipped: false },
        { id: 'R007', name: 'EMI Ratio Acceptable', condition: 'emi_ratio <= 0.50', result: true, skipped: false },
        { id: 'R019', name: 'Self Employment Flag', condition: 'income_type = variable', result: true, skipped: false },
        { id: 'R022', name: 'Volatility Check', condition: 'income_variance <= 0.3', result: false, skipped: false },
      ],
    };
  }

  // threshold
  return {
    decision: 'REJECT',
    credit_limit: 0,
    risk_score: jitter(18, 3),
    confidence: 0.99,
    processing_time_ms: jitter(820, 100),
    engine_version: '2.1.0',
    audit_id: auditId,
    flags: ['INCOME_BELOW_THRESHOLD'],
    reasons: [
      { code: 'INCOME_BELOW_MINIMUM', label: 'Income Below Minimum', weight: 1.0, sentiment: 'negative', detail: 'Detected income ₹16,500 below ₹20,000 minimum. Hard reject, no override possible.' },
    ],
    rules_fired: [
      { id: 'R001', name: 'Minimum Income Check', condition: 'income >= 20000', result: false, skipped: false },
    ],
  };
}
