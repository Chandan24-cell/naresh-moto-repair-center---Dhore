/**
 * Input — design-system MASTER §3–§4
 * Wraps a label + input + optional error message.
 * Uses --color-ring for focus, no hard-coded colors.
 */
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  wrapperClassName?: string;
}

export function Input({ label, error, hint, id, wrapperClassName = '', className = '', ...rest }: InputProps) {
  const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
  return (
    <div className={['flex flex-col gap-1', wrapperClassName].join(' ')}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-semibold text-[var(--color-fg-muted)] select-none"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={[
          'w-full rounded-[var(--radius-sm)] border bg-[var(--bg-surface)]',
          'px-3 py-2 text-sm text-[var(--color-fg)] placeholder:text-[var(--color-fg-muted)]',
          error
            ? 'border-[var(--color-danger)] focus:outline-2 focus:outline-[var(--color-danger)]'
            : 'border-[var(--border-mid)] focus:outline-2 focus:outline-[var(--color-ring)]',
          'ui-input-control transition-transform duration-[var(--dur-fast)] disabled:opacity-50',
          className,
        ].join(' ')}
        {...rest}
      />
      {error && (
        <p className="text-[11px] text-[var(--color-danger)]" role="alert">{error}</p>
      )}
      {hint && !error && (
        <p className="text-[11px] text-[var(--color-fg-muted)]">{hint}</p>
      )}
    </div>
  );
}
