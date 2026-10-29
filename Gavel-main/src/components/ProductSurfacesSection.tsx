import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  Banknote,
  BarChart3,
  Database,
  FileText,
  ShieldCheck,
  Terminal,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { FadeUp } from "./gavel/FadeUp";
import ModulePreview from "./platform/ModulePreview";
import { PLATFORM_MODULES, type ModuleId } from "@/data/platform-modules";

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

/**
 * Homepage proof: the actual product, not a stock dashboard screenshot.
 *
 * The previous version of this slot showed one static chart with a fabricated
 * "15+ NBFC pilots" badge. This shows the eight real console surfaces and lets
 * a visitor switch between them, which is the fastest way to answer
 * "so what does it actually look like inside?" without a signup.
 */
const ProductSurfacesSection = () => {
  const [activeId, setActiveId] = useState<ModuleId>("underwriting");
  const active = PLATFORM_MODULES.find((m) => m.id === activeId) ?? PLATFORM_MODULES[0];

  return (
    <section id="platform" className="bg-background py-[100px] relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[420px] bg-primary/5 blur-[140px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-12">
          <FadeUp>
            <div className="font-['DM_Sans'] font-semibold text-[11px] tracking-[0.15em] text-primary uppercase mb-3">
              Inside the platform
            </div>
            <h2 className="font-['DM_Sans'] font-bold text-[38px] md:text-[46px] leading-[1.1] text-foreground mb-4">
              The product your team actually logs into.
            </h2>
            <p className="font-['DM_Sans'] text-[16px] leading-[1.6] text-muted-foreground max-w-[600px] mx-auto">
              Eight modules on one loan ledger, origination, disbursement, collections, early warning, RBI
              reporting. Switch between them below.
            </p>
          </FadeUp>
        </div>

        <FadeUp delay={0.1}>
          <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6 items-start">
            {/* module selector */}
            <div className="flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 -mx-1 px-1">
              {PLATFORM_MODULES.map((m) => {
                const Icon = ICONS[m.id];
                const isActive = m.id === activeId;
                return (
                  <button
                    key={m.id}
                    onClick={() => setActiveId(m.id)}
                    onMouseEnter={() => setActiveId(m.id)}
                    className={`group text-left shrink-0 lg:w-full px-3.5 py-2.5 rounded-[8px] border transition-all ${
                      isActive
                        ? "bg-surface border-border shadow-card"
: "border-transparent hover:bg-surface hover:border-border"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon
                        size={14}
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
                    </div>
                    <p
                      className={`hidden lg:block font-['DM_Sans'] text-[11.5px] leading-[1.5] mt-1 pl-[26px] ${
                        isActive ? "text-muted-foreground": "text-muted-foreground/60"
                      }`}
                    >
                      {m.oneLiner}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* live preview */}
            <div className="min-w-0">
              <ModulePreview
                key={active.id}
                moduleId={active.id}
                title={`Gavel Console · ${active.consoleTab}`}
              />
              <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
                <p className="font-['DM_Sans'] text-[13px] text-muted-foreground max-w-[520px]">
                  <span className="text-foreground font-semibold">{active.name}.</span> {active.oneLiner}
                </p>
                <Link
                  to={`/platform/${active.slug}`}
                  className="inline-flex items-center gap-1.5 font-['DM_Sans'] text-[13px] font-semibold text-primary hover:brightness-110"
                >
                  Explore this module <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          </div>
        </FadeUp>

        <FadeUp delay={0.2}>
          <div className="flex flex-wrap items-center justify-center gap-3 mt-12">
            <Link
              to="/platform"
              className="bg-primary text-primary-foreground font-['DM_Sans'] font-semibold text-[14px] px-6 py-3 rounded-[6px] hover:brightness-[1.08] transition-all shadow-glow"
            >
              Take the full product tour →
            </Link>
            <Link
              to="/demo"
              className="border border-border text-foreground font-['DM_Sans'] font-semibold text-[14px] px-6 py-3 rounded-[6px] hover:bg-surface transition-all"
            >
              Open the live console
            </Link>
          </div>
        </FadeUp>
      </div>
    </section>
  );
};

export default ProductSurfacesSection;
