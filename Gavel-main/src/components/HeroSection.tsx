import React, { useRef, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useMotionTemplate, useMotionValue, useScroll, useTransform, animate } from "framer-motion";
import { FadeUp } from "./gavel/FadeUp";

const HeroSection = () => {
  const navigate = useNavigate();
  const [showCursor, setShowCursor] = useState(true);
  const words = ["Decisioning", "Bank Parsing", "KYC Checks", "Rule Auditing"];
  const [wordIndex, setWordIndex] = useState(0);
  const [text, setText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const currentWord = words[wordIndex];

    if (isDeleting) {
      if (text.length === 0) {
        setIsDeleting(false);
        setWordIndex((prev) => (prev + 1) % words.length);
      } else {
        timeoutId = setTimeout(() => {
          setText(currentWord.substring(0, text.length - 1));
        }, 50);
      }
    } else {
      if (text.length === currentWord.length) {
        timeoutId = setTimeout(() => setIsDeleting(true), 2000);
      } else {
        timeoutId = setTimeout(() => {
          setText(currentWord.substring(0, text.length + 1));
        }, 100);
      }
    }
    return () => clearTimeout(timeoutId);
  }, [text, isDeleting, wordIndex]);

  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 500);
    return () => clearInterval(cursorInterval);
  }, []);

  // Mouse position for dynamic lighting
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
    // We use a simple RAF to throttle rapid mouse events on lower-end devices
    requestAnimationFrame(() => {
      const { left, top } = currentTarget.getBoundingClientRect();
      mouseX.set(clientX - left);
      mouseY.set(clientY - top);
    });
  }

  // 1. Scroll-linked Parallax & Opacity
  const { scrollY } = useScroll();
  const textOpacity = useTransform(scrollY, [0, 400], [1, 0]);
  const textY = useTransform(scrollY, [0, 400], [0, 100]);
  const terminalZ = useTransform(scrollY, [0, 400], [0, -300]);
  const terminalOpacity = useTransform(scrollY, [0, 400], [1, 0.4]);

  // 2. Dynamic Data Simulation
  const riskScore = useMotionValue(0);
  const roundedRiskScore = useTransform(riskScore, Math.round);
  const timeVal = useMotionValue(0);
  const timeDisplay = useTransform(timeVal, (v) => v.toFixed(2) + "s");

  useEffect(() => {
    const controls1 = animate(riskScore, 72, { duration: 3, ease: "easeOut", delay: 1 });
    const controls2 = animate(timeVal, 1.24, { duration: 2, ease: "easeOut", delay: 0.5 });
    return () => {
      controls1.stop();
      controls2.stop();
    };
  }, []);

  // 3. Magnetic Button Interaction
  const buttonRef = useRef<HTMLDivElement>(null);
  const btnX = useMotionValue(0);
  const btnY = useMotionValue(0);

  const handleMagneticMove = (e: React.MouseEvent) => {
    if (!buttonRef.current) return;
    const { left, top, width, height } = buttonRef.current.getBoundingClientRect();
    const x = e.clientX - (left + width / 2);
    const y = e.clientY - (top + height / 2);
    btnX.set(x * 0.2); // 20% pull factor
    btnY.set(y * 0.2);
  };

  const resetMagnetic = () => {
    btnX.set(0);
    btnY.set(0);
  };

  return (
    <section
      className="relative min-h-[92vh] pt-[132px] pb-24 bg-[#050505] flex items-center overflow-hidden"
      onMouseMove={handleMouseMove}
    >
      {/* Subtle Noise / Grid Texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='1' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      ></div>
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_10%,transparent_100%)] pointer-events-none"></div>

      {/* Volumetric Beam Background */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-[#F97316] via-[rgba(249,115,22,0.1)] to-transparent blur-[100px] rounded-full transform -translate-y-1/2 scale-y-50"></div>
      </div>

      <div className="container mx-auto px-6 relative z-10 perspective-[1000px]">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-0">

          {/* LEFT COLUMN */}
          <motion.div
            className="w-full lg:w-[55%] flex flex-col justify-center relative"
            style={{ opacity: textOpacity, y: textY }}
          >

            {/* Cinematic Light Beam passing over text */}
            <motion.div
              className="absolute -inset-x-20 inset-y-0 z-20 pointer-events-none"
              initial={{ x: "-100%" }}
              animate={{ x: "200%" }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              style={{ mixBlendMode: 'screen', willChange: 'transform' }}
            >
              <div className="w-[150px] h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg] blur-[8px] transform-gpu"></div>
            </motion.div>

            <FadeUp>
              {/* Top pill badge */}
              <motion.div
                className="inline-flex items-center gap-2 bg-[#F97316]/10 border border-[#F97316]/20 rounded-[20px] px-[14px] py-[6px] w-fit mb-8 relative group cursor-pointer overflow-hidden"
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
                <span className="text-[12px]">⚖️</span>
                <span className="font-['DM_Sans'] font-medium text-[12px] text-orange-50 relative z-10">
                  <span className="text-[#F97316] mr-1">RBI Compliant</span>
                  Digital Lending Guidelines 2022
                </span>
              </motion.div>

              {/* Main Headline */}
              <h1 className="font-['DM_Sans'] font-bold text-[38px] sm:text-[46px] md:text-[62px] leading-[1.06] text-white mb-6 tracking-[-0.03em] relative">
                <span className="bg-clip-text text-transparent bg-gradient-to-b from-white to-white/70">
                  The AI Underwriting <br className="hidden md:block"/>
                  Layer for Lenders <br className="hidden md:block"/>
                  <span className="inline-flex items-center">
                    <span className="min-w-[240px] md:min-w-[340px]">
                      <span className="text-[#F97316]">
                        with {text}
                      </span>
                      <span
                        className="text-[#F97316] ml-1"
                        style={{ opacity: showCursor ? 1: 0 }}
                      >
                        |
                      </span>
                    </span>
                  </span>
                </span>
              </h1>

              {/* Sub-headline */}
              <p className="font-['DM_Sans'] font-normal text-[18px] leading-[1.6] text-gray-400 max-w-[500px] mb-9">
                Automated rule-based underwriting, bank statement parsing, and RBI-compliant audit logs built for scaling NBFCs and fintechs.
              </p>

              {/* CTA row */}
              <div className="flex flex-wrap gap-[14px] mb-12 relative">
                <div className="absolute inset-0 bg-[#F97316]/20 blur-2xl rounded-full -z-10 scale-150"></div>

                <motion.div
                  ref={buttonRef}
                  onMouseMove={handleMagneticMove}
                  onMouseLeave={resetMagnetic}
                  style={{ x: btnX, y: btnY }}
                  whileTap={{ scale: 0.95 }}
                >
                  <button
                    onClick={() => navigate('/try')}
                    className="relative group bg-gradient-to-b from-[#F97316] to-[#E0610D] border border-[#FF8A3A]/50 text-white font-['DM_Sans'] font-semibold text-[15px] px-[28px] py-[14px] rounded-[6px] transition-all overflow-hidden shadow-[0_0_20px_rgba(249,115,22,0.3)] hover:shadow-[0_0_30px_rgba(249,115,22,0.5)]"
                  >
                    <div className="absolute inset-0 bg-white/20 translate-y-[-100%] group-hover:translate-y-[100%] transition-transform duration-500 ease-in-out"></div>
                    <span className="relative z-10 flex items-center gap-2">
                      Try it with your statement <span className="group-hover:translate-x-1 transition-transform">→</span>
                    </span>
                  </button>
                </motion.div>

                <button
                  onClick={() => navigate('/demo')}
                  className="bg-transparent border border-white/10 text-gray-300 font-['DM_Sans'] font-medium text-[15px] px-[28px] py-[14px] rounded-[6px] hover:bg-white/5 hover:text-white transition-all backdrop-blur-sm"
                >
                  See live demo
                </button>
              </div>

              {/* Trust signals row */}
              <div className="flex flex-col sm:flex-row gap-6">
                {[
                  "RBI Compliant Setup",
                  "99.9% Uptime SLA Target",
                  "Zero Data Lock-in"
                ].map((text, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-[#00FF94]/10 flex items-center justify-center">
                      <span className="text-[#00FF94] text-[10px]">✓</span>
                    </div>
                    <span className="font-['DM_Sans'] font-semibold text-[13px] text-gray-400">
                      {text}
                    </span>
                  </div>
                ))}
              </div>
            </FadeUp>
          </motion.div>

          {/* RIGHT COLUMN: TERMINAL WINDOW */}
          <motion.div
            className="w-full lg:w-[45%] flex justify-center lg:justify-end"
            style={{ translateZ: terminalZ, opacity: terminalOpacity, transformStyle: "preserve-3d" }}
          >
            <FadeUp delay={0.2}>
              <motion.div
                className="w-full max-w-[520px] bg-[#0A0A0A] border border-white/10 rounded-[12px] overflow-hidden shadow-[0_0_80px_rgba(249,115,22,0.15),0_24px_48px_rgba(0,0,0,0.6)] backdrop-blur-xl relative group"
                whileHover={{ rotateY: -2, rotateX: 2, scale: 1.01 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                style={{ willChange: 'transform' }}
              >
                {/* Subtle top glare */}
                <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

                {/* Dynamic Mouse Glow */}
                <motion.div
                  className="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition duration-300 group-hover:opacity-100"
                  style={{
                    background: useMotionTemplate`
                      radial-gradient(
                        600px circle at ${mouseX}px ${mouseY}px,
                        rgba(249, 115, 22, 0.1),
                        transparent 80%
                      )
                    `,
                  }}
                />

                {/* Terminal top bar */}
                <div className="h-[40px] bg-[#0F0F0F] border-b border-white/5 flex items-center px-4 justify-between relative z-10">
                  <div className="flex gap-[6px]">
                    <div className="w-[12px] h-[12px] rounded-full bg-[#FF5F57]/80 hover:bg-[#FF5F57] transition-colors"></div>
                    <div className="w-[12px] h-[12px] rounded-full bg-[#FFBD2E]/80 hover:bg-[#FFBD2E] transition-colors"></div>
                    <div className="w-[12px] h-[12px] rounded-full bg-[#28C840]/80 hover:bg-[#28C840] transition-colors"></div>
                  </div>
                  <div className="font-['JetBrains_Mono'] text-[11px] text-gray-500 font-medium tracking-wide">
                    POST /v1/underwriting/analyze
                  </div>
                  <div className="w-12"></div> {/* Spacer for center alignment */}
                </div>

                {/* Code content */}
                <div className="p-[24px] font-['JetBrains_Mono'] text-[13px] leading-[1.8] overflow-x-auto relative z-10 selection:bg-[#F97316]/30">
                  <div className="text-gray-500 mb-2 font-medium">// Request payload</div>
                  <div>
                    <span className="text-gray-400">{`{`}</span><br />
                    <span className="ml-4 text-gray-300">"applicant"</span><span className="text-gray-500">: {`{`} </span><span className="text-gray-300">"pan"</span><span className="text-gray-500">: </span><span className="text-[#00FF94]">"ABCPK1234D"</span><span className="text-gray-500"> {`},`}</span><br />
                    <span className="ml-4 text-gray-300">"bank_statement"</span><span className="text-gray-500">: {`{`}</span><br />
                    <span className="ml-8 text-gray-300">"period"</span><span className="text-gray-500">: </span><span className="text-[#00FF94]">"6 months"</span><span className="text-gray-500">,</span><br />
                    <span className="ml-8 text-gray-300">"transactions"</span><span className="text-gray-500">: [...]</span><br />
                    <span className="ml-4 text-gray-500">{`},`}</span><br />
                    <span className="ml-4 text-gray-300">"loan_request"</span><span className="text-gray-500">: {`{`}</span><br />
                    <span className="ml-8 text-gray-300">"amount"</span><span className="text-gray-500">: </span><span className="text-[#F97316]">200000</span><span className="text-gray-500">,</span><br />
                    <span className="ml-8 text-gray-300">"tenure_months"</span><span className="text-gray-500">: </span><span className="text-[#F97316]">24</span><br />
                    <span className="ml-4 text-gray-500">{`}`}</span><br />
                    <span className="text-gray-400">{`}`}</span>
                  </div>

                  <div className="text-gray-500 mt-6 mb-2 font-medium">// Response, <motion.span className="text-[#00FF94]">{timeDisplay}</motion.span></div>
                  <div>
                    <span className="text-gray-400">{`{`}</span><br />
                    <span className="ml-4 text-gray-300">"decision"</span><span className="text-gray-500">: </span><span className="text-[#00FF94] font-bold">"APPROVE"</span><span className="text-gray-500">,</span><br />
                    <span className="ml-4 text-gray-300">"credit_limit"</span><span className="text-gray-500">: </span><span className="text-[#F97316]">240000</span><span className="text-gray-500">,</span><br />
                    <span className="ml-4 text-gray-300">"risk_score"</span><span className="text-gray-500">: </span><motion.span className="text-[#F97316] inline-block">{roundedRiskScore}</motion.span><span className="text-gray-500">,</span><br />
                    <span className="ml-4 text-gray-300">"audit_id"</span><span className="text-gray-500">: </span><span className="text-[#00FF94]">"gavel_20260515_abc123"</span><span className="text-gray-500">,</span><br />
                    <span className="ml-4 text-gray-300">"reasons"</span><span className="text-gray-500">: [</span><br />
                    <span className="ml-8 text-gray-500">{`{`}</span><br />
                    <span className="ml-12 text-gray-300">"code"</span><span className="text-gray-500">: </span><span className="text-[#00FF94]">"STABLE_INCOME"</span><span className="text-gray-500">,</span><br />
                    <span className="ml-12 text-gray-300">"weight"</span><span className="text-gray-500">: </span><span className="text-[#F97316]">0.35</span><br />
                    <span className="ml-8 text-gray-500">{`},`}</span><br />
                    <span className="ml-8 text-gray-500">{`{`}</span><br />
                    <span className="ml-12 text-gray-300">"code"</span><span className="text-gray-500">: </span><span className="text-[#00FF94]">"LOW_EMI_RATIO"</span><span className="text-gray-500">,</span><br />
                    <span className="ml-12 text-gray-300">"weight"</span><span className="text-gray-500">: </span><span className="text-[#F97316]">0.28</span><br />
                    <span className="ml-8 text-gray-500">{`}`}</span><br />
                    <span className="ml-4 text-gray-500">]</span><br />
                    <span className="text-gray-400">{`}`}</span>
                    <span className="inline-block w-[6px] h-[15px] bg-[#F97316]/70 ml-2 align-middle animate-[blink_1s_step-end_infinite]"></span>
                  </div>
                </div>
              </motion.div>
            </FadeUp>
          </motion.div>
        </div>
      </div>

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
.perspective-[1000px] {
          perspective: 1000px;
        }
      `}</style>
    </section>
  );
};

export default HeroSection;
