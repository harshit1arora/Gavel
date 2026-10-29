import React from "react";
import { 
  AxisBankLogo, 
  KotakLogo, 
  SBILogo, 
  LTFinanceLogo, 
  ICICILogo, 
  BajajLogo, 
  HDFCLogo, 
  IDFCLogo, 
  FederalLogo, 
  AULogo 
} from "./BankLogos";

const logos = [
  { name: "Axis Bank", Logo: AxisBankLogo },
  { name: "Kotak Mahindra Bank", Logo: KotakLogo },
  { name: "SBI Cards", Logo: SBILogo },
  { name: "L&T Finance", Logo: LTFinanceLogo },
  { name: "ICICI Bank", Logo: ICICILogo },
  { name: "Bajaj Finserv", Logo: BajajLogo },
  { name: "HDFC Bank", Logo: HDFCLogo },
  { name: "IDFC FIRST Bank", Logo: IDFCLogo },
  { name: "Federal Bank", Logo: FederalLogo },
  { name: "AU Small Finance Bank", Logo: AULogo },
];

const LogoTickerSection = () => (
  <section className="relative py-20 bg-[#050505] border-y border-white/[0.05] overflow-hidden flex flex-col items-center justify-center">
    
    {/* CSS Animation for smooth, pauseable marquee */}
    <style dangerouslySetInnerHTML={{ __html: `
      @keyframes premium-marquee {
        0% { transform: translateX(0%); }
        100% { transform: translateX(-50%); }
      }
      .animate-premium-marquee {
        animation: premium-marquee 30s linear infinite;
      }
      .marquee-container:hover .animate-premium-marquee {
        animation-play-state: paused;
      }
    `}} />

    {/* Subtle Background Glow */}
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[200px] bg-white/[0.03] blur-[100px] rounded-full pointer-events-none" />

    <div className="container mx-auto px-6 mb-12 text-center relative z-10">
      <p className="text-xs md:text-sm font-semibold text-white/40 uppercase tracking-[0.2em] font-sans">
        Architected to integrate seamlessly with modern financial ecosystems
      </p>
    </div>

    {/* Marquee Container */}
    <div className="flex w-full relative overflow-hidden marquee-container group">
      {/* Dark gradient overlays for cinematic edge fade */}
      <div className="absolute top-0 bottom-0 left-0 w-24 md:w-64 bg-gradient-to-r from-[#050505] via-[#050505]/80 to-transparent z-10 pointer-events-none" />
      <div className="absolute top-0 bottom-0 right-0 w-24 md:w-64 bg-gradient-to-l from-[#050505] via-[#050505]/80 to-transparent z-10 pointer-events-none" />

      {/* Marquee Track */}
      {/* We duplicate the logos array twice to ensure seamless looping without gaps */}
      <div className="flex items-center w-max gap-16 md:gap-24 px-8 animate-premium-marquee">
        {[...logos, ...logos].map((logo, i) => {
          const LogoComponent = logo.Logo;
          return (
            <div
              key={i}
              className="flex items-center justify-center text-white/75 hover:text-white transition-all duration-500 hover:scale-105 hover:drop-shadow-[0_0_20px_rgba(255,255,255,0.4)] cursor-pointer"
              title={logo.name}
            >
              <LogoComponent className="h-8 md:h-10 w-auto object-contain" />
            </div>
          );
        })}
      </div>
    </div>
  </section>
);

export default LogoTickerSection;
