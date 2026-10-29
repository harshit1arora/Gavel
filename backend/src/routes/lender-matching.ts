import express, { Request, Response } from 'express';
import admin from 'firebase-admin';
import LenderMatchingEngine, { UserProfile, LenderOffer } from '../services/lender-matching-engine';

const router = express.Router();
const db = admin.firestore();

// Default lender profiles (used when Firestore has no lenders)
const DEFAULT_LENDERS = [
  {
    id: 'hdfc-personal',
    name: 'HDFC Bank',
    category: 'bank' as const,
    minLoanAmount: 100000,
    maxLoanAmount: 5000000,
    minTenure: 12,
    maxTenure: 84,
    minAge: 21,
    maxAge: 65,
    minCreditScore: 700,
    minMonthlyIncome: 30000,
    maxExistingEmi: 50,
    acceptableSalaried: true,
    acceptableSelfEmployed: true,
    acceptableBusiness: false,
    interestRateRange: { min: 10.5, max: 15.0 },
    processingFeePercentage: 0.5,
    turnaroundTimeDays: 3,
    approvalRate: 0.85,
    logoUrl: '/banks/hdfc.svg',
    website: 'https://www.hdfcbank.com',
    phone: '+91-1860-2255-255',
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'bajaj-personal',
    name: 'Bajaj Finserv',
    category: 'nbfc' as const,
    minLoanAmount: 50000,
    maxLoanAmount: 3500000,
    minTenure: 12,
    maxTenure: 60,
    minAge: 23,
    maxAge: 60,
    minCreditScore: 650,
    minMonthlyIncome: 25000,
    maxExistingEmi: 60,
    acceptableSalaried: true,
    acceptableSelfEmployed: true,
    acceptableBusiness: true,
    interestRateRange: { min: 11.0, max: 16.0 },
    processingFeePercentage: 1.0,
    turnaroundTimeDays: 1,
    approvalRate: 0.88,
    logoUrl: '/banks/bajaj.svg',
    website: 'https://www.bajajfinserv.in',
    phone: '+91-8698-010-101',
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'icici-personal',
    name: 'ICICI Bank',
    category: 'bank' as const,
    minLoanAmount: 50000,
    maxLoanAmount: 5000000,
    minTenure: 12,
    maxTenure: 84,
    minAge: 23,
    maxAge: 58,
    minCreditScore: 700,
    minMonthlyIncome: 30000,
    maxExistingEmi: 50,
    acceptableSalaried: true,
    acceptableSelfEmployed: true,
    acceptableBusiness: false,
    interestRateRange: { min: 10.75, max: 16.0 },
    processingFeePercentage: 0.5,
    turnaroundTimeDays: 3,
    approvalRate: 0.82,
    logoUrl: '/banks/icici.svg',
    website: 'https://www.icicibank.com',
    phone: '+91-1860-120-7777',
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'tata-capital',
    name: 'Tata Capital',
    category: 'nbfc' as const,
    minLoanAmount: 75000,
    maxLoanAmount: 3500000,
    minTenure: 12,
    maxTenure: 72,
    minAge: 22,
    maxAge: 58,
    minCreditScore: 680,
    minMonthlyIncome: 25000,
    maxExistingEmi: 55,
    acceptableSalaried: true,
    acceptableSelfEmployed: true,
    acceptableBusiness: true,
    interestRateRange: { min: 10.99, max: 16.0 },
    processingFeePercentage: 1.5,
    turnaroundTimeDays: 2,
    approvalRate: 0.80,
    logoUrl: '/banks/tata.svg',
    website: 'https://www.tatacapital.com',
    phone: '+91-1860-267-6060',
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'kotak-personal',
    name: 'Kotak Mahindra Bank',
    category: 'bank' as const,
    minLoanAmount: 50000,
    maxLoanAmount: 4000000,
    minTenure: 12,
    maxTenure: 60,
    minAge: 21,
    maxAge: 60,
    minCreditScore: 720,
    minMonthlyIncome: 30000,
    maxExistingEmi: 45,
    acceptableSalaried: true,
    acceptableSelfEmployed: false,
    acceptableBusiness: false,
    interestRateRange: { min: 10.99, max: 14.0 },
    processingFeePercentage: 0.5,
    turnaroundTimeDays: 4,
    approvalRate: 0.78,
    logoUrl: '/banks/kotak.svg',
    website: 'https://www.kotak.com',
    phone: '+91-1860-266-2666',
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'moneytap',
    name: 'MoneyTap',
    category: 'fintech' as const,
    minLoanAmount: 25000,
    maxLoanAmount: 500000,
    minTenure: 6,
    maxTenure: 36,
    minAge: 21,
    maxAge: 55,
    minCreditScore: 600,
    minMonthlyIncome: 20000,
    maxExistingEmi: 65,
    acceptableSalaried: true,
    acceptableSelfEmployed: true,
    acceptableBusiness: true,
    interestRateRange: { min: 13.0, max: 24.0 },
    processingFeePercentage: 2.0,
    turnaroundTimeDays: 1,
    approvalRate: 0.72,
    logoUrl: '/banks/moneytap.svg',
    website: 'https://www.moneytap.com',
    phone: '+91-8046-801-801',
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'sbi-personal',
    name: 'State Bank of India',
    category: 'bank' as const,
    minLoanAmount: 100000,
    maxLoanAmount: 3000000,
    minTenure: 12,
    maxTenure: 72,
    minAge: 21,
    maxAge: 60,
    minCreditScore: 700,
    minMonthlyIncome: 25000,
    maxExistingEmi: 50,
    acceptableSalaried: true,
    acceptableSelfEmployed: true,
    acceptableBusiness: false,
    interestRateRange: { min: 11.0, max: 14.0 },
    processingFeePercentage: 0.5,
    turnaroundTimeDays: 5,
    approvalRate: 0.80,
    logoUrl: '/banks/sbi.svg',
    website: 'https://sbi.co.in',
    phone: '1800-11-2211',
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

/**
 * Local matching engine for B2C use (no Firestore required)
 */
function matchLocally(userProfile: UserProfile): LenderOffer[] {
  const offers: LenderOffer[] = [];

  for (const lender of DEFAULT_LENDERS) {
    // Hard criteria checks
    if (userProfile.age && (userProfile.age < lender.minAge || userProfile.age > lender.maxAge)) continue;
    if (userProfile.creditScore < lender.minCreditScore) continue;
    if (userProfile.monthlyIncome < lender.minMonthlyIncome) continue;
    
    const emiRatio = (userProfile.existingEmi / userProfile.monthlyIncome) * 100;
    if (emiRatio > lender.maxExistingEmi) continue;
    if (userProfile.loanAmount < lender.minLoanAmount || userProfile.loanAmount > lender.maxLoanAmount) continue;
    if (userProfile.tenure < lender.minTenure || userProfile.tenure > lender.maxTenure) continue;

    const empMap: Record<string, boolean> = {
      salaried: lender.acceptableSalaried,
      self_employed: lender.acceptableSelfEmployed,
      business: lender.acceptableBusiness,
      other: false,
    };
    if (!empMap[userProfile.employmentType]) continue;

    // Calculate eligibility score
    let eligibilityScore = 50;
    const creditFactor = Math.min(30, ((userProfile.creditScore - lender.minCreditScore) / (900 - lender.minCreditScore)) * 30);
    eligibilityScore += Math.max(0, creditFactor);
    const incomeMultiple = userProfile.monthlyIncome / lender.minMonthlyIncome;
    eligibilityScore += Math.min(20, incomeMultiple * 5);
    const remainingCap = lender.maxExistingEmi - emiRatio;
    eligibilityScore += Math.min(20, Math.max(0, (remainingCap / lender.maxExistingEmi) * 20));

    eligibilityScore = Math.min(100, Math.max(0, Math.round(eligibilityScore)));

    // Probability
    const probability = 1 / (1 + Math.exp(-0.1 * (eligibilityScore - 50)));
    const approvalProb = Math.round(probability * lender.approvalRate * 100) / 100;

    // Interest rate estimation
    const creditScoreFactor = (userProfile.creditScore - 600) / 300;
    const creditAdj = (lender.interestRateRange.max - lender.interestRateRange.min) * (1 - creditScoreFactor) / 2;
    let estRate = (lender.interestRateRange.min + lender.interestRateRange.max) / 2 - creditAdj;
    if (emiRatio > 50) estRate += 2;
    else if (emiRatio > 30) estRate += 1;
    estRate = Math.min(lender.interestRateRange.max, Math.max(lender.interestRateRange.min, Math.round(estRate * 100) / 100));

    // EMI calculation
    const monthlyRateDecimal = estRate / 100 / 12;
    const emiNumerator = userProfile.loanAmount * monthlyRateDecimal * Math.pow(1 + monthlyRateDecimal, userProfile.tenure);
    const emiDenominator = Math.pow(1 + monthlyRateDecimal, userProfile.tenure) - 1;
    const monthlyEmi = monthlyRateDecimal > 0 ? Math.round(emiNumerator / emiDenominator) : Math.round(userProfile.loanAmount / userProfile.tenure);

    // Match score
    let matchScore = eligibilityScore * 0.4 + approvalProb * 100 * 0.3 + lender.approvalRate * 100 * 0.2;
    matchScore += Math.max(0, 100 - lender.turnaroundTimeDays * 5) * 0.1;
    matchScore = Math.round(matchScore);

    // Reasons
    const reasons: string[] = [];
    if (userProfile.creditScore >= 750) reasons.push('Excellent credit score qualifies for lowest rates');
    else if (userProfile.creditScore >= 700) reasons.push('Good credit score');
    if (emiRatio < 20) reasons.push('Low existing debt burden');
    if (userProfile.monthlyIncome > lender.minMonthlyIncome * 2) reasons.push('Strong income profile');
    if (lender.turnaroundTimeDays <= 2) reasons.push('Quick disbursement (' + lender.turnaroundTimeDays + ' days)');
    if (lender.approvalRate >= 0.85) reasons.push('High historical approval rate');

    offers.push({
      lenderId: lender.id!,
      lenderName: lender.name,
      lenderCategory: lender.category,
      logoUrl: lender.logoUrl,
      eligibilityScore,
      estimatedApprovalProbability: approvalProb,
      estimatedInterestRate: estRate,
      estimatedMonthlyEmi: monthlyEmi,
      estimatedProcessingFee: Math.round((userProfile.loanAmount * lender.processingFeePercentage) / 100),
      estimatedTurnaroundDays: lender.turnaroundTimeDays,
      matchScore,
      reasons: reasons.slice(0, 3),
    });
  }

  return offers.sort((a, b) => b.matchScore - a.matchScore);
}

/**
 * POST /lender-matching/match
 * Match user profile with available lenders
 */
router.post('/match', async (req: Request, res: Response) => {
  try {
    const {
      age,
      employmentType,
      monthlyIncome,
      existingEmi,
      creditScore,
      loanAmount,
      tenure,
      loanPurpose,
    } = req.body;

    if (!monthlyIncome || !loanAmount || !creditScore) {
      return res.status(400).json({
        error: 'Missing required fields: monthlyIncome, loanAmount, creditScore',
      });
    }

    const userProfile: UserProfile = {
      age: age || 30,
      employmentType: employmentType || 'salaried',
      monthlyIncome,
      existingEmi: existingEmi || 0,
      creditScore,
      loanAmount,
      tenure: tenure || 60,
      loanPurpose,
    };

    // Use local matching (no Firestore dependency for B2C)
    const offers = matchLocally(userProfile);

    // Categorize offers
    const loanTypes = [
      {
        type: 'Personal Loan',
        description: 'Unsecured loan for any purpose',
        icon: 'user',
        offers: offers,
      },
    ];

    // If loan amount > 500K, suggest home improvement loan
    if (loanAmount >= 500000) {
      loanTypes.push({
        type: 'Home Improvement Loan',
        description: 'Secured against property for lower rates',
        icon: 'home',
        offers: offers.map(o => ({
          ...o,
          estimatedInterestRate: Math.max(o.estimatedInterestRate - 2.5, 8.5),
          estimatedMonthlyEmi: Math.round(o.estimatedMonthlyEmi * 0.88),
          reasons: [...o.reasons.slice(0, 2), 'Lower rate with property collateral'],
        })),
      });
    }

    // If loan amount > 1M, suggest LAP
    if (loanAmount >= 1000000) {
      loanTypes.push({
        type: 'Loan Against Property',
        description: 'Leverage your property for the best rates',
        icon: 'building',
        offers: offers.map(o => ({
          ...o,
          estimatedInterestRate: Math.max(o.estimatedInterestRate - 4.0, 8.0),
          estimatedMonthlyEmi: Math.round(o.estimatedMonthlyEmi * 0.78),
          reasons: [...o.reasons.slice(0, 2), 'Best rates with property as security'],
        })),
      });
    }

    res.json({
      success: true,
      data: {
        totalOffers: offers.length,
        loanTypes,
        bestOffer: offers[0] || null,
        userProfile,
      },
    });
  } catch (error) {
    console.error('Lender matching error:', error);
    res.status(500).json({ error: 'Failed to match lenders' });
  }
});

/**
 * POST /lender-matching/interest-rates
 * Get estimated interest rates for user profile
 */
router.post('/interest-rates', async (req: Request, res: Response) => {
  try {
    const { monthlyIncome, creditScore, loanAmount, tenure, employmentType } = req.body;

    if (!monthlyIncome || !loanAmount || !creditScore) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const userProfile: UserProfile = {
      employmentType: employmentType || 'salaried',
      monthlyIncome,
      existingEmi: 0,
      creditScore,
      loanAmount,
      tenure: tenure || 60,
    };

    const offers = matchLocally(userProfile);

    const rates = offers.map(o => ({
      lenderName: o.lenderName,
      lenderCategory: o.lenderCategory,
      rate: o.estimatedInterestRate,
      emi: o.estimatedMonthlyEmi,
      processingFee: o.estimatedProcessingFee,
      turnaroundDays: o.estimatedTurnaroundDays,
    }));

    const avgRate = rates.length > 0
      ? Math.round((rates.reduce((s, r) => s + r.rate, 0) / rates.length) * 100) / 100
      : 0;

    const bestRate = rates.length > 0
      ? Math.min(...rates.map(r => r.rate))
      : 0;

    res.json({
      success: true,
      data: {
        rates,
        averageRate: avgRate,
        bestRate,
        eligibleLenders: rates.length,
      },
    });
  } catch (error) {
    console.error('Interest rate estimation error:', error);
    res.status(500).json({ error: 'Failed to estimate rates' });
  }
});

export default router;
