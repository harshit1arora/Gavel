import React, { useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { ShieldAlert, Activity, CreditCard, FileText, Landmark, Calculator, ArrowRight, Zap, AlertTriangle, CheckCircle2, TrendingUp } from 'lucide-react';
import { getSEODatabase, type SEOPage } from '../data/seo-content';
import { Button } from '@/components/ui/button';
import { trackTopicalHubVisit } from '../utils/analytics';

interface HubConfig {
  title: string;
  h1: string;
  description: string;
  canonical: string;
  icon: React.ComponentType<any>;
  themeColor: string;
  bgGradient: string;
  filterFn: (p: SEOPage) => boolean;
  visualTitle: string;
  visualDesc: string;
  visualComponent: React.ComponentType<any>;
  faqs: { q: string; a: string }[];
}

// ── Visual Widgets for each hub ──

// Rejection breakdown heatmap
function RejectionHeatmap() {
  const points = [
    { name: "Debt-to-Income (DTI) Limit", weight: "35%", risk: "Critical", color: "bg-red-500" },
    { name: "Low Credit Score (<680)", weight: "30%", risk: "Critical", color: "bg-red-500" },
    { name: "Statement Mandate Bounces", weight: "20%", risk: "High", color: "bg-orange-500" },
    { name: "Employer Rating Classification", weight: "10%", risk: "Medium", color: "bg-yellow-500" },
    { name: "Recent Spikes in Hard Queries", weight: "5%", risk: "Low", color: "bg-blue-500" }
  ];
  return (
    <div className="space-y-3 mt-4">
      {points.map((p, idx) => (
        <div key={idx} className="bg-black/40 border border-white/5 p-4 rounded-xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${p.color}`} />
            <div>
              <h4 className="font-bold text-white text-xs md:text-sm">{p.name}</h4>
              <p className="text-[10px] text-gray-500">Risk Severity: {p.risk}</p>
            </div>
          </div>
          <span className="text-sm font-black text-orange-400 shrink-0">{p.weight}</span>
        </div>
      ))}
    </div>
  );
}

// CIBIL calculator simulator snippet
function CIBILSimulatorSnippet() {
  return (
    <div className="bg-black/40 border border-white/5 p-5 rounded-xl mt-4">
      <h4 className="font-bold text-white text-sm mb-4">Simulate CIBIL Score Actions</h4>
      <div className="grid grid-cols-3 gap-2.5 text-center">
        {[
          { action: "Clear CC Dues", impact: "+45 Points", color: "text-emerald-400" },
          { action: "Keep Usage <30%", impact: "+25 Points", color: "text-emerald-400" },
          { action: "2 Hard Queries", impact: "-15 Points", color: "text-rose-400" }
        ].map((item, idx) => (
          <div key={idx} className="bg-white/5 p-3 rounded-lg border border-white/5">
            <p className="text-[10px] text-gray-400 mb-1">{item.action}</p>
            <span className={`text-xs md:text-sm font-black ${item.color}`}>{item.impact}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Bank Statement evaluator checks
function StatementAuditTracker() {
  const steps = [
    { label: "Salary credits matching exactly with employer name", safe: true },
    { label: "Zero ECS/NACH auto-debit bounces in 6 months", safe: true },
    { label: "Frequent online betting or casino deposits", safe: false },
    { label: "Overdraft limit usage exceeding 90%", safe: false }
  ];
  return (
    <div className="space-y-2 mt-4">
      {steps.map((s, idx) => (
        <div key={idx} className="flex items-start gap-2.5 p-3 bg-black/40 border border-white/5 rounded-xl">
          {s.safe ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
          ): (
            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          )}
          <span className="text-xs text-gray-300 leading-normal">{s.label}</span>
        </div>
      ))}
    </div>
  );
}

// Eligibility Multipliers Table
function MultiplierTable() {
  return (
    <div className="overflow-hidden border border-white/5 rounded-xl mt-4 bg-black/40 text-xs">
      <table className="w-full text-left text-gray-300">
        <thead className="bg-white/5 font-semibold text-orange-400">
          <tr>
            <th className="p-3">Employer Category</th>
            <th className="p-3">Salary Multiplier</th>
            <th className="p-3">Approval Speed</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-white/5">
            <td className="p-3 font-medium text-white">Tier-A Corporates (MNCs)</td>
            <td className="p-3 font-semibold text-emerald-400">18x - 22x Salary</td>
            <td className="p-3 text-gray-400">Instant (Digital)</td>
          </tr>
          <tr className="border-b border-white/5">
            <td className="p-3 font-medium text-white">Tier-B Corporates</td>
            <td className="p-3 font-semibold text-orange-400">15x - 18x Salary</td>
            <td className="p-3 text-gray-400">24 - 48 Hours</td>
          </tr>
          <tr>
            <td className="p-3 font-medium text-white">Self-Employed / Freelance</td>
            <td className="p-3 font-semibold text-rose-400">ITR Based (2.5x Profit)</td>
            <td className="p-3 text-gray-400">3 - 5 Days</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// EMI Optimization Grid
function EMIOptimizationGrid() {
  return (
    <div className="grid grid-cols-2 gap-3 mt-4 text-xs">
      <div className="bg-black/40 border border-white/5 p-4 rounded-xl">
        <h5 className="font-bold text-white mb-1">Debt Snowball</h5>
        <p className="text-gray-400 leading-normal text-[10px]">Prepay smaller credit card outstanding balances to immediately drop your monthly active EMI count.</p>
      </div>
      <div className="bg-black/40 border border-white/5 p-4 rounded-xl">
        <h5 className="font-bold text-white mb-1">Tenure Balance</h5>
        <p className="text-gray-400 leading-normal text-[10px]">Increase tenure to lower EMI and pass bank checks, then prepay aggressively to minimize interest.</p>
      </div>
    </div>
  );
}

// Hub configurations mapping
const HUB_MAP: Record<string, HubConfig> = {
  'rejection': {
    title: 'Loan Rejection Resource Center, Recovery Manuals | Gavel AI',
    h1: 'Loan Rejection Manuals & Recovery Hub',
    description: 'Understand the primary reasons lenders reject applications. Compare rules across SBI, HDFC, ICICI, and learn how to salvage rejected files.',
    canonical: 'https://www.trygavel.com/loan-rejection-guides',
    icon: ShieldAlert,
    themeColor: 'text-rose-500',
    bgGradient: 'from-rose-500/5 to-transparent',
    filterFn: (p) => p.category === 'bank-rejection' || p.slug.includes('rejected'),
    visualTitle: 'Primary Rejection Heatmap',
    visualDesc: 'Statistical breakdown of loan rejections compiled from 50,000+ loan applications.',
    visualComponent: RejectionHeatmap,
    faqs: [
      { q: "How long should I wait to apply after a loan rejection?", a: "We recommend waiting 3 to 6 months. Applying immediately flags you as credit-hungry and triggers automated rejection rules." },
      { q: "Does a loan rejection drop my credit score?", a: "The rejection itself isn't reported to bureaus, but the associated hard inquiry drops your score by 5-10 points." }
    ]
  },
  'cibil': {
    title: 'CIBIL Score Optimization & Repair Guides | Gavel AI',
    h1: 'CIBIL Score Guides & Repair Hub',
    description: 'Get approved with low CIBIL. Learn how banks verify your credit history, fix active disputes, and boost your credit score fast.',
    canonical: 'https://www.trygavel.com/cibil-score-guides',
    icon: CreditCard,
    themeColor: 'text-orange-500',
    bgGradient: 'from-orange-500/5 to-transparent',
    filterFn: (p) => p.slug.includes('cibil') || p.category === 'intent',
    visualTitle: 'CIBIL Score Simulator Preview',
    visualDesc: 'Estimated impact of actions on your bureau score within 30-45 days.',
    visualComponent: CIBILSimulatorSnippet,
    faqs: [
      { q: "What is the minimum CIBIL score for a personal loan?", a: "Lenders typically require a score of 680. Scoring above 750 unlocks premium low interest rate offers." },
      { q: "How quickly can I fix errors in my CIBIL report?", a: "Bureaus usually resolve dispute logs within 30 to 45 days after verification." }
    ]
  },
  'statements': {
    title: 'Algorithmic Bank Statement Analysis Guidelines | Gavel AI',
    h1: 'Bank Statement Analysis Hub',
    description: 'How do lenders parse your statements? Learn how UPI credits, average balances, and mandate bounces impact underwriting checks.',
    canonical: 'https://www.trygavel.com/bank-statement-analysis',
    icon: FileText,
    themeColor: 'text-blue-500',
    bgGradient: 'from-blue-500/5 to-transparent',
    filterFn: (p) => p.slug.includes('statement') || p.category === 'bank-analysis',
    visualTitle: 'Statement Parsing Scans',
    visualDesc: 'Critical checks performed by automated document analyzers.',
    visualComponent: StatementAuditTracker,
    faqs: [
      { q: "Do banks check UPI transaction history?", a: "Yes, automated statements read UPI records. Frequent gaming, betting, or cash transfers can trigger warnings." },
      { q: "What is a safe Average Monthly Balance (AMB)?", a: "Lenders prefer a buffer balance of at least 10% to 15% of your monthly salary." }
    ]
  },
  'eligibility': {
    title: 'Salary & Profession Loan Eligibility Hub | Gavel AI',
    h1: 'Salary & Career Eligibility Center',
    description: 'Check pre-approved loan limits. Browse eligibility rules across 30+ salaries and 25+ professions in India.',
    canonical: 'https://www.trygavel.com/loan-eligibility-center',
    icon: Landmark,
    themeColor: 'text-emerald-500',
    bgGradient: 'from-emerald-500/5 to-transparent',
    filterFn: (p) => p.category === 'salary' || p.category === 'profession' || p.category === 'salary-profession',
    visualTitle: 'Lender Salary Multipliers',
    visualDesc: 'Typical underwriting multipliers based on employer rating categories.',
    visualComponent: MultiplierTable,
    faqs: [
      { q: "How much loan can I get on a ₹30,000 monthly salary?", a: "On a ₹30K take-home with no active EMIs, you can typically get up to ₹5.4 Lakhs as a personal loan." },
      { q: "How do banks tier corporate employers?", a: "They split companies into Cat-A (top MNCs, PSUs), Cat-B (mid-level firms), and Cat-C (smaller setups) to assign interest rates." }
    ]
  },
  'emi': {
    title: 'EMI Optimization & Debt Management Hub | Gavel AI',
    h1: 'EMI Stress & Debt Management Center',
    description: 'Calculate and minimize your borrowing costs. Learn about prepayment impact, loan tenure optimization, and balance transfers.',
    canonical: 'https://www.trygavel.com/emi-education-hub',
    icon: Calculator,
    themeColor: 'text-purple-500',
    bgGradient: 'from-purple-500/5 to-transparent',
    filterFn: (p) => p.category === 'loan-amount' || p.slug.includes('emi') || p.slug.includes('calculator'),
    visualTitle: 'EMI Reduction Strategies',
    visualDesc: 'Underwriting-safe strategies to lower your debt burden.',
    visualComponent: EMIOptimizationGrid,
    faqs: [
      { q: "What is the debt-to-income (DTI) limit for personal loans?", a: "Banks generally reject applications if your active EMIs exceed 50% of your take-home salary." },
      { q: "Does prepaying a loan save substantial interest?", a: "Yes, prepaying even 1 extra EMI per year can shorten your tenure by over 12 months and save massive interest charges." }
    ]
  }
};

const TopicalHub = ({ topic }: { topic: string }) => {
  const navigate = useNavigate();

  React.useEffect(() => {
    trackTopicalHubVisit(topic);
  }, [topic]);

  const config = useMemo(() => {
    return HUB_MAP[topic] || HUB_MAP['rejection'];
  }, [topic]);

  const allPages = useMemo(() => {
    return Array.from(getSEODatabase().values());
  }, []);

  const matchedPages = useMemo(() => {
    return allPages.filter(config.filterFn).slice(0, 18);
  }, [allPages, config]);

  const IconComponent = config.icon;
  const VisualComponent = config.visualComponent;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans selection:bg-orange-500/30 overflow-x-hidden">
      <Helmet>
        <title>{config.title}</title>
        <meta name="description" content={config.description} />
        <link rel="canonical" href={config.canonical} />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: config.h1,
          description: config.description,
          url: config.canonical,
          publisher: { '@type': 'Organization', name: 'Gavel AI' }
        })}</script>
      </Helmet>

      {/* Grid backdrop */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,127,14,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,127,14,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />
        <div className={`absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-b ${config.bgGradient} rounded-full blur-[120px]`} />
      </div>

      <Navbar />

      <main className="flex-1 pt-32 pb-24 relative z-10">
        <div className="container mx-auto px-6 max-w-6xl relative z-10">

          {/* Breadcrumbs */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-gray-500 mb-8 flex-wrap">
            <Link to="/" className="hover:text-orange-400 transition-colors">Home</Link>
            <span className="text-gray-600">/</span>
            <Link to="/tools" className="hover:text-orange-400 transition-colors">Tools</Link>
            <span className="text-gray-600">/</span>
            <span className="text-gray-300">{config.h1}</span>
          </nav>

          {/* Hero Header Section */}
          <div className="grid lg:grid-cols-12 gap-8 items-center mb-16">
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 rounded-full px-4 py-1.5 mb-6">
                <Zap className="w-4 h-4 text-orange-500" />
                <span className="text-xs font-semibold tracking-wide text-orange-400 uppercase">Topical Authority Cluster</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight text-white leading-tight">
                {config.h1}
              </h1>
              <p className="text-lg text-gray-400 leading-relaxed mb-6">
                {config.description}
              </p>
              <div className="flex gap-4">
                <Button onClick={() => navigate('/loan-approval-predictor')} className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-5 rounded-lg text-sm">
                  Run AI Underwriting Audit <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button onClick={() => navigate('/all-guides')} variant="outline" className="border-white/10 hover:bg-white/5 text-white font-bold px-6 py-5 rounded-lg text-sm">
                  Browse All Guides
                </Button>
              </div>
            </div>

            {/* Visual Callout Component Box */}
            <div className="lg:col-span-5 bg-white/5 border border-white/10 p-6 md:p-8 rounded-2xl">
              <h3 className="text-base font-bold text-white flex items-center gap-2 mb-1">
                <IconComponent className={`w-5 h-5 ${config.themeColor}`} /> {config.visualTitle}
              </h3>
              <p className="text-[11px] text-gray-500 leading-normal mb-4">{config.visualDesc}</p>
              <VisualComponent />
            </div>
          </div>

          {/* Directory Listings */}
          <div className="border-t border-white/10 pt-16 mb-16">
            <h2 className="text-2xl font-bold text-white mb-2">Essential Guides & Manuals</h2>
            <p className="text-sm text-gray-400 mb-8">Selected analytical reads to optimize your borrowing odds.</p>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {matchedPages.map(page => (
                <Link
                  key={page.slug}
                  to={`/${page.slug}`}
                  className="bg-[#0A0A0A] border border-white/5 hover:border-orange-500/20 p-5 rounded-xl hover:bg-white/5 transition-all group flex flex-col justify-between"
                >
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-orange-500 block mb-2">{page.category.replace(/-/g, ' ')}</span>
                    <h3 className="font-bold text-white text-base group-hover:text-orange-400 transition-colors line-clamp-2 leading-tight mb-2">
                      {page.h1}
                    </h3>
                    <p className="text-xs text-gray-500 line-clamp-3 leading-relaxed mb-4">
                      {page.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-orange-400 font-bold group-hover:translate-x-1 transition-transform mt-auto">
                    Read Underwriting Manual <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Frequently Asked Questions */}
          <div className="border-t border-white/10 pt-16">
            <h2 className="text-2xl font-bold text-white mb-8">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {config.faqs.map((faq, idx) => (
                <div key={idx} className="bg-white/5 border border-white/10 p-6 rounded-xl">
                  <h4 className="font-bold text-white text-base mb-2">{faq.q}</h4>
                  <p className="text-gray-400 text-sm leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TopicalHub;
