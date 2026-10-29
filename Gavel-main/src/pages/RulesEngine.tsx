import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CTASection from "@/components/CTASection";
import { FadeUp } from "@/components/gavel/FadeUp";
import {
  Layers, GitMerge, Search, ChevronRight, PlayCircle,
  ShieldCheck, Zap, RotateCcw, Lock, Code2
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const features = [
  {
    icon: Layers,
    title: "Visual Flow Builder",
    desc: "Map decision trees with AND/OR/NOT logic, score threshold routing, and manual review triggers in a drag-and-drop canvas, no code required.",
  },
  {
    icon: GitMerge,
    title: "Shadow Mode & Backtesting",
    desc: "Run challenger rulesets silently on live traffic or backtest against historical data to instantly see the projected impact on approval rates and NPAs.",
  },
  {
    icon: Search,
    title: "Audit Trails & Versioning",
    desc: "Every policy change is tracked, diffed, and logged in our immutable WORM ledger. Rollback to any previous version with a single click.",
  },
];

const workflowNodes = [
  {
    label: "New Application Received",
    sub: null,
    style: "bg-foreground/5 border border-border text-foreground",
    accent: true,
  },
];

const auditCapabilities = [
  { icon: Lock, label: "Immutable WORM Ledger", desc: "Every decision and rule change is permanently logged and tamper-proof." },
  { icon: RotateCcw, label: "One-click Rollback", desc: "Instantly revert to any prior policy version without downtime." },
  { icon: Code2, label: "Git-style Diff View", desc: "See exactly what changed between any two policy versions." },
  { icon: ShieldCheck, label: "RBI Audit Export", desc: "Generate regulator-ready audit reports with a single API call." },
];

const RulesEngine = () => {
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
                  Deterministic Policy Engine
                </span>
              </div>

              <h1 className="font-['DM_Sans'] font-bold text-[48px] md:text-[64px] leading-[1.08] text-foreground mb-6">
                Codify Your<br className="hidden md:block" /> Risk Appetite
              </h1>

              <p className="font-['DM_Sans'] font-normal text-[18px] leading-[1.6] text-muted-foreground max-w-[560px] mx-auto mb-10">
                Empower your risk teams to build, test, and deploy complex underwriting workflows
                visually. 100% explainability, zero code, and RBI-compliant audit trails.
              </p>

              <div className="flex flex-wrap justify-center gap-[14px] mb-12">
                <button
                  onClick={() => navigate("/playground")}
                  className="bg-[#F97316] text-foreground font-['DM_Sans'] font-semibold text-[15px] px-[28px] py-[14px] rounded-[6px] hover:brightness-[1.08] transition-all inline-flex items-center gap-2"
                >
                  <PlayCircle size={16} />
                  Test Current Policy
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
                  "Zero-code policy builder",
                  "Shadow mode & backtesting",
                  "Immutable audit trail",
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

        {/* ── Features ── */}
        <section className="py-[80px] bg-muted/30">
          <div className="container mx-auto px-6 max-w-5xl">
            <FadeUp>
              <div className="text-center mb-14">
                <p className="font-['DM_Sans'] font-semibold text-[11px] tracking-[0.15em] text-primary uppercase mb-3">
                  Core Capabilities
                </p>
                <h2 className="font-['DM_Sans'] font-bold text-[36px] md:text-[44px] leading-[1.12] text-foreground">
                  Built for your risk team,<br className="hidden md:block" /> not your engineering team
                </h2>
              </div>
            </FadeUp>

            <div className="grid md:grid-cols-3 gap-6">
              {features.map((f, i) => (
                <FadeUp key={i} delay={i * 0.08}>
                  <div className="bg-background border border-border rounded-[12px] p-8 hover:border-primary/40 hover:shadow-glow transition-all group h-full">
                    <div className="w-11 h-11 bg-primary/10 border border-primary/20 rounded-[8px] flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-all">
                      <f.icon size={20} className="text-primary" />
                    </div>
                    <h3 className="font-['DM_Sans'] font-semibold text-[18px] text-foreground mb-3">
                      {f.title}
                    </h3>
                    <p className="font-['DM_Sans'] font-normal text-[14px] leading-[1.6] text-muted-foreground">
                      {f.desc}
                    </p>
                  </div>
                </FadeUp>
              ))}
            </div>
          </div>
        </section>

        {/* ── Visual Workflow Diagram ── */}
        <section className="py-[100px] bg-background">
          <div className="container mx-auto px-6 max-w-5xl">
            <div className="flex flex-col lg:flex-row gap-12 items-center">
              {/* Left text */}
              <div className="lg:w-[42%]">
                <FadeUp>
                  <p className="font-['DM_Sans'] font-semibold text-[11px] tracking-[0.15em] text-primary uppercase mb-3">
                    Decision Flow
                  </p>
                  <h2 className="font-['DM_Sans'] font-bold text-[32px] md:text-[40px] leading-[1.12] text-foreground mb-5">
                    Policies your team can read, and regulators can audit
                  </h2>
                  <p className="font-['DM_Sans'] font-normal text-[16px] leading-[1.6] text-muted-foreground mb-6">
                    Every node in your policy tree is human-readable and mapped 1:1 to an audit log entry.
                    When a regulator asks "why was this loan rejected?", you have the answer in seconds.
                  </p>
                  <ul className="space-y-3">
                    {[
                      "Drag-and-drop rule construction",
                      "Live validation on rule conflicts",
                      "Pre-built RBI-compliant rule templates",
                      "Instant diff between policy versions",
                    ].map((item) => (
                      <li key={item} className="flex items-center gap-3">
                        <ChevronRight size={14} className="text-primary shrink-0" />
                        <span className="font-['DM_Sans'] font-normal text-[14px] text-muted-foreground">
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>
                </FadeUp>
              </div>

              {/* Right, decision tree visual */}
              <div className="lg:w-[58%] w-full">
                <FadeUp delay={0.15}>
                  <div className="relative">
                    <div className="absolute -inset-3 bg-primary/8 rounded-[16px] blur-2xl" />
                    <div className="relative bg-card/40 border border-border rounded-[12px] p-8 shadow-glow">
                      <div className="font-['JetBrains_Mono'] text-[11px] font-semibold space-y-4">
                        {/* Entry node */}
                        <div className="p-4 bg-foreground/5 border border-border rounded-[8px] text-center flex items-center justify-center gap-2 text-foreground">
                          <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
                          New Application Received
                        </div>

                        <div className="flex justify-center">
                          <ChevronRight size={16} className="rotate-90 text-border" />
                        </div>

                        {/* Branch row */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-[8px] text-center space-y-1">
                            <div className="font-bold">Hard Reject</div>
                            <div className="text-[9px] opacity-60">CIBIL &lt; 650 || Age &lt; 21</div>
                          </div>
                          <div className="p-4 bg-primary/10 border border-primary/20 text-primary rounded-[8px] text-center space-y-1">
                            <div className="font-bold">Analyze</div>
                            <div className="text-[9px] opacity-70">Run Deterministic Engine</div>
                          </div>
                        </div>

                        <div className="flex justify-end pr-12">
                          <ChevronRight size={16} className="rotate-90 text-border" />
                        </div>

                        {/* Outcome row */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-[8px] text-center space-y-1">
                            <div className="font-bold">Manual Review</div>
                            <div className="text-[9px] opacity-70">Score 650–700</div>
                          </div>
                          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-[8px] text-center space-y-1">
                            <div className="font-bold">Auto Approve</div>
                            <div className="text-[9px] opacity-70">Score &gt; 700</div>
                          </div>
                        </div>

                        {/* Compliance footer */}
                        <div className="p-3 bg-foreground/5 rounded-[8px] border border-border flex items-center justify-between mt-2">
                          <div className="flex items-center gap-2">
                            <ShieldCheck size={12} className="text-primary" />
                            <span className="text-[9px] uppercase tracking-widest text-muted-foreground">
                              Compliance Status
                            </span>
                          </div>
                          <span className="text-[9px] font-bold text-primary uppercase tracking-widest">
                            RBI Verified
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </FadeUp>
              </div>
            </div>
          </div>
        </section>

        {/* ── Shadow Mode / Backtesting ── */}
        <section className="py-[100px] bg-muted/30">
          <div className="container mx-auto px-6 max-w-5xl">
            <div className="bg-background border border-border rounded-[12px] p-10 md:p-14">
              <div className="flex flex-col lg:flex-row gap-12 items-center">
                <div className="lg:w-1/2">
                  <FadeUp>
                    <p className="font-['DM_Sans'] font-semibold text-[11px] tracking-[0.15em] text-primary uppercase mb-3">
                      Risk-Free Testing
                    </p>
                    <h2 className="font-['DM_Sans'] font-bold text-[32px] md:text-[40px] leading-[1.12] text-foreground mb-4">
                      Shadow Mode &<br /> Backtesting
                    </h2>
                    <p className="font-['DM_Sans'] font-normal text-[16px] leading-[1.6] text-muted-foreground mb-8">
                      Before you go live with a new policy, run it in Shadow Mode; it processes real
                      incoming applications silently alongside your production policy, so you can
                      compare outcomes without any risk.
                    </p>
                    <ul className="space-y-3">
                      {[
                        "Backtest against 12+ months of historical data",
                        "Side-by-side approval rate comparison",
                        "Projected NPA impact dashboard",
                        "Promote to production with one click",
                      ].map((item) => (
                        <li key={item} className="flex items-center gap-3">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                          <span className="font-['DM_Sans'] font-normal text-[14px] text-muted-foreground">
                            {item}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </FadeUp>
                </div>

                <div className="lg:w-1/2 w-full">
                  <FadeUp delay={0.1}>
                    {/* Comparison visual */}
                    <div className="space-y-4">
                      {[
                        { policy: "Production Policy v4.1", approvalRate: "68%", npa: "3.2%", status: "Live", statusColor: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" },
                        { policy: "Challenger Policy v5.0", approvalRate: "74%", npa: "2.9%", status: "Shadow", statusColor: "text-amber-500 bg-amber-500/10 border-amber-500/20" },
                      ].map((row) => (
                        <div
                          key={row.policy}
                          className="bg-muted/40 border border-border rounded-[10px] p-5 flex items-center justify-between gap-4 flex-wrap"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="font-['JetBrains_Mono'] font-semibold text-[12px] text-foreground mb-1 truncate">
                              {row.policy}
                            </div>
                            <div className="flex gap-5">
                              <div>
                                <span className="font-['DM_Sans'] text-[11px] text-muted-foreground">Approval </span>
                                <span className="font-['JetBrains_Mono'] font-bold text-[13px] text-foreground">{row.approvalRate}</span>
                              </div>
                              <div>
                                <span className="font-['DM_Sans'] text-[11px] text-muted-foreground">Est. NPA </span>
                                <span className="font-['JetBrains_Mono'] font-bold text-[13px] text-foreground">{row.npa}</span>
                              </div>
                            </div>
                          </div>
                          <div className={`border rounded-full px-3 py-1 font-['DM_Sans'] font-semibold text-[11px] ${row.statusColor}`}>
                            {row.status}
                          </div>
                        </div>
                      ))}
                      <button
                        className="w-full py-3 bg-primary/10 border border-primary/30 rounded-[10px] font-['DM_Sans'] font-semibold text-[13px] text-primary hover:bg-primary/20 transition-all"
                      >
                        Promote Challenger → Production
                      </button>
                    </div>
                  </FadeUp>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Audit Trail ── */}
        <section className="py-[100px] bg-background">
          <div className="container mx-auto px-6 max-w-5xl">
            <FadeUp>
              <div className="text-center mb-14">
                <p className="font-['DM_Sans'] font-semibold text-[11px] tracking-[0.15em] text-primary uppercase mb-3">
                  Compliance & Governance
                </p>
                <h2 className="font-['DM_Sans'] font-bold text-[36px] md:text-[44px] leading-[1.12] text-foreground">
                  Audit trails that satisfy<br className="hidden md:block" /> any regulator
                </h2>
                <p className="font-['DM_Sans'] font-normal text-[16px] text-muted-foreground mt-4 max-w-[480px] mx-auto">
                  Every policy change and lending decision is logged permanently, structured for RBI inspection, SEBI reporting, or internal governance.
                </p>
              </div>
            </FadeUp>

            <div className="grid sm:grid-cols-2 gap-5">
              {auditCapabilities.map((cap, i) => (
                <FadeUp key={i} delay={i * 0.08}>
                  <div className="flex items-start gap-5 bg-card/40 border border-border rounded-[12px] p-7 hover:border-primary/30 transition-all group">
                    <div className="w-10 h-10 bg-primary/10 border border-primary/20 rounded-[8px] flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-all">
                      <cap.icon size={18} className="text-primary" />
                    </div>
                    <div>
                      <h3 className="font-['DM_Sans'] font-semibold text-[16px] text-foreground mb-1">
                        {cap.label}
                      </h3>
                      <p className="font-['DM_Sans'] font-normal text-[14px] leading-[1.6] text-muted-foreground">
                        {cap.desc}
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
    </div>
  );
};

export default RulesEngine;
