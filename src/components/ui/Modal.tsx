/**
 * Modal — design-system MASTER §4 §6
 * - z-modal (50), backdrop blur on the scrim ONLY (MASTER: blur only on modals)
 * - Escape to close, focus trap, focus restore, Lenis freeze
 * - animate-view-in entrance (defined in index.css)
 * - radius-lg, shadow-modal from tokens
 */
import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: string;
  /** Skip the default padding (for full-bleed content) */
  noPadding?: boolean;
}

export function Modal({ isOpen, onClose, title, description, children, maxWidth = 'max-w-lg', noPadding = false }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const prevFocusRef = useRef<HTMLElement | null>(null);

  // Stop the background scroll loop while the dialog is open, then resume it on close.
  useEffect(() => {
    if (!isOpen) return;
    (window as any).lenis?.stop();
    return () => { (window as any).lenis?.start(); };
  }, [isOpen]);

  // Keep keyboard focus inside the dialog and return it to the opener on close.
  useEffect(() => {
    if (!isOpen) return;
    prevFocusRef.current = document.activeElement as HTMLElement;
    const panel = panelRef.current;
    if (!panel) return;

    const getFocusableElements = () =>
      Array.from(panel.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input, textarea, select, [tabindex]:not([tabindex="-1"])'
      ));

    requestAnimationFrame(() => getFocusableElements()[0]?.focus());

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { onClose(); return; }
      if (event.key !== 'Tab') return;
      const focusableElements = getFocusableElements();
      if (!focusableElements.length) return;
      const firstFocusable = focusableElements[0], lastFocusable = focusableElements[focusableElements.length - 1];
      if (event.shiftKey && document.activeElement === firstFocusable) { event.preventDefault(); lastFocusable.focus(); }
      else if (!event.shiftKey && document.activeElement === lastFocusable) { event.preventDefault(); firstFocusable.focus(); }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      prevFocusRef.current?.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const titleId = title ? 'modal-title' : undefined;
  const descId  = description ? 'modal-desc' : undefined;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ zIndex: 'var(--z-modal)' as any }}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descId}
    >
      {/* Scrim — backdrop blur allowed on modal scrims (MASTER §4) */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className={[
          'relative w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)]',
          'rounded-[var(--radius-lg)] shadow-[var(--shadow-modal)] animate-view-in overflow-hidden',
          maxWidth,
          noPadding ? '' : 'p-6',
        ].join(' ')}
      >
        {(title || description) && (
          <div className="mb-4">
            {title && (
              <div className="flex items-center justify-between gap-3">
                <h2 id={titleId} className="text-lg font-bold text-[var(--color-fg)]">{title}</h2>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] hover:bg-[var(--bg-surface-2)] transition-colors"
                  aria-label="Close dialog"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            )}
            {description && (
              <p id={descId} className="mt-1 text-sm text-[var(--color-fg-muted)]">{description}</p>
            )}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
