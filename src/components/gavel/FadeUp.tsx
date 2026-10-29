import React, { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';

interface FadeUpProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

/**
 * Scroll-reveal wrapper.
 *
 * Two things matter here and both used to be wrong:
 *
 * 1. `whileInView` with `once: true` never fires when an element is *already*
 * in the viewport at mount in some engines, and it never fires during static
 * prerendering (react-snap) at all, the markup is captured at `opacity: 0`,
 * so a crawler sees empty sections. A one-off fallback timer guarantees the
 * content becomes visible even if the observer stays silent.
 * 2. Content must never be permanently invisible. The timer is the safety net;
 * the observer is the nicety.
 */
export const FadeUp = ({ children, delay = 0, className = '' }: FadeUpProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const [forcedVisible, setForcedVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setForcedVisible(true), 1200);
    return () => clearTimeout(timer);
  }, []);

  const visible = inView || forcedVisible;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={visible ? { opacity: 1, y: 0 }: { opacity: 0, y: 24 }}
      transition={{ duration: 0.45, ease: 'easeOut', delay: visible && inView ? delay: 0 }}
      className={className}
    >
      {children}
    </motion.div>
  );
};
