import React, { useState, useMemo } from 'react';
import { Breadcrumbs } from '../../components/Breadcrumbs';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { Calculator, ArrowRight, IndianRupee, Percent, Clock, Home, Info, CheckCircle2, AlertTriangle, ShieldCheck, HelpCircle, ChevronDown, ChevronUp, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const fmt = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const FAQS = [
  { q: 'How is home loan affordability calculated?', a: 'Lenders check your net monthly income and existing EMIs. They cap your total monthly EMIs (including the new home loan) at 40% to 55% of your income. The maximum home loan amount is calculated by reverse-engineering this monthly EMI capacity over your selected tenure.' },
  { q: 'What is the minimum down payment for a home loan in India?', a: 'RBI regulations require a minimum down payment depending on the property value: 10% for loans up to ₹30 Lakhs, 20% for loans between ₹30 Lakhs to ₹75 Lakhs, and 25% for loans above ₹75 Lakhs.' },
  { q: 'What is the LTV ratio?', a: 'Loan-to-Value (LTV) ratio is the percentage of the property value that a bank can finance. If a house costs ₹1 Crore and the bank funds ₹80 Lakhs, the LTV is 80%.' },
  { q: 'Does home loan interest rate affect my affordability?', a: 'Yes. Lower interest rates translate to smaller monthly EMIs, allowing you to qualify for a larger home loan amount with the same monthly income.' },
  { q: 'What other costs should I consider when buying a home?', a: 'Beyond the base price, you must budget for: 1. Stamp duty and registration fees (typically 5% to 8% of property value). 2. Maintenance deposits. 3. Interior and renovation costs. 4. Loan processing fees (0.5% to 1%).' },
];

export default function HomeLoanAffordability() {
  const navigate = useNavigate();

  // Input states
  const [monthlyIncome, setMonthlyIncome] = useState(120000);
  const [existingEmi, setExistingEmi] = useState(10000);
  const [downPayment, setDownPayment] = useState(1500000);
  const [tenureYrs, setTenureYrs] = useState(20); // in years
  const [interestRate, setInterestRate] = useState(8.75); // annual interest rate in %
  const [riskProfile, setRiskProfile] = useState<'moderate' | 'conservative' | 'aggressive'>('moderate');

  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  // Calculations
  const affordability = useMemo(() => {
    // 1. Determine FOIR (Fixed Obligation to Income Ratio) limit
    const foirLimits = {
      conservative: 35,
      moderate: 45,
      aggressive: 55,
    };
    const maxFoir = foirLimits[riskProfile];

    // 2. Max monthly EMI available for home loan
    const maxTotalEmi = (monthlyIncome * maxFoir) / 100;
    const availableHomeEmi = Math.max(0, maxTotalEmi - existingEmi);

    // 3. Max loan amount from monthly capacity
    const n = tenureYrs * 12; // tenure in months
    const r = interestRate / 12 / 100; // monthly rate
    let maxLoanAmount = 0;

    if (availableHomeEmi > 0 && r > 0) {
      const factor = Math.pow(1 + r, n);
      maxLoanAmount = Math.round(availableHomeEmi * (factor - 1) / (r * factor));
    }

    // 4. Calculate total property value (Loan + Down Payment)
    // Note: RBI limits LTV depending on property value:
    // Up to 30L: 90% LTV
    // 30L - 75L: 80% LTV
    // Above 75L: 75% LTV
    const rawPropertyValue = maxLoanAmount + downPayment;

    let ltvLimit = 75;
    if (rawPropertyValue <= 3000000) {
      ltvLimit = 90;
    } else if (rawPropertyValue <= 7500000) {
      ltvLimit = 80;
    }

    // Adjust loan amount if LTV limit binds it
    const ltvMaxLoan = (rawPropertyValue * ltvLimit) / 100;
    const finalLoanAmount = Math.round(Math.min(maxLoanAmount, ltvMaxLoan));
    const finalPropertyValue = finalLoanAmount + downPayment;

    // 5. Calculate actual monthly home EMI for the final loan amount
    let actualEmi = 0;
    if (finalLoanAmount > 0 && r > 0) {
      const factor = Math.pow(1 + r, n);
      actualEmi = Math.round(finalLoanAmount * r * factor / (factor - 1));
    }

    // 6. Additional purchase cost estimations (Stamp duty ~6%, Processing fees ~0.5%)
    const stampDuty = Math.round(finalPropertyValue * 0.06);
    const processingFees = Math.round(finalLoanAmount * 0.005);
    const totalAdditionalCosts = stampDuty + processingFees;
    const totalCashNeeded = downPayment + totalAdditionalCosts;

    // 7. General financial checks
    const finalFoirPercentage = monthlyIncome > 0 ? Math.round(((existingEmi + actualEmi) / monthlyIncome) * 100): 0;
    const isLtvBreached = finalLoanAmount > ltvMaxLoan;

    return {
      maxTotalEmi,
      availableHomeEmi,
      finalLoanAmount,
      finalPropertyValue,
      actualEmi,
      stampDuty,
      processingFees,
      totalAdditionalCosts,
      totalCashNeeded,
      finalFoirPercentage,
      isLtvBreached,
      ltvLimit,
    };
  }, [monthlyIncome, existingEmi, downPayment, tenureYrs, interestRate, riskProfile]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-orange-500/30 overflow-x-hidden">
      <Helmet>
        <title>Home Loan Affordability Calculator: How Much Home Loan Can You Get? | Gavel AI</title>
        <meta name="description" content="Calculate exactly how much home loan you can afford based on your take-home salary. Calculate target home budget, EMIs, downpayment, and check lender eligibility." />
        <link rel="canonical" href="https://www.trygavel.com/tools/home-loan-affordability" />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org', '@type': 'WebApplication',
          name: 'Home Loan Affordability Calculator', applicationCategory: 'FinanceApplication',
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
            { label: 'Home Loan Affordability', path: '/tools/home-loan-affordability' }
          ]} />

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
            <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 text-orange-700 dark:text-orange-400 text-sm mb-4 px-4 py-1.5 rounded-full backdrop-blur-sm">
              <Home className="w-4 h-4 text-pink-700 dark:text-pink-400" />
              <span className="text-sm font-medium text-pink-700 dark:text-pink-400">Home Finance Guide</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">Home Loan Affordability Calculator</h1>
            <p className="text-lg text-muted-foreground max-w-2xl">Find out your true home buying budget. Balance down payments, income requirements, and bank regulations to purchase your next house with confidence.</p>
          </motion.div>

          <div className="grid lg:grid-cols-5 gap-8">
            {/* Left: Input Form */}
            <div className="lg:col-span-2 space-y-6">
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                className="glass-panel border-border shadow-2xl rounded-2xl p-6 space-y-6">

                {/* Monthly Income */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-semibold text-muted-foreground">Net Monthly Income (Salary / Profit)</Label>
                    <span className="text-base font-bold text-foreground">{fmt(monthlyIncome)}</span>
                  </div>
                  <Slider value={[monthlyIncome]} min={20000} max={1000000} step={5000}
                    onValueChange={([v]) => setMonthlyIncome(v)} className="mb-2" />
                  <Input type="number" value={monthlyIncome} onChange={e => setMonthlyIncome(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-surface border-border text-foreground text-xs h-9" />
                </div>

                {/* Existing EMIs */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-semibold text-muted-foreground">Existing Monthly EMIs</Label>
                    <span className="text-base font-bold text-red-700 dark:text-red-400">{fmt(existingEmi)}</span>
                  </div>
                  <Slider value={[existingEmi]} min={0} max={Math.max(existingEmi, monthlyIncome * 0.8)} step={1000}
                    onValueChange={([v]) => setExistingEmi(v)} className="mb-2" />
                  <Input type="number" value={existingEmi} onChange={e => setExistingEmi(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-surface border-border text-foreground text-xs h-9" />
                </div>

                {/* Down Payment */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-semibold text-muted-foreground">Available Down Payment (Savings)</Label>
                    <span className="text-base font-bold text-green-700 dark:text-green-400">{fmt(downPayment)}</span>
                  </div>
                  <Slider value={[downPayment]} min={50000} max={50000000} step={50000}
                    onValueChange={([v]) => setDownPayment(v)} className="mb-2" />
                  <Input type="number" value={downPayment} onChange={e => setDownPayment(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-surface border-border text-foreground text-xs h-9" />
                </div>

                {/* Risk Profile Selection */}
                <div>
                  <Label className="text-sm font-semibold text-muted-foreground mb-2 block">DTI Spending Rule</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'conservative' as const, label: 'Safe (35%)' },
                      { id: 'moderate' as const, label: 'Balanced (45%)' },
                      { id: 'aggressive' as const, label: 'Max (55%)' },
                    ].map(opt => (
                      <button key={opt.id} onClick={() => setRiskProfile(opt.id)}
                        className={`py-2 text-xs font-semibold rounded-lg border transition-all ${riskProfile === opt.id ? 'bg-pink-600 border-pink-700 text-white': 'bg-white/5 border-white/10 text-muted-foreground hover:text-foreground'}`}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Interest Rate */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-semibold text-muted-foreground">Expected Interest Rate (p.a.)</Label>
                    <span className="text-sm font-bold text-foreground">{interestRate}%</span>
                  </div>
                  <Slider value={[interestRate]} min={6.5} max={15} step={0.1}
                    onValueChange={([v]) => setInterestRate(v)} className="mb-2" />
                </div>

                {/* Loan Tenure */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-semibold text-muted-foreground">Loan Tenure</Label>
                    <span className="text-sm font-bold text-foreground">{tenureYrs} Years ({tenureYrs * 12} months)</span>
                  </div>
                  <Slider value={[tenureYrs]} min={5} max={30} step={1}
                    onValueChange={([v]) => setTenureYrs(v)} className="mb-2" />
                </div>

              </motion.div>
            </div>

            {/* Right: Detailed Output Analysis */}
            <div className="lg:col-span-3 space-y-6">
              {/* Max House Budget Card */}
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                className="bg-gradient-to-br from-orange-500/15 via-orange-500/5 to-transparent border border-orange-500/30 shadow-2xl rounded-2xl p-8 relative overflow-hidden">
                <div className="absolute top-4 right-4 bg-pink-500/20 text-pink-700 dark:text-pink-400 text-xs px-2.5 py-1 rounded-full flex items-center gap-1 font-semibold border border-pink-500/30">
                  <ShieldCheck className="w-3.5 h-3.5" /> High Trust Rules
                </div>

                <div className="text-center mb-6">
                  <p className="text-sm text-muted-foreground mb-2">Estimated Maximum Property Value</p>
                  <motion.div key={affordability.finalPropertyValue} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    className="text-5xl md:text-6xl font-black text-foreground tracking-tight">
                    {fmt(affordability.finalPropertyValue)}
                  </motion.div>
                  <p className="text-xs text-muted-foreground mt-2">Maximum Home Loan Amount: <span className="text-pink-700 dark:text-pink-400 font-bold">{fmt(affordability.finalLoanAmount)}</span></p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                  <div className="bg-surface p-4 rounded-xl">
                    <p className="text-xs text-muted-foreground mb-1">New Home Loan EMI</p>
                    <p className="text-lg font-bold text-foreground">{fmt(affordability.actualEmi)}/mo</p>
                  </div>
                  <div className="bg-surface p-4 rounded-xl">
                    <p className="text-xs text-muted-foreground mb-1">Additional Purchase Costs</p>
                    <p className="text-lg font-bold text-muted-foreground">{fmt(affordability.totalAdditionalCosts)}</p>
                  </div>
                </div>
              </motion.div>

              {/* Extra Cost Breakdowns */}
              <div className="glass-panel border-border shadow-2xl rounded-2xl p-6 space-y-4">
                <h3 className="text-lg font-bold text-foreground">Estimated Capital Requirements</h3>

                <div className="space-y-3">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Base Down Payment Contribution</span>
                    <span className="font-semibold text-foreground">{fmt(downPayment)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Stamp Duty & Registration (Estimated ~6%)</span>
                    <span className="font-semibold text-foreground">{fmt(affordability.stampDuty)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Home Loan Processing Fees (~0.5%)</span>
                    <span className="font-semibold text-foreground">{fmt(affordability.processingFees)}</span>
                  </div>
                  <div className="pt-3 border-t border-border flex justify-between text-sm">
                    <span className="font-bold text-foreground">Total Cash Required Upfront</span>
                    <span className="font-bold text-pink-700 dark:text-pink-400">{fmt(affordability.totalCashNeeded)}</span>
                  </div>
                </div>

                {/* FOIR status check */}
                <div className="pt-2 border-t border-border">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Total EMIs / Income Ratio</span>
                    <span>{affordability.finalFoirPercentage}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-surface overflow-hidden">
                    <div className="bg-pink-400 h-full" style={{ width: `${Math.min(100, affordability.finalFoirPercentage)}%` }} />
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-2">Maximum banking limits usually cap this at 50% to prevent rejection.</p>
                </div>
              </div>

              {/* Predictor Redirection */}
              <div className="bg-gradient-to-r from-orange-500/10 to-orange-600/10 border border-orange-500/20 rounded-2xl p-6">
                <h4 className="text-base font-bold text-foreground mb-2 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-orange-600 dark:text-orange-500" /> Run Pre-Approval Check
                </h4>
                <p className="text-xs text-muted-foreground mb-4">Mortgage loan approvals evaluate detailed parameters like age, company profiles, and credit files. Check your pre-approval odds now.</p>
                <Button onClick={() => navigate('/loan-approval-predictor')} className="bg-orange-500 hover:bg-orange-600 text-white w-full py-4 text-sm font-bold">
                  Predict Pre-Approval Odds <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>

            </div>
          </div>

          {/* FAQ Accordion */}
          <section className="mt-16 border-t border-border pt-16">
            <h2 className="text-3xl font-bold text-foreground mb-8">People Also Ask</h2>
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
