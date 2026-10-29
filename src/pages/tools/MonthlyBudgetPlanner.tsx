import React, { useState, useMemo } from 'react';
import { Breadcrumbs } from '../../components/Breadcrumbs';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { Calculator, ArrowRight, IndianRupee, Percent, ShieldCheck, ChevronDown, ChevronUp, Zap, Sparkles, AlertTriangle, CheckCircle2, HeartPulse } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const fmt = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const FAQS = [
  { q: 'What is the 50/30/20 budgeting rule?', a: 'The 50/30/20 rule is a popular financial budgeting framework: allocate 50% of net take-home income to Needs (rent, utilities, groceries), 30% to Wants (dining out, entertainment, shopping), and 20% to Savings, investments, and debt prepayment.' },
  { q: 'Does loan EMI count as a Need or Debt?', a: 'Under strict budgeting guidelines, basic housing EMI or rent is a Need. However, consumer EMIs, personal loans, and credit card payments should be tracked under the "Savings & Debt" category to see how much they are draining your capacity to build wealth.' },
  { q: 'How do I handle budget deficits?', a: 'If your Needs exceed 50%, you are "house poor" or over-leveraged. You should look to refinance high-cost debt, negotiate lower rent, or reduce discretionary Wants (the 30% bucket) to balance the sheet.' },
  { q: 'Why is tracking savings capacity important for underwriting?', a: 'Lenders evaluate your surplus income (salary minus all living expenses and EMIs). A higher savings rate indicates a high repayment cushion, which improves your loan pre-approval odds.' },
  { q: 'Should mutual funds SIPs be categorized under Wants or Savings?', a: 'SIPs, recurring deposits, PPF contributions, and stock purchases fall directly under the 20% Savings/Investments category.' }
];

export default function MonthlyBudgetPlanner() {
  const navigate = useNavigate();

  // Inputs
  const [salary, setSalary] = useState(80000);
  const [rent, setRent] = useState(20000);
  const [groceries, setGroceries] = useState(10000);
  const [insurance, setInsurance] = useState(4000);
  const [wants, setWants] = useState(15000);
  const [debtEmi, setDebtEmi] = useState(12000);

  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  // Calculations
  const budget = useMemo(() => {
    const totalNeeds = rent + groceries + insurance;
    const totalWants = wants;
    const totalSavings = Math.max(0, salary - totalNeeds - totalWants - debtEmi);

    const needsPct = salary > 0 ? Math.round((totalNeeds / salary) * 100): 0;
    const wantsPct = salary > 0 ? Math.round((totalWants / salary) * 100): 0;
    const debtPct = salary > 0 ? Math.round((debtEmi / salary) * 100): 0;
    const savingsPct = salary > 0 ? Math.round((totalSavings / salary) * 100): 0;

    // Checks
    const isNeedsOverLimit = needsPct > 50;
    const isDebtOverLimit = debtPct > 35;
    const isSavingsUnderLimit = savingsPct < 15;

    return {
      totalNeeds,
      totalWants,
      totalSavings,
      needsPct,
      wantsPct,
      debtPct,
      savingsPct,
      isNeedsOverLimit,
      isDebtOverLimit,
      isSavingsUnderLimit,
    };
  }, [salary, rent, groceries, insurance, wants, debtEmi]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-orange-500/30 overflow-x-hidden">
      <Helmet>
        <title>Monthly Budget Planner, 50/30/20 Rule | Gavel AI</title>
        <meta name="description" content="Plan your monthly expenses using the 50/30/20 rule. Calculate needs, wants, savings, and debt limits to optimize your financial surplus." />
        <link rel="canonical" href="https://www.trygavel.com/tools/monthly-budget-planner" />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org', '@type': 'WebApplication',
          name: 'Monthly Budget Planner', applicationCategory: 'FinanceApplication',
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
            { label: 'Monthly Budget Planner', path: '/tools/monthly-budget-planner' }
          ]} />

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
            <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 text-orange-700 dark:text-orange-400 text-sm mb-4 px-4 py-1.5 rounded-full backdrop-blur-sm">
              <HeartPulse className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
              <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Cash Flow Management</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">Monthly Budget Planner</h1>
            <p className="text-lg text-muted-foreground max-w-2xl">Master your personal cash flows. Map rent, utility needs, wants, and savings against the benchmark 50/30/20 rule.</p>
          </motion.div>

          <div className="grid lg:grid-cols-5 gap-8">
            {/* Left: Input sliders */}
            <div className="lg:col-span-2 space-y-6">
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                className="glass-panel border-border shadow-2xl rounded-2xl p-6 space-y-6">

                <h3 className="text-base font-bold text-foreground pb-3 border-b border-border">Income & Expenses</h3>

                {/* Net monthly income */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-xs text-muted-foreground font-semibold">Net Monthly Take-Home</Label>
                    <span className="text-sm font-bold text-foreground">{fmt(salary)}</span>
                  </div>
                  <Slider value={[salary]} min={15000} max={1000000} step={5000}
                    onValueChange={([v]) => setSalary(v)} className="mb-2" />
                  <Input type="number" value={salary} onChange={e => setSalary(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-surface border-border text-foreground text-xs h-9" />
                </div>

                {/* Rent / Housing EMI */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-xs text-muted-foreground font-semibold">Rent / Home Loan EMI</Label>
                    <span className="text-sm font-bold text-foreground">{fmt(rent)}</span>
                  </div>
                  <Slider value={[rent]} min={0} max={Math.min(rent, salary * 0.7)} step={1000}
                    onValueChange={([v]) => setRent(v)} className="mb-2" />
                </div>

                {/* Groceries & Utilities */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-xs text-muted-foreground font-semibold">Groceries, Food & Utilities</Label>
                    <span className="text-sm font-bold text-foreground">{fmt(groceries)}</span>
                  </div>
                  <Slider value={[groceries]} min={0} max={50000} step={500}
                    onValueChange={([v]) => setGroceries(v)} className="mb-2" />
                </div>

                {/* Insurance & Medical */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-xs text-muted-foreground font-semibold">Insurance & Health Premiums</Label>
                    <span className="text-sm font-bold text-foreground">{fmt(insurance)}</span>
                  </div>
                  <Slider value={[insurance]} min={0} max={20000} step={500}
                    onValueChange={([v]) => setInsurance(v)} className="mb-2" />
                </div>

                {/* Wants / Entertainment */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-xs text-muted-foreground font-semibold">Wants, Subscriptions & Dinings</Label>
                    <span className="text-sm font-bold text-foreground">{fmt(wants)}</span>
                  </div>
                  <Slider value={[wants]} min={0} max={100000} step={1000}
                    onValueChange={([v]) => setWants(v)} className="mb-2" />
                </div>

                {/* Debt EMIs */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-xs text-muted-foreground font-semibold">Other EMIs & Credit Card Bills</Label>
                    <span className="text-sm font-bold text-red-700 dark:text-red-400">{fmt(debtEmi)}</span>
                  </div>
                  <Slider value={[debtEmi]} min={0} max={100000} step={1000}
                    onValueChange={([v]) => setDebtEmi(v)} className="mb-2" />
                </div>

              </motion.div>
            </div>

            {/* Right: Results Outputs */}
            <div className="lg:col-span-3 space-y-6">

              {/* Main status indicator */}
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                className="bg-gradient-to-br from-orange-500/15 via-orange-500/5 to-transparent border border-orange-500/30 shadow-2xl rounded-2xl p-8 relative overflow-hidden">
                <div className="absolute top-4 right-4 bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs px-2.5 py-1 rounded-full flex items-center gap-1 font-semibold border border-emerald-500/30">
                  <ShieldCheck className="w-3.5 h-3.5" /> High Trust Rules
                </div>

                <div className="text-center mb-6">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Calculated Monthly Surplus (Savings)</p>
                  <motion.div key={budget.totalSavings} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    className="text-5xl md:text-6xl font-black text-foreground tracking-tight">
                    {fmt(budget.totalSavings)}
                  </motion.div>
                  <p className="text-xs text-muted-foreground mt-2">({budget.savingsPct}% of total income)</p>
                </div>

                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border text-center text-xs">
                  <div className="bg-surface p-3 rounded-xl">
                    <span className="text-[10px] text-muted-foreground uppercase block">Needs</span>
                    <span className={`font-bold ${budget.isNeedsOverLimit ? 'text-red-400': 'text-white'}`}>{budget.needsPct}% (Limit 50%)</span>
                  </div>
                  <div className="bg-surface p-3 rounded-xl">
                    <span className="text-[10px] text-muted-foreground uppercase block">Wants</span>
                    <span className="font-bold text-foreground">{budget.wantsPct}% (Limit 30%)</span>
                  </div>
                  <div className="bg-surface p-3 rounded-xl">
                    <span className="text-[10px] text-muted-foreground uppercase block">Debts</span>
                    <span className={`font-bold ${budget.isDebtOverLimit ? 'text-red-400': 'text-white'}`}>{budget.debtPct}% (Limit 35%)</span>
                  </div>
                </div>
              </motion.div>

              {/* Financial health checklist */}
              <div className="glass-panel border-border shadow-2xl rounded-2xl p-6 space-y-4">
                <h3 className="text-sm font-bold text-foreground">Rule Violations & Health Checks</h3>

                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between p-4 bg-surface rounded-xl">
                    <div>
                      <p className="font-semibold text-foreground">Needs Threshold Check (50% Rule)</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Rent, grocery, utilities must stay below half of your income.</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-lg font-bold ${budget.isNeedsOverLimit ? 'bg-red-500/20 text-red-400': 'bg-green-500/20 text-green-400'}`}>
                      {budget.isNeedsOverLimit ? 'Over Limit': 'Healthy'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-surface rounded-xl">
                    <div>
                      <p className="font-semibold text-foreground">Debt Burden Check (35% Rule)</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Non-mortgage debts should not encroach into necessary savings.</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-lg font-bold ${budget.isDebtOverLimit ? 'bg-red-500/20 text-red-400': 'bg-green-500/20 text-green-400'}`}>
                      {budget.isDebtOverLimit ? 'Critical': 'Healthy'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-surface rounded-xl">
                    <div>
                      <p className="font-semibold text-foreground">Wealth Accrual Check (20% Rule)</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Surplus available for compounding investments.</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-lg font-bold ${budget.isSavingsUnderLimit ? 'bg-yellow-500/20 text-yellow-400': 'bg-green-500/20 text-green-400'}`}>
                      {budget.isSavingsUnderLimit ? 'Insufficient': 'Healthy'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Predictor redirection */}
              <div className="bg-gradient-to-r from-orange-500/10 to-orange-600/10 border border-orange-500/20 rounded-2xl p-6">
                <h4 className="text-base font-bold text-foreground mb-2 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-orange-600 dark:text-orange-500" /> Apply For Pre-Approvals
                </h4>
                <p className="text-xs text-muted-foreground mb-4">Lenders check DTI ratios and savings cushion during mortgage underwriting. Run our pre-approval odds predictor check now.</p>
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
