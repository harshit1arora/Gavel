import admin from 'firebase-admin';

/**
 * Lender Matching Engine
 * Matches user profiles with lending partners and generates pre-approved offers
 */

export interface LenderProfile {
  id?: string;
  name: string;
  category: 'bank' | 'nbfc' | 'fintech' | 'peer-to-peer';
  
  // Loan Product Range
  minLoanAmount: number;
  maxLoanAmount: number;
  minTenure: number;
  maxTenure: number;
  
  // Eligibility Criteria
  minAge: number;
  maxAge: number;
  minCreditScore: number;
  minMonthlyIncome: number;
  maxExistingEmi: number; // % of monthly income
  
  // Employment Type Preferences
  acceptableSalaried: boolean;
  acceptableSelfEmployed: boolean;
  acceptableBusiness: boolean;
  
  // Product Details
  interestRateRange: { min: number; max: number };
  processingFeePercentage: number;
  turnaroundTimeDays: number;
  approvalRate: number; // 0-1.0 (historical)
  
  // Branding
  logoUrl: string;
  website: string;
  phone: string;
  
  // Active Status
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface LenderOffer {
  lenderId: string;
  lenderName: string;
  lenderCategory: string;
  logoUrl: string;
  
  // Personalized Offer
  eligibilityScore: number; // 0-100, how well user matches criteria
  estimatedApprovalProbability: number; // 0-1.0
  
  // Estimated Terms
  estimatedInterestRate: number; // %
  estimatedMonthlyEmi: number;
  estimatedProcessingFee: number;
  estimatedTurnaroundDays: number;
  
  // Recommendation
  matchScore: number; // Overall match (0-100)
  reasons: string[]; // Why this lender is suitable
}

export interface UserProfile {
  age?: number;
  employmentType: 'salaried' | 'self_employed' | 'business' | 'other';
  monthlyIncome: number;
  existingEmi: number;
  creditScore: number;
  loanAmount: number;
  tenure: number;
  loanPurpose?: string;
}

class LenderMatchingEngine {
  /**
   * Match user with all available lenders
   */
  static async matchUserWithLenders(userProfile: UserProfile): Promise<LenderOffer[]> {
    try {
      const db = admin.firestore();
      
      // Fetch all active lenders
      const lendersSnapshot = await db.collection('lenders')
        .where('active', '==', true)
        .get();

      if (lendersSnapshot.empty) {
        console.warn('No lenders available for matching');
        return [];
      }

      // Match user against each lender
      const offers: LenderOffer[] = [];

      for (const doc of lendersSnapshot.docs) {
        const lender = doc.data() as LenderProfile;
        const offer = this.matchUserWithLender(userProfile, lender);

        if (offer) {
          offers.push(offer);
        }
      }

      // Sort by match score (highest first)
      offers.sort((a, b) => b.matchScore - a.matchScore);

      return offers;
    } catch (error) {
      console.error('Lender matching error:', error);
      throw error;
    }
  }

  /**
   * Match user with single lender
   */
  private static matchUserWithLender(user: UserProfile, lender: LenderProfile): LenderOffer | null {
    // 1. Hard Eligibility Checks (must pass all)
    if (!this.meetsHardCriteria(user, lender)) {
      return null;
    }

    // 2. Calculate soft scores
    const eligibilityScore = this.calculateEligibilityScore(user, lender);
    const estimatedApprovalProbability = this.estimateApprovalProbability(user, lender, eligibilityScore);

    // 3. Calculate estimated terms
    const estimatedInterestRate = this.estimateInterestRate(user, lender);
    const emiData = this.calculateEmi(
      user.loanAmount,
      estimatedInterestRate,
      user.tenure
    );

    // 4. Calculate match score
    const matchScore = this.calculateMatchScore(
      user,
      lender,
      eligibilityScore,
      estimatedApprovalProbability
    );

    // 5. Generate reasons
    const reasons = this.generateReasons(user, lender, eligibilityScore);

    return {
      lenderId: lender.id || '',
      lenderName: lender.name,
      lenderCategory: lender.category,
      logoUrl: lender.logoUrl,
      eligibilityScore,
      estimatedApprovalProbability,
      estimatedInterestRate,
      estimatedMonthlyEmi: emiData.monthlyEmi,
      estimatedProcessingFee: (user.loanAmount * lender.processingFeePercentage) / 100,
      estimatedTurnaroundDays: lender.turnaroundTimeDays,
      matchScore,
      reasons,
    };
  }

  /**
   * Check hard eligibility criteria
   */
  private static meetsHardCriteria(user: UserProfile, lender: LenderProfile): boolean {
    // Age check
    if (user.age && (user.age < lender.minAge || user.age > lender.maxAge)) {
      return false;
    }

    // Credit score check
    if (user.creditScore < lender.minCreditScore) {
      return false;
    }

    // Income check
    if (user.monthlyIncome < lender.minMonthlyIncome) {
      return false;
    }

    // EMI ratio check
    const emiRatio = (user.existingEmi / user.monthlyIncome) * 100;
    if (emiRatio > lender.maxExistingEmi) {
      return false;
    }

    // Loan amount range check
    if (user.loanAmount < lender.minLoanAmount || user.loanAmount > lender.maxLoanAmount) {
      return false;
    }

    // Tenure range check
    if (user.tenure < lender.minTenure || user.tenure > lender.maxTenure) {
      return false;
    }

    // Employment type check
    const employmentMap = {
      salaried: lender.acceptableSalaried,
      self_employed: lender.acceptableSelfEmployed,
      business: lender.acceptableBusiness,
      other: false,
    };

    if (!employmentMap[user.employmentType]) {
      return false;
    }

    return true;
  }

  /**
   * Calculate eligibility score (0-100)
   */
  private static calculateEligibilityScore(user: UserProfile, lender: LenderProfile): number {
    let score = 50; // Base score

    // Credit score factor (0-30)
    const creditScoreFactor = Math.min(
      30,
      ((user.creditScore - lender.minCreditScore) / (900 - lender.minCreditScore)) * 30
    );
    score += Math.max(0, creditScoreFactor);

    // Income factor (0-20)
    const incomeMultiple = user.monthlyIncome / lender.minMonthlyIncome;
    const incomeFactor = Math.min(20, incomeMultiple * 5);
    score += incomeFactor;

    // EMI ratio factor (0-20)
    const emiRatio = (user.existingEmi / user.monthlyIncome) * 100;
    const remainingCapacity = lender.maxExistingEmi - emiRatio;
    const emiFactor = Math.min(20, Math.max(0, (remainingCapacity / lender.maxExistingEmi) * 20));
    score += emiFactor;

    // Loan amount factor (0-20)
    const loanRatio = user.loanAmount / lender.maxLoanAmount;
    const loanFactor = Math.max(0, 20 * (1 - loanRatio));
    score += loanFactor;

    // Tenure factor (0-10)
    const tenureRatio = user.tenure / lender.maxTenure;
    const tenureFactor = Math.max(0, 10 * (1 - Math.abs(tenureRatio - 0.5) * 2));
    score += tenureFactor;

    return Math.min(100, Math.max(0, Math.round(score)));
  }

  /**
   * Estimate approval probability
   */
  private static estimateApprovalProbability(
    user: UserProfile,
    lender: LenderProfile,
    eligibilityScore: number
  ): number {
    // Use logistic function with lender's approval rate as calibration
    const calibrationFactor = lender.approvalRate || 0.75;
    
    // Convert eligibility score to probability
    // logistic: 1 / (1 + e^(-k*(x-50)))
    const probability = 1 / (1 + Math.exp(-0.1 * (eligibilityScore - 50)));

    // Apply lender's calibration
    return Math.round(probability * calibrationFactor * 100) / 100;
  }

  /**
   * Estimate interest rate
   */
  private static estimateInterestRate(user: UserProfile, lender: LenderProfile): number {
    let baseRate = (lender.interestRateRange.min + lender.interestRateRange.max) / 2;

    // Adjust based on credit score
    const creditScoreFactor = (user.creditScore - 600) / 300; // 0-1 scale
    const creditAdjustment = (lender.interestRateRange.max - lender.interestRateRange.min) * (1 - creditScoreFactor) / 2;
    
    baseRate -= creditAdjustment;

    // Adjust based on EMI ratio
    const emiRatio = (user.existingEmi / user.monthlyIncome) * 100;
    if (emiRatio > 50) {
      baseRate += 2;
    } else if (emiRatio > 30) {
      baseRate += 1;
    }

    // Ensure within range
    return Math.min(lender.interestRateRange.max, Math.max(lender.interestRateRange.min, Math.round(baseRate * 100) / 100));
  }

  /**
   * Calculate monthly EMI
   */
  private static calculateEmi(loanAmount: number, monthlyRate: number, tenor: number) {
    const monthlyRateDecimal = monthlyRate / 100 / 12;
    
    if (monthlyRateDecimal === 0) {
      return {
        monthlyEmi: Math.round(loanAmount / tenor),
        totalAmount: loanAmount,
        totalInterest: 0,
      };
    }

    // EMI = P * [r(1 + r)^n] / [(1 + r)^n - 1]
    const numerator = loanAmount * monthlyRateDecimal * Math.pow(1 + monthlyRateDecimal, tenor);
    const denominator = Math.pow(1 + monthlyRateDecimal, tenor) - 1;
    const monthlyEmi = numerator / denominator;

    return {
      monthlyEmi: Math.round(monthlyEmi),
      totalAmount: Math.round(monthlyEmi * tenor),
      totalInterest: Math.round(monthlyEmi * tenor - loanAmount),
    };
  }

  /**
   * Calculate overall match score (0-100)
   */
  private static calculateMatchScore(
    user: UserProfile,
    lender: LenderProfile,
    eligibilityScore: number,
    approvalProbability: number
  ): number {
    // Weighted score
    const weights = {
      eligibility: 0.4,
      approval: 0.3,
      lenderRating: 0.2,
      turnaround: 0.1,
    };

    let score = eligibilityScore * weights.eligibility;
    score += approvalProbability * 100 * weights.approval;
    score += lender.approvalRate * 100 * weights.lenderRating;
    
    // Turnaround factor (faster is better)
    const turnaroundScore = Math.max(0, 100 - lender.turnaroundTimeDays * 5);
    score += turnaroundScore * weights.turnaround;

    return Math.round(score);
  }

  /**
   * Generate match reasons
   */
  private static generateReasons(
    user: UserProfile,
    lender: LenderProfile,
    eligibilityScore: number
  ): string[] {
    const reasons: string[] = [];

    // Positive reasons
    if (user.creditScore >= 750) {
      reasons.push('Excellent credit score');
    } else if (user.creditScore >= 700) {
      reasons.push('Good credit score');
    }

    const emiRatio = (user.existingEmi / user.monthlyIncome) * 100;
    if (emiRatio < 20) {
      reasons.push('Low existing debt burden');
    }

    if (user.monthlyIncome > lender.minMonthlyIncome * 2) {
      reasons.push('Strong income');
    }

    if (eligibilityScore >= 80) {
      reasons.push('Perfect eligibility match');
    }

    if (lender.turnaroundTimeDays <= 3) {
      reasons.push('Quick disbursement');
    }

    // Add lender strengths
    if (lender.approvalRate >= 0.85) {
      reasons.push('High approval rate');
    }

    return reasons.slice(0, 3); // Top 3 reasons
  }

  /**
   * Get featured lenders (best matches, limited to top N)
   */
  static async getFeaturedLenders(offers: LenderOffer[], limit = 5): Promise<LenderOffer[]> {
    return offers.slice(0, limit);
  }

  /**
   * Seed sample lenders to database (for testing/demo)
   */
  static async seedSampleLenders(): Promise<void> {
    const db = admin.firestore();
    const now = new Date();

    const sampleLenders: LenderProfile[] = [
      {
        name: 'HDFC Bank',
        category: 'bank',
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
        interestRateRange: { min: 7.5, max: 12.0 },
        processingFeePercentage: 0.5,
        turnaroundTimeDays: 3,
        approvalRate: 0.85,
        logoUrl: 'https://via.placeholder.com/200?text=HDFC',
        website: 'https://www.hdfcbank.com',
        phone: '+91-1860-2255-255',
        active: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        name: 'Bajaj Finserv',
        category: 'nbfc',
        minLoanAmount: 50000,
        maxLoanAmount: 3000000,
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
        interestRateRange: { min: 9.0, max: 14.0 },
        processingFeePercentage: 1.0,
        turnaroundTimeDays: 2,
        approvalRate: 0.88,
        logoUrl: 'https://via.placeholder.com/200?text=Bajaj',
        website: 'https://www.bajajfinserv.com',
        phone: '+91-9876543210',
        active: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        name: 'Indifi',
        category: 'fintech',
        minLoanAmount: 25000,
        maxLoanAmount: 1000000,
        minTenure: 12,
        maxTenure: 48,
        minAge: 20,
        maxAge: 65,
        minCreditScore: 600,
        minMonthlyIncome: 15000,
        maxExistingEmi: 70,
        acceptableSalaried: true,
        acceptableSelfEmployed: true,
        acceptableBusiness: true,
        interestRateRange: { min: 10.0, max: 18.0 },
        processingFeePercentage: 2.0,
        turnaroundTimeDays: 1,
        approvalRate: 0.75,
        logoUrl: 'https://via.placeholder.com/200?text=Indifi',
        website: 'https://www.indifi.com',
        phone: '+91-9000009000',
        active: true,
        createdAt: now,
        updatedAt: now,
      },
    ];

    for (const lender of sampleLenders) {
      await db.collection('lenders').add(lender);
    }

    console.log(`Seeded ${sampleLenders.length} sample lenders`);
  }
}

export default LenderMatchingEngine;
