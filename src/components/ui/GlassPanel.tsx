/**
 * GlassPanel — design-system MASTER §4
 * backdrop-filter blur ONLY on sticky header and modal scrims per MASTER §4.
 * This component is for HEADER/MODAL contexts only (not for cards/sections).
 * For cards, use Card with dark-surface CSS class.
 */
import React from 'react';

interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: React.ElementType;
}

export function GlassPanel({ as: Tag = 'div', className = '', children, ...rest }: GlassPanelProps) {
  const El = Tag as React.ElementType;
  return (
    <El
      className={[
        'bg-[var(--bg-overlay)] border border-[var(--border-subtle)]',
        'rounded-[var(--radius-md)] dark-surface',
        className,
      ].join(' ')}
      {...rest}
    >
      {children}
    </El>
  );
}
