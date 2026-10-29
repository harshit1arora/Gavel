import { useNavigate } from "react-router-dom";
import { FadeUp } from "./gavel/FadeUp";

const CTASection = () => {
  const navigate = useNavigate();

  return (
    <section className="bg-background py-[100px] relative overflow-hidden">
      {/* Radial Glow */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(249,115,22,0.06) 0%, transparent 70%)'
        }}
      ></div>

      <div className="container mx-auto px-6 text-center relative z-10">
        <FadeUp>
          <h2 className="font-['DM_Sans'] font-bold text-[56px] text-foreground mb-5 leading-[1.1]">
            Run a real underwriting decision.<br />
            Right now. No signup. No sales call.
          </h2>
          <p className="font-['DM_Sans'] font-normal text-[18px] leading-[1.6] text-muted-foreground max-w-[440px] mx-auto mb-9">
            Drop a bank statement PDF in the browser and watch the engine read it, score it and explain itself. Nothing is uploaded anywhere. Takes 90 seconds.
          </p>
        </FadeUp>

        <FadeUp delay={0.1}>
          <div className="flex flex-wrap justify-center gap-[14px]">
            <button 
              onClick={() => navigate('/try')}
              className="bg-[#F97316] text-foreground font-['DM_Sans'] font-bold text-[15px] px-[32px] py-[15px] rounded-[6px] hover:brightness-[1.08] transition-all"
            >
Upload a statement →
            </button>
            <button 
              onClick={() => navigate('/demo')}
              className="bg-transparent border border-border text-foreground font-['DM_Sans'] font-semibold text-[15px] px-[32px] py-[15px] rounded-[6px] hover:bg-foreground/5 transition-all"
            >
Open the demo console
            </button>
          </div>
        </FadeUp>

        <FadeUp delay={0.2}>
          <p className="mt-8 font-['DM_Sans'] font-normal text-[12px] text-muted-foreground">
            Sandbox decisions use simulated data. Production API available for pilot partners.
          </p>
        </FadeUp>
      </div>
    </section>
  );
};

export default CTASection;
