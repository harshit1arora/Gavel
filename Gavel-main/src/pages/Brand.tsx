import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Sparkles, Palette, Download, Copy, Check, ShieldCheck, Heart, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const Brand = () => {
  const [copied, setCopied] = useState<string | null>(null);

  const colors = [
    { name: "Brand Orange", hex: "#FF5C00", role: "Primary brand color, representing energy and speed.", text: "text-[#FF5C00]" },
    { name: "Accent Amber", hex: "#F59E0B", role: "Secondary highlights, rating tags, warnings.", text: "text-amber-500" },
    { name: "Dark Neutral", hex: "#050505", role: "Main background color for cinematic dark mode.", text: "text-gray-400" },
    { name: "Slate Border", hex: "#1F2937", role: "Soft card borders and grid structure.", text: "text-gray-500" }
  ];

  const handleCopy = (hex: string) => {
    navigator.clipboard.writeText(hex).then(() => {
      setCopied(hex);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const domain = "https://www.trygavel.com";

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans selection:bg-orange-500/30 overflow-x-hidden">
      <Helmet>
        <title>Brand Assets & Guidelines | Gavel AI</title>
        <meta name="description" content="Official brand guidelines, logos, assets, and color codes for Gavel AI. Explore our identity and design system." />
        <link rel="canonical" href="https://www.trygavel.com/brand" />
        <script type="application/ld+json">
          {`
            {
              "@context": "https://schema.org",
              "@type": "WebPage",
              "name": "Gavel AI Brand Guidelines",
              "url": "https://www.trygavel.com/brand",
              "description": "Official brand guidelines and visual assets for Gavel AI."
            }
          `}
        </script>
      </Helmet>

      <Navbar />

      <main className="flex-1 pt-32 pb-24 relative z-10">
        <div className="container mx-auto px-6 max-w-4xl">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 text-orange-400 text-sm mb-4 px-4 py-1.5 rounded-full backdrop-blur-sm">
              <Palette className="w-4 h-4 text-orange-400" />
              <span className="text-xs font-semibold tracking-wide uppercase">Brand Center</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white mb-6">
              Gavel AI <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">Guidelines</span>
            </h1>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Our brand guidelines represent our commitment to clarity, accessibility, and consumer-first AI financial intelligence. Find our logo, color palettes, and assets below.
            </p>
          </div>

          {/* Logo Showcase */}
          <section className="bg-white/5 border border-white/10 rounded-3xl p-8 mb-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent pointer-events-none" />
            <div className="relative z-10">
              <h2 className="text-2xl font-bold mb-6 text-white flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-orange-500" /> Official Logo
              </h2>
              <div className="grid md:grid-cols-2 gap-8 items-center">
                {/* Logo Dark */}
                <div className="p-10 bg-black/80 border border-white/10 rounded-2xl flex flex-col items-center justify-center text-center">
                  <div className="flex items-center gap-3 mb-6">
                    <svg viewBox="0 0 100 100" className="w-12 h-12 rounded-lg" xmlns="http://www.w3.org/2000/svg">
                      <rect width="100" height="100" fill="#FF5C00" />
                      <polygon points="50,15 80.3,68 19.7,68" fill="#1A1C1E" />
                      <polygon points="16.9,73 83.1,73 90,85 10,85" fill="#1A1C1E" />
                    </svg>
                    <span className="font-['DM_Sans'] font-bold text-2xl tracking-[0.05em] text-white">GAVEL AI</span>
                  </div>
                  <span className="text-xs text-gray-500 mb-4">Logo for Dark Backgrounds</span>
                  <a href="/logo.png" download className="text-xs font-semibold text-orange-400 hover:text-orange-300 flex items-center gap-1.5">
                    <Download className="w-3.5 h-3.5" /> Download PNG
                  </a>
                </div>

                {/* Logo Light */}
                <div className="p-10 bg-white border border-gray-200 rounded-2xl flex flex-col items-center justify-center text-center">
                  <div className="flex items-center gap-3 mb-6">
                    <svg viewBox="0 0 100 100" className="w-12 h-12 rounded-lg" xmlns="http://www.w3.org/2000/svg">
                      <rect width="100" height="100" fill="#FF5C00" />
                      <polygon points="50,15 80.3,68 19.7,68" fill="#1A1C1E" />
                      <polygon points="16.9,73 83.1,73 90,85 10,85" fill="#1A1C1E" />
                    </svg>
                    <span className="font-['DM_Sans'] font-bold text-2xl tracking-[0.05em] text-black">GAVEL AI</span>
                  </div>
                  <span className="text-xs text-gray-500 mb-4">Logo for Light Backgrounds</span>
                  <a href="/logo.png" download className="text-xs font-semibold text-orange-600 hover:text-orange-500 flex items-center gap-1.5">
                    <Download className="w-3.5 h-3.5" /> Download PNG
                  </a>
                </div>
              </div>
            </div>
          </section>

          {/* Color swatches */}
          <section className="bg-[#0A0A0A] border border-white/5 rounded-3xl p-8 mb-12">
            <h2 className="text-2xl font-bold mb-6 text-white flex items-center gap-2">
              <Palette className="w-6 h-6 text-orange-500" /> Color System
            </h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6">
              {colors.map((c) => (
                <div key={c.hex} className="bg-black/50 border border-white/10 rounded-2xl p-5 flex flex-col justify-between h-48">
                  <div>
                    <div className="w-8 h-8 rounded-lg mb-4 border border-white/10" style={{ backgroundColor: c.hex }} />
                    <h3 className="font-bold text-sm text-white mb-1">{c.name}</h3>
                    <p className="text-[11px] text-gray-400 leading-normal">{c.role}</p>
                  </div>
                  <button onClick={() => handleCopy(c.hex)} className="text-xs font-mono text-gray-400 hover:text-white flex items-center justify-between border border-white/10 rounded-lg p-2 bg-white/5 mt-4">
                    <span>{c.hex}</span>
                    {copied === c.hex ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Guidelines info */}
          <section className="grid md:grid-cols-2 gap-8 mb-16">
            <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-green-400" /> Correct Usage
              </h3>
              <ul className="space-y-3 text-sm text-gray-300">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                  <span>Always write as <strong>Gavel AI</strong> or <strong>Gavel</strong>.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                  <span>Maintain the brand orange accent color ratio across pages.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                  <span>Always link to our canonical website domain: <strong>trygavel.com</strong>.</span>
                </li>
              </ul>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-400" /> Entity Identity
              </h3>
              <p className="text-sm text-gray-300 leading-relaxed">
                Gavel AI is a financial technology brand. We are registered as an AI-powered consumer financial intelligence entity, providing transparent eligibility scoring, EMI calculators, and credit guidance. We do not provide loans directly, but act as a decision-support and lender matching layer.
              </p>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Brand;
