import React, { useState, useMemo } from 'react';
import { Breadcrumbs } from '../../components/Breadcrumbs';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { Calculator, ArrowRight, IndianRupee, Percent, CheckCircle2, AlertTriangle, ShieldCheck, HelpCircle, ChevronDown, ChevronUp, Zap, Sparkles, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const fmt = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const FAQS = [
  { q: 'What is Debt-to-Income (DTI) ratio?', a: 'Debt-to-Income (DTI) ratio is a personal finance metric that measures the percentage of your gross or net monthly income that goes toward paying recurring debts. Lenders use it to measure your ability to manage monthly payments and repay borrowed money.' },
  { q: 'What DTI ratio do lenders look for?', a: 'Generally, lenders prefer a DTI ratio below 36%, with no more than 28% of that debt going towards housing costs. A DTI ratio of 50% is typically the absolute maximum limit to qualify for new loans.' },
  { q: 'How does DTI differ from credit utilization ratio (CUR)?', a: 'While credit utilization measures the percentage of your credit card limits you are currently using, DTI measures your monthly debt payment obligation relative to your total monthly income.' },
  { q: 'Does DTI directly impact my CIBIL score?', a: 'No, your credit report does not list your income, so credit bureaus cannot calculate your DTI. However, high debt levels lead to higher credit utilization and potential missed payments, which do affect your CIBIL score.' },
  { q: 'How can I quickly improve my DTI ratio?', a: 'You can lower your DTI by: 1. Paying off high-interest cards or small personal loans to reduce monthly EMIs. 2. Refinancing or extending tenure on large loans to reduce the monthly EMI obligation. 3. Increasing your stable monthly income streams.' }
];

export default function DtiCalculator() {
  const navigate = useNavigate();

  // Income Input
  const [monthlyIncome, setMonthlyIncome] = useState(100000);

  // Debt Obligations Inputs
  const [housingPayment, setHousingPayment] = useState(25000); // Rent or Home Loan EMI
  const [autoPayment, setAutoPayment] = useState(12000); // Car or Bike Loan EMI
  const [personalPayment, setPersonalPayment] = useState(8000); // Personal Loan EMIs
  const [cardMinPayment, setCardMinPayment] = useState(5000); // Credit Card Minimums
  const [otherLoans, setOtherLoans] = useState(0); // Gold loan, Education loan, etc.

  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  // Calculations
  const analysis = useMemo(() => {
    const totalDebt = housingPayment + autoPayment + personalPayment + cardMinPayment + otherLoans;
    const dti = monthlyIncome > 0 ? Math.round((totalDebt / monthlyIncome) * 100): 0;

    let rating = 'Excellent';
    let riskDesc = 'Very Low Risk';
    let ratingColor = 'text-emerald-400';
    let barColor = 'bg-emerald-500';
    let recommendation = 'You are in excellent shape. Lenders will view you as highly creditworthy. You have plenty of head room to take on new credit if needed.';

    if (dti <= 35) {
      rating = 'Excellent';
      riskDesc = 'Very Low Risk';
      ratingColor = 'text-emerald-400';
      barColor = 'bg-emerald-500';
    } else if (dti <= 43) {
      rating = 'Good';
      riskDesc = 'Moderate Risk';
      ratingColor = 'text-green-400';
      barColor = 'bg-green-500';
      recommendation = 'Lenders consider this a manageable level of debt. You are likely to qualify for most loans, though they may review your profile more closely.';
    } else if (dti <= 50) {
      rating = 'Average / Warning';
      riskDesc = 'High Risk';
      ratingColor = 'text-yellow-400';
      barColor = 'bg-yellow-500';
      recommendation = 'You are reaching the upper limit of acceptable debt. Getting approved for new prime loans will be challenging. Consider paying down credit cards first.';
    } else {
      rating = 'Critical / Over-leveraged';
      riskDesc = 'Severe Risk';
      ratingColor = 'text-red-400';
      barColor = 'bg-red-500';
      recommendation = 'Strong probability of loan rejections. Lenders will view you as over-leveraged. Focus on debt consolidation or paying off high-interest cards immediately.';
    }

    return {
      totalDebt,
      dti,
      rating,
      riskDesc,
      ratingColor,
      barColor,
      recommendation,
    };
  }, [monthlyIncome, housingPayment, autoPayment, personalPayment, cardMinPayment, otherLoans]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-orange-500/30 overflow-x-hidden">
      <Helmet>
        <title>Debt-to-Income (DTI) Calculator: Know Your FOIR &amp; Loan Eligibility | Gavel AI</title>
        <meta name="description" content="Find out if your debt-to-income (FOIR) ratio is too high for loan approval. Calculate your ratio in 30 seconds and learn how to lower it to unlock better loan offers." />
        <link rel="canonical" href="https://www.trygavel.com/tools/dti-calculator" />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org', '@type': 'WebApplication',
          name: 'Debt-to-Income Calculator', applicationCategory: 'FinanceApplication',
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
            { label: 'Debt-to-Income Calculator', path: '/tools/dti-calculator' }
          ]} />

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
            <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 text-orange-700 dark:text-orange-400 text-sm mb-4 px-4 py-1.5 rounded-full backdrop-blur-sm">
              <Percent className="w-4 h-4 text-amber-800 dark:text-yellow-400" />
              <span className="text-sm font-medium text-amber-800 dark:text-yellow-400">Risk Assessment Tool</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">Debt-to-Income (DTI) Calculator</h1>
            <p className="text-lg text-muted-foreground max-w-2xl">Lenders check DTI before approving any credit. Input your income and recurring debt obligations to evaluate your credit risk profile instantly.</p>
          </motion.div>

          <div className="grid lg:grid-cols-5 gap-8">
            {/* Left: Input parameters */}
            <div className="lg:col-span-2 space-y-6">
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                className="glass-panel border-border shadow-2xl rounded-2xl p-6 space-y-6">

                <h3 className="text-base font-bold text-foreground pb-3 border-b border-border">Income & Liabilities</h3>

                {/* Net Monthly Income */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-xs text-muted-foreground font-semibold">Net Monthly Income (Take-Home)</Label>
                    <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">{fmt(monthlyIncome)}</span>
                  </div>
                  <Slider value={[monthlyIncome]} min={15000} max={1000000} step={5000}
                    onValueChange={([v]) => setMonthlyIncome(v)} className="mb-2" />
                  <Input type="number" value={monthlyIncome} onChange={e => setMonthlyIncome(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-surface border-border text-foreground text-xs h-9" />
                </div>

                {/* Housing Payments */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-xs text-muted-foreground font-semibold">Rent / Home Loan EMI</Label>
                    <span className="text-sm font-bold text-foreground">{fmt(housingPayment)}</span>
                  </div>
                  <Slider value={[housingPayment]} min={0} max={Math.max(housingPayment, monthlyIncome * 0.7)} step={1000}
                    onValueChange={([v]) => setHousingPayment(v)} className="mb-2" />
                  <Input type="number" value={housingPayment} onChange={e => setHousingPayment(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-surface border-border text-foreground text-xs h-9" />
                </div>

                {/* Auto Payments */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-xs text-muted-foreground font-semibold">Car & Auto EMIs</Label>
                    <span className="text-sm font-bold text-foreground">{fmt(autoPayment)}</span>
                  </div>
                  <Slider value={[autoPayment]} min={0} max={50000} step={500}
                    onValueChange={([v]) => setAutoPayment(v)} className="mb-2" />
                  <Input type="number" value={autoPayment} onChange={e => setAutoPayment(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-surface border-border text-foreground text-xs h-9" />
                </div>

                {/* Personal Loans */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-xs text-muted-foreground font-semibold">Personal Loan EMIs</Label>
                    <span className="text-sm font-bold text-foreground">{fmt(personalPayment)}</span>
                  </div>
                  <Slider value={[personalPayment]} min={0} max={100000} step={1000}
                    onValueChange={([v]) => setPersonalPayment(v)} className="mb-2" />
                  <Input type="number" value={personalPayment} onChange={e => setPersonalPayment(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-surface border-border text-foreground text-xs h-9" />
                </div>

                {/* Credit Card Bills */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-xs text-muted-foreground font-semibold">Credit Card Min Payments</Label>
                    <span className="text-sm font-bold text-foreground">{fmt(cardMinPayment)}</span>
                  </div>
                  <Slider value={[cardMinPayment]} min={0} max={50000} step={500}
                    onValueChange={([v]) => setCardMinPayment(v)} className="mb-2" />
                  <Input type="number" value={cardMinPayment} onChange={e => setCardMinPayment(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-surface border-border text-foreground text-xs h-9" />
                </div>

                {/* Other Debts */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-xs text-muted-foreground font-semibold">Other EMIs (Gold, Study, etc.)</Label>
                    <span className="text-sm font-bold text-foreground">{fmt(otherLoans)}</span>
                  </div>
                  <Slider value={[otherLoans]} min={0} max={100000} step={1000}
                    onValueChange={([v]) => setOtherLoans(v)} className="mb-2" />
                  <Input type="number" value={otherLoans} onChange={e => setOtherLoans(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-surface border-border text-foreground text-xs h-9" />
                </div>

              </motion.div>
            </div>

            {/* Right: Analysis & Output */}
            <div className="lg:col-span-3 space-y-6">
              {/* Aggregated Output Card */}
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                className="bg-gradient-to-br from-orange-500/15 via-orange-500/5 to-transparent border border-orange-500/30 shadow-2xl rounded-2xl p-8 relative overflow-hidden">
                <div className="absolute top-4 right-4 bg-yellow-500/20 text-amber-800 dark:text-yellow-400 text-xs px-2.5 py-1 rounded-full flex items-center gap-1 font-semibold border border-yellow-500/30">
                  <ShieldCheck className="w-3.5 h-3.5" /> High Trust Rules
                </div>

                <div className="text-center mb-6">
                  <p className="text-sm text-muted-foreground mb-2">Your Debt-to-Income (DTI) Ratio</p>
                  <motion.div key={analysis.dti} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    className={`text-6xl font-black tracking-tight ${analysis.ratingColor}`}>
                    {analysis.dti}%
                  </motion.div>
                  <p className="text-xs text-muted-foreground mt-2">DTI Class: <strong className="text-foreground">{analysis.rating}</strong></p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                  <div className="bg-surface p-4 rounded-xl">
                    <p className="text-xs text-muted-foreground mb-1">Total Monthly Debts</p>
                    <p className="text-lg font-bold text-foreground">{fmt(analysis.totalDebt)}</p>
                  </div>
                  <div className="bg-surface p-4 rounded-xl">
                    <p className="text-xs text-muted-foreground mb-1">Risk Description</p>
                    <p className="text-lg font-bold text-foreground">{analysis.riskDesc}</p>
                  </div>
                </div>
              </motion.div>

              {/* Progress Meter bar visualization */}
              <div className="glass-panel border-border shadow-2xl rounded-2xl p-6 space-y-4">
                <h3 className="text-sm font-bold text-foreground">Ratio Risk Breakdown</h3>

                <div>
                  <div className="h-4 bg-surface rounded-full overflow-hidden flex">
                    <div className={`h-full ${analysis.barColor}`} style={{ width: `${Math.min(100, analysis.dti)}%` }} />
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground mt-2">
                    <span className="text-emerald-700 dark:text-emerald-400 font-semibold">&lt;35% Safe</span>
                    <span className="text-green-700 dark:text-green-400 font-semibold">36-43% Manageable</span>
                    <span className="text-amber-800 dark:text-yellow-400 font-semibold">44-50% Warning</span>
                    <span className="text-red-700 dark:text-red-400 font-semibold">&gt;50% Danger</span>
                  </div>
                </div>

                <div className="p-4 bg-surface border border-border rounded-xl">
                  <p className="text-xs text-muted-foreground leading-relaxed font-medium italic">{analysis.recommendation}</p>
                </div>
              </div>

              {/* Action plan to optimize */}
              <div className="bg-surface border border-border rounded-2xl p-6 space-y-4">
                <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                  <Sparkles className="w-4.5 h-4.5 text-amber-800 dark:text-yellow-400" /> Strategies to Lower DTI
                </h4>

                <div className="grid md:grid-cols-2 gap-4 text-xs text-muted-foreground">
                  <div className="bg-surface p-4 rounded-xl border border-border">
                    <p className="font-semibold text-foreground mb-1">Debt Snowball Method</p>
                    <p className="leading-relaxed">Pay off smallest credit balances first. This quickly frees up monthly cash flow and drops total EMI count.</p>
                  </div>
                  <div className="bg-surface p-4 rounded-xl border border-border">
                    <p className="font-semibold text-foreground mb-1">Loan Tenure Extension</p>
                    <p className="leading-relaxed">Ask banks to refinance large personal or auto loans to longer tenures. This reduces individual EMIs and drops DTI ratio.</p>
                  </div>
                </div>
              </div>

              {/* Advanced pre-approval predictability */}
              <div className="bg-gradient-to-r from-orange-500/10 to-orange-600/10 border border-orange-500/20 rounded-2xl p-6">
                <h4 className="text-base font-bold text-foreground mb-2 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-orange-600 dark:text-orange-500" /> Run Pre-Approval Predictor Checks
                </h4>
                <p className="text-xs text-muted-foreground mb-4">Indian banks evaluate DTI (FOIR limits) alongside transaction flows and CIBIL status. Run our AI analysis check now.</p>
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
