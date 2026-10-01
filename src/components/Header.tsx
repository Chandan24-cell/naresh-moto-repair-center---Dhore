import { useState, useEffect, useRef } from 'react';
import { Phone, Menu, X, Calendar, Wrench, Globe, Sun, Moon, ChevronDown, QrCode } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { BUSINESS_INFO } from '../data/siteData';
import { Language, TRANSLATIONS } from '../data/translations';
import type { Theme } from '../App';
import { useBusinessHours } from '../hooks/useBusinessHours';

interface HeaderProps {
  lang: Language;
  theme: Theme;
  onToggleLang: () => void;
  onToggleTheme: () => void;
  onOpenBooking: (serviceName?: string) => void;
  onOpenPayment: () => void;
}

// Keep the sticky bar compact while secondary destinations stay reachable in the menus.
export default function Header({ lang, theme, onToggleLang, onToggleTheme, onOpenBooking, onOpenPayment }: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const { isOpenNow } = useBusinessHours();
  const drawerRef = useRef<HTMLDivElement>(null);
  const menuBtnRef = useRef<HTMLButtonElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);

  const t = TRANSLATIONS[lang].nav;
  const themeT = TRANSLATIONS[lang].theme;
  const isDark = theme === 'dark';
  const prefersReducedMotion = useReducedMotion() ?? false;

  // Priority collapse (design-system MASTER + Stage 2 spec):
  // 5 primary links inline from lg; the rest live in the "More" dropdown.
  const primaryLinks = [
    { href: '#home',     label: t.home },
    { href: '#services', label: t.services },
    { href: '#pricing',  label: t.packages },
    { href: '#reviews',  label: t.reviews },
    { href: '#contact',  label: t.contact },
  ];
  const moreLinks = [
    { href: '#what-rolls-in', label: t.whatWeFix },
    { href: '#why-us',        label: t.whyUs },
    { href: '#gallery',       label: t.gallery },
    { href: '#blog',          label: t.tips },
    { href: '#about',         label: t.about },
    { href: '#faq',           label: lang === 'en' ? 'FAQ' : 'प्रश्नहरू' },
  ];

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close "More" dropdown on outside click / Escape
  useEffect(() => {
    if (!moreOpen) return;
    const onDown = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMoreOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [moreOpen]);

  // Lenis: freeze page scroll while the drawer is open, restore on close
  useEffect(() => {
    if (!mobileMenuOpen) return;
    (window as any).lenis?.stop();
    return () => {
      (window as any).lenis?.start();
    };
  }, [mobileMenuOpen]);

  // Drawer: Escape to close + focus trap + focus restore
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const drawer = drawerRef.current;
    if (!drawer) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
        return;
      }
      if (e.key !== 'Tab') return;
      const focusables = drawer.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])'
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);

    // Move focus into the drawer, restore to the menu button on close
    const prevActive = document.activeElement as HTMLElement | null;
    const firstFocus = drawer.querySelector<HTMLElement>('a[href], button');
    firstFocus?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      menuBtnRef.current?.focus();
      void prevActive;
    };
  }, [mobileMenuOpen]);

  const headerBg = isDark
    ? isScrolled
      ? 'bg-[#0d1017]/95 backdrop-blur-md border-b border-white/10 shadow-lg shadow-black/40 py-3'
      : 'bg-[#0c0e12]/80 backdrop-blur-sm border-b border-white/5 py-4'
    : isScrolled
      ? 'bg-white/97 backdrop-blur-md border-b border-black/10 shadow-md shadow-black/5 py-3'
      : 'bg-white/90 backdrop-blur-sm border-b border-black/5 py-4';

  const navLinkClass = isDark
    ? 'hover:text-accent-text transition-colors text-neutral-300 whitespace-nowrap'
    : 'hover:text-accent-text transition-colors text-neutral-600 whitespace-nowrap';

  const drawerBg = isDark ? 'bg-[#11141c] border-l border-white/10' : 'bg-white border-l border-black/10';

  const toggleBtn = (extra: string) =>
    `flex items-center justify-center rounded-lg text-xs transition-colors cursor-pointer border ${
      isDark
        ? 'bg-neutral-900 border-white/15 text-neutral-200 hover:text-white hover:border-[#ff3b19]/50'
        : 'bg-neutral-100 border-black/10 text-neutral-700 hover:text-neutral-900 hover:border-[#e8340f]/40'
    } ${extra}`;

  return (
    <>
      <header data-hash-nav="" className={`sticky top-0 z-40 transition-all duration-200 ${headerBg}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-3 lg:gap-4">

            {/* Zone 1: Wordmark */}
            <a
              href="#home"
              aria-label="Naresh MOTO Bike Service & Repair Center"
              title="Naresh MOTO"
              className={`text-lg sm:text-xl font-bold tracking-tight flex items-center gap-2.5 group shrink-0 ${isDark ? 'text-white' : 'text-neutral-900'}`}
            >
              <span className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-white shadow-md shadow-[#ff3b19]/30 group-hover:scale-105 transition-transform">
                <Wrench className="w-4 h-4" />
              </span>
              {/* Brand text hides on very small phones (Nepali strings are longer —
                  MASTER: text must reflow without clipping) */}
              <span className="font-display hidden min-[420px]:inline max-w-[30vw] truncate text-sm xl:max-w-[13rem]">Naresh MOTO Bike Service &amp; Repair Center</span>
            </a>

            {/* Zone 2: Desktop nav — 5 primary links + "More" dropdown.
                whitespace-nowrap on every label guarantees a single line. */}
            <nav className={`hidden lg:flex items-center gap-4 xl:gap-5 text-sm font-medium ${navLinkClass}`} aria-label="Primary">
              {primaryLinks.map(item => (
                <a key={item.href} href={item.href} className={`${navLinkClass} nav-hash-link`}>{item.label}</a>
              ))}
              <div className="relative" ref={moreRef}>
                <button
                  type="button"
                  onClick={() => setMoreOpen(v => !v)}
                  aria-expanded={moreOpen}
                  aria-haspopup="true"
                  className={`flex items-center gap-0.5 ${navLinkClass} cursor-pointer`}
                >
                  <span>{lang === 'en' ? 'More' : 'अरू'}</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${moreOpen ? 'rotate-180' : ''}`} />
                </button>
                {moreOpen && (
                  <div
                    className={`absolute right-0 top-full mt-2 w-48 rounded-xl border p-1.5 shadow-xl ${
                      isDark ? 'bg-[#11141c] border-white/10' : 'bg-white border-black/10'
                    }`}
                    role="menu"
                  >
                    {moreLinks.map(item => (
                      <a
                        key={item.href}
                        href={item.href}
                        role="menuitem"
                        onClick={() => setMoreOpen(false)}
                        className={`nav-hash-link block px-3 py-2 text-sm font-medium rounded-lg whitespace-nowrap ${
                          isDark
                            ? 'text-neutral-200 hover:text-accent-text hover:bg-white/5'
                            : 'text-neutral-700 hover:text-accent-text hover:bg-black/5'
                        }`}
                      >
                        {item.label}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </nav>

            {/* Zone 3: Toggles + primary actions */}
            <div className="flex items-center gap-2 shrink-0">

              {/* Language Toggle — desktop only; the mobile drawer has its own
                  lang/theme row, so the 375px header stays on one line */}
              <button
                type="button"
                onClick={onToggleLang}
                className={toggleBtn('px-2.5 py-1.5 font-bold hidden lg:flex')}
                aria-label={themeT ? `Switch language to ${lang === 'en' ? 'Nepali' : 'English'}` : 'Toggle language'}
                title={`Switch to ${lang === 'en' ? 'नेपाली' : 'English'}`}
              >
                <Globe className="w-3.5 h-3.5 text-accent-text" />
                <span>{lang === 'en' ? 'नेपाली' : 'EN'}</span>
              </button>

              {/* Theme Toggle (sun/moon) — desktop only on the bar */}
              <motion.button
                type="button"
                onClick={onToggleTheme}
                className={toggleBtn('w-9 h-9')}
                aria-label={isDark ? (themeT?.lightMode ?? 'Switch to light theme') : (themeT?.darkMode ?? 'Switch to dark theme')}
                title={isDark ? 'Switch to Clean Light Theme' : 'Switch to Dark Garage Theme'}
                whileHover={prefersReducedMotion ? undefined : { scale: 1.02 }}
                whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                  >
                <motion.span
                  key={isDark ? 'sun' : 'moon'}
                  initial={prefersReducedMotion ? false : { opacity: 0, rotate: -45, scale: 0.75 }}
                  animate={{ opacity: 1, rotate: 0, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17, duration: prefersReducedMotion ? 0 : undefined }}
                >
                  {isDark ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4" />}
                </motion.span>
              </motion.button>
              {/* Phone (xl+ only) */}
              <a
                href={`tel:${BUSINESS_INFO.phoneRaw}`}
                className={`hidden xl:inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg hover:border-[#ff3b19]/40 transition-all whitespace-nowrap border ${
                  isDark
                    ? 'text-neutral-200 bg-neutral-900 border-white/10 hover:text-white'
                    : 'text-neutral-700 bg-neutral-100 border-black/10 hover:text-neutral-900'
                }`}
                aria-label={`Call ${BUSINESS_INFO.phone}`}
              >
                <Phone className="w-3.5 h-3.5 text-accent-text" />
                <span className="font-mono-numbers">{BUSINESS_INFO.phone}</span>
              </a>

              <a
                href="/admin"
                className={`hidden sm:inline-flex items-center justify-center rounded-xl border px-3 py-2 text-[10px] font-semibold tracking-[0.12em] uppercase transition-colors ${isDark ? 'border-white/15 bg-white/5 text-white hover:border-accent/60 hover:text-accent-text' : 'border-black/10 bg-neutral-100 text-neutral-800 hover:border-accent/40 hover:text-accent-text'}`}
              >
                Admin Portal
              </a>

              {/* Pay Now CTA */}
              <button
                onClick={() => onOpenPayment()}
                className="button-micro-interaction hidden md:flex px-3.5 py-2 text-xs font-bold text-emerald-900 bg-emerald-400 hover:bg-emerald-500 rounded-lg transition-all shadow-md shadow-emerald-500/25 cursor-pointer items-center gap-1.5"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>{lang === 'en' ? 'Pay Now' : 'भुक्तानी'}</span>
              </button>

              {/* Book CTA */}
              <button
                onClick={() => onOpenBooking()}
                className="button-micro-interaction px-3.5 py-2 text-xs font-bold text-white bg-accent hover:bg-accent-hover rounded-lg transition-all shadow-md shadow-[#ff3b19]/25 hover:shadow-[#ff3b19]/40 whitespace-nowrap active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>{t.bookService}</span>
              </button>

              {/* Mobile menu trigger */}
              <button
                type="button"
                ref={menuBtnRef}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className={`lg:hidden p-2 rounded-lg transition-colors cursor-pointer ${
                  isDark
                    ? 'text-neutral-300 hover:text-white hover:bg-neutral-800'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                }`}
                aria-label="Toggle navigation menu"
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      <div
        className={`fixed inset-0 z-50 lg:hidden ${mobileMenuOpen ? '' : 'pointer-events-none'}`}
        inert={!mobileMenuOpen}
        aria-hidden={!mobileMenuOpen}
      >
      <AnimatePresence initial={false}>
      {mobileMenuOpen && (
        <motion.div className="absolute inset-0">
          <motion.div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
            initial={prefersReducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={prefersReducedMotion ? undefined : { opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.2, ease: 'easeOut' }}
          />
          <motion.div
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Site navigation"
            className={`fixed top-0 right-0 bottom-0 w-full max-w-xs ${drawerBg} p-6 flex flex-col justify-between overflow-y-auto`}
            data-lenis-prevent
            initial={prefersReducedMotion ? false : { opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={prefersReducedMotion ? undefined : { opacity: 0, x: 20 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.24, ease: 'easeOut' }}
          >
            <div>
              <div className={`flex items-center justify-between pb-5 border-b ${isDark ? 'border-white/10' : 'border-black/10'}`}>
                <span className={`font-display font-bold text-lg flex items-center gap-2 ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                  <span className="w-7 h-7 rounded bg-accent flex items-center justify-center text-white">
                    <Wrench className="w-3.5 h-3.5" />
                  </span>
                  Naresh Moto
                </span>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className={`p-1.5 rounded-lg cursor-pointer ${isDark ? 'theme-text-muted hover:text-white hover:bg-white/5' : 'theme-text-muted hover:text-neutral-900 hover:bg-black/5'}`}
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Status + Language + Theme row */}
              <div className="my-4 flex items-center gap-2">
                <div className={`flex-1 p-2.5 rounded-lg border flex items-center justify-between text-xs ${isDark ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'}`}>
                  <span className={`flex items-center gap-1.5 ${isDark ? 'theme-text-muted' : 'theme-text-muted'}`}>
                    <span className={`w-2 h-2 rounded-full ${isOpenNow ? 'bg-emerald-400 animate-live-green' : 'bg-amber-400'}`} />
                    <span className={isDark ? 'text-neutral-300' : 'text-neutral-700'}>{isOpenNow ? t.openNow : t.closed}</span>
                  </span>
                  <span className={`font-mono-numbers text-[11px] ${isDark ? 'text-neutral-300' : 'text-neutral-600'}`}>6 AM–8 PM</span>
                </div>

                <button
                  type="button"
                  onClick={onToggleLang}
                  className={`p-2.5 px-3 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer border ${
                    isDark
                      ? 'bg-neutral-900 border-white/20 text-white'
                      : 'bg-neutral-100 border-black/15 text-neutral-800'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5 text-accent-text" />
                  <span>{lang === 'en' ? 'नेपाली' : 'EN'}</span>
                </button>

                <motion.button
                  type="button"
                  onClick={onToggleTheme}
                  className={`p-2.5 rounded-lg cursor-pointer border ${
                    isDark
                      ? 'bg-neutral-900 border-white/20 text-amber-300'
                      : 'bg-neutral-100 border-black/15 text-neutral-600'
                  }`}
                  aria-label={isDark ? (themeT?.lightMode ?? 'Switch to light theme') : (themeT?.darkMode ?? 'Switch to dark theme')}
                  whileHover={prefersReducedMotion ? undefined : { scale: 1.02 }}
                  whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                >
                  {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </motion.button>
              </div>

              <nav className="flex flex-col gap-1 mt-2" aria-label="All sections">
                {[
                  { href: '#home',          label: t.home },
                  { href: '#what-rolls-in', label: t.whatWeFix },
                  { href: '#services',      label: t.services },
                  { href: '#why-us',        label: t.whyUs },
                  { href: '#pricing',       label: t.packages },
                  { href: '#blog',          label: t.tips },
                  { href: '#gallery',       label: t.gallery },
                  { href: '#reviews',       label: t.reviews },
                  { href: '#about',         label: t.about },
                  { href: '#faq',           label: lang === 'en' ? 'FAQ' : 'प्रश्नहरू' },
                  { href: '#contact',       label: t.contact },
                ].map(item => (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`nav-hash-link px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      isDark
                        ? 'text-neutral-200 hover:text-accent-text hover:bg-white/5'
                        : 'text-neutral-700 hover:text-accent-text hover:bg-black/5'
                    }`}
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
            </div>

            <div className={`pt-6 border-t ${isDark ? 'border-white/10' : 'border-black/10'} flex flex-col gap-3`}>
              <a
                href={`tel:${BUSINESS_INFO.phoneRaw}`}
                className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold hover:border-[#ff3b19]/40 border transition-colors ${
                  isDark
                    ? 'bg-neutral-900 border-white/10 text-white'
                    : 'bg-neutral-100 border-black/10 text-neutral-800'
                }`}
              >
                <Phone className="w-4 h-4 text-accent-text" />
                <span className="font-mono-numbers">{BUSINESS_INFO.phone}</span>
              </a>

              <button
                onClick={() => { setMobileMenuOpen(false); onOpenPayment(); }}
                className="button-micro-interaction w-full py-2.5 px-4 rounded-lg bg-emerald-500 text-white text-sm font-bold shadow-md shadow-emerald-500/30 cursor-pointer hover:bg-emerald-600 transition-all flex items-center justify-center gap-2"
              >
                <QrCode className="w-4 h-4" />
                <span>{lang === 'en' ? 'Pay Now' : 'भुक्तानी'}</span>
              </button>

              <button
                onClick={() => { setMobileMenuOpen(false); onOpenBooking(); }}
                className="button-micro-interaction w-full py-2.5 px-4 rounded-lg bg-accent text-white text-sm font-bold shadow-md shadow-[#ff3b19]/30 cursor-pointer hover:bg-accent-hover transition-all"
              >
                {t.bookService}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>
      </div>
    </>
  );
}
