import React, { useState, useMemo } from 'react';
import { Breadcrumbs } from '../../components/Breadcrumbs';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { Calculator, ArrowRight, IndianRupee, Percent, Clock, ShieldCheck, ChevronDown, ChevronUp, Zap, Sparkles, HelpCircle, Info, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const fmt = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const FAQS = [
  { q: 'What is a general loan affordability calculator?', a: 'A loan affordability calculator estimates the maximum loan amount you can comfortably afford to borrow based on your monthly income, existing debt obligations, and target interest rate.' },
  { q: 'How does loan type affect affordability?', a: 'Different loan types have varying guidelines. Home loans generally allow higher FOIR limits (up to 55-60%) and longer tenures (up to 30 years). Personal loans are riskier, so banks restrict DTI limits to 40-45% and tenures to 5 years.' },
  { q: 'What formula is used to calculate loan affordability?', a: 'First, your maximum monthly EMI capacity is computed: (Net Income × FOIR%) - Existing EMIs. Then, the maximum loan amount is derived using the Present Value of Annuity formula: P = EMI × [(1 - (1 + r)^-n) / r], where r is the monthly interest rate and n is the tenure in months.' },
  { q: 'Can I add a co-applicant to increase my loan affordability?', a: 'Yes. Adding a co-applicant (typically a spouse, parent, or sibling) with a stable income source allows lenders to combine both incomes, increasing the overall monthly EMI capacity and eligible loan amount.' },
  { q: 'What happens if my existing EMIs are too high?', a: 'High existing EMIs reduce your available EMI capacity. If your current EMIs exceed your calculated FOIR limit, your new loan affordability will drop to zero until you pay down existing debt.' }
];

const LOAN_TYPES = [
  { id: 'personal', label: 'Personal Loan', maxFoir: 45, maxTenureYrs: 5, defaultRate: 11.5 },
  { id: 'business', label: 'Business Loan', maxFoir: 50, maxTenureYrs: 7, defaultRate: 14.0 },
  { id: 'car', label: 'Car Loan', maxFoir: 50, maxTenureYrs: 7, defaultRate: 9.0 },
  { id: 'home', label: 'Home Loan', maxFoir: 55, maxTenureYrs: 25, defaultRate: 8.75 },
];

export default function LoanAffordabilityCalculator() {
  const navigate = useNavigate();

  // Inputs
  const [monthlyIncome, setMonthlyIncome] = useState(120000);
  const [existingEmi, setExistingEmi] = useState(15000);
  const [loanType, setLoanType] = useState('personal');
  const [interestRate, setInterestRate] = useState(11.5);
  const [tenureYrs, setTenureYrs] = useState(5);
  const [spendingTier, setSpendingTier] = useState<'conservative' | 'moderate' | 'aggressive'>('moderate');

  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  // Sync default rate and tenure when loan type changes
  const handleLoanTypeChange = (typeId: string) => {
    setLoanType(typeId);
    const selected = LOAN_TYPES.find(l => l.id === typeId);
    if (selected) {
      setInterestRate(selected.defaultRate);
      setTenureYrs(Math.min(tenureYrs, selected.maxTenureYrs));
    }
  };

  // Calculations
  const affordability = useMemo(() => {
    const selectedType = LOAN_TYPES.find(l => l.id === loanType) || LOAN_TYPES[0];

    // Adjust FOIR limit based on spending tier
    let foirLimit = selectedType.maxFoir;
    if (spendingTier === 'conservative') {
      foirLimit -= 10;
    } else if (spendingTier === 'aggressive') {
      foirLimit += 5;
    }

    // Max monthly EMI available
    const maxTotalEmi = (monthlyIncome * foirLimit) / 100;
    const availableEmi = Math.max(0, maxTotalEmi - existingEmi);

    // Max loan amount
    const n = tenureYrs * 12; // months
    const r = interestRate / 12 / 100; // monthly rate
    let maxLoan = 0;

    if (availableEmi > 0 && r > 0) {
      const factor = Math.pow(1 + r, n);
      maxLoan = Math.round(availableEmi * (factor - 1) / (r * factor));
    }

    const actualEmi = maxLoan > 0 ? availableEmi: 0;
    const totalPayment = actualEmi * n;
    const totalInterest = Math.max(0, totalPayment - maxLoan);

    const dtiRatio = monthlyIncome > 0 ? Math.round(((existingEmi + actualEmi) / monthlyIncome) * 100): 0;
    const isOverLeveraged = dtiRatio > 50;

    return {
      foirLimit,
      maxTotalEmi,
      availableEmi,
      maxLoan,
      actualEmi,
      totalInterest,
      totalPayment,
      dtiRatio,
      isOverLeveraged,
    };
  }, [monthlyIncome, existingEmi, loanType, interestRate, tenureYrs, spendingTier]);

  const maxTenureLimit = useMemo(() => {
    const selected = LOAN_TYPES.find(l => l.id === loanType);
    return selected ? selected.maxTenureYrs: 5;
  }, [loanType]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-orange-500/30 overflow-x-hidden">
      <Helmet>
        <title>Loan Affordability Calculator: Estimate Your Max Loan Amount &amp; EMIs | Gavel AI</title>
        <meta name="description" content="Avoid rejection. Calculate the maximum loan amount you can afford based on your net income and expenses. Estimate monthly EMIs and check eligibility for free." />
        <link rel="canonical" href="https://www.trygavel.com/tools/loan-affordability-calculator" />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org', '@type': 'WebApplication',
          name: 'Loan Affordability Calculator', applicationCategory: 'FinanceApplication',
          operatingSystem: 'All', offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
          publisher: { '@type': 'Organization', name: 'Gavel AI' },
        })}</script>
      </Helmet>

      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,127,14,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,127,14,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />
        <motion.div
          animate={{ x: [0, 50, 0], y: [0, 30, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 15, repeat: Infinity }}
          className="absolute top-0 right-0 w-[600px] h-[600px] bg-orange-500/10 rounded-full blur-[120px]"
        />
        <motion.div
          animate={{ x: [0, -30, 0], y: [0, 50, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 20, repeat: Infinity }}
          className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-orange-600/10 rounded-full blur-[100px]"
        />
      </div>


      <Navbar />

      <main className="flex-1 pt-32 pb-24 relative z-10">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Breadcrumbs */}
                    <Breadcrumbs items={[
            { label: 'Home', path: '/' },
            { label: 'Tools', path: '/tools' },
            { label: 'Loan Affordability Calculator', path: '/tools/loan-affordability-calculator' }
          ]} />

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
            <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 text-orange-700 dark:text-orange-400 text-sm mb-4 px-4 py-1.5 rounded-full backdrop-blur-sm">
              <Calculator className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
              <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Affordability Guide</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">Loan Affordability Calculator</h1>
            <p className="text-lg text-muted-foreground max-w-2xl">Find out your true borrowing potential. Balance income, interest rates, and loan categories to determine how much you can borrow safely.</p>
          </motion.div>

          <div className="grid lg:grid-cols-5 gap-8">
            {/* Left: Input parameter panel */}
            <div className="lg:col-span-2 space-y-6">
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                className="glass-panel border-border shadow-2xl rounded-2xl p-6 space-y-6">

                {/* Loan Type */}
                <div>
                  <Label className="text-xs text-muted-foreground font-semibold mb-2 block">Select Loan Type</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {LOAN_TYPES.map(l => (
                      <button key={l.id} onClick={() => handleLoanTypeChange(l.id)}
                        className={`py-2 text-xs font-semibold rounded-lg border transition-all ${loanType === l.id ? 'bg-emerald-600 border-emerald-700 text-white': 'bg-white/5 border-white/10 text-muted-foreground hover:text-foreground'}`}>
                        {l.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Net Income */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-xs text-muted-foreground font-semibold">Net Monthly Income (Take-Home)</Label>
                    <span className="text-sm font-bold text-foreground">{fmt(monthlyIncome)}</span>
                  </div>
                  <Slider value={[monthlyIncome]} min={15000} max={1000000} step={5000}
                    onValueChange={([v]) => setMonthlyIncome(v)} className="mb-2" />
                  <Input type="number" value={monthlyIncome} onChange={e => setMonthlyIncome(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-surface border-border text-foreground text-xs h-9" />
                </div>

                {/* Existing EMIs */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-xs text-muted-foreground font-semibold">Existing Monthly EMIs</Label>
                    <span className="text-sm font-bold text-red-700 dark:text-red-400">{fmt(existingEmi)}</span>
                  </div>
                  <Slider value={[existingEmi]} min={0} max={Math.max(existingEmi, monthlyIncome * 0.7)} step={1000}
                    onValueChange={([v]) => setExistingEmi(v)} className="mb-2" />
                  <Input type="number" value={existingEmi} onChange={e => setExistingEmi(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-surface border-border text-foreground text-xs h-9" />
                </div>

                {/* Spending Profile / Risk tolerance */}
                <div>
                  <Label className="text-xs text-muted-foreground font-semibold mb-2 block">DTI Spending Rule</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'conservative' as const, label: 'Conservative' },
                      { id: 'moderate' as const, label: 'Balanced' },
                      { id: 'aggressive' as const, label: 'Aggressive' },
                    ].map(opt => (
                      <button key={opt.id} onClick={() => setSpendingTier(opt.id)}
                        className={`py-2 text-[10px] font-semibold rounded-lg border transition-all ${spendingTier === opt.id ? 'bg-emerald-600 border-emerald-700 text-white': 'bg-white/5 border-white/10 text-muted-foreground hover:text-foreground'}`}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Interest Rate */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-xs text-muted-foreground font-semibold">Expected Interest Rate (p.a.)</Label>
                    <span className="text-sm font-bold text-foreground">{interestRate}%</span>
                  </div>
                  <Slider value={[interestRate]} min={6} max={25} step={0.25}
                    onValueChange={([v]) => setInterestRate(v)} className="mb-2" />
                </div>

                {/* Tenure */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-xs text-muted-foreground font-semibold">Loan Tenure</Label>
                    <span className="text-sm font-bold text-foreground">{tenureYrs} Years ({tenureYrs * 12} months)</span>
                  </div>
                  <Slider value={[tenureYrs]} min={1} max={maxTenureLimit} step={1}
                    onValueChange={([v]) => setTenureYrs(v)} className="mb-2" />
                </div>

              </motion.div>
            </div>

            {/* Right: Results & Output */}
            <div className="lg:col-span-3 space-y-6">
              {/* Max Borrowing Capacity Card */}
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                className="bg-gradient-to-br from-orange-500/15 via-orange-500/5 to-transparent border border-orange-500/30 shadow-2xl rounded-2xl p-8 relative overflow-hidden">
                <div className="absolute top-4 right-4 bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs px-2.5 py-1 rounded-full flex items-center gap-1 font-semibold border border-emerald-500/30">
                  <ShieldCheck className="w-3.5 h-3.5" /> High Trust Rules
                </div>

                <div className="text-center mb-6">
                  <p className="text-sm text-muted-foreground mb-2">Estimated Maximum Affordability Budget</p>
                  <motion.div key={affordability.maxLoan} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    className="text-5xl md:text-6xl font-black text-foreground tracking-tight">
                    {fmt(affordability.maxLoan)}
                  </motion.div>
                  <p className="text-xs text-muted-foreground mt-2">At {interestRate}% interest rate for {tenureYrs} Years</p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                  <div className="bg-surface p-4 rounded-xl">
                    <p className="text-xs text-muted-foreground mb-1">Affordable New Monthly EMI</p>
                    <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">{fmt(affordability.availableEmi)}/mo</p>
                  </div>
                  <div className="bg-surface p-4 rounded-xl">
                    <p className="text-xs text-muted-foreground mb-1">Estimated Total Interest</p>
                    <p className="text-lg font-bold text-muted-foreground">{fmt(affordability.totalInterest)}</p>
                  </div>
                </div>
              </motion.div>

              {/* Debt-to-Income / FOIR checker display */}
              <div className="glass-panel border-border shadow-2xl rounded-2xl p-6 space-y-4">
                <h3 className="text-sm font-bold text-foreground">Underwriting & DTI Check</h3>

                <div>
                  <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                    <span>Used Monthly Capacity (FOIR Limit: {affordability.foirLimit}%)</span>
                    <span>{affordability.dtiRatio}% of Income Used</span>
                  </div>
                  <div className="h-3 rounded-full bg-surface overflow-hidden flex">
                    <div className="bg-red-400" style={{ width: `${Math.min(100, (existingEmi / monthlyIncome) * 100)}%` }} />
                    <div className="bg-emerald-400" style={{ width: `${Math.min(100, (affordability.actualEmi / monthlyIncome) * 100)}%` }} />
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground mt-1.5">
                    <span>Existing Liabilities ({Math.round((existingEmi / monthlyIncome) * 100)}%)</span>
                    <span>New EMI Capacity ({Math.round((affordability.availableEmi / monthlyIncome) * 100)}%)</span>
                  </div>
                </div>

                {/* Status Warnings */}
                {affordability.isOverLeveraged ? (
                  <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <AlertTriangle className="w-5 h-5 text-red-700 dark:text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-red-700 dark:text-red-400">Debt Overburden Warning</p>
                      <p className="text-[11px] text-muted-foreground mt-1">Total monthly EMI obligation exceeds 50% of monthly earnings. Banks consider this high risk. Extend tenure or pay down credit card balances.</p>
                    </div>
                  </div>
                ): (
                  <div className="flex items-start gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                    <CheckCircle2 className="w-5 h-5 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Healthy Underwriting Profile</p>
                      <p className="text-[11px] text-muted-foreground mt-1">Your debt-to-income profile is inside acceptable industry limits. Approval risk is low for prime lenders.</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Predictor redirection */}
              <div className="bg-gradient-to-r from-orange-500/10 to-orange-600/10 border border-orange-500/20 rounded-2xl p-6">
                <h4 className="text-base font-bold text-foreground mb-2 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-orange-600 dark:text-orange-500" /> Run Pre-Approval Predictor Checks
                </h4>
                <p className="text-xs text-muted-foreground mb-4">Underwriters combine debt capacity checks with transaction anomalies, credit scores, and employer categories. Run our AI analysis check now.</p>
                <Button onClick={() => navigate('/loan-approval-predictor')} className="bg-orange-500 hover:bg-orange-600 text-white w-full py-4 text-sm font-bold">
                  Predict Pre-Approval Odds <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>

            </div>
          </div>

          {/* FAQs section */}
          <section className="mt-16 border-t border-border pt-16">
            <h2 className="text-3xl font-bold text-foreground mb-8">Frequently Asked Questions</h2>
            <div className="space-y-3 max-w-3xl">
              {FAQS.map((faq, i) => (
                <div key={i} className="border border-border rounded-xl overflow-hidden hover:border-orange-500/20 transition-all">
                  <button onClick={() => setFaqOpen(faqOpen === i ? null: i)}
                    className="w-full flex items-center justify-between p-5 text-left gap-4">
                    <span className="text-base font-semibold text-foreground">{faq.q}</span>
                    {faqOpen === i ? <ChevronUp className="w-5 h-5 text-orange-600 dark:text-orange-500 shrink-0" />: <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0" />}
                  </button>
                  {faqOpen === i && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 pb-5">
                      <p className="text-muted-foreground leading-relaxed">{faq.a}</p>
                    </motion.div>
                  )}
                </div>
              ))}
            </div>
          </section>

        </div>
      </main>

      <Footer />
    </div>
  );
}
