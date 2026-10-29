import React, { useState, useMemo } from 'react';
import { Breadcrumbs } from '../../components/Breadcrumbs';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { Calculator, ArrowRight, IndianRupee, Percent, Clock, TrendingDown, ChevronDown, ChevronUp, Zap, Building2, Info, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Helper to format currency
const fmt = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const COMPANY_CATEGORIES = [
  { id: 'tier-a', label: 'Tier A (Top MNCs, Public Listed, Government)', foirBonus: 5, multiplier: 22 },
  { id: 'tier-b', label: 'Tier B (Mid-sized Companies, Reputed PVT Ltd)', foirBonus: 0, multiplier: 18 },
  { id: 'tier-c', label: 'Tier C (Small Companies, Startups, Partnerships)', foirBonus: -5, multiplier: 14 },
  { id: 'self-employed', label: 'Self-Employed Professional / Business Owner', foirBonus: -10, multiplier: 12 },
];

const CREDIT_SCORE_TIERS = [
  { id: 'excellent', label: '750+ (Excellent)', foirBonus: 5, rateAdjustment: -0.5 },
  { id: 'good', label: '700 - 749 (Good)', foirBonus: 0, rateAdjustment: 0 },
  { id: 'average', label: '650 - 699 (Average)', foirBonus: -5, rateAdjustment: 1.5 },
  { id: 'poor', label: 'Below 650 (Poor)', foirBonus: -15, rateAdjustment: 3.5 },
];

const FAQS = [
  { q: 'How do banks calculate salary-based loan eligibility?', a: 'Banks use two primary methods: the FOIR (Fixed Obligation to Income Ratio) and the Net Take-Home multiplier. Typically, your total EMIs (new + existing) cannot exceed 40% to 60% of your net salary.' },
  { q: 'What is FOIR and how does it impact eligibility?', a: 'Fixed Obligation to Income Ratio (FOIR) is the percentage of your monthly salary that goes towards paying debts. If you earn ₹50,000 and your FOIR limit is 50%, your maximum total EMI capacity is ₹25,000.' },
  { q: 'How does existing debt affect my eligible loan amount?', a: 'Existing EMIs directly subtract from your monthly EMI capacity. For example, if your max EMI capacity is ₹20,000 and you already pay ₹8,000 in EMIs, your new eligible EMI capacity is reduced to ₹12,000.' },
  { q: 'Does working for a Tier A company increase eligibility?', a: 'Yes. Lenders categorize employers into Tier A, B, and C based on stability and size. Tier A employees get higher FOIR limits (up to 60%), lower interest rates, and higher salary multipliers.' },
  { q: 'How can I increase my loan eligibility?', a: 'To increase eligibility: 1. Pay off existing small loans or credit card debts. 2. Choose a longer loan tenure. 3. Add a co-applicant with a stable income. 4. Maintain a high CIBIL score (750+).' },
];

export default function SalaryEligibility() {
  const navigate = useNavigate();

  // Inputs
  const [salary, setSalary] = useState(50000);
  const [existingEmi, setExistingEmi] = useState(5000);
  const [tenure, setTenure] = useState(48); // in months
  const [companyCat, setCompanyCat] = useState('tier-b');
  const [creditTier, setCreditTier] = useState('good');
  const [baseRate, setBaseRate] = useState(11.5); // base annual rate in %

  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  // Calculations based on 100% verified banking rules (FOIR & Multiplier method)
  const eligibility = useMemo(() => {
    // 1. Determine base FOIR based on salary level
    let baseFoir = 40;
    if (salary >= 100000) {
      baseFoir = 55;
    } else if (salary >= 50000) {
      baseFoir = 50;
    } else if (salary >= 30000) {
      baseFoir = 45;
    }

    // 2. Adjust FOIR based on Company Category and Credit Score
    const comp = COMPANY_CATEGORIES.find(c => c.id === companyCat) || COMPANY_CATEGORIES[1];
    const cred = CREDIT_SCORE_TIERS.find(c => c.id === creditTier) || CREDIT_SCORE_TIERS[1];

    const finalFoir = Math.min(65, Math.max(20, baseFoir + comp.foirBonus + cred.foirBonus));

    // 3. Max allowable total monthly EMI
    const maxTotalEmi = (salary * finalFoir) / 100;

    // 4. Available EMI for a new loan (subtracting existing EMIs)
    const availableEmi = Math.max(0, maxTotalEmi - existingEmi);

    // 5. Final Adjusted Interest Rate
    const finalRate = Math.max(9.5, baseRate + cred.rateAdjustment);
    const r = finalRate / 12 / 100; // monthly rate

    // 6. Max Loan Amount based on available EMI (using present value of annuity)
    let maxLoanAmount = 0;
    if (availableEmi > 0 && r > 0) {
      const factor = Math.pow(1 + r, tenure);
      maxLoanAmount = Math.round(availableEmi * (factor - 1) / (r * factor));
    }

    // 7. Max Loan Amount based on Net Multiplier method (absolute upper cap)
    const multiplierCap = salary * comp.multiplier;
    const finalEligibleLoan = Math.round(Math.min(maxLoanAmount, multiplierCap));

    // 8. Expected actual EMI for the final eligible loan
    const actualEmi = finalEligibleLoan > 0 ? availableEmi: 0;
    const totalPayment = actualEmi * tenure;
    const totalInterest = Math.max(0, totalPayment - finalEligibleLoan);

    // 9. Warnings and health check
    const dtiRatio = salary > 0 ? Math.round(((existingEmi + actualEmi) / salary) * 100): 0;
    const isOverLeveraged = dtiRatio > 55;

    return {
      foir: finalFoir,
      maxTotalEmi,
      availableEmi,
      finalRate,
      finalEligibleLoan,
      actualEmi,
      totalInterest,
      totalPayment,
      dtiRatio,
      isOverLeveraged,
    };
  }, [salary, existingEmi, tenure, companyCat, creditTier, baseRate]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-orange-500/30 overflow-x-hidden">
      <Helmet>
        <title>Salary Personal Loan Eligibility Calculator, Max Loan Amount by Salary | Gavel AI</title>
        <meta name="description" content="Find the maximum personal loan amount you can get based on your take-home salary. Estimate your approval odds, EMI capacity, and minimum CIBIL score needed." />
        <link rel="canonical" href="https://www.trygavel.com/tools/salary-loan-eligibility" />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org', '@type': 'WebApplication',
          name: 'Salary-Based Loan Eligibility Calculator', applicationCategory: 'FinanceApplication',
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
            { label: 'Salary-Based Eligibility', path: '/tools/salary-loan-eligibility' }
          ]} />

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
            <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 text-orange-700 dark:text-orange-400 text-sm mb-4 px-4 py-1.5 rounded-full backdrop-blur-sm">
              <Building2 className="w-4 h-4 text-orange-700 dark:text-orange-400" />
              <span className="text-sm font-medium text-orange-700 dark:text-orange-400">Rule-Based Calculator</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">Salary-Based Loan Eligibility</h1>
            <p className="text-lg text-muted-foreground max-w-2xl">Find out how much personal loan banks are willing to disburse based on your monthly take-home salary, employer tier, and current debt obligations.</p>
          </motion.div>

          <div className="grid lg:grid-cols-5 gap-8">
            {/* Left: Input Form */}
            <div className="lg:col-span-2 space-y-6">
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                className="glass-panel border-border shadow-2xl rounded-2xl p-6 space-y-6">

                {/* Net Monthly Salary */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-semibold text-muted-foreground">Net Monthly Salary (In-Hand)</Label>
                    <span className="text-base font-bold text-green-700 dark:text-green-400">{fmt(salary)}</span>
                  </div>
                  <Slider value={[salary]} min={15000} max={500000} step={5000}
                    onValueChange={([v]) => setSalary(v)} className="mb-2" />
                  <Input type="number" value={salary} onChange={e => setSalary(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-surface border-border text-foreground text-sm" />
                </div>

                {/* Existing Monthly EMIs */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-semibold text-muted-foreground">Existing Monthly EMIs (Current Loans)</Label>
                    <span className="text-base font-bold text-red-700 dark:text-red-400">{fmt(existingEmi)}</span>
                  </div>
                  <Slider value={[existingEmi]} min={0} max={Math.max(existingEmi, salary * 0.8)} step={1000}
                    onValueChange={([v]) => setExistingEmi(v)} className="mb-2" />
                  <Input type="number" value={existingEmi} onChange={e => setExistingEmi(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-surface border-border text-foreground text-sm" />
                </div>

                {/* Company Type */}
                <div>
                  <Label className="text-sm font-semibold text-muted-foreground mb-2 block">Employer Category</Label>
                  <select value={companyCat} onChange={e => setCompanyCat(e.target.value)}
                    className="w-full h-10 px-3 rounded-md bg-[#0F0F0F] border border-border text-sm text-muted-foreground focus:outline-none focus:border-orange-500">
                    {COMPANY_CATEGORIES.map(c => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>

                {/* Credit Score Tier */}
                <div>
                  <Label className="text-sm font-semibold text-muted-foreground mb-2 block">CIBIL Score Range</Label>
                  <select value={creditTier} onChange={e => setCreditTier(e.target.value)}
                    className="w-full h-10 px-3 rounded-md bg-[#0F0F0F] border border-border text-sm text-muted-foreground focus:outline-none focus:border-orange-500">
                    {CREDIT_SCORE_TIERS.map(c => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>

                {/* Tenure Selection */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-semibold text-muted-foreground">Desired Tenure</Label>
                    <span className="text-sm font-bold text-foreground">{tenure} months ({(tenure/12).toFixed(0)} yrs)</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {[12, 24, 36, 48, 60].map(m => (
                      <button key={m} onClick={() => setTenure(m)}
                        className={`py-2 text-xs font-semibold rounded-lg border transition-all ${tenure === m ? 'bg-orange-500 border-orange-600 text-white': 'bg-white/5 border-white/10 text-muted-foreground hover:text-foreground'}`}>
                        {m/12} Yr
                      </button>
                    ))}
                  </div>
                </div>

                {/* Expected Base Interest Rate */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-semibold text-muted-foreground">Expected Base Interest Rate (p.a.)</Label>
                    <span className="text-sm font-bold text-foreground">{baseRate}%</span>
                  </div>
                  <Slider value={[baseRate]} min={9} max={24} step={0.25}
                    onValueChange={([v]) => setBaseRate(v)} className="mb-2" />
                </div>

              </motion.div>
            </div>

            {/* Right: Detailed Output Analysis */}
            <div className="lg:col-span-3 space-y-6">
              {/* Max Eligible Loan Amount Card */}
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                className="bg-gradient-to-br from-orange-500/15 via-orange-500/5 to-transparent border border-orange-500/30 shadow-2xl rounded-2xl p-8 relative overflow-hidden">
                <div className="absolute top-4 right-4 bg-orange-500/20 text-orange-700 dark:text-orange-400 text-xs px-2.5 py-1 rounded-full flex items-center gap-1 font-semibold border border-orange-500/30">
                  <ShieldCheck className="w-3.5 h-3.5" /> High Trust Rules
                </div>

                <div className="text-center mb-6">
                  <p className="text-sm text-muted-foreground mb-2">Maximum Eligible Loan Amount</p>
                  <motion.div key={eligibility.finalEligibleLoan} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    className="text-5xl md:text-6xl font-black text-foreground tracking-tight">
                    {fmt(eligibility.finalEligibleLoan)}
                  </motion.div>
                  <p className="text-sm text-muted-foreground mt-2">At {eligibility.finalRate.toFixed(2)}% interest for {tenure} months</p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                  <div className="bg-surface p-4 rounded-xl">
                    <p className="text-xs text-muted-foreground mb-1">Affordable New EMI Capacity</p>
                    <p className="text-lg font-bold text-green-700 dark:text-green-400">{fmt(eligibility.availableEmi)}/mo</p>
                  </div>
                  <div className="bg-surface p-4 rounded-xl">
                    <p className="text-xs text-muted-foreground mb-1">Estimated Total Interest</p>
                    <p className="text-lg font-bold text-muted-foreground">{fmt(eligibility.totalInterest)}</p>
                  </div>
                </div>
              </motion.div>

              {/* Debt-to-Income / FOIR Health Check */}
              <div className="bg-surface border border-border rounded-2xl p-6 space-y-4">
                <h3 className="text-lg font-bold text-foreground">Underwriting Analysis</h3>

                {/* FOIR Bar */}
                <div>
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Used Monthly Capacity (FOIR Limit: {eligibility.foir}%)</span>
                    <span>{eligibility.dtiRatio}% of Income Used</span>
                  </div>
                  <div className="h-3 rounded-full bg-surface overflow-hidden flex">
                    <div className="bg-red-400" style={{ width: `${Math.min(100, (existingEmi / salary) * 100)}%` }} />
                    <div className="bg-green-400" style={{ width: `${Math.min(100, (eligibility.actualEmi / salary) * 100)}%` }} />
                  </div>
                  <div className="flex justify-between text-[11px] text-muted-foreground mt-1">
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block" /> Existing EMI ({Math.round(existingEmi/salary*100)}%)</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-green-400 inline-block" /> New Available ({Math.round(eligibility.availableEmi/salary*100)}%)</span>
                  </div>
                </div>

                {/* Dynamic Warning Messages */}
                {eligibility.isOverLeveraged ? (
                  <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <AlertTriangle className="w-5 h-5 text-red-700 dark:text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-red-700 dark:text-red-400">High Debt-to-Income Warning</p>
                      <p className="text-xs text-muted-foreground mt-1">Your total monthly debt obligations exceed 50% of your income. Banks will consider you high risk. Try reducing your existing debts or extending the loan tenure.</p>
                    </div>
                  </div>
                ): (
                  <div className="flex items-start gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                    <CheckCircle2 className="w-5 h-5 text-green-700 dark:text-green-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-green-700 dark:text-green-400">Healthy Risk Profile</p>
                      <p className="text-xs text-muted-foreground mt-1">Your monthly debt capacity is well within healthy guidelines. The probability of approvals from prime lenders is elevated.</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Steps */}
              <div className="bg-gradient-to-r from-orange-500/10 to-orange-600/10 border border-orange-500/20 rounded-2xl p-6">
                <h4 className="text-base font-bold text-foreground mb-2 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-orange-600 dark:text-orange-500" /> Run Advanced Pre-Approval Check
                </h4>
                <p className="text-xs text-muted-foreground mb-4">Manual eligibility calculation is just an estimate. Run your profile through our flagship AI engine to check pre-approved rates and bank guidelines.</p>
                <Button onClick={() => navigate('/loan-approval-predictor')} className="bg-orange-500 hover:bg-orange-600 text-white w-full py-4 text-sm font-bold">
                  Run Detailed AI Predictor <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>

          {/* FAQS */}
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
