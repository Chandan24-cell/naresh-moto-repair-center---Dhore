/**
 * Badge — design-system MASTER §3–§4
 * Semantic variants: default | success | warning | danger | info | accent
 * radius-full, small text, uppercase blocked for Nepali (:lang(ne) resets in CSS)
 */
import React from 'react';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'accent';
  size?: 'xs' | 'sm';
}

const variantMap: Record<NonNullable<BadgeProps['variant']>, string> = {
  default:  'bg-[var(--bg-surface-2)] text-[var(--color-fg-muted)] border-[var(--border-subtle)]',
  success:  'bg-[var(--color-success)]/15 text-[var(--color-success)] border-[var(--color-success)]/25',
  warning:  'bg-[var(--status-warning)]/15 text-[var(--status-warning)] border-[var(--status-warning)]/25',
  danger:   'bg-[var(--color-danger)]/15 text-[var(--color-danger)] border-[var(--color-danger)]/25',
  info:     'bg-[var(--status-info)]/15 text-[var(--status-info)] border-[var(--status-info)]/25',
  accent:   'bg-[var(--color-accent)]/15 text-[var(--color-accent-text)] border-[var(--color-accent)]/25',
};

const sizeMap = { xs: 'px-1.5 py-0.5 text-[10px]', sm: 'px-2 py-0.5 text-xs' } as const;

export function Badge({ variant = 'default', size = 'sm', className = '', children, ...rest }: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1 font-semibold rounded-[var(--radius-full)]',
        'border leading-none',
        variantMap[variant],
        sizeMap[size],
        className,
      ].join(' ')}
      {...rest}
    >
      {children}
    </span>
  );
}
