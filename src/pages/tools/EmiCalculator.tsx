import React, { useState, useMemo } from 'react';
import { Breadcrumbs } from '../../components/Breadcrumbs';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { Calculator, ArrowRight, IndianRupee, Percent, Clock, TrendingDown, ChevronDown, ChevronUp, Zap, BarChart3, PieChart, Table2, Info, CheckCircle2 } from 'lucide-react';
import { trackCalculatorUsage } from '../../utils/analytics';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// EMI Formula: P × r × (1+r)^n / ((1+r)^n - 1)
function calcEmi(principal: number, annualRate: number, months: number) {
  if (principal <= 0 || annualRate <= 0 || months <= 0) return { emi: 0, totalInterest: 0, totalPayment: 0 };
  const r = annualRate / 12 / 100;
  const factor = Math.pow(1 + r, months);
  const emi = Math.round(principal * r * factor / (factor - 1));
  const totalPayment = emi * months;
  const totalInterest = totalPayment - principal;
  return { emi, totalInterest, totalPayment };
}

function buildSchedule(principal: number, annualRate: number, months: number) {
  const r = annualRate / 12 / 100;
  const { emi } = calcEmi(principal, annualRate, months);
  if (emi <= 0) return [];
  let balance = principal;
  const rows: { month: number; emi: number; principalPart: number; interestPart: number; balance: number }[] = [];
  for (let m = 1; m <= months; m++) {
    const interestPart = Math.round(balance * r);
    const principalPart = emi - interestPart;
    balance = Math.max(0, balance - principalPart);
    rows.push({ month: m, emi, principalPart, interestPart, balance });
  }
  return rows;
}

const fmt = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
const fmtNum = (n: number) => new Intl.NumberFormat('en-IN').format(n);

const PRESETS = [
  { label: '₹1L / 1yr', principal: 100000, rate: 12, tenure: 12 },
  { label: '₹3L / 3yr', principal: 300000, rate: 11.5, tenure: 36 },
  { label: '₹5L / 5yr', principal: 500000, rate: 11, tenure: 60 },
  { label: '₹10L / 5yr', principal: 1000000, rate: 10.5, tenure: 60 },
  { label: '₹20L / 7yr', principal: 2000000, rate: 10, tenure: 84 },
];

const RATE_BENCHMARKS = [
  { lender: 'SBI', rate: '11.00 - 14.00%' },
  { lender: 'HDFC Bank', rate: '10.50 - 15.00%' },
  { lender: 'ICICI Bank', rate: '10.75 - 16.00%' },
  { lender: 'Bajaj Finserv', rate: '11.00 - 16.00%' },
  { lender: 'Kotak Mahindra', rate: '10.99 - 16.00%' },
  { lender: 'Tata Capital', rate: '11.00 - 16.50%' },
];

const FAQS = [
  { q: 'How is EMI calculated?', a: 'EMI = P × r × (1+r)^n / ((1+r)^n - 1), where P is loan amount, r is monthly interest rate (annual rate / 12 / 100), and n is tenure in months.' },
  { q: 'What is a good EMI to salary ratio?', a: 'Banks recommend keeping total EMIs (including the new one) below 40-50% of your net monthly salary. This is called the FOIR (Fixed Obligation to Income Ratio).' },
  { q: 'Does prepayment reduce EMI or tenure?', a: 'You can choose either. Reducing tenure saves more on total interest, while reducing EMI lowers your monthly burden. Most advisors recommend reducing tenure.' },
  { q: 'Is there a penalty for prepaying personal loans?', a: 'RBI has banned prepayment penalties on floating-rate loans. For fixed-rate personal loans, banks may charge 2-4% of the outstanding amount.' },
  { q: 'What happens if I miss an EMI payment?', a: 'You will be charged a late fee (typically ₹500-1000 + GST), and it will be reported to CIBIL, potentially dropping your score by 30-50 points.' },
];

const EmiCalculator = () => {
  const navigate = useNavigate();
  const [principal, setPrincipal] = useState(500000);
  const [rate, setRate] = useState(12);
  const [tenure, setTenure] = useState(60);
  const [showSchedule, setShowSchedule] = useState(false);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const [activeView, setActiveView] = useState<'summary' | 'schedule' | 'rates'>('summary');

  const result = useMemo(() => calcEmi(principal, rate, tenure), [principal, rate, tenure]);
  const schedule = useMemo(() => showSchedule || activeView === 'schedule' ? buildSchedule(principal, rate, tenure): [], [principal, rate, tenure, showSchedule, activeView]);

  // Debounced calculator telemetry to prevent spam on slide drag
  React.useEffect(() => {
    const timer = setTimeout(() => {
      trackCalculatorUsage('emi_calculator', `principal_${principal}_rate_${rate}_tenure_${tenure}`);
    }, 1500);
    return () => clearTimeout(timer);
  }, [principal, rate, tenure]);

  // Yearly summary from schedule
  const yearlySummary = useMemo(() => {
    if (schedule.length === 0) return [];
    const years: { year: number; totalPrincipal: number; totalInterest: number; closingBalance: number }[] = [];
    for (let y = 0; y < Math.ceil(tenure / 12); y++) {
      const start = y * 12;
      const end = Math.min(start + 12, schedule.length);
      const slice = schedule.slice(start, end);
      years.push({
        year: y + 1,
        totalPrincipal: slice.reduce((s, r) => s + r.principalPart, 0),
        totalInterest: slice.reduce((s, r) => s + r.interestPart, 0),
        closingBalance: slice[slice.length - 1]?.balance || 0,
      });
    }
    return years;
  }, [schedule, tenure]);

  const principalPercent = result.totalPayment > 0 ? Math.round((principal / result.totalPayment) * 100): 0;
  const interestPercent = 100 - principalPercent;

  const applyPreset = (p: typeof PRESETS[0]) => {
    setPrincipal(p.principal);
    setRate(p.rate);
    setTenure(p.tenure);
  };

  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org', '@type': 'WebApplication',
    name: 'Personal Loan EMI Calculator', applicationCategory: 'FinanceApplication',
    operatingSystem: 'All', offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
    publisher: { '@type': 'Organization', name: 'Gavel AI' },
  });

  const faqSchema = JSON.stringify({
    '@context': 'https://schema.org', '@type': 'FAQPage',
    mainEntity: FAQS.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  });

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-orange-500/30 overflow-x-hidden">
      <Helmet>
        <title>Personal Loan EMI Calculator: Check Monthly EMIs &amp; Instant Eligibility | Gavel AI</title>
        <meta name="description" content="Calculate your personal loan monthly EMI and see your bank eligibility instantly. Adjust loan amount &amp; tenure to get the best interest rates from 40+ lenders." />
        <link rel="canonical" href="https://www.trygavel.com/tools/emi-calculator" />
        <script type="application/ld+json">{jsonLd}</script>
        <script type="application/ld+json">{faqSchema}</script>
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
            { label: 'EMI Calculator', path: '/tools/emi-calculator' }
          ]} />

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
            <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 text-orange-700 dark:text-orange-400 text-sm mb-4 px-4 py-1.5 rounded-full backdrop-blur-sm">
              <Calculator className="w-4 h-4 text-orange-700 dark:text-orange-400" />
              <span className="text-sm font-medium text-orange-700 dark:text-orange-400">Free Tool</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">Personal Loan EMI Calculator</h1>
            <p className="text-lg text-muted-foreground max-w-2xl">Calculate your exact monthly EMI, total interest payable, and view the complete amortization breakdown, all in real time.</p>
          </motion.div>

          {/* Quick Presets */}
          <div className="flex flex-wrap gap-2 mb-8">
            {PRESETS.map((p, i) => (
              <button key={i} onClick={() => applyPreset(p)}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-surface border border-border text-muted-foreground hover:border-orange-500/30 hover:text-foreground transition-all">
                {p.label}
              </button>
            ))}
          </div>

          <div className="grid lg:grid-cols-5 gap-8">
            {/* Left: Inputs */}
            <div className="lg:col-span-2 space-y-8">
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                className="glass-panel border-border shadow-2xl rounded-2xl p-6 space-y-8">

                {/* Loan Amount */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5">
                      <IndianRupee className="w-4 h-4 text-orange-600 dark:text-orange-500" /> Loan Amount
                    </Label>
                    <span className="text-lg font-bold text-foreground">{fmt(principal)}</span>
                  </div>
                  <Slider value={[principal]} min={25000} max={10000000} step={25000}
                    onValueChange={([v]) => setPrincipal(v)} className="mb-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>₹25K</span><span>₹1Cr</span>
                  </div>
                </div>

                {/* Interest Rate */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5">
                      <Percent className="w-4 h-4 text-green-600 dark:text-green-500" /> Interest Rate (p.a.)
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input type="number" value={rate} onChange={e => setRate(Math.min(36, Math.max(1, parseFloat(e.target.value) || 0)))}
                        className="w-20 h-8 text-right bg-surface border-border text-foreground text-sm" step={0.25} />
                      <span className="text-sm text-muted-foreground">%</span>
                    </div>
                  </div>
                  <Slider value={[rate]} min={5} max={36} step={0.25}
                    onValueChange={([v]) => setRate(v)} className="mb-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>5%</span><span>36%</span>
                  </div>
                </div>

                {/* Tenure */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-blue-600 dark:text-blue-500" /> Tenure
                    </Label>
                    <span className="text-lg font-bold text-foreground">{tenure} months <span className="text-sm text-muted-foreground">({(tenure/12).toFixed(1)} yrs)</span></span>
                  </div>
                  <Slider value={[tenure]} min={3} max={84} step={1}
                    onValueChange={([v]) => setTenure(v)} className="mb-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>3 mo</span><span>84 mo (7 yrs)</span>
                  </div>
                </div>
              </motion.div>

              {/* Salary Check */}
              <div className="bg-orange-500/5 border border-orange-500/20 rounded-2xl p-5">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-orange-600 dark:text-orange-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-foreground mb-1">Can you afford this EMI?</p>
                    <p className="text-xs text-muted-foreground mb-3">Banks reject if EMI exceeds 50% of salary. For {fmt(result.emi)}/mo EMI, you need minimum <strong className="text-orange-700 dark:text-orange-400">{fmt(result.emi * 2)}/mo salary</strong>.</p>
                    <Button size="sm" variant="outline" onClick={() => navigate('/loan-approval-predictor')}
                      className="border-orange-500/30 text-orange-700 dark:text-orange-400 hover:bg-orange-500/10 text-xs">
                      Check Approval Odds <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Results */}
            <div className="lg:col-span-3 space-y-6">
              {/* EMI Result Card */}
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                className="bg-gradient-to-br from-orange-500/15 via-orange-500/5 to-transparent border border-orange-500/30 shadow-2xl rounded-2xl p-8">
                <div className="text-center mb-6">
                  <p className="text-sm text-muted-foreground mb-2">Your Monthly EMI</p>
                  <motion.div key={result.emi} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    className="text-5xl md:text-6xl font-black text-foreground tracking-tight">
                    {fmt(result.emi)}
                  </motion.div>
                  <p className="text-sm text-muted-foreground mt-2">per month for {tenure} months</p>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 bg-surface rounded-xl">
                    <p className="text-xs text-muted-foreground mb-1">Principal</p>
                    <p className="text-lg font-bold text-foreground">{fmt(principal)}</p>
                  </div>
                  <div className="text-center p-4 bg-surface rounded-xl">
                    <p className="text-xs text-muted-foreground mb-1">Total Interest</p>
                    <p className="text-lg font-bold text-red-700 dark:text-red-400">{fmt(result.totalInterest)}</p>
                  </div>
                  <div className="text-center p-4 bg-surface rounded-xl">
                    <p className="text-xs text-muted-foreground mb-1">Total Payment</p>
                    <p className="text-lg font-bold text-orange-700 dark:text-orange-400">{fmt(result.totalPayment)}</p>
                  </div>
                </div>

                {/* Visual Ratio Bar */}
                <div>
                  <div className="flex justify-between text-xs text-muted-foreground mb-2">
                    <span>Principal ({principalPercent}%)</span>
                    <span>Interest ({interestPercent}%)</span>
                  </div>
                  <div className="h-4 rounded-full overflow-hidden bg-surface flex">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${principalPercent}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className="bg-gradient-to-r from-green-500 to-green-400 rounded-l-full" />
                    <motion.div initial={{ width: 0 }} animate={{ width: `${interestPercent}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
                      className="bg-gradient-to-r from-red-500 to-red-400 rounded-r-full" />
                  </div>
                </div>
              </motion.div>

              {/* View Tabs */}
              <div className="flex gap-1 bg-surface rounded-xl p-1">
                {[
                  { id: 'summary' as const, label: 'Yearly Summary', icon: BarChart3 },
                  { id: 'schedule' as const, label: 'Full Schedule', icon: Table2 },
                  { id: 'rates' as const, label: 'Bank Rates', icon: TrendingDown },
                ].map(tab => (
                  <button key={tab.id} onClick={() => { setActiveView(tab.id); if (tab.id === 'schedule') setShowSchedule(true); }}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-sm font-semibold transition-all ${activeView === tab.id ? 'bg-orange-500 text-white': 'text-muted-foreground hover:text-foreground'}`}>
                    <tab.icon className="w-4 h-4" />{tab.label}
                  </button>
                ))}
              </div>

              {/* Yearly Summary */}
              {activeView === 'summary' && (
                <div className="bg-surface border border-border rounded-2xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground">
                        <th className="text-left p-4 font-medium">Year</th>
                        <th className="text-right p-4 font-medium">Principal Paid</th>
                        <th className="text-right p-4 font-medium">Interest Paid</th>
                        <th className="text-right p-4 font-medium">Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(schedule.length === 0 ? buildSchedule(principal, rate, tenure): schedule).length > 0 &&
                        (() => {
                          const sched = schedule.length > 0 ? schedule: buildSchedule(principal, rate, tenure);
                          const years: { year: number; tp: number; ti: number; bal: number }[] = [];
                          for (let y = 0; y < Math.ceil(tenure / 12); y++) {
                            const slice = sched.slice(y * 12, Math.min((y + 1) * 12, sched.length));
                            years.push({
                              year: y + 1,
                              tp: slice.reduce((s, r) => s + r.principalPart, 0),
                              ti: slice.reduce((s, r) => s + r.interestPart, 0),
                              bal: slice[slice.length - 1]?.balance || 0,
                            });
                          }
                          return years.map((yr, i) => (
                            <tr key={i} className="border-b border-border hover:bg-surface transition-colors">
                              <td className="p-4 text-foreground font-medium">Year {yr.year}</td>
                              <td className="p-4 text-right text-green-700 dark:text-green-400">{fmt(yr.tp)}</td>
                              <td className="p-4 text-right text-red-700 dark:text-red-400">{fmt(yr.ti)}</td>
                              <td className="p-4 text-right text-muted-foreground">{fmt(yr.bal)}</td>
                            </tr>
                          ));
                        })()
                      }
                    </tbody>
                  </table>
                </div>
              )}

              {/* Full Amortization */}
              {activeView === 'schedule' && (
                <div className="bg-surface border border-border rounded-2xl overflow-hidden max-h-[500px] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-surface">
                      <tr className="border-b border-border text-muted-foreground">
                        <th className="text-left p-3 font-medium">Month</th>
                        <th className="text-right p-3 font-medium">EMI</th>
                        <th className="text-right p-3 font-medium">Principal</th>
                        <th className="text-right p-3 font-medium">Interest</th>
                        <th className="text-right p-3 font-medium">Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {schedule.map(row => (
                        <tr key={row.month} className="border-b border-border hover:bg-surface transition-colors text-xs">
                          <td className="p-3 text-foreground">{row.month}</td>
                          <td className="p-3 text-right text-muted-foreground">{fmtNum(row.emi)}</td>
                          <td className="p-3 text-right text-green-700 dark:text-green-400">{fmtNum(row.principalPart)}</td>
                          <td className="p-3 text-right text-red-700 dark:text-red-400">{fmtNum(row.interestPart)}</td>
                          <td className="p-3 text-right text-muted-foreground">{fmtNum(row.balance)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Bank Rates */}
              {activeView === 'rates' && (
                <div className="space-y-3">
                  {RATE_BENCHMARKS.map((b, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-surface border border-border rounded-xl hover:border-orange-500/20 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center">
                          <span className="text-sm font-bold text-orange-700 dark:text-orange-400">{b.lender.charAt(0)}</span>
                        </div>
                        <span className="font-semibold text-foreground">{b.lender}</span>
                      </div>
                      <span className="text-sm font-bold text-muted-foreground">{b.rate}</span>
                    </div>
                  ))}
                  <p className="text-xs text-muted-foreground text-center mt-2">Rates as of May 2026. Actual rates depend on your credit profile.</p>
                </div>
              )}
            </div>
          </div>

          {/* CTA */}
          <div className="mt-16 bg-surface border border-orange-500/20 rounded-2xl p-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent" />
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h3 className="text-2xl font-bold text-foreground mb-2">Will Your Loan Actually Get Approved?</h3>
                <p className="text-muted-foreground max-w-lg">Knowing the EMI is step 1. Check if banks will actually approve you at this amount and rate.</p>
              </div>
              <Button onClick={() => navigate('/loan-approval-predictor')}
                className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-6 rounded-xl text-lg font-bold group shrink-0">
                Check Approval Odds <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>

          {/* FAQ */}
          <section className="mt-16">
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

          {/* Related Tools */}
          <section className="mt-16">
            <h2 className="text-2xl font-bold text-foreground mb-6">Related Tools</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { title: 'Loan Approval Predictor', desc: 'Check your exact approval odds.', path: '/loan-approval-predictor', icon: Zap, color: 'text-orange-500' },
                { title: 'Salary Eligibility', desc: 'Max loan on your salary.', path: '/tools/salary-loan-eligibility', icon: IndianRupee, color: 'text-green-500' },
                { title: 'DTI Calculator', desc: 'Are your EMIs too high?', path: '/tools/dti-calculator', icon: Percent, color: 'text-yellow-500' },
              ].map((t, i) => (
                <Link key={i} to={t.path}
                  className="flex items-center gap-4 p-4 bg-surface border border-border rounded-xl hover:border-orange-500/20 transition-all group">
                  <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center shrink-0">
                    <t.icon className={`w-5 h-5 ${t.color}`} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground group-hover:text-orange-700 dark:group-hover:text-orange-400 transition-colors">{t.title}</p>
                    <p className="text-xs text-muted-foreground">{t.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default EmiCalculator;
