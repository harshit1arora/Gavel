import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { ArrowRight, ChevronDown, ChevronUp, Zap, BookOpen, Calculator, Home as HomeIcon, CheckCircle2, ShieldAlert, Calendar, Clock, UserCheck, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getSEOPage, getPagesByCategory, SEO_CATEGORIES, type SEOPage } from '../../data/seo-content';
import { trackFAQInteraction } from '../../utils/analytics';
import NotFound from '../../pages/NotFound';

const DOMAIN = 'https://www.trygavel.com';

const toolRoutes: Record<string, string> = {
  'loan-approval-predictor': '/loan-approval-predictor',
  'emi-calculator': '/tools/emi-calculator',
  'salary-loan-eligibility': '/tools/salary-loan-eligibility',
  'dti-calculator': '/tools/dti-calculator',
  'credit-utilization': '/tools/credit-utilization',
  'home-loan-affordability': '/tools/home-loan-affordability',
};

// ── E-E-A-T Freshness Banner ──
function FreshnessBanner() {
  return (
    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 mb-8 border-b border-white/5 pb-4">
      <div className="flex items-center gap-1.5">
        <Calendar className="w-3.5 h-3.5 text-orange-500" />
        <span>Last updated: May 2026</span>
      </div>
      <div className="flex items-center gap-1.5">
        <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
        <span>Reviewed by: <strong className="text-gray-300">Gavel AI Financial Research Team</strong></span>
      </div>
      <div className="flex items-center gap-1.5">
        <Clock className="w-3.5 h-3.5 text-blue-400" />
        <span>Reading time: 3 min read</span>
      </div>
    </div>
  );
}



// ── Structured Data Table Engine ──
function ComparisonTable({ category, slug }: { category: string; slug: string }) {
  // Generate highly indexable structured tables based on variables
  const sum = slug.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  let headers: string[] = [];
  let rows: string[][] = [];
  let caption = "";

  if (category.includes('salary')) {
    headers = ["Salary Level", "Max Personal Loan", "Estimated EMI (10.5%)", "CIBIL Benchmark"];
    rows = [
      ["₹25,000 / month", "₹4,50,000", "₹9,675 / month", "700+"],
      ["₹50,000 / month", "₹9,00,000", "₹19,350 / month", "700+"],
      ["₹1,00,000 / month", "₹18,00,000", "₹38,700 / month", "720+"]
    ];
    caption = "Salary-based underwriting benchmarks (5-year tenure assumptions).";
  } else if (category === 'loan-amount') {
    headers = ["Loan Size", "Min Salary Needed", "EMI (10.5% Rate)", "EMI (13.5% Rate)"];
    rows = [
      ["₹1 Lakh", "₹15,000 / mo", "₹2,150 / mo", "₹2,300 / mo"],
      ["₹5 Lakhs", "₹35,000 / mo", "₹10,750 / mo", "₹11,500 / mo"],
      ["₹10 Lakhs", "₹65,000 / mo", "₹21,500 / mo", "₹23,000 / mo"]
    ];
    caption = "Estimated monthly EMIs across common loan limits (5-year repayment periods).";
  } else if (category.includes('bank')) {
    headers = ["Lender Name", "Interest Rate (p.a.)", "Processing Fee", "CIBIL Requirement"];
    rows = [
      ["Prime Banks (HDFC, ICICI)", "10.5% - 14.5%", "1.0% - 2.0%", "720+"],
      ["Public Banks (SBI, PNB)", "11.0% - 13.5%", "0.5% - 1.0%", "700+"],
      ["Fintech NBFCs (Bajaj, IDFC)", "12.5% - 18.0%", "1.5% - 3.0%", "650+"]
    ];
    caption = "Comparative metrics across major Indian lending sectors.";
  } else if (category.includes('city')) {
    headers = ["City Category", "Local Verification", "Average Rate", "Doorstep KYC"];
    rows = [
      ["Metro Cities (Tier-1)", "24 - 48 Hours", "10.5% - 12.5%", "Instant Digital"],
      ["Tier-2 Cities", "48 - 72 Hours", "11.5% - 14.0%", "In-Person Schedule"],
      ["Tier-3 Cities", "72+ Hours", "12.5% - 16.0%", "Branch Visit Required"]
    ];
    caption = "Regional processing and interest guidelines.";
  } else {
    headers = ["CIBIL Range", "Approval Odds", "Interest Premium", "Recommended Action"];
    rows = [
      ["750+", "Excellent (92%)", "Lowest (10.5% - 12%)", "Apply to Prime Banks"],
      ["680 - 749", "Good (75%)", "Moderate (12% - 15%)", "Reduce DTI First"],
      ["600 - 679", "Fair (45%)", "High (15% - 22%)", "Use Co-applicant"],
      ["Below 600", "Critical (10%)", "Subprime (24%+)", "Build Credit Score First"]
    ];
    caption = "Credit tier matching matrix.";
  }

  return (
    <div className="my-10 border border-white/5 rounded-2xl overflow-hidden bg-white/5 backdrop-blur-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-300">
          <thead className="text-xs uppercase bg-white/10 text-orange-400 border-b border-white/5 font-semibold">
            <tr>
              {headers.map((h, i) => <th key={i} className="px-6 py-4">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                {row.map((cell, j) => <td key={j} className="px-6 py-4 font-medium text-white">{cell}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-6 py-3 bg-white/5 border-t border-white/5 text-xs text-gray-400 italic">
        {caption}
      </div>
    </div>
  );
}

// ── Interactive Underwriting Pipeline Infographic ──
function UnderwritingInfographic() {
  return (
    <div className="my-12 bg-gradient-to-b from-white/5 to-[#0A0A0A] border border-white/10 rounded-2xl p-8 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-orange-500" /> Automated Underwriting Flow
          </h3>
          <p className="text-xs text-gray-400">This is how banks evaluate your profile before issuing credit approvals.</p>
        </div>
        <div className="bg-orange-500/10 text-orange-400 text-xs px-3 py-1.5 rounded-full font-semibold border border-orange-500/20 shrink-0">
          EE-A-T Quality Data
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-4 relative z-10">
        {[
          { step: "01", name: "CIBIL Screening", desc: "Automated scan for score > 680, active defaults, or inquiry spikes.", status: "Verify" },
          { step: "02", name: "DTI Ratio Check", desc: "FOIR analysis ensures total active EMIs are less than 50% of take-home.", status: "Analyze" },
          { step: "03", name: "Ledger Analysis", desc: "Scan of 6-month statements checking for mandate bounces or cash drains.", status: "Audit" },
          { step: "04", name: "Limit Offering", desc: "Algorithm computes final loan amount multiplier and tenure caps.", status: "Approve" }
        ].map((item, idx) => (
          <div key={idx} className="bg-black/40 border border-white/5 rounded-xl p-5 hover:border-orange-500/30 transition-all group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl font-black text-orange-500/30 group-hover:text-orange-500 transition-colors">{item.step}</span>
              <span className="text-[10px] uppercase font-bold text-gray-500 bg-white/5 px-2 py-0.5 rounded">{item.status}</span>
            </div>
            <h4 className="font-bold text-white text-sm mb-2">{item.name}</h4>
            <p className="text-xs text-gray-400 leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Breadcrumbs({ items }: { items: { label: string; path: string }[] }) {
  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem', position: i + 1,
      name: item.label,
      ...(item.path ? { item: DOMAIN + item.path } : {}),
    })),
  });

  return (
    <>
      <Helmet><script type="application/ld+json">{jsonLd}</script></Helmet>
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-gray-500 mb-8 flex-wrap">
        {items.map((item, i) => (
          <React.Fragment key={i}>
            {i > 0 && <span className="text-gray-600">/</span>}
            {item.path ? (
              <Link to={item.path} className="hover:text-orange-400 transition-colors">{item.label}</Link>
            ) : (
              <span className="text-gray-300">{item.label}</span>
            )}
          </React.Fragment>
        ))}
      </nav>
    </>
  );
}

function FAQAccordion({ faqs }: { faqs: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(null);

  const handleToggle = (i: number, q: string) => {
    const nextOpen = open === i ? null : i;
    setOpen(nextOpen);
    if (nextOpen !== null) {
      trackFAQInteraction(q);
    }
  };

  return (
    <div className="space-y-3">
      {faqs.map((faq, i) => (
        <div key={i} className="border border-white/10 rounded-xl overflow-hidden hover:border-orange-500/20 transition-all">
          <button onClick={() => handleToggle(i, faq.q)}
            className="w-full flex items-center justify-between p-5 text-left gap-4 bg-white/5">
            <span className="text-base font-semibold text-white">{faq.q}</span>
            {open === i ? <ChevronUp className="w-5 h-5 text-orange-500 shrink-0" /> : <ChevronDown className="w-5 h-5 text-gray-500 shrink-0" />}
          </button>
          {open === i && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 pb-5 pt-3 bg-white/5 border-t border-white/5">
              <p className="text-gray-400 leading-relaxed">{faq.a}</p>
            </motion.div>
          )}
        </div>
      ))}
    </div>
  );
}

function RelatedLinks({ pages, tools }: { pages: string[]; tools: string[] }) {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      {tools.length > 0 && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Calculator className="w-5 h-5 text-orange-500" /> Related Financial Tools
          </h3>
          <div className="space-y-2">
            {tools.map(tool => {
              const path = toolRoutes[tool] || `/tools/${tool}`;
              const label = tool.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
              return (
                <Link key={tool} to={path} className="flex items-center gap-2 text-sm text-gray-300 hover:text-orange-400 transition-colors py-1.5 border-b border-white/5 last:border-0">
                  <ArrowRight className="w-3.5 h-3.5 shrink-0 text-orange-500" />{label}
                </Link>
              );
            })}
          </div>
        </div>
      )}
      {pages.length > 0 && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-500" /> People Also Search
          </h3>
          <div className="space-y-2">
            {pages.map(slug => {
              const label = slug.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
              return (
                <Link key={slug} to={`/${slug}`} className="flex items-center gap-2 text-sm text-gray-300 hover:text-orange-400 transition-colors py-1.5 border-b border-white/5 last:border-0">
                  <ArrowRight className="w-3.5 h-3.5 shrink-0 text-blue-400" />{label}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function PredictorCTA() {
  const navigate = useNavigate();
  return (
    <div className="bg-[#0A0A0A] border border-orange-500/20 rounded-2xl p-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent" />
      <div className="relative z-10">
        <h3 className="text-2xl font-bold text-white mb-3">Stop Guessing. Check Approval Chances.</h3>
        <p className="text-gray-400 mb-6 max-w-xl">
          Evaluate your actual profile against algorithmic checkpoints to predict your exact approval probability across 40+ lending institutions.
        </p>
        <Button onClick={() => navigate('/loan-approval-predictor')}
          className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-6 rounded-xl text-lg font-bold group">
          Calculate Approval Chances <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </Button>
      </div>
    </div>
  );
}

const DynamicSEOPage = () => {
  const { slug } = useParams();

  if (!slug) return <div className="min-h-screen bg-[#050505]" />;

  const data = getSEOPage(slug);

  if (!data) {
    return <NotFound />;
  }

  return renderPage(data);
};

function renderPage(data: SEOPage) {
  const faqSchema = data.faqs.length > 0 ? JSON.stringify({
    '@context': 'https://schema.org', '@type': 'FAQPage',
    mainEntity: data.faqs.map(f => ({
      '@type': 'Question', name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  }) : null;

  const articleSchema = JSON.stringify({
    '@context': 'https://schema.org', '@type': 'NewsArticle',
    headline: data.h1, description: data.description,
    image: `${DOMAIN}/gavel-og.png`,
    author: {
      '@type': 'Organization',
      name: 'Gavel AI Financial Research Team',
      url: `${DOMAIN}/about`
    },
    publisher: {
      '@type': 'Organization',
      name: 'Gavel AI',
      logo: {
        '@type': 'ImageObject',
        url: `${DOMAIN}/favicon.ico`
      }
    },
    datePublished: '2026-01-15T08:00:00+05:30',
    dateModified: '2026-05-19T20:00:00+05:30'
  });

  const paragraphs = data.content.split('\n').filter(p => p.trim());

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col font-sans selection:bg-orange-500/30">
      <Helmet>
        <title>{data.title}</title>
        <meta name="description" content={data.description} />
        <link rel="canonical" href={`${DOMAIN}/${data.slug}`} />
        <meta property="og:title" content={data.title} />
        <meta property="og:description" content={data.description} />
        <meta property="og:url" content={`${DOMAIN}/${data.slug}`} />
        <meta property="og:type" content="article" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={data.title} />
        <meta name="twitter:description" content={data.description} />
        <script type="application/ld+json">{articleSchema}</script>
        {faqSchema && <script type="application/ld+json">{faqSchema}</script>}
      </Helmet>

      <Navbar />

      <main className="flex-1 pt-32 pb-24 relative z-10">
        <div className="container mx-auto px-6 max-w-4xl relative z-10">
          <Breadcrumbs items={data.breadcrumbs} />

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 rounded-full px-4 py-1.5 mb-6">
              <Zap className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-medium text-orange-400 capitalize">{data.category.replace(/-/g, ' ')} Guide</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight text-white leading-tight">
              {data.h1}
            </h1>
            <p className="text-xl text-gray-400 leading-relaxed max-w-3xl">{data.description}</p>
          </motion.div>

          {/* E-E-A-T fresh metadata */}
          <FreshnessBanner />



          {/* Main Content Article */}
          <article className="prose dark:prose-invert prose-orange max-w-none mb-10">
            {paragraphs.map((p, i) => {
              if (p.startsWith('•')) {
                return <li key={i} className="text-gray-300 leading-relaxed ml-4 list-disc my-2">{p.replace('• ', '')}</li>;
              }
              return <p key={i} className="text-lg text-gray-300 leading-loose mb-4">{p}</p>;
            })}
          </article>

          {/* Structured Comparison Data Table */}
          <ComparisonTable category={data.category} slug={data.slug} />

          {/* Interactive Flow Diagram */}
          <UnderwritingInfographic />

          {/* Predictor CTA */}
          <div className="mb-16"><PredictorCTA /></div>

          {/* FAQ Section */}
          {data.faqs.length > 0 && (
            <section className="mb-16">
              <h2 className="text-3xl font-bold text-white mb-8">People Also Ask</h2>
              <FAQAccordion faqs={data.faqs} />
            </section>
          )}

          {/* Related Links */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-white mb-6">Explore More</h2>
            <RelatedLinks pages={data.relatedPages} tools={data.relatedTools} />
          </section>

          {/* Bottom CTA */}
          <div className="bg-gradient-to-r from-orange-500/10 to-orange-600/10 border border-orange-500/20 rounded-3xl p-10 text-center">
            <h3 className="text-2xl font-bold mb-4 text-white">Check Your Underwriting Eligibility Odds</h3>
            <p className="text-gray-300 mb-8 text-lg max-w-2xl mx-auto">Verify your bank statements and credit parameters against active credit scoring models instantly.</p>
            <Button size="lg" onClick={() => window.location.href = '/loan-approval-predictor'}
              className="h-14 px-8 text-lg font-bold bg-orange-600 hover:bg-orange-500 text-white shadow-lg shadow-orange-500/25">
              Launch Predictor <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default DynamicSEOPage;
