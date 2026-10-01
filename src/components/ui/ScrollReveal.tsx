import { useRef, type ReactNode } from 'react';
import { motion, useInView, useReducedMotion } from 'motion/react';

export interface ScrollRevealProps {
  children: ReactNode;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  className?: string;
}

export default function ScrollReveal({
  children,
  delay = 0,
  direction = 'up',
  className
}: ScrollRevealProps) {
  const revealRef = useRef<HTMLDivElement>(null);
  // Don't replay entrances when someone scrolls back up the page.
  const isInView = useInView(revealRef, { once: true, margin: '-50px' });
  const prefersReducedMotion = useReducedMotion();

  const hiddenState = prefersReducedMotion ? { opacity: 1 } : {
    ...(direction === 'up' ? { y: 40 } : {}),
    ...(direction === 'down' ? { y: -40 } : {}),
    ...(direction === 'left' ? { x: 40 } : {}),
    ...(direction === 'right' ? { x: -40 } : {}),
    opacity: 0
  };

  return (
    <motion.div
      ref={revealRef}
      className={className}
      initial={hiddenState}
      animate={isInView ? { x: 0, y: 0, opacity: 1 } : hiddenState}
      transition={{
        duration: prefersReducedMotion ? 0 : 0.8,
        delay: prefersReducedMotion ? 0 : delay,
        ease: [0.22, 1, 0.36, 1]
      }}
    >
      {children}
    </motion.div>
  );
}
