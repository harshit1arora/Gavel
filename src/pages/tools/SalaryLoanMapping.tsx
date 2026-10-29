import React, { useState, useMemo } from 'react';
import { Breadcrumbs } from '../../components/Breadcrumbs';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { Calculator, ArrowRight, IndianRupee, Percent, ShieldCheck, ChevronDown, ChevronUp, Zap, Sparkles, Building2, MapPin, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const fmt = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const FAQS = [
  { q: 'What is a corporate category / employer category?', a: 'Banks categorize employers in India into lists (Super A, Category A, B, C, etc.) based on company turnover, reputation, and employee strength. Employees of Category A companies get faster approvals, lower interest rates, and higher loan limits.' },
  { q: 'How does company categorization affect my personal loan?', a: 'If your employer is categorized as Category A (e.g., major MNCs, TCS, Infosys, Reliance), you can get a personal loan at 10.5% interest. For unlisted companies, the interest rate can range from 15% to 22% due to perceived job instability risk.' },
  { q: 'What is the maximum salary multiplier for personal loans?', a: 'Most banks offer personal loans up to 15 to 24 times your net monthly take-home salary. If your monthly take-home is ₹1 Lakh and you work in an MNC, you can qualify for up to ₹20-24 Lakhs.' },
  { q: 'Does my location impact loan eligibility?', a: 'Yes. Banks have higher minimum income thresholds for metro cities (Tier 1 like Mumbai, Bangalore, Delhi) where living costs are high. The minimum net monthly salary required in metros is usually ₹25,000, compared to ₹15,000 to ₹20,000 in Tier 2/3 cities.' },
  { q: 'What is the salary mapping for credit cards?', a: 'Lenders map salaries to credit card limits: generally, starting card limits are 2x to 3x your net monthly salary for prime corporate employees.' }
];

const CORPORATES = [
  { id: 'supera', label: 'Super A / MNC / Central Govt', foir: 60, multiplier: 24, rate: 10.5 },
  { id: 'cata', label: 'Category A Public Ltd', foir: 55, multiplier: 20, rate: 11.5 },
  { id: 'catb', label: 'Category B Private Ltd', foir: 50, multiplier: 15, rate: 13.0 },
  { id: 'unlisted', label: 'Unlisted / Proprietorship / LLP', foir: 40, multiplier: 10, rate: 15.5 },
];

export default function SalaryLoanMapping() {
  const navigate = useNavigate();

  // Inputs
  const [salary, setSalary] = useState(80000);
  const [existingEmi, setExistingEmi] = useState(15000);
  const [corpId, setCorpId] = useState('supera');
  const [location, setLocation] = useState<'tier1' | 'tier2' | 'tier3'>('tier1');

  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  // Calculations
  const mapping = useMemo(() => {
    const selectedCorp = CORPORATES.find(c => c.id === corpId) || CORPORATES[0];

    // Available monthly EMI capacity based on FOIR
    const maxEmiAllowed = (salary * selectedCorp.foir) / 100;
    const availableEmi = Math.max(0, maxEmiAllowed - existingEmi);

    // Personal Loan Mapping
    const plMaxAmount = salary * selectedCorp.multiplier;
    const plEstimatedRate = selectedCorp.rate;

    // Home Loan Mapping (typically up to 60 times net monthly salary)
    const hlMaxAmount = salary * 60;
    const hlEstimatedRate = location === 'tier1' ? 8.75: 9.0;

    // Car Loan Mapping (up to 6 times monthly salary)
    const clMaxAmount = salary * 10;

    return {
      maxEmiAllowed,
      availableEmi,
      plMaxAmount,
      plEstimatedRate,
      hlMaxAmount,
      hlEstimatedRate,
      clMaxAmount,
      corporateLabel: selectedCorp.label,
    };
  }, [salary, existingEmi, corpId, location]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-orange-500/30 overflow-x-hidden">
      <Helmet>
        <title>Salary Loan Mapping Calculator: Check Credit Eligibility | Gavel AI</title>
        <meta name="description" content="Map your net monthly salary and employer category to eligible personal, home, and auto loan limits from premium lenders." />
        <link rel="canonical" href="https://www.trygavel.com/tools/salary-loan-mapping" />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org', '@type': 'WebApplication',
          name: 'Salary Loan Mapping Calculator', applicationCategory: 'FinanceApplication',
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
            { label: 'Salary Loan Mapping', path: '/tools/salary-loan-mapping' }
          ]} />

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
            <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 text-orange-700 dark:text-orange-400 text-sm mb-4 px-4 py-1.5 rounded-full backdrop-blur-sm">
              <Briefcase className="w-4 h-4 text-blue-700 dark:text-blue-400" />
              <span className="text-sm font-medium text-blue-700 dark:text-blue-400">Salary Profiling Tool</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">Salary Loan Mapping</h1>
            <p className="text-lg text-muted-foreground max-w-2xl">Discover how banks map your salary to credit limits. Enter earnings and corporate category to view eligibility ranges instantly.</p>
          </motion.div>

          <div className="grid lg:grid-cols-5 gap-8">
            {/* Left: Input parameters */}
            <div className="lg:col-span-2 space-y-6">
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                className="glass-panel border-border shadow-2xl rounded-2xl p-6 space-y-6">

                <h3 className="text-base font-bold text-foreground pb-3 border-b border-border">Salary Profile</h3>

                {/* Net Monthly Salary */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-xs text-muted-foreground font-semibold">Net Monthly Salary (Take-Home)</Label>
                    <span className="text-sm font-bold text-foreground">{fmt(salary)}</span>
                  </div>
                  <Slider value={[salary]} min={15000} max={1000000} step={5000}
                    onValueChange={([v]) => setSalary(v)} className="mb-2" />
                  <Input type="number" value={salary} onChange={e => setSalary(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-surface border-border text-foreground text-xs h-9" />
                </div>

                {/* Existing Monthly EMIs */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-xs text-muted-foreground font-semibold">Existing EMIs / Card Bills</Label>
                    <span className="text-sm font-bold text-red-700 dark:text-red-400">{fmt(existingEmi)}</span>
                  </div>
                  <Slider value={[existingEmi]} min={0} max={Math.max(existingEmi, salary * 0.7)} step={1000}
                    onValueChange={([v]) => setExistingEmi(v)} className="mb-2" />
                  <Input type="number" value={existingEmi} onChange={e => setExistingEmi(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-surface border-border text-foreground text-xs h-9" />
                </div>

                {/* Employer category */}
                <div>
                  <Label className="text-xs text-muted-foreground font-semibold mb-2 block">Employer Category</Label>
                  <div className="space-y-2">
                    {CORPORATES.map(corp => (
                      <button key={corp.id} onClick={() => setCorpId(corp.id)}
                        className={`w-full text-left p-3 text-xs font-semibold rounded-lg border transition-all flex items-center justify-between ${corpId === corp.id ? 'bg-blue-600 border-blue-700 text-white': 'bg-white/5 border-white/10 text-muted-foreground hover:text-foreground'}`}>
                        <span>{corp.label}</span>
                        <Building2 className="w-4 h-4 shrink-0 opacity-70" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Geographic Location */}
                <div>
                  <Label className="text-xs text-muted-foreground font-semibold mb-2 block">City Class (Location)</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'tier1' as const, label: 'Metro (T1)' },
                      { id: 'tier2' as const, label: 'Urban (T2)' },
                      { id: 'tier3' as const, label: 'Rural (T3)' },
                    ].map(opt => (
                      <button key={opt.id} onClick={() => setLocation(opt.id)}
                        className={`py-2 text-[10px] font-semibold rounded-lg border transition-all ${location === opt.id ? 'bg-blue-600 border-blue-700 text-white': 'bg-white/5 border-white/10 text-muted-foreground hover:text-foreground'}`}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

              </motion.div>
            </div>

            {/* Right: Mapped Products Outputs */}
            <div className="lg:col-span-3 space-y-6">

              {/* EMI available banner */}
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                className="bg-gradient-to-br from-orange-500/15 via-orange-500/5 to-transparent border border-orange-500/30 shadow-2xl rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute top-4 right-4 bg-blue-500/20 text-blue-700 dark:text-blue-400 text-xs px-2.5 py-1 rounded-full flex items-center gap-1 font-semibold border border-blue-500/30">
                  <ShieldCheck className="w-3.5 h-3.5" /> High Trust Rules
                </div>

                <div className="text-center">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Available Monthly EMI Capacity</p>
                  <motion.div key={mapping.availableEmi} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    className="text-4xl md:text-5xl font-black text-foreground tracking-tight">
                    {fmt(mapping.availableEmi)}/mo
                  </motion.div>
                  <p className="text-xs text-muted-foreground mt-2">Employer: <strong className="text-foreground">{mapping.corporateLabel}</strong></p>
                </div>
              </motion.div>

              {/* Product eligibility mappings */}
              <div className="space-y-4">

                {/* Personal Loan Mapping */}
                <div className="glass-panel border-border shadow-2xl rounded-2xl p-6 flex items-center justify-between gap-6 hover:border-blue-500/20 transition-all">
                  <div>
                    <h4 className="text-base font-bold text-foreground mb-1">Personal Loan Mapped Eligibility</h4>
                    <p className="text-xs text-muted-foreground">Unsecured borrowing capacity mapped at {mapping.plEstimatedRate}% p.a.</p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-blue-700 dark:text-blue-400 block">{fmt(mapping.plMaxAmount)}</span>
                    <span className="text-[10px] text-muted-foreground">Max limit range</span>
                  </div>
                </div>

                {/* Home Loan Mapping */}
                <div className="glass-panel border-border shadow-2xl rounded-2xl p-6 flex items-center justify-between gap-6 hover:border-blue-500/20 transition-all">
                  <div>
                    <h4 className="text-base font-bold text-foreground mb-1">Home Loan Mapped Eligibility</h4>
                    <p className="text-xs text-muted-foreground">Home/Mortgage credit limits mapped at {mapping.hlEstimatedRate}% p.a.</p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-foreground block">{fmt(mapping.hlMaxAmount)}</span>
                    <span className="text-[10px] text-muted-foreground">Subject to property valuation</span>
                  </div>
                </div>

                {/* Auto Loan Mapping */}
                <div className="glass-panel border-border shadow-2xl rounded-2xl p-6 flex items-center justify-between gap-6 hover:border-blue-500/20 transition-all">
                  <div>
                    <h4 className="text-base font-bold text-foreground mb-1">Car Loan Mapped Eligibility</h4>
                    <p className="text-xs text-muted-foreground">Auto funding capability mapped at standard 8.9% rate.</p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-foreground block">{fmt(mapping.clMaxAmount)}</span>
                    <span className="text-[10px] text-muted-foreground">Based on on-road limits</span>
                  </div>
                </div>

              </div>

              {/* Predictor redirection */}
              <div className="bg-gradient-to-r from-orange-500/10 to-orange-600/10 border border-orange-500/20 rounded-2xl p-6">
                <h4 className="text-base font-bold text-foreground mb-2 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-orange-600 dark:text-orange-500" /> Run Pre-Approval Predictor Checks
                </h4>
                <p className="text-xs text-muted-foreground mb-4">Underwriters combine corporate mapping guidelines with detailed bank statements and CIBIL status. Run our comprehensive check now.</p>
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
