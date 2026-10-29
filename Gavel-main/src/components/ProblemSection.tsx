import { Clock, UserX, AlertTriangle } from "lucide-react";
import { FadeUp } from "./gavel/FadeUp";

const ProblemSection = () => {
  return (
    <section className="bg-background py-[100px]">
      <div className="container mx-auto px-6 text-center">
        <FadeUp>
          {/* Section label */}
          <div className="font-['DM_Sans'] font-semibold text-[11px] tracking-[0.15em] text-foreground uppercase mb-3">
            THE PROBLEM
          </div>

          {/* Section headline */}
          <h2 className="font-['DM_Sans'] font-bold text-[46px] text-foreground mb-4">
            India's lending infrastructure runs on spreadsheets.
          </h2>

          {/* Section subhead */}
          <p className="font-['DM_Sans'] font-normal text-[17px] leading-[1.6] text-muted-foreground max-w-[560px] mx-auto mb-[56px]">
            10,000+ NBFCs. Every loan underwritten manually.
            RBI now requires what manual processes can't deliver.
          </p>
        </FadeUp>

        {/* Cards Row */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* CARD 1 */}
          <FadeUp delay={0.1}>
            <div className="bg-surface border border-border rounded-[8px] p-[32px] text-left hover:border-border transition-all duration-200 h-full">
              <div className="w-[44px] h-[44px] bg-[rgba(249,115,22,0.08)] border border-border rounded-[8px] flex items-center justify-center mb-[16px]">
                <Clock size={18} className="text-foreground" />
              </div>
              <h3 className="font-['DM_Sans'] font-semibold text-[16px] text-foreground mb-[10px]">3–7 Day Approvals</h3>
              <p className="font-['DM_Sans'] font-normal text-[14px] leading-[1.65] text-muted-foreground mb-[20px]">
                A credit analyst reads 6 months of PDF statements,
                applies inconsistent judgment, and types a
                recommendation into a spreadsheet. At volume, this
                breaks completely.
              </p>
              <div className="inline-flex bg-[rgba(255,68,68,0.08)] border border-border rounded-[4px] px-[12px] py-[6px] font-['JetBrains_Mono'] text-[13px] text-foreground">
                3–7 days avg
              </div>
            </div>
          </FadeUp>

          {/* CARD 2 */}
          <FadeUp delay={0.2}>
            <div className="bg-surface border border-border rounded-[8px] p-[32px] text-left hover:border-border transition-all duration-200 h-full">
              <div className="w-[44px] h-[44px] bg-[rgba(249,115,22,0.08)] border border-border rounded-[8px] flex items-center justify-center mb-[16px]">
                <UserX size={18} className="text-foreground" />
              </div>
              <h3 className="font-['DM_Sans'] font-semibold text-[16px] text-foreground mb-[10px]">Manual & Error-Prone</h3>
              <p className="font-['DM_Sans'] font-normal text-[14px] leading-[1.65] text-muted-foreground mb-[20px]">
                Teams manually verify KYC documents, income proofs,
                and credit history. 60% of underwriting time is
                analyst review, inconsistent across people
                and shifts.
              </p>
              <div className="inline-flex bg-[rgba(245,158,11,0.08)] border border-border rounded-[4px] px-[12px] py-[6px] font-['JetBrains_Mono'] text-[13px] text-foreground">
                60% manual effort
              </div>
            </div>
          </FadeUp>

          {/* CARD 3 */}
          <FadeUp delay={0.3}>
            <div className="bg-surface border border-border rounded-[8px] p-[32px] text-left hover:border-border transition-all duration-200 h-full">
              <div className="w-[44px] h-[44px] bg-[rgba(249,115,22,0.08)] border border-border rounded-[8px] flex items-center justify-center mb-[16px]">
                <AlertTriangle size={18} className="text-foreground" />
              </div>
              <h3 className="font-['DM_Sans'] font-semibold text-[16px] text-foreground mb-[10px]">RBI Compliance Gap</h3>
              <p className="font-['DM_Sans'] font-normal text-[14px] leading-[1.65] text-muted-foreground mb-[20px]">
                RBI's 2022 Digital Lending Guidelines require
                explainable, auditable credit decisions from all
                regulated entities. Manual processes and ML models
                cannot produce this.
              </p>
              <div className="inline-flex bg-[rgba(249,115,22,0.08)] border border-border rounded-[4px] px-[12px] py-[6px] font-['JetBrains_Mono'] text-[13px] text-foreground">
                RBI/2022-23/111
              </div>
            </div>
          </FadeUp>
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;
