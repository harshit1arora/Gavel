import { db } from '../config/firebase';
import fetch from 'node-fetch';

export interface BureauConfig {
  provider: 'cibil' | 'experian' | 'crif' | 'lamps' | 'stub';
  apiKey?: string;
  apiSecret?: string;
  baseUrl?: string;
}

export interface CreditBureauReport {
  reportId: string;
  orgId: string;
  borrowerId: string;
  pan: string;
  provider: string;
  score: number;
  scoreBand: string;
  reportDate: Date;
  errorCode?: string;
  errorMessage?: string;
  bureauFields: {
    totalAccounts: number;
    activeAccounts: number;
    closedAccounts: number;
    delinquentAccounts: number;
    currentBalance: number;
    securedAmount: number;
    unsecuredAmount: number;
    lastActivityDate?: Date;
    creditUtilization: number;
    averageAccountAge: number;
    creditMix: { type: string; count: number }[];
    paymentHistory: {
      month: string;
      status: string;
    }[];
    inquiriesLast90Days: number;
    inquiriesLast180Days: number;
    writtenOffAccounts: number;
    settledAccounts: number;
    currentDPD: number;
    maxDPD: number;
    enquiries: { date: string; lender: string; amount: number }[];
    accountDetails: {
      lender: string;
      type: string;
      accountNumber: string;
      openedDate: string;
      currentBalance: number;
      sanctionedAmount: number;
      lastPaymentDate?: string;
      currentDPD: number;
      status: string;
    }[];
  };
  consentTimestamp: Date;
  fetchedAt: Date;
}

export interface ConsentRecord {
  id: string;
  orgId: string;
  borrowerId: string;
  pan: string;
  purpose: string;
  ipAddress?: string;
  userAgent?: string;
  grantedAt: Date;
  expiresAt: Date;
  bureau: string;
  status: 'pending' | 'active' | 'expired' | 'revoked';
}

const CIBIL_API_URL = process.env.CIBIL_API_URL || '';
const CIBIL_API_KEY = process.env.CIBIL_API_KEY || '';
const CIBIL_CONSUMER_KEY = process.env.CIBIL_CONSUMER_KEY || '';
const CIBIL_CONSUMER_SECRET = process.env.CIBIL_CONSUMER_SECRET || '';

const SETU_BUREAU_URL = process.env.SETU_BUREAU_URL || '';
const SETU_BUREAU_KEY = process.env.SETU_BUREU_KEY || '';

async function getCIBILToken(): Promise<string> {
  const credentials = Buffer.from(`${CIBIL_CONSUMER_KEY}:${CIBIL_CONSUMER_SECRET}`).toString('base64');
  
  const response = await fetch(`${CIBIL_API_URL}/oauth/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    throw new Error('CIBIL authentication failed');
  }

  const data = await response.json() as any;
  return data.access_token;
}

async function fetchFromCIBIL(pan: string, token: string): Promise<any> {
  const response = await fetch(`${CIBIL_API_URL}/v1/consumer/report`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'x-api-key': CIBIL_API_KEY,
    },
    body: JSON.stringify({
      consent: true,
      data: { PAN: pan }
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`CIBIL API error: ${error}`);
  }

  return response.json();
}

async function fetchFromSetu(pan: string, consentId: string): Promise<any> {
  const response = await fetch(`${SETU_BUREAU_URL}/bureau/report`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SETU_BUREAU_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      consent_id: consentId,
      pan_number: pan,
      bureau: 'CIBIL',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Setu Bureau API error: ${error}`);
  }

  return response.json();
}

function parseCIBILResponse(data: any, pan: string, reportId: string): CreditBureauReport {
  const bureauFields = data.bureauData || data;

  return {
    reportId,
    orgId: data.orgId || '',
    borrowerId: data.borrowerId || '',
    pan,
    provider: 'CIBIL',
    score: bureauFields.CIBILScore?.score || 0,
    scoreBand: bureauFields.CIBILScore?.scoreBand || 'Not Available',
    reportDate: new Date(),
    bureauFields: {
      totalAccounts: bureauFields.totalAccounts || 0,
      activeAccounts: bureauFields.activeAccounts || 0,
      closedAccounts: bureauFields.closedAccounts || 0,
      delinquentAccounts: bureauFields.delinquentAccounts || 0,
      currentBalance: bureauFields.currentBalance || 0,
      securedAmount: bureauFields.securedAmount || 0,
      unsecuredAmount: bureauFields.unsecuredAmount || 0,
      lastActivityDate: bureauFields.lastActivityDate ? new Date(bureauFields.lastActivityDate) : undefined,
      creditUtilization: bureauFields.creditUtilization || 0,
      averageAccountAge: bureauFields.averageAccountAge || 0,
      creditMix: bureauFields.creditMix || [],
      paymentHistory: bureauFields.paymentHistory || [],
      inquiriesLast90Days: bureauFields.inquiriesLast90Days || 0,
      inquiriesLast180Days: bureauFields.inquiriesLast180Days || 0,
      writtenOffAccounts: bureauFields.writtenOffAccounts || 0,
      settledAccounts: bureauFields.settledAccounts || 0,
      currentDPD: bureauFields.currentDPD || 0,
      maxDPD: bureauFields.maxDPD || 0,
      enquiries: bureauFields.enquiries || [],
      accountDetails: bureauFields.accountDetails || [],
    },
    consentTimestamp: new Date(),
    fetchedAt: new Date(),
  };
}

function generateMockScore(pan: string): { score: number; band: string } {
  let hash = 0;
  for (let i = 0; i < pan.length; i++) {
    const char = pan.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }

  const score = 300 + Math.abs(hash % 550);
  let band: string;
  if (score >= 800) band = 'Excellent';
  else if (score >= 750) band = 'Very Good';
  else if (score >= 700) band = 'Good';
  else if (score >= 650) band = 'Fair';
  else if (score >= 550) band = 'Average';
  else band = 'Poor';

  return { score, band };
}

function generateMockBureauFields(pan: string): any {
  let hash = 0;
  for (let i = 0; i < pan.length; i++) {
    hash = ((hash << 5) - hash) + pan.charCodeAt(i);
    hash = hash & hash;
  }

  const numAccounts = 2 + Math.abs(hash % 8);
  const accounts: any[] = [];
  const lenders = ['HDFC Bank', 'ICICI Bank', 'SBI', 'Axis Bank', 'Kotak Bank', ' Bajaj Finance', 'Muthoot Finance', 'Tata Capital'];
  const types = ['Personal Loan', 'Credit Card', 'Home Loan', 'Car Loan', 'Business Loan'];

  for (let i = 0; i < numAccounts; i++) {
    const accountHash = hash + i;
    const type = types[Math.abs(accountHash) % types.length];
    const isDelinquent = Math.abs(accountHash) % 10 === 0;

    accounts.push({
      lender: lenders[Math.abs(accountHash) % lenders.length],
      type,
      accountNumber: `ACC${Math.abs(accountHash % 900000000) + 100000000}`,
      openedDate: `${2020 + Math.abs(accountHash) % 4}-${1 + Math.abs(accountHash % 12)}-15`,
      currentBalance: Math.abs((accountHash * 1000) % 500000),
      sanctionedAmount: Math.abs((accountHash * 2000) % 1000000) + 100000,
      lastPaymentDate: isDelinquent ? null : `${2024}-${1 + Math.abs(accountHash % 12)}-05`,
      currentDPD: isDelinquent ? Math.abs(accountHash % 180) : 0,
      status: isDelinquent ? 'Active' : 'Active',
    });
  }

  const delinquentAccounts = accounts.filter(a => a.currentDPD > 0).length;
  const totalBalance = accounts.reduce((sum, a) => sum + a.currentBalance, 0);
  const securedAmount = accounts.filter(a => a.type === 'Home Loan' || a.type === 'Car Loan')
    .reduce((sum, a) => sum + a.currentBalance, 0);

  const paymentHistory = [];
  for (let i = 11; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const statusRoll = hash + i;
    const status = Math.abs(statusRoll) % 5 === 0 
      ? '30+' 
      : Math.abs(statusRoll) % 8 === 0 
        ? '60+' 
        : Math.abs(statusRoll) % 12 === 0 
          ? '90+' 
          : 'STD';
    paymentHistory.push({ month: monthStr, status });
  }

  return {
    totalAccounts: numAccounts,
    activeAccounts: numAccounts,
    closedAccounts: 0,
    delinquentAccounts,
    currentBalance: totalBalance,
    securedAmount,
    unsecuredAmount: totalBalance - securedAmount,
    lastActivityDate: new Date(),
    creditUtilization: Math.abs(hash % 60) + 20,
    averageAccountAge: 12 + Math.abs(hash % 36),
    creditMix: [
      { type: 'Personal Loan', count: Math.max(1, accounts.filter(a => a.type === 'Personal Loan').length) },
      { type: 'Credit Card', count: Math.max(0, accounts.filter(a => a.type === 'Credit Card').length) },
      { type: 'Secured', count: accounts.filter(a => a.type === 'Home Loan' || a.type === 'Car Loan').length },
    ],
    paymentHistory,
    inquiriesLast90Days: Math.abs(hash % 5),
    inquiriesLast180Days: Math.abs(hash % 8),
    writtenOffAccounts: delinquentAccounts > 2 ? 1 : 0,
    settledAccounts: 0,
    currentDPD: Math.max(...accounts.map(a => a.currentDPD), 0),
    maxDPD: Math.max(...accounts.map(a => a.currentDPD), 0),
    enquiries: [],
    accountDetails: accounts,
  };
}

export async function recordConsent(
  orgId: string,
  borrowerId: string,
  pan: string,
  purpose: string,
  ipAddress?: string,
  userAgent?: string,
  bureau: string = 'CIBIL'
): Promise<ConsentRecord> {
  const consentId = `consent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date();

  const consent: ConsentRecord = {
    id: consentId,
    orgId,
    borrowerId,
    pan,
    purpose,
    ipAddress,
    userAgent,
    grantedAt: now,
    expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
    bureau,
    status: 'active',
  };

  await db.collection('bureau_consents').doc(consentId).set({
    ...consent,
    grantedAt: new Date(),
    expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
  });

  await db.collection('audit_logs').add({
    orgId,
    action: 'BUREAU_CONSENT_RECORDED',
    targetId: consentId,
    detail: `Consent recorded for borrower ${borrowerId} to fetch ${bureau} report`,
    timestamp: new Date(),
  });

  return consent;
}

export async function fetchCreditReport(
  orgId: string,
  borrowerId: string,
  pan: string,
  consentId?: string
): Promise<CreditBureauReport> {
  const reportId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const provider = detectBureauProvider();

  console.log(`[Bureau] Fetching ${provider} report for PAN: ${pan.substring(0, 5)}***`);

  try {
    let report: CreditBureauReport;

    if (provider === 'cibil' && CIBIL_API_KEY && CIBIL_CONSUMER_KEY) {
      const token = await getCIBILToken();
      const rawData = await fetchFromCIBIL(pan, token);
      report = parseCIBILResponse(rawData, pan, reportId);
      report.orgId = orgId;
      report.borrowerId = borrowerId;
    } else if (SETU_BUREAU_KEY && consentId) {
      const rawData = await fetchFromSetu(pan, consentId);
      report = parseCIBILResponse(rawData, pan, reportId);
      report.orgId = orgId;
      report.borrowerId = borrowerId;
    } else {
      console.log(`[Bureau] Using ${provider} mode (no live API keys configured)`);
      const { score, band } = generateMockScore(pan);
      const bureauFields = generateMockBureauFields(pan);

      report = {
        reportId,
        orgId,
        borrowerId,
        pan,
        provider,
        score,
        scoreBand: band,
        reportDate: new Date(),
        bureauFields,
        consentTimestamp: new Date(),
        fetchedAt: new Date(),
      };
    }

    await db.collection('bureau_reports').doc(reportId).set(report);

    await db.collection('audit_logs').add({
      orgId,
      action: 'BUREAU_REPORT_FETCHED',
      targetId: reportId,
      detail: `${provider} report fetched for ${pan.substring(0, 5)}***: Score ${report.score}`,
      timestamp: new Date(),
    });

    return report;
  } catch (error: any) {
    console.error(`[Bureau] Fetch failed, falling back to stub:`, error.message);

    const { score, band } = generateMockScore(pan);
    const bureauFields = generateMockBureauFields(pan);

    return {
      reportId,
      orgId,
      borrowerId,
      pan,
      provider: 'stub',
      score,
      scoreBand: band,
      reportDate: new Date(),
      errorCode: error.message,
      bureauFields,
      consentTimestamp: new Date(),
      fetchedAt: new Date(),
    };
  }
}

function detectBureauProvider(): 'cibil' | 'experian' | 'crif' | 'lamps' | 'stub' {
  if (CIBIL_API_KEY && CIBIL_CONSUMER_KEY) return 'cibil';
  if (SETU_BUREAU_KEY) return 'crif';
  return 'stub';
}

export async function getCreditScore(
  orgId: string,
  borrowerId: string,
  pan: string
): Promise<{ score: number; band: string; provider: string; reportId: string }> {
  const report = await fetchCreditReport(orgId, borrowerId, pan);
  return {
    score: report.score,
    band: report.scoreBand,
    provider: report.provider,
    reportId: report.reportId,
  };
}

export async function getBureauHistory(
  orgId: string,
  borrowerId: string,
  pan: string
): Promise<{
  reports: CreditBureauReport[];
  averageScore: number;
  scoreTrend: number[];
}> {
  const snapshot = await db.collection('bureau_reports')
    .where('orgId', '==', orgId)
    .where('borrowerId', '==', borrowerId)
    .orderBy('fetchedAt', 'desc')
    .limit(12)
    .get();

  const reports = snapshot.docs.map((doc: any) => doc.data() as CreditBureauReport);
  const scores = reports.map(r => r.score).filter(s => s > 0);
  const averageScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

  return {
    reports,
    averageScore,
    scoreTrend: scores.reverse(),
  };
}

export async function getLatestReport(orgId: string, borrowerId: string): Promise<CreditBureauReport | null> {
  const snapshot = await db.collection('bureau_reports')
    .where('orgId', '==', orgId)
    .where('borrowerId', '==', borrowerId)
    .orderBy('fetchedAt', 'desc')
    .limit(1)
    .get();

  if (snapshot.empty) return null;
  return snapshot.docs[0].data() as CreditBureauReport;
}

export async function calculateCreditMetrics(
  report: CreditBureauReport
): Promise<{
  overallGrade: 'A' | 'B' | 'C' | 'D' | 'E';
  approvalRecommendation: 'approve' | 'review' | 'decline';
  maxLoanAmount: number;
  riskFactors: string[];
  positiveFactors: string[];
  monthlyEMICeil: number;
  recommendedRate: number;
}> {
  const score = report.score;
  const fields = report.bureauFields;

  const riskFactors: string[] = [];
  const positiveFactors: string[] = [];
  let approvalRecommendation: 'approve' | 'review' | 'decline';
  let overallGrade: 'A' | 'B' | 'C' | 'D' | 'E';
  let maxLoanAmount: number;
  let monthlyEMICeil: number;
  let recommendedRate: number;

  if (score >= 750) {
    overallGrade = 'A';
    approvalRecommendation = 'approve';
    maxLoanAmount = 2000000;
    monthlyEMICeil = 50000;
    recommendedRate = 10;
    positiveFactors.push('Excellent credit score', 'Clean payment history');
  } else if (score >= 700) {
    overallGrade = 'B';
    approvalRecommendation = 'approve';
    maxLoanAmount = 1000000;
    monthlyEMICeil = 25000;
    recommendedRate = 14;
    positiveFactors.push('Good credit score');
  } else if (score >= 650) {
    overallGrade = 'C';
    approvalRecommendation = 'review';
    maxLoanAmount = 500000;
    monthlyEMICeil = 15000;
    recommendedRate = 18;
  } else if (score >= 550) {
    overallGrade = 'D';
    approvalRecommendation = 'review';
    maxLoanAmount = 200000;
    monthlyEMICeil = 8000;
    recommendedRate = 24;
    riskFactors.push('Below average credit score');
  } else {
    overallGrade = 'E';
    approvalRecommendation = 'decline';
    maxLoanAmount = 0;
    monthlyEMICeil = 0;
    recommendedRate = 0;
    riskFactors.push('Poor credit score', 'High risk borrower');
  }

  if (fields.delinquentAccounts > 0) {
    riskFactors.push(`${fields.delinquentAccounts} delinquent accounts`);
    if (approvalRecommendation === 'approve') approvalRecommendation = 'review';
  }

  if (fields.currentDPD > 0) {
    riskFactors.push(`Current DPD: ${fields.currentDPD} days`);
    if (approvalRecommendation !== 'decline') approvalRecommendation = 'review';
  }

  if (fields.inquiriesLast90Days > 5) {
    riskFactors.push(`${fields.inquiriesLast90Days} hard inquiries in 90 days`);
  }

  if (fields.writtenOffAccounts > 0) {
    riskFactors.push(`${fields.writtenOffAccounts} written-off accounts`);
    approvalRecommendation = 'decline';
  }

  if (fields.paymentHistory.filter(p => p.status === 'STD').length >= 11) {
    positiveFactors.push('12 months clean payment history');
  }

  if (fields.totalAccounts >= 5) {
    positiveFactors.push('Diversified credit portfolio');
  }

  return {
    overallGrade,
    approvalRecommendation,
    maxLoanAmount,
    riskFactors,
    positiveFactors,
    monthlyEMICeil,
    recommendedRate,
  };
}