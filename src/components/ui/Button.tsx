/**
 * Button — design-system MASTER §3–§4
 * Variants: primary (accent fill) | secondary (surface border) | ghost | danger
 * Sizes: sm | md | lg
 * - accent via --color-accent (never hard-coded)
 * - touch target ≥ 44px on coarse pointer (index.css global rule)
 * - cursor:pointer via index.css global rule
 */
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  asChild?: boolean;
}

const sizeClasses: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-6 py-3 text-base gap-2.5',
};

const variantClasses: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary:
    'bg-[var(--color-accent)] text-[var(--color-on-accent)] hover:opacity-90 shadow-md shadow-[var(--shadow-accent)] active:scale-95',
  secondary:
    'bg-[var(--bg-surface)] border border-[var(--border-mid)] text-[var(--color-fg)] hover:border-[var(--color-accent)]/50 active:scale-95',
  ghost:
    'bg-transparent text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] hover:bg-[var(--bg-surface-2)] active:scale-95',
  danger:
    'bg-[var(--color-danger)] text-white hover:opacity-90 active:scale-95',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className = '',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={[
        'inline-flex items-center justify-center font-semibold rounded-[var(--radius-md)]',
        'transition-[transform,opacity] duration-[var(--dur-fast)] focus-visible:outline-2 focus-visible:outline-[var(--color-ring)]',
        'disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap',
        sizeClasses[size],
        variantClasses[variant],
        className,
      ].join(' ')}
      {...rest}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" aria-hidden="true" />
      ) : null}
      {children}
    </button>
  );
}
