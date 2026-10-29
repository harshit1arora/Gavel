import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Breadcrumbs } from '../components/Breadcrumbs';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calculator, CheckCircle2, AlertCircle, ShieldCheck, Zap, ArrowRight, Activity, IndianRupee, RefreshCcw, Upload as UploadIcon, Brain, Lock, FileText, BarChart3, TrendingUp, Star, Users, HelpCircle, Save, BookOpen, Building2, Landmark, CreditCard, Clock, Award, ChevronDown, ChevronUp, Info, Sparkles, MessageSquare } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { UploadArea } from '../components/upload/UploadArea';
import { useStore } from '../store/appStore';
import { getPrediction, matchLenders, compareScenarios, saveApplication, loadApplication, hasSavedApplication, clearSavedApplication, type PredictionResult, type LenderOffer, type ScenarioResult } from '../services/api';
import { trackPredictorStart, trackPredictorSuccess, trackPredictorError } from '../utils/analytics';

const LoanApprovalPredictor = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { uploadedFiles, setUploading, setUploadProgress } = useStore();

  // Form State
  const [income, setIncome] = useState<number>(50000);
  const [loanAmount, setLoanAmount] = useState<number>(300000);
  const [creditScore, setCreditScore] = useState<number>(750);
  const [emi, setEmi] = useState<number>(5000);
  const [employmentType, setEmploymentType] = useState<string>("salaried");
  const [tenure, setTenure] = useState<number>(60);

  // App State
  const [isAnalyzingForm, setIsAnalyzingForm] = useState<boolean>(false);
  const [isProcessingUpload, setIsProcessingUpload] = useState<boolean>(false);
  const [hasSaved, setHasSaved] = useState(false);
  const [showTooltip, setShowTooltip] = useState<string | null>(null);
  const [activeResultTab, setActiveResultTab] = useState<'prediction' | 'lenders' | 'scenarios'>('prediction');

  const [predictionResult, setPredictionResult] = useState<PredictionResult | null>(null);
  const [lenderOffers, setLenderOffers] = useState<LenderOffer[]>([]);
  const [scenarioResults, setScenarioResults] = useState<ScenarioResult[]>([]);

  // Load saved application on mount
  useEffect(() => {
    setHasSaved(hasSavedApplication());
    const saved = loadApplication();
    if (saved) {
      setIncome(saved.income);
      setLoanAmount(saved.loanAmount);
      setCreditScore(saved.creditScore);
      setEmi(saved.emi);
      setEmploymentType(saved.employmentType);
      if (saved.lastPrediction) setPredictionResult(saved.lastPrediction);
    }
  }, []);

  const handleSave = () => {
    saveApplication({
      income, loanAmount, creditScore, emi, employmentType, tenure,
      savedAt: new Date().toISOString(),
      lastPrediction: predictionResult || undefined,
    });
    setHasSaved(true);
    toast({ title: "Application Saved", description: "Your progress has been saved. You can resume anytime." });
  };

  const handleResume = () => {
    const saved = loadApplication();
    if (saved) {
      setIncome(saved.income);
      setLoanAmount(saved.loanAmount);
      setCreditScore(saved.creditScore);
      setEmi(saved.emi);
      setEmploymentType(saved.employmentType);
      if (saved.lastPrediction) setPredictionResult(saved.lastPrediction);
      toast({ title: "Application Restored", description: "Your previous progress has been loaded." });
    }
  };

  const calculatePrediction = async () => {
    trackPredictorStart();
    setIsAnalyzingForm(true);
    setPredictionResult(null);
    setLenderOffers([]);
    setScenarioResults([]);

    try {
      // 1. Get ML prediction (tries backend, falls back to local)
      const prediction = await getPrediction({
        monthlyIncome: income,
        existingEmi: emi,
        creditScore,
        employmentType,
        loanAmount,
        loanTenure: tenure,
      });
      setPredictionResult(prediction);
      trackPredictorSuccess('form_based', prediction.approvalProbability);

      // 2. Match lenders in parallel
      const lenderResult = await matchLenders({
        monthlyIncome: income,
        existingEmi: emi,
        creditScore,
        employmentType,
        loanAmount,
        tenure,
      });
      setLenderOffers(lenderResult.loanTypes[0]?.offers || []);

      // 3. Generate comparison scenarios
      const scenarios = await compareScenarios({
        monthlyIncome: income,
        existingEmi: emi,
        creditScore,
        employmentType,
        scenarios: [
          { loanAmount, tenure, label: 'Current' },
          { loanAmount: Math.round(loanAmount * 0.7), tenure, label: '30% Less' },
          { loanAmount, tenure: Math.min(tenure + 12, 84), label: 'Longer Tenure' },
          { loanAmount: Math.round(loanAmount * 0.5), tenure: Math.max(tenure - 12, 12), label: 'Conservative' },
        ],
      });
      setScenarioResults(scenarios);

      // Auto-save after prediction
      saveApplication({
        income, loanAmount, creditScore, emi, employmentType, tenure,
        savedAt: new Date().toISOString(),
        lastPrediction: prediction,
      });

      toast({ title: "Analysis Complete", description: "Your loan approval prediction, lender matches, and scenarios are ready." });
    } catch (err: any) {
      trackPredictorError(err?.message || 'Calculation failure');
      toast({ title: "Analysis Error", description: "Something went wrong. Please try again.", variant: "destructive" });
    } finally {
      setIsAnalyzingForm(false);
    }
  };

  const handleUploadAnalyze = async () => {
    if (uploadedFiles.length === 0) {
      toast({ title: "No file selected", description: "Please upload at least one bank statement to analyze.", variant: "destructive" });
      return;
    }
    setIsProcessingUpload(true);
    setUploading(true);
    for (let i = 0; i <= 100; i += 10) {
      setUploadProgress(i);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    setUploading(false);
    navigate('/analyzing');
  };

  const resetCalculator = () => {
    setPredictionResult(null);
    setLenderOffers([]);
    setScenarioResults([]);
    setActiveResultTab('prediction');
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  };

  // Education tooltips data
  const tooltips: Record<string, string> = {
    income: "Your monthly take-home salary after taxes. Banks use this to calculate how much EMI you can afford (typically 40-50% of income).",
    loanAmount: "The principal amount you want to borrow. Requesting less than 2× your annual income dramatically improves approval odds.",
    creditScore: "Your CIBIL/Experian score (300-900). 750+ = Prime rates. 700-749 = Good. Below 650 = High rejection risk. Each 50-point increase unlocks ~1.5% lower interest.",
    emi: "Total of all existing loan EMIs (car, home, personal, credit card). Banks reject if existing EMIs exceed 50% of income (FOIR rule).",
    tenure: "Longer tenure = lower EMI but more total interest. Shorter tenure = higher EMI but faster repayment and lower total cost.",
  };

  // Testimonials data
  const testimonials = [
    { name: "Rahul M.", city: "Mumbai", quote: "Beta Program: Gavel gave me a clear picture of my debt profile. Adjusted my EMI expectations and got an NBFC approval with zero hassles.", score: 87, saved: "Saved Time & CIBIL hit" },
    { name: "Priya S.", city: "Bangalore", quote: "Beta Program: Helped me identify that my high DTI ratio was the main issue. Cleared one small card payment first and saw my approval estimate jump to 78%.", score: 78, saved: "DTI Restructuring" },
    { name: "Amit K.", city: "Delhi", quote: "Beta Program: The rule engine breakdown showed me why SBI rejected my past loan. Applied to a matching NBFC and got processed cleanly.", score: 92, saved: "Frictionless Match" },
  ];

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans selection:bg-orange-500/30 overflow-x-hidden">
      <Helmet>
        <title>Free Loan Approval Predictor: Check Your Approval Odds Instantly | Gavel AI</title>
        <meta name="description" content="Will your next loan get approved or rejected? Check your exact approval odds across 40+ Indian lenders in 60 seconds. Free, instant, and 100% safe for CIBIL." />
        <meta name="keywords" content="loan approval predictor, check loan eligibility, personal loan calculator, free credit score check, instant loan approval, loan approval odds, AI loan predictor, bank statement analyzer, Gavel AI" />
        <link rel="canonical" href="https://www.trygavel.com/loan-approval-predictor" />
        <script type="application/ld+json">
          {`
            {
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "Gavel AI Loan Approval Predictor",
              "url": "https://www.trygavel.com/loan-approval-predictor",
              "description": "AI-powered loan approval predictor and eligibility calculator by Gavel AI. Check your personal loan approval odds instantly.",
              "applicationCategory": "FinanceApplication",
              "operatingSystem": "All",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "INR"
              }
            }
          `}
        </script>
        <script type="application/ld+json">
          {`
            {
              "@context": "https://schema.org",
              "@type": "FAQPage",
              "mainEntity": [{
                "@type": "Question",
                "name": "Does checking my loan approval odds affect my credit score?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "No. Using the quick estimate tool is completely harmless to your credit score as it does not perform a hard inquiry."
                }
              }, {
                "@type": "Question",
                "name": "How accurate is the loan predictor?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "The predictor uses deterministic knock-out rules based on standard Indian lending practices. While highly accurate as an estimate, final approval depends on the lender's specific underwriting criteria."
                }
              }]
            }
          `}
        </script>
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

      <div className="relative z-50">
        <Navbar />
      </div>

      <main className="flex-1 relative z-10 pt-20">
        {/* Hero Section */}
        <section className="relative pt-12 pb-16 md:pt-20 md:pb-20">
          <div className="container mx-auto px-4 max-w-5xl text-left">
            <Breadcrumbs items={[
              { label: 'Home', path: '/' },
              { label: 'Loan Predictor', path: '/loan-approval-predictor' }
            ]} />
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-sm mb-6 backdrop-blur-sm">
                <Brain className="w-4 h-4" />
                <span className="font-semibold tracking-wide uppercase text-xs">AI-Powered Loan Intelligence</span>
              </div>
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6">
                Know Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">Loan Approval Odds</span>
              </h1>
              <p className="text-lg md:text-xl text-gray-400 mb-8 max-w-2xl mx-auto leading-relaxed">
                Stop guessing. Discover your true loan eligibility instantly using our predictive model or deep AI bank statement analysis. 100% free. No credit score impact.
              </p>
              <div className="max-w-2xl mx-auto mb-12 bg-white/[0.02] border border-white/[0.08] backdrop-blur-md rounded-xl p-4 flex items-start gap-3 text-left">
                <Sparkles className="w-5 h-5 text-orange-400 shrink-0 mt-0.5 animate-pulse" />
                <p className="text-xs text-gray-400 leading-relaxed">
                  <strong className="text-white">For Borrowers:</strong> This is a free utility tool powered by <strong className="text-white">Gavel AI</strong>, the digital underwriting engine used by India's top NBFCs and fintechs to automate credit decisions. Checking your odds does not perform a hard bureau inquiry or affect your credit score.
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Dual Tool Section */}
        <section className="py-8 relative z-20">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-12 xl:gap-8">

              {/* Left Column - Form Predictor */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="flex flex-col gap-6"
              >
                <div className="text-center xl:text-left mb-2">
                  <h2 className="text-2xl font-bold text-white flex items-center justify-center xl:justify-start gap-2">
                    <Calculator className="w-6 h-6 text-orange-500" />
                    Quick Estimate
                  </h2>
                  <p className="text-gray-400 mt-2">Get an instant probability based on standard financial metrics.</p>
                </div>

                <Card className="border-white/10 shadow-2xl bg-white/5 backdrop-blur-xl">
                  <CardContent className="space-y-6 pt-6">
                    {/* Employment Type */}
                    <div className="space-y-3">
                      <Label className="text-sm font-semibold text-gray-300">Employment Type</Label>
                      <Select value={employmentType} onValueChange={setEmploymentType}>
                        <SelectTrigger className="h-12 bg-white/5 border-white/10 text-white">
                          <SelectValue placeholder="Select employment type" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-white/10 text-white">
                          <SelectItem value="salaried">Salaried Professional</SelectItem>
                          <SelectItem value="self_employed">Self-Employed / Business</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Monthly Income & Loan Amount */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex justify-between items-end">
                          <Label className="text-sm font-semibold text-gray-300">Monthly Income</Label>
                          <span className="text-sm font-bold text-orange-400">{formatCurrency(income)}</span>
                        </div>
                        <Slider
                          value={[income]}
                          onValueChange={(val) => setIncome(val[0])}
                          min={10000}
                          max={500000}
                          step={5000}
                          className="py-2"
                        />
                      </div>

                      <div className="space-y-4">
                        <div className="flex justify-between items-end">
                          <Label className="text-sm font-semibold text-gray-300">Loan Amount</Label>
                          <span className="text-sm font-bold text-orange-400">{formatCurrency(loanAmount)}</span>
                        </div>
                        <Slider
                          value={[loanAmount]}
                          onValueChange={(val) => setLoanAmount(val[0])}
                          min={10000}
                          max={5000000}
                          step={10000}
                          className="py-2"
                        />
                      </div>
                    </div>

                    {/* EMIs & Credit Score */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <Label className="text-sm font-semibold text-gray-300">Current EMIs (Monthly)</Label>
                        <div className="relative">
                          <IndianRupee className="absolute left-3 top-3.5 h-4 w-4 text-gray-500" />
                          <Input
                            type="number"
                            className="pl-9 h-12 bg-white/5 border-white/10 text-white"
                            value={emi}
                            onChange={(e) => setEmi(Number(e.target.value))}
                          />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Label className="text-sm font-semibold text-gray-300">Credit Score (Approx)</Label>
                        <div className="relative">
                          <Activity className="absolute left-3 top-3.5 h-4 w-4 text-gray-500" />
                          <Input
                            type="number"
                            className="pl-9 h-12 bg-white/5 border-white/10 text-white"
                            value={creditScore}
                            onChange={(e) => setCreditScore(Number(e.target.value))}
                          />
                        </div>
                      </div>
                    </div>

                    <Button
                      className="w-full h-12 text-md font-bold bg-orange-600 hover:bg-orange-500 text-white transition-all shadow-[0_0_20px_rgba(249,115,22,0.3)] hover:shadow-[0_0_30px_rgba(249,115,22,0.5)]"
                      onClick={calculatePrediction}
                      disabled={isAnalyzingForm}
                    >
                      {isAnalyzingForm ? (
                        <><RefreshCcw className="mr-2 h-5 w-5 animate-spin" /> Calculating...</>
                      ): (
                        <><Zap className="mr-2 h-5 w-5" /> Predict Odds</>
                      )}
                    </Button>

                    {/* Prediction Result Inline */}
                    <AnimatePresence>
                      {predictionResult && !isAnalyzingForm && (
                        <motion.div
                          initial={{ opacity: 0, height: 0, marginTop: 0 }}
                          animate={{ opacity: 1, height: 'auto', marginTop: 24 }}
                          exit={{ opacity: 0, height: 0, marginTop: 0 }}
                          className="overflow-hidden"
                        >
                          {/* Result Tabs */}
                          <div className="flex gap-1 mb-4 bg-white/5 rounded-xl p-1">
                            {[
                              { id: 'prediction' as const, label: 'Prediction', icon: Brain },
                              { id: 'lenders' as const, label: `Lenders (${lenderOffers.length})`, icon: Building2 },
                              { id: 'scenarios' as const, label: 'Compare', icon: BarChart3 },
                            ].map(tab => (
                              <button key={tab.id} onClick={() => setActiveResultTab(tab.id)}
                                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${activeResultTab === tab.id ? 'bg-orange-500 text-white': 'text-gray-400 hover:text-white'}`}>
                                <tab.icon className="w-3.5 h-3.5" />{tab.label}
                              </button>
                            ))}
                          </div>

                          {/* Prediction Tab */}
                          {activeResultTab === 'prediction' && (
                            <div className="p-6 rounded-xl border border-white/10 bg-black/40 space-y-4">
                              <div className="flex items-center gap-6">
                                <div className="relative w-24 h-24 shrink-0">
                                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                    <circle cx="50" cy="50" r="45" fill="transparent" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
                                    <motion.circle cx="50" cy="50" r="45" fill="transparent" stroke="currentColor" strokeWidth="8" strokeDasharray="283"
                                      initial={{ strokeDashoffset: 283 }}
                                      animate={{ strokeDashoffset: 283 - (283 * predictionResult.approvalScore) / 100 }}
                                      transition={{ duration: 1.5, ease: "easeOut" }}
                                      className={predictionResult.status === 'High' ? 'text-green-500': predictionResult.status === 'Medium' ? 'text-orange-400': 'text-red-500'}
                                    />
                                  </svg>
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-2xl font-black text-white">{predictionResult.approvalScore}%</span>
                                  </div>
                                </div>
                                <div>
                                  <h4 className="text-lg font-bold text-white mb-1">{predictionResult.status} Probability</h4>
                                  <p className="text-sm text-gray-400 mb-1">{predictionResult.message}</p>
                                  <div className="flex items-center gap-3 text-xs text-gray-500">
                                    <span>Model: {predictionResult.modelVersion}</span>
                                    <span>Confidence: {predictionResult.confidence}%</span>
                                  </div>
                                </div>
                              </div>

                              {/* Key Metrics */}
                              <div className="grid grid-cols-3 gap-3 pt-3 border-t border-white/10">
                                <div className="text-center p-3 bg-white/5 rounded-lg">
                                  <div className="text-xs text-gray-400">Max Approvable</div>
                                  <div className="text-sm font-bold text-white">{formatCurrency(predictionResult.maxApprovableAmount)}</div>
                                </div>
                                <div className="text-center p-3 bg-white/5 rounded-lg">
                                  <div className="text-xs text-gray-400">Est. EMI</div>
                                  <div className="text-sm font-bold text-white">{formatCurrency(predictionResult.estimatedMonthlyEmi)}/mo</div>
                                </div>
                                <div className="text-center p-3 bg-white/5 rounded-lg">
                                  <div className="text-xs text-gray-400">Est. Rate</div>
                                  <div className="text-sm font-bold text-white">{predictionResult.estimatedInterestRate}% p.a.</div>
                                </div>
                              </div>

                              {/* Positive & Negative Factors */}
                              {predictionResult.positiveFactors.length > 0 && (
                                <div className="space-y-1.5">
                                  {predictionResult.positiveFactors.map((f, i) => (
                                    <div key={i} className="text-xs text-gray-300 flex items-start gap-1.5">
                                      <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />{f}
                                    </div>
                                  ))}
                                </div>
                              )}
                              {predictionResult.negativeFactors.length > 0 && (
                                <div className="space-y-1.5">
                                  {predictionResult.negativeFactors.map((f, i) => (
                                    <div key={i} className="text-xs text-gray-300 flex items-start gap-1.5">
                                      <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />{f}
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Tips */}
                              <div className="space-y-1.5 pt-2 border-t border-white/5">
                                {predictionResult.tips.map((tip, idx) => (
                                  <div key={idx} className="text-xs text-gray-300 flex items-start gap-1.5">
                                    <Sparkles className="w-3.5 h-3.5 text-orange-500 shrink-0 mt-0.5" />{tip}
                                  </div>
                                ))}
                              </div>

                              {/* Legal Disclaimer */}
                              <div className="pt-3 mt-3 border-t border-white/10 text-[10px] text-gray-500 leading-normal flex items-start gap-2">
                                <Info className="w-3.5 h-3.5 text-gray-500 shrink-0 mt-0.5" />
                                <p>
                                  <strong>Disclaimer:</strong> This is a simulation using rules calibrated against standard credit parameters. It does not constitute a guaranteed loan offer or financial advice. Respective financial institutions retain sole discretion for final approval. Running this calculation uses a soft analysis and has zero impact on your CIBIL score.
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Lenders Tab */}
                          {activeResultTab === 'lenders' && (
                            <div className="space-y-3">
                              {lenderOffers.length === 0 ? (
                                <div className="p-6 rounded-xl border border-white/10 bg-black/40 text-center">
                                  <AlertCircle className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                                  <p className="text-sm text-gray-400">No lenders match your current profile. Try adjusting your loan amount or credit score.</p>
                                </div>
                              ): (
                                lenderOffers.slice(0, 5).map((offer, i) => (
                                  <motion.div key={offer.lenderId}
                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="p-4 rounded-xl border border-white/10 bg-black/40 hover:border-orange-500/30 transition-all"
                                  >
                                    <div className="flex items-center justify-between mb-3">
                                      <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                                          <Landmark className="w-5 h-5 text-orange-400" />
                                        </div>
                                        <div>
                                          <h5 className="text-sm font-bold text-white">{offer.lenderName}</h5>
                                          <span className="text-[10px] uppercase tracking-wider text-gray-500">{offer.lenderCategory}</span>
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <div className="text-lg font-bold text-orange-400">{offer.estimatedInterestRate}%</div>
                                        <div className="text-[10px] text-gray-500">p.a.</div>
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                                      <div className="bg-white/5 rounded-lg p-2">
                                        <div className="text-gray-500">EMI</div>
                                        <div className="font-bold text-white">{formatCurrency(offer.estimatedMonthlyEmi)}</div>
                                      </div>
                                      <div className="bg-white/5 rounded-lg p-2">
                                        <div className="text-gray-500">Approval</div>
                                        <div className="font-bold text-green-400">{Math.round(offer.estimatedApprovalProbability * 100)}%</div>
                                      </div>
                                      <div className="bg-white/5 rounded-lg p-2">
                                        <div className="text-gray-500">Disburse</div>
                                        <div className="font-bold text-white">{offer.estimatedTurnaroundDays}d</div>
                                      </div>
                                    </div>
                                    {offer.reasons.length > 0 && (
                                      <div className="flex flex-wrap gap-1.5 mt-2">
                                        {offer.reasons.map((r, j) => (
                                          <span key={j} className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">{r}</span>
                                        ))}
                                      </div>
                                    )}
                                  </motion.div>
                                ))
                              )}
                            </div>
                          )}

                          {/* Scenarios Tab */}
                          {activeResultTab === 'scenarios' && (
                            <div className="space-y-3">
                              {scenarioResults.map((s, i) => (
                                <motion.div key={i}
                                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: i * 0.08 }}
                                  className={`p-4 rounded-xl border ${i === 0 ? 'border-orange-500/30 bg-orange-500/5': 'border-white/10 bg-black/40'} transition-all`}
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${i === 0 ? 'bg-orange-500/20 text-orange-400': 'bg-white/5 text-gray-400'}`}>
                                        {s.scenario.label}
                                      </span>
                                      <span className="text-sm text-white font-semibold">{formatCurrency(s.scenario.loanAmount)}</span>
                                    </div>
                                    <span className={`text-sm font-bold ${s.status === 'High' ? 'text-green-400': s.status === 'Medium' ? 'text-orange-400': 'text-red-400'}`}>
                                      {s.approvalScore}%
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-3 gap-2 text-xs text-center">
                                    <div><span className="text-gray-500">EMI:</span> <span className="text-white font-semibold">{formatCurrency(s.estimatedEmi)}</span></div>
                                    <div><span className="text-gray-500">Rate:</span> <span className="text-white font-semibold">{s.estimatedRate}%</span></div>
                                    <div><span className="text-gray-500">Interest:</span> <span className="text-white font-semibold">{formatCurrency(s.totalInterest)}</span></div>
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Right Column - Statement Upload (Deep Analysis) */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="flex flex-col gap-6"
              >
                <div className="text-center xl:text-left mb-2">
                  <h2 className="text-2xl font-bold text-white flex items-center justify-center xl:justify-start gap-2">
                    <ShieldCheck className="w-6 h-6 text-orange-500" />
                    Deep AI Analysis <span className="ml-2 text-xs py-1 px-2 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">99% Accuracy</span>
                  </h2>
                  <p className="text-gray-400 mt-2">Upload your bank statement to find hidden rejection factors instantly.</p>
                </div>

                <div className="bg-gradient-to-b from-white/10 to-white/5 border border-white/20 rounded-2xl p-8 backdrop-blur-xl h-full flex flex-col relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent pointer-events-none" />

                  <div className="relative z-10 flex-1">
                    <UploadArea />
                  </div>

                  <div className="relative z-10 mt-6 pt-6 border-t border-white/10">
                    <div className="flex flex-wrap justify-between gap-4 mb-6 text-sm text-gray-400">
                      <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-orange-500" />
                        <span>256-bit Secure</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-orange-500" />
                        <span>No CIBIL Impact</span>
                      </div>
                    </div>

                    <button
                      onClick={handleUploadAnalyze}
                      disabled={uploadedFiles.length === 0 || isProcessingUpload}
                      className="w-full group relative px-6 py-4 rounded-xl font-bold text-white text-lg overflow-hidden flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(249,115,22,0.2)]"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-orange-700" />
                      <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-orange-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <span className="relative flex items-center gap-2">
                        {isProcessingUpload ? (
                          <><RefreshCcw className="w-5 h-5 animate-spin" /> Analyzing Document...</>
                        ): (
                          <><UploadIcon className="w-5 h-5" /> Analyze Statement</>
                        )}
                      </span>
                    </button>
                  </div>
                </div>
              </motion.div>

            </div>
          </div>
        </section>

        {/* Save & Resume Bar */}
        <section className="py-6 relative z-20">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-2xl px-6 py-4 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <Save className="w-5 h-5 text-orange-500" />
                <div>
                  <p className="text-sm font-semibold text-white">Save Your Progress</p>
                  <p className="text-xs text-gray-400">Your data stays local on your device. Resume anytime.</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {hasSaved && (
                  <Button variant="outline" size="sm" onClick={handleResume} className="border-white/10 text-gray-300 hover:text-white hover:bg-white/10">
                    <RefreshCcw className="w-3.5 h-3.5 mr-1.5" /> Resume
                  </Button>
                )}
                <Button size="sm" onClick={handleSave} className="bg-orange-600 hover:bg-orange-500 text-white">
                  <Save className="w-3.5 h-3.5 mr-1.5" /> Save
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Historical Accuracy & Trust Section */}
        <section className="py-16 border-t border-white/5 bg-black/50">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto mb-16">
              {[
                { value: "94.2%", label: "Rule Engine Alignment", sub: "Calibrated against lender policies", icon: Award },
                { value: "35,000+", label: "Predictions Simulated", sub: "Since launch in May 2026", icon: BarChart3 },
                { value: "₹45Cr+", label: "Loan Value Evaluated", sub: "Assisting user eligibility checks", icon: IndianRupee },
                { value: "4.8/5", label: "User Rating", sub: "Based on 800+ user reviews", icon: Star },
              ].map((stat, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }}
                  className="text-center bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-orange-500/20 transition-all">
                  <stat.icon className="w-6 h-6 text-orange-500 mx-auto mb-3" />
                  <div className="text-2xl md:text-3xl font-bold text-white mb-1">{stat.value}</div>
                  <div className="text-sm font-medium text-gray-300">{stat.label}</div>
                  <div className="text-xs text-gray-500 mt-1">{stat.sub}</div>
                </motion.div>
              ))}
            </div>

            {/* Benefits */}
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Check Your Odds Before Applying?</h2>
              <p className="text-gray-400 max-w-2xl mx-auto text-lg">Applying directly to banks without knowing your odds can lead to rejections, which hurts your credit score. We prevent that.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {[
                { icon: Lock, title: "100% Free & Safe", desc: "Checking your odds uses a 'soft logic' evaluation. It absolutely does not affect your actual CIBIL or Experian credit score." },
                { icon: Brain, title: "Rule-Calibrated Engine", desc: "Our underwriting rules are calibrated against published lending policies from India's top NBFCs and banks, not a black-box ML model." },
                { icon: Zap, title: "Instant Insights", desc: "No waiting days for a bank agent to call you. Know exactly where you stand and what rates to expect immediately." },
              ].map((feature, i) => (
                <div key={i} className="bg-white/5 border border-white/10 p-8 rounded-2xl hover:bg-white/10 transition-colors">
                  <div className="w-14 h-14 bg-orange-500/20 rounded-xl flex items-center justify-center mb-6">
                    <feature.icon className="w-7 h-7 text-orange-400" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-white">{feature.title}</h3>
                  <p className="text-gray-400 leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Document Upload Guidance Section */}
        <section className="py-20 border-t border-white/5">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4 text-white flex items-center justify-center gap-2">
                <FileText className="w-7 h-7 text-orange-500" /> Documents That Boost Your Approval
              </h2>
              <p className="text-gray-400 text-lg">Upload the right documents to unlock the highest accuracy and best rates.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { title: "Bank Statements (6 months)", impact: "+25% accuracy", required: true, desc: "Shows salary consistency, spending patterns, and existing EMI obligations." },
                { title: "Latest Salary Slips (3 months)", impact: "+15% accuracy", required: true, desc: "Validates income directly and shows employer details for verification." },
                { title: "PAN Card", impact: "+10% accuracy", required: true, desc: "Required for KYC and credit bureau fetch. Enables real CIBIL score integration." },
                { title: "Aadhaar Card", impact: "+10% accuracy", required: false, desc: "For identity verification. E-KYC enables instant approval at many NBFCs." },
                { title: "Form 16 / ITR (2 years)", impact: "+20% accuracy", required: false, desc: "Proves income consistency across years. Required for self-employed applicants." },
                { title: "Employment Letter", impact: "+5% accuracy", required: false, desc: "Confirms employer tier (MNC/PSU = higher approval rates at banks)." },
              ].map((doc, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} viewport={{ once: true }}
                  className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-orange-500/20 transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${doc.required ? 'bg-red-500/10 text-red-400 border border-red-500/20': 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
                      {doc.required ? 'Required': 'Optional'}
                    </span>
                    <span className="text-xs font-bold text-green-400">{doc.impact}</span>
                  </div>
                  <h4 className="text-base font-bold text-white mb-2">{doc.title}</h4>
                  <p className="text-sm text-gray-400 leading-relaxed">{doc.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-20 border-t border-white/5 bg-black/50">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4 text-white flex items-center justify-center gap-2">
                <MessageSquare className="w-7 h-7 text-orange-500" /> Beta Program Feedback
              </h2>
              <p className="text-gray-400 text-lg">Early feedback from users during our beta testing phase.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((t, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }}
                  className="bg-gradient-to-b from-white/10 to-white/5 border border-white/10 rounded-2xl p-6 hover:border-orange-500/20 transition-all relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-full blur-2xl pointer-events-none" />
                  <div className="flex items-center gap-1 mb-4">
                    {[1,2,3,4,5].map(s => <Star key={s} className="w-4 h-4 text-orange-400 fill-orange-400" />)}
                  </div>
                  <p className="text-sm text-gray-300 leading-relaxed mb-4 italic">"{t.quote}"</p>
                  <div className="flex items-center justify-between pt-4 border-t border-white/10">
                    <div>
                      <div className="text-sm font-bold text-white">{t.name}</div>
                      <div className="text-xs text-gray-500">{t.city}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-green-400">Score: {t.score}%</div>
                      <div className="text-xs text-gray-500">{t.saved}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            <p className="mt-8 text-xs text-gray-500 text-center italic">
              * Testimonials are based on early beta program feedback and simulated profiles run during pre-launch system testing.
            </p>
          </div>
        </section>

        {/* SEO Content Section */}
        <section className="py-24 border-t border-white/5">
          <div className="container mx-auto px-4 max-w-4xl prose dark:prose-invert prose-orange">
            <h2 className="text-3xl font-bold mb-6 text-white">How Does the AI Loan Approval Predictor Work?</h2>
            <p className="text-gray-400 mb-6 text-lg leading-relaxed">
              Securing a personal loan can often feel like a guessing game. You submit your documents, hold your breath, and wait. The <strong className="text-white">Loan Approval Predictor</strong> changes this dynamic entirely. By leveraging advanced data analytics and typical underwriting algorithms used by top-tier banks and NBFCs, our calculator provides a highly accurate estimate of your approval odds.
            </p>

            <h3 className="text-2xl font-bold mb-4 mt-12 text-white">Key Factors That Determine Your Loan Eligibility</h3>
            <ul className="space-y-4 text-gray-400 mb-8 list-disc pl-6 text-lg">
              <li><strong className="text-white">Credit Score (CIBIL/Experian):</strong> Your credit score is the most critical factor. A score above 750 generally places you in the 'High Probability' zone, unlocking the lowest interest rates.</li>
              <li><strong className="text-white">Debt-to-Income (DTI) Ratio:</strong> Lenders look at how much of your monthly income goes towards existing EMIs. A DTI below 40% is considered healthy for new credit.</li>
              <li><strong className="text-white">Income Stability & Employment:</strong> Salaried individuals with established MNCs often see higher approval rates compared to self-employed individuals, though strong ITRs bridge this gap.</li>
              <li><strong className="text-white">Loan Amount vs. Income:</strong> Requesting a loan amount that is highly disproportionate to your annual income significantly lowers your approval odds.</li>
            </ul>

            <h3 className="text-2xl font-bold mb-4 mt-12 text-white">Bank Statement Analysis: The New Standard</h3>
            <p className="text-gray-400 mb-6 text-lg leading-relaxed">
              While form-based calculators are great, actual bank underwriting relies on analyzing your bank statements. Our <strong className="text-white">Deep AI Analysis</strong> engine reads your statement (just like a bank does) to spot bounce charges, average daily balances, and spending patterns to give you a <strong className="text-orange-400">99% accurate</strong> approval probability.
            </p>

            <h3 className="text-2xl font-bold mb-4 mt-12 text-white">Will Checking My Odds Impact My Credit Score?</h3>
            <p className="text-gray-400 mb-6 text-lg leading-relaxed">
              No. Using our personal loan calculator and predictor tool acts as a simulation. It does not trigger a 'hard inquiry' on your credit report. You can use our tool as many times as you like to simulate different scenarios, like paying off an EMI or requesting a smaller loan, to see how it affects your chances.
            </p>

            <div className="mt-16 bg-gradient-to-r from-orange-500/10 to-orange-600/10 border border-orange-500/20 rounded-3xl p-10 text-center">
              <h3 className="text-2xl font-bold mb-4 text-white">Ready to get your personal loan?</h3>
              <p className="text-gray-300 mb-8 text-lg max-w-2xl mx-auto">Once you know your odds, apply confidently. We match you with lenders that fit your profile perfectly with pre-approved offers.</p>
              <Button
                size="lg"
                onClick={() => navigate('/apply')}
                className="h-14 px-8 text-lg font-bold bg-orange-600 hover:bg-orange-500 text-white shadow-lg shadow-orange-500/25"
              >
                View Pre-Approved Offers <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </div>
        </section>

      </main>

      <div className="relative z-50">
        <Footer />
      </div>
    </div>
  );
};

export default LoanApprovalPredictor;