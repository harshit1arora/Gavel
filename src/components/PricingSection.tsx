import { Check, Code2, Server, Terminal } from "lucide-react";
import { FadeUp } from "./gavel/FadeUp";
import { Link } from "react-router-dom";

/**
 * The pricing section is now a licence section: there is no pricing.
 * Gavel is MIT-licensed and free to self-host, the honest version of a
 * "free forever" promise is to stop selling seats and say how to run it.
 */
const PricingSection = () => {
  const options = [
    {
      name: "Run it yourself",
      icon: Server,
      price: "₹0",
      unit: "forever",
      target: "Docker Compose up, point it at your own Firebase project.",
      highlights: [
        "Full console, engine and API",
        "All 8 modules, no feature gates",
        "Your data stays in your infrastructure",
        "MIT licence, fork and modify freely",
      ],
      cta: "Read the self-host guide",
      href: "https://github.com/gavel-ai/gavel-ai#quick-start",
      external: true,
      highlighted: true,
      color: "#F97316",
    },
    {
      name: "Use our hosted demo",
      icon: Terminal,
      price: "₹0",
      unit: "no signup",
      target: "Nothing to install. Upload a statement and watch it decide.",
      highlights: [
        "Real engine, running in your browser",
        "Statement never leaves your machine",
        "Decision record you can download",
        "Full console with synthetic applicants",
      ],
      cta: "Open the live demo",
      href: "/demo",
      external: false,
      highlighted: false,
      color: "#10B981",
    },
    {
      name: "Build on it",
      icon: Code2,
      price: "₹0",
      unit: "no API key",
      target: "Every screen is a client of the same REST API you get.",
      highlights: [
        "60+ documented endpoints",
        "OpenAPI reference and sandbox",
        "HMAC-signed webhooks",
        "No rate card, no per-decision fee",
      ],
      cta: "Read the API reference",
      href: "/api-reference",
      external: false,
      highlighted: false,
      color: "#3B82F6",
    },
  ];

  return (
    <section id="pricing" className="bg-background py-[100px]">
      <div className="container mx-auto px-6">
        <div className="text-center mb-[52px]">
          <FadeUp>
            <div className="font-['DM_Sans'] font-semibold text-[11px] tracking-[0.15em] text-primary uppercase mb-3">
              LICENCE
            </div>
            <h2 className="font-['DM_Sans'] font-bold text-[46px] text-foreground mb-4">
              Free. Open source. No sales call.
            </h2>
            <p className="font-['DM_Sans'] font-normal text-[17px] leading-[1.6] text-muted-foreground max-w-[560px] mx-auto">
              Gavel is MIT licensed. There is no per-decision fee, no seat count and no "contact us for
              pricing", because there is nothing to buy. Clone it, run it, change it.
            </p>
          </FadeUp>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {options.map((option, i) => {
            const Icon = option.icon;
            return (
              <FadeUp key={option.name} delay={i * 0.08}>
                <div
                  className={`h-full bg-surface border rounded-[10px] p-6 flex flex-col ${
                    option.highlighted ? "border-primary/40 shadow-glow": "border-border"
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Icon size={16} style={{ color: option.color }} />
                      <span className="font-['DM_Sans'] font-semibold text-[15px] text-foreground">
                        {option.name}
                      </span>
                    </div>
                    {option.highlighted ? (
                      <span className="font-['JetBrains_Mono'] text-[9.5px] uppercase tracking-[0.08em] text-primary border border-primary/30 rounded-[3px] px-1.5 py-[2px]">
                        recommended
                      </span>
                    ): null}
                  </div>

                  <div className="flex items-end gap-2 mb-1">
                    <span className="font-['DM_Sans'] font-bold text-[34px] leading-none text-foreground">
                      {option.price}
                    </span>
                    <span className="font-['DM_Sans'] text-[12.5px] text-muted-foreground pb-1">
                      {option.unit}
                    </span>
                  </div>
                  <p className="font-['DM_Sans'] text-[12.5px] leading-[1.55] text-muted-foreground mb-4 min-h-[36px]">
                    {option.target}
                  </p>

                  <ul className="space-y-2 mb-6 flex-1">
                    {option.highlights.map((h) => (
                      <li key={h} className="flex items-start gap-2">
                        <Check size={13} className="mt-[3px] shrink-0" style={{ color: option.color }} />
                        <span className="font-['DM_Sans'] text-[12.5px] leading-[1.5] text-foreground/85">
                          {h}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {option.external ? (
                    <a
                      href={option.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground font-['DM_Sans'] font-semibold text-[13px] px-4 py-2.5 rounded-[6px] hover:brightness-[1.08] transition-all"
                    >
                      <Code2 size={14} /> {option.cta}
                    </a>
                  ): (
                    <Link
                      to={option.href}
                      className={`inline-flex items-center justify-center gap-2 font-['DM_Sans'] font-semibold text-[13px] px-4 py-2.5 rounded-[6px] transition-all ${
                        option.highlighted
                          ? "bg-primary text-primary-foreground hover:brightness-[1.08]"
: "border border-border text-foreground hover:bg-background"
                      }`}
                    >
                      {option.cta}
                    </Link>
                  )}
                </div>
              </FadeUp>
            );
          })}
        </div>

        <FadeUp delay={0.24}>
          <p className="text-center font-['DM_Sans'] text-[12.5px] text-muted-foreground mt-8">
            Self-hosting costs whatever your cloud costs. There is no licence fee and no usage metering.
          </p>
        </FadeUp>
      </div>
    </section>
  );
};

export default PricingSection;
