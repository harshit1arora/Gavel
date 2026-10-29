import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CTASection from "@/components/CTASection";
import { FadeUp } from "@/components/gavel/FadeUp";
import {
  Shield, Zap, Smartphone, FileSearch, Lock, CheckCircle2,
  ArrowRight, ChevronRight, Database, Clock, Eye
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const features = [
  {
    icon: Zap,
    title: "Sub-second Verification",
    desc: "Instantly retrieve verified records directly from NSDL, UIDAI, and CERSAI in under 500ms. No batch jobs, no delays.",
  },
  {
    icon: FileSearch,
    title: "Tamper Detection",
    desc: "Deterministic pattern analysis detects forged documents and manipulated photos with 99.7% accuracy, no ML black boxes.",
  },
  {
    icon: Smartphone,
    title: "Omnichannel Video KYC",
    desc: "Seamless WebRTC-based video verification built for low-bandwidth environments across India, fully RBI-compliant.",
  },
];

const documents = [
  "Aadhaar XML & OTP",
  "PAN Verification",
  "CKYC Download",
  "Voter ID",
  "Passport",
  "Driving License",
  "Vehicle RC",
  "Bank Account Penny Drop",
  "GST Number",
  "MSME Certificate",
  "Liveliness Check",
  "Face Match",
];

const pipeline = [
  {
    step: "01",
    title: "Ingestion",
    desc: "User submits ID strings or uploads document images via API or SDK.",
    color: "border-border text-muted-foreground",
    bg: "bg-foreground/5",
  },
  {
    step: "02",
    title: "Analysis",
    desc: "Deterministic extraction, pattern matching, liveliness checks and bureau cross-referencing.",
    color: "border-primary/30 text-primary",
    bg: "bg-primary/10",
  },
  {
    step: "03",
    title: "Decision",
    desc: "Instant boolean PASS/FAIL with detailed confidence scores and a full audit trail entry.",
    color: "border-emerald-500/30 text-emerald-500",
    bg: "bg-emerald-500/10",
  },
];

const compliance = [
  { label: "RBI Guideline", value: "RBI/2022-23/111" },
  { label: "Data Residency", value: "India-only" },
  { label: "Audit Trail", value: "Immutable WORM" },
  { label: "Encryption", value: "AES-256 at rest" },
];

const KycEngine = () => {
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
                <Shield size={13} className="text-primary" />
                <span className="font-['DM_Sans'] font-normal text-[12px] text-foreground">
                  Bank-Grade Identity Verification
                </span>
              </div>

              <h1 className="font-['DM_Sans'] font-bold text-[48px] md:text-[64px] leading-[1.08] text-foreground mb-6">
                Identity Verification<br className="hidden md:block" /> at Scale
              </h1>

              <p className="font-['DM_Sans'] font-normal text-[18px] leading-[1.6] text-muted-foreground max-w-[560px] mx-auto mb-10">
                Automate your entire KYC process across Aadhaar, PAN, CKYC, and Video KYC.
                Reduce onboarding friction while maintaining 100% RBI compliance
                with deterministic verification logic.
              </p>

              <div className="flex flex-wrap justify-center gap-[14px] mb-12">
                <button
                  onClick={() => navigate("/api-docs")}
                  className="bg-[#F97316] text-foreground font-['DM_Sans'] font-semibold text-[15px] px-[28px] py-[14px] rounded-[6px] hover:brightness-[1.08] transition-all"
                >
                  View Documentation →
                </button>
                <button
                  onClick={() => navigate("/playground")}
                  className="bg-transparent border border-border text-muted-foreground font-['DM_Sans'] font-normal text-[15px] px-[28px] py-[14px] rounded-[6px] hover:bg-foreground/5 hover:text-foreground transition-all"
                >
                  Test in Sandbox
                </button>
              </div>

              <div className="flex flex-wrap justify-center gap-x-8 gap-y-3">
                {[
                  "Sub-500ms response time",
                  "12+ identity vectors supported",
                  "Immutable audit trail per check",
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

        {/* ── Feature Cards ── */}
        <section className="py-[80px] bg-background">
          <div className="container mx-auto px-6">
            <FadeUp>
              <div className="text-center mb-14">
                <p className="font-['DM_Sans'] font-semibold text-[11px] tracking-[0.15em] text-primary uppercase mb-3">
                  Core Capabilities
                </p>
                <h2 className="font-['DM_Sans'] font-bold text-[36px] md:text-[44px] leading-[1.12] text-foreground">
                  Everything you need to onboard<br className="hidden md:block" /> with confidence
                </h2>
              </div>
            </FadeUp>

            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {features.map((f, i) => (
                <FadeUp key={i} delay={i * 0.08}>
                  <div className="bg-card/40 border border-border rounded-[12px] p-8 hover:border-primary/40 hover:shadow-glow transition-all group h-full">
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

        {/* ── Verification Pipeline ── */}
        <section className="py-[100px] bg-background">
          <div className="container mx-auto px-6 max-w-5xl">
            <FadeUp>
              <div className="text-center mb-16">
                <p className="font-['DM_Sans'] font-semibold text-[11px] tracking-[0.15em] text-primary uppercase mb-3">
                  How It Works
                </p>
                <h2 className="font-['DM_Sans'] font-bold text-[36px] md:text-[44px] leading-[1.12] text-foreground">
                  Verification Pipeline
                </h2>
                <p className="font-['DM_Sans'] font-normal text-[16px] text-muted-foreground mt-4 max-w-[480px] mx-auto">
                  Every check runs through a deterministic three-stage pipeline with full observability.
                </p>
              </div>
            </FadeUp>

            <div className="flex flex-col md:flex-row items-stretch gap-0 relative">
              {pipeline.map((p, i) => (
                <div key={i} className="flex-1 flex flex-col md:flex-row items-stretch">
                  <FadeUp delay={i * 0.1} className="flex-1">
                    <div className="bg-card/40 border border-border rounded-[12px] p-8 h-full hover:border-primary/20 transition-all text-center md:text-left">
                      <div
                        className={`w-12 h-12 rounded-[8px] ${p.bg} border ${p.color} flex items-center justify-center mx-auto md:mx-0 mb-5`}
                      >
                        <span className={`font-['JetBrains_Mono'] font-bold text-[13px] ${p.color.split(" ")[1]}`}>
                          {p.step}
                        </span>
                      </div>
                      <h3 className="font-['DM_Sans'] font-semibold text-[18px] text-foreground mb-3">
                        {p.title}
                      </h3>
                      <p className="font-['DM_Sans'] font-normal text-[14px] leading-[1.6] text-muted-foreground">
                        {p.desc}
                      </p>
                    </div>
                  </FadeUp>
                  {i < pipeline.length - 1 && (
                    <div className="hidden md:flex items-center justify-center w-10 shrink-0">
                      <ChevronRight size={18} className="text-border" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Supported Vectors ── */}
        <section className="py-[100px] bg-muted/30">
          <div className="container mx-auto px-6 max-w-5xl">
            <FadeUp>
              <div className="text-center mb-14">
                <p className="font-['DM_Sans'] font-semibold text-[11px] tracking-[0.15em] text-primary uppercase mb-3">
                  Supported Vectors
                </p>
                <h2 className="font-['DM_Sans'] font-bold text-[36px] md:text-[44px] leading-[1.12] text-foreground">
                  Every identity document.<br className="hidden md:block" /> One API.
                </h2>
              </div>
            </FadeUp>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {documents.map((doc, i) => (
                <FadeUp key={i} delay={i * 0.04}>
                  <div className="flex items-center gap-3 bg-background border border-border rounded-[10px] px-5 py-4 hover:border-primary/40 transition-all group">
                    <CheckCircle2
                      size={16}
                      className="text-primary shrink-0 opacity-50 group-hover:opacity-100 transition-opacity"
                    />
                    <span className="font-['DM_Sans'] font-normal text-[14px] text-foreground/80">
                      {doc}
                    </span>
                  </div>
                </FadeUp>
              ))}
            </div>
          </div>
        </section>

        {/* ── API Preview ── */}
        <section className="py-[100px] bg-background">
          <div className="container mx-auto px-6 max-w-5xl">
            <div className="flex flex-col lg:flex-row gap-12 items-center">
              {/* Left, text */}
              <div className="lg:w-[45%]">
                <FadeUp>
                  <p className="font-['DM_Sans'] font-semibold text-[11px] tracking-[0.15em] text-primary uppercase mb-3">
                    Developer-First
                  </p>
                  <h2 className="font-['DM_Sans'] font-bold text-[36px] md:text-[44px] leading-[1.12] text-foreground mb-5">
                    One endpoint.<br /> Instant decision.
                  </h2>
                  <p className="font-['DM_Sans'] font-normal text-[16px] leading-[1.6] text-muted-foreground mb-8">
                    A single POST call returns a deterministic PASS/FAIL verdict with a confidence score, reason codes, and a signed audit ID, ready for your underwriting engine.
                  </p>
                  <ul className="space-y-3 mb-8">
                    {[
                      "REST API with OpenAPI spec",
                      "Webhook callbacks on completion",
                      "SDK for Node.js, Python & Java",
                      "Sandbox with pre-loaded test profiles",
                    ].map((item) => (
                      <li key={item} className="flex items-center gap-3">
                        <ArrowRight size={14} className="text-primary shrink-0" />
                        <span className="font-['DM_Sans'] font-normal text-[14px] text-muted-foreground">
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => navigate("/api-docs")}
                    className="bg-transparent border border-border text-muted-foreground font-['DM_Sans'] font-normal text-[14px] px-[20px] py-[10px] rounded-[6px] hover:bg-foreground/5 hover:text-foreground transition-all"
                  >
                    Read API Reference →
                  </button>
                </FadeUp>
              </div>

              {/* Right, terminal */}
              <div className="lg:w-[55%] w-full">
                <FadeUp delay={0.15}>
                  <div className="bg-background border border-border rounded-[10px] overflow-hidden shadow-[0_0_60px_rgba(249,115,22,0.06),0_24px_48px_rgba(0,0,0,0.3)]">
                    <div className="h-[36px] bg-background border-b border-border flex items-center px-4 gap-2">
                      <div className="flex gap-[6px]">
                        <div className="w-[10px] h-[10px] rounded-full bg-[#FF5F57]" />
                        <div className="w-[10px] h-[10px] rounded-full bg-[#FFBD2E]" />
                        <div className="w-[10px] h-[10px] rounded-full bg-muted" />
                      </div>
                      <span className="ml-4 font-['JetBrains_Mono'] text-[11px] text-muted-foreground">
                        POST /v1/kyc/verify
                      </span>
                    </div>
                    <div className="p-6 font-['JetBrains_Mono'] text-[12px] leading-[1.75]">
                      <div className="text-muted-foreground mb-1">// Request</div>
                      <div className="text-muted-foreground">
                        {"{"}<br />
                        <span className="ml-4">
                          <span className="text-[#00FF94]">"pan"</span>: <span className="text-foreground">"ABCPK1234D"</span>,
                        </span><br />
                        <span className="ml-4">
                          <span className="text-[#00FF94]">"aadhaar_last4"</span>: <span className="text-foreground">"5678"</span>,
                        </span><br />
                        <span className="ml-4">
                          <span className="text-[#00FF94]">"mode"</span>: <span className="text-primary">"FULL_KYC"</span>
                        </span><br />
                        {"}"}
                      </div>
                      <div className="text-muted-foreground mt-5 mb-1">// Response, 487ms</div>
                      <div className="text-muted-foreground">
                        {"{"}<br />
                        <span className="ml-4">
                          <span className="text-foreground">"status"</span>: <span className="text-[#00FF94]">"PASS"</span>,
                        </span><br />
                        <span className="ml-4">
                          <span className="text-foreground">"confidence"</span>: <span className="text-foreground">0.97</span>,
                        </span><br />
                        <span className="ml-4">
                          <span className="text-foreground">"checks_passed"</span>: <span className="text-foreground">["PAN_NAME_MATCH", "AADHAAR_LINK", "LIVENESS"]</span>,
                        </span><br />
                        <span className="ml-4">
                          <span className="text-foreground">"audit_id"</span>: <span className="text-[#00FF94]">"kyc_20240103_f7a9c2"</span>
                        </span><br />
                        {"}"}
                        <span className="inline-block w-[1px] h-[14px] bg-foreground ml-1 animate-[blink_1.2s_step-end_infinite]" />
                      </div>
                    </div>
                  </div>
                </FadeUp>
              </div>
            </div>
          </div>
        </section>

        {/* ── Compliance Bar ── */}
        <section className="py-[60px] bg-muted/30 border-y border-border">
          <div className="container mx-auto px-6">
            <FadeUp>
              <div className="flex flex-wrap justify-center gap-x-16 gap-y-6">
                {compliance.map((c) => (
                  <div key={c.label} className="text-center">
                    <div className="font-['JetBrains_Mono'] font-bold text-[16px] text-foreground mb-1">
                      {c.value}
                    </div>
                    <div className="font-['DM_Sans'] font-normal text-[12px] text-muted-foreground uppercase tracking-[0.1em]">
                      {c.label}
                    </div>
                  </div>
                ))}
              </div>
            </FadeUp>
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

export default KycEngine;
