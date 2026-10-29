// Mock AI Analysis Engine - Extensible for real AI integration
export interface Transaction {
  date: string;
  description: string;
  amount: number;
  type: 'debit' | 'credit';
  category: string;
}

export interface ArchetypeDetail {
  title: string;
  subtitle: string;
  description: string;
  strengths: string[];
  weaknesses: string[];
  approvalTendency: string;
  badgeColor: string;
  spendingPatterns: string;
  emotionalProfile: string;
  riskLevel: 'Very Low' | 'Low' | 'Medium' | 'High' | 'Critical';
}

export interface ActionableImprovement {
  action: string;
  category: string;
  impact: string;
  timeframe: string;
  projectedScoreIncrease: number;
  description: string;
}

export interface AnalysisResult {
  id: string;
  approvalScore: number;
  percentileRank: number;
  financialStability: number;
  incomeConsistency: number;
  emiCapacity: number;
  spendingHealth: number;
  riskLevel: 'low' | 'medium' | 'high';
  monthlyIncome: number;
  monthlyExpense: number;
  totalEMI: number;
  archetype: string;
  archetypeDetails: ArchetypeDetail;
  aiInsights: string[];
  redFlags: string[];
  positiveSignals: string[];
  recommendations: string[];
  actionableImprovements: ActionableImprovement[];
  underwritingSimulation: {
    positiveSignals: string[];
    hiddenRedFlags: string[];
    approvalBoosters: string[];
    rejectionTriggers: string[];
  };
  spendingBreakdown: Record<string, number>;
  balanceTrend: Array<{ month: string; balance: number }>;
  riskFactors: Array<{ factor: string; impact: number }>;
  cashflowMovement: Array<{ month: string; inflow: number; outflow: number }>;
}

const ARCHETYPES_DATA: Record<string, ArchetypeDetail> = {
  'Stable Builder': {
    title: 'Stable Builder',
    subtitle: 'High Predictability · Low Risk',
    description: 'You exhibit textbook financial reliability. Banks love your profile because your salary hits on the exact same day, your expenses are predictable, and your EMI outflow is well within RBI safety margins.',
    strengths: ['Clockwork salary credits', 'Consistent monthly savings rate', 'Zero late payment flags'],
    weaknesses: ['Conservative credit utilization limits credit score growth', 'High cash allocation losing out to inflation'],
    approvalTendency: 'Auto-Approval across 94% of Tier-1 Banks and NBFCs.',
    badgeColor: 'border-green-500/30 bg-green-500/10 text-green-400',
    spendingPatterns: 'Highly structured. Major outflows occur in the first week post-salary, followed by consistent low-velocity utility payments.',
    emotionalProfile: 'Security-oriented. You value predictable stability and maintain buffer reserves over impulsive gratification.',
    riskLevel: 'Very Low'
  },
  'Leveraged Dreamer': {
    title: 'Leveraged Dreamer',
    subtitle: 'High Cashflow · High Debt Obligation',
    description: 'You earn well but carry significant lifestyle debt. While your cash inflow is strong, your Fixed Obligation to Income Ratio (FOIR) is dangerously close to the 50% redline.',
    strengths: ['High absolute income quantum', 'Excellent banking relationship and premium accounts', 'High willingness to pay'],
    weaknesses: ['Heavy reliance on credit cards and BNPL', 'EMI load exceeds 45% of net monthly take-home', 'Vulnerable to single-month cashflow shocks'],
    approvalTendency: 'Manual Underwriting Required. High probability of co-applicant requirement.',
    badgeColor: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400',
    spendingPatterns: 'Front-loaded lifestyle spending. Heavy card swaps at premium merchants and frequent EMI conversions.',
    emotionalProfile: 'Aspirational spender. You utilize credit as leverage to enjoy tomorrow\'s lifestyle today.',
    riskLevel: 'High'
  },
  'Aggressive Optimizer': {
    title: 'Aggressive Optimizer',
    subtitle: 'Maximum Efficiency · Sophisticated Operator',
    description: 'You treat your personal finances like a corporate balance sheet. You maximize credit card reward points, utilize zero-cost EMIs, and keep cash fully invested until the last possible due date.',
    strengths: ['Impeccable credit score (780+)', 'Exceptional credit utilization management', 'Zero idle cash drag'],
    weaknesses: ['Multiple active credit lines can trigger automated credit-seeking flags', 'Complex transaction patterns confuse basic algorithms'],
    approvalTendency: 'Prime Tier Approval. Eligible for lowest interest rate slabs.',
    badgeColor: 'border-purple-500/30 bg-purple-500/10 text-purple-400',
    spendingPatterns: 'Extremely high transaction volume but clustered strictly around billing dates. Highly optimized reward loops.',
    emotionalProfile: 'Calculation-focused. You view personal finance as a game of optimization and numeric arbitrage.',
    riskLevel: 'Low'
  },
  'Silent Saver': {
    title: 'Silent Saver',
    subtitle: 'Deep Reserves · Minimal Credit Footprint',
    description: 'You live well below your means and maintain savings account liquidity. However, your reluctance to use credit means banks have very little repayment history to evaluate.',
    strengths: ['Massive liquid cash buffer (>6 months expenses)', 'Extremely low debt-to-income ratio (<10%)', 'Zero speculative outflows'],
    weaknesses: ['Thin credit file / lack of active trade lines', 'No recent term loan repayment history'],
    approvalTendency: 'High Approval Odds, but initial credit limits may be conservative due to lack of track record.',
    badgeColor: 'border-blue-500/30 bg-blue-500/10 text-blue-400',
    spendingPatterns: 'Frugal and slow. Very few discretionary transactions; savings rate consistently exceeds 50%.',
    emotionalProfile: 'Risk-averse. Financial peace of mind for you is defined by the size of your cash reserve, not your credit limit.',
    riskLevel: 'Very Low'
  },
  'Chaotic Spender': {
    title: 'Chaotic Spender',
    subtitle: 'High Volatility · Unpredictable Outflows',
    description: 'Your account experiences extreme swings. Massive inflows are quickly followed by intense weekend spending spikes, impulsive UPI transfers, and frequent dips below the minimum balance threshold.',
    strengths: ['Ability to generate rapid cash infusions', 'Comfortable with financial risk'],
    weaknesses: ['Frequent minimum balance penalty flags', 'Highly erratic discretionary spending', 'High UPI micro-transaction volume cluttering statement'],
    approvalTendency: 'High Rejection Risk. Automated algorithms flag high volatility as default risk.',
    badgeColor: 'border-red-500/30 bg-red-500/10 text-red-400',
    spendingPatterns: 'Highly chaotic. Dozens of micro-UPI debits daily alongside massive weekend restaurant and retail swipes.',
    emotionalProfile: 'Impulsive. Money represents immediate freedom, leading to erratic lifestyle spending followed by periods of cash strain.',
    riskLevel: 'Critical'
  },
  'Founder Risk Profile': {
    title: 'Founder Risk Profile',
    subtitle: 'Variable Inflows · High Conviction',
    description: 'You operate like an entrepreneur. Your income comes in lump-sum milestone tranches rather than monthly salary credits. You invest heavily into your business or personal growth.',
    strengths: ['High peak earning potential', 'Substantial asset backing or equity value', 'Advanced financial literacy'],
    weaknesses: ['Automated systems reject lack of fixed monthly salary', 'High business expense mingling in personal accounts'],
    approvalTendency: 'Requires specialized NBFC underwriting or cashflow-based lending programs.',
    badgeColor: 'border-orange-500/30 bg-orange-500/10 text-orange-400',
    spendingPatterns: 'Highly seasonal. Massive inflows followed by corporate/equity investments and low personal drawdowns.',
    emotionalProfile: 'Wealth builder. You view money as working capital to reinvest rather than an index of safety or consumption.',
    riskLevel: 'Medium'
  },
  'Conservative Operator': {
    title: 'Conservative Operator',
    subtitle: 'Steady State · Traditional Borrower',
    description: 'You prefer traditional banking products like Fixed Deposits and standard term loans. You avoid modern fintech apps, BNPL, or speculative investments, maintaining a pristine, straightforward record.',
    strengths: ['Long-term banking relationship (>5 years)', 'Highly stable employment profile', 'Zero high-risk merchant transactions'],
    weaknesses: ['Slower salary growth trajectory', 'Reluctance to negotiate digital-first loan offers'],
    approvalTendency: 'Guaranteed Approval at traditional PSU and Tier-1 Private Banks.',
    badgeColor: 'border-teal-500/30 bg-teal-500/10 text-teal-400',
    spendingPatterns: 'Steady and conventional. Recurring rent, utility bill auto-payments, and zero modern digital loan/BNPL transactions.',
    emotionalProfile: 'Safety-centric. You sleep best with structured bank deposits and avoid anything resembling leverage or volatility.',
    riskLevel: 'Low'
  },
  'Growth Gambler': {
    title: 'Growth Gambler',
    subtitle: 'Speculative Trades · High Outflow Velocity',
    description: 'You seek rapid wealth generation. You route significant chunks of cash directly into stock brokers, mutual funds, cryptocurrency exchanges, or angel investments, leaving minimal cash reserves in your primary checking account.',
    strengths: ['Rapid asset accumulation capability', 'High financial awareness and risk tolerance', 'Modern tech-native profile'],
    weaknesses: ['Low liquidity buffers in checking account', 'Erratic outflows to brokerages look like spending spikes to underwriters'],
    approvalTendency: 'Medium approval odds. Underwriters require brokerage account statements to verify asset balances.',
    badgeColor: 'border-pink-500/30 bg-pink-500/10 text-pink-400',
    spendingPatterns: 'Heavy transfers to investment apps in the first 48 hours of salary credit, followed by tight checking account liquidity.',
    emotionalProfile: 'Opportunistic. You view cash as an asset that is constantly losing value to inflation, choosing to keep it fully deployed.',
    riskLevel: 'Medium'
  },
  'Credit Survivor': {
    title: 'Credit Survivor',
    subtitle: 'Recovering Profile · Rising Stability',
    description: 'You are recovering from past cashflow bottlenecks or credit delays. Your recent statements show a strong upward trajectory in minimum balances, but older trade lines still carry legacy inquiry baggage.',
    strengths: ['High recent savings discipline', 'Consolidation of past high-interest loans', 'Clear upward trend in average monthly balances'],
    weaknesses: ['Historical late payments on bureau records', 'Priced into higher interest brackets by risk algorithms'],
    approvalTendency: 'Requires manual credit manager sign-off. Best suited for security-backed loans initially.',
    badgeColor: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
    spendingPatterns: 'Strictly budgeted. Prioritizes debt payments and essential bills, with zero discretionary lifestyle credit card swipes.',
    emotionalProfile: 'Resilient and focused. Having experienced credit distress, you are highly protective of your new-found financial stability.',
    riskLevel: 'High'
  },
  'Smart Accumulator': {
    title: 'Smart Accumulator',
    subtitle: 'Highly Optimized Savings · High Debt Capacity',
    description: 'You strike the perfect balance between liquid cash reserves and long-term asset creation. You maintain an optimal DTI ratio while keeping enough credit line utilization to build a stellar CIBIL history.',
    strengths: ['Stellar debt service capacity', 'Diversified financial assets', 'Optimal monthly balance preservation (>30% of income)'],
    weaknesses: ['Over-analysis of loan products can delay borrowing opportunities', 'Low tolerance for pricing markups by lenders'],
    approvalTendency: 'Instant Pre-Approval at all partner NBFCs and prime private banks.',
    badgeColor: 'border-indigo-500/30 bg-indigo-500/10 text-indigo-400',
    spendingPatterns: 'Balanced and automated. SIPs, rent, and utility bills are auto-debited cleanly, leaving a highly predictable lifestyle balance.',
    emotionalProfile: 'Balanced and strategic. You view credit as a utility tool to build wealth, matching it meticulously with your cash reserves.',
    riskLevel: 'Very Low'
  }
};

// Generate realistic mock analysis
export function generateMockAnalysis(fileName: string): AnalysisResult {
  const now = new Date();

  // Mock salary (consistent income)
  const monthlySalary = Math.floor(Math.random() * 200000) + 50000;

  // Mock expenses
  const discretionarySpending = Math.floor(Math.random() * 30000) + 10000;
  const fixedExpenses = Math.floor(Math.random() * 20000) + 5000;
  const bnplExpenses = Math.floor(Math.random() * 15000) + 0;
  const totalExpense = discretionarySpending + fixedExpenses + bnplExpenses;

  // Mock EMI (auto loans, personal loans)
  const totalEMI = Math.floor(Math.random() * 50000) + 10000;

  // Calculate stability scores
  const incomeConsistency = Math.max(100 - Math.floor(Math.random() * 30), 65);
  const financialStability = Math.max(100 - Math.floor(Math.random() * 25), 60);
  const emiCapacity = Math.max(100 - Math.round((totalEMI / monthlySalary) * 100), 35);
  const spendingHealth = Math.max(100 - Math.round((totalExpense / monthlySalary) * 100), 25);

  // Approval score based on metrics
  const approvalScore = Math.min(Math.round(
    (incomeConsistency * 0.3 +
      financialStability * 0.25 +
      emiCapacity * 0.25 +
      spendingHealth * 0.2) * 0.85 + Math.random() * 10
  ), 98);

  const percentileRank = Math.min(Math.max(approvalScore - Math.floor(Math.random() * 12), 45), 99);

  // Risk level
  let riskLevel: 'low' | 'medium' | 'high' = 'medium';
  if (approvalScore > 75) riskLevel = 'low';
  if (approvalScore < 55) riskLevel = 'high';

  // Generate balance trend & cashflow
  const balanceTrend = [];
  const cashflowMovement = [];
  let currentBalance = Math.floor(Math.random() * 500000) + 50000;

  for (let i = 5; i >= 0; i--) {
    const monthDate = new Date(now);
    monthDate.setMonth(monthDate.getMonth() - i);
    const monthName = monthDate.toLocaleString('en-IN', { month: 'short' });

    const inflow = monthlySalary + (Math.random() > 0.7 ? Math.floor(Math.random() * 40000): 0);
    const outflow = totalExpense + totalEMI + Math.floor(Math.random() * 20000);

    balanceTrend.push({
      month: monthName,
      balance: Math.max(currentBalance + inflow - outflow, 15000),
    });

    cashflowMovement.push({
      month: monthName,
      inflow,
      outflow
    });

    currentBalance = balanceTrend[balanceTrend.length - 1].balance;
  }

  // Archetypes selection
  const archetypeKeys = Object.keys(ARCHETYPES_DATA);
  const archetype = archetypeKeys[Math.floor(Math.random() * archetypeKeys.length)];
  const archetypeDetails = ARCHETYPES_DATA[archetype];

  // AI Insights
  const aiInsights = [
    "Banks may flag your inconsistent salary deposit timings across the last 3 months.",
    "Your weekend spending spikes are 42% higher than the average prime borrower.",
    "Your EMI load exceeds 61% of similar income profiles in your geography.",
    "Low balance periods observed in the second week of the month reduce underwriting confidence.",
    "Zero late payment penalty charges detected; this boosts your trust score by 15 pts."
  ];

  // Red flags
  const redFlags = [];
  if (incomeConsistency < 75) redFlags.push('Irregular salary deposit intervals detected');
  if (balanceTrend[balanceTrend.length - 1].balance < 50000) redFlags.push('Average monthly balance dropping below prime thresholds');
  if (totalEMI / monthlySalary > 0.4) redFlags.push('Fixed Obligation to Income Ratio (FOIR) exceeds 40%');
  if (bnplExpenses > 10000) redFlags.push('High frequency of Buy-Now-Pay-Later (BNPL) micro-loans');
  if (discretionarySpending > monthlySalary * 0.35) redFlags.push('Discretionary spending velocity exceeding peer benchmarks');
  if (redFlags.length === 0) redFlags.push('No critical concerns identified');

  // Positive signals
  const positiveSignals = [
    'Pristine account maintenance with zero bounce/NSF flags',
    'Consistent primary salary routing through same account',
    'Healthy liquidity buffer maintained post-EMI deductions',
    'Low credit card cash advance utilization (<2%)',
    'High vintage banking relationship established'
  ];

  // Recommendations
  const recommendations = [
    'Maintain a minimum daily closing balance of ₹50,000 to unlock prime interest slabs',
    'Consolidate active BNPL accounts into a single low-interest credit line',
    'Schedule automated EMI debits 3 days post salary credit date',
    'Reduce discretionary weekend dining outflows by 18% to improve DTI',
    'Avoid initiating new credit inquiries for the next 45 days'
  ];

  // Actionable Improvements
  const actionableImprovements: ActionableImprovement[] = [
    {
      action: 'Consolidate BNPL & Micro-Loans',
      category: 'Debt Structure',
      impact: 'High Impact',
      timeframe: '30 Days',
      projectedScoreIncrease: 14,
      description: 'Closing 3 active Buy-Now-Pay-Later accounts removes automated credit-seeking red flags from banking algorithms.'
    },
    {
      action: 'Automate Salary Buffer Retention',
      category: 'Liquidity',
      impact: 'Medium Impact',
      timeframe: 'Immediate',
      projectedScoreIncrease: 8,
      description: 'Ensuring your account balance never drops below ₹40,000 in the third week of the month boosts algorithmic stability scoring.'
    },
    {
      action: 'Optimize Credit Card Billing Cycle',
      category: 'Credit Utilization',
      impact: 'High Impact',
      timeframe: '15 Days',
      projectedScoreIncrease: 11,
      description: 'Paying down 50% of your outstanding balance 3 days before the statement generation date slashes your reported utilization ratio.'
    },
    {
      action: 'Eliminate UPI Micro-Clutter',
      category: 'Statement Cleanliness',
      impact: 'Low Impact',
      timeframe: '60 Days',
      projectedScoreIncrease: 5,
      description: 'Routing small transactions (<₹200) through a wallet rather than primary bank account prevents statement clutter during manual underwriter reviews.'
    }
  ];

  // Underwriting Simulation
  const underwritingSimulation = {
    positiveSignals: [
      'Primary salary routing verified via automated ACH codes',
      'Zero cheque bounce or ECS return charges in last 180 days',
      'Average monthly balance (AMB) trending positively over 6 months',
      'Stable residential address vintage associated with bank account'
    ],
    hiddenRedFlags: [
      'High velocity of ATM cash withdrawals post salary credit',
      'Frequent transactions with high-risk merchant categories (gaming/crypto)',
      'Multiple recent inquiries from consumer durable lenders',
      'Discrepancy between declared salary and actual bank inflows'
    ],
    approvalBoosters: [
      'Adding a co-applicant with >₹60,000 monthly salaried income',
      'Providing 3 years of ITR verification alongside bank statements',
      'Opting for a slightly shorter loan tenure (e.g., 36 months vs 48 months)',
      'Maintaining an active corporate salary account relationship'
    ],
    rejectionTriggers: [
      'Inward cheque return due to insufficient funds within last 90 days',
      'Existing unsecured debt servicing exceeding 55% of net income',
      'Salary credits originating from unverified or blacklisted employer entities',
      'Recent settlement flag or write-off reported on CIBIL bureau'
    ]
  };

  // Spending breakdown
  const spendingBreakdown = {
    'Groceries & Food': Math.floor(Math.random() * 15000) + 5000,
    'Shopping & Lifestyle': Math.floor(Math.random() * 20000) + 5000,
    'UPI & Peer Transfers': Math.floor(Math.random() * 30000) + 10000,
    'Subscriptions & Tech': Math.floor(Math.random() * 5000) + 500,
    'Dining & Entertainment': Math.floor(Math.random() * 10000) + 2000,
    'Utilities & Bills': Math.floor(Math.random() * 8000) + 2000,
    'Other Discretionary': Math.floor(Math.random() * 15000) + 5000,
  };

  // Risk factors
  const riskFactors = [
    { factor: 'Income Stability', impact: 100 - incomeConsistency },
    { factor: 'EMI Pressure', impact: Math.min(Math.round((totalEMI / monthlySalary) * 100), 100) },
    { factor: 'Balance Volatility', impact: Math.round(Math.random() * 35 + 10) },
    { factor: 'Spending Volatility', impact: Math.round(Math.random() * 40 + 15) },
    { factor: 'Credit Utilization', impact: Math.round(Math.random() * 50 + 10) },
  ];

  return {
    id: `report-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    approvalScore,
    percentileRank,
    financialStability,
    incomeConsistency,
    emiCapacity,
    spendingHealth,
    riskLevel,
    monthlyIncome: monthlySalary,
    monthlyExpense: totalExpense,
    totalEMI,
    archetype,
    archetypeDetails,
    aiInsights,
    redFlags,
    positiveSignals,
    recommendations,
    actionableImprovements,
    underwritingSimulation,
    spendingBreakdown,
    balanceTrend,
    riskFactors,
    cashflowMovement,
  };
}

// Simulate analysis steps for animation
export const ANALYSIS_STEPS = [
  { step: 'Parsing Transactions', duration: 2000, message: 'Reading your bank statement...' },
  { step: 'Detecting Income', duration: 1800, message: 'Identifying salary patterns...' },
  { step: 'Analyzing Spending', duration: 2000, message: 'Analyzing spending behavior...' },
  { step: 'EMI Detection', duration: 1500, message: 'Detecting EMI obligations...' },
  { step: 'Risk Assessment', duration: 2000, message: 'Running risk analysis...' },
  { step: 'Generating Insights', duration: 1200, message: 'Generating final report...' },
];

export const TOTAL_ANALYSIS_TIME = ANALYSIS_STEPS.reduce((sum, step) => sum + step.duration, 0);
