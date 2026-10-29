import React from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";

export const Logo = () => {
  const { scrollYProgress } = useScroll();
  
  // Use spring physics to smooth out the scroll progress and prevent jitter
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 150,
    damping: 30,
    restDelta: 0.001
  });

  // Map scroll progress (0 to 1) to rotation (0 to 360deg max, clamped)
  // Ensures deterministic, clockwise-only rotation
  const rotation = useTransform(smoothProgress, [0, 1], [0, 360]);

  return (
    <Link to="/" className="flex items-center gap-2 group cursor-pointer z-50">
      <div className="relative flex items-center justify-center w-7 h-7" style={{ perspective: "1000px" }}>
        <motion.svg
          viewBox="0 0 100 100"
          className="w-full h-full rounded-[4px] will-change-transform"
          style={{ 
            rotate: rotation,
            transformOrigin: "center center"
          }}
          whileHover={{ scale: 1.15, rotate: rotation.get() + 15 }} // Add a subtle extra bump on hover
          transition={{ type: "spring", stiffness: 400, damping: 15 }}
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="100" height="100" fill="#FF5C00" />
          <polygon points="50,15 80.3,68 19.7,68" fill="#1A1C1E" />
          <polygon points="16.9,73 83.1,73 90,85 10,85" fill="#1A1C1E" />
        </motion.svg>
      </div>
      <span className="font-['DM_Sans'] font-semibold text-[15px] tracking-[0.1em] text-foreground transition-colors duration-300 group-hover:text-[#F97316]">
        GAVEL AI
      </span>
    </Link>
  );
};
