import React, { useState, useMemo } from 'react';
import { Breadcrumbs } from '../../components/Breadcrumbs';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { Calculator, ArrowRight, IndianRupee, Percent, CheckCircle2, ShieldCheck, ChevronDown, ChevronUp, Zap, Sparkles, HelpCircle, AlertTriangle, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const fmt = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const FAQS = [
  { q: 'Why do different banks offer different interest rates?', a: 'Banks set rates based on their cost of funds, risk appetite, and operating margins. Government banks like SBI often offer lower rates but have stricter criteria. Private banks and NBFCs may charge slightly higher rates but provide faster processing.' },
  { q: 'How does credit score affect the interest rate offered to me?', a: 'Lenders price risk based on credit scores. Borrowers with excellent scores (750+) qualify for prime rates. If your score is lower (e.g., 650), banks may charge a risk premium, adding 1.5% to 3.5% to the base rate.' },
  { q: 'What is the difference between fixed and floating interest rates?', a: 'Fixed rates remain constant throughout the loan tenure. Floating rates are linked to an external benchmark (like EBLR/Repo Rate in India) and fluctuate based on RBI policy changes. Floating rates are typically 1% to 2% cheaper than fixed rates.' },
  { q: 'Are there special rate discounts for women borrowers?', a: 'Yes. Many prime lenders in India offer a concession of 0.05% (5 basis points) on home loan interest rates for women co-owners or primary applicants.' },
  { q: 'What other charges should I look at besides the interest rate?', a: 'You must evaluate: 1. Processing fees (typically 0.5% to 2%). 2. Documentation charges. 3. Prepayment or foreclosure penalties (zero on floating rate loans). 4. MODT (Memorandum of Deposit of Title Deeds) charges for home loans.' }
];

interface LenderProfile {
  name: string;
  logoLetter: string;
  homeRate: [number, number]; // [min, max]
  personalRate: [number, number];
  carRate: [number, number];
  processingFee: string;
}

const LENDERS: LenderProfile[] = [
  { name: 'State Bank of India (SBI)', logoLetter: 'S', homeRate: [8.40, 9.65], personalRate: [11.00, 14.00], carRate: [8.85, 9.80], processingFee: '0.35% - 1.00% (Min ₹1,000)' },
  { name: 'HDFC Bank', logoLetter: 'H', homeRate: [8.50, 9.85], personalRate: [10.50, 15.00], carRate: [8.75, 10.50], processingFee: '0.50% - 1.50%' },
  { name: 'ICICI Bank', logoLetter: 'I', homeRate: [8.55, 9.90], personalRate: [10.75, 16.00], carRate: [8.85, 11.00], processingFee: '0.50% - 2.00%' },
  { name: 'LIC Housing Finance', logoLetter: 'L', homeRate: [8.45, 9.75], personalRate: [12.00, 15.00], carRate: [9.50, 11.00], processingFee: '₹10,000 flat' },
  { name: 'Axis Bank', logoLetter: 'A', homeRate: [8.60, 10.15], personalRate: [10.75, 16.00], carRate: [9.10, 10.95], processingFee: '1.00% - 2.00%' },
  { name: 'Bajaj Finserv', logoLetter: 'B', homeRate: [8.70, 10.50], personalRate: [11.00, 16.00], carRate: [9.25, 12.00], processingFee: '1.50% - 3.00%' },
];

function calcEmi(principal: number, annualRate: number, months: number) {
  if (principal <= 0 || annualRate <= 0 || months <= 0) return { emi: 0, totalInterest: 0, totalPayment: 0 };
  const r = annualRate / 12 / 100;
  const factor = Math.pow(1 + r, months);
  const emi = Math.round(principal * r * factor / (factor - 1));
  const totalPayment = emi * months;
  const totalInterest = totalPayment - principal;
  return { emi, totalInterest, totalPayment };
}

export default function InterestRateComparison() {
  const navigate = useNavigate();

  // Basic loan inputs
  const [loanType, setLoanType] = useState<'home' | 'personal' | 'car'>('home');
  const [loanAmount, setLoanAmount] = useState(5000000);
  const [tenureYrs, setTenureYrs] = useState(20);

  // User profile inputs for dynamic concessions
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [employment, setEmployment] = useState<'salaried' | 'self-employed'>('salaried');
  const [creditTier, setCreditTier] = useState<'excellent' | 'good' | 'average'>('good');

  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  const tenureMonths = tenureYrs * 12;

  // Comparison Calculations
  const comparisonList = useMemo(() => {
    // Determine rate adjustment modifiers based on user parameters
    let adjustment = 0;

    // Concession for women (mainly applies to home loans)
    if (gender === 'female' && loanType === 'home') {
      adjustment -= 0.05;
    }

    // Self-employed profiles get slightly higher rates
    if (employment === 'self-employed') {
      adjustment += 0.25;
    }

    // Credit score impacts rate tier
    if (creditTier === 'excellent') {
      adjustment -= 0.20;
    } else if (creditTier === 'average') {
      adjustment += 0.75;
    }

    return LENDERS.map(lender => {
      // Find base rate range
      let baseRange: [number, number] = [8.5, 9.5];
      if (loanType === 'home') baseRange = lender.homeRate;
      else if (loanType === 'personal') baseRange = lender.personalRate;
      else if (loanType === 'car') baseRange = lender.carRate;

      // Apply modifiers
      const minRate = Math.max(7.5, baseRange[0] + adjustment);
      const maxRate = Math.max(8.0, baseRange[1] + adjustment);

      // Perform calculations
      const minResult = calcEmi(loanAmount, minRate, tenureMonths);
      const maxResult = calcEmi(loanAmount, maxRate, tenureMonths);

      return {
...lender,
        minRate,
        maxRate,
        minEmi: minResult.emi,
        maxEmi: maxResult.emi,
        minInterest: minResult.totalInterest,
        maxInterest: maxResult.totalInterest,
        minPayment: minResult.totalPayment,
        maxPayment: maxResult.totalPayment,
      };
    }).sort((a, b) => a.minEmi - b.minEmi); // sort by lowest starting EMI
  }, [loanType, loanAmount, tenureMonths, gender, employment, creditTier]);

  // Max tenure sync when loan type changes
  const handleLoanTypeChange = (type: 'home' | 'personal' | 'car') => {
    setLoanType(type);
    if (type === 'home') {
      setLoanAmount(5000000);
      setTenureYrs(20);
    } else if (type === 'personal') {
      setLoanAmount(500000);
      setTenureYrs(5);
    } else if (type === 'car') {
      setLoanAmount(1000000);
      setTenureYrs(5);
    }
  };

  const bestDeal = comparisonList[0];
  const worstDeal = comparisonList[comparisonList.length - 1];
  const maxSavingsInterest = Math.max(0, worstDeal.minInterest - bestDeal.minInterest);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-orange-500/30 overflow-x-hidden">
      <Helmet>
        <title>Compare Personal Loan Interest Rates 2026, SBI, HDFC, ICICI | Gavel AI</title>
        <meta name="description" content="Compare the lowest personal loan interest rates and fees across SBI, HDFC, ICICI, and 40+ lenders. Find the cheapest loan option in seconds." />
        <link rel="canonical" href="https://www.trygavel.com/tools/interest-rate-comparison" />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org', '@type': 'WebApplication',
          name: 'Interest Rate Comparison Tool', applicationCategory: 'FinanceApplication',
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
            { label: 'Interest Rate Comparison', path: '/tools/interest-rate-comparison' }
          ]} />

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
            <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 text-orange-700 dark:text-orange-400 text-sm mb-4 px-4 py-1.5 rounded-full backdrop-blur-sm">
              <TrendingDown className="w-4 h-4 text-blue-700 dark:text-blue-400" />
              <span className="text-sm font-medium text-blue-700 dark:text-blue-400">Rate Comparison Engine</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">Interest Rate Comparison</h1>
            <p className="text-lg text-muted-foreground max-w-2xl">Compare live loan offerings from premium lenders side by side. Tailor parameters based on your employment, CIBIL, and profile inputs.</p>
          </motion.div>

          <div className="grid lg:grid-cols-5 gap-8">
            {/* Left: Input parameter configurations */}
            <div className="lg:col-span-2 space-y-6">
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                className="glass-panel border-border shadow-2xl rounded-2xl p-6 space-y-6">

                {/* Loan Category */}
                <div>
                  <Label className="text-xs text-muted-foreground font-semibold mb-2 block">Loan Category</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'home' as const, label: 'Home Loan' },
                      { id: 'personal' as const, label: 'Personal' },
                      { id: 'car' as const, label: 'Car Loan' },
                    ].map(opt => (
                      <button key={opt.id} onClick={() => handleLoanTypeChange(opt.id)}
                        className={`py-2 text-xs font-semibold rounded-lg border transition-all ${loanType === opt.id ? 'bg-blue-600 border-blue-700 text-white': 'bg-white/5 border-white/10 text-muted-foreground hover:text-foreground'}`}>
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
                  <Slider value={[loanAmount]} min={loanType === 'home' ? 500000: 50000} max={loanType === 'home' ? 100000000: 2500000} step={loanType === 'home' ? 100000: 25000}
                    onValueChange={([v]) => setLoanAmount(v)} className="mb-2" />
                  <Input type="number" value={loanAmount} onChange={e => setLoanAmount(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-surface border-border text-foreground text-xs h-9" />
                </div>

                {/* Tenure */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-xs text-muted-foreground font-semibold">Loan Tenure</Label>
                    <span className="text-sm font-bold text-foreground">{tenureYrs} Years ({tenureMonths} months)</span>
                  </div>
                  <Slider value={[tenureYrs]} min={1} max={loanType === 'home' ? 30: 7} step={1}
                    onValueChange={([v]) => setTenureYrs(v)} className="mb-2" />
                </div>

                <h3 className="text-base font-bold text-foreground pt-3 pb-3 border-b border-border">Concession Modifiers</h3>

                {/* Gender */}
                <div>
                  <Label className="text-xs text-muted-foreground font-semibold mb-2 block">Gender concession</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {['male', 'female'].map(g => (
                      <button key={g} onClick={() => setGender(g as 'male' | 'female')}
                        className={`py-1.5 text-xs font-semibold rounded-lg border capitalize transition-all ${gender === g ? 'bg-blue-600 border-blue-700 text-white': 'bg-white/5 border-white/10 text-muted-foreground hover:text-foreground'}`}>
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Employment */}
                <div>
                  <Label className="text-xs text-muted-foreground font-semibold mb-2 block">Employment Class</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {['salaried', 'self-employed'].map(e => (
                      <button key={e} onClick={() => setEmployment(e as 'salaried' | 'self-employed')}
                        className={`py-1.5 text-xs font-semibold rounded-lg border capitalize transition-all ${employment === e ? 'bg-blue-600 border-blue-700 text-white': 'bg-white/5 border-white/10 text-muted-foreground hover:text-foreground'}`}>
                        {e.replace('-', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Credit Score */}
                <div>
                  <Label className="text-xs text-muted-foreground font-semibold mb-2 block">Credit Score Tier</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'excellent' as const, label: '750+' },
                      { id: 'good' as const, label: '700-749' },
                      { id: 'average' as const, label: '<700' },
                    ].map(opt => (
                      <button key={opt.id} onClick={() => setCreditTier(opt.id)}
                        className={`py-1.5 text-[10px] font-semibold rounded-lg border transition-all ${creditTier === opt.id ? 'bg-blue-600 border-blue-700 text-white': 'bg-white/5 border-white/10 text-muted-foreground hover:text-foreground'}`}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

              </motion.div>
            </div>

            {/* Right: Comparison Panel Output */}
            <div className="lg:col-span-3 space-y-6">

              {/* Savings callout panel */}
              {maxSavingsInterest > 0 && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  className="bg-gradient-to-r from-emerald-500/10 to-emerald-600/10 border border-emerald-500/20 rounded-2xl p-6 flex items-start gap-4">
                  <Sparkles className="w-6 h-6 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-foreground mb-1">Smart Borrowing Concessions Found</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      By prioritizing <strong className="text-emerald-700 dark:text-emerald-400">{bestDeal.name}</strong> over the high-end rate options, you save up to <strong className="text-foreground">{fmt(maxSavingsInterest)}</strong> in total interest payable over the loan life.
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Side-by-Side Lenders Cards */}
              <div className="space-y-4">
                {comparisonList.map((item, idx) => (
                  <div key={idx} className="glass-panel border-border shadow-2xl rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-blue-500/20 transition-all">

                    {/* Left details */}
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-surface flex items-center justify-center shrink-0">
                        <span className="text-lg font-black text-blue-700 dark:text-blue-400">{item.logoLetter}</span>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-foreground leading-snug">{item.name}</h4>
                        <p className="text-[10px] text-muted-foreground mt-1">Processing Fee: {item.processingFee}</p>
                      </div>
                    </div>

                    {/* Middle details: Rate and EMI Range */}
                    <div className="grid grid-cols-2 gap-6 md:text-right">
                      <div>
                        <span className="text-[10px] text-muted-foreground block uppercase tracking-wider mb-1">Interest Rate</span>
                        <span className="text-xs font-bold text-foreground">{item.minRate.toFixed(2)}% - {item.maxRate.toFixed(2)}%</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground block uppercase tracking-wider mb-1">EMI Range</span>
                        <span className="text-xs font-bold text-blue-700 dark:text-blue-400">{fmt(item.minEmi)} - {fmt(item.maxEmi)}/mo</span>
                      </div>
                    </div>

                    {/* Right details: Total Cost Range */}
                    <div className="md:text-right border-t md:border-t-0 pt-4 md:pt-0 border-border flex md:flex-col justify-between items-center">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">Est. Total Interest</span>
                      <span className="text-xs font-bold text-red-700 dark:text-red-400">{fmt(item.minInterest)}</span>
                    </div>

                  </div>
                ))}
              </div>

              {/* Action hook check */}
              <div className="bg-gradient-to-r from-orange-500/10 to-orange-600/10 border border-orange-500/20 rounded-2xl p-6">
                <h4 className="text-base font-bold text-foreground mb-2 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-orange-600 dark:text-orange-500" /> Apply For Pre-Approved Offers
                </h4>
                <p className="text-xs text-muted-foreground mb-4">Prime interest rate brackets depend heavily on your underwriting parameters. Check your pre-approval odds now.</p>
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
