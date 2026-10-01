import { useState, useEffect } from 'react';
import Header from './components/Header';

import WhatRollsThroughOurDoor from './components/WhatRollsThroughOurDoor';
import ServicesGrid from './components/ServicesGrid';
import WhyChooseUs from './components/WhyChooseUs';
import HowItWorks from './components/HowItWorks';
import PricingPackages from './components/PricingPackages';
import BeforeAfterGallery from './components/BeforeAfterGallery';
import SocialProofFeed from './components/SocialProofFeed';
import BlogSection from './components/BlogSection';
import ReviewsSection from './components/ReviewsSection';
import AboutTeam from './components/AboutTeam';
import FaqAccordion from './components/FaqAccordion';
import ContactLocation from './components/ContactLocation';
import Footer from './components/Footer';
import MobileStickyBar from './components/MobileStickyBar';
import FloatingWhatsApp from './components/FloatingWhatsApp';
import BookingModal from './components/BookingModal';
import PaymentModal from './components/PaymentModal';
import LegalModal, { LegalModalType } from './components/LegalModal';
import CookieConsent from './components/CookieConsent';
import PwaInstallPrompt from './components/PwaInstallPrompt';
import AdminDashboard from './components/AdminDashboard';
import AfterHoursChatbot from './components/AfterHoursChatbot';
import ReferralCard from './components/ReferralCard';
import NotFoundView from './components/NotFoundView';
import TopAnnouncementBar from './components/TopAnnouncementBar';
import BikeShowcaseSection from './components/BikeShowcaseSection';
import { Language } from './data/translations';

export type Theme = 'dark' | 'light';

type GalleryData = {
  splitBefore: string;
  splitAfter: string;
  siteImages?: Record<string, string>;
  images: Array<{ id: string; category: string; src: string; titleEn: string; titleNp: string; captionEn: string; captionNp: string }>;
};

export default function App() {
  // Keep the visitor's appearance preference when they return to the site.
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('naresh_moto_theme');
    return saved === 'dark' ? 'dark' : 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('light', theme === 'light');
    root.classList.toggle('dark', theme === 'dark');
    root.style.colorScheme = theme;
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((current) => {
      const next = current === 'dark' ? 'light' : 'dark';
      localStorage.setItem('naresh_moto_theme', next);
      return next;
    });
  };

  // The admin URL keeps its existing standalone surface instead of rendering public sections.
  if (window.location.pathname.replace(/\/+$/, '') === '/admin') {
    return <AdminDashboard theme={theme} />;
  }
  return <PublicSite theme={theme} onToggleTheme={handleToggleTheme} />;
}

function PublicSite({ theme, onToggleTheme }: { theme: Theme; onToggleTheme: () => void }) {
  // ── Language ─────────────────────────────────────────────────
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem('naresh_moto_lang');
    return (saved === 'np' || saved === 'en') ? saved : 'en';
  });

  // Keep <html lang> in sync so Devanagari typography rules (:lang(ne)) and
  // assistive tech use the right language (design-system MASTER §3)
  useEffect(() => {
    document.documentElement.lang = lang === 'np' ? 'ne' : 'en';
  }, [lang]);

  // ── Modals / UI state ────────────────────────────────────────
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedServiceForModal, setSelectedServiceForModal] = useState<string | undefined>(undefined);
  const [galleryData, setGalleryData] = useState<GalleryData | undefined>(undefined);
  const [legalModalType, setLegalModalType] = useState<LegalModalType>(null);
  const [is404, setIs404] = useState(() => {
    return window.location.pathname === '/404' || window.location.hash === '#404';
  });

  useEffect(() => {
    const handleHashChange = () => setIs404(window.location.hash === '#404');
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // One observer handles section entrances so the page doesn't create an observer per card.
  // Re-run after theme or language changes in case rendering replaced reveal classes.
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]:not(.is-visible)'));
    if (els.length === 0) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    els.forEach((el) => {
      // Anchor jumps can land below a section before the observer sees it.
      if (el.getBoundingClientRect().bottom < 0) el.classList.add('is-visible');
      else io.observe(el);
    });
    // Catch sections skipped between frames during a fast scroll.
    let sweepTimer: number | undefined;
    const sweep = () => {
      document.querySelectorAll<HTMLElement>('[data-reveal]:not(.is-visible)').forEach((el) => {
        if (el.getBoundingClientRect().bottom < 0) el.classList.add('is-visible');
      });
    };
    const onScroll = () => {
      window.clearTimeout(sweepTimer);
      sweepTimer = window.setTimeout(sweep, 180);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    // Keep a short-lived fallback sweep until every remaining section is visible.
    const intervalId = window.setInterval(() => {
      sweep();
      if (document.querySelector('[data-reveal]:not(.is-visible)') === null) {
        window.clearInterval(intervalId);
      }
    }, 800);
    return () => {
      io.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.clearTimeout(sweepTimer);
      window.clearInterval(intervalId);
    };
  }, [theme, lang, is404]);

  // Leave native scrolling in place when the visitor requests reduced motion.
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const perfFlags = new URLSearchParams(window.location.search).getAll('perf').flatMap((value) => value.split(/[,+]/));
    if (prefersReducedMotion || perfFlags.includes('nolenis')) return;

    let cleanup: (() => void) | undefined;
    let cancelled = false;

    // Load Lenis only after this client-side effect runs.
    import('lenis').then(({ default: Lenis }) => {
      if (cancelled) return;
      const lenis = new Lenis({
        lerp: 0.085,
        smoothWheel: true,
        syncTouch: false,
      });

      // Modals and in-page navigation share this instance to pause or move the page.
      (window as any).lenis = lenis;

      let rafId = 0;
      const scheduleRaf = () => {
        if (!rafId && !cancelled) rafId = requestAnimationFrame(raf);
      };
      const raf = (time: number) => {
        rafId = 0;
        lenis.raf(time);
        if ((lenis as any).isScrolling) scheduleRaf();
      };
      const onInput = () => scheduleRaf();
      window.addEventListener('wheel', onInput, { passive: true });
      window.addEventListener('touchmove', onInput, { passive: true });
      window.addEventListener('keydown', onInput, { passive: true });
      lenis.on('scroll', scheduleRaf);

      // Route all in-page anchor links through lenis
      const handleAnchorClick = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        const anchor = target.closest('a');
        if (!anchor) return;
        
        const href = anchor.getAttribute('href');
        if (href && href.startsWith('#') && href.length > 1) {
          // Only intercept anchors that point to an element on this page.
          const el = document.querySelector(href);
          if (el) {
            e.preventDefault();
            lenis.scrollTo(el as HTMLElement, { offset: -80, duration: 1.4 }); // assuming header is ~80px
            scheduleRaf();
            window.history.pushState(null, '', href);
          }
        }
      };
      document.addEventListener('click', handleAnchorClick);

      cleanup = () => {
        cancelled = true;
        if (rafId) cancelAnimationFrame(rafId);
        window.removeEventListener('wheel', onInput);
        window.removeEventListener('touchmove', onInput);
        window.removeEventListener('keydown', onInput);
        lenis.off('scroll', scheduleRaf);
        document.removeEventListener('click', handleAnchorClick);
        lenis.destroy();
        delete (window as any).lenis;
      };
    });
    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);

  // Keep state changes for language and modal entry points in this component.
  const handleToggleLang = () => {
    const nextLang = lang === 'en' ? 'np' : 'en';
    setLang(nextLang);
    localStorage.setItem('naresh_moto_lang', nextLang);
  };

  const handleOpenBooking = (serviceName?: string) => {
    setSelectedServiceForModal(serviceName);
    setIsBookingModalOpen(true);
  };

  const handleCloseBooking = () => {
    setIsBookingModalOpen(false);
    setSelectedServiceForModal(undefined);
  };

  useEffect(() => {
    fetch('/api/public/data', { cache: 'no-store' })
      .then((response) => response.ok ? response.json() : null)
      .then((payload) => {
        if (payload?.gallery) setGalleryData(payload.gallery);
      })
      .catch(() => undefined);
  }, []);

  if (is404) {
    return (
      <NotFoundView
        lang={lang}
        onBackHome={() => {
          window.location.hash = '';
          setIs404(false);
        }}
      />
    );
  }

  const isDark = theme === 'dark';

  return (
    <div
      className="animate-view-fade min-h-screen flex flex-col font-sans selection:bg-accent selection:text-white"
      style={{
        backgroundColor: 'var(--bg-base)',
        color: 'var(--text-base)',
      }}
    >
      {/* Skip to Content for Accessibility */}
      <a
        href="#what-rolls-in"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 z-50 bg-accent text-white px-4 py-2 rounded-lg font-bold shadow-lg"
      >
        Skip to main content
      </a>

      {/* Floating Top Announcement Bar — above header */}
      <TopAnnouncementBar
        lang={lang}
        theme={theme}
        onOpenBooking={() => handleOpenBooking()}
      />

      {/* Subtle PWA Install Banner */}
      <PwaInstallPrompt />

      {/* Sticky Header with Language + Theme Toggles */}
      <Header
        lang={lang}
        theme={theme}
        onToggleLang={handleToggleLang}
        onToggleTheme={onToggleTheme}
        onOpenBooking={handleOpenBooking}
        onOpenPayment={() => setIsPaymentModalOpen(true)}
      />

      <main className="flex-1 pb-16 lg:pb-0">
        {/* Scroll-scrubbed bike assembly showcase (now includes Hero content) */}
        <BikeShowcaseSection
          lang={lang}
          theme={theme}
          onOpenBooking={() => handleOpenBooking()}
        />

        {/* Dedicated Section: "What Rolls Through Our Door" */}
        <WhatRollsThroughOurDoor
          lang={lang}
          theme={theme}
          onOpenBooking={handleOpenBooking}
          siteImages={galleryData?.siteImages}
        />

        {/* Full Services Grid */}
        <ServicesGrid
          lang={lang}
          theme={theme}
          onOpenBooking={handleOpenBooking}
          siteImages={galleryData?.siteImages}
        />

        {/* Why Choose Us */}
        <WhyChooseUs lang={lang} theme={theme} />

        {/* How It Works (4-step timeline) */}
        <HowItWorks lang={lang} theme={theme} />

        {/* Pricing / Service Packages */}
        <PricingPackages
          lang={lang}
          theme={theme}
          onOpenBooking={handleOpenBooking}
        />

        {/* Rider Rewards & Referral Card */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div data-reveal="">
            <ReferralCard lang={lang} theme={theme} />
          </div>
        </div>

        {/* Before & After Comparison & Workshop Gallery */}
        <BeforeAfterGallery lang={lang} theme={theme} data={galleryData} />

        {/* Real-time Workshop Community & Social Feed */}
        <SocialProofFeed lang={lang} theme={theme} siteImages={galleryData?.siteImages} />

        {/* Riding Tips & Maintenance Guides (Local SEO Blog Section) */}
        <div data-reveal="">
          <BlogSection
            lang={lang}
            theme={theme}
            onOpenBooking={handleOpenBooking}
          />
        </div>

        {/* Customer Reviews & Write-A-Review Form */}
        <ReviewsSection lang={lang} theme={theme} />

        {/* About Shop & Master Mechanic Naresh */}
        <AboutTeam lang={lang} theme={theme} siteImages={galleryData?.siteImages} />

        {/* FAQ Accordion */}
        <FaqAccordion lang={lang} theme={theme} />

        {/* Contact, Hours Table, Booking Form with Date/Time slot picker, & Embedded Google Map */}
        <ContactLocation preselectedService={selectedServiceForModal} lang={lang} theme={theme} />
      </main>

      {/* Footer with legal links & bilingual copyright */}
      <Footer
        lang={lang}
        theme={theme}
        onOpenLegal={(type) => setLegalModalType(type)}
      />

      {/* Persistent Mobile Sticky Call & WhatsApp Bar */}
      <MobileStickyBar lang={lang} theme={theme} />

      {/* Floating WhatsApp Action for Desktop with Copy Number & QR Code */}
      <FloatingWhatsApp lang={lang} theme={theme} />

      {/* Floating Naresh AI Assistant Widget */}
      <AfterHoursChatbot lang={lang} theme={theme} />

      {/* Global Booking Modal with Date + Slot Picker */}
      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={handleCloseBooking}
        bookingDetails={{
          customerName: 'Customer',
          phone: '',
          serviceType: selectedServiceForModal || 'General Servicing',
          date: new Date().toISOString().split('T')[0],
          timeSlot: '09:00 AM'
        }}
        onPaymentSuccess={() => handleCloseBooking()}
        lang={lang}
        theme={theme}
        siteImages={galleryData?.siteImages}
      />

      {/* Direct Payment Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        lang={lang}
        theme={theme}
        siteImages={galleryData?.siteImages}
      />

      {/* Legal & Trust Modals (Privacy Policy, Terms of Service, Cookie Notice) */}
      <LegalModal
        type={legalModalType}
        onClose={() => setLegalModalType(null)}
        lang={lang}
        theme={theme}
      />

      {/* Cookie Consent Banner */}
      <CookieConsent
        lang={lang}
        theme={theme}
        onOpenPrivacy={() => setLegalModalType('privacy')}
      />
    </div>
  );
}
