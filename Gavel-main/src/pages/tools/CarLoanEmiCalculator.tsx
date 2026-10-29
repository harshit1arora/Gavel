import React, { useState, useMemo } from 'react';
import { Breadcrumbs } from '../../components/Breadcrumbs';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { Calculator, ArrowRight, IndianRupee, Percent, Clock, Car, Info, CheckCircle2, AlertTriangle, ShieldCheck, ChevronDown, ChevronUp, Zap, BarChart3, Table2, TrendingDown } from 'lucide-react';
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

const FAQS = [
  { q: 'What is the maximum tenure for a car loan in India?', a: 'Most banks in India offer car loan tenures ranging from 1 to 7 years (12 to 84 months). A few lenders may offer up to 8 years for specific electric or premium vehicle models.' },
  { q: 'How much down payment is required for a car loan?', a: 'Generally, lenders finance 80% to 90% of the car\'s on-road price, meaning you need to pay 10% to 20% upfront as a down payment. Some banks offer 100% ex-showroom funding for selected profiles.' },
  { q: 'What is the difference between ex-showroom price and on-road price?', a: 'Ex-showroom price is the cost of the car at the dealership without registration, road tax, and insurance. The on-road price includes road tax, registration charges, mandatory insurance, handling charges, and accessories.' },
  { q: 'Can I prepay or foreclose my car loan early?', a: 'Yes. Most banks allow prepayment or foreclosure after 6 to 12 months of EMI repayments. Floating rate car loans have zero foreclosure fees, while fixed-rate loans may incur a penalty of 2% to 5%.' },
  { q: 'Are interest rates lower for electric vehicles (EVs)?', a: 'Yes, many banks run special schemes (often called Green Car Loans) offering a 0.25% to 0.50% interest rate discount for purchasing electric vehicles.' }
];

const LENDER_RATES = [
  { lender: 'SBI Car Loan', rate: '8.85% - 9.80%' },
  { lender: 'HDFC Bank', rate: '8.75% - 10.50%' },
  { lender: 'ICICI Bank', rate: '8.85% - 11.00%' },
  { lender: 'Axis Bank', rate: '9.10% - 10.95%' },
  { lender: 'Punjab National Bank', rate: '8.75% - 9.60%' }
];

export default function CarLoanEmiCalculator() {
  const navigate = useNavigate();

  // Inputs
  const [onRoadPrice, setOnRoadPrice] = useState(1000000);
  const [downPayment, setDownPayment] = useState(200000);
  const [interestRate, setInterestRate] = useState(9.0);
  const [tenureYrs, setTenureYrs] = useState(5); // in years

  const [activeView, setActiveView] = useState<'summary' | 'schedule' | 'rates'>('summary');
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  // Derived Loan Amount
  const loanAmount = useMemo(() => {
    return Math.max(0, onRoadPrice - downPayment);
  }, [onRoadPrice, downPayment]);

  const tenureMonths = tenureYrs * 12;

  const result = useMemo(() => {
    return calcEmi(loanAmount, interestRate, tenureMonths);
  }, [loanAmount, interestRate, tenureMonths]);

  const schedule = useMemo(() => {
    return activeView === 'schedule' ? buildSchedule(loanAmount, interestRate, tenureMonths): [];
  }, [loanAmount, interestRate, tenureMonths, activeView]);

  const principalPercent = result.totalPayment > 0 ? Math.round((loanAmount / result.totalPayment) * 100): 0;
  const interestPercent = 100 - principalPercent;

  // LTV Check
  const ltvRatio = onRoadPrice > 0 ? Math.round((loanAmount / onRoadPrice) * 100): 0;
  const isLtvHigh = ltvRatio > 90;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-orange-500/30 overflow-x-hidden">
      <Helmet>
        <title>Car Loan EMI Calculator: Calculate Monthly Auto EMIs | Gavel AI</title>
        <meta name="description" content="Calculate your monthly car loan EMI, interest component, and view the full amortization schedule. Compare auto interest rates across SBI, HDFC, and ICICI." />
        <link rel="canonical" href="https://www.trygavel.com/tools/car-loan-emi-calculator" />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org', '@type': 'WebApplication',
          name: 'Car Loan EMI Calculator', applicationCategory: 'FinanceApplication',
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
            { label: 'Car Loan EMI Calculator', path: '/tools/car-loan-emi-calculator' }
          ]} />

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
            <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 text-orange-700 dark:text-orange-400 text-sm mb-4 px-4 py-1.5 rounded-full backdrop-blur-sm">
              <Car className="w-4 h-4 text-blue-700 dark:text-blue-400" />
              <span className="text-sm font-medium text-blue-700 dark:text-blue-400">Auto Finance Tool</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">Car Loan EMI Calculator</h1>
            <p className="text-lg text-muted-foreground max-w-2xl">Estimate your monthly payments for new or used cars. Change prices, down payments, and tenures to fit your financial budget.</p>
          </motion.div>

          <div className="grid lg:grid-cols-5 gap-8">
            {/* Left: Inputs */}
            <div className="lg:col-span-2 space-y-6">
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                className="glass-panel border-border shadow-2xl rounded-2xl p-6 space-y-6">

                {/* On-Road Price */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-xs text-muted-foreground font-semibold">Car On-Road Price</Label>
                    <span className="text-sm font-bold text-foreground">{fmt(onRoadPrice)}</span>
                  </div>
                  <Slider value={[onRoadPrice]} min={100000} max={10000000} step={50000}
                    onValueChange={([v]) => setOnRoadPrice(v)} className="mb-2" />
                  <Input type="number" value={onRoadPrice} onChange={e => setOnRoadPrice(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-surface border-border text-foreground text-xs h-9" />
                </div>

                {/* Down Payment */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-xs text-muted-foreground font-semibold">Down Payment</Label>
                    <span className="text-sm font-bold text-green-700 dark:text-green-400">{fmt(downPayment)} ({ltvRatio > 0 ? (100 - ltvRatio): 0}%)</span>
                  </div>
                  <Slider value={[downPayment]} min={0} max={onRoadPrice} step={10000}
                    onValueChange={([v]) => setDownPayment(v)} className="mb-2" />
                  <Input type="number" value={downPayment} onChange={e => setDownPayment(Math.min(onRoadPrice, Math.max(0, parseInt(e.target.value) || 0)))}
                    className="w-full bg-surface border-border text-foreground text-xs h-9" />
                </div>

                {/* Derived Loan Amount display */}
                <div className="bg-surface p-3.5 rounded-xl border border-border flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Total Borrowed Amount:</span>
                  <span className="font-bold text-foreground">{fmt(loanAmount)}</span>
                </div>

                {/* Interest Rate */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-xs text-muted-foreground font-semibold">Interest Rate (p.a.)</Label>
                    <span className="text-sm font-bold text-foreground">{interestRate}%</span>
                  </div>
                  <Slider value={[interestRate]} min={6} max={20} step={0.1}
                    onValueChange={([v]) => setInterestRate(v)} className="mb-2" />
                </div>

                {/* Tenure in Years */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-xs text-muted-foreground font-semibold">Tenure (Years)</Label>
                    <span className="text-sm font-bold text-foreground">{tenureYrs} Years ({tenureMonths} months)</span>
                  </div>
                  <Slider value={[tenureYrs]} min={1} max={7} step={1}
                    onValueChange={([v]) => setTenureYrs(v)} className="mb-2" />
                </div>

              </motion.div>

              {/* LTV Alert warning */}
              {isLtvHigh && (
                <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4 flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-800 dark:text-yellow-400 shrink-0 mt-0.5" />
                  <div className="text-[11px] text-muted-foreground leading-relaxed">
                    <p className="font-semibold text-amber-800 dark:text-yellow-400 mb-0.5">High Loan-to-Value Ratio ({ltvRatio}%)</p>
                    Most retail lenders limit car financing to 85-90% of the on-road price. Approvals at this limit may require premium salaries or clean credit profiles.
                  </div>
                </div>
              )}
            </div>

            {/* Right: Results Dashboard */}
            <div className="lg:col-span-3 space-y-6">
              {/* EMI display card */}
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                className="bg-gradient-to-br from-orange-500/15 via-orange-500/5 to-transparent border border-orange-500/30 shadow-2xl rounded-2xl p-8 relative overflow-hidden">
                <div className="absolute top-4 right-4 bg-blue-500/20 text-blue-700 dark:text-blue-400 text-xs px-2.5 py-1 rounded-full flex items-center gap-1 font-semibold border border-blue-500/30">
                  <ShieldCheck className="w-3.5 h-3.5" /> High Trust Rules
                </div>

                <div className="text-center mb-6">
                  <p className="text-sm text-muted-foreground mb-2">Estimated Monthly Auto EMI</p>
                  <motion.div key={result.emi} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    className="text-5xl md:text-6xl font-black text-foreground tracking-tight">
                    {fmt(result.emi)}
                  </motion.div>
                  <p className="text-xs text-muted-foreground mt-2">for {tenureMonths} months</p>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 bg-surface rounded-xl">
                    <p className="text-xs text-muted-foreground mb-1">Principal</p>
                    <p className="text-base font-bold text-foreground">{fmt(loanAmount)}</p>
                  </div>
                  <div className="text-center p-4 bg-surface rounded-xl">
                    <p className="text-xs text-muted-foreground mb-1">Total Interest</p>
                    <p className="text-base font-bold text-red-700 dark:text-red-400">{fmt(result.totalInterest)}</p>
                  </div>
                  <div className="text-center p-4 bg-surface rounded-xl">
                    <p className="text-xs text-muted-foreground mb-1">Total Payments</p>
                    <p className="text-base font-bold text-blue-700 dark:text-blue-400">{fmt(result.totalPayment)}</p>
                  </div>
                </div>

                {/* Visual Ratio Bar */}
                <div>
                  <div className="flex justify-between text-xs text-muted-foreground mb-2">
                    <span>Principal ({principalPercent}%)</span>
                    <span>Interest ({interestPercent}%)</span>
                  </div>
                  <div className="h-3 rounded-full overflow-hidden bg-surface flex">
                    <div className="bg-gradient-to-r from-green-500 to-green-400" style={{ width: `${principalPercent}%` }} />
                    <div className="bg-gradient-to-r from-red-500 to-red-400" style={{ width: `${interestPercent}%` }} />
                  </div>
                </div>
              </motion.div>

              {/* Display Tabs */}
              <div className="flex gap-1 bg-surface rounded-xl p-1">
                {[
                  { id: 'summary' as const, label: 'Yearly Summary', icon: BarChart3 },
                  { id: 'schedule' as const, label: 'Amortization', icon: Table2 },
                  { id: 'rates' as const, label: 'Current Rates', icon: TrendingDown },
                ].map(tab => (
                  <button key={tab.id} onClick={() => setActiveView(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-sm font-semibold transition-all ${activeView === tab.id ? 'bg-blue-600 text-white': 'text-muted-foreground hover:text-foreground'}`}>
                    <tab.icon className="w-4 h-4" />{tab.label}
                  </button>
                ))}
              </div>

              {/* Yearly Summary */}
              {activeView === 'summary' && (
                <div className="bg-surface border border-border rounded-2xl overflow-hidden text-sm">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground">
                        <th className="text-left p-4 font-medium">Year</th>
                        <th className="text-right p-4 font-medium">Principal Paid</th>
                        <th className="text-right p-4 font-medium">Interest Paid</th>
                        <th className="text-right p-4 font-medium">Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const sched = buildSchedule(loanAmount, interestRate, tenureMonths);
                        const years: { year: number; tp: number; ti: number; bal: number }[] = [];
                        for (let y = 0; y < tenureYrs; y++) {
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
                      })()}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Amortization Schedule */}
              {activeView === 'schedule' && (
                <div className="bg-surface border border-border rounded-2xl overflow-hidden max-h-[400px] overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-surface border-b border-border text-muted-foreground">
                      <tr>
                        <th className="text-left p-3 font-medium">Month</th>
                        <th className="text-right p-3 font-medium">EMI</th>
                        <th className="text-right p-3 font-medium">Principal</th>
                        <th className="text-right p-3 font-medium">Interest</th>
                        <th className="text-right p-3 font-medium">Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {schedule.map(row => (
                        <tr key={row.month} className="border-b border-border hover:bg-surface transition-colors">
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

              {/* Lender Rates */}
              {activeView === 'rates' && (
                <div className="space-y-3 text-sm">
                  {LENDER_RATES.map((b, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-surface border border-border rounded-xl hover:border-blue-500/20 transition-all">
                      <span className="font-semibold text-foreground">{b.lender}</span>
                      <span className="font-bold text-muted-foreground">{b.rate}</span>
                    </div>
                  ))}
                  <p className="text-[10px] text-muted-foreground text-center mt-2">Rates vary based on CIBIL ratings and vehicle types.</p>
                </div>
              )}

              {/* Run detailed checks */}
              <div className="bg-gradient-to-r from-orange-500/10 to-orange-600/10 border border-orange-500/20 rounded-2xl p-6">
                <h4 className="text-base font-bold text-foreground mb-2 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-orange-600 dark:text-orange-500" /> Predict Loan Approvals
                </h4>
                <p className="text-xs text-muted-foreground mb-4">Mortgage and auto loans are approved based on detailed banking scoring indexes. Run an analysis check now.</p>
                <Button onClick={() => navigate('/loan-approval-predictor')} className="bg-orange-500 hover:bg-orange-600 text-white w-full py-4 text-sm font-bold">
                  Check Approval Odds <ArrowRight className="w-4 h-4 ml-2" />
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
