import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Check, Code2, Scale, Server, ShieldCheck, Terminal } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { FadeUp } from "@/components/gavel/FadeUp";

const GITHUB = "https://github.com/gavel-ai/gavel-ai";

const cards = [
  {
    icon: Server,
    title: "Self-host it",
    price: "Free",
    lines: [
      "Docker Compose + your own Firebase project",
      "All 8 modules, no feature flags",
      "Data never leaves your infrastructure",
      "Runs on a single 2 GB VM for a pilot",
    ],
  },
  {
    icon: Terminal,
    title: "Use the hosted demo",
    price: "Free",
    lines: [
      "No account, no waitlist",
      "Real engine, running in your browser",
      "Upload a statement and get a decision",
      "Synthetic applicants in the console",
    ],
  },
  {
    icon: Code2,
    title: "Build on the API",
    price: "Free",
    lines: [
      "60+ endpoints, OpenAPI documented",
      "HMAC-signed webhooks with retries",
      "Idempotent writes",
      "No rate card, no per-decision fee",
    ],
  },
];

export default function Pricing() {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Licence &amp; hosting: Gavel is free and open source</title>
        <meta
          name="description"
          content="Gavel is MIT licensed and free to self-host. No per-decision fees, no seat pricing, no sales call."
        />
      </Helmet>
      <Navbar />

      <main className="pt-32 pb-24">
        <section className="container mx-auto px-6">
          <FadeUp>
            <div className="max-w-[720px]">
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 mb-5">
                <Scale size={12} className="text-primary" />
                <span className="font-['DM_Sans'] text-[11.5px] text-muted-foreground">MIT Licence</span>
              </div>
              <h1 className="font-['DM_Sans'] font-bold text-[42px] md:text-[54px] leading-[1.05] tracking-[-0.02em] text-foreground">
                Free. Permanently.
                <br />
                No sales call.
              </h1>
              <p className="font-['DM_Sans'] text-[17px] leading-[1.65] text-muted-foreground mt-5 max-w-[560px]">
                There used to be four paid tiers on this page. They are gone. Gavel is an open-source lending
                engine: you can run the whole platform yourself, use our hosted demo, or build against the API.
                None of it costs anything, and none of it asks for your email first.
              </p>
            </div>
          </FadeUp>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-12">
            {cards.map((card, i) => {
              const Icon = card.icon;
              return (
                <FadeUp key={card.title} delay={i * 0.08}>
                  <div className="h-full bg-surface border border-border rounded-[10px] p-6">
                    <div className="flex items-center justify-between mb-4">
                      <Icon size={16} className="text-primary" />
                      <span className="font-['JetBrains_Mono'] text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
                        {card.price}
                      </span>
                    </div>
                    <h2 className="font-['DM_Sans'] font-semibold text-[16px] text-foreground mb-3">
                      {card.title}
                    </h2>
                    <ul className="space-y-2">
                      {card.lines.map((l) => (
                        <li key={l} className="flex items-start gap-2">
                          <Check size={13} className="mt-[3px] shrink-0 text-green-500" />
                          <span className="font-['DM_Sans'] text-[12.5px] leading-[1.5] text-foreground/85">
                            {l}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </FadeUp>
              );
            })}
          </div>

          <FadeUp delay={0.24}>
            <div className="mt-10 grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-8 items-start">
              <div>
                <h2 className="font-['DM_Sans'] font-bold text-[26px] text-foreground mb-3">
                  What "free" actually means
                </h2>
                <div className="space-y-3">
                  {[
                    [
                      "No feature gates",
                      "Every module on /platform is in the repository. There is no enterprise-only build and no licence key.",
                    ],
                    [
                      "No usage metering",
                      "Run a million decisions. The engine is a pure function; it costs CPU, not a subscription.",
                    ],
                    [
                      "No data collection",
                      "The browser build parses statements locally. Self-hosted deployments talk only to your own Firebase project.",
                    ],
                    [
                      "No lock-in",
                      "MIT licence, fork it, rebrand it, sell services around it. Attribution is all we ask.",
                    ],
                  ].map(([title, body]) => (
                    <div key={title} className="border-l-[3px] border-l-primary/50 pl-4">
                      <div className="font-['DM_Sans'] font-semibold text-[13.5px] text-foreground">{title}</div>
                      <div className="font-['DM_Sans'] text-[12.5px] leading-[1.6] text-muted-foreground">
                        {body}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-surface border border-border rounded-[10px] p-6">
                <ShieldCheck size={16} className="text-primary mb-3" />
                <h3 className="font-['DM_Sans'] font-semibold text-[15px] text-foreground mb-2">
                  If you are a lender evaluating this
                </h3>
                <p className="font-['DM_Sans'] text-[12.5px] leading-[1.6] text-muted-foreground mb-4">
                  Start with the demo console, then upload one of your own statements in the browser. If it holds
                  up, self-host it against a copy of your book. There is nobody to call and nothing to sign.
                </p>
                <div className="flex flex-col gap-2">
                  <Link
                    to="/demo"
                    className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground font-['DM_Sans'] font-semibold text-[13px] px-4 py-2.5 rounded-[6px] hover:brightness-[1.08]"
                  >
                    Open the demo console
                  </Link>
                  <Link
                    to="/try"
                    className="inline-flex items-center justify-center gap-2 border border-border text-foreground font-['DM_Sans'] font-semibold text-[13px] px-4 py-2.5 rounded-[6px] hover:bg-background"
                  >
                    Upload a statement
                  </Link>
                  <a
                    href={GITHUB}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 text-muted-foreground font-['DM_Sans'] font-semibold text-[13px] px-4 py-2.5 hover:text-foreground"
                  >
                    <Code2 size={14} /> View the source
                  </a>
                </div>
              </div>
            </div>
          </FadeUp>
        </section>
      </main>

      <Footer />
    </div>
  );
}
