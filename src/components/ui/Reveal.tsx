/**
 * Reveal — design-system MASTER §4 scroll entrance wrapper
 * Wraps children in a [data-reveal] element driven by the global
 * IntersectionObserver in App.tsx. No second animation library.
 * Optional delay via --reveal-delay (stagger children in a list).
 */
import React from 'react';

interface RevealProps {
  children: React.ReactNode;
  delay?: number; // ms, used as --reveal-delay CSS var
  className?: string;
  as?: React.ElementType;
}

export function Reveal({ children, delay = 0, className = '', as: Tag = 'div' }: RevealProps) {
  const El = Tag as React.ElementType;
  return (
    <El
      data-reveal=""
      className={className}
      style={delay > 0 ? { '--reveal-delay': `${delay}ms` } as React.CSSProperties : undefined}
    >
      {children}
    </El>
  );
}
