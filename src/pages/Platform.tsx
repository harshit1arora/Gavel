import { Helmet } from "react-helmet-async";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  Banknote,
  BarChart3,
  CheckCircle,
  Database,
  FileText,
  ShieldCheck,
  Terminal,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { FadeUp } from "@/components/gavel/FadeUp";
import ModulePreview from "@/components/platform/ModulePreview";
import { PLATFORM_MODULES, getModuleBySlug, type ModuleId } from "@/data/platform-modules";

const ICONS: Record<ModuleId, LucideIcon> = {
  underwriting: Zap,
  portfolio: Database,
  disbursement: Banknote,
  collections: Activity,
  sentinel: ShieldCheck,
  compliance: FileText,
  analytics: BarChart3,
  developer: Terminal,
};

const methodColor: Record<string, string> = {
  GET: "#10B981",
  POST: "#F97316",
  PATCH: "#F5A524",
  DELETE: "#EF4444",
};

/**
 * Public product tour.
 *
 * This is the page that answers "what does Gavel actually do?" for a lender who
 * is not going to sign up to find out. It renders the real console surfaces
 * (`ModulePreview`) next to the module's capabilities and the endpoints behind
 * it, and every module is deep-linkable so sales can send `/platform/collections`
 * instead of a PDF.
 */
export default function Platform() {
  const { slug } = useParams<{ slug?: string }>();
  const navigate = useNavigate();
  const active = getModuleBySlug(slug);
  const index = PLATFORM_MODULES.findIndex((m) => m.id === active.id);
  const next = PLATFORM_MODULES[(index + 1) % PLATFORM_MODULES.length];
  const ActiveIcon = ICONS[active.id];

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{`${active.name}: Gavel AI Platform`}</title>
        <meta
          name="description"
          content={`${active.oneLiner} ${active.summary}`.slice(0, 300)}
        />
        <link rel="canonical" href={`https://www.trygavel.com/platform/${active.slug}`} />
      </Helmet>

      <Navbar />

      <main className="pt-32 pb-24">
        {/* ── page header ─────────────────────────────────────────── */}
        <section className="container mx-auto px-6">
          <FadeUp>
            <div className="max-w-[720px]">
              <div className="font-['DM_Sans'] font-semibold text-[11px] tracking-[0.15em] text-primary uppercase mb-4">
                The Platform
              </div>
              <h1 className="font-['DM_Sans'] font-bold text-[42px] md:text-[54px] leading-[1.06] text-foreground tracking-[-0.02em]">
                Eight modules.
                <br />
                One ledger underneath.
              </h1>
              <p className="font-['DM_Sans'] text-[17px] leading-[1.65] text-muted-foreground mt-5 max-w-[560px]">
                Gavel is not a dashboard with a login. It is the operational surface for origination,
                disbursement, collections, early warning and RBI reporting, every module reading and writing
                the same loan ledger. Here is each one, exactly as your team would see it.
              </p>
            </div>
          </FadeUp>
        </section>

        {/* ── module explorer ─────────────────────────────────────── */}
        <section className="container mx-auto px-6 mt-14">
          <div className="grid grid-cols-1 lg:grid-cols-[268px_1fr] gap-8">
            {/* rail */}
            <aside className="lg:sticky lg:top-28 lg:self-start">
              <div className="font-['DM_Sans'] text-[11px] font-semibold tracking-[0.12em] text-muted-foreground uppercase mb-3 px-1">
                Modules
              </div>
              <div className="flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 -mx-1 px-1">
                {PLATFORM_MODULES.map((m) => {
                  const Icon = ICONS[m.id];
                  const isActive = m.id === active.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => navigate(`/platform/${m.slug}`)}
                      className={`group flex items-center gap-3 shrink-0 lg:w-full text-left px-3 py-2.5 rounded-[8px] border transition-all ${
                        isActive
                          ? "bg-surface border-border shadow-card"
: "border-transparent hover:bg-surface hover:border-border"
                      }`}
                    >
                      <Icon
                        size={15}
                        style={{ color: isActive ? "var(--orange)": undefined }}
                        className={isActive ? "": "text-muted-foreground"}
                      />
                      <span
                        className={`font-['DM_Sans'] text-[13px] whitespace-nowrap ${
                          isActive ? "text-foreground font-semibold": "text-muted-foreground"
                        }`}
                      >
                        {m.railLabel}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="hidden lg:block mt-6 pt-5 border-t border-border">
                <p className="font-['DM_Sans'] text-[12px] leading-[1.6] text-muted-foreground">
                  Every screen below is the console your credit, ops and compliance teams log into, not a
                  marketing mock.
                </p>
                <Link
                  to="/demo"
                  className="inline-flex items-center gap-1.5 mt-3 font-['DM_Sans'] text-[12px] font-semibold text-primary hover:brightness-110"
                >
                  Open the live console <ArrowRight size={12} />
                </Link>
              </div>
            </aside>

            {/* panel */}
            <div className="min-w-0">
              <FadeUp key={active.id}>
                <div className="flex items-start justify-between gap-6 flex-wrap mb-5">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <ActiveIcon size={14} style={{ color: "var(--orange)" }} />
                      <span className="font-['JetBrains_Mono'] text-[10.5px] tracking-[0.14em] uppercase text-muted-foreground">
                        {active.eyebrow} · {active.consoleTab}
                      </span>
                    </div>
                    <h2 className="font-['DM_Sans'] font-bold text-[28px] md:text-[32px] leading-[1.15] text-foreground tracking-[-0.01em]">
                      {active.headline}
                    </h2>
                  </div>
                  <div className="flex gap-2">
                    {active.facts.slice(0, 2).map((f) => (
                      <div key={f.label} className="bg-surface border border-border rounded-[6px] px-3 py-2">
                        <div className="font-['JetBrains_Mono'] text-[15px] font-bold text-foreground leading-none">
                          {f.value}
                        </div>
                        <div className="font-['DM_Sans'] text-[10px] text-muted-foreground mt-1">{f.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <ModulePreview moduleId={active.id} title={`Gavel Console · ${active.consoleTab}`} />

                <p className="font-['DM_Sans'] text-[14.5px] leading-[1.7] text-muted-foreground mt-6 max-w-[720px]">
                  {active.summary}
                </p>

                {/* capabilities + endpoints */}
                <div className="grid grid-cols-1 md:grid-cols-[1.35fr_1fr] gap-8 mt-9">
                  <div>
                    <h3 className="font-['DM_Sans'] font-semibold text-[13px] tracking-[0.1em] uppercase text-foreground mb-4">
                      What the operator can do
                    </h3>
                    <ul className="space-y-2.5">
                      {active.capabilities.map((c) => (
                        <li key={c} className="flex gap-2.5">
                          <CheckCircle size={14} className="mt-[3px] shrink-0" style={{ color: "var(--green)" }} />
                          <span className="font-['DM_Sans'] text-[13.5px] leading-[1.6] text-foreground/85">
                            {c}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-['DM_Sans'] font-semibold text-[13px] tracking-[0.1em] uppercase text-foreground mb-4">
                      Backed by
                    </h3>
                    <div className="bg-surface border border-border rounded-[8px] divide-y divide-border">
                      {active.endpoints.map((e) => (
                        <div key={e.path} className="flex items-center gap-3 px-3.5 py-2.5">
                          <span
                            className="font-['JetBrains_Mono'] text-[9.5px] font-bold tracking-[0.08em] px-1.5 py-[2px] rounded-[3px]"
                            style={{
                              color: methodColor[e.method],
                              background: `${methodColor[e.method]}14`,
                            }}
                          >
                            {e.method}
                          </span>
                          <span className="font-['JetBrains_Mono'] text-[11.5px] text-foreground/80 truncate">
                            {e.path}
                          </span>
                        </div>
                      ))}
                    </div>
                    <Link
                      to="/api-reference"
                      className="inline-flex items-center gap-1.5 mt-3 font-['DM_Sans'] text-[12px] font-semibold text-muted-foreground hover:text-foreground"
                    >
                      Full API reference <ArrowRight size={12} />
                    </Link>
                  </div>
                </div>

                {/* replaces */}
                <div className="mt-9 border-l-[3px] border-l-primary bg-surface rounded-r-[8px] px-5 py-4">
                  <div className="font-['DM_Sans'] text-[10.5px] font-semibold tracking-[0.12em] uppercase text-muted-foreground mb-1">
                    What this replaces
                  </div>
                  <div className="font-['DM_Sans'] text-[15px] text-foreground italic">{active.replaces}</div>
                </div>
              </FadeUp>

              {/* next module */}
              <div className="mt-10 flex items-center justify-between border-t border-border pt-5">
                <span className="font-['DM_Sans'] text-[12px] text-muted-foreground">
                  Module {index + 1} of {PLATFORM_MODULES.length}
                </span>
                <button
                  onClick={() => navigate(`/platform/${next.slug}`)}
                  className="group flex items-center gap-2 font-['DM_Sans'] text-[13px] font-semibold text-foreground hover:text-primary transition-colors"
                >
                  Next: {next.railLabel}
                  <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ── how it fits together ────────────────────────────────── */}
        <section className="container mx-auto px-6 mt-24">
          <FadeUp>
            <div className="bg-surface border border-border rounded-[12px] p-8 md:p-10">
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-10 items-center">
                <div>
                  <div className="font-['DM_Sans'] font-semibold text-[11px] tracking-[0.15em] text-primary uppercase mb-3">
                    How it fits
                  </div>
                  <h2 className="font-['DM_Sans'] font-bold text-[30px] leading-[1.15] text-foreground mb-3">
                    Plug in one module. Keep your LMS.
                  </h2>
                  <p className="font-['DM_Sans'] text-[14px] leading-[1.7] text-muted-foreground max-w-[420px]">
                    Modules are composable: start with underwriting and bank-statement parsing, keep your
                    existing loan management system, and add disbursement, collections or the compliance engine
                    when you need them. Everything shares one ledger, so nothing has to be reconciled twice.
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    ["01", "Connect", "API key or Firebase org. Bank statements and bureau pulls start flowing."],
                    ["02", "Configure", "Set thresholds, products and provisioning rates in the policy editor."],
                    ["03", "Operate", "Credit, ops and compliance teams work the same queue and the same ledger."],
                  ].map(([step, title, body]) => (
                    <div key={step} className="bg-background border border-border rounded-[8px] p-4">
                      <div className="font-['JetBrains_Mono'] text-[11px] text-primary mb-2">{step}</div>
                      <div className="font-['DM_Sans'] font-semibold text-[13px] text-foreground mb-1">{title}</div>
                      <div className="font-['DM_Sans'] text-[11.5px] leading-[1.55] text-muted-foreground">
                        {body}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </FadeUp>
        </section>

        {/* ── CTA ─────────────────────────────────────────────────── */}
        <section className="container mx-auto px-6 mt-16 text-center">
          <FadeUp>
            <h2 className="font-['DM_Sans'] font-bold text-[30px] md:text-[38px] leading-[1.15] text-foreground">
              Want to see it running on your book?
            </h2>
            <p className="font-['DM_Sans'] text-[15px] text-muted-foreground mt-3 max-w-[480px] mx-auto">
              We will load a sample of your portfolio into a private sandbox org and walk your credit team
              through a live decision.
            </p>
            <div className="flex flex-wrap justify-center gap-3 mt-7">
              <Link
                to="/try"
                className="bg-primary text-primary-foreground font-['DM_Sans'] font-semibold text-[14px] px-7 py-3 rounded-[6px] hover:brightness-[1.08] transition-all shadow-glow"
              >
                Try it with your own statement
              </Link>
              <Link
                to="/playground"
                className="border border-border text-foreground font-['DM_Sans'] font-semibold text-[14px] px-7 py-3 rounded-[6px] hover:bg-surface transition-all"
              >
                Try the sandbox
              </Link>
            </div>
          </FadeUp>
        </section>
      </main>

      <Footer />
    </div>
  );
}
