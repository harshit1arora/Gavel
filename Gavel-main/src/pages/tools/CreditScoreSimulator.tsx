import React, { useState, useMemo } from 'react';
import { Breadcrumbs } from '../../components/Breadcrumbs';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { Calculator, ArrowRight, ShieldCheck, HelpCircle, ChevronDown, ChevronUp, Zap, Sparkles, Sliders, Play, TrendingUp, AlertTriangle, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';

const FAQS = [
  { q: 'What is a credit score simulator?', a: 'A credit score simulator is an interactive tool that estimates how specific financial actions, such as paying off debt, missing an EMI, or applying for new credit cards, could impact your credit score (CIBIL score).' },
  { q: 'How accurate is this credit simulator?', a: 'This simulator uses the standard credit scoring weightages followed by TransUnion CIBIL, Experian, and Equifax (35% payment history, 30% utilization, 15% history length, 10% credit mix, 10% inquiries). While it provides a highly reliable estimate, actual changes depend on your complete credit history.' },
  { q: 'Why does closing an old credit card drop my score?', a: 'Closing your oldest credit card reduces the average age of your credit history. Length of credit history accounts for 15% of your credit score; a longer history demonstrates stability and lowers risk for lenders.' },
  { q: 'What is the fastest way to increase my CIBIL score?', a: 'The fastest ways are: 1. Reducing your credit utilization ratio to under 10% by paying credit card bills early. 2. Resolving any past-due defaults. 3. Avoiding multiple credit inquiries within a short period.' },
  { q: 'How long does it take for a missed payment to stop affecting my score?', a: 'A missed payment is reported to credit bureaus within 30-45 days and can cause an immediate drop. Its negative impact gradually decreases over 12-24 months as you build a record of consecutive on-time payments.' }
];

interface SimulationScenario {
  id: string;
  category: 'payment' | 'utilization' | 'inquiry' | 'mix';
  label: string;
  points: number; // positive or negative adjustment
  description: string;
}

const SCENARIOS: SimulationScenario[] = [
  // Payment History (35% weight)
  { id: 'miss-1-emi', category: 'payment', label: 'Miss 1 EMI Payment (>30 days late)', points: -55, description: 'Lenders report 30+ days past due to bureaus. This signals immediate repayment stress.' },
  { id: 'miss-3-emi', category: 'payment', label: 'Miss 3+ EMI Payments (Write-off risk)', points: -120, description: 'Triggers a severe default flag on your credit file. Strongly suggests a debt trap.' },
  { id: 'ontime-6mo', category: 'payment', label: 'Pay all EMIs on-time for 6 consecutive months', points: 25, description: 'Rebuilds payment reliability and demonstrates consistent credit behavior.' },
  { id: 'ontime-12mo', category: 'payment', label: 'Pay all EMIs on-time for 12 consecutive months', points: 55, description: 'Significantly strengthens your credit file, counterbalancing past minor delays.' },

  // Utilization (30% weight)
  { id: 'pay-all-cards', category: 'utilization', label: 'Pay off credit card balances entirely (CUR < 10%)', points: 45, description: 'Drastically reduces your credit dependency, yielding an immediate score boost.' },
  { id: 'max-out-card', category: 'utilization', label: 'Max out one or more credit cards (CUR > 90%)', points: -75, description: 'Indicates high credit hunger and cash flow strain, lowering your score.' },

  // Inquiries (10% weight)
  { id: 'apply-5-loans', category: 'inquiry', label: 'Apply for 5 credit cards/loans in a single month', points: -35, description: 'Creates 5 hard inquiries. Multi-applying signals high risk to underwriters.' },
  { id: 'no-inq-6mo', category: 'inquiry', label: 'No credit applications or inquiries for 6 months', points: 12, description: 'Helps your credit profile cool down after a period of active borrowing.' },

  // Mix & Age (25% weight)
  { id: 'close-old-card', category: 'mix', label: 'Close your oldest active credit card', points: -30, description: 'Lowers your average credit history age, which makes your profile look newer and riskier.' },
  { id: 'add-secured-mix', category: 'mix', label: 'Add a secured loan (Home/Gold loan) to card mix', points: 15, description: 'Improves your credit mix by demonstrating you can manage both secured and revolving credit.' }
];

export default function CreditScoreSimulator() {
  const navigate = useNavigate();

  const [currentScore, setCurrentScore] = useState(720);
  const [selectedScenarios, setSelectedScenarios] = useState<string[]>([]);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  // Toggle scenario selection
  const handleToggleScenario = (id: string) => {
    if (selectedScenarios.includes(id)) {
      setSelectedScenarios(selectedScenarios.filter(sid => sid !== id));
    } else {
      setSelectedScenarios([...selectedScenarios, id]);
    }
  };

  // Calculations
  const simulation = useMemo(() => {
    let pointChange = 0;

    selectedScenarios.forEach(sid => {
      const scenario = SCENARIOS.find(s => s.id === sid);
      if (scenario) {
        pointChange += scenario.points;
      }
    });

    const simulatedScore = Math.min(900, Math.max(300, currentScore + pointChange));

    const getScoreTier = (score: number) => {
      if (score >= 750) return { label: 'Excellent', colorClass: 'text-emerald-400', barColor: 'bg-emerald-500' };
      if (score >= 700) return { label: 'Good', colorClass: 'text-green-400', barColor: 'bg-green-500' };
      if (score >= 650) return { label: 'Average', colorClass: 'text-yellow-400', barColor: 'bg-yellow-500' };
      return { label: 'Poor', colorClass: 'text-red-400', barColor: 'bg-red-500' };
    };

    const currentTier = getScoreTier(currentScore);
    const simulatedTier = getScoreTier(simulatedScore);

    return {
      simulatedScore,
      pointChange,
      currentTier,
      simulatedTier,
    };
  }, [currentScore, selectedScenarios]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-orange-500/30 overflow-x-hidden">
      <Helmet>
        <title>Free Credit Score Simulator: Check Your Loan Eligibility in 30 Seconds | Gavel AI</title>
        <meta name="description" content="Find out how credit inquiries, paying off cards, or missed payments will impact your CIBIL score. Free simulator helps you maximize your loan approval chances." />
        <link rel="canonical" href="https://www.trygavel.com/tools/credit-score-simulator" />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org', '@type': 'WebApplication',
          name: 'Credit Score Simulator', applicationCategory: 'FinanceApplication',
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
            { label: 'Credit Score Simulator', path: '/tools/credit-score-simulator' }
          ]} />

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
            <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 text-orange-700 dark:text-orange-400 text-sm mb-4 px-4 py-1.5 rounded-full backdrop-blur-sm">
              <Sliders className="w-4 h-4 text-purple-700 dark:text-purple-400" />
              <span className="text-sm font-medium text-purple-700 dark:text-purple-400">CIBIL Score Tool</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">Credit Score Simulator</h1>
            <p className="text-lg text-muted-foreground max-w-2xl">Understand the exact drivers of credit scores. Select scenarios below to simulate points added or subtracted from your CIBIL profile.</p>
          </motion.div>

          <div className="grid lg:grid-cols-5 gap-8">
            {/* Left: Input score & Scenarios */}
            <div className="lg:col-span-3 space-y-6">

              {/* Current Score Selector */}
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                className="glass-panel border-border shadow-2xl rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-bold text-muted-foreground">Select Your Current Credit Score</Label>
                  <span className="text-2xl font-black text-foreground">{currentScore}</span>
                </div>
                <Slider value={[currentScore]} min={300} max={900} step={5}
                  onValueChange={([v]) => setCurrentScore(v)} className="mb-2" />
                <div className="flex justify-between text-[10px] text-muted-foreground font-semibold">
                  <span>300 (Poor)</span>
                  <span>650 (Fair)</span>
                  <span>750 (Excellent)</span>
                  <span>900 (Max)</span>
                </div>
              </motion.div>

              {/* Scenarios Panel */}
              <div className="glass-panel border-border shadow-2xl rounded-2xl p-6 space-y-4">
                <h3 className="text-base font-bold text-foreground pb-3 border-b border-border flex items-center justify-between">
                  <span>Select Simulation Scenarios</span>
                  <span className="text-xs text-muted-foreground font-normal">{selectedScenarios.length} selected</span>
                </h3>

                <div className="space-y-3">
                  {SCENARIOS.map(sc => {
                    const isSelected = selectedScenarios.includes(sc.id);
                    const isNegative = sc.points < 0;
                    return (
                      <button key={sc.id} onClick={() => handleToggleScenario(sc.id)}
                        className={`w-full text-left p-4 rounded-xl border transition-all flex items-start gap-4 ${isSelected ? 'bg-white/5 border-purple-500/40': 'bg-transparent border-white/5 hover:border-white/10'}`}>
                        <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 border mt-0.5 ${isSelected ? 'bg-purple-600 border-purple-700 text-white': 'border-white/20 text-transparent'}`}>
                          ✓
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-foreground leading-tight">{sc.label}</span>
                            <span className={`text-xs font-black shrink-0 flex items-center gap-0.5 ${isNegative ? 'text-red-400': 'text-green-400'}`}>
                              {isNegative ? <ArrowDownRight className="w-3.5 h-3.5" />: <ArrowUpRight className="w-3.5 h-3.5" />}
                              {Math.abs(sc.points)} pts
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{sc.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right: Simulation Output */}
            <div className="lg:col-span-2 space-y-6">

              {/* Speedometer Result card */}
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                className="bg-gradient-to-br from-orange-500/15 via-orange-500/5 to-transparent border border-orange-500/30 shadow-2xl rounded-2xl p-6 space-y-6 text-center">
                <div className="absolute top-4 right-4 bg-purple-500/20 text-purple-700 dark:text-purple-400 text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 font-bold border border-purple-500/30">
                  <ShieldCheck className="w-3 h-3" /> Rule Based
                </div>

                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Simulated Score Forecast</p>
                  <motion.div key={simulation.simulatedScore} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    className={`text-6xl font-black tracking-tight ${simulation.simulatedTier.colorClass}`}>
                    {simulation.simulatedScore}
                  </motion.div>
                  <p className="text-xs text-muted-foreground mt-2">Class: <strong className="text-foreground">{simulation.simulatedTier.label}</strong></p>
                </div>

                {/* Score delta indicator */}
                <div className="flex items-center justify-center gap-2 py-2 px-4 bg-surface rounded-xl max-w-[200px] mx-auto">
                  <span className="text-xs text-muted-foreground">Net Change:</span>
                  <span className={`text-sm font-black flex items-center gap-0.5 ${simulation.pointChange < 0 ? 'text-red-400': simulation.pointChange > 0 ? 'text-green-400': 'text-muted-foreground'}`}>
                    {simulation.pointChange > 0 ? '+': ''}{simulation.pointChange} Points
                  </span>
                </div>

                {/* Comparative details */}
                <div className="text-left text-xs bg-surface p-4 rounded-xl border border-border space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Current Score:</span>
                    <span className="font-semibold text-foreground">{currentScore} ({simulation.currentTier.label})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Simulated Score:</span>
                    <span className="font-semibold text-foreground">{simulation.simulatedScore} ({simulation.simulatedTier.label})</span>
                  </div>
                </div>
              </motion.div>

              {/* Score Weightages */}
              <div className="glass-panel border-border shadow-2xl rounded-2xl p-6 space-y-4">
                <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                  <Sparkles className="w-4.5 h-4.5 text-purple-700 dark:text-purple-400" /> Credit Bureau Calculation Weightages
                </h4>
                <div className="space-y-3 text-xs">
                  {[
                    { label: 'Payment History (EMIs/Cards on-time)', weight: 35, color: 'bg-emerald-500' },
                    { label: 'Amounts Owed (Credit Utilization CUR)', weight: 30, color: 'bg-blue-500' },
                    { label: 'Length of Credit History (Age of accounts)', weight: 15, color: 'bg-purple-500' },
                    { label: 'Credit Inquiries (Applications in 30 days)', weight: 10, color: 'bg-yellow-500' },
                    { label: 'Credit Mix (Secured vs Revolving mix)', weight: 10, color: 'bg-pink-500' }
                  ].map((w, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-[11px] text-muted-foreground">
                        <span>{w.label}</span>
                        <span className="font-semibold text-foreground">{w.weight}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-surface overflow-hidden">
                        <div className={`h-full ${w.color}`} style={{ width: `${w.weight}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Predictor link hook */}
              <div className="bg-gradient-to-r from-orange-500/10 to-orange-600/10 border border-orange-500/20 rounded-2xl p-6">
                <h4 className="text-base font-bold text-foreground mb-2 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-orange-600 dark:text-orange-500" /> Get Approved Today
                </h4>
                <p className="text-xs text-muted-foreground mb-4">Underwriting guidelines check your actual bank statements alongside credit files. Run a comprehensive prediction simulation now.</p>
                <Button onClick={() => navigate('/loan-approval-predictor')} className="bg-orange-500 hover:bg-orange-600 text-white w-full py-4 text-sm font-bold">
                  Analyze Odds <ArrowRight className="w-4 h-4 ml-2" />
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
