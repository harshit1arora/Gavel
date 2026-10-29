import React, { useState, useMemo } from 'react';
import { Breadcrumbs } from '../../components/Breadcrumbs';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { Calculator, ArrowRight, IndianRupee, Percent, ShieldCheck, ChevronDown, ChevronUp, Zap, Sparkles, HelpCircle, Info, CheckCircle2, AlertTriangle, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const fmt = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const FAQS = [
  { q: 'What is a loan tenure optimizer?', a: 'A loan tenure optimizer is an interactive financial tool designed to compare different loan tenures side-by-side. It displays how changes in tenure affect both your monthly EMI and the total interest paid over the life of the loan.' },
  { q: 'Is a shorter loan tenure always better?', a: 'From an interest savings perspective, yes. Shorter tenures incur significantly lower total interest. However, a shorter tenure leads to a much higher monthly EMI, which must fit safely within your net take-home income.' },
  { q: 'What is the "Tenure Sweet Spot"?', a: 'The sweet spot is the shortest possible tenure that fits within your maximum affordable monthly EMI budget. This minimizes your interest outflow without over-leveraging your monthly cash flow.' },
  { q: 'Can I change my loan tenure after the loan has started?', a: 'Yes. Most banks allow you to reduce your tenure by making prepayments (part-payments) or by requesting an EMI increase. This is known as loan refinancing or tenure restructuring.' },
  { q: 'Do longer tenures have higher interest rates?', a: 'Sometimes. Some banks charge a slightly higher rate (e.g., 0.10% to 0.25% premium) for longer tenures (like 25-30 years) due to the higher term risk they carry.' }
];

interface TenureResult {
  years: number;
  emi: number;
  totalInterest: number;
  totalPayment: number;
  isAffordable: boolean;
  interestPercent: number;
}

function calcEmi(principal: number, annualRate: number, months: number) {
  if (principal <= 0 || annualRate <= 0 || months <= 0) return { emi: 0, totalInterest: 0, totalPayment: 0 };
  const r = annualRate / 12 / 100;
  const factor = Math.pow(1 + r, months);
  const emi = Math.round(principal * r * factor / (factor - 1));
  const totalPayment = emi * months;
  const totalInterest = totalPayment - principal;
  return { emi, totalInterest, totalPayment };
}

export default function LoanTenureOptimizer() {
  const navigate = useNavigate();

  // Inputs
  const [loanAmount, setLoanAmount] = useState(3000000);
  const [interestRate, setInterestRate] = useState(8.5);
  const [maxAffordableEmi, setMaxAffordableEmi] = useState(40000);
  const [loanCategory, setLoanCategory] = useState<'home' | 'personal'>('home');

  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  // Sync ranges based on loan category
  const handleCategoryChange = (cat: 'home' | 'personal') => {
    setLoanCategory(cat);
    if (cat === 'home') {
      setLoanAmount(3000000);
      setInterestRate(8.5);
      setMaxAffordableEmi(40000);
    } else {
      setLoanAmount(500000);
      setInterestRate(12.0);
      setMaxAffordableEmi(15000);
    }
  };

  // Calculations
  const optimizerResults = useMemo(() => {
    // Determine the tenures to compare
    const tenuresToTest = loanCategory === 'home'
      ? [5, 10, 15, 20, 25, 30]
: [1, 2, 3, 4, 5, 7];

    const list: TenureResult[] = tenuresToTest.map(yrs => {
      const res = calcEmi(loanAmount, interestRate, yrs * 12);
      const isAffordable = res.emi <= maxAffordableEmi;
      const interestPercent = res.totalPayment > 0 ? Math.round((res.totalInterest / res.totalPayment) * 100): 0;

      return {
        years: yrs,
        emi: res.emi,
        totalInterest: res.totalInterest,
        totalPayment: res.totalPayment,
        isAffordable,
        interestPercent,
      };
    });

    // Sweet Spot: shortest tenure that is affordable
    const affordableList = list.filter(item => item.isAffordable);
    const sweetSpot = affordableList.length > 0 ? affordableList[0]: null;

    // Maximum savings: Compare longest tenure vs sweetSpot (or shortest affordable)
    const longest = list[list.length - 1];
    const comparisonBase = sweetSpot || list[list.length - 1];
    const potentialSavings = Math.max(0, longest.totalInterest - comparisonBase.totalInterest);

    return {
      list,
      sweetSpot,
      potentialSavings,
      longest,
    };
  }, [loanAmount, interestRate, maxAffordableEmi, loanCategory]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-orange-500/30 overflow-x-hidden">
      <Helmet>
        <title>Loan Tenure Optimizer: Reduce Loan Interest | Gavel AI</title>
        <meta name="description" content="Optimize your loan tenure. Compare EMIs against total interest payable to discover the sweet spot of maximum interest savings." />
        <link rel="canonical" href="https://www.trygavel.com/tools/loan-tenure-optimizer" />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org', '@type': 'WebApplication',
          name: 'Loan Tenure Optimizer', applicationCategory: 'FinanceApplication',
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
            { label: 'Loan Tenure Optimizer', path: '/tools/loan-tenure-optimizer' }
          ]} />

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
            <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 text-orange-700 dark:text-orange-400 text-sm mb-4 px-4 py-1.5 rounded-full backdrop-blur-sm">
              <TrendingDown className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
              <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Tenure Restructuring Tool</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">Loan Tenure Optimizer</h1>
            <p className="text-lg text-muted-foreground max-w-2xl">Compare multiple tenures side-by-side. Discover the perfect "sweet spot" tenure that saves you interest without breaking your monthly budget.</p>
          </motion.div>

          <div className="grid lg:grid-cols-5 gap-8">
            {/* Left: Input parameters */}
            <div className="lg:col-span-2 space-y-6">
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                className="glass-panel border-border shadow-2xl rounded-2xl p-6 space-y-6">

                {/* Loan Category */}
                <div>
                  <Label className="text-xs text-muted-foreground font-semibold mb-2 block">Loan Type</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'home' as const, label: 'Home Loan (Long term)' },
                      { id: 'personal' as const, label: 'Personal Loan (Short term)' },
                    ].map(opt => (
                      <button key={opt.id} onClick={() => handleCategoryChange(opt.id)}
                        className={`py-2.5 text-xs font-semibold rounded-lg border transition-all ${loanCategory === opt.id ? 'bg-emerald-600 border-emerald-700 text-white': 'bg-white/5 border-white/10 text-muted-foreground hover:text-foreground'}`}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Loan Amount */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-xs text-muted-foreground font-semibold">Loan Amount</Label>
                    <span className="text-sm font-bold text-foreground">{fmt(loanAmount)}</span>
                  </div>
                  <Slider value={[loanAmount]} min={loanCategory === 'home' ? 500000: 50000} max={loanCategory === 'home' ? 100000000: 2500000} step={loanCategory === 'home' ? 100000: 25000}
                    onValueChange={([v]) => setLoanAmount(v)} className="mb-2" />
                  <Input type="number" value={loanAmount} onChange={e => setLoanAmount(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-surface border-border text-foreground text-xs h-9" />
                </div>

                {/* Interest Rate */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-xs text-muted-foreground font-semibold">Interest Rate (p.a. %)</Label>
                    <span className="text-sm font-bold text-foreground">{interestRate}%</span>
                  </div>
                  <Slider value={[interestRate]} min={5} max={25} step={0.1}
                    onValueChange={([v]) => setInterestRate(v)} className="mb-2" />
                </div>

                {/* Max Affordable EMI */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-xs text-muted-foreground font-semibold">Max Affordable Monthly EMI</Label>
                    <span className="text-sm font-bold text-green-700 dark:text-green-400">{fmt(maxAffordableEmi)}</span>
                  </div>
                  <Slider value={[maxAffordableEmi]} min={loanCategory === 'home' ? 10000: 3000} max={loanCategory === 'home' ? 500000: 100000} step={1000}
                    onValueChange={([v]) => setMaxAffordableEmi(v)} className="mb-2" />
                  <Input type="number" value={maxAffordableEmi} onChange={e => setMaxAffordableEmi(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-surface border-border text-foreground text-xs h-9" />
                </div>

              </motion.div>
            </div>

            {/* Right: Optimizer Output Dashboard */}
            <div className="lg:col-span-3 space-y-6">

              {/* Sweet spot selection box */}
              {optimizerResults.sweetSpot ? (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                  className="bg-gradient-to-br from-orange-500/15 via-orange-500/5 to-transparent border border-orange-500/30 shadow-2xl rounded-2xl p-8 relative overflow-hidden">
                  <div className="absolute top-4 right-4 bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs px-2.5 py-1 rounded-full flex items-center gap-1 font-semibold border border-emerald-500/30">
                    <ShieldCheck className="w-3.5 h-3.5" /> High Trust Rules
                  </div>

                  <div>
                    <span className="text-xs text-emerald-700 dark:text-emerald-400 font-bold block mb-1 uppercase tracking-wider">Recommended Sweet Spot Tenure</span>
                    <h3 className="text-5xl font-black text-foreground tracking-tight">{optimizerResults.sweetSpot.years} Years</h3>
                    <p className="text-xs text-muted-foreground mt-2">
                      EMI: <strong className="text-foreground">{fmt(optimizerResults.sweetSpot.emi)}/mo</strong> (Below your budget of {fmt(maxAffordableEmi)})
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-border">
                    <div className="bg-surface p-4 rounded-xl">
                      <p className="text-xs text-muted-foreground mb-1">Total Interest Paid</p>
                      <p className="text-lg font-bold text-foreground">{fmt(optimizerResults.sweetSpot.totalInterest)}</p>
                    </div>
                    <div className="bg-surface p-4 rounded-xl">
                      <p className="text-xs text-muted-foreground mb-1">Estimated Interest Savings</p>
                      <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">{fmt(optimizerResults.potentialSavings)}</p>
                    </div>
                  </div>
                </motion.div>
              ): (
                <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-700 dark:text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-red-700 dark:text-red-400">Budget Constraint Warning</p>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      Your maximum affordable EMI of <strong className="text-foreground">{fmt(maxAffordableEmi)}</strong> is too low. Even at the maximum tenure ({optimizerResults.longest.years} years), the calculated EMI is <strong className="text-foreground">{fmt(optimizerResults.longest.emi)}</strong>. Please increase your budget or reduce the borrow amount.
                    </p>
                  </div>
                </div>
              )}

              {/* Grid comparison lists */}
              <div className="glass-panel border-border shadow-2xl rounded-2xl p-6 space-y-4">
                <h3 className="text-sm font-bold text-foreground pb-2 border-b border-border">Tenure Option Comparison</h3>

                <div className="space-y-3">
                  {optimizerResults.list.map((item, idx) => (
                    <div key={idx} className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${item.years === optimizerResults.sweetSpot?.years ? 'bg-emerald-500/5 border-emerald-500/30': 'bg-transparent border-white/5'}`}>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-black text-foreground">{item.years} Years</span>
                        {item.years === optimizerResults.sweetSpot?.years && (
                          <span className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[9px] px-2 py-0.5 rounded-full font-bold border border-emerald-500/30">Sweet Spot</span>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-6 md:text-right flex-1">
                        <div>
                          <span className="text-[9px] text-muted-foreground uppercase block">Monthly EMI</span>
                          <span className={`text-xs font-bold ${item.isAffordable ? 'text-green-400': 'text-red-400'}`}>{fmt(item.emi)}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-muted-foreground uppercase block">Total Interest</span>
                          <span className="text-xs font-bold text-foreground">{fmt(item.totalInterest)}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-muted-foreground uppercase block">Interest %</span>
                          <span className="text-xs font-bold text-muted-foreground">{item.interestPercent}% of total</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Predictor link */}
              <div className="bg-gradient-to-r from-orange-500/10 to-orange-600/10 border border-orange-500/20 rounded-2xl p-6">
                <h4 className="text-base font-bold text-foreground mb-2 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-orange-600 dark:text-orange-500" /> Apply For Pre-Approvals
                </h4>
                <p className="text-xs text-muted-foreground mb-4">Underwriting checks evaluate your cash flows against optimized loan tenures. Run our pre-approval odds predictor checks today.</p>
                <Button onClick={() => navigate('/loan-approval-predictor')} className="bg-orange-500 hover:bg-orange-600 text-white w-full py-4 text-sm font-bold">
                  Predict Pre-Approvals <ArrowRight className="w-4 h-4 ml-2" />
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
