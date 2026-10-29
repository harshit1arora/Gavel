import React from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Calculator, Percent, TrendingDown, Home, Briefcase, Activity, ShieldCheck, Zap, CreditCard, PiggyBank, GraduationCap, Car, Building2, BarChart3, Wallet, Target, ArrowLeftRight, Clock, Heart, TrendingUp, ArrowRight, FileText, Sparkles } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { SEO_CATEGORIES, getPagesByCategory } from '../data/seo-content';

const tools = [
  { title: "AI Loan Approval Predictor", description: "Check your exact loan approval odds across 40+ Indian NBFCs using our core deterministic engine.", icon: Zap, path: "/loan-approval-predictor", color: "text-orange-500", bg: "bg-orange-500/10" },
  { title: "Personal Loan EMI Calculator", description: "Calculate your monthly EMI for any loan amount, tenure, and interest rate combination.", icon: Calculator, path: "/tools/emi-calculator", color: "text-blue-500", bg: "bg-blue-500/10" },
  { title: "Salary-Based Eligibility", description: "Find out exactly how much personal loan you can get based on your net in-hand salary.", icon: Briefcase, path: "/tools/salary-loan-eligibility", color: "text-green-500", bg: "bg-green-500/10" },
  { title: "Credit Utilization Checker", description: "Analyze your credit card usage to see if it's silently hurting your CIBIL score.", icon: Activity, path: "/tools/credit-utilization", color: "text-purple-500", bg: "bg-purple-500/10" },
  { title: "Home Loan Affordability", description: "Reverse-calculate the maximum house price you can afford without triggering risk alerts.", icon: Home, path: "/tools/home-loan-affordability", color: "text-pink-500", bg: "bg-pink-500/10" },
  { title: "Debt-to-Income (DTI) Check", description: "The #1 metric banks check. See where you stand against the 50% DTI redline.", icon: Percent, path: "/tools/dti-calculator", color: "text-yellow-500", bg: "bg-yellow-500/10" },
  { title: "Car Loan EMI Calculator", description: "Plan your car purchase with accurate EMI projections including down payment and tenure options.", icon: Car, path: "/tools/car-loan-emi-calculator", color: "text-cyan-500", bg: "bg-cyan-500/10" },
  { title: "Credit Score Simulator", description: "See how paying off debt, reducing utilization, or new inquiries affect your CIBIL score.", icon: TrendingUp, path: "/tools/credit-score-simulator", color: "text-emerald-500", bg: "bg-emerald-500/10" },
  { title: "Loan Affordability Calculator", description: "Calculate the maximum loan you can afford based on your budget and financial commitments.", icon: Wallet, path: "/tools/loan-affordability-calculator", color: "text-amber-500", bg: "bg-amber-500/10" },
  { title: "Emergency Fund Calculator", description: "How many months of expenses should you save? Calculate your ideal emergency fund.", icon: PiggyBank, path: "/tools/emergency-fund-calculator", color: "text-teal-500", bg: "bg-teal-500/10" },
  { title: "Interest Rate Comparison", description: "Compare personal loan interest rates across HDFC, ICICI, SBI, Bajaj Finserv, and 10+ lenders.", icon: ArrowLeftRight, path: "/tools/interest-rate-comparison", color: "text-indigo-500", bg: "bg-indigo-500/10" },
  { title: "Loan Tenure Optimizer", description: "Find the sweet spot between lowest EMI and minimum total interest for your loan.", icon: Clock, path: "/tools/loan-tenure-optimizer", color: "text-rose-500", bg: "bg-rose-500/10" },
  { title: "Prepayment Impact Calculator", description: "See how prepaying your loan saves interest and shortens tenure. Calculate exact savings.", icon: Target, path: "/tools/prepayment-impact-calculator", color: "text-lime-500", bg: "bg-lime-500/10" },
  { title: "Business Loan Eligibility", description: "Check if your business qualifies for a loan. MSME, startup, and self-employed friendly.", icon: Building2, path: "/tools/business-loan-eligibility", color: "text-sky-500", bg: "bg-sky-500/10" },
  { title: "Education Loan Calculator", description: "Plan education financing for India or abroad. Calculate EMI with moratorium period.", icon: GraduationCap, path: "/tools/education-loan-calculator", color: "text-violet-500", bg: "bg-violet-500/10" },
  { title: "Credit Card Debt Payoff", description: "Stuck in credit card debt? Calculate how long it takes to become debt-free.", icon: CreditCard, path: "/tools/credit-card-debt-payoff", color: "text-red-500", bg: "bg-red-500/10" },
  { title: "Salary to Loan Mapping", description: "See which banks approve which amounts at your exact salary level. Data from 50K+ applications.", icon: BarChart3, path: "/tools/salary-loan-mapping", color: "text-fuchsia-500", bg: "bg-fuchsia-500/10" },
  { title: "NBFC vs Bank Comparison", description: "Banks offer lower rates but stricter rules. NBFCs approve faster. See which fits you.", icon: ArrowLeftRight, path: "/tools/nbfc-vs-bank-comparison", color: "text-orange-400", bg: "bg-orange-400/10" },
  { title: "Monthly Budget Planner", description: "Allocate your salary across needs, wants, and savings. Follow the 50/30/20 rule.", icon: Wallet, path: "/tools/monthly-budget-planner", color: "text-green-400", bg: "bg-green-400/10" },
  { title: "Financial Health Check", description: "Get a comprehensive score across 8 financial parameters. Know exactly where you stand.", icon: Heart, path: "/tools/financial-health-check", color: "text-pink-400", bg: "bg-pink-400/10" },
];

const ToolsDirectory = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-orange-500/30 overflow-x-hidden">
      <Helmet>
        <title>Financial Tools & Loan Calculators, Gavel AI</title>
        <meta name="description" content="20+ free AI-powered financial tools. Calculate EMI, check loan eligibility, simulate credit score changes, compare lenders, and plan your finances." />
        <link rel="canonical" href="https://www.trygavel.com/tools" />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org', '@type': 'CollectionPage',
          name: 'Financial Tools & Calculators', description: '20+ free AI-powered financial tools',
          publisher: { '@type': 'Organization', name: 'Gavel AI' },
          numberOfItems: tools.length,
        })}</script>
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          'itemListElement': [
            { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': 'https://www.trygavel.com' },
            { '@type': 'ListItem', 'position': 2, 'name': 'Tools', 'item': 'https://www.trygavel.com/tools' }
          ]
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

        <div className="container mx-auto px-6 max-w-6xl relative z-10">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 bg-[#F97316]/10 border border-[#F97316]/20 rounded-full px-4 py-1.5 mb-6">
              <Zap className="w-4 h-4 text-[#F97316]" />
              <span className="text-sm font-medium text-orange-700 dark:text-orange-200">{tools.length} Free Tools</span>
            </motion.div>
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl font-bold mb-6 tracking-tight text-foreground">
              Master Your Financial Health
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="text-lg text-muted-foreground leading-relaxed">
              Stop guessing what the banks think. Use our enterprise-grade underwriting tools to calculate your exact standing before you apply for credit.
            </motion.p>
            <div className="max-w-2xl mx-auto mt-8 bg-surface border border-white/[0.08] backdrop-blur-md rounded-xl p-4 flex items-start gap-3 text-left">
              <Sparkles className="w-5 h-5 text-orange-700 dark:text-orange-400 shrink-0 mt-0.5 animate-pulse" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                <strong className="text-foreground">For Borrowers:</strong> These are free financial check utilities powered by <strong className="text-foreground">Gavel AI</strong>, the digital underwriting engine used by India's top NBFCs and fintechs to automate credit decisions. Running these checks does not perform any hard bureau inquiry.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-24">
            {tools.map((tool, index) => (
              <motion.div key={index} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(0.1 * index, 0.8) }}>
                <Card className="bg-surface border-border hover:border-orange-500/30 transition-all duration-300 cursor-pointer group h-full relative overflow-hidden"
                  onClick={() => navigate(tool.path)}>
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <CardHeader>
                    <div className={"w-12 h-12 rounded-xl flex items-center justify-center mb-4 " + tool.bg}>
                      <tool.icon className={"w-6 h-6 " + tool.color} />
                    </div>
                    <CardTitle className="text-xl text-foreground group-hover:text-orange-700 dark:group-hover:text-orange-400 transition-colors">{tool.title}</CardTitle>
                    <CardDescription className="text-muted-foreground leading-relaxed mt-2">{tool.description}</CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>
            ))}
          </div>
          {/* Credit Intelligence Hubs */}
          <section className="border-t border-border pt-16 mb-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">Credit Intelligence Hubs</h2>
              <p className="text-muted-foreground text-lg">Master knowledge bases designed to optimize your financial eligibility scores.</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { title: "Loan Rejection Manuals", desc: "Why banks reject applications and how to recover.", path: "/loan-rejection-guides", icon: ShieldCheck, color: "text-rose-500", bg: "bg-rose-500/10" },
                { title: "CIBIL Optimization Hub", desc: "Settle active queries and boost credit scores fast.", path: "/cibil-score-guides", icon: CreditCard, color: "text-orange-500", bg: "bg-orange-500/10" },
                { title: "Statement Analysis Guide", desc: "Understand UPI flags and balance buffers.", path: "/bank-statement-analysis", icon: FileText, color: "text-blue-500", bg: "bg-blue-500/10" },
                { title: "Eligibility Center", desc: "Pre-approved salary and career criteria matrix.", path: "/loan-eligibility-center", icon: Building2, color: "text-emerald-500", bg: "bg-emerald-500/10" },
                { title: "EMI Stress Center", desc: "Calculate tenure sweetspots and prepay benefits.", path: "/emi-education-hub", icon: Calculator, color: "text-purple-500", bg: "bg-purple-500/10" }
              ].map((hub, idx) => (
                <div key={idx} className="bg-surface border border-border hover:border-orange-500/30 p-6 rounded-2xl transition-all hover:bg-surface group cursor-pointer"
                  onClick={() => navigate(hub.path)}>
                  <div className={"w-10 h-10 rounded-lg flex items-center justify-center mb-4 " + hub.bg}>
                    <hub.icon className={"w-5 h-5 " + hub.color} />
                  </div>
                  <h3 className="font-bold text-foreground text-lg group-hover:text-orange-700 dark:group-hover:text-orange-400 transition-colors mb-2">{hub.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">{hub.desc}</p>
                  <span className="text-xs text-orange-700 dark:text-orange-400 font-semibold flex items-center gap-1">
                    Explore Hub <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* SEO Content Directory */}
          <section className="border-t border-border pt-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">Loan Eligibility Guides</h2>
              <p className="text-muted-foreground text-lg">Comprehensive guides for every salary, city, profession, and bank in India.</p>
              <div className="mt-4">
                <Link to="/all-guides" className="text-orange-700 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-400 font-semibold text-sm inline-flex items-center gap-1">
                  View Full A-Z Knowledge Directory (1,070+ pages) <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {SEO_CATEGORIES.map(cat => {
                const pages = getPagesByCategory(cat.id).slice(0, 5);
                return (
                  <div key={cat.id} className="bg-surface border border-border rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-foreground mb-1">{cat.label}</h3>
                    <p className="text-xs text-muted-foreground mb-4">{cat.count} guides</p>
                    <div className="space-y-2">
                      {pages.map(p => (
                        <Link key={p.slug} to={`/${p.slug}`}
                          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-orange-700 dark:hover:text-orange-400 transition-colors">
                          <ArrowRight className="w-3 h-3 shrink-0" /><span className="truncate">{p.h1}</span>
                        </Link>
                      ))}
                    </div>
                    {pages.length < cat.count && (
                      <p className="text-xs text-muted-foreground mt-3">+ {cat.count - pages.length} more guides</p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ToolsDirectory;

