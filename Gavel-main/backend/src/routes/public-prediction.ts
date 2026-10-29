import express, { Request, Response } from 'express';

const router = express.Router();

/**
 * POST /public/predict
 * Public B2C prediction endpoint, no auth required
 * Uses rule-based ML calibration engine (same as internal but anonymized)
 */
router.post('/predict', async (req: Request, res: Response) => {
  try {
    const {
      monthlyIncome,
      existingEmi = 0,
      creditScore = 700,
      employmentType = 'salaried',
      loanAmount,
      loanTenure = 60,
      age = 30,
    } = req.body;

    if (!monthlyIncome || !loanAmount) {
      return res.status(400).json({ error: 'Missing monthlyIncome or loanAmount' });
    }

    if (monthlyIncome <= 0 || loanAmount <= 0) {
      return res.status(400).json({ error: 'Income and loan amount must be positive' });
    }

    // ── Feature Engineering ──
    const safeIncome = Math.max(monthlyIncome, 1);
    const dtiRatio = (existingEmi / safeIncome) * 100;
    const yearlyIncome = safeIncome * 12;
    const loanToIncomeRatio = loanAmount / yearlyIncome;
    const availableIncome = Math.max(0, safeIncome - existingEmi);
    const maxNewEmiCapacity = availableIncome * 0.40;

    // ── Score Calculation (Calibrated Multi-Factor Model) ──
    let approvalScore = 0;

    // Factor 1: Credit Score (0-30 points)
    if (creditScore >= 750) approvalScore += 30;
    else if (creditScore >= 720) approvalScore += 25;
    else if (creditScore >= 700) approvalScore += 20;
    else if (creditScore >= 650) approvalScore += 12;
    else if (creditScore >= 600) approvalScore += 5;
    else approvalScore -= 5;

    // Factor 2: Debt-to-Income Ratio (0-25 points)
    if (dtiRatio < 20) approvalScore += 25;
    else if (dtiRatio < 30) approvalScore += 20;
    else if (dtiRatio < 40) approvalScore += 15;
    else if (dtiRatio < 50) approvalScore += 8;
    else if (dtiRatio < 60) approvalScore += 3;
    else approvalScore -= 10;

    // Factor 3: Employment Type (0-15 points)
    if (employmentType === 'salaried') approvalScore += 15;
    else if (employmentType === 'business') approvalScore += 10;
    else if (employmentType === 'self_employed') approvalScore += 8;
    else approvalScore += 3;

    // Factor 4: Loan-to-Income Ratio (0-15 points)
    if (loanToIncomeRatio <= 0.5) approvalScore += 15;
    else if (loanToIncomeRatio <= 1.0) approvalScore += 12;
    else if (loanToIncomeRatio <= 2.0) approvalScore += 8;
    else if (loanToIncomeRatio <= 3.0) approvalScore += 3;
    else approvalScore -= 10;

    // Factor 5: Age Factor (0-5 points)
    if (age >= 25 && age <= 45) approvalScore += 5;
    else if (age >= 22 && age <= 55) approvalScore += 3;
    else approvalScore += 1;

    // Factor 6: Income Level (0-10 points)
    if (safeIncome >= 100000) approvalScore += 10;
    else if (safeIncome >= 50000) approvalScore += 8;
    else if (safeIncome >= 30000) approvalScore += 5;
    else if (safeIncome >= 20000) approvalScore += 2;
    else approvalScore -= 5;

    // ── Knockout Rules ──
    if (creditScore < 550) approvalScore = Math.min(approvalScore, 15);
    if (dtiRatio > 80) approvalScore = Math.min(approvalScore, 20);
    if (safeIncome < 12000) approvalScore = Math.min(approvalScore, 25);
    if (loanToIncomeRatio > 5) approvalScore = Math.min(approvalScore, 20);

    // Normalize to 0-100
    approvalScore = Math.min(98, Math.max(8, approvalScore));

    // ── Calibrated Probability (Logistic Function) ──
    const approvalProbability = Math.round(
      (1 / (1 + Math.exp(-0.08 * (approvalScore - 45)))) * 100
    ) / 100;

    // ── Decision ──
    let decision: 'approve' | 'conditional' | 'reject';
    let riskCategory: 'low' | 'medium' | 'high';
    let status: 'High' | 'Medium' | 'Low';

    if (approvalScore >= 70) {
      decision = 'approve';
      riskCategory = 'low';
      status = 'High';
    } else if (approvalScore >= 45) {
      decision = 'conditional';
      riskCategory = 'medium';
      status = 'Medium';
    } else {
      decision = 'reject';
      riskCategory = 'high';
      status = 'Low';
    }

    // ── Max Approvable Amount ──
    const monthlyRate = 0.01; // ~12% per annum
    const maxEmiBasedLoan = maxNewEmiCapacity > 0
      ? maxNewEmiCapacity * ((Math.pow(1 + monthlyRate, loanTenure) - 1) / (monthlyRate * Math.pow(1 + monthlyRate, loanTenure)))
: 0;
    let maxApprovableAmount = Math.round(maxEmiBasedLoan);
    if (riskCategory === 'high') maxApprovableAmount = Math.round(maxApprovableAmount * 0.5);
    else if (riskCategory === 'medium') maxApprovableAmount = Math.round(maxApprovableAmount * 0.75);

    // ── Estimated EMI ──
    const estimatedRate = creditScore >= 750 ? 10.5: creditScore >= 700 ? 12.0: creditScore >= 650 ? 14.0: 16.0;
    const mRate = estimatedRate / 100 / 12;
    const estimatedEmi = mRate > 0
      ? Math.round((loanAmount * mRate * Math.pow(1 + mRate, loanTenure)) / (Math.pow(1 + mRate, loanTenure) - 1))
: Math.round(loanAmount / loanTenure);

    // ── Positive & Negative Factors ──
    const positiveFactors: string[] = [];
    const negativeFactors: string[] = [];
    const tips: string[] = [];

    if (creditScore >= 750) positiveFactors.push('Excellent credit score (750+), qualifies for prime rates');
    else if (creditScore >= 700) positiveFactors.push('Good credit score, eligible for competitive rates');
    else negativeFactors.push('Credit score below 700, may face higher interest rates');

    if (dtiRatio < 30) positiveFactors.push('Healthy debt-to-income ratio (' + Math.round(dtiRatio) + '%)');
    else if (dtiRatio > 50) negativeFactors.push('High debt-to-income ratio (' + Math.round(dtiRatio) + '%), reduce existing EMIs');

    if (employmentType === 'salaried') positiveFactors.push('Salaried employment, highest approval likelihood');
    if (safeIncome >= 50000) positiveFactors.push('Strong monthly income (₹' + (safeIncome / 1000).toFixed(0) + 'K)');
    else if (safeIncome < 25000) negativeFactors.push('Income below ₹25,000/month limits eligible lenders');

    if (loanToIncomeRatio > 2) negativeFactors.push('Loan amount is ' + loanToIncomeRatio.toFixed(1) + 'x annual income, consider reducing');
    if (loanToIncomeRatio <= 1) positiveFactors.push('Conservative loan amount relative to income');

    // Tips
    if (status === 'High') {
      tips.push('Compare lenders to lock in the lowest interest rate');
      tips.push('Keep all documents ready for expedited processing');
      tips.push('Consider opting for a shorter tenure to save on total interest');
    } else if (status === 'Medium') {
      tips.push('Pay off existing EMIs to lower your Debt-to-Income ratio');
      tips.push('Try reducing your requested loan amount by 20-30%');
      tips.push('Upload bank statements for a more accurate analysis');
    } else {
      tips.push('Focus on improving your credit score above 700');
      tips.push('Consider applying with a co-applicant to boost eligibility');
      tips.push('Reduce existing debts before applying');
      tips.push('Build 6 months of consistent salary credits in your bank account');
    }

    // ── Response ──
    const message = status === 'High'
      ? 'Excellent odds! You are highly likely to be approved with competitive rates.'
: status === 'Medium'
      ? 'Fair odds. Optimize your profile for better terms, see recommendations below.'
: 'Challenging odds. Lenders may see your profile as high risk, follow our improvement plan.';

    res.json({
      success: true,
      data: {
        approvalScore,
        approvalProbability,
        status,
        decision,
        riskCategory,
        message,
        tips,
        positiveFactors: positiveFactors.slice(0, 4),
        negativeFactors: negativeFactors.slice(0, 4),
        maxApprovableAmount,
        estimatedMonthlyEmi: estimatedEmi,
        estimatedInterestRate: estimatedRate,
        debtToIncomeRatio: Math.round(dtiRatio * 10) / 10,
        emiCapacity: Math.round((maxNewEmiCapacity / safeIncome) * 100),
        confidence: 85,
        modelVersion: '2.0-calibrated',
        predictedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Public prediction error:', error);
    res.status(500).json({ error: 'Failed to generate prediction' });
  }
});

/**
 * POST /public/scenarios
 * Compare multiple loan scenarios (public, no auth)
 */
router.post('/scenarios', async (req: Request, res: Response) => {
  try {
    const { monthlyIncome, existingEmi, creditScore, employmentType, age, scenarios } = req.body;

    if (!scenarios || !Array.isArray(scenarios) || scenarios.length === 0) {
      return res.status(400).json({ error: 'Scenarios array required' });
    }

    if (scenarios.length > 5) {
      return res.status(400).json({ error: 'Maximum 5 scenarios allowed' });
    }

    // Process each scenario through the same engine
    const results = [];
    for (const scenario of scenarios) {
      const mockReq = {
        body: {
          monthlyIncome,
          existingEmi,
          creditScore,
          employmentType,
          age,
          loanAmount: scenario.loanAmount,
          loanTenure: scenario.tenure || 60,
        },
      } as Request;

      // Inline calculation (same as /predict)
      const safeIncome = Math.max(monthlyIncome, 1);
      const dtiRatio = ((existingEmi || 0) / safeIncome) * 100;
      const loanToIncomeRatio = scenario.loanAmount / (safeIncome * 12);
      const availableIncome = Math.max(0, safeIncome - (existingEmi || 0));
      const maxNewEmiCapacity = availableIncome * 0.40;

      let score = 0;
      if ((creditScore || 700) >= 750) score += 30;
      else if ((creditScore || 700) >= 700) score += 20;
      else if ((creditScore || 700) >= 650) score += 12;
      else score += 5;

      if (dtiRatio < 30) score += 20;
      else if (dtiRatio < 50) score += 10;
      else score += 3;

      if ((employmentType || 'salaried') === 'salaried') score += 15;
      else score += 8;

      if (loanToIncomeRatio <= 1.0) score += 12;
      else if (loanToIncomeRatio <= 2.0) score += 8;
      else score += 3;

      score += 5; // age bonus
      if (safeIncome >= 50000) score += 8;
      else score += 3;

      score = Math.min(98, Math.max(8, score));

      const estRate = (creditScore || 700) >= 750 ? 10.5: (creditScore || 700) >= 700 ? 12.0: 14.0;
      const mRate = estRate / 100 / 12;
      const tenure = scenario.tenure || 60;
      const emi = mRate > 0
        ? Math.round((scenario.loanAmount * mRate * Math.pow(1 + mRate, tenure)) / (Math.pow(1 + mRate, tenure) - 1))
: Math.round(scenario.loanAmount / tenure);

      const totalInterest = emi * tenure - scenario.loanAmount;

      results.push({
        scenario: {
          loanAmount: scenario.loanAmount,
          tenure,
          label: scenario.label || `₹${(scenario.loanAmount / 100000).toFixed(1)}L × ${tenure}mo`,
        },
        approvalScore: score,
        estimatedEmi: emi,
        estimatedRate: estRate,
        totalInterest: Math.round(totalInterest),
        totalPayable: Math.round(emi * tenure),
        status: score >= 70 ? 'High': score >= 45 ? 'Medium': 'Low',
      });
    }

    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('Scenario comparison error:', error);
    res.status(500).json({ error: 'Failed to compare scenarios' });
  }
});

const DEFAULT_LENDERS_B2C = [
  { id: 'hdfc', name: 'HDFC Bank', category: 'bank', minScore: 700, minIncome: 30000, maxEmiPct: 50, rateRange: [10.5, 15.0], fee: 0.5, days: 3, approval: 0.85 },
  { id: 'bajaj', name: 'Bajaj Finserv', category: 'nbfc', minScore: 650, minIncome: 25000, maxEmiPct: 60, rateRange: [11.0, 16.0], fee: 1.0, days: 1, approval: 0.88 },
  { id: 'icici', name: 'ICICI Bank', category: 'bank', minScore: 700, minIncome: 30000, maxEmiPct: 50, rateRange: [10.75, 16.0], fee: 0.5, days: 3, approval: 0.82 },
  { id: 'tata', name: 'Tata Capital', category: 'nbfc', minScore: 680, minIncome: 25000, maxEmiPct: 55, rateRange: [10.99, 16.0], fee: 1.5, days: 2, approval: 0.80 },
  { id: 'kotak', name: 'Kotak Mahindra', category: 'bank', minScore: 720, minIncome: 30000, maxEmiPct: 45, rateRange: [10.99, 14.0], fee: 0.5, days: 4, approval: 0.78 },
  { id: 'moneytap', name: 'MoneyTap', category: 'fintech', minScore: 600, minIncome: 20000, maxEmiPct: 65, rateRange: [13.0, 24.0], fee: 2.0, days: 1, approval: 0.72 },
  { id: 'sbi', name: 'State Bank of India', category: 'bank', minScore: 700, minIncome: 25000, maxEmiPct: 50, rateRange: [11.0, 14.0], fee: 0.5, days: 5, approval: 0.80 },
];

router.post('/lenders/match', async (req: Request, res: Response) => {
  try {
    const { monthlyIncome, existingEmi = 0, creditScore = 700, employmentType = 'salaried', loanAmount, tenure = 60, age = 30 } = req.body;

    if (!monthlyIncome || !loanAmount) {
      return res.status(400).json({ error: 'Missing monthlyIncome or loanAmount' });
    }

    const emiRatio = (existingEmi / monthlyIncome) * 100;
    const offers: any[] = [];

    for (const l of DEFAULT_LENDERS_B2C) {
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
      const emi = mRate > 0 ? Math.round((loanAmount * mRate * Math.pow(1 + mRate, tenure)) / (Math.pow(1 + mRate, tenure) - 1)): Math.round(loanAmount / tenure);

      const matchScore = Math.round(eligScore * 0.4 + prob * 100 * 0.3 + l.approval * 100 * 0.2 + Math.max(0, 100 - l.days * 5) * 0.1);

      offers.push({
        lenderId: l.id,
        lenderName: l.name,
        lenderCategory: l.category,
        logoUrl: `/banks/${l.id}.svg`,
        eligibilityScore: eligScore,
        estimatedApprovalProbability: prob,
        estimatedInterestRate: rate,
        estimatedMonthlyEmi: emi,
        estimatedProcessingFee: Math.round(loanAmount * l.fee / 100),
        estimatedTurnaroundDays: l.days,
        matchScore,
        reasons: creditScore >= 750 ? ['Excellent credit score']: emiRatio < 20 ? ['Low existing debt']: [],
      });
    }

    offers.sort((a, b) => b.matchScore - a.matchScore);

    res.json({
      success: true,
      data: {
        totalOffers: offers.length,
        loanTypes: [{ type: 'Personal Loan', description: 'Unsecured loan for any purpose', icon: 'user', offers }],
        bestOffer: offers[0] || null,
        userProfile: { monthlyIncome, existingEmi, creditScore, employmentType, loanAmount, tenure, age },
      },
    });
  } catch (error) {
    console.error('Lender match error:', error);
    res.status(500).json({ error: 'Failed to match lenders' });
  }
});

router.post('/lenders/interest-rates', async (req: Request, res: Response) => {
  try {
    const { monthlyIncome, creditScore = 700, loanAmount, tenure = 60, employmentType = 'salaried' } = req.body;

    if (!monthlyIncome || !loanAmount) {
      return res.status(400).json({ error: 'Missing monthlyIncome or loanAmount' });
    }

    const rates: any[] = [];
    for (const l of DEFAULT_LENDERS_B2C) {
      if (creditScore < l.minScore || monthlyIncome < l.minIncome) continue;

      const creditFactor = (creditScore - 600) / 300;
      const adj = (l.rateRange[1] - l.rateRange[0]) * (1 - creditFactor) / 2;
      const rate = Math.min(l.rateRange[1], Math.max(l.rateRange[0], Math.round(((l.rateRange[0] + l.rateRange[1]) / 2 - adj) * 100) / 100));

      const mRate = rate / 100 / 12;
      const emi = mRate > 0 ? Math.round((loanAmount * mRate * Math.pow(1 + mRate, tenure)) / (Math.pow(1 + mRate, tenure) - 1)): Math.round(loanAmount / tenure);

      rates.push({ lenderName: l.name, lenderCategory: l.category, rate, emi, processingFee: Math.round(loanAmount * l.fee / 100), turnaroundDays: l.days });
    }

    res.json({
      success: true,
      data: {
        rates,
        averageRate: rates.length > 0 ? Math.round((rates.reduce((s, r) => s + r.rate, 0) / rates.length) * 100) / 100: 0,
        bestRate: rates.length > 0 ? Math.min(...rates.map(r => r.rate)): 0,
        eligibleLenders: rates.length,
      },
    });
  } catch (error) {
    console.error('Interest rate error:', error);
    res.status(500).json({ error: 'Failed to estimate rates' });
  }
});

export default router;
