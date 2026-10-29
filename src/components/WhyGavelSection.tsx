import { FadeUp } from "./gavel/FadeUp";

const ValidationSection = () => {
  return (
    <section className="bg-surface border-y border-border py-[100px]">
      <div className="container mx-auto px-6">
        <div className="text-center mb-[52px]">
          <FadeUp>
            <div className="font-['DM_Sans'] font-semibold text-[11px] tracking-[0.15em] text-foreground uppercase mb-3">
              VALIDATION
            </div>
            <h2 className="font-['DM_Sans'] font-bold text-[46px] text-foreground mb-4">
              Built from what lenders actually need.
            </h2>
          </FadeUp>
        </div>

        <div className="flex flex-col lg:flex-row gap-10 mt-[52px]">

          {/* Left: Quote Block (42%) */}
          <div className="w-full lg:w-[42%]">
            <FadeUp>
              <div className="bg-muted border border-border border-l-[3px] border-l-[#F97316] rounded-r-[8px] p-[36px_32px] relative overflow-hidden h-full">
                <span className="font-['DM_Sans'] text-[72px] text-[rgba(249,115,22,0.12)] leading-none absolute top-4 left-6 pointer-events-none">"</span>

                <div className="relative z-10">
                  <blockquote className="font-['DM_Sans'] font-normal text-[22px] leading-[1.5] text-foreground italic mb-6">
                    "Can we plug this into our existing loan management system?"
                  </blockquote>

                  <div className="mt-5">
                    <div className="font-['DM_Sans'] font-semibold text-[14px] text-foreground">Credit Manager, Delhi NBFC</div>
                    <div className="font-['DM_Sans'] font-normal text-[13px] text-muted-foreground">After seeing the first demo, unprompted</div>
                  </div>

                  <div className="h-[1px] bg-border my-5"></div>

                  <p className="font-['DM_Sans'] font-normal text-[13px] text-muted-foreground leading-[1.6]">
                    It is the question that comes up in every credit-team conversation. Not 'interesting idea.' Integration. People don't ask how to integrate something they don't need.
                  </p>
                </div>
              </div>
            </FadeUp>
          </div>

          {/* Right: Signal Cards (58%) */}
          <div className="w-full lg:w-[58%] flex flex-col gap-[14px]">
            {/* Card 1 */}
            <FadeUp delay={0.1}>
              <div className="bg-muted border border-border rounded-[8px] p-[20px_24px] flex items-center gap-[18px]">
                <div className="font-['JetBrains_Mono'] font-bold text-[40px] text-foreground leading-none shrink-0">8</div>
                <div>
                  <div className="font-['DM_Sans'] font-semibold text-[14px] text-foreground">credit managers</div>
                  <div className="font-['DM_Sans'] font-normal text-[13px] text-muted-foreground">across 5 NBFCs asked the same question unprompted</div>
                </div>
              </div>
            </FadeUp>

            {/* Card 2 */}
            <FadeUp delay={0.2}>
              <div className="bg-muted border border-border rounded-[8px] p-[20px_24px] flex items-center gap-[18px]">
                <div className="font-['JetBrains_Mono'] font-bold text-[40px] text-foreground leading-none shrink-0">4w</div>
                <div>
                  <div className="font-['DM_Sans'] font-semibold text-[14px] text-foreground">to working API</div>
                  <div className="font-['DM_Sans'] font-normal text-[13px] text-muted-foreground">from zero to full audit trail in 4 weeks</div>
                </div>
              </div>
            </FadeUp>

            {/* Card 3 */}
            <FadeUp delay={0.3}>
              <div className="bg-muted border border-border rounded-[8px] p-[20px_24px] flex items-center gap-[18px]">
                <div className="font-['JetBrains_Mono'] font-bold text-[28px] text-foreground leading-none shrink-0">RBI</div>
                <div>
                  <div className="font-['DM_Sans'] font-semibold text-[14px] text-foreground">RBI/2022-23/111</div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-['DM_Sans'] font-normal text-[13px] text-muted-foreground">The circular that mandates this</span>
                    <a
                      href="https://www.rbi.org.in/Scripts/NotificationUser.aspx?Id=12382"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-foreground text-[12px] hover:underline"
                    >
                      Read →
                    </a>
                  </div>
                </div>
              </div>
            </FadeUp>
          </div>

        </div>
      </div>
    </section>
  );
};

export default ValidationSection;
