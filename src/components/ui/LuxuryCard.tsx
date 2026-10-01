import type { ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';

interface LuxuryCardProps {
  children: ReactNode;
  className?: string;
}

// Share one restrained response for the card's hover and press feedback.
const spring = { type: 'spring' as const, stiffness: 400, damping: 17 };

// Skip the card transform when the visitor has asked for reduced motion.
export default function LuxuryCard({ children, className = '' }: LuxuryCardProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      className={`relative overflow-hidden rounded-2xl border border-black/10 bg-white/80 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-black/80 dark:shadow-lg dark:shadow-black/50 ${className}`}
      whileHover={prefersReducedMotion ? undefined : { scale: 1.02 }}
      whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
      transition={spring}
    >
      {children}
    </motion.div>
  );
}
