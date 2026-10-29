import React, { useState, useMemo } from 'react';
import { Breadcrumbs } from '../../components/Breadcrumbs';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { Calculator, ArrowRight, IndianRupee, Percent, ShieldCheck, ChevronDown, ChevronUp, Zap, Sparkles, HelpCircle, GraduationCap, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const fmt = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const FAQS = [
  { q: 'What is the moratorium period in an education loan?', a: 'The moratorium period (or repayment holiday) is the duration of your course plus a grace period (typically 6 months to 1 year) during which you are not required to pay regular EMIs. However, interest does accrue during this time.' },
  { q: 'What is interest capitalization during the moratorium?', a: 'If you choose not to pay interest during your course (Moratorium Holiday), the accumulated interest accrued during this period is added to your original loan principal when EMI repayments start. This increases your principal and consequently your EMI size.' },
  { q: 'Is it better to pay interest during the course duration?', a: 'Yes. Paying simple interest monthly during the moratorium prevents interest capitalization. This keeps your starting loan principal lower and saves a significant amount of money in total interest outflow.' },
  { q: 'Do education loans qualify for income tax benefits?', a: 'Yes. Under Section 80E of the Income Tax Act, the interest paid on an education loan for higher studies (for yourself, spouse, or children) is fully tax-deductible for up to 8 consecutive years, with no upper limit on the deduction.' },
  { q: 'What is the maximum tenure for education loan repayment?', a: 'In India, lenders offer education loan repayment tenures ranging from 5 to 15 years. The repayment period starts immediately after the moratorium period ends.' }
];

export default function EducationLoanCalculator() {
  const navigate = useNavigate();

  // Inputs
  const [loanAmount, setLoanAmount] = useState(2000000); // 20 Lakhs
  const [interestRate, setInterestRate] = useState(9.5); // Education rate
  const [courseYrs, setCourseYrs] = useState(4); // 4 years course
  const [graceMonths, setGraceMonths] = useState(6); // 6 months grace
  const [repaymentYrs, setRepaymentYrs] = useState(10); // 10 years repayment
  const [moratoriumPaymentType, setMoratoriumPaymentType] = useState<'pay-simple' | 'holiday'>('holiday');

  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  const moratoriumMonths = (courseYrs * 12) + graceMonths;
  const repaymentMonths = repaymentYrs * 12;

  // Calculations
  const analysis = useMemo(() => {
    const r = interestRate / 12 / 100;

    let moratoriumInterestPaid = 0;
    let repaymentPrincipal = loanAmount;

    // Standard simple interest accrued during moratorium:
    // P * R * T (T in years)
    const totalMoratoriumInterestAccrued = Math.round(loanAmount * (interestRate / 100) * (moratoriumMonths / 12));

    if (moratoriumPaymentType === 'pay-simple') {
      // User pays interest monthly during moratorium
      moratoriumInterestPaid = totalMoratoriumInterestAccrued;
      repaymentPrincipal = loanAmount; // principal remains same
    } else {
      // Interest capitalization (holiday)
      moratoriumInterestPaid = 0;
      repaymentPrincipal = loanAmount + totalMoratoriumInterestAccrued; // principal balloons
    }

    // Post-moratorium EMI
    let emi = 0;
    if (repaymentPrincipal > 0 && r > 0 && repaymentMonths > 0) {
      const factor = Math.pow(1 + r, repaymentMonths);
      emi = Math.round(repaymentPrincipal * r * factor / (factor - 1));
    }

    const postMoratoriumPayment = emi * repaymentMonths;
    const totalRepayment = postMoratoriumPayment + moratoriumInterestPaid;
    const totalInterest = Math.max(0, totalRepayment - loanAmount);

    return {
      moratoriumMonths,
      totalMoratoriumInterestAccrued,
      repaymentPrincipal,
      emi,
      totalRepayment,
      totalInterest,
      moratoriumInterestPaid,
    };
  }, [loanAmount, interestRate, moratoriumMonths, repaymentMonths, moratoriumPaymentType]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-orange-500/30 overflow-x-hidden">
      <Helmet>
        <title>Education Loan Calculator: Study Abroad Repayments | Gavel AI</title>
        <meta name="description" content="Calculate education loan repayments, moratorium period interest capitalization, and monthly EMIs for domestic or study abroad courses." />
        <link rel="canonical" href="https://www.trygavel.com/tools/education-loan-calculator" />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org', '@type': 'WebApplication',
          name: 'Education Loan Calculator', applicationCategory: 'FinanceApplication',
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
            { label: 'Education Loan Calculator', path: '/tools/education-loan-calculator' }
          ]} />

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
            <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 text-orange-700 dark:text-orange-400 text-sm mb-4 px-4 py-1.5 rounded-full backdrop-blur-sm">
              <GraduationCap className="w-4 h-4 text-blue-700 dark:text-blue-400" />
              <span className="text-sm font-medium text-blue-700 dark:text-blue-400">Study Abroad Finance Tool</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">Education Loan Calculator</h1>
            <p className="text-lg text-muted-foreground max-w-2xl">Plan your academic funding with confidence. Model moratorium options, capitalized interest accruals, and post-graduation monthly payments.</p>
          </motion.div>

          <div className="grid lg:grid-cols-5 gap-8">
            {/* Left: Input sliders */}
            <div className="lg:col-span-2 space-y-6">
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                className="glass-panel border-border shadow-2xl rounded-2xl p-6 space-y-6">

                <h3 className="text-base font-bold text-foreground pb-3 border-b border-border">Academic Funding</h3>

                {/* Loan Amount */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-xs text-muted-foreground font-semibold">Tuition & Living Costs (Loan Amount)</Label>
                    <span className="text-sm font-bold text-foreground">{fmt(loanAmount)}</span>
                  </div>
                  <Slider value={[loanAmount]} min={100000} max={15000000} step={50000}
                    onValueChange={([v]) => setLoanAmount(v)} className="mb-2" />
                  <Input type="number" value={loanAmount} onChange={e => setLoanAmount(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-surface border-border text-foreground text-xs h-9" />
                </div>

                {/* Interest Rate */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-xs text-muted-foreground font-semibold">Interest Rate (p.a.)</Label>
                    <span className="text-sm font-bold text-foreground">{interestRate}%</span>
                  </div>
                  <Slider value={[interestRate]} min={6} max={18} step={0.1}
                    onValueChange={([v]) => setInterestRate(v)} className="mb-2" />
                </div>

                {/* Course Duration */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-xs text-muted-foreground font-semibold">Course Duration (Years)</Label>
                    <span className="text-sm font-bold text-foreground">{courseYrs} Years</span>
                  </div>
                  <Slider value={[courseYrs]} min={1} max={5} step={1}
                    onValueChange={([v]) => setCourseYrs(v)} className="mb-2" />
                </div>

                {/* Grace Period */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-xs text-muted-foreground font-semibold">Grace Period (Months)</Label>
                    <span className="text-sm font-bold text-foreground">{graceMonths} Months</span>
                  </div>
                  <Slider value={[graceMonths]} min={0} max={12} step={1}
                    onValueChange={([v]) => setGraceMonths(v)} className="mb-2" />
                </div>

                {/* Moratorium payment strategy */}
                <div>
                  <Label className="text-xs text-muted-foreground font-semibold mb-2 block">Moratorium Payment Strategy</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'pay-simple' as const, label: 'Pay Monthly Simple Interest' },
                      { id: 'holiday' as const, label: 'Moratorium Holiday (Defer All)' },
                    ].map(opt => (
                      <button key={opt.id} onClick={() => setMoratoriumPaymentType(opt.id)}
                        className={`py-2 text-[10px] font-semibold rounded-lg border transition-all ${moratoriumPaymentType === opt.id ? 'bg-blue-600 border-blue-700 text-white': 'bg-white/5 border-white/10 text-muted-foreground hover:text-foreground'}`}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Repayment Tenure */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-xs text-muted-foreground font-semibold">Repayment Tenure (Post-Graduation)</Label>
                    <span className="text-sm font-bold text-foreground">{repaymentYrs} Years ({repaymentMonths} months)</span>
                  </div>
                  <Slider value={[repaymentYrs]} min={3} max={15} step={1}
                    onValueChange={([v]) => setRepaymentYrs(v)} className="mb-2" />
                </div>

              </motion.div>
            </div>

            {/* Right: Results Panel Output */}
            <div className="lg:col-span-3 space-y-6">

              {/* EMI display card */}
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                className="bg-gradient-to-br from-orange-500/15 via-orange-500/5 to-transparent border border-orange-500/30 shadow-2xl rounded-2xl p-8 relative overflow-hidden">
                <div className="absolute top-4 right-4 bg-blue-500/20 text-blue-700 dark:text-blue-400 text-xs px-2.5 py-1 rounded-full flex items-center gap-1 font-semibold border border-blue-500/30">
                  <ShieldCheck className="w-3.5 h-3.5" /> High Trust Rules
                </div>

                <div className="text-center mb-6">
                  <p className="text-sm text-muted-foreground mb-2">Post-Moratorium Monthly EMI</p>
                  <motion.div key={analysis.emi} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    className="text-5xl md:text-6xl font-black text-foreground tracking-tight">
                    {fmt(analysis.emi)}
                  </motion.div>
                  <p className="text-xs text-muted-foreground mt-2">Repayment starts after {moratoriumMonths} months of course + grace period</p>
                </div>

                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border text-center">
                  <div className="bg-surface p-3 rounded-xl">
                    <p className="text-[10px] text-muted-foreground mb-1">Starting Principal</p>
                    <p className="text-sm font-bold text-foreground">{fmt(analysis.repaymentPrincipal)}</p>
                  </div>
                  <div className="bg-surface p-3 rounded-xl">
                    <p className="text-[10px] text-muted-foreground mb-1">Interest Accrued</p>
                    <p className="text-sm font-bold text-red-700 dark:text-red-400">{fmt(analysis.totalInterest)}</p>
                  </div>
                  <div className="bg-surface p-3 rounded-xl">
                    <p className="text-[10px] text-muted-foreground mb-1">Total Repayment</p>
                    <p className="text-sm font-bold text-blue-700 dark:text-blue-400">{fmt(analysis.totalRepayment)}</p>
                  </div>
                </div>
              </motion.div>

              {/* Moratorium breakdown analysis */}
              <div className="glass-panel border-border shadow-2xl rounded-2xl p-6 space-y-4">
                <h3 className="text-sm font-bold text-foreground">Moratorium Phase Details</h3>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between p-4 bg-surface rounded-xl">
                    <div>
                      <p className="font-semibold text-foreground">Total Moratorium Duration</p>
                      <p className="text-[10px] text-muted-foreground mt-1">Course length + grace period holiday.</p>
                    </div>
                    <span className="font-bold text-foreground">{moratoriumMonths} Months</span>
                  </div>

                  <div className="flex justify-between p-4 bg-surface rounded-xl">
                    <div>
                      <p className="font-semibold text-foreground">Interest Paid During Course</p>
                      <p className="text-[10px] text-muted-foreground mt-1">Avoids interest capitalization on principal.</p>
                    </div>
                    <span className="font-bold text-green-700 dark:text-green-400">{fmt(analysis.moratoriumInterestPaid)}</span>
                  </div>

                  <div className="flex justify-between p-4 bg-surface rounded-xl">
                    <div>
                      <p className="font-semibold text-foreground">Moratorium Interest Capitalized</p>
                      <p className="text-[10px] text-muted-foreground mt-1">Added to principal at graduation if deferred.</p>
                    </div>
                    <span className="font-bold text-red-700 dark:text-red-400">
                      {moratoriumPaymentType === 'holiday' ? fmt(analysis.totalMoratoriumInterestAccrued): fmt(0)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tax savings section */}
              <div className="glass-panel border-border shadow-2xl rounded-2xl p-6 space-y-3">
                <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                  <Sparkles className="w-4.5 h-4.5 text-blue-700 dark:text-blue-400" /> Section 80E Tax Concessions
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Under Indian Tax law Section 80E, interest paid on study loans can be claimed as a deduction from your taxable income. There is no maximum limit capping this deduction for 8 consecutive years.
                </p>
              </div>

              {/* Predictor link */}
              <div className="bg-gradient-to-r from-orange-500/10 to-orange-600/10 border border-orange-500/20 rounded-2xl p-6">
                <h4 className="text-base font-bold text-foreground mb-2 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-orange-600 dark:text-orange-500" /> Predict Bank Pre-Approvals
                </h4>
                <p className="text-xs text-muted-foreground mb-4">Lenders check co-applicant salaries, country categories, and university rankings for education approvals. Predict odds instantly.</p>
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
