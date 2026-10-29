import { ScanFace, Settings2, FileCheck, ShieldCheck } from "lucide-react";
import { FadeUp } from "./gavel/FadeUp";

const SolutionSection = () => {
  const features = [
    {
      icon: ScanFace,
      title: "Deterministic KYC",
      description: "Instant Aadhaar, PAN & bank statement verification with rules-based validation.",
    },
    {
      icon: ShieldCheck,
      title: "Rules-Based Scoring",
      description: "Explainable credit scoring using bureau data and transaction patterns.",
    },
    {
      icon: Settings2,
      title: "Underwriting Infrastructure",
      description: "Configure custom policies with a deterministic rule engine. Audit-ready by design.",
    },
    {
      icon: FileCheck,
      title: "Instant Decisioning",
      description: "Auto-generate decisions based on hardcoded business logic and RBI guidelines.",
    },
  ];

  return (
    <section id="solution" className="bg-background py-[100px]">
      <div className="container mx-auto px-6 text-center">
        <FadeUp>
          {/* Section label */}
          <div className="font-['DM_Sans'] font-semibold text-[11px] tracking-[0.15em] text-foreground uppercase mb-3">
            THE INFRASTRUCTURE
          </div>

          {/* Headline */}
          <h2 className="font-['DM_Sans'] font-bold text-[46px] text-foreground mb-4">
            Replace manual effort with rules.
          </h2>

          {/* Subhead */}
          <p className="font-['DM_Sans'] font-normal text-[17px] leading-[1.6] text-muted-foreground max-w-[520px] mx-auto mb-[56px]">
            Gavel provides the deterministic infrastructure required to run high-volume lending operations with 100% auditability.
          </p>
        </FadeUp>

        <div className="grid sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {features.map((f, i) => (
            <FadeUp key={i} delay={i * 0.1}>
              <div
                className="group relative rounded-2xl border border-border bg-surface p-8 hover:border-border transition-all duration-300 text-left h-full"
              >
                <div className="w-12 h-12 rounded-xl bg-[rgba(249,115,22,0.08)] flex items-center justify-center mb-5">
                  <f.icon size={22} className="text-foreground" />
                </div>
                <h3 className="text-lg font-['DM_Sans'] font-semibold text-foreground mb-2">{f.title}</h3>
                <p className="text-sm font-['DM_Sans'] text-muted-foreground leading-relaxed">{f.description}</p>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SolutionSection;
