import { FadeUp } from "./gavel/FadeUp";

const MetricsSection = () => {
  return (
    <section className="bg-surface border-y border-border py-[36px]">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 md:gap-0">
          
          {/* Item 1 */}
          <FadeUp className="flex-1" delay={0}>
            <div className="flex flex-col items-center text-center">
              <div className="font-['JetBrains_Mono'] font-bold text-[44px] text-foreground">24</div>
              <div className="font-['DM_Sans'] text-[13px] text-muted-foreground">Underwriting rules per request</div>
            </div>
          </FadeUp>

          <div className="hidden md:block h-[44px] border-l border-border"></div>

          {/* Item 2 */}
          <FadeUp className="flex-1" delay={0.1}>
            <div className="flex flex-col items-center text-center">
              <div className="font-['JetBrains_Mono'] font-bold text-[44px] text-foreground">&lt; 2s</div>
              <div className="font-['DM_Sans'] text-[13px] text-muted-foreground">Average decision time</div>
            </div>
          </FadeUp>

          <div className="hidden md:block h-[44px] border-l border-border"></div>

          {/* Item 3 */}
          <FadeUp className="flex-1" delay={0.2}>
            <div className="flex flex-col items-center text-center">
              <div className="font-['JetBrains_Mono'] font-bold text-[44px] text-foreground">100%</div>
              <div className="font-['DM_Sans'] text-[13px] text-muted-foreground">Decisions audit-logged</div>
            </div>
          </FadeUp>

          <div className="hidden md:block h-[44px] border-l border-border"></div>

          {/* Item 4 */}
          <FadeUp className="flex-1" delay={0.3}>
            <div className="flex flex-col items-center text-center">
              <div className="font-['JetBrains_Mono'] font-bold text-[44px] text-[#00FF94]">0</div>
              <div className="font-['DM_Sans'] text-[13px] text-muted-foreground">Black box decisions</div>
              <div className="font-['DM_Sans'] text-[11px] text-muted-foreground mt-1">Every decision is explainable</div>
            </div>
          </FadeUp>

        </div>
      </div>
    </section>
  );
};

export default MetricsSection;
