import React, { useState, useMemo } from 'react';
import { Breadcrumbs } from '../../components/Breadcrumbs';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { Calculator, ArrowRight, IndianRupee, Percent, ShieldCheck, ChevronDown, ChevronUp, Zap, Sparkles, Building, Landmark, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const fmt = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const FAQS = [
  { q: 'What is the main difference between a Bank and an NBFC?', a: 'Banks are licensed by the RBI to accept demand deposits and are subject to strict reserve requirements (CRR, SLR). NBFCs (Non-Banking Financial Companies) cannot accept demand deposits, have more relaxed lending criteria, but generally charge slightly higher interest rates.' },
  { q: 'Why are NBFC interest rates linked to PLR instead of Repo Rate?', a: 'Commercial banks link floating-rate loans to external benchmarks like the RBI Repo rate (RLLR) for direct transparency. NBFCs link their rates to their own internal Prime Lending Rate (PLR), giving them more operational pricing control.' },
  { q: 'Is it easier to get a loan approved from an NBFC?', a: 'Yes. NBFCs are more flexible with CIBIL score requirements, income proofs, and documentation. They are ideal for self-employed individuals or those with credit scores below 700 who face high rejection rates at prime banks.' },
  { q: 'Which is faster for loan processing?', a: 'NBFCs typically process and disburse loans within 2 to 5 days due to streamlined digital verification. Public and private commercial banks have rigid compliance checks and take 10 to 15 business days.' },
  { q: 'Can I transfer my loan from an NBFC to a Bank later?', a: 'Yes. You can perform a balance transfer of your outstanding loan from an NBFC to a commercial bank to secure a lower interest rate once your CIBIL score improves.' }
];

export default function NbfcVsBankComparison() {
  const navigate = useNavigate();

  // Inputs
  const [loanAmount, setLoanAmount] = useState(5000000); // 50 Lakhs
  const [loanType, setLoanType] = useState<'home' | 'personal' | 'lap'>('home');
  const [cibilScore, setCibilScore] = useState<number>(720);
  const [tenureYrs, setTenureYrs] = useState(20);

  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  // Sync default tenure when loan type changes
  const handleLoanTypeChange = (type: 'home' | 'personal' | 'lap') => {
    setLoanType(type);
    if (type === 'home') {
      setTenureYrs(20);
    } else if (type === 'personal') {
      setTenureYrs(5);
    } else {
      setTenureYrs(15);
    }
  };

  // Calculations
  const comparison = useMemo(() => {
    // Underwriting rates mapping based on CIBIL and Loan Type
    let bankRate = 8.5;
    let nbfcRate = 8.8;
    let bankEligible = true;
    const nbfcEligible = true;

    // Rates structure logic
    if (loanType === 'home') {
      if (cibilScore >= 750) {
        bankRate = 8.4;
        nbfcRate = 8.65;
      } else if (cibilScore >= 700) {
        bankRate = 8.8;
        nbfcRate = 9.1;
      } else if (cibilScore >= 650) {
        bankRate = 9.6;
        nbfcRate = 9.9;
      } else {
        bankEligible = false; // Banks reject below 650
        bankRate = 0;
        nbfcRate = 11.5; // NBFC accepts with premium
      }
    } else if (loanType === 'personal') {
      if (cibilScore >= 750) {
        bankRate = 10.75;
        nbfcRate = 11.5;
      } else if (cibilScore >= 700) {
        bankRate = 12.0;
        nbfcRate = 12.75;
      } else if (cibilScore >= 650) {
        bankRate = 14.5;
        nbfcRate = 15.0;
      } else {
        bankEligible = false;
        bankRate = 0;
        nbfcRate = 18.0;
      }
    } else { // LAP
      if (cibilScore >= 750) {
        bankRate = 9.25;
        nbfcRate = 9.75;
      } else if (cibilScore >= 700) {
        bankRate = 9.9;
        nbfcRate = 10.5;
      } else if (cibilScore >= 650) {
        bankRate = 11.0;
        nbfcRate = 11.75;
      } else {
        bankEligible = false;
        bankRate = 0;
        nbfcRate = 13.5;
      }
    }

    const n = tenureYrs * 12;

    const calcEmiVal = (principal: number, annualRate: number) => {
      if (principal <= 0 || annualRate <= 0 || n <= 0) return { emi: 0, totalInterest: 0, totalPayment: 0 };
      const r = annualRate / 12 / 100;
      const factor = Math.pow(1 + r, n);
      const emi = Math.round(principal * r * factor / (factor - 1));
      const totalPayment = emi * n;
      const totalInterest = totalPayment - principal;
      return { emi, totalInterest, totalPayment };
    };

    const bankCalc = bankEligible ? calcEmiVal(loanAmount, bankRate): { emi: 0, totalInterest: 0, totalPayment: 0 };
    const nbfcCalc = nbfcEligible ? calcEmiVal(loanAmount, nbfcRate): { emi: 0, totalInterest: 0, totalPayment: 0 };

    return {
      bankRate,
      nbfcRate,
      bankEligible,
      nbfcEligible,
      bankEmi: bankCalc.emi,
      nbfcEmi: nbfcCalc.emi,
      bankTotalInterest: bankCalc.totalInterest,
      nbfcTotalInterest: nbfcCalc.totalInterest,
      processingTimeBank: '10-15 Business Days',
      processingTimeNbfc: '2-5 Business Days',
      flexibilityBank: 'Very Rigid (strict income & CIBIL rules)',
      flexibilityNbfc: 'High Flexibility (self-employed friendly)',
      processingFeeBank: '0.25% - 0.50% of loan amount',
      processingFeeNbfc: '1.00% - 2.00% of loan amount',
    };
  }, [loanAmount, loanType, cibilScore, tenureYrs]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-orange-500/30 overflow-x-hidden">
      <Helmet>
        <title>NBFC vs Bank Loan: Compare Rates, Fees &amp; Approval Odds | Gavel AI</title>
        <meta name="description" content="Should you get a loan from a bank or an NBFC? Compare interest rates, processing times, CIBIL requirements, and approval chances to make the right choice." />
        <link rel="canonical" href="https://www.trygavel.com/tools/nbfc-vs-bank-comparison" />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org', '@type': 'WebApplication',
          name: 'NBFC vs Bank Comparison Calculator', applicationCategory: 'FinanceApplication',
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
            { label: 'NBFC vs Bank Comparison', path: '/tools/nbfc-vs-bank-comparison' }
          ]} />

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
            <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 text-orange-700 dark:text-orange-400 text-sm mb-4 px-4 py-1.5 rounded-full backdrop-blur-sm">
              <Landmark className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
              <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Institutional Underwriting Comparison</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">NBFC vs Bank Loan Comparison</h1>
            <p className="text-lg text-muted-foreground max-w-2xl">Compare borrowing channels side-by-side. View how interest rates, approval speeds, and credit criteria match up between Banks and NBFCs.</p>
          </motion.div>

          <div className="grid lg:grid-cols-5 gap-8">
            {/* Left: Inputs */}
            <div className="lg:col-span-2 space-y-6">
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                className="glass-panel border-border shadow-2xl rounded-2xl p-6 space-y-6">

                <h3 className="text-base font-bold text-foreground pb-3 border-b border-border">Parameters</h3>

                {/* Loan Type */}
                <div>
                  <Label className="text-xs text-muted-foreground font-semibold mb-2 block">Loan Category</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'home' as const, label: 'Home Loan' },
                      { id: 'personal' as const, label: 'Personal' },
                      { id: 'lap' as const, label: 'LAP' },
                    ].map(opt => (
                      <button key={opt.id} onClick={() => handleLoanTypeChange(opt.id)}
                        className={`py-2 text-[11px] font-semibold rounded-lg border transition-all ${loanType === opt.id ? 'bg-emerald-600 border-emerald-700 text-white': 'bg-white/5 border-white/10 text-muted-foreground hover:text-foreground'}`}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Loan Amount */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-xs text-muted-foreground font-semibold">Desired Loan Amount</Label>
                    <span className="text-sm font-bold text-foreground">{fmt(loanAmount)}</span>
                  </div>
                  <Slider value={[loanAmount]} min={100000} max={25000000} step={100000}
                    onValueChange={([v]) => setLoanAmount(v)} className="mb-2" />
                </div>

                {/* CIBIL Score */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-xs text-muted-foreground font-semibold">Your CIBIL Score</Label>
                    <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">{cibilScore}</span>
                  </div>
                  <Slider value={[cibilScore]} min={300} max={900} step={5}
                    onValueChange={([v]) => setCibilScore(v)} className="mb-2" />
                </div>

                {/* Tenure */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-xs text-muted-foreground font-semibold">Tenure (Years)</Label>
                    <span className="text-sm font-bold text-foreground">{tenureYrs} Years</span>
                  </div>
                  <Slider value={[tenureYrs]} min={1} max={30} step={1}
                    onValueChange={([v]) => setTenureYrs(v)} className="mb-2" />
                </div>

              </motion.div>
            </div>

            {/* Right: Side by side comparison dashboard */}
            <div className="lg:col-span-3 space-y-6">

              <div className="grid md:grid-cols-2 gap-6">

                {/* Commercial Bank */}
                <div className="glass-panel border-border shadow-2xl rounded-2xl p-6 relative overflow-hidden space-y-4">
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-sm">
                    <Building className="w-4.5 h-4.5" /> Commercial Bank
                  </div>

                  {comparison.bankEligible ? (
                    <>
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase block">Expected Interest Rate</span>
                        <span className="text-3xl font-black text-foreground">{comparison.bankRate}% p.a.</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase block">Calculated Monthly EMI</span>
                        <span className="text-xl font-bold text-foreground">{fmt(comparison.bankEmi)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase block">Total Interest Paid</span>
                        <span className="text-xs font-semibold text-red-700 dark:text-red-400">{fmt(comparison.bankTotalInterest)}</span>
                      </div>
                    </>
                  ): (
                    <div className="py-6 text-center">
                      <AlertCircle className="w-8 h-8 text-red-700 dark:text-red-400 mx-auto mb-2" />
                      <p className="text-xs text-red-700 dark:text-red-400 font-bold">Unlikely to Qualify</p>
                      <p className="text-[10px] text-muted-foreground mt-1">Banks strictly require a CIBIL score of 650+ for {loanType} loans.</p>
                    </div>
                  )}

                  <div className="pt-4 border-t border-border space-y-2.5 text-xs text-muted-foreground">
                    <div>
                      <span className="text-[9px] text-muted-foreground uppercase block font-semibold">Approval Speed</span>
                      <span>{comparison.processingTimeBank}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-muted-foreground uppercase block font-semibold">Lending Policy</span>
                      <span>{comparison.flexibilityBank}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-muted-foreground uppercase block font-semibold">Average Fees</span>
                      <span>{comparison.processingFeeBank}</span>
                    </div>
                  </div>
                </div>

                {/* NBFC */}
                <div className="glass-panel border-border shadow-2xl rounded-2xl p-6 relative overflow-hidden space-y-4">
                  <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 font-bold text-sm">
                    <Landmark className="w-4.5 h-4.5" /> Licensed NBFC
                  </div>

                  {comparison.nbfcEligible ? (
                    <>
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase block">Expected Interest Rate</span>
                        <span className="text-3xl font-black text-foreground">{comparison.nbfcRate}% p.a.</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase block">Calculated Monthly EMI</span>
                        <span className="text-xl font-bold text-foreground">{fmt(comparison.nbfcEmi)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase block">Total Interest Paid</span>
                        <span className="text-xs font-semibold text-red-700 dark:text-red-400">{fmt(comparison.nbfcTotalInterest)}</span>
                      </div>
                    </>
                  ): (
                    <div className="py-6 text-center">
                      <AlertCircle className="w-8 h-8 text-red-700 dark:text-red-400 mx-auto mb-2" />
                      <p className="text-xs text-red-700 dark:text-red-400 font-bold">Unlikely to Qualify</p>
                    </div>
                  )}

                  <div className="pt-4 border-t border-border space-y-2.5 text-xs text-muted-foreground">
                    <div>
                      <span className="text-[9px] text-muted-foreground uppercase block font-semibold">Approval Speed</span>
                      <span>{comparison.processingTimeNbfc}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-muted-foreground uppercase block font-semibold">Lending Policy</span>
                      <span>{comparison.flexibilityNbfc}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-muted-foreground uppercase block font-semibold">Average Fees</span>
                      <span>{comparison.processingFeeNbfc}</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Predictor redirection */}
              <div className="bg-gradient-to-r from-orange-500/10 to-orange-600/10 border border-orange-500/20 rounded-2xl p-6">
                <h4 className="text-base font-bold text-foreground mb-2 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-orange-600 dark:text-orange-500" /> Apply For Pre-Approvals
                </h4>
                <p className="text-xs text-muted-foreground mb-4">Underwriting guidelines combine internal and external benchmarks. Predict your retail pre-approval odds instantly.</p>
                <Button onClick={() => navigate('/loan-approval-predictor')} className="bg-orange-500 hover:bg-orange-600 text-white w-full py-4 text-sm font-bold">
                  Predict Approval Odds <ArrowRight className="w-4 h-4 ml-2" />
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
