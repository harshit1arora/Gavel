import React, { useState, useMemo } from 'react';
import { Breadcrumbs } from '../../components/Breadcrumbs';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { Calculator, ArrowRight, IndianRupee, Percent, CheckCircle2, ShieldCheck, ChevronDown, ChevronUp, Zap, Sparkles, HelpCircle, AlertTriangle, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const fmt = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const FAQS = [
  { q: 'What is an emergency fund?', a: 'An emergency fund is a pool of liquid money set aside to cover unexpected life events, such as job loss, medical emergencies, major home repairs, or sudden travel. It acts as a financial safety net so you do not have to borrow high-interest loans.' },
  { q: 'How many months of expenses should be in an emergency fund?', a: 'Generally, financial advisors recommend keeping 3 to 6 months of living expenses. However, if you are self-employed, work in a volatile industry, or have single-income dependencies, you should aim for 9 to 12 months of coverage.' },
  { q: 'Where should I keep my emergency fund?', a: 'Your emergency fund must be kept in safe, highly liquid options. The best choices are: 1. A dedicated high-yield savings bank account. 2. Sweep-in Fixed Deposits (which yield higher interest but have zero withdrawal penalties). 3. Liquid mutual funds.' },
  { q: 'Should I include discretionary spending in my emergency fund target?', a: 'You should calculate both essential (rent, food, medicine, EMIs) and discretionary (dining out, subscriptions) expenses. In a real crisis, you will cut out discretionary spending, but having a buffer for it offers extra security.' },
  { q: 'Does paying off debt take priority over an emergency fund?', a: 'It is recommended to build a starter emergency fund (typically 1 month of essential expenses) first, then aggressively pay down high-interest debt (like credit cards), and finally build the full 3-6 months fund.' }
];

export default function EmergencyFundCalculator() {
  const navigate = useNavigate();

  // Inputs
  const [essentialExpense, setEssentialExpense] = useState(35000); // Rent, groceries, utility bills, insurance
  const [discretionaryExpense, setDiscretionaryExpense] = useState(15000); // Dining, entertainment, shopping
  const [monthlyDebt, setMonthlyDebt] = useState(10000); // EMIs, card bills
  const [coverageMonths, setCoverageMonths] = useState(6); // 3, 6, 9, 12
  const [incomeStability, setIncomeStability] = useState<'high' | 'medium' | 'low'>('medium');
  const [currentSavings, setCurrentSavings] = useState(50000);
  const [targetMonthsToBuild, setTargetMonthsToBuild] = useState(12); // Months they want to build the fund in

  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  // Calculations
  const calculations = useMemo(() => {
    const totalExpenses = essentialExpense + discretionaryExpense + monthlyDebt;
    const essentialExpensesOnly = essentialExpense + monthlyDebt; // Discretionary is cut in a real emergency

    // Stability multi-rules
    let recommendedMonths = coverageMonths;
    if (incomeStability === 'low' && coverageMonths < 9) {
      recommendedMonths = Math.max(9, coverageMonths);
    } else if (incomeStability === 'high' && coverageMonths > 6) {
      recommendedMonths = Math.min(6, coverageMonths);
    }

    const idealTarget = totalExpenses * recommendedMonths;
    const essentialTarget = essentialExpensesOnly * recommendedMonths;

    const gap = Math.max(0, idealTarget - currentSavings);
    const monthlyContributionNeeded = gap > 0 && targetMonthsToBuild > 0 ? Math.round(gap / targetMonthsToBuild): 0;

    return {
      totalExpenses,
      essentialExpensesOnly,
      recommendedMonths,
      idealTarget,
      essentialTarget,
      gap,
      monthlyContributionNeeded,
    };
  }, [essentialExpense, discretionaryExpense, monthlyDebt, coverageMonths, incomeStability, currentSavings, targetMonthsToBuild]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-orange-500/30 overflow-x-hidden">
      <Helmet>
        <title>Emergency Fund Calculator: Save For Financial Safety | Gavel AI</title>
        <meta name="description" content="Calculate your recommended emergency savings fund target. Plan and budget your monthly expenses, coverage duration, and gap contributions." />
        <link rel="canonical" href="https://www.trygavel.com/tools/emergency-fund-calculator" />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org', '@type': 'WebApplication',
          name: 'Emergency Fund Calculator', applicationCategory: 'FinanceApplication',
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
            { label: 'Emergency Fund Calculator', path: '/tools/emergency-fund-calculator' }
          ]} />

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
            <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 text-orange-700 dark:text-orange-400 text-sm mb-4 px-4 py-1.5 rounded-full backdrop-blur-sm">
              <ShieldCheck className="w-4 h-4 text-purple-700 dark:text-purple-400" />
              <span className="text-sm font-medium text-purple-700 dark:text-purple-400">Financial Planning Guide</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">Emergency Fund Calculator</h1>
            <p className="text-lg text-muted-foreground max-w-2xl">Prepare for life\'s uncertainties. Calculate how much buffer you need to protect yourself and your family without relying on expensive loans.</p>
          </motion.div>

          <div className="grid lg:grid-cols-5 gap-8">
            {/* Left: Input sliders */}
            <div className="lg:col-span-2 space-y-6">
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                className="glass-panel border-border shadow-2xl rounded-2xl p-6 space-y-6">

                <h3 className="text-base font-bold text-foreground pb-3 border-b border-border">Expense Breakdowns</h3>

                {/* Essential Expenses */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-xs text-muted-foreground font-semibold">Monthly Essential Expenses (Rent, Food, bills)</Label>
                    <span className="text-sm font-bold text-foreground">{fmt(essentialExpense)}</span>
                  </div>
                  <Slider value={[essentialExpense]} min={5000} max={250000} step={2000}
                    onValueChange={([v]) => setEssentialExpense(v)} className="mb-2" />
                  <Input type="number" value={essentialExpense} onChange={e => setEssentialExpense(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-surface border-border text-foreground text-xs h-9" />
                </div>

                {/* Discretionary Expenses */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-xs text-muted-foreground font-semibold">Monthly Discretionary Expenses (Shopping, Dining)</Label>
                    <span className="text-sm font-bold text-foreground">{fmt(discretionaryExpense)}</span>
                  </div>
                  <Slider value={[discretionaryExpense]} min={0} max={150000} step={1000}
                    onValueChange={([v]) => setDiscretionaryExpense(v)} className="mb-2" />
                  <Input type="number" value={discretionaryExpense} onChange={e => setDiscretionaryExpense(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-surface border-border text-foreground text-xs h-9" />
                </div>

                {/* Debt Obligations */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-xs text-muted-foreground font-semibold">Monthly Debt / EMIs</Label>
                    <span className="text-sm font-bold text-red-700 dark:text-red-400">{fmt(monthlyDebt)}</span>
                  </div>
                  <Slider value={[monthlyDebt]} min={0} max={150000} step={1000}
                    onValueChange={([v]) => setMonthlyDebt(v)} className="mb-2" />
                  <Input type="number" value={monthlyDebt} onChange={e => setMonthlyDebt(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-surface border-border text-foreground text-xs h-9" />
                </div>

                <h3 className="text-base font-bold text-foreground pt-3 pb-3 border-b border-border">Risk Parameters</h3>

                {/* Job stability */}
                <div>
                  <Label className="text-xs text-muted-foreground font-semibold mb-2 block">Income / Job Stability</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'high' as const, label: 'Stable (MNC/Govt)' },
                      { id: 'medium' as const, label: 'Average (Private)' },
                      { id: 'low' as const, label: 'Volatile (Freelance)' },
                    ].map(opt => (
                      <button key={opt.id} onClick={() => setIncomeStability(opt.id)}
                        className={`py-2 text-[10px] font-semibold rounded-lg border transition-all ${incomeStability === opt.id ? 'bg-purple-600 border-purple-700 text-white': 'bg-white/5 border-white/10 text-muted-foreground hover:text-foreground'}`}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Target Months coverage */}
                <div>
                  <Label className="text-xs text-muted-foreground font-semibold mb-2 block">Desired Coverage Duration</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {[3, 6, 9, 12].map(m => (
                      <button key={m} onClick={() => setCoverageMonths(m)}
                        className={`py-2 text-xs font-semibold rounded-lg border transition-all ${coverageMonths === m ? 'bg-purple-600 border-purple-700 text-white': 'bg-white/5 border-white/10 text-muted-foreground hover:text-foreground'}`}>
                        {m} Months
                      </button>
                    ))}
                  </div>
                </div>

                {/* Current Savings */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-xs text-muted-foreground font-semibold">Current Emergency Savings (Already saved)</Label>
                    <span className="text-sm font-bold text-green-700 dark:text-green-400">{fmt(currentSavings)}</span>
                  </div>
                  <Slider value={[currentSavings]} min={0} max={1500000} step={10000}
                    onValueChange={([v]) => setCurrentSavings(v)} className="mb-2" />
                  <Input type="number" value={currentSavings} onChange={e => setCurrentSavings(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-surface border-border text-foreground text-xs h-9" />
                </div>

                {/* Months to build */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-xs text-muted-foreground font-semibold">Timeframe to build fund (Months)</Label>
                    <span className="text-sm font-bold text-foreground">{targetMonthsToBuild} months</span>
                  </div>
                  <Slider value={[targetMonthsToBuild]} min={3} max={36} step={1}
                    onValueChange={([v]) => setTargetMonthsToBuild(v)} className="mb-2" />
                </div>

              </motion.div>
            </div>

            {/* Right: Output Analytics Dashboard */}
            <div className="lg:col-span-3 space-y-6">
              {/* Target Savings Panel */}
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                className="bg-gradient-to-br from-orange-500/15 via-orange-500/5 to-transparent border border-orange-500/30 shadow-2xl rounded-2xl p-8 relative overflow-hidden">
                <div className="absolute top-4 right-4 bg-purple-500/20 text-purple-700 dark:text-purple-400 text-xs px-2.5 py-1 rounded-full flex items-center gap-1 font-semibold border border-purple-500/30">
                  <ShieldCheck className="w-3.5 h-3.5" /> High Trust Rules
                </div>

                <div className="text-center mb-6">
                  <p className="text-sm text-muted-foreground mb-2">Recommended Emergency Fund Target</p>
                  <motion.div key={calculations.idealTarget} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    className="text-5xl md:text-6xl font-black text-foreground tracking-tight">
                    {fmt(calculations.idealTarget)}
                  </motion.div>
                  <p className="text-xs text-muted-foreground mt-2">Covers {calculations.recommendedMonths} months of total lifestyle expenses</p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                  <div className="bg-surface p-4 rounded-xl">
                    <p className="text-xs text-muted-foreground mb-1">Essential-Only Target (Bare Minimum)</p>
                    <p className="text-lg font-bold text-foreground">{fmt(calculations.essentialTarget)}</p>
                  </div>
                  <div className="bg-surface p-4 rounded-xl">
                    <p className="text-xs text-muted-foreground mb-1">Remaining Savings Gap</p>
                    <p className="text-lg font-bold text-purple-700 dark:text-purple-400">{fmt(calculations.gap)}</p>
                  </div>
                </div>
              </motion.div>

              {/* Action Plan build stats */}
              {calculations.gap > 0 ? (
                <div className="glass-panel border-border shadow-2xl rounded-2xl p-6 space-y-4">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Sparkles className="w-4.5 h-4.5 text-purple-700 dark:text-purple-400" /> Savings Target Plan
                  </h3>

                  <div className="p-4 bg-purple-500/5 border border-purple-500/10 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Monthly Contribution Required</p>
                      <p className="text-2xl font-black text-foreground">{fmt(calculations.monthlyContributionNeeded)}/mo</p>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      For {targetMonthsToBuild} Months
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Set up an automated sweep-in or recurring transfer of <strong className="text-foreground">{fmt(calculations.monthlyContributionNeeded)}</strong> at the start of each month to comfortably hit your target without strain.
                  </p>
                </div>
              ): (
                <div className="bg-surface border border-green-500/20 rounded-2xl p-6 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-700 dark:text-green-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-green-700 dark:text-green-400">Emergency Fund Fully Funded!</p>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      Your current savings of <strong className="text-foreground">{fmt(currentSavings)}</strong> fully cover your recommended emergency fund target. You are in a highly secure financial position.
                    </p>
                  </div>
                </div>
              )}

              {/* Allocations tips */}
              <div className="bg-surface border border-border rounded-2xl p-6 space-y-4">
                <h4 className="text-sm font-bold text-foreground">Recommended Allocation Structure</h4>

                <div className="grid md:grid-cols-3 gap-3 text-xs text-center text-muted-foreground">
                  <div className="bg-surface p-3 rounded-xl border border-border">
                    <span className="font-semibold text-foreground block mb-1">20% Cash / Bank</span>
                    <span>Keep in secondary savings account for immediate ATM/UPI withdrawals.</span>
                  </div>
                  <div className="bg-surface p-3 rounded-xl border border-border">
                    <span className="font-semibold text-foreground block mb-1">50% Sweep-In FD</span>
                    <span>Earn higher interest with instant online liquidation features.</span>
                  </div>
                  <div className="bg-surface p-3 rounded-xl border border-border">
                    <span className="font-semibold text-foreground block mb-1">30% Liquid Funds</span>
                    <span>Park in high-grade liquid mutual funds with T+1 settlement.</span>
                  </div>
                </div>
              </div>

              {/* Predictor redirection */}
              <div className="bg-gradient-to-r from-orange-500/10 to-orange-600/10 border border-orange-500/20 rounded-2xl p-6">
                <h4 className="text-base font-bold text-foreground mb-2 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-orange-600 dark:text-orange-500" /> Apply For Loans Safely
                </h4>
                <p className="text-xs text-muted-foreground mb-4">Having an emergency fund drops your borrow-dependency risk. Predict bank approval odds for retail credit portfolios today.</p>
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
