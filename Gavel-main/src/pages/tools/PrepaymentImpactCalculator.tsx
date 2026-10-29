import React, { useState, useMemo } from 'react';
import { Breadcrumbs } from '../../components/Breadcrumbs';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { Calculator, ArrowRight, IndianRupee, Percent, ShieldCheck, ChevronDown, ChevronUp, Zap, Sparkles, HelpCircle, AlertTriangle, Clock, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const fmt = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const FAQS = [
  { q: 'What is loan prepayment?', a: 'Loan prepayment (or part-payment) is paying an extra amount towards your loan principal in addition to your regular EMIs. This directly reduces the outstanding principal balance, which in turn reduces your overall interest burden.' },
  { q: 'Should I choose to "Reduce Tenure" or "Reduce EMI"?', a: 'Choosing "Reduce Tenure" keeps your monthly EMI constant but shortens the loan term, leading to significantly higher total interest savings. "Reduce EMI" keeps the loan term same but lowers your monthly installment, freeing up monthly cash flow.' },
  { q: 'Are there prepayment charges in India?', a: 'As per RBI guidelines, banks cannot charge foreclosure or prepayment penalties on floating-rate home loans, personal loans, or auto loans. However, fixed-rate loans may incur a prepayment fee of 2% to 4%.' },
  { q: 'When is the best time to make a prepayment?', a: 'Prepayment is most effective during the early stages of your loan tenure. Since the outstanding principal is high early on, the interest component is large. Paying down principal early maximizes compound interest savings.' },
  { q: 'Can I make recurring prepayments?', a: 'Yes. Many borrowers make a recurring annual prepayment (e.g., using a year-end bonus equivalent to 1 or 2 extra EMIs) which dramatically cuts down a 20-year loan to 13-14 years.' }
];

export default function PrepaymentImpactCalculator() {
  const navigate = useNavigate();

  // Inputs
  const [loanAmount, setLoanAmount] = useState(3000000); // Original Loan
  const [interestRate, setInterestRate] = useState(8.5); // Rate
  const [tenureYrs, setTenureYrs] = useState(20); // Tenure
  const [emisPaid, setEmisPaid] = useState(24); // EMIs paid so far (months)
  const [prepaymentAmount, setPrepaymentAmount] = useState(200000); // Prepayment lump sum
  const [prepaymentMonth, setPrepaymentMonth] = useState(25); // Month of prepayment
  const [strategy, setStrategy] = useState<'tenure' | 'emi'>('tenure'); // Strategy

  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  const tenureMonths = tenureYrs * 12;

  // Sync prepayment month when EMIs paid changes
  const handleEmisPaidChange = (val: number) => {
    setEmisPaid(val);
    setPrepaymentMonth(val + 1);
  };

  // Calculations
  const analysis = useMemo(() => {
    const r = interestRate / 12 / 100;
    const n = tenureMonths;

    if (loanAmount <= 0 || r <= 0 || n <= 0) {
      return {
        baselineEmi: 0,
        baselineTotalInterest: 0,
        baselineTotalPayment: 0,
        newTenureMonths: 0,
        newTotalInterest: 0,
        newTotalPayment: 0,
        interestSaved: 0,
        monthsSaved: 0,
        adjustedEmi: 0,
      };
    }

    // 1. Calculate Baseline EMI & Amortization
    const factor = Math.pow(1 + r, n);
    const baselineEmi = Math.round(loanAmount * r * factor / (factor - 1));
    const baselineTotalPayment = baselineEmi * n;
    const baselineTotalInterest = baselineTotalPayment - loanAmount;

    // 2. Build Amortization WITH Prepayment
    let balance = loanAmount;
    const baselineTotalInterestPaid = 0;
    let actualInterestPaid = 0;
    let monthCount = 0;
    let adjustedEmi = baselineEmi;

    // We track month-by-month
    for (let m = 1; m <= 600; m++) {
      if (balance <= 0) break;
      monthCount++;

      // Calculate monthly interest component
      const interestPart = balance * r;
      actualInterestPaid += interestPart;

      let principalPart = adjustedEmi - interestPart;

      // Check if we hit prepayment month
      if (m === prepaymentMonth) {
        principalPart += prepaymentAmount;
      }

      if (balance - principalPart <= 0) {
        // Last payment
        balance = 0;
      } else {
        balance -= principalPart;
      }

      // If strategy is "Reduce EMI" and we made the prepayment, recalculate the EMI
      if (m === prepaymentMonth && strategy === 'emi' && balance > 0) {
        const remainingMonths = n - m;
        if (remainingMonths > 0) {
          const newFactor = Math.pow(1 + r, remainingMonths);
          adjustedEmi = Math.round(balance * r * newFactor / (newFactor - 1));
        }
      }
    }

    const newTotalPayment = (baselineEmi * Math.min(prepaymentMonth - 1, monthCount)) +
                           (prepaymentMonth <= monthCount ? adjustedEmi * (monthCount - prepaymentMonth + 1) : 0) +
                           (prepaymentMonth <= monthCount ? prepaymentAmount : 0);
                           
    const newTotalInterest = Math.max(0, newTotalPayment - loanAmount);
    const interestSaved = Math.max(0, baselineTotalInterest - newTotalInterest);
    const monthsSaved = Math.max(0, n - monthCount);

    return {
      baselineEmi,
      baselineTotalInterest,
      baselineTotalPayment,
      newTenureMonths: monthCount,
      newTotalInterest,
      newTotalPayment,
      interestSaved,
      monthsSaved,
      adjustedEmi,
    };
  }, [loanAmount, interestRate, tenureMonths, emisPaid, prepaymentAmount, prepaymentMonth, strategy]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-orange-500/30 overflow-x-hidden">
      <Helmet>
        <title>Loan Prepayment Impact Calculator | Gavel AI</title>
        <meta name="description" content="Calculate interest savings and tenure reduction by making lump-sum or part prepayments on your home, personal, or car loans." />
        <link rel="canonical" href="https://www.trygavel.com/tools/prepayment-impact-calculator" />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org', '@type': 'WebApplication',
          name: 'Loan Prepayment Impact Calculator', applicationCategory: 'FinanceApplication',
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
            { label: 'Prepayment Impact Calculator', path: '/tools/prepayment-impact-calculator' }
          ]} />

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
            <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 text-orange-700 dark:text-orange-400 text-sm mb-4 px-4 py-1.5 rounded-full backdrop-blur-sm">
              <Calculator className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
              <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Prepayment Engine</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">Loan Prepayment Impact Calculator</h1>
            <p className="text-lg text-muted-foreground max-w-2xl">Calculate how making a part-payment reduces your loan burden. Compare tenure reduction savings against EMI relief configurations.</p>
          </motion.div>

          <div className="grid lg:grid-cols-5 gap-8">
            {/* Left: Input sliders */}
            <div className="lg:col-span-2 space-y-6">
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                className="glass-panel border-border shadow-2xl rounded-2xl p-6 space-y-6">
                
                <h3 className="text-base font-bold text-foreground pb-3 border-b border-border">Base Loan Details</h3>

                {/* Original Loan Amount */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-xs text-muted-foreground font-semibold">Original Loan Amount</Label>
                    <span className="text-sm font-bold text-foreground">{fmt(loanAmount)}</span>
                  </div>
                  <Slider value={[loanAmount]} min={100000} max={100000000} step={100000}
                    onValueChange={([v]) => setLoanAmount(v)} className="mb-2" />
                  <Input type="number" value={loanAmount} onChange={e => setLoanAmount(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-surface border-border text-foreground text-xs h-9" />
                </div>

                {/* Interest Rate */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-xs text-muted-foreground font-semibold">Annual Interest Rate (p.a.)</Label>
                    <span className="text-sm font-bold text-foreground">{interestRate}%</span>
                  </div>
                  <Slider value={[interestRate]} min={5} max={25} step={0.1}
                    onValueChange={([v]) => setInterestRate(v)} className="mb-2" />
                </div>

                {/* Tenure */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-xs text-muted-foreground font-semibold">Original Tenure (Years)</Label>
                    <span className="text-sm font-bold text-foreground">{tenureYrs} Years ({tenureMonths} months)</span>
                  </div>
                  <Slider value={[tenureYrs]} min={1} max={30} step={1}
                    onValueChange={([v]) => setTenureYrs(v)} className="mb-2" />
                </div>

                <h3 className="text-base font-bold text-foreground pt-3 pb-3 border-b border-border">Prepayment Configuration</h3>

                {/* EMIs Paid */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-xs text-muted-foreground font-semibold">EMIs Paid So Far (Months)</Label>
                    <span className="text-sm font-bold text-foreground">{emisPaid} Months</span>
                  </div>
                  <Slider value={[emisPaid]} min={0} max={tenureMonths - 2} step={1}
                    onValueChange={([v]) => handleEmisPaidChange(v)} className="mb-2" />
                </div>

                {/* Prepayment Amount */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-xs text-muted-foreground font-semibold">Prepayment Part-Payment Amount</Label>
                    <span className="text-sm font-bold text-green-700 dark:text-green-400">{fmt(prepaymentAmount)}</span>
                  </div>
                  <Slider value={[prepaymentAmount]} min={5000} max={Math.min(loanAmount, 5000000)} step={5000}
                    onValueChange={([v]) => setPrepaymentAmount(v)} className="mb-2" />
                  <Input type="number" value={prepaymentAmount} onChange={e => setPrepaymentAmount(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-surface border-border text-foreground text-xs h-9" />
                </div>

                {/* Prepayment Strategy */}
                <div>
                  <Label className="text-xs text-muted-foreground font-semibold mb-2 block">Prepayment Impact Strategy</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'tenure' as const, label: 'Reduce Tenure (Save Max Interest)' },
                      { id: 'emi' as const, label: 'Reduce EMI (Lower Monthly Bill)' },
                    ].map(opt => (
                      <button key={opt.id} onClick={() => setStrategy(opt.id)}
                        className={`py-2 text-[10px] font-semibold rounded-lg border transition-all ${strategy === opt.id ? 'bg-emerald-600 border-emerald-700 text-white' : 'bg-white/5 border-white/10 text-muted-foreground hover:text-foreground'}`}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

              </motion.div>
            </div>

            {/* Right: Results Analysis */}
            <div className="lg:col-span-3 space-y-6">
              
              {/* Saving Metrics Card */}
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                className="bg-gradient-to-br from-orange-500/15 via-orange-500/5 to-transparent border border-orange-500/30 shadow-2xl rounded-2xl p-8 relative overflow-hidden">
                <div className="absolute top-4 right-4 bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs px-2.5 py-1 rounded-full flex items-center gap-1 font-semibold border border-emerald-500/30">
                  <ShieldCheck className="w-3.5 h-3.5" /> High Trust Rules
                </div>

                <div className="text-center mb-6">
                  <p className="text-sm text-muted-foreground mb-2">Estimated Total Interest Saved</p>
                  <motion.div key={analysis.interestSaved} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    className="text-5xl md:text-6xl font-black text-foreground tracking-tight">
                    {fmt(analysis.interestSaved)}
                  </motion.div>
                  <p className="text-xs text-muted-foreground mt-2">By making a prepayment of {fmt(prepaymentAmount)} at Month {prepaymentMonth}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                  <div className="bg-surface p-4 rounded-xl">
                    <p className="text-xs text-muted-foreground mb-1">Tenure Saved</p>
                    <p className="text-lg font-bold text-foreground">
                      {strategy === 'tenure' 
                        ? `${Math.floor(analysis.monthsSaved / 12)} Yrs ${analysis.monthsSaved % 12} Mo`
                        : '0 Months (EMI reduced instead)'}
                    </p>
                  </div>
                  <div className="bg-surface p-4 rounded-xl">
                    <p className="text-xs text-muted-foreground mb-1">New Monthly EMI</p>
                    <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">{fmt(analysis.adjustedEmi)}</p>
                  </div>
                </div>
              </motion.div>

              {/* Side by side stats */}
              <div className="glass-panel border-border shadow-2xl rounded-2xl p-6 space-y-4">
                <h3 className="text-sm font-bold text-foreground">Baseline vs Adjusted Comparison</h3>
                
                <div className="grid md:grid-cols-2 gap-4 text-xs">
                  <div className="bg-surface p-4 rounded-xl space-y-2.5">
                    <p className="font-semibold text-muted-foreground pb-1 border-b border-border">Without Prepayment (Baseline)</p>
                    <div className="flex justify-between">
                      <span>EMI:</span>
                      <span className="font-bold text-foreground">{fmt(analysis.baselineEmi)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Interest:</span>
                      <span className="font-bold text-red-700 dark:text-red-400">{fmt(analysis.baselineTotalInterest)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tenure:</span>
                      <span className="font-bold text-foreground">{tenureYrs} Years ({tenureMonths} months)</span>
                    </div>
                  </div>

                  <div className="bg-emerald-500/5 p-4 rounded-xl border border-emerald-500/10 space-y-2.5">
                    <p className="font-semibold text-emerald-700 dark:text-emerald-400 pb-1 border-b border-emerald-500/10">With Prepayment (Optimized)</p>
                    <div className="flex justify-between">
                      <span>EMI:</span>
                      <span className="font-bold text-foreground">{fmt(analysis.adjustedEmi)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Interest:</span>
                      <span className="font-bold text-green-700 dark:text-green-400">{fmt(analysis.newTotalInterest)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tenure:</span>
                      <span className="font-bold text-foreground">
                        {Math.floor(analysis.newTenureMonths / 12)} Yrs {analysis.newTenureMonths % 12} Mo
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Prepayment strategy tips */}
              <div className="bg-surface border border-border rounded-2xl p-6 space-y-4">
                <h4 className="text-sm font-bold text-foreground">Prepayment Optimization Tips</h4>
                <div className="grid md:grid-cols-2 gap-4 text-xs text-muted-foreground">
                  <div className="bg-surface p-4 rounded-xl border border-border">
                    <p className="font-semibold text-foreground mb-1">Make Small Regular Prepayments</p>
                    <p className="leading-relaxed">Paying just 1 extra EMI every year can shave off 3-4 years from a long-term home loan tenure.</p>
                  </div>
                  <div className="bg-surface p-4 rounded-xl border border-border">
                    <p className="font-semibold text-foreground mb-1">Keep track of floating-rate cycles</p>
                    <p className="leading-relaxed">When interest rates rise, tenure increases automatically. Prepaying early keeps tenure within healthy bounds.</p>
                  </div>
                </div>
              </div>

              {/* Predictor link */}
              <div className="bg-gradient-to-r from-orange-500/10 to-orange-600/10 border border-orange-500/20 rounded-2xl p-6">
                <h4 className="text-base font-bold text-foreground mb-2 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-orange-600 dark:text-orange-500" /> Apply For Pre-Approvals
                </h4>
                <p className="text-xs text-muted-foreground mb-4">Evaluate loan structures against bank risk rules. Predict your retail loan pre-approval odds now.</p>
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
                  <button onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                    className="w-full flex items-center justify-between p-5 text-left gap-4">
                    <span className="text-base font-semibold text-foreground">{faq.q}</span>
                    {faqOpen === i ? <ChevronUp className="w-5 h-5 text-orange-600 dark:text-orange-500 shrink-0" /> : <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0" />}
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
