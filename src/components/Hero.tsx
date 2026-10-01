import { useState, useEffect } from 'react';
import { Phone, MapPin, Calendar, Star } from 'lucide-react';
import { BUSINESS_INFO } from '../data/siteData';
import { Language, TRANSLATIONS } from '../data/translations';
import type { Theme } from '../App';
import { useBusinessHours } from '../hooks/useBusinessHours';
import LiveQueueWidget from './LiveQueueWidget';
const bikeWorkshopHero = '/images/services/engine.jpg';

interface HeroProps {
  lang?: Language;
  theme?: Theme;
  onOpenBooking: () => void;
}

export default function Hero({ lang = 'en', theme = 'dark', onOpenBooking }: HeroProps) {
  const { isOpenNow, hoursText, overrideActive } = useBusinessHours();
  const [animatedBikes, setAnimatedBikes] = useState(4800);
  const [animatedYears, setAnimatedYears] = useState(0);

  const t = TRANSLATIONS[lang].hero;
  const navT = TRANSLATIONS[lang].nav;
  const isDark = theme === 'dark';

  useEffect(() => {
    // Respect reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setAnimatedBikes(5200);
      setAnimatedYears(12);
      return;
    }

    // Number ticker animation
    const duration = 1200;
    let startTime = performance.now();
    let rafId = 0;
    let pausedAt = 0;
    const frame = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      setAnimatedBikes(Math.floor(4800 + (5200 - 4800) * easeProgress));
      setAnimatedYears(Math.floor(12 * easeProgress));
      if (progress < 1) {
        rafId = requestAnimationFrame(frame);
      }
    };
    const onShowcaseVisibility = (event: Event) => {
      if ((event as CustomEvent<boolean>).detail) {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = 0;
        pausedAt = performance.now();
      } else if (pausedAt) {
        startTime += performance.now() - pausedAt;
        pausedAt = 0;
        rafId = requestAnimationFrame(frame);
      }
    };
    window.addEventListener('bike-showcase-visibility', onShowcaseVisibility);
    if (!(window as any).__bikeShowcaseVisible) rafId = requestAnimationFrame(frame);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('bike-showcase-visibility', onShowcaseVisibility);
    };
  }, []);

  return (
    <section id="home" className={`relative pt-6 pb-16 md:pt-12 md:pb-24 overflow-hidden garage-grid-pattern ${
      isDark ? 'bg-transparent text-white' : 'bg-[#f7f8fa] text-neutral-900'
    }`}>
      {/* Glow gradient ambient spots */}
      <div className={`absolute top-10 left-1/4 w-96 h-96 rounded-full blur-3xl pointer-events-none -z-10 ${
        isDark ? 'bg-accent/10' : 'bg-accent/5'
      }`} />
      <div className={`absolute top-1/2 right-10 w-80 h-80 rounded-full blur-3xl pointer-events-none -z-10 ${
        isDark ? 'bg-amber-500/8' : 'bg-amber-500/5'
      }`} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Trust & Location Context Strip */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-6 text-xs">
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${
            isDark
              ? 'bg-white/5 border-white/10 text-neutral-300'
              : 'bg-white border-black/10 text-neutral-700 shadow-sm'
          }`}>
            <span className={`w-2 h-2 rounded-full ${isOpenNow ? 'bg-emerald-400 animate-live-green' : 'bg-amber-400'}`} />
            <span className={`font-semibold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
              {isOpenNow ? navT.openNow : navT.closed}
            </span>
            <span className="theme-text-muted">·</span>
            <span>{hoursText}{overrideActive ? '' : ' (Every Day)'}</span>
          </div>

          <div className={`hidden sm:inline-flex items-center gap-1.5 ${isDark ? 'text-neutral-300' : 'text-neutral-600'}`}>
            <MapPin className="w-3.5 h-3.5 text-accent-text" />
            <span>Dhore pakahamainpur - 1, Dhore, Nepal</span>
          </div>

          <div className="inline-flex items-center gap-1.5 text-amber-500">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-3.5 h-3.5 ${i < 4 ? 'fill-amber-400 text-amber-400' : 'fill-amber-400/50 text-amber-400'}`}
                />
              ))}
            </div>
            <span className={`font-bold font-mono-numbers ${isDark ? 'text-white' : 'text-neutral-900'}`}>4.5</span>
            <span className={isDark ? 'theme-text-muted' : 'theme-text-muted'}>{t.reviewsCount}</span>
          </div>
        </div>

        {/* Main Grid: Headline & Action on Left, Visual Carrier on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          <div className="lg:col-span-7 flex flex-col justify-center">
            
            <h1 className={`text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.08] mb-5 ${
              isDark ? 'text-white' : 'text-neutral-900'
            }`}>
              Naresh MOTO &amp; Repair Center
            </h1>

            <p className={`text-base sm:text-lg max-w-2xl leading-relaxed mb-6 ${
              isDark ? 'text-neutral-300' : 'text-neutral-600'
            }`}>
              {t.subtitle}
            </p>

            {/* Live Queue / Wait-Time Indicator */}
            <div className="mb-8">
              <LiveQueueWidget
                lang={lang}
                theme={theme}
                onOpenBooking={onOpenBooking}
              />
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-10">
              <a
                href={`tel:${BUSINESS_INFO.phoneRaw}`}
                className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-accent text-white font-bold text-sm tracking-wide shadow-lg shadow-[#ff3b19]/30 hover:bg-accent-hover hover:shadow-[#ff3b19]/50 transition-all active:scale-95 group cursor-pointer"
                aria-label={`Call ${BUSINESS_INFO.phone}`}
              >
                <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center animate-call-pulse">
                  <Phone className="w-3.5 h-3.5" />
                </span>
                <span>{t.callCta}</span>
              </a>

              <a
                href={BUSINESS_INFO.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl font-semibold text-sm transition-all cursor-pointer border ${
                  isDark
                    ? 'bg-neutral-900 border-white/15 text-white hover:border-[#ff3b19]/50 hover:bg-neutral-800'
                    : 'bg-white border-black/15 text-neutral-800 hover:border-[#e8340f]/50 hover:bg-neutral-50 shadow-sm'
                }`}
              >
                <MapPin className="w-4 h-4 text-accent-text" />
                <span>{t.directionsCta}</span>
              </a>

              <button
                onClick={onOpenBooking}
                className={`inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl font-semibold text-sm transition-all cursor-pointer border ${
                  isDark
                    ? 'bg-white/10 hover:bg-white/15 text-neutral-100 border-white/10'
                    : 'bg-black/5 hover:bg-black/10 text-neutral-800 border-black/10'
                }`}
              >
                <Calendar className="w-4 h-4 text-amber-500" />
                <span>{t.bookSlotCta}</span>
              </button>
            </div>

            {/* Live Stats Row */}
            <div className={`grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t ${
              isDark ? 'border-white/10' : 'border-black/10'
            }`}>
              <div>
                <div className={`text-2xl sm:text-3xl font-extrabold font-mono-numbers ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                  {animatedBikes}+
                </div>
                <div className={`text-xs ${isDark ? 'theme-text-muted' : 'theme-text-muted'}`}>
                  {t.statBikes}
                </div>
              </div>

              <div>
                <div className={`text-2xl sm:text-3xl font-extrabold font-mono-numbers ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                  {animatedYears}+ Yrs
                </div>
                <div className={`text-xs ${isDark ? 'theme-text-muted' : 'theme-text-muted'}`}>
                  {t.statYears}
                </div>
              </div>

              <div>
                <div className="text-2xl sm:text-3xl font-extrabold font-mono-numbers text-amber-500">
                  4.5 ★
                </div>
                <div className={`text-xs ${isDark ? 'theme-text-muted' : 'theme-text-muted'}`}>
                  {t.statRating}
                </div>
              </div>

              <div>
                <div className="text-2xl sm:text-3xl font-extrabold font-mono-numbers text-emerald-500">
                  100%
                </div>
                <div className={`text-xs ${isDark ? 'theme-text-muted' : 'theme-text-muted'}`}>
                  {t.statParts}
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Workshop Craftsmanship Visual */}
          <div className="lg:col-span-5 relative">
            <div className={`relative rounded-3xl overflow-hidden border shadow-2xl ${
              isDark ? 'border-white/10 bg-neutral-900' : 'border-black/10 bg-neutral-100 shadow-md'
            }`}>
              <img
                src={bikeWorkshopHero}
                alt="Naresh Moto master mechanic precision engine work"
                className="w-full h-80 sm:h-96 object-cover"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
              <div className="absolute bottom-5 left-5 right-5 p-4 rounded-2xl bg-black/75 backdrop-blur-md border border-white/10 text-white">
                <div className="text-xs font-mono font-bold text-accent-text uppercase">
                  {lang === 'np' ? 'परिश्रमको कला' : 'The Craft'}
                </div>
                <div className="text-sm font-bold mt-1">
                  {lang === 'np'
                    ? 'सधैं सक्कली पार्ट्स, प्रेसिशन ट्युनिङ।'
                    : 'Precision engine diagnostics, every time.'}
                </div>
              </div>
            </div>

            {/* Brand Badges Bar */}
            <div className={`mt-4 p-3 rounded-2xl border flex flex-wrap items-center justify-between gap-2 text-[11px] ${
              isDark ? 'bg-white/5 border-white/10 theme-text-muted' : 'bg-white border-black/10 text-neutral-600 shadow-sm'
            }`}>
              <span className="font-bold text-accent-text uppercase">{lang === 'en' ? 'We Service:' : 'हामी सर्भिस गर्छौं:'}</span>
              <span>Hero</span>
              <span>·</span>
              <span>Bajaj</span>
              <span>·</span>
              <span>Honda</span>
              <span>·</span>
              <span>TVS</span>
              <span>·</span>
              <span>Yamaha</span>
              <span>·</span>
              <span>Royal Enfield</span>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
