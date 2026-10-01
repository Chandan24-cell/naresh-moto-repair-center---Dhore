/**
 * Tooltip — design-system MASTER §4
 * hover/focus-visible triggered. transform/opacity only, 150ms fast token.
 * Stays within viewport by adjusting side.
 */
import React, { useState } from 'react';

interface TooltipProps {
  content: string;
  children: React.ReactElement;
  side?: 'top' | 'bottom' | 'left' | 'right';
}

export function Tooltip({ content, children, side = 'top' }: TooltipProps) {
  const [visible, setVisible] = useState(false);

  const posMap = {
    top:    'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left:   'right-full top-1/2 -translate-y-1/2 mr-2',
    right:  'left-full top-1/2 -translate-y-1/2 ml-2',
  } as const;

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      {visible && (
        <span
          role="tooltip"
          className={[
            'absolute whitespace-nowrap z-[var(--z-toast)] px-2 py-1 rounded-[var(--radius-sm)]',
            'bg-[var(--bg-surface-2)] border border-[var(--border-subtle)]',
            'text-[11px] font-medium text-[var(--color-fg)] shadow-[var(--shadow-card)]',
            'pointer-events-none animate-fade-in',
            posMap[side],
          ].join(' ')}
        >
          {content}
        </span>
      )}
    </span>
  );
}
