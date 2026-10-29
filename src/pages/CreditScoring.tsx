import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CTASection from "@/components/CTASection";
import { FadeUp } from "@/components/gavel/FadeUp";
import {
  Database, Network, Smartphone, LineChart, ArrowRight,
  TrendingUp, ShieldCheck, BarChart3, Zap
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const dataSources = [
  {
    icon: Database,
    title: "Bureau Integration",
    desc: "CIBIL, Experian, Equifax, and CRIF Highmark fetched in parallel with a single API call.",
  },
  {
    icon: Network,
    title: "Bank Statements",
    desc: "Account Aggregator (AA) and net banking parsers extract 60+ cashflow signals.",
  },
  {
    icon: Smartphone,
    title: "Device Telemetry",
    desc: "OS metadata, geolocation stability, and behavioral biometrics for thin-file applicants.",
  },
  {
    icon: LineChart,
    title: "Alternative Signals",
    desc: "Telecom, GST filings, and utility payment histories mapped to creditworthiness.",
  },
];

const riskTiers = [
  {
    label: "LOW RISK",
    score: "Score 750+",
    outcome: "Auto Approve",
    color: "text-emerald-500",
    border: "border-emerald-500/30",
    bg: "bg-emerald-500/10",
    outcomeBg: "bg-emerald-500/10 text-emerald-500",
  },
  {
    label: "MEDIUM RISK",
    score: "Score 650–749",
    outcome: "Manual Review",
    color: "text-amber-500",
    border: "border-amber-500/30",
    bg: "bg-amber-500/10",
    outcomeBg: "bg-amber-500/10 text-amber-500",
  },
  {
    label: "HIGH RISK",
    score: "Score < 650",
    outcome: "Hard Reject",
    color: "text-destructive",
    border: "border-destructive/30",
    bg: "bg-destructive/10",
    outcomeBg: "bg-destructive/10 text-destructive",
  },
];

const explainabilityFeatures = [
  "Feature importance breakdowns per applicant",
  "Adverse action code mapping",
  "Scorecard performance monitoring",
  "Gini & KS statistic tracking in real-time",
  "Full audit trail for regulator access",
  "Custom weighting per loan product",
];

const integrationSteps = [
  {
    step: "01",
    title: "Connect your data sources",
    desc: "Link bureaus, AA, and net banking via our pre-built connectors. No custom integration required.",
  },
  {
    step: "02",
    title: "Define your scorecard",
    desc: "Use our visual scorecard builder or upload a custom model, Gavel wraps it in deterministic logic.",
  },
  {
    step: "03",
    title: "Underwrite via API",
    desc: "A single POST call returns a score, risk tier, reason codes, and a signed audit ID in under 2s.",
  },
];

const CreditScoring = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />

      <main className="flex-1 pt-[96px]">

        {/* ── Hero ── */}
        <section className="py-[100px] relative overflow-hidden">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 60% 50% at 50% 60%, rgba(249,115,22,0.06) 0%, transparent 70%)",
            }}
          />
          <div className="container mx-auto px-6 text-center relative z-10 max-w-4xl">
            <FadeUp>
              <div className="inline-flex items-center gap-2 bg-[rgba(249,115,22,0.08)] border border-border rounded-[20px] px-[14px] py-[6px] mb-8">
                <Zap size={13} className="text-primary" />
                <span className="font-['DM_Sans'] font-normal text-[12px] text-foreground">
                  Deterministic Risk Infrastructure
                </span>
              </div>

              <h1 className="font-['DM_Sans'] font-bold text-[48px] md:text-[64px] leading-[1.08] text-foreground mb-6">
                Credit Scoring for<br className="hidden md:block" /> the Modern NBFC
              </h1>

              <p className="font-['DM_Sans'] font-normal text-[18px] leading-[1.6] text-muted-foreground max-w-[560px] mx-auto mb-10">
                Go beyond traditional bureau scores. Leverage thousands of alternative data points
                to underwrite thin-file consumers and SMEs with 100% explainability.
              </p>

              <div className="flex flex-wrap justify-center gap-[14px] mb-12">
                <button
                  onClick={() => navigate("/playground")}
                  className="bg-[#F97316] text-foreground font-['DM_Sans'] font-semibold text-[15px] px-[28px] py-[14px] rounded-[6px] hover:brightness-[1.08] transition-all"
                >
                  Try Sandbox →
                </button>
                <button
                  onClick={() => navigate("/api-docs")}
                  className="bg-transparent border border-border text-muted-foreground font-['DM_Sans'] font-normal text-[15px] px-[28px] py-[14px] rounded-[6px] hover:bg-foreground/5 hover:text-foreground transition-all"
                >
                  View Documentation
                </button>
              </div>

              <div className="flex flex-wrap justify-center gap-x-8 gap-y-3">
                {[
                  "100% explainable decisions",
                  "Thin-file & SME coverage",
                  "Sub-2s response time",
                ].map((text) => (
                  <div key={text} className="flex items-center gap-2">
                    <span className="text-[#00FF94] text-[13px]">✓</span>
                    <span className="font-['DM_Sans'] font-normal text-[13px] text-muted-foreground">
                      {text}
                    </span>
                  </div>
                ))}
              </div>
            </FadeUp>
          </div>
        </section>

        {/* ── Data Sources ── */}
        <section className="py-[100px] bg-muted/30">
          <div className="container mx-auto px-6 max-w-5xl">
            <FadeUp>
              <div className="text-center mb-14">
                <p className="font-['DM_Sans'] font-semibold text-[11px] tracking-[0.15em] text-primary uppercase mb-3">
                  Data Enrichment
                </p>
                <h2 className="font-['DM_Sans'] font-bold text-[36px] md:text-[44px] leading-[1.12] text-foreground">
                  Unrivaled signal coverage
                </h2>
                <p className="font-['DM_Sans'] font-normal text-[16px] text-muted-foreground mt-4 max-w-[480px] mx-auto">
                  Our infrastructure automatically synthesizes data from diverse, permissioned sources, all in one call.
                </p>
              </div>
            </FadeUp>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
              {dataSources.map((ds, i) => (
                <FadeUp key={i} delay={i * 0.08}>
                  <div className="bg-background border border-border rounded-[12px] p-7 hover:border-primary/40 hover:shadow-glow transition-all group h-full">
                    <div className="w-10 h-10 bg-primary/10 border border-primary/20 rounded-[8px] flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-all">
                      <ds.icon size={18} className="text-primary" />
                    </div>
                    <h3 className="font-['DM_Sans'] font-semibold text-[16px] text-foreground mb-2">
                      {ds.title}
                    </h3>
                    <p className="font-['DM_Sans'] font-normal text-[13px] leading-[1.6] text-muted-foreground">
                      {ds.desc}
                    </p>
                  </div>
                </FadeUp>
              ))}
            </div>
          </div>
        </section>

        {/* ── Risk Tiers ── */}
        <section className="py-[100px] bg-background">
          <div className="container mx-auto px-6 max-w-5xl">
            <FadeUp>
              <div className="text-center mb-14">
                <p className="font-['DM_Sans'] font-semibold text-[11px] tracking-[0.15em] text-primary uppercase mb-3">
                  Decision Output
                </p>
                <h2 className="font-['DM_Sans'] font-bold text-[36px] md:text-[44px] leading-[1.12] text-foreground">
                  Clear risk tiers, instant action
                </h2>
                <p className="font-['DM_Sans'] font-normal text-[16px] text-muted-foreground mt-4 max-w-[480px] mx-auto">
                  Every scored applicant is bucketed into a risk tier with a predetermined lending action, no manual interpretation needed.
                </p>
              </div>
            </FadeUp>

            <div className="grid md:grid-cols-3 gap-5">
              {riskTiers.map((t, i) => (
                <FadeUp key={i} delay={i * 0.08}>
                  <div
                    className={`bg-card/40 border ${t.border} rounded-[12px] p-8 text-center hover:shadow-glow transition-all`}
                  >
                    <div
                      className={`inline-flex items-center px-3 py-1 rounded-full ${t.bg} mb-5`}
                    >
                      <span className={`font-['JetBrains_Mono'] font-bold text-[10px] tracking-[0.15em] ${t.color}`}>
                        {t.label}
                      </span>
                    </div>
                    <div className={`font-['JetBrains_Mono'] font-bold text-[28px] ${t.color} mb-2`}>
                      {t.score}
                    </div>
                    <div className="font-['DM_Sans'] font-normal text-[13px] text-muted-foreground mb-6">
                      Deterministic band, configurable per product
                    </div>
                    <div
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-[6px] ${t.outcomeBg}`}
                    >
                      <span className="font-['DM_Sans'] font-semibold text-[13px]">
                        {t.outcome}
                      </span>
                    </div>
                  </div>
                </FadeUp>
              ))}
            </div>
          </div>
        </section>

        {/* ── Explainability Split Panel ── */}
        <section className="py-[100px] bg-muted/30">
          <div className="container mx-auto px-6 max-w-5xl">
            <div className="bg-background border border-border rounded-[12px] overflow-hidden flex flex-col lg:flex-row shadow-glow">
              {/* Left, features */}
              <div className="lg:w-1/2 p-10 md:p-14">
                <FadeUp>
                  <p className="font-['DM_Sans'] font-semibold text-[11px] tracking-[0.15em] text-primary uppercase mb-3">
                    Explainability
                  </p>
                  <h2 className="font-['DM_Sans'] font-bold text-[32px] md:text-[40px] leading-[1.12] text-foreground mb-4">
                    No black boxes, ever
                  </h2>
                  <p className="font-['DM_Sans'] font-normal text-[16px] leading-[1.6] text-muted-foreground mb-8">
                    Every score comes with detailed reason codes ensuring you remain compliant with
                    RBI's fairness guidelines while offering full transparency to your applicants.
                  </p>
                  <ul className="space-y-4">
                    {explainabilityFeatures.map((item) => (
                      <li key={item} className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-[6px] bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        </div>
                        <span className="font-['DM_Sans'] font-normal text-[14px] text-muted-foreground">
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>
                </FadeUp>
              </div>

              {/* Right: JSON output */}
              <div className="lg:w-1/2 bg-background border-t lg:border-t-0 lg:border-l border-border p-10 md:p-14 relative">
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent pointer-events-none" />
                <FadeUp delay={0.1}>
                  <div className="font-['JetBrains_Mono'] text-[12px] leading-[1.9] relative z-10">
                    <div className="text-muted-foreground mb-2">// Score response</div>
                    <span className="text-muted-foreground">{"{"}</span><br />
                    <span className="ml-4 text-[#00FF94]">"gavel_score"</span>
                    <span className="text-muted-foreground">: </span>
                    <span className="text-foreground">742</span>
                    <span className="text-muted-foreground">,</span><br />
                    <span className="ml-4 text-[#00FF94]">"risk_tier"</span>
                    <span className="text-muted-foreground">: </span>
                    <span className="text-primary">"LOW_RISK"</span>
                    <span className="text-muted-foreground">,</span><br />
                    <span className="ml-4 text-[#00FF94]">"outcome"</span>
                    <span className="text-muted-foreground">: </span>
                    <span className="text-[#00FF94]">"AUTO_APPROVE"</span>
                    <span className="text-muted-foreground">,</span><br />
                    <span className="ml-4 text-[#00FF94]">"top_factors"</span>
                    <span className="text-muted-foreground">: [</span><br />
                    <span className="ml-8 text-muted-foreground">{"{"}</span><br />
                    <span className="ml-12 text-[#00FF94]">"feature"</span>
                    <span className="text-muted-foreground">: </span>
                    <span className="text-primary">"avg_monthly_balance_6m"</span>
                    <span className="text-muted-foreground">,</span><br />
                    <span className="ml-12 text-[#00FF94]">"impact"</span>
                    <span className="text-muted-foreground">: </span>
                    <span className="text-foreground">+45.2</span><br />
                    <span className="ml-8 text-muted-foreground">{"},{"}</span><br />
                    <span className="ml-12 text-[#00FF94]">"feature"</span>
                    <span className="text-muted-foreground">: </span>
                    <span className="text-primary">"bureau_dpd_12m"</span>
                    <span className="text-muted-foreground">,</span><br />
                    <span className="ml-12 text-[#00FF94]">"impact"</span>
                    <span className="text-muted-foreground">: </span>
                    <span className="text-foreground">-8.1</span><br />
                    <span className="ml-8 text-muted-foreground">{"}"}</span><br />
                    <span className="ml-4 text-muted-foreground">],</span><br />
                    <span className="ml-4 text-[#00FF94]">"audit_id"</span>
                    <span className="text-muted-foreground">: </span>
                    <span className="text-[#00FF94]">"cs_20240103_b3f8e1"</span><br />
                    <span className="text-muted-foreground">{"}"}</span>
                    <span className="inline-block w-[1px] h-[14px] bg-foreground ml-1 animate-[blink_1.2s_step-end_infinite]" />
                  </div>
                </FadeUp>
              </div>
            </div>
          </div>
        </section>

        {/* ── Integration Steps ── */}
        <section className="py-[100px] bg-background">
          <div className="container mx-auto px-6 max-w-4xl">
            <FadeUp>
              <div className="text-center mb-14">
                <p className="font-['DM_Sans'] font-semibold text-[11px] tracking-[0.15em] text-primary uppercase mb-3">
                  Get Started
                </p>
                <h2 className="font-['DM_Sans'] font-bold text-[36px] md:text-[44px] leading-[1.12] text-foreground">
                  Live in three steps
                </h2>
              </div>
            </FadeUp>

            <div className="space-y-5">
              {integrationSteps.map((s, i) => (
                <FadeUp key={i} delay={i * 0.08}>
                  <div className="flex items-start gap-6 bg-card/40 border border-border rounded-[12px] p-7 hover:border-primary/30 transition-all">
                    <div className="w-10 h-10 rounded-[8px] bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="font-['JetBrains_Mono'] font-bold text-[12px] text-primary">
                        {s.step}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-['DM_Sans'] font-semibold text-[17px] text-foreground mb-1">
                        {s.title}
                      </h3>
                      <p className="font-['DM_Sans'] font-normal text-[14px] leading-[1.6] text-muted-foreground">
                        {s.desc}
                      </p>
                    </div>
                  </div>
                </FadeUp>
              ))}
            </div>
          </div>
        </section>

      </main>

      <CTASection />
      <Footer />

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default CreditScoring;
