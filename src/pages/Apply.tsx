import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft, CheckCircle, Loader2, UploadCloud, Sparkles,
  BrainCircuit, Database, Zap, ShieldCheck, IndianRupee,
  Lock, ArrowRight, User, Briefcase, Activity, CheckCircle2
} from "lucide-react";
import { submitApplication } from "../lib/firestore";
import { evaluateApplicationWithAI } from "../lib/ai-engine";
import { apiWithAuth } from "../lib/api-client";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const Apply = () => {
  const { orgId } = useAuth();
  const navigate = useNavigate();

  // Form State
  const [formData, setFormData] = useState({
    applicantName: "",
    annualIncome: "",
    loanAmount: "",
    creditDebt: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [appId, setAppId] = useState("");
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [schema, setSchema] = useState<any[]>([]);
  const [dynamicData, setDynamicData] = useState<Record<string, any>>({});

  // AI & Processing State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAAFetching, setIsAAFetching] = useState(false);
  const [llmInsights, setLlmInsights] = useState<any>(null);

  // Load Products
  useEffect(() => {
    apiWithAuth(`/v1/products`)
.then(r => r.json())
.then(data => {
        if (Array.isArray(data)) setProducts(data);
      })
.catch(console.error);
  }, []);

  // Load Product Schema
  useEffect(() => {
    if (!selectedProduct) return;
    apiWithAuth(`/v1/products/${selectedProduct}/form-schema`)
.then(r => r.json())
.then(data => {
        if (data && data.schema) setSchema(data.schema);
      })
.catch(console.error);
  }, [selectedProduct]);

  const simulateAccountAggregator = async () => {
    setIsAAFetching(true);
    toast("Redirecting to Sahamati AA Consent Flow...", { icon: '🔒' });
    try {
      const res = await apiWithAuth(`/v1/evaluate/account-aggregator`, { method: "POST" });
      if (res.ok) {
        const aaData = await res.json();
        setLlmInsights(aaData);
        if (aaData.extractedData?.averageMonthlyBalance) {
          setFormData(prev => ({...prev, annualIncome: String(aaData.extractedData.averageMonthlyBalance * 12) }));
          setDynamicData(prev => ({...prev, annualIncome: String(aaData.extractedData.averageMonthlyBalance * 12) }));
        }
        toast.success("AA Consent Approved. Financials Imported.", { icon: '✅' });
      }
    } catch (err) {
      toast.error("Failed to connect to AA gateway");
    } finally {
      setIsAAFetching(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    setIsAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append('statement', file);

      const res = await apiWithAuth(`/v1/evaluate/bank-statement`, {
        method: "POST",
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        setLlmInsights(data);
        if (data.extractedData?.averageMonthlyBalance) {
          setFormData(prev => ({...prev, annualIncome: String(data.extractedData.averageMonthlyBalance * 12) }));
          setDynamicData(prev => ({...prev, annualIncome: String(data.extractedData.averageMonthlyBalance * 12) }));
        }
        toast.success("Statement parsed successfully!");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to analyze statement");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDynamicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDynamicData(prev => ({...prev, [e.target.name]: e.target.value }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const parsedData = {
        applicantName: formData.applicantName || dynamicData.borrowerName,
        annualIncome: Number(formData.annualIncome) || 0,
        loanAmount: Number(formData.loanAmount) || Number(dynamicData.loanAmount),
        creditDebt: Number(formData.creditDebt) || 0,
        productId: selectedProduct,
...dynamicData,
        orgId: orgId || "public-demo-bank",
      };

      const newAppId = await submitApplication(parsedData);
      setAppId(newAppId);
      evaluateApplicationWithAI(newAppId, parsedData);

      setIsSuccess(true);
    } catch (error) {
      console.error("Submission failed", error);
      toast.error("Application submission failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans selection:bg-orange-500/30">
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,127,14,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,127,14,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />
        <motion.div
          animate={{ x: [0, -50, 0], y: [0, 50, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 20, repeat: Infinity }}
          className="absolute top-0 right-0 w-[600px] h-[600px] bg-orange-500/10 rounded-full blur-[120px]"
        />
      </div>

      <div className="relative z-50">
        <Navbar />
      </div>

      <main className="flex-1 relative z-10 py-12 md:py-20 flex items-center justify-center">
        <div className="container mx-auto px-4 max-w-4xl">
          <AnimatePresence mode="wait">
            {!isSuccess ? (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4 }}
              >
                <div className="text-center mb-10">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-sm mb-6 backdrop-blur-sm font-semibold">
                    <ShieldCheck className="w-4 h-4" />
                    Secure Application
                  </div>
                  <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
                    Claim Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">Pre-Approved Offer</span>
                  </h1>
                  <p className="text-gray-400 max-w-2xl mx-auto text-lg">
                    Complete your profile in less than 2 minutes. Our AI matching engine will secure the lowest interest rates based on your financial health.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="grid grid-cols-1 gap-8">

                    {/* Section 1: Product Selection */}
                    {products.length > 0 && (
                      <Card className="border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-orange-500" />
                        <CardHeader>
                          <CardTitle className="text-xl flex items-center gap-2 text-white">
                            <Briefcase className="w-5 h-5 text-orange-500" /> 1. Select Loan Type
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <Select value={selectedProduct || ''} onValueChange={setSelectedProduct}>
                            <SelectTrigger className="h-14 bg-black/50 border-white/10 text-white text-lg">
                              <SelectValue placeholder="Select a loan product..." />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-900 border-white/10 text-white">
                              {products.map(p => (
                                <SelectItem key={p.id} value={p.id} className="text-md py-3">
                                  {p.name} <span className="text-gray-400 text-sm ml-2">({p.segment})</span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </CardContent>
                      </Card>
                    )}

                    {/* Section 2: Financial Verification (AI / AA) */}
                    <Card className="border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
                      <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2 text-white">
                          <BrainCircuit className="w-5 h-5 text-blue-400" /> 2. Auto-Fill Financials
                        </CardTitle>
                        <CardDescription className="text-gray-400">
                          Securely link your bank or upload a statement. Our AI instantly extracts your income and liabilities, no manual entry needed.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {!llmInsights ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <label className="cursor-pointer relative overflow-hidden group w-full flex flex-col items-center justify-center p-8 bg-black/40 border border-white/10 hover:border-orange-500/50 rounded-2xl transition-all h-full min-h-[160px]">
                              {isAnalyzing ? (
                                <div className="flex flex-col items-center gap-3 text-orange-400">
                                  <Loader2 className="w-8 h-8 animate-spin" />
                                  <span className="font-semibold text-sm">Analyzing Statement...</span>
                                </div>
                              ): (
                                <>
                                  <div className="w-12 h-12 bg-orange-500/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <UploadCloud className="w-6 h-6 text-orange-400" />
                                  </div>
                                  <span className="font-semibold text-white mb-1">Upload Statement</span>
                                  <span className="text-xs text-gray-500">PDF, up to 20MB</span>
                                </>
                              )}
                              <input type="file" className="hidden" accept=".pdf" disabled={isAnalyzing || isAAFetching} onChange={handleFileUpload} />
                            </label>

                            <button
                              type="button"
                              onClick={simulateAccountAggregator}
                              disabled={isAnalyzing || isAAFetching}
                              className="relative overflow-hidden group w-full flex flex-col items-center justify-center p-8 bg-black/40 border border-white/10 hover:border-blue-500/50 rounded-2xl transition-all h-full min-h-[160px] disabled:opacity-50"
                            >
                              {isAAFetching ? (
                                <div className="flex flex-col items-center gap-3 text-blue-400">
                                  <Loader2 className="w-8 h-8 animate-spin" />
                                  <span className="font-semibold text-sm">Connecting via Sahamati...</span>
                                </div>
                              ): (
                                <>
                                  <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <Database className="w-6 h-6 text-blue-400" />
                                  </div>
                                  <span className="font-semibold text-white mb-1">Account Aggregator</span>
                                  <span className="text-xs text-gray-500">Instant OTP Verification</span>
                                </>
                              )}
                            </button>
                          </div>
                        ): (
                          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-green-500/10 border border-green-500/20 rounded-2xl p-6">
                            <div className="flex items-center gap-3 mb-4">
                              <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                                <CheckCircle2 className="w-5 h-5 text-green-500" />
                              </div>
                              <div>
                                <h3 className="font-bold text-white text-lg">Financials Verified</h3>
                                <p className="text-sm text-green-400/80">Income securely extracted by AI.</p>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-4">
                              <div className="bg-black/40 p-4 rounded-xl border border-white/5">
                                <span className="text-xs text-gray-400 uppercase tracking-wider font-bold">Est. Annual Income</span>
                                <div className="text-xl font-bold text-white mt-1">₹{((llmInsights.extractedData?.averageMonthlyBalance || 0) * 12).toLocaleString()}</div>
                              </div>
                              <div className="bg-black/40 p-4 rounded-xl border border-white/5">
                                <span className="text-xs text-gray-400 uppercase tracking-wider font-bold">Risk Assessment</span>
                                <div className={`text-xl font-bold mt-1 ${llmInsights.extractedData?.outwardBounces > 0 ? 'text-rose-500': 'text-green-500'}`}>
                                  {llmInsights.extractedData?.outwardBounces === 0 ? 'Excellent': 'Review Required'}
                                </div>
                              </div>
                            </div>

                            <div className="bg-black/40 p-4 rounded-xl border border-white/5">
                              <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-widest mb-3">
                                <Sparkles className="w-3 h-3" /> AI Insights Captured
                              </div>
                              <ul className="text-sm text-gray-300 space-y-2">
                                {llmInsights.insights?.slice(0,3).map((insight: string, idx: number) => (
                                  <li key={idx} className="flex items-start gap-2">
                                    <ArrowRight className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                                    <span>{insight}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </motion.div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Section 3: Personal & Manual Details */}
                    <Card className="border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-green-500" />
                      <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2 text-white">
                          <User className="w-5 h-5 text-green-500" /> 3. Final Details
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {schema.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {schema.map((field, i) => (
                              <div key={i} className="space-y-2">
                                <Label className="text-gray-300">{field.label}</Label>
                                <Input
                                  required={field.required}
                                  type={field.type === 'number' ? 'number': 'text'}
                                  name={field.name}
                                  min={field.min}
                                  max={field.max}
                                  onChange={handleDynamicChange}
                                  className="h-12 bg-black/50 border-white/10 text-white placeholder:text-gray-600 focus:border-orange-500/50"
                                />
                              </div>
                            ))}
                            <div className="space-y-2">
                              <Label className="text-gray-300">Total Existing EMI / Debt (₹)</Label>
                              <div className="relative">
                                <IndianRupee className="absolute left-3 top-3.5 w-4 h-4 text-gray-500" />
                                <Input
                                  required
                                  type="number"
                                  name="creditDebt"
                                  value={formData.creditDebt}
                                  onChange={handleChange}
                                  placeholder="e.g. 15000"
                                  className="pl-9 h-12 bg-black/50 border-white/10 text-white placeholder:text-gray-600 focus:border-orange-500/50"
                                />
                              </div>
                            </div>
                          </div>
                        ): (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <Label className="text-gray-300">Full Name (As per PAN)</Label>
                              <Input
                                required
                                type="text"
                                name="applicantName"
                                value={formData.applicantName}
                                onChange={handleChange}
                                placeholder="Rahul Sharma"
                                className="h-12 bg-black/50 border-white/10 text-white placeholder:text-gray-600 focus:border-orange-500/50"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label className="text-gray-300">Annual Income (₹)</Label>
                              <div className="relative">
                                <IndianRupee className="absolute left-3 top-3.5 w-4 h-4 text-gray-500" />
                                <Input
                                  required
                                  type="number"
                                  name="annualIncome"
                                  value={formData.annualIncome}
                                  onChange={handleChange}
                                  placeholder="1200000"
                                  className="pl-9 h-12 bg-black/50 border-white/10 text-white placeholder:text-gray-600 focus:border-orange-500/50"
                                />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label className="text-gray-300">Requested Loan Amount (₹)</Label>
                              <div className="relative">
                                <IndianRupee className="absolute left-3 top-3.5 w-4 h-4 text-gray-500" />
                                <Input
                                  required
                                  type="number"
                                  name="loanAmount"
                                  value={formData.loanAmount}
                                  onChange={handleChange}
                                  placeholder="500000"
                                  className="pl-9 h-12 bg-black/50 border-white/10 text-white placeholder:text-gray-600 focus:border-orange-500/50"
                                />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label className="text-gray-300">Current Monthly EMIs (₹)</Label>
                              <div className="relative">
                                <IndianRupee className="absolute left-3 top-3.5 w-4 h-4 text-gray-500" />
                                <Input
                                  required
                                  type="number"
                                  name="creditDebt"
                                  value={formData.creditDebt}
                                  onChange={handleChange}
                                  placeholder="15000"
                                  className="pl-9 h-12 bg-black/50 border-white/10 text-white placeholder:text-gray-600 focus:border-orange-500/50"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Submit Section */}
                    <div className="pt-4 flex flex-col items-center">
                      <Button
                        disabled={isSubmitting}
                        type="submit"
                        className="w-full h-16 text-xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white shadow-[0_0_30px_rgba(249,115,22,0.3)] hover:shadow-[0_0_40px_rgba(249,115,22,0.5)] transition-all transform hover:scale-[1.02]"
                      >
                        {isSubmitting ? (
                          <><Loader2 size={24} className="animate-spin mr-3" /> Processing Application...</>
                        ): (
                          <><Zap size={24} className="mr-2" /> Submit Application Securely</>
                        )}
                      </Button>
                      <div className="flex items-center gap-2 mt-4 text-sm text-gray-500">
                        <Lock className="w-4 h-4" /> 256-bit AES Encryption. By submitting, you agree to our Terms & Privacy Policy.
                      </div>
                    </div>
                  </div>
                </form>
              </motion.div>
            ): (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-20 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-xl shadow-2xl max-w-2xl mx-auto"
              >
                <div className="w-24 h-24 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-8 relative">
                  <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping" />
                  <CheckCircle size={48} className="relative z-10" />
                </div>
                <h2 className="text-4xl font-display font-bold text-white mb-4 tracking-tight">Application Submitted Successfully!</h2>
                <p className="text-gray-400 text-lg mb-8 max-w-md mx-auto leading-relaxed">
                  Application ID: <span className="font-mono font-bold text-white bg-white/10 px-2 py-1 rounded">{appId}</span>
                  <br/><br/>
                  Our AI is currently running risk assessments. You will receive your pre-approved offers and final terms shortly.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button onClick={() => navigate('/dashboard')} size="lg" className="h-14 px-8 font-bold text-md">
                    Go to Dashboard
                  </Button>
                  <Button variant="outline" onClick={() => window.location.reload()} size="lg" className="h-14 px-8 font-bold text-md border-white/20 text-white hover:bg-white/10">
                    Submit Another Application
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <div className="relative z-50">
        <Footer />
      </div>
    </div>
  );
};

export default Apply;
