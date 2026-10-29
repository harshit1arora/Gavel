import React, { useState, useMemo } from 'react';
import { Breadcrumbs } from '../../components/Breadcrumbs';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { Calculator, ArrowRight, IndianRupee, Percent, ShieldCheck, ChevronDown, ChevronUp, Zap, Sparkles, HelpCircle, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const fmt = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const FAQS = [
  { q: 'Why is credit card interest so high in India?', a: 'Credit cards are unsecured revolving credit lines with high default rates. Indian credit cards charge APRs between 36% to 45% (3% to 3.75% per month), making it the most expensive form of consumer debt.' },
  { q: 'What is the "Minimum Amount Due" trap?', a: 'Paying only the Minimum Amount Due (typically 5% of outstanding balance) prevents late payment fees and CIBIL drops, but the remaining 95% balance continues to accrue interest at 40%+ APR. It can take up to 20-30 years to clear a small balance this way.' },
  { q: 'What is the Debt snowball method?', a: 'The snowball method involves paying off your credit cards in order of smallest balance first, while paying minimums on others. This builds quick psychological wins as card accounts close.' },
  { q: 'Does credit card debt affect my CIBIL score?', a: 'Yes. Carrying high credit card balances increases your credit utilization ratio (CUR). Keeping your CUR above 30% indicates credit hunger and directly lowers your CIBIL score.' },
  { q: 'Can I convert credit card debt into a personal loan?', a: 'Yes. Refinancing credit card debt with a personal loan at 11-15% interest is highly recommended. It immediately replaces 40%+ interest with a lower fixed rate, lowering your monthly interest burden.' }
];

export default function CreditCardDebtPayoff() {
  const navigate = useNavigate();

  // Inputs
  const [balance, setBalance] = useState(150000);
  const [interestRate, setInterestRate] = useState(38); // APR
  const [minPaymentPercent, setMinPaymentPercent] = useState(5); // 5% minimum
  const [monthlyBudget, setMonthlyBudget] = useState(15000); // monthly budget payoff

  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  // Calculations
  const calculations = useMemo(() => {
    const monthlyRate = interestRate / 12 / 100;
    
    // 1. Calculate Minimum Payment Scenario
    let minBalance = balance;
    let minTotalPaid = 0;
    let minTotalInterest = 0;
    let minMonths = 0;
    let isMinDebtTrap = false;

    // Simulate up to 600 months (50 years)
    for (let m = 1; m <= 600; m++) {
      if (minBalance <= 0) break;
      minMonths++;

      const interest = minBalance * monthlyRate;
      minTotalInterest += interest;

      // Minimum payment is 5% of balance or ₹500 minimum
      let payment = Math.max(500, Math.round(minBalance * (minPaymentPercent / 100)));
      if (payment > minBalance + interest) {
        payment = minBalance + interest;
      }

      if (payment <= interest && minBalance > 0) {
        isMinDebtTrap = true;
        break;
      }

      minTotalPaid += payment;
      minBalance = Math.max(0, minBalance + interest - payment);
    }

    // 2. Calculate Budget Payoff Scenario
    let budgetBalance = balance;
    let budgetTotalPaid = 0;
    let budgetTotalInterest = 0;
    let budgetMonths = 0;
    let isBudgetDebtTrap = false;

    for (let m = 1; m <= 600; m++) {
      if (budgetBalance <= 0) break;
      budgetMonths++;

      const interest = budgetBalance * monthlyRate;
      budgetTotalInterest += interest;

      let payment = monthlyBudget;
      if (payment > budgetBalance + interest) {
        payment = budgetBalance + interest;
      }

      if (payment <= interest && budgetBalance > 0) {
        isBudgetDebtTrap = true;
        break;
      }

      budgetTotalPaid += payment;
      budgetBalance = Math.max(0, budgetBalance + interest - payment);
    }

    const interestSaved = Math.max(0, minTotalInterest - budgetTotalInterest);
    const monthsSaved = Math.max(0, minMonths - budgetMonths);

    return {
      minMonths,
      minTotalInterest,
      minTotalPaid,
      isMinDebtTrap,
      budgetMonths,
      budgetTotalInterest,
      budgetTotalPaid,
      isBudgetDebtTrap,
      interestSaved,
      monthsSaved,
    };
  }, [balance, interestRate, minPaymentPercent, monthlyBudget]);

  const startingMinPayment = Math.max(500, Math.round(balance * (minPaymentPercent / 100)));
  const isBudgetTooLow = monthlyBudget <= (balance * (interestRate / 12 / 100));

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-orange-500/30 overflow-x-hidden">
      <Helmet>
        <title>Credit Card Debt Payoff Calculator | Gavel AI</title>
        <meta name="description" content="Simulate credit card payoff strategies. Compare paying minimum due vs an optimized fixed budget to escape high-interest debt traps." />
        <link rel="canonical" href="https://www.trygavel.com/tools/credit-card-debt-payoff" />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org', '@type': 'WebApplication',
          name: 'Credit Card Payoff Calculator', applicationCategory: 'FinanceApplication',
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
            { label: 'Credit Card Debt Payoff', path: '/tools/credit-card-debt-payoff' }
          ]} />

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
            <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 text-orange-700 dark:text-orange-400 text-sm mb-4 px-4 py-1.5 rounded-full backdrop-blur-sm">
              <AlertTriangle className="w-4 h-4 text-red-700 dark:text-red-400" />
              <span className="text-sm font-medium text-red-700 dark:text-red-400">Debt Relief Tool</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">Credit Card Payoff Calculator</h1>
            <p className="text-lg text-muted-foreground max-w-2xl">Escape the high-interest credit card cycle. Compare minimum payment schedules against structured payoffs to calculate your interest savings.</p>
          </motion.div>

          <div className="grid lg:grid-cols-5 gap-8">
            {/* Left: Input sliders */}
            <div className="lg:col-span-2 space-y-6">
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                className="glass-panel border-border shadow-2xl rounded-2xl p-6 space-y-6">
                
                {/* Credit Card Balance */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-xs text-muted-foreground font-semibold">Total Credit Card Balance</Label>
                    <span className="text-sm font-bold text-foreground">{fmt(balance)}</span>
                  </div>
                  <Slider value={[balance]} min={5000} max={2500000} step={5000}
                    onValueChange={([v]) => setBalance(v)} className="mb-2" />
                  <Input type="number" value={balance} onChange={e => setBalance(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-surface border-border text-foreground text-xs h-9" />
                </div>

                {/* Annual Interest Rate (APR) */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-xs text-muted-foreground font-semibold">Annual Interest Rate (APR)</Label>
                    <span className="text-sm font-bold text-red-700 dark:text-red-400">{interestRate}% p.a.</span>
                  </div>
                  <Slider value={[interestRate]} min={12} max={48} step={1}
                    onValueChange={([v]) => setInterestRate(v)} className="mb-2" />
                </div>

                {/* Minimum Payment Percentage */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-xs text-muted-foreground font-semibold">Minimum Payment Ratio</Label>
                    <span className="text-sm font-bold text-foreground">{minPaymentPercent}% of balance</span>
                  </div>
                  <Slider value={[minPaymentPercent]} min={3} max={10} step={0.5}
                    onValueChange={([v]) => setMinPaymentPercent(v)} className="mb-2" />
                </div>

                {/* Monthly Payoff Budget */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-xs text-muted-foreground font-semibold">Your Monthly Payoff Budget</Label>
                    <span className="text-sm font-bold text-green-700 dark:text-green-400">{fmt(monthlyBudget)}/mo</span>
                  </div>
                  <Slider value={[monthlyBudget]} min={startingMinPayment} max={Math.min(balance, 100000)} step={500}
                    onValueChange={([v]) => setMonthlyBudget(v)} className="mb-2" />
                  <Input type="number" value={monthlyBudget} onChange={e => setMonthlyBudget(Math.max(startingMinPayment, parseInt(e.target.value) || startingMinPayment))}
                    className="w-full bg-surface border-border text-foreground text-xs h-9" />
                </div>

              </motion.div>

              {/* Debt Trap Alert warning */}
              {isBudgetTooLow && (
                <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-red-700 dark:text-red-400 shrink-0 mt-0.5" />
                  <div className="text-[11px] text-muted-foreground leading-relaxed">
                    <p className="font-semibold text-red-700 dark:text-red-400 mb-0.5">Negative Amortization Alert</p>
                    Your monthly budget is below the monthly interest charge of {fmt(balance * interestRate / 12 / 100)}. Your balance will grow indefinitely. Please increase your payoff budget.
                  </div>
                </div>
              )}
            </div>

            {/* Right: Results Analysis */}
            <div className="lg:col-span-3 space-y-6">
              
              {/* Savings display card */}
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                className="bg-gradient-to-br from-orange-500/15 via-orange-500/5 to-transparent border border-orange-500/30 shadow-2xl rounded-2xl p-8 relative overflow-hidden">
                <div className="absolute top-4 right-4 bg-red-500/20 text-red-700 dark:text-red-400 text-xs px-2.5 py-1 rounded-full flex items-center gap-1 font-semibold border border-red-500/30">
                  <ShieldCheck className="w-3.5 h-3.5" /> High Trust Rules
                </div>

                <div className="text-center mb-6">
                  <p className="text-sm text-muted-foreground mb-2">Estimated Interest Saved</p>
                  <motion.div key={calculations.interestSaved} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    className="text-5xl md:text-6xl font-black text-foreground tracking-tight">
                    {fmt(calculations.interestSaved)}
                  </motion.div>
                  <p className="text-xs text-muted-foreground mt-2">By paying a fixed budget of {fmt(monthlyBudget)} instead of only minimums</p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                  <div className="bg-surface p-4 rounded-xl">
                    <p className="text-xs text-muted-foreground mb-1">Time Saved</p>
                    <p className="text-lg font-bold text-foreground">
                      {calculations.minMonths > 0 
                        ? `${Math.floor(calculations.monthsSaved / 12)} Yrs ${calculations.monthsSaved % 12} Mo`
                        : '0 Months'}
                    </p>
                  </div>
                  <div className="bg-surface p-4 rounded-xl">
                    <p className="text-xs text-muted-foreground mb-1">Time to Payoff</p>
                    <p className="text-lg font-bold text-green-700 dark:text-green-400">
                      {Math.floor(calculations.budgetMonths / 12)} Yrs {calculations.budgetMonths % 12} Mo
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Side by side comparison */}
              <div className="glass-panel border-border shadow-2xl rounded-2xl p-6 space-y-4">
                <h3 className="text-sm font-bold text-foreground">Payoff Strategies Compared</h3>
                
                <div className="grid md:grid-cols-2 gap-4 text-xs">
                  <div className="bg-surface p-4 rounded-xl space-y-2.5">
                    <p className="font-semibold text-muted-foreground pb-1 border-b border-border">Paying Minimum Due Only</p>
                    <div className="flex justify-between">
                      <span>Total Paid:</span>
                      <span className="font-bold text-foreground">
                        {calculations.isMinDebtTrap ? 'Infinite (Debt Trap)' : fmt(calculations.minTotalPaid)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Interest:</span>
                      <span className="font-bold text-red-700 dark:text-red-400">
                        {calculations.isMinDebtTrap ? 'Infinite' : fmt(calculations.minTotalInterest)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Payoff Duration:</span>
                      <span className="font-bold text-foreground">
                        {calculations.isMinDebtTrap ? 'Never pays off' : `${Math.floor(calculations.minMonths / 12)} Yrs`}
                      </span>
                    </div>
                  </div>

                  <div className="bg-green-500/5 p-4 rounded-xl border border-green-500/10 space-y-2.5">
                    <p className="font-semibold text-green-700 dark:text-green-400 pb-1 border-b border-green-500/10">Fixed Monthly Budget</p>
                    <div className="flex justify-between">
                      <span>Total Paid:</span>
                      <span className="font-bold text-foreground">{fmt(calculations.budgetTotalPaid)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Interest:</span>
                      <span className="font-bold text-green-700 dark:text-green-400">{fmt(calculations.budgetTotalInterest)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Payoff Duration:</span>
                      <span className="font-bold text-foreground">
                        {Math.floor(calculations.budgetMonths / 12)} Yrs {calculations.budgetMonths % 12} Mo
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Refinancing option details */}
              <div className="bg-gradient-to-r from-orange-500/10 to-orange-600/10 border border-orange-500/20 rounded-2xl p-6">
                <h4 className="text-base font-bold text-foreground mb-2 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-orange-600 dark:text-orange-500" /> Convert Card Debt into Personal Loan
                </h4>
                <p className="text-xs text-muted-foreground mb-4">Unsecured personal loans offer interest rates of 11-15% p.a. converting credit card balances at 40% immediately saves up to 70% in monthly interest charges. Run pre-approval checks now.</p>
                <Button onClick={() => navigate('/loan-approval-predictor')} className="bg-orange-500 hover:bg-orange-600 text-white w-full py-4 text-sm font-bold">
                  Check Personal Loan Eligibility <ArrowRight className="w-4 h-4 ml-2" />
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
