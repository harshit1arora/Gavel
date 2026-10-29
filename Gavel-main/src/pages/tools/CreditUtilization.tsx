import React, { useState, useMemo } from 'react';
import { Breadcrumbs } from '../../components/Breadcrumbs';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { Calculator, ArrowRight, Percent, ShieldAlert, CheckCircle2, AlertTriangle, Info, Plus, Trash2, CreditCard, Sparkles, Zap, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const fmt = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

interface CardItem {
  id: string;
  name: string;
  limit: number;
  balance: number;
}

const FAQS = [
  { q: 'What is Credit Utilization Ratio (CUR)?', a: 'Credit Utilization Ratio is the percentage of your total available credit card limits that you are currently using. It is calculated by dividing your total outstanding credit card balances by your total credit limits.' },
  { q: 'Why does credit utilization affect my CIBIL score?', a: 'CUR represents about 30% of your CIBIL score calculation. High utilization (above 30%) indicates to lenders that you are credit-hungry and potentially over-leveraged, raising your default risk.' },
  { q: 'What is the ideal credit utilization ratio?', a: 'Lenders and credit bureaus consider a credit utilization ratio of 10% to 30% to be ideal. Keeping it under 30% helps build and maintain a strong credit score.' },
  { q: 'How can I lower my Credit Utilization Ratio?', a: 'You can lower your CUR by: 1. Making partial or full payments before the official bill generation date. 2. Requesting your bank to increase your credit card limit. 3. Spreading expenses across multiple cards. 4. Availing new credit cards but keeping spending low.' },
  { q: 'Does utilization reset every month?', a: 'Yes. Credit card companies report your outstanding balance to CIBIL once a month (usually on the bill generation date). Once your new balance is reported, your CUR updates accordingly.' },
];

export default function CreditUtilization() {
  const navigate = useNavigate();

  // Initial card list state
  const [cards, setCards] = useState<CardItem[]>([
    { id: '1', name: 'Primary HDFC Card', limit: 150000, balance: 45000 },
    { id: '2', name: 'ICICI Amazon Pay', limit: 100000, balance: 15000 },
  ]);

  // Form input state for adding a new card
  const [newCardName, setNewCardName] = useState('');
  const [newCardLimit, setNewCardLimit] = useState<number | ''>('');
  const [newCardBalance, setNewCardBalance] = useState<number | ''>('');

  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  // Add Card handler
  const handleAddCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCardName.trim() || !newCardLimit || newCardLimit <= 0) return;
    const balanceVal = typeof newCardBalance === 'number' ? newCardBalance : 0;
    
    const newCard: CardItem = {
      id: Date.now().toString(),
      name: newCardName,
      limit: newCardLimit,
      balance: Math.min(newCardLimit, balanceVal),
    };

    setCards([...cards, newCard]);
    setNewCardName('');
    setNewCardLimit('');
    setNewCardBalance('');
  };

  // Remove Card handler
  const handleRemoveCard = (id: string) => {
    setCards(cards.filter(c => c.id !== id));
  };

  // Update card balance handler
  const handleUpdateBalance = (id: string, newBal: number) => {
    setCards(cards.map(c => {
      if (c.id === id) {
        return { ...c, balance: Math.min(c.limit, Math.max(0, newBal)) };
      }
      return c;
    }));
  };

  // Aggregated calculations
  const analysis = useMemo(() => {
    const totalLimit = cards.reduce((sum, c) => sum + c.limit, 0);
    const totalBalance = cards.reduce((sum, c) => sum + c.balance, 0);
    const cur = totalLimit > 0 ? Math.round((totalBalance / totalLimit) * 100) : 0;

    let scoreImpact = 'Neutral';
    let status = 'Good';
    let colorClass = 'text-green-400';
    let barColor = 'bg-green-500';
    let desc = '';

    if (cur <= 10) {
      scoreImpact = 'High positive impact (+20 to +40 pts)';
      status = 'Excellent';
      colorClass = 'text-emerald-400';
      barColor = 'bg-emerald-500';
      desc = 'Ideal credit behaviour. Lenders view you as highly responsible with minimal reliance on debt.';
    } else if (cur <= 30) {
      scoreImpact = 'Mild positive impact (+10 to +20 pts)';
      status = 'Good';
      colorClass = 'text-green-400';
      barColor = 'bg-green-500';
      desc = 'Standard healthy range. Keep doing this to build a reliable credit history.';
    } else if (cur <= 50) {
      scoreImpact = 'Mild negative impact (-10 to -25 pts)';
      status = 'Average';
      colorClass = 'text-yellow-400';
      barColor = 'bg-yellow-500';
      desc = 'Entering warning zone. Try clearing outstanding balances early to stay under 30%.';
    } else if (cur <= 70) {
      scoreImpact = 'High negative impact (-30 to -60 pts)';
      status = 'High';
      colorClass = 'text-orange-400';
      barColor = 'bg-orange-500';
      desc = 'Negative impact on score. Indicates potential cash flow constraints or over-reliance on credit.';
    } else {
      scoreImpact = 'Severe negative impact (-60 to -100 pts)';
      status = 'Critical';
      colorClass = 'text-red-400';
      barColor = 'bg-red-500';
      desc = 'Very high risk of credit score degradation. Strongly recommend making an immediate payment to reduce card usage.';
    }

    return {
      totalLimit,
      totalBalance,
      cur,
      scoreImpact,
      status,
      colorClass,
      barColor,
      desc,
    };
  }, [cards]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-orange-500/30 overflow-x-hidden">
      <Helmet>
        <title>Credit Card Utilization Ratio Checker | Gavel AI</title>
        <meta name="description" content="Check your Credit Card Utilization Ratio (CUR). Calculate total available credit limit versus current outstanding balances to estimate the impact on your CIBIL score." />
        <link rel="canonical" href="https://www.trygavel.com/tools/credit-utilization" />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org', '@type': 'WebApplication',
          name: 'Credit Card Utilization Ratio Checker', applicationCategory: 'FinanceApplication',
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
            { label: 'Credit Utilization Checker', path: '/tools/credit-utilization' }
          ]} />

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
            <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 text-orange-700 dark:text-orange-400 text-sm mb-4 px-4 py-1.5 rounded-full backdrop-blur-sm">
              <Percent className="w-4 h-4 text-purple-700 dark:text-purple-400" />
              <span className="text-sm font-medium text-purple-700 dark:text-purple-400">Credit Score Optimizer</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">Credit Utilization Checker</h1>
            <p className="text-lg text-muted-foreground max-w-2xl">Find out how your credit card spending habits affect your credit health. Optimize card utilization to protect and build your CIBIL score.</p>
          </motion.div>

          <div className="grid lg:grid-cols-5 gap-8">
            {/* Left Column: Card Manager */}
            <div className="lg:col-span-3 space-y-6">
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                className="glass-panel border-border shadow-2xl rounded-2xl p-6 space-y-6">
                
                <div className="flex items-center justify-between pb-4 border-b border-border">
                  <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-purple-700 dark:text-purple-400" /> Your Credit Cards
                  </h3>
                  <span className="text-xs text-muted-foreground">{cards.length} active cards listed</span>
                </div>

                {/* Card List */}
                {cards.length === 0 ? (
                  <div className="text-center py-8 bg-surface border border-dashed border-border rounded-xl">
                    <p className="text-sm text-muted-foreground">No cards registered. Please add a credit card below.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cards.map(c => {
                      const cur = c.limit > 0 ? Math.round((c.balance / c.limit) * 100) : 0;
                      return (
                        <div key={c.id} className="p-4 bg-surface border border-border rounded-xl relative group transition-all hover:border-purple-500/20">
                          <button onClick={() => handleRemoveCard(c.id)} className="absolute top-4 right-4 text-muted-foreground hover:text-red-700 dark:hover:text-red-400 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                          
                          <p className="font-semibold text-foreground text-sm mb-1">{c.name}</p>
                          <div className="flex justify-between text-xs text-muted-foreground mb-2">
                            <span>Limit: {fmt(c.limit)}</span>
                            <span>Outstanding: {fmt(c.balance)} ({cur}%)</span>
                          </div>

                          <div className="flex items-center gap-4">
                            <Slider value={[c.balance]} min={0} max={c.limit} step={500}
                              onValueChange={([v]) => handleUpdateBalance(c.id, v)} className="flex-1" />
                            <Input type="number" value={c.balance} onChange={e => handleUpdateBalance(c.id, parseInt(e.target.value) || 0)}
                              className="w-24 h-8 bg-surface border-border text-right text-xs text-foreground" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Add New Card Form */}
                <form onSubmit={handleAddCard} className="bg-surface border border-border rounded-xl p-4 space-y-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Add Card</p>
                  <div className="grid md:grid-cols-3 gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1.5 block">Card Name</Label>
                      <Input placeholder="e.g. Amazon ICICI" value={newCardName} onChange={e => setNewCardName(e.target.value)}
                        className="bg-[#050505] border-border text-foreground text-xs h-9" />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1.5 block">Credit Limit (₹)</Label>
                      <Input type="number" placeholder="Limit" value={newCardLimit} onChange={e => setNewCardLimit(parseInt(e.target.value) || '')}
                        className="bg-[#050505] border-border text-foreground text-xs h-9" />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1.5 block">Current Outstanding (₹)</Label>
                      <Input type="number" placeholder="Outstanding" value={newCardBalance} onChange={e => setNewCardBalance(parseInt(e.target.value) || '')}
                        className="bg-[#050505] border-border text-foreground text-xs h-9" />
                    </div>
                  </div>
                  <Button type="submit" size="sm" className="bg-purple-600 hover:bg-purple-500 text-foreground w-full h-9 font-semibold flex items-center gap-1.5">
                    <Plus className="w-4 h-4" /> Add Credit Card
                  </Button>
                </form>

              </motion.div>
            </div>

            {/* Right Column: Aggregated Analysis */}
            <div className="lg:col-span-2 space-y-6">
              {/* CUR Ratio Score Panel */}
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                className="bg-gradient-to-br from-orange-500/15 via-orange-500/5 to-transparent border border-orange-500/30 shadow-2xl rounded-2xl p-6 space-y-6">
                
                <div className="text-center">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Total Credit Utilization</p>
                  <motion.div key={analysis.cur} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    className={`text-6xl font-black tracking-tight ${analysis.colorClass}`}>
                    {analysis.cur}%
                  </motion.div>
                  <p className="text-xs text-muted-foreground mt-2">Overall Status: <strong className="text-foreground">{analysis.status}</strong></p>
                </div>

                {/* Progress Bar */}
                <div>
                  <div className="h-3 bg-surface rounded-full overflow-hidden flex">
                    <div className={`h-full ${analysis.barColor}`} style={{ width: `${Math.min(100, analysis.cur)}%` }} />
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground mt-1.5">
                    <span>Excellent (&lt;10%)</span>
                    <span>Good (10-30%)</span>
                    <span>High (&gt;30%)</span>
                  </div>
                </div>

                {/* Detailed Analysis Output */}
                <div className="bg-surface p-4 rounded-xl border border-border space-y-3">
                  <div>
                    <span className="text-xs text-muted-foreground block">Total Credit Limit</span>
                    <span className="text-sm font-bold text-foreground">{fmt(analysis.totalLimit)}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">Total Outstanding Balance</span>
                    <span className="text-sm font-bold text-foreground">{fmt(analysis.totalBalance)}</span>
                  </div>
                  <div className="pt-2.5 border-t border-border">
                    <span className="text-xs text-muted-foreground block mb-1">Estimated Credit Score Impact</span>
                    <span className="text-xs font-semibold text-purple-700 dark:text-purple-400">{analysis.scoreImpact}</span>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed text-center italic">{analysis.desc}</p>
              </motion.div>

              {/* Action Plan Suggestions */}
              <div className="bg-surface border border-border rounded-2xl p-6 space-y-4">
                <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                  <Sparkles className="w-4.5 h-4.5 text-purple-700 dark:text-purple-400" /> Action Steps to Lower Utilization
                </h4>
                <ul className="space-y-3 text-xs text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-700 dark:text-purple-400 shrink-0 mt-0.5" />
                    <span><strong>Pre-bill payments</strong>: Pay balances down 5 days before your official statement statement dates.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-700 dark:text-purple-400 shrink-0 mt-0.5" />
                    <span><strong>Request Limit Increase</strong>: Ask your banks to raise your limits without hard credit checks.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-700 dark:text-purple-400 shrink-0 mt-0.5" />
                    <span><strong>Spend Optimization</strong>: Distribute monthly expenses across cards rather than maxing out a single card.</span>
                  </li>
                </ul>
              </div>

              {/* Advanced pre-approval hook */}
              <div className="bg-gradient-to-r from-orange-500/10 to-orange-600/10 border border-orange-500/20 rounded-2xl p-6">
                <h4 className="text-base font-bold text-foreground mb-2 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-orange-600 dark:text-orange-500" /> Check Detailed Credit Status
                </h4>
                <p className="text-xs text-muted-foreground mb-4">Underwriting checks evaluate utilization along with transaction flows, EMIs, and age profiles. Run a fast prediction simulation check now.</p>
                <Button onClick={() => navigate('/loan-approval-predictor')} className="bg-orange-500 hover:bg-orange-600 text-white w-full py-4 text-sm font-bold">
                  Predict Approval Probability <ArrowRight className="w-4 h-4 ml-2" />
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
