import React, { useState, useMemo } from 'react';
import { Breadcrumbs } from '../../components/Breadcrumbs';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { Calculator, ArrowRight, IndianRupee, Percent, ShieldCheck, ChevronDown, ChevronUp, Zap, Sparkles, AlertTriangle, CheckCircle2, XCircle, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const fmt = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const FAQS = [
  { q: 'How do lenders calculate business loan eligibility?', a: 'Lenders primarily evaluate: 1. Business vintage (must be operational for at least 2-3 years). 2. Annual turnover and audited net profit. 3. Debt Service Coverage Ratio (DSCR) to ensure your business earnings cover all outstanding and new debt repayments (preferred DSCR > 1.25).' },
  { q: 'What is the Debt Service Coverage Ratio (DSCR)?', a: 'DSCR measures a business\'s cash flow ability to pay current debt obligations. Formula: DSCR = Net Operating Income / Total Debt Service. A DSCR below 1.00 indicates negative cash flow, meaning the business cannot support a new loan.' },
  { q: 'What is the minimum turnover required for a business loan?', a: 'Most banks in India require a minimum annual turnover of ₹10 Lakhs to ₹15 Lakhs for unsecured business loans. For larger corporate loans, the minimum threshold is typically ₹50 Lakhs to ₹1 Crore.' },
  { q: 'Can I get a business loan if my vintage is less than 1 year?', a: 'Unsecured business loans from prime banks require a minimum 2-3 years vintage. Startups with less than 1-year vintage can explore government schemes like CGTMSE, Mudra loans, or venture debt.' },
  { q: 'What collateral is required for a business loan?', a: 'Unsecured business loans up to ₹50 Lakhs do not require collateral. For larger amounts, banks ask for collateral like commercial properties, residential properties, or liquid investments.' }
];

const INDUSTRIES = [
  { id: 'retail', label: 'Retail Trade', multiplier: 0.95 },
  { id: 'wholesale', label: 'Wholesale Trade', multiplier: 0.90 },
  { id: 'manufacturing', label: 'Manufacturing', multiplier: 1.00 },
  { id: 'services', label: 'Services Sector', multiplier: 1.05 }
];

export default function BusinessLoanEligibility() {
  const navigate = useNavigate();

  // Inputs
  const [annualTurnover, setAnnualTurnover] = useState(5000000); // 50 Lakhs
  const [netAnnualProfit, setNetAnnualProfit] = useState(1200000); // 12 Lakhs
  const [existingMonthlyDebts, setExistingMonthlyDebts] = useState(25000);
  const [vintageYrs, setVintageYrs] = useState(3);
  const [industry, setIndustry] = useState('retail');
  const [interestRate, setInterestRate] = useState(14.0); // business loans are higher
  const [tenureYrs, setTenureYrs] = useState(5);

  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  // Calculations
  const evaluation = useMemo(() => {
    const netMonthlyProfit = netAnnualProfit / 12;
    const selectedInd = INDUSTRIES.find(i => i.id === industry) || INDUSTRIES[0];

    // Underwriting Rule 1: Vintage check
    let eligibilityDiscount = 1.0;
    let isRejected = false;
    let rejectionReason = '';

    if (vintageYrs < 2) {
      isRejected = true;
      rejectionReason = 'Minimum operational vintage of 2 years required by prime lenders.';
    } else if (vintageYrs < 3) {
      eligibilityDiscount = 0.70; // 30% reduction for low vintage
    }

    // Underwriting Rule 2: Minimum turnover check
    if (annualTurnover < 1000000) { // < 10 Lakhs
      isRejected = true;
      rejectionReason = 'Annual turnover is below the prime bank minimum of ₹10 Lakhs.';
    }

    // Underwriting Rule 3: Debt service capacity / FOIR on net profit
    // Banks allow up to 55% FOIR on Net Profit for business loans
    const maxMonthlyObligation = netMonthlyProfit * 0.55 * selectedInd.multiplier;
    const availableMonthlyEmi = Math.max(0, maxMonthlyObligation - existingMonthlyDebts);

    // Max loan amount based on available EMI
    const n = tenureYrs * 12;
    const r = interestRate / 12 / 100;
    let maxLoanAmount = 0;

    if (availableMonthlyEmi > 0 && r > 0) {
      const factor = Math.pow(1 + r, n);
      maxLoanAmount = Math.round((availableMonthlyEmi * (factor - 1) / (r * factor)) * eligibilityDiscount);
    }

    if (maxLoanAmount < 100000) {
      maxLoanAmount = 0;
      if (!isRejected) {
        isRejected = true;
        rejectionReason = 'Calculated credit capacity is too low to qualify for a business loan (Min ₹1 Lakh).';
      }
    }

    // Calculate DSCR assuming new EMI is fully utilized
    const annualExistingDebts = existingMonthlyDebts * 12;
    const annualNewDebts = availableMonthlyEmi * 12;
    const dscr = (annualExistingDebts + annualNewDebts) > 0
      ? Number(((netAnnualProfit + annualExistingDebts) / (annualExistingDebts + annualNewDebts)).toFixed(2))
: 2.0;

    return {
      netMonthlyProfit,
      availableMonthlyEmi,
      maxLoanAmount,
      dscr,
      isRejected,
      rejectionReason,
    };
  }, [annualTurnover, netAnnualProfit, existingMonthlyDebts, vintageYrs, industry, interestRate, tenureYrs]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-orange-500/30 overflow-x-hidden">
      <Helmet>
        <title>Business Loan Eligibility Calculator: Free Check for MSME &amp; Startups | Gavel AI</title>
        <meta name="description" content="Check business loan eligibility for MSMEs &amp; startups instantly. Estimate maximum loan limit based on turnover, GST receipts, and profit margins with no credit impact." />
        <link rel="canonical" href="https://www.trygavel.com/tools/business-loan-eligibility" />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org', '@type': 'WebApplication',
          name: 'Business Loan Eligibility Calculator', applicationCategory: 'FinanceApplication',
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
            { label: 'Business Loan Eligibility', path: '/tools/business-loan-eligibility' }
          ]} />

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
            <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 text-orange-700 dark:text-orange-400 text-sm mb-4 px-4 py-1.5 rounded-full backdrop-blur-sm">
              <Store className="w-4 h-4 text-blue-700 dark:text-blue-400" />
              <span className="text-sm font-medium text-blue-700 dark:text-blue-400">Enterprise Finance Tool</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">Business Loan Eligibility</h1>
            <p className="text-lg text-muted-foreground max-w-2xl">Underwrite your business borrowing capacity. Input revenue and profitability details to calculate your eligible commercial funding range.</p>
          </motion.div>

          <div className="grid lg:grid-cols-5 gap-8">
            {/* Left: Input parameter configurations */}
            <div className="lg:col-span-2 space-y-6">
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                className="glass-panel border-border shadow-2xl rounded-2xl p-6 space-y-6">

                <h3 className="text-base font-bold text-foreground pb-3 border-b border-border">Financial Metrics</h3>

                {/* Annual Revenue / Turnover */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-xs text-muted-foreground font-semibold">Annual Revenue (Turnover)</Label>
                    <span className="text-sm font-bold text-foreground">{fmt(annualTurnover)}</span>
                  </div>
                  <Slider value={[annualTurnover]} min={500000} max={100000000} step={100000}
                    onValueChange={([v]) => setAnnualTurnover(v)} className="mb-2" />
                  <Input type="number" value={annualTurnover} onChange={e => setAnnualTurnover(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-surface border-border text-foreground text-xs h-9" />
                </div>

                {/* Net Annual Profit */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-xs text-muted-foreground font-semibold">Net Annual Profit</Label>
                    <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">{fmt(netAnnualProfit)}</span>
                  </div>
                  <Slider value={[netAnnualProfit]} min={50000} max={Math.min(netAnnualProfit, annualTurnover * 0.5)} step={50000}
                    onValueChange={([v]) => setNetAnnualProfit(v)} className="mb-2" />
                  <Input type="number" value={netAnnualProfit} onChange={e => setNetAnnualProfit(Math.min(annualTurnover, Math.max(0, parseInt(e.target.value) || 0)))}
                    className="w-full bg-surface border-border text-foreground text-xs h-9" />
                </div>

                {/* Existing Business EMIs */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-xs text-muted-foreground font-semibold">Existing Monthly Business EMIs</Label>
                    <span className="text-sm font-bold text-red-700 dark:text-red-400">{fmt(existingMonthlyDebts)}</span>
                  </div>
                  <Slider value={[existingMonthlyDebts]} min={0} max={150000} step={2000}
                    onValueChange={([v]) => setExistingMonthlyDebts(v)} className="mb-2" />
                  <Input type="number" value={existingMonthlyDebts} onChange={e => setExistingMonthlyDebts(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-surface border-border text-foreground text-xs h-9" />
                </div>

                <h3 className="text-base font-bold text-foreground pt-3 pb-3 border-b border-border">Business Parameters</h3>

                {/* Vintage */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-xs text-muted-foreground font-semibold">Business Vintage (Years)</Label>
                    <span className="text-sm font-bold text-foreground">{vintageYrs} Years</span>
                  </div>
                  <Slider value={[vintageYrs]} min={0} max={10} step={1}
                    onValueChange={([v]) => setVintageYrs(v)} className="mb-2" />
                </div>

                {/* Industry Category */}
                <div>
                  <Label className="text-xs text-muted-foreground font-semibold mb-2 block">Industry Segment</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {INDUSTRIES.map(ind => (
                      <button key={ind.id} onClick={() => setIndustry(ind.id)}
                        className={`py-2 text-xs font-semibold rounded-lg border transition-all ${industry === ind.id ? 'bg-blue-600 border-blue-700 text-white': 'bg-white/5 border-white/10 text-muted-foreground hover:text-foreground'}`}>
                        {ind.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Loan Term Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-[10px] text-muted-foreground mb-1.5 block">Expected Rate (p.a.)</Label>
                    <Input type="number" value={interestRate} onChange={e => setInterestRate(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="bg-surface border-border text-foreground text-xs h-9" />
                  </div>
                  <div>
                    <Label className="text-[10px] text-muted-foreground mb-1.5 block">Tenure (Years)</Label>
                    <Input type="number" value={tenureYrs} onChange={e => setTenureYrs(Math.max(1, parseInt(e.target.value) || 1))}
                      className="bg-surface border-border text-foreground text-xs h-9" />
                  </div>
                </div>

              </motion.div>
            </div>

            {/* Right: Results Panel Output */}
            <div className="lg:col-span-3 space-y-6">

              {/* Eligibility card display */}
              {evaluation.isRejected ? (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                  className="bg-gradient-to-br from-orange-500/15 via-orange-500/5 to-transparent border border-orange-500/30 shadow-2xl rounded-2xl p-8 relative overflow-hidden">
                  <div className="absolute top-4 right-4 bg-red-500/20 text-red-700 dark:text-red-400 text-xs px-2.5 py-1 rounded-full flex items-center gap-1 font-semibold border border-red-500/30">
                    <XCircle className="w-3.5 h-3.5" /> High Trust Rules
                  </div>

                  <div className="text-center">
                    <AlertTriangle className="w-12 h-12 text-red-700 dark:text-red-400 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-foreground mb-2">Loan Eligibility: Declined</h3>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">{evaluation.rejectionReason}</p>
                  </div>
                </motion.div>
              ): (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                  className="bg-gradient-to-br from-orange-500/15 via-orange-500/5 to-transparent border border-orange-500/30 shadow-2xl rounded-2xl p-8 relative overflow-hidden">
                  <div className="absolute top-4 right-4 bg-blue-500/20 text-blue-700 dark:text-blue-400 text-xs px-2.5 py-1 rounded-full flex items-center gap-1 font-semibold border border-blue-500/30">
                    <ShieldCheck className="w-3.5 h-3.5" /> High Trust Rules
                  </div>

                  <div className="text-center mb-6">
                    <p className="text-sm text-muted-foreground mb-2">Maximum Unsecured Business Loan Eligibility</p>
                    <motion.div key={evaluation.maxLoanAmount} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                      className="text-5xl md:text-6xl font-black text-foreground tracking-tight">
                      {fmt(evaluation.maxLoanAmount)}
                    </motion.div>
                    <p className="text-xs text-muted-foreground mt-2">At {interestRate}% interest rate for {tenureYrs} Years</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                    <div className="bg-surface p-4 rounded-xl">
                      <p className="text-xs text-muted-foreground mb-1">Max Allowable EMI Capacity</p>
                      <p className="text-lg font-bold text-foreground">{fmt(evaluation.availableMonthlyEmi)}/mo</p>
                    </div>
                    <div className="bg-surface p-4 rounded-xl">
                      <p className="text-xs text-muted-foreground mb-1">Debt Coverage Ratio (DSCR)</p>
                      <p className={`text-lg font-bold ${evaluation.dscr >= 1.25 ? 'text-green-400': 'text-yellow-400'}`}>{evaluation.dscr}</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Cash Flow and DSCR analysis */}
              {!evaluation.isRejected && (
                <div className="glass-panel border-border shadow-2xl rounded-2xl p-6 space-y-4">
                  <h3 className="text-sm font-bold text-foreground">Underwriting Benchmarks</h3>

                  <div className="space-y-3 text-xs">
                    <div className="flex items-center justify-between p-4 bg-surface rounded-xl">
                      <div>
                        <p className="font-semibold text-foreground">Debt Service Coverage Ratio (DSCR)</p>
                        <p className="text-[10px] text-muted-foreground mt-1">Lenders prefer DSCR above 1.25 to manage macro defaults.</p>
                      </div>
                      <span className={`text-sm font-black px-2.5 py-1 rounded-lg ${evaluation.dscr >= 1.25 ? 'bg-green-500/20 text-green-400': 'bg-yellow-500/20 text-yellow-400'}`}>
                        {evaluation.dscr >= 1.25 ? 'Healthy': 'Aggressive'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-surface rounded-xl">
                      <div>
                        <p className="font-semibold text-foreground">Turnover Profitability Margin</p>
                        <p className="text-[10px] text-muted-foreground mt-1">Net profit relative to gross sales turnover.</p>
                      </div>
                      <span className="text-sm font-black text-foreground">
                        {Math.round((netAnnualProfit / annualTurnover) * 100)}% Margin
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Predictor link */}
              <div className="bg-gradient-to-r from-orange-500/10 to-orange-600/10 border border-orange-500/20 rounded-2xl p-6">
                <h4 className="text-base font-bold text-foreground mb-2 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-orange-600 dark:text-orange-500" /> Apply For Enterprise Credit Lines
                </h4>
                <p className="text-xs text-muted-foreground mb-4">Underwriting guidelines combine debt service cover indexes with bank statements, tax files, and CIBIL status. Run our pre-approval odds predictor check now.</p>
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
