import React, { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Search, Zap, ArrowRight, BookOpen, Calculator, Landmark, ShieldCheck, MapPin, Briefcase, FileText } from 'lucide-react';
import { getSEODatabase, SEO_CATEGORIES, type SEOPage } from '../data/seo-content';
import { Input } from '@/components/ui/input';
import { trackSearchUsage } from '../utils/analytics';

const SitemapHub = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const allPages = useMemo(() => {
    return Array.from(getSEODatabase().values());
  }, []);

  // Filter logic
  const filteredPages = useMemo(() => {
    let pages = allPages;
    if (activeCategory !== 'all') {
      pages = pages.filter(p => p.category === activeCategory);
    }
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      pages = pages.filter(p => 
        p.title.toLowerCase().includes(q) || 
        p.h1.toLowerCase().includes(q) || 
        p.slug.toLowerCase().includes(q)
      );
    }
    return pages;
  }, [allPages, activeCategory, searchQuery]);

  // Telemetry tracking for search queries with a debounce
  React.useEffect(() => {
    if (!searchQuery.trim()) return;
    const timer = setTimeout(() => {
      trackSearchUsage(searchQuery, filteredPages.length);
    }, 1000);
    return () => clearTimeout(timer);
  }, [searchQuery, filteredPages.length]);

  // Group pages by category for structured sections
  const groupedCategories = useMemo(() => {
    const groups: Record<string, SEOPage[]> = {};
    allPages.forEach(p => {
      if (!groups[p.category]) groups[p.category] = [];
      groups[p.category].push(p);
    });
    return groups;
  }, [allPages]);

  // CIBIL and salary trending quick tags
  const trendingSearches = [
    { label: "₹25K Salary Eligibility", slug: "loan-eligibility-25k-salary" },
    { label: "SBI Rejection Reasons", slug: "sbi-loan-rejection-reasons" },
    { label: "Loans for Freelancers", slug: "personal-loan-for-freelancer" },
    { label: "Personal Loan in Bangalore", slug: "personal-loan-in-bangalore" },
    { label: "Low CIBIL Score Guide", slug: "poor-cibil-score" }
  ];

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans selection:bg-orange-500/30 overflow-x-hidden">
      <Helmet>
        <title>Financial Intelligence Directory & Guides Hub | Gavel AI</title>
        <meta name="description" content="Explore our directory of 1,000+ programmatic loan eligibility guides, credit risk parameters, bank-specific rules, and financial tools." />
        <link rel="canonical" href="https://www.trygavel.com/all-guides" />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: 'Gavel AI Financial Directory Hub',
          description: 'Alphabetical directory of all loan guides, salaries, cities, and banks.',
          url: 'https://www.trygavel.com/all-guides',
          publisher: { '@type': 'Organization', name: 'Gavel AI' }
        })}</script>
      </Helmet>

      {/* Volumetric background lights */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,127,14,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,127,14,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-orange-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px]" />
      </div>

      <Navbar />

      <main className="flex-1 pt-32 pb-24 relative z-10">
        <div className="container mx-auto px-6 max-w-6xl relative z-10">
          
          {/* Header */}
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 rounded-full px-4 py-1.5 mb-6">
              <Zap className="w-4 h-4 text-orange-500 animate-pulse" />
              <span className="text-xs font-semibold tracking-wide text-orange-400 uppercase">Interactive Resource Index</span>
            </motion.div>
            <motion.h1 initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight text-white leading-tight">
              Gavel AI <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">Knowledge Directory</span>
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="text-base md:text-lg text-gray-400 leading-relaxed">
              Explore our unified index of {allPages.length}+ search-intent guides, underwriting manuals, bank scorecards, and local eligibility benchmarks.
            </motion.p>
          </div>

          {/* Smart Search Panel */}
          <div className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-6 md:p-8 mb-12 shadow-2xl relative">
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search loan eligibility, bank rejection reasons, cities, professions, or salary tiers..."
                className="w-full pl-12 pr-4 py-6 bg-black border-white/10 hover:border-orange-500/30 focus:border-orange-500/50 rounded-xl text-white placeholder-gray-500 transition-colors"
              />
            </div>
            
            {/* Trending Quick Search Buttons */}
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider mr-1">Trending:</span>
              {trendingSearches.map((tag, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setSearchQuery(tag.label);
                    setActiveCategory('all');
                  }}
                  className="text-xs bg-white/5 border border-white/10 hover:border-orange-500/30 hover:bg-orange-500/5 text-gray-300 hover:text-orange-400 rounded-full px-3 py-1.5 transition-all"
                >
                  {tag.label}
                </button>
              ))}
            </div>
          </div>

          {/* Category Navigation Pills */}
          <div className="flex flex-wrap gap-2 mb-10 overflow-x-auto pb-2 scrollbar-thin">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider border transition-all ${
                activeCategory === 'all'
                  ? 'bg-orange-500 border-orange-600 text-white shadow-lg shadow-orange-500/20'
                  : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20 hover:text-white'
              }`}
            >
              All Directory ({allPages.length})
            </button>
            {SEO_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider border transition-all whitespace-nowrap ${
                  activeCategory === cat.id
                    ? 'bg-orange-500 border-orange-600 text-white shadow-lg shadow-orange-500/20'
                    : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20 hover:text-white'
                }`}
              >
                {cat.label} ({groupedCategories[cat.id]?.length || 0})
              </button>
            ))}
          </div>

          {/* Page Grid Listing */}
          <div className="bg-[#050505] rounded-2xl border border-white/5 p-6 md:p-8 min-h-[400px]">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-orange-500" /> Showing {filteredPages.length} Guides
              </h2>
              <span className="text-xs text-gray-500 font-semibold">Page 1 of 1</span>
            </div>

            {filteredPages.length === 0 ? (
              <div className="text-center py-20">
                <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-white mb-2">No matching guides found</h3>
                <p className="text-gray-500 text-sm max-w-md mx-auto">
                  Try adjusting your search parameters or query another financial category.
                </p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPages.map(page => (
                  <motion.div
                    key={page.slug}
                    layout
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Link
                      to={`/${page.slug}`}
                      className="flex items-start justify-between gap-3 p-4 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-orange-500/20 rounded-xl transition-all duration-200 group h-full"
                    >
                      <div className="min-w-0">
                        <span className="text-[10px] uppercase font-bold text-orange-500 tracking-wider block mb-1">
                          {page.category.replace(/-/g, ' ')}
                        </span>
                        <h3 className="font-semibold text-white text-sm group-hover:text-orange-400 transition-colors line-clamp-2 leading-snug">
                          {page.h1}
                        </h3>
                        <p className="text-xs text-gray-500 mt-2 line-clamp-2 leading-relaxed">
                          {page.description}
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-orange-400 group-hover:translate-x-1 transition-all shrink-0 mt-1" />
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default SitemapHub;
