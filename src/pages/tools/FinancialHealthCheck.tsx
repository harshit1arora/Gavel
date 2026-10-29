import React, { useState, useMemo } from 'react';
import { Breadcrumbs } from '../../components/Breadcrumbs';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { Calculator, ArrowRight, IndianRupee, Percent, ShieldCheck, ChevronDown, ChevronUp, Zap, Sparkles, HeartPulse, Activity, AlertTriangle, ShieldCheck as ShieldIcon, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const fmt = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const FAQS = [
  { q: 'What is a financial health check?', a: 'A financial health check is a structured diagnostics audit evaluating key personal finance indicators: debt service limits, emergency savings cover, credit score profile, and insurance coverage.' },
  { q: 'What is a healthy Debt-to-Income (DTI) ratio?', a: 'Lenders prefer a DTI ratio below 36%. A DTI above 45% indicates significant cash flow leverage, which increases default risk and lowers loan approval odds.' },
  { q: 'How many months of expenses should be in an emergency fund?', a: 'Standard financial planning advice suggests keeping 3 to 6 months of mandatory living expenses in highly liquid cash equivalents, fixed deposits, or liquid mutual funds.' },
  { q: 'Why is insurance counted in a financial health check?', a: 'An unexpected medical emergency or demise without health or term life insurance can wipe out lifetime savings and pull family members into debt traps. Insurance is the base layer of financial risk management.' },
  { q: 'How often should I run a financial health check?', a: 'It is recommended to run a diagnostic health check bi-annually or whenever there is a major change in salary, monthly debts, or life milestones.' }
];

export default function FinancialHealthCheck() {
  const navigate = useNavigate();

  // Inputs
  const [income, setIncome] = useState(80000);
  const [expenses, setExpenses] = useState(35000);
  const [emis, setEmis] = useState(15000);
  const [savings, setSavings] = useState(250000);
  const [cibil, setCibil] = useState(740);
  const [hasInsurance, setHasInsurance] = useState<boolean>(true);

  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  // Calculations
  const metrics = useMemo(() => {
    // 1. DTI
    const dti = income > 0 ? (emis / income) * 100: 0;
    let dtiPoints = 0;
    if (dti < 30) dtiPoints = 25;
    else if (dti < 45) dtiPoints = 15;
    else if (dti < 60) dtiPoints = 5;

    // 2. Emergency Cushion (months of expenses)
    const cushion = expenses > 0 ? savings / expenses: 0;
    let cushionPoints = 0;
    if (cushion >= 6) cushionPoints = 25;
    else if (cushion >= 3) cushionPoints = 15;
    else if (cushion >= 1) cushionPoints = 5;

    // 3. Credit Score
    let creditPoints = 0;
    if (cibil >= 750) creditPoints = 25;
    else if (cibil >= 700) creditPoints = 15;
    else if (cibil >= 650) creditPoints = 5;

    // 4. Insurance
    const insurancePoints = hasInsurance ? 25: 0;

    const totalScore = dtiPoints + cushionPoints + creditPoints + insurancePoints;

    let grade = 'Vulnerable (BB)';
    let gradeColor = 'text-red-400 border-red-500/20';
    if (totalScore >= 85) {
      grade = 'Excellent (AAA)';
      gradeColor = 'text-emerald-400 border-emerald-500/20';
    } else if (totalScore >= 70) {
      grade = 'Healthy (AA)';
      gradeColor = 'text-blue-400 border-blue-500/20';
    } else if (totalScore >= 50) {
      grade = 'Moderate (A)';
      gradeColor = 'text-yellow-400 border-yellow-500/20';
    }

    return {
      dti: Math.round(dti),
      cushion: Number(cushion.toFixed(1)),
      totalScore,
      grade,
      gradeColor,
      dtiPoints,
      cushionPoints,
      creditPoints,
      insurancePoints,
    };
  }, [income, expenses, emis, savings, cibil, hasInsurance]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-orange-500/30 overflow-x-hidden">
      <Helmet>
        <title>Financial Health Check Tool: Score Card | Gavel AI</title>
        <meta name="description" content="Audit your personal financial health. Calculate DTI margins, emergency savings ratios, and insurance coverage points." />
        <link rel="canonical" href="https://www.trygavel.com/tools/financial-health-check" />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org', '@type': 'WebApplication',
          name: 'Financial Health Check Tool', applicationCategory: 'FinanceApplication',
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
            { label: 'Financial Health Check', path: '/tools/financial-health-check' }
          ]} />

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
            <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 text-orange-700 dark:text-orange-400 text-sm mb-4 px-4 py-1.5 rounded-full backdrop-blur-sm">
              <Activity className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
              <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Financial Diagnostics Tool</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">Financial Health Check</h1>
            <p className="text-lg text-muted-foreground max-w-2xl">Diagnose your personal finance metrics. Enter income, expenses, and savings parameters to evaluate your credit risk standing.</p>
          </motion.div>

          <div className="grid lg:grid-cols-5 gap-8">
            {/* Left: Input sliders */}
            <div className="lg:col-span-2 space-y-6">
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                className="glass-panel border-border shadow-2xl rounded-2xl p-6 space-y-6">

                <h3 className="text-base font-bold text-foreground pb-3 border-b border-border">Diagnostic Metrics</h3>

                {/* Net Monthly Income */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-xs text-muted-foreground font-semibold">Net Monthly Income</Label>
                    <span className="text-sm font-bold text-foreground">{fmt(income)}</span>
                  </div>
                  <Slider value={[income]} min={15000} max={1000000} step={5000}
                    onValueChange={([v]) => setIncome(v)} className="mb-2" />
                </div>

                {/* Monthly Expenses */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-xs text-muted-foreground font-semibold">Monthly Expenses (Essentials)</Label>
                    <span className="text-sm font-bold text-foreground">{fmt(expenses)}</span>
                  </div>
                  <Slider value={[expenses]} min={5000} max={Math.min(expenses, income * 0.7)} step={1000}
                    onValueChange={([v]) => setExpenses(v)} className="mb-2" />
                </div>

                {/* Monthly EMIs */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-xs text-muted-foreground font-semibold">Total Monthly EMIs</Label>
                    <span className="text-sm font-bold text-red-700 dark:text-red-400">{fmt(emis)}</span>
                  </div>
                  <Slider value={[emis]} min={0} max={Math.min(emis, income * 0.6)} step={1000}
                    onValueChange={([v]) => setEmis(v)} className="mb-2" />
                </div>

                {/* Liquid Savings */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-xs text-muted-foreground font-semibold">Total Liquid Savings</Label>
                    <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">{fmt(savings)}</span>
                  </div>
                  <Slider value={[savings]} min={0} max={5000000} step={10000}
                    onValueChange={([v]) => setSavings(v)} className="mb-2" />
                  <Input type="number" value={savings} onChange={e => setSavings(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-surface border-border text-foreground text-xs h-9" />
                </div>

                {/* CIBIL Score */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-xs text-muted-foreground font-semibold">Credit Score (CIBIL)</Label>
                    <span className="text-sm font-bold text-foreground">{cibil}</span>
                  </div>
                  <Slider value={[cibil]} min={300} max={900} step={5}
                    onValueChange={([v]) => setCibil(v)} className="mb-2" />
                </div>

                {/* Insurance toggle */}
                <div className="flex items-center justify-between p-3 bg-surface rounded-xl border border-border">
                  <div>
                    <Label className="text-xs text-foreground font-semibold">Active Health & Term Insurance</Label>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Critical for risk containment</p>
                  </div>
                  <input type="checkbox" checked={hasInsurance} onChange={e => setHasInsurance(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 bg-background" />
                </div>

              </motion.div>
            </div>

            {/* Right: Results scorecard */}
            <div className="lg:col-span-3 space-y-6">

              {/* Score Display Box */}
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                className="bg-gradient-to-br from-orange-500/15 via-orange-500/5 to-transparent border border-orange-500/30 shadow-2xl rounded-2xl p-8 relative overflow-hidden">
                <div className="absolute top-4 right-4 bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs px-2.5 py-1 rounded-full flex items-center gap-1 font-semibold border border-emerald-500/30">
                  <ShieldCheck className="w-3.5 h-3.5" /> High Trust Rules
                </div>

                <div className="text-center mb-6">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Financial Health Diagnostics Score</p>
                  <motion.div key={metrics.totalScore} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    className="text-6xl md:text-7xl font-black text-foreground tracking-tight">
                    {metrics.totalScore}<span className="text-xl text-muted-foreground">/100</span>
                  </motion.div>
                  <div className={`mt-3 inline-block px-4 py-1.5 border rounded-full text-xs font-black uppercase tracking-widest ${metrics.gradeColor}`}>
                    Grade: {metrics.grade}
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 pt-4 border-t border-border text-center text-[10px] text-muted-foreground">
                  <div className="bg-surface p-2.5 rounded-xl">
                    <span className="block font-semibold">DTI</span>
                    <span className="text-foreground font-bold">{metrics.dtiPoints}/25</span>
                  </div>
                  <div className="bg-surface p-2.5 rounded-xl">
                    <span className="block font-semibold">Emergency</span>
                    <span className="text-foreground font-bold">{metrics.cushionPoints}/25</span>
                  </div>
                  <div className="bg-surface p-2.5 rounded-xl">
                    <span className="block font-semibold">CIBIL</span>
                    <span className="text-foreground font-bold">{metrics.creditPoints}/25</span>
                  </div>
                  <div className="bg-surface p-2.5 rounded-xl">
                    <span className="block font-semibold">Insurance</span>
                    <span className="text-foreground font-bold">{metrics.insurancePoints}/25</span>
                  </div>
                </div>
              </motion.div>

              {/* Diagnostic Benchmarks breakdown list */}
              <div className="glass-panel border-border shadow-2xl rounded-2xl p-6 space-y-4">
                <h3 className="text-sm font-bold text-foreground">Diagnostics Report</h3>

                <div className="space-y-3 text-xs">

                  {/* DTI */}
                  <div className="p-4 bg-surface rounded-xl flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-foreground">Debt-to-Income (DTI) Ratio</p>
                      <p className="text-[10px] text-muted-foreground mt-1">Calculated ratio is {metrics.dti}%. Target should be under 36%.</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-lg font-bold ${metrics.dti < 36 ? 'bg-green-500/20 text-green-400': 'bg-red-500/20 text-red-400'}`}>
                      {metrics.dti < 36 ? 'Good': 'Elevated'}
                    </span>
                  </div>

                  {/* Cushion */}
                  <div className="p-4 bg-surface rounded-xl flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-foreground">Emergency Savings Cushion</p>
                      <p className="text-[10px] text-muted-foreground mt-1">Liquid savings covers {metrics.cushion} months of essentials. Target is &gt;6 months.</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-lg font-bold ${metrics.cushion >= 6 ? 'bg-green-500/20 text-green-400': 'bg-yellow-500/20 text-yellow-400'}`}>
                      {metrics.cushion >= 6 ? 'Sufficient': 'Low Cushion'}
                    </span>
                  </div>

                  {/* CIBIL */}
                  <div className="p-4 bg-surface rounded-xl flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-foreground">Credit Score Rating</p>
                      <p className="text-[10px] text-muted-foreground mt-1">Current CIBIL is {cibil}. Prime loans require 750+.</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-lg font-bold ${cibil >= 750 ? 'bg-green-500/20 text-green-400': 'bg-yellow-500/20 text-yellow-400'}`}>
                      {cibil >= 750 ? 'Prime': 'Sub-prime'}
                    </span>
                  </div>

                </div>
              </div>

              {/* Predictor redirection */}
              <div className="bg-gradient-to-r from-orange-500/10 to-orange-600/10 border border-orange-500/20 rounded-2xl p-6">
                <h4 className="text-base font-bold text-foreground mb-2 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-orange-600 dark:text-orange-500" /> Apply For Pre-Approvals
                </h4>
                <p className="text-xs text-muted-foreground mb-4">Underwriters combine debt service, CIBIL profiles, and health scoring to predict default probabilities. Predict retail pre-approval odds now.</p>
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
