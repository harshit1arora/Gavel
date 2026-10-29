/**
 * Gavel AI: API Service Layer
 * Centralizes all B2C API calls to the backend
 */

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.trygavel.com';
const PUBLIC_BASE = `${API_BASE}/v1/public`;

interface PredictionRequest {
  monthlyIncome: number;
  existingEmi?: number;
  creditScore?: number;
  employmentType?: string;
  loanAmount: number;
  loanTenure?: number;
  age?: number;
}

export interface PredictionResult {
  approvalScore: number;
  approvalProbability: number;
  status: 'High' | 'Medium' | 'Low';
  decision: 'approve' | 'conditional' | 'reject';
  riskCategory: 'low' | 'medium' | 'high';
  message: string;
  tips: string[];
  positiveFactors: string[];
  negativeFactors: string[];
  maxApprovableAmount: number;
  estimatedMonthlyEmi: number;
  estimatedInterestRate: number;
  debtToIncomeRatio: number;
  emiCapacity: number;
  confidence: number;
  modelVersion: string;
  predictedAt: string;
}

export interface LenderOffer {
  lenderId: string;
  lenderName: string;
  lenderCategory: string;
  logoUrl: string;
  eligibilityScore: number;
  estimatedApprovalProbability: number;
  estimatedInterestRate: number;
  estimatedMonthlyEmi: number;
  estimatedProcessingFee: number;
  estimatedTurnaroundDays: number;
  matchScore: number;
  reasons: string[];
}

export interface LoanType {
  type: string;
  description: string;
  icon: string;
  offers: LenderOffer[];
}

export interface LenderMatchResult {
  totalOffers: number;
  loanTypes: LoanType[];
  bestOffer: LenderOffer | null;
  userProfile: any;
}

export interface ScenarioResult {
  scenario: { loanAmount: number; tenure: number; label: string };
  approvalScore: number;
  estimatedEmi: number;
  estimatedRate: number;
  totalInterest: number;
  totalPayable: number;
  status: 'High' | 'Medium' | 'Low';
}

export interface InterestRateResult {
  rates: Array<{
    lenderName: string;
    lenderCategory: string;
    rate: number;
    emi: number;
    processingFee: number;
    turnaroundDays: number;
  }>;
  averageRate: number;
  bestRate: number;
  eligibleLenders: number;
}

/**
 * Get loan approval prediction
 */
export async function getPrediction(data: PredictionRequest): Promise<PredictionResult> {
  try {
    const response = await fetch(`${PUBLIC_BASE}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Prediction failed: ${response.status}`);
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.warn('Backend prediction unavailable, using local fallback:', error);
    return getLocalPrediction(data);
  }
}

/**
 * Match user with lenders
 */
export async function matchLenders(data: {
  monthlyIncome: number;
  existingEmi?: number;
  creditScore: number;
  employmentType?: string;
  loanAmount: number;
  tenure?: number;
  age?: number;
}): Promise<LenderMatchResult> {
  try {
    const response = await fetch(`${PUBLIC_BASE}/lenders/match`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) throw new Error(`Lender matching failed: ${response.status}`);
    const result = await response.json();
    return result.data;
  } catch (error) {
    console.warn('Backend lender matching unavailable, using local fallback:', error);
    return getLocalLenderMatch(data);
  }
}

/**
 * Compare loan scenarios
 */
export async function compareScenarios(data: {
  monthlyIncome: number;
  existingEmi?: number;
  creditScore?: number;
  employmentType?: string;
  age?: number;
  scenarios: Array<{ loanAmount: number; tenure?: number; label?: string }>;
}): Promise<ScenarioResult[]> {
  try {
    const response = await fetch(`${PUBLIC_BASE}/scenarios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) throw new Error(`Scenario comparison failed: ${response.status}`);
    const result = await response.json();
    return result.data;
  } catch (error) {
    console.warn('Backend scenarios unavailable, using local fallback:', error);
    return getLocalScenarios(data);
  }
}

/**
 * Get interest rate estimates
 */
export async function getInterestRates(data: {
  monthlyIncome: number;
  creditScore: number;
  loanAmount: number;
  tenure?: number;
  employmentType?: string;
}): Promise<InterestRateResult> {
  try {
    const response = await fetch(`${PUBLIC_BASE}/lenders/interest-rates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) throw new Error(`Rate estimation failed: ${response.status}`);
    const result = await response.json();
    return result.data;
  } catch (error) {
    console.warn('Backend rate estimation unavailable, using local fallback:', error);
    return getLocalRates(data);
  }
}

// ── Local Fallback Functions (same logic as backend, runs in browser) ──

function getLocalPrediction(data: PredictionRequest): PredictionResult {
  const safeIncome = Math.max(data.monthlyIncome, 1);
  const existingEmi = data.existingEmi || 0;
  const creditScore = data.creditScore || 700;
  const employmentType = data.employmentType || 'salaried';
  const dtiRatio = (existingEmi / safeIncome) * 100;
  const yearlyIncome = safeIncome * 12;
  const loanToIncomeRatio = data.loanAmount / yearlyIncome;
  const availableIncome = Math.max(0, safeIncome - existingEmi);
  const maxNewEmiCapacity = availableIncome * 0.40;

  let approvalScore = 0;

  if (creditScore >= 750) approvalScore += 30;
  else if (creditScore >= 720) approvalScore += 25;
  else if (creditScore >= 700) approvalScore += 20;
  else if (creditScore >= 650) approvalScore += 12;
  else if (creditScore >= 600) approvalScore += 5;
  else approvalScore -= 5;

  if (dtiRatio < 20) approvalScore += 25;
  else if (dtiRatio < 30) approvalScore += 20;
  else if (dtiRatio < 40) approvalScore += 15;
  else if (dtiRatio < 50) approvalScore += 8;
  else if (dtiRatio < 60) approvalScore += 3;
  else approvalScore -= 10;

  if (employmentType === 'salaried') approvalScore += 15;
  else if (employmentType === 'business') approvalScore += 10;
  else if (employmentType === 'self_employed') approvalScore += 8;
  else approvalScore += 3;

  if (loanToIncomeRatio <= 0.5) approvalScore += 15;
  else if (loanToIncomeRatio <= 1.0) approvalScore += 12;
  else if (loanToIncomeRatio <= 2.0) approvalScore += 8;
  else if (loanToIncomeRatio <= 3.0) approvalScore += 3;
  else approvalScore -= 10;

  const age = data.age || 30;
  if (age >= 25 && age <= 45) approvalScore += 5;
  else if (age >= 22 && age <= 55) approvalScore += 3;
  else approvalScore += 1;

  if (safeIncome >= 100000) approvalScore += 10;
  else if (safeIncome >= 50000) approvalScore += 8;
  else if (safeIncome >= 30000) approvalScore += 5;
  else if (safeIncome >= 20000) approvalScore += 2;
  else approvalScore -= 5;

  if (creditScore < 550) approvalScore = Math.min(approvalScore, 15);
  if (dtiRatio > 80) approvalScore = Math.min(approvalScore, 20);
  if (safeIncome < 12000) approvalScore = Math.min(approvalScore, 25);

  approvalScore = Math.min(98, Math.max(8, approvalScore));

  const approvalProbability = Math.round(
    (1 / (1 + Math.exp(-0.08 * (approvalScore - 45)))) * 100
  ) / 100;

  let status: 'High' | 'Medium' | 'Low';
  let decision: 'approve' | 'conditional' | 'reject';
  let riskCategory: 'low' | 'medium' | 'high';

  if (approvalScore >= 70) {
    decision = 'approve'; riskCategory = 'low'; status = 'High';
  } else if (approvalScore >= 45) {
    decision = 'conditional'; riskCategory = 'medium'; status = 'Medium';
  } else {
    decision = 'reject'; riskCategory = 'high'; status = 'Low';
  }

  const loanTenure = data.loanTenure || 60;
  const estimatedRate = creditScore >= 750 ? 10.5: creditScore >= 700 ? 12.0: creditScore >= 650 ? 14.0: 16.0;
  const mRate = estimatedRate / 100 / 12;
  const estimatedEmi = mRate > 0
    ? Math.round((data.loanAmount * mRate * Math.pow(1 + mRate, loanTenure)) / (Math.pow(1 + mRate, loanTenure) - 1))
: Math.round(data.loanAmount / loanTenure);

  const monthlyRate = 0.01;
  const maxEmiBasedLoan = maxNewEmiCapacity > 0
    ? maxNewEmiCapacity * ((Math.pow(1 + monthlyRate, loanTenure) - 1) / (monthlyRate * Math.pow(1 + monthlyRate, loanTenure)))
: 0;
  let maxApprovableAmount = Math.round(maxEmiBasedLoan);
  if (riskCategory === 'high') maxApprovableAmount = Math.round(maxApprovableAmount * 0.5);
  else if (riskCategory === 'medium') maxApprovableAmount = Math.round(maxApprovableAmount * 0.75);

  const positiveFactors: string[] = [];
  const negativeFactors: string[] = [];
  const tips: string[] = [];

  if (creditScore >= 750) positiveFactors.push('Excellent credit score (750+)');
  else if (creditScore >= 700) positiveFactors.push('Good credit score');
  else negativeFactors.push('Credit score below 700');

  if (dtiRatio < 30) positiveFactors.push('Healthy debt-to-income ratio');
  else if (dtiRatio > 50) negativeFactors.push('High debt-to-income ratio');

  if (employmentType === 'salaried') positiveFactors.push('Salaried employment');
  if (safeIncome >= 50000) positiveFactors.push('Strong monthly income');
  else if (safeIncome < 25000) negativeFactors.push('Income below ₹25,000/month');

  if (status === 'High') {
    tips.push('Compare lenders to lock in the lowest interest rate');
    tips.push('Keep all documents ready for expedited processing');
  } else if (status === 'Medium') {
    tips.push('Pay off existing EMIs to lower your Debt-to-Income ratio');
    tips.push('Try reducing your requested loan amount by 20-30%');
  } else {
    tips.push('Focus on improving your credit score above 700');
    tips.push('Consider applying with a co-applicant');
    tips.push('Reduce existing debts before applying');
  }

  const message = status === 'High'
    ? 'Excellent odds! You are highly likely to be approved with competitive rates.'
: status === 'Medium'
    ? 'Fair odds. Optimize your profile for better terms.'
: 'Challenging odds. Follow our improvement plan below.';

  return {
    approvalScore,
    approvalProbability,
    status,
    decision,
    riskCategory,
    message,
    tips,
    positiveFactors,
    negativeFactors,
    maxApprovableAmount,
    estimatedMonthlyEmi: estimatedEmi,
    estimatedInterestRate: estimatedRate,
    debtToIncomeRatio: Math.round(dtiRatio * 10) / 10,
    emiCapacity: Math.round((maxNewEmiCapacity / safeIncome) * 100),
    confidence: 85,
    modelVersion: '2.0-local',
    predictedAt: new Date().toISOString(),
  };
}

function getLocalLenderMatch(data: any): LenderMatchResult {
  const lenders = [
    { id: 'hdfc', name: 'HDFC Bank', category: 'bank', minScore: 700, minIncome: 30000, maxEmiPct: 50, rateRange: [10.5, 15.0], fee: 0.5, days: 3, approval: 0.85 },
    { id: 'bajaj', name: 'Bajaj Finserv', category: 'nbfc', minScore: 650, minIncome: 25000, maxEmiPct: 60, rateRange: [11.0, 16.0], fee: 1.0, days: 1, approval: 0.88 },
    { id: 'icici', name: 'ICICI Bank', category: 'bank', minScore: 700, minIncome: 30000, maxEmiPct: 50, rateRange: [10.75, 16.0], fee: 0.5, days: 3, approval: 0.82 },
    { id: 'tata', name: 'Tata Capital', category: 'nbfc', minScore: 680, minIncome: 25000, maxEmiPct: 55, rateRange: [10.99, 16.0], fee: 1.5, days: 2, approval: 0.80 },
    { id: 'kotak', name: 'Kotak Mahindra', category: 'bank', minScore: 720, minIncome: 30000, maxEmiPct: 45, rateRange: [10.99, 14.0], fee: 0.5, days: 4, approval: 0.78 },
    { id: 'moneytap', name: 'MoneyTap', category: 'fintech', minScore: 600, minIncome: 20000, maxEmiPct: 65, rateRange: [13.0, 24.0], fee: 2.0, days: 1, approval: 0.72 },
    { id: 'sbi', name: 'State Bank of India', category: 'bank', minScore: 700, minIncome: 25000, maxEmiPct: 50, rateRange: [11.0, 14.0], fee: 0.5, days: 5, approval: 0.80 },
  ];

  const creditScore = data.creditScore || 700;
  const monthlyIncome = data.monthlyIncome;
  const existingEmi = data.existingEmi || 0;
  const emiRatio = (existingEmi / monthlyIncome) * 100;

  const offers: LenderOffer[] = [];

  for (const l of lenders) {
    if (creditScore < l.minScore || monthlyIncome < l.minIncome || emiRatio > l.maxEmiPct) continue;

    let eligScore = 50;
    eligScore += Math.min(30, ((creditScore - l.minScore) / (900 - l.minScore)) * 30);
    eligScore += Math.min(20, (monthlyIncome / l.minIncome) * 5);
    eligScore = Math.min(100, Math.max(0, Math.round(eligScore)));

    const prob = Math.round((1 / (1 + Math.exp(-0.1 * (eligScore - 50)))) * l.approval * 100) / 100;

    const creditFactor = (creditScore - 600) / 300;
    const adj = (l.rateRange[1] - l.rateRange[0]) * (1 - creditFactor) / 2;
    let rate = (l.rateRange[0] + l.rateRange[1]) / 2 - adj;
    rate = Math.min(l.rateRange[1], Math.max(l.rateRange[0], Math.round(rate * 100) / 100));

    const mRate = rate / 100 / 12;
    const tenure = data.tenure || 60;
    const emi = mRate > 0
      ? Math.round((data.loanAmount * mRate * Math.pow(1 + mRate, tenure)) / (Math.pow(1 + mRate, tenure) - 1))
: Math.round(data.loanAmount / tenure);

    const matchScore = Math.round(eligScore * 0.4 + prob * 100 * 0.3 + l.approval * 100 * 0.2 + Math.max(0, 100 - l.days * 5) * 0.1);

    const reasons: string[] = [];
    if (creditScore >= 750) reasons.push('Excellent credit score');
    if (emiRatio < 20) reasons.push('Low existing debt');
    if (l.days <= 2) reasons.push('Quick disbursement');
    if (l.approval >= 0.85) reasons.push('High approval rate');

    offers.push({
      lenderId: l.id,
      lenderName: l.name,
      lenderCategory: l.category,
      logoUrl: `/banks/${l.id}.svg`,
      eligibilityScore: eligScore,
      estimatedApprovalProbability: prob,
      estimatedInterestRate: rate,
      estimatedMonthlyEmi: emi,
      estimatedProcessingFee: Math.round(data.loanAmount * l.fee / 100),
      estimatedTurnaroundDays: l.days,
      matchScore,
      reasons: reasons.slice(0, 3),
    });
  }

  offers.sort((a, b) => b.matchScore - a.matchScore);

  return {
    totalOffers: offers.length,
    loanTypes: [{
      type: 'Personal Loan',
      description: 'Unsecured loan for any purpose',
      icon: 'user',
      offers,
    }],
    bestOffer: offers[0] || null,
    userProfile: data,
  };
}

function getLocalScenarios(data: any): ScenarioResult[] {
  return data.scenarios.map((s: any) => {
    const pred = getLocalPrediction({
      monthlyIncome: data.monthlyIncome,
      existingEmi: data.existingEmi,
      creditScore: data.creditScore,
      employmentType: data.employmentType,
      loanAmount: s.loanAmount,
      loanTenure: s.tenure || 60,
    });

    const tenure = s.tenure || 60;
    return {
      scenario: {
        loanAmount: s.loanAmount,
        tenure,
        label: s.label || `₹${(s.loanAmount / 100000).toFixed(1)}L × ${tenure}mo`,
      },
      approvalScore: pred.approvalScore,
      estimatedEmi: pred.estimatedMonthlyEmi,
      estimatedRate: pred.estimatedInterestRate,
      totalInterest: pred.estimatedMonthlyEmi * tenure - s.loanAmount,
      totalPayable: pred.estimatedMonthlyEmi * tenure,
      status: pred.status,
    };
  });
}

function getLocalRates(data: any): InterestRateResult {
  const match = getLocalLenderMatch(data);
  const offers = match.loanTypes[0]?.offers || [];

  const rates = offers.map(o => ({
    lenderName: o.lenderName,
    lenderCategory: o.lenderCategory,
    rate: o.estimatedInterestRate,
    emi: o.estimatedMonthlyEmi,
    processingFee: o.estimatedProcessingFee,
    turnaroundDays: o.estimatedTurnaroundDays,
  }));

  return {
    rates,
    averageRate: rates.length > 0 ? Math.round((rates.reduce((s, r) => s + r.rate, 0) / rates.length) * 100) / 100: 0,
    bestRate: rates.length > 0 ? Math.min(...rates.map(r => r.rate)): 0,
    eligibleLenders: rates.length,
  };
}

// ── Save & Resume Utilities ──

const STORAGE_KEY = 'gavel_loan_application';

export interface SavedApplication {
  income: number;
  loanAmount: number;
  creditScore: number;
  emi: number;
  employmentType: string;
  age?: number;
  tenure?: number;
  savedAt: string;
  lastPrediction?: PredictionResult;
}

export function saveApplication(data: SavedApplication): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({...data, savedAt: new Date().toISOString() }));
  } catch (e) {
    console.warn('Failed to save application:', e);
  }
}

export function loadApplication(): SavedApplication | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored): null;
  } catch (e) {
    return null;
  }
}

export function clearSavedApplication(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.warn('Failed to clear saved application:', e);
  }
}

export function hasSavedApplication(): boolean {
  return !!localStorage.getItem(STORAGE_KEY);
}
