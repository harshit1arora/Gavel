import { db } from '../config/firebase';
import { fetchCreditReport } from './bureau-service';

export interface EvaluationInput {
  orgId: string;
  applicationId: string;
  borrowerId: string;
  borrowerName: string;
  pan: string;
  phone: string;
  email: string;
  address?: string;
  monthlyIncome?: number;
  monthlyExpense?: number;
  existingObligations?: number;
  loanAmount: number;
  loanTenor: number;
  loanType?: string;
  employmentType?: string;
  companyName?: string;
  yearsAtJob?: number;
  houseOwnership?: 'owned' | 'rented' | 'mortgage';
  vehicleOwned?: boolean;
  bankBalance?: number;
  bureauReportId?: string;
  bankStatementData?: {
    avgMonthlyBalance: number;
    avgMonthlyCredits: number;
    overdraftMonths: number;
    salaryCredits: number;
    emiReturns: number;
  };
}

export interface EvaluationOutput {
  evaluationId: string;
  applicationId: string;
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'E';
  decision: 'approve' | 'review' | 'decline' | 'manual';
  confidence: number;
  reasons: string[];
  positiveSignals: string[];
  riskSignals: string[];
  recommendedAmount: number;
  recommendedTenor: number;
  recommendedRate: number;
  emiAmount: number;
  dti: number;
  foir: number;
  bureauScore?: number;
  bureauScoreBand?: string;
  maxAffordableEMI: number;
  processingFee: number;
  riskFactors: Record<string, number>;
  modelVersion: string;
  evaluatedAt: Date;
}

interface FeatureVector {
  income: number;
  expense: number;
  obligations: number;
  loanAmount: number;
  tenor: number;
  bureauScore: number;
  dti: number;
  foir: number;
  employmentStability: number;
  residenceStability: number;
  creditDepth: number;
  creditUtilization: number;
  inquiryVelocity: number;
  delinquencyHistory: number;
  bankBehavior: number;
  affordabilityRatio: number;
}

function normalize(value: number, min: number, max: number): number {
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

function scoreEmployment(yearsAtJob: number, employmentType: string): number {
  let base = 0;
  
  if (employmentType === 'Salaried') base = 60;
  else if (employmentType === 'Self-Employed Professional') base = 50;
  else if (employmentType === 'Business Owner') base = 45;
  else if (employmentType === 'Freelancer') base = 30;
  else base = 40;

  const tenureBonus = Math.min(20, yearsAtJob * 4);
  return Math.min(100, base + tenureBonus);
}

function scoreResidence(ownership: string): number {
  switch (ownership) {
    case 'owned': return 100;
    case 'mortgage': return 80;
    case 'rented': return 50;
    default: return 40;
  }
}

function scoreBankBehavior(data: any): number {
  if (!data) return 50;

  let score = 50;

  if (data.overdraftMonths === 0) score += 20;
  else if (data.overdraftMonths <= 2) score += 5;
  else score -= 20;

  const balanceRatio = data.avgMonthlyBalance / (data.avgMonthlyCredits || 1);
  if (balanceRatio >= 1 && balanceRatio <= 5) score += 15;
  else if (balanceRatio > 0.5) score += 5;

  if (data.salaryCredits > 0) score += 10;

  if (data.emiReturns === 0) score += 5;
  else if (data.emiReturns > 2) score -= 15;

  return Math.max(0, Math.min(100, score));
}

function calculateFOIR(monthlyIncome: number, monthlyExpense: number, obligations: number, emi: number): number {
  const netIncome = monthlyIncome - monthlyExpense - obligations;
  if (netIncome <= 0) return 100;
  return Math.min(100, (emi / netIncome) * 100);
}

function calculateDTI(monthlyIncome: number, obligations: number): number {
  if (monthlyIncome <= 0) return 100;
  return Math.min(100, (obligations / monthlyIncome) * 100);
}

function calculateAffordability(loanAmount: number, monthlyIncome: number, tenor: number): number {
  const totalInterest = loanAmount * 0.15;
  const totalRepayment = loanAmount + totalInterest;
  const monthlyBurden = totalRepayment / tenor;
  
  if (monthlyIncome <= 0) return 0;
  const ratio = monthlyBurden / monthlyIncome;
  return Math.max(0, 1 - ratio);
}

function computeFeatureVector(input: EvaluationInput, bureauScore: number, bureauFields: any): FeatureVector {
  const monthlyIncome = input.monthlyIncome || 50000;
  const monthlyExpense = input.monthlyExpense || monthlyIncome * 0.5;
  const obligations = input.existingObligations || 0;

  const emi = calculateMonthlyEMI(input.loanAmount, 18, input.loanTenor || 24);
  const dti = calculateDTI(monthlyIncome, obligations);
  const foir = calculateFOIR(monthlyIncome, monthlyExpense, obligations, emi);

  const creditDepth = (bureauFields?.totalAccounts || 0) / 10;
  const creditUtilization = (bureauFields?.creditUtilization || 0) / 100;
  const inquiryVelocity = (bureauFields?.inquiriesLast90Days || 0) / 10;
  const delinquencyHistory = (bureauFields?.delinquentAccounts || 0) / 5;

  return {
    income: normalize(monthlyIncome, 10000, 500000),
    expense: normalize(monthlyExpense, 5000, 250000),
    obligations: normalize(obligations, 0, 100000),
    loanAmount: normalize(input.loanAmount, 10000, 2000000),
    tenor: normalize(input.loanTenor, 3, 60),
    bureauScore: normalize(bureauScore, 300, 900),
    dti: normalize(dti, 0, 100),
    foir: normalize(foir, 0, 100),
    employmentStability: scoreEmployment(input.yearsAtJob || 1, input.employmentType || 'Salaried') / 100,
    residenceStability: scoreResidence(input.houseOwnership || 'rented') / 100,
    creditDepth: normalize(creditDepth, 0, 1),
    creditUtilization: normalize(creditUtilization, 0, 1),
    inquiryVelocity: normalize(inquiryVelocity, 0, 1),
    delinquencyHistory: normalize(delinquencyHistory, 0, 1),
    bankBehavior: scoreBankBehavior(input.bankStatementData) / 100,
    affordabilityRatio: calculateAffordability(input.loanAmount, monthlyIncome, input.loanTenor || 24),
  };
}

function calculateMonthlyEMI(principal: number, annualRate: number, tenorMonths: number): number {
  const monthlyRate = annualRate / 12 / 100;
  if (monthlyRate === 0) return principal / tenorMonths;
  const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, tenorMonths)) / (Math.pow(1 + monthlyRate, tenorMonths) - 1);
  return Math.round(emi);
}

function runModel(features: FeatureVector): { score: number; factors: Record<string, number>; confidence: number } {
  const weights: Record<string, number> = {
    bureauScore: 0.25,
    dti: 0.15,
    foir: 0.12,
    affordabilityRatio: 0.10,
    employmentStability: 0.08,
    residenceStability: 0.06,
    income: 0.05,
    creditDepth: 0.05,
    bankBehavior: 0.05,
    delinquencyHistory: 0.04,
    loanAmount: 0.03,
    inquiryVelocity: 0.02,
  };

  let score = 0;
  let totalWeight = 0;
  const factors: Record<string, number> = {};

  for (const [key, weight] of Object.entries(weights)) {
    const value = features[key as keyof FeatureVector] as number;
    const contribution = value * weight;
    score += contribution;
    factors[key] = Math.round(value * 100);
    totalWeight += weight;
  }

  score = score / totalWeight * 100;
  score = Math.max(100, Math.min(900, score));

  let confidence = 0.7;
  if (features.bureauScore > 0.5 && features.income > 0.3) confidence += 0.15;
  if (features.creditDepth > 0.3) confidence += 0.1;
  if (features.delinquencyHistory > 0.5) confidence -= 0.2;
  confidence = Math.max(0.5, Math.min(0.99, confidence));

  return { score: Math.round(score), factors, confidence };
}

function decisionFromScore(score: number): 'approve' | 'review' | 'decline' | 'manual' {
  if (score >= 750) return 'approve';
  if (score >= 650) return 'manual';
  if (score >= 550) return 'review';
  return 'decline';
}

function gradeFromScore(score: number): 'A' | 'B' | 'C' | 'D' | 'E' {
  if (score >= 750) return 'A';
  if (score >= 700) return 'B';
  if (score >= 650) return 'C';
  if (score >= 550) return 'D';
  return 'E';
}

function recommendRate(score: number): number {
  if (score >= 750) return 10;
  if (score >= 700) return 14;
  if (score >= 650) return 18;
  if (score >= 600) return 22;
  if (score >= 550) return 26;
  return 30;
}

function recommendAmount(
  input: EvaluationInput,
  score: number,
  bureauScore: number,
  bureauFields: any
): number {
  const monthlyIncome = input.monthlyIncome || 50000;
  const obligations = input.existingObligations || 0;
  const netIncome = monthlyIncome - (input.monthlyExpense || monthlyIncome * 0.5) - obligations;
  const maxEMI = netIncome * 0.5;

  let baseAmount = monthlyIncome * Math.min(24, (input.loanTenor || 12));

  if (score >= 750) baseAmount *= 1.5;
  else if (score >= 700) baseAmount *= 1.2;
  else if (score >= 650) baseAmount *= 0.9;
  else if (score >= 550) baseAmount *= 0.5;
  else baseAmount *= 0.2;

  const rate = recommendRate(score);
  const emiForBaseAmount = calculateMonthlyEMI(baseAmount, rate, input.loanTenor || 12);
  if (emiForBaseAmount > maxEMI && maxEMI > 0) {
    baseAmount = maxEMI * input.loanTenor * (1 - rate / 200);
  }

  const upperLimit = monthlyIncome * 36;
  return Math.round(Math.min(baseAmount, upperLimit) / 1000) * 1000;
}

function buildSignals(
  features: FeatureVector,
  input: EvaluationInput,
  bureauFields: any,
  score: number
): { positive: string[]; risk: string[]; reasons: string[] } {
  const positive: string[] = [];
  const risk: string[] = [];
  const reasons: string[] = [];

  if (features.bureauScore > 0.7) {
    positive.push('Strong credit history');
    reasons.push(`Bureau score ${score} indicates reliable repayment behavior`);
  }

  if (features.employmentStability > 0.7) {
    positive.push('Stable employment');
    reasons.push(`${input.yearsAtJob || 1}+ years at current employer`);
  }

  if (features.residenceStability > 0.7) {
    positive.push('Stable residence');
  }

  if (input.vehicleOwned) positive.push('Asset ownership demonstrated');

  if (features.affordabilityRatio > 0.6) {
    positive.push('Loan amount well within affordability');
  }

  if (features.bankBehavior > 0.7) {
    positive.push('Healthy banking patterns');
    reasons.push('No overdraft usage, consistent balance maintenance');
  }

  if (features.income > 0.6) {
    positive.push('Strong income profile');
  }

  if (features.creditDepth > 0.5) {
    positive.push('Established credit profile with multiple accounts');
  }

  if (features.dti > 0.6) {
    risk.push('High debt-to-income ratio');
    reasons.push('Existing obligations significantly impact disposable income');
  }

  if (features.foir > 0.5) {
    risk.push('High fixed obligation to income ratio');
    reasons.push('EMI burden exceeds 50% of net income');
  }

  if (features.delinquencyHistory > 0.3) {
    risk.push('History of delayed payments');
    reasons.push(`${bureauFields?.delinquentAccounts || 0} accounts with past delinquency`);
  }

  if (features.inquiryVelocity > 0.5) {
    risk.push('Multiple recent credit inquiries');
    reasons.push(`${bureauFields?.inquiriesLast90Days || 0} hard inquiries in last 90 days`);
  }

  if (features.creditUtilization > 0.8) {
    risk.push('High credit card utilization');
  }

  if (bureauFields?.writtenOffAccounts > 0) {
    risk.push('Written-off accounts found');
    reasons.push(`${bureauFields.writtenOffAccounts} accounts classified as loss`);
  }

  if (bureauFields?.currentDPD > 0) {
    risk.push(`Active delinquency: ${bureauFields.currentDPD} DPD`);
    reasons.push('Borrower currently overdue on existing obligations');
  }

  if (features.loanAmount > 0.8) {
    risk.push('Large loan request relative to income');
  }

  if (positive.length === 0 && risk.length === 0) {
    reasons.push('Profile requires manual review');
  }

  return { positive, risk, reasons };
}

export async function evaluateApplication(
  input: EvaluationInput
): Promise<EvaluationOutput> {
  const evaluationId = `eval_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  let bureauReport: any = null;
  let bureauScore = 500;
  let bureauFields: any = {};

  try {
    bureauReport = await fetchCreditReport(input.orgId, input.borrowerId, input.pan, input.bureauReportId);
    bureauScore = bureauReport.score || 500;
    bureauFields = bureauReport.bureauFields || {};
  } catch (error) {
    console.warn('[Evaluation] Bureau fetch failed, using default score:', error);
    bureauScore = 500;
  }

  const features = computeFeatureVector(input, bureauScore, bureauFields);
  const { score, factors, confidence } = runModel(features);

  const recommendation = recommendAmount(input, score, bureauScore, bureauFields);
  const rate = recommendRate(score);
  const tenor = Math.min(input.loanTenor || 24, 48);
  const emi = calculateMonthlyEMI(recommendation, rate, tenor);

  const monthlyIncome = input.monthlyIncome || 50000;
  const netIncome = monthlyIncome - (input.monthlyExpense || monthlyIncome * 0.5) - (input.existingObligations || 0);
  const maxAffordableEMI = Math.round(netIncome * 0.5);
  const dti = calculateDTI(monthlyIncome, input.existingObligations || 0);
  const foir = calculateFOIR(monthlyIncome, input.monthlyExpense || monthlyIncome * 0.5, input.existingObligations || 0, emi);

  const { positive, risk, reasons } = buildSignals(features, input, bureauFields, score);

  const output: EvaluationOutput = {
    evaluationId,
    applicationId: input.applicationId,
    score,
    grade: gradeFromScore(score),
    decision: decisionFromScore(score),
    confidence: Math.round(confidence * 100),
    reasons,
    positiveSignals: positive,
    riskSignals: risk,
    recommendedAmount: recommendation,
    recommendedTenor: tenor,
    recommendedRate: rate,
    emiAmount: emi,
    dti: Math.round(dti * 10) / 10,
    foir: Math.round(foir * 10) / 10,
    bureauScore,
    bureauScoreBand: bureauReport?.scoreBand || 'Average',
    maxAffordableEMI,
    processingFee: Math.round(recommendation * 0.01),
    riskFactors: factors,
    modelVersion: 'v3.0',
    evaluatedAt: new Date(),
  };

  await db.collection('evaluations').doc(evaluationId).set({
    ...output,
    orgId: input.orgId,
    input: {
      borrowerName: input.borrowerName,
      pan: input.pan.substring(0, 5) + '****',
      phone: input.phone.substring(0, 3) + '****',
      loanAmount: input.loanAmount,
      loanTenor: input.loanTenor,
      monthlyIncome: input.monthlyIncome,
    },
    evaluatedAt: new Date(),
  });

  await db.collection('audit_logs').add({
    orgId: input.orgId,
    action: 'APPLICATION_EVALUATED',
    targetId: input.applicationId,
    detail: `Application evaluated: Score ${score}, Decision ${output.decision}`,
    timestamp: new Date(),
  });

  console.log(`[Evaluation] ${evaluationId}: Score=${score}, Decision=${output.decision}, Amount=${recommendation}`);

  return output;
}

export async function getEvaluation(evaluationId: string): Promise<EvaluationOutput | null> {
  const doc = await db.collection('evaluations').doc(evaluationId).get();
  if (!doc.exists) return null;
  return doc.data() as EvaluationOutput;
}

export async function getEvaluationByApplication(applicationId: string): Promise<EvaluationOutput | null> {
  const snapshot = await db.collection('evaluations')
    .where('applicationId', '==', applicationId)
    .orderBy('evaluatedAt', 'desc')
    .limit(1)
    .get();

  if (snapshot.empty) return null;
  return snapshot.docs[0].data() as EvaluationOutput;
}

export async function batchEvaluate(
  orgId: string,
  applications: EvaluationInput[]
): Promise<EvaluationOutput[]> {
  const results: EvaluationOutput[] = [];

  for (const app of applications) {
    try {
      const result = await evaluateApplication(app);
      results.push(result);
    } catch (error) {
      console.error(`[BatchEval] Failed for ${app.applicationId}:`, error);
    }
  }

  return results;
}