/**
 * Card — design-system MASTER §3–§4
 * radius-md, shadow-card, bg-surface, border-subtle.
 * Optionally interactive (hover state) with hover:border-accent.
 */
import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const padMap = { none: '', sm: 'p-4', md: 'p-6', lg: 'p-8' } as const;

export function Card({ interactive = false, padding = 'md', className = '', children, ...rest }: CardProps) {
  return (
    <div
      className={[
        'rounded-[var(--radius-md)] border border-[var(--border-subtle)]',
        'bg-[var(--bg-surface)] shadow-[var(--shadow-card)]',
        interactive
          ? 'transition-colors duration-[var(--dur-fast)] hover:border-[var(--color-accent)]/40 hover:bg-[var(--card-hover)] cursor-pointer'
          : '',
        padMap[padding],
        className,
      ].join(' ')}
      {...rest}
    >
      {children}
    </div>
  );
}
