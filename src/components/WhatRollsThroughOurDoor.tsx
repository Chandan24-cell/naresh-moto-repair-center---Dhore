import { useState } from 'react';
import { Wrench, Activity, Disc, Zap, ArrowRight, Check, Clock, Calendar } from 'lucide-react';
import { WHAT_ROLLS_THROUGH_OUR_DOOR, ServiceItem } from '../data/siteData';
import { Language, TRANSLATIONS } from '../data/translations';
import type { Theme } from '../App';

interface WhatRollsProps {
  lang?: Language;
  theme?: Theme;
  onOpenBooking: (serviceName?: string) => void;
  siteImages?: Record<string, string>;
}

// These numbered cards give a quick service overview before the full catalog.
export default function WhatRollsThroughOurDoor({ lang = 'en', theme = 'dark', onOpenBooking, siteImages }: WhatRollsProps) {
  const [activeCard, setActiveCard] = useState<string | null>(null);

  const t = TRANSLATIONS[lang].whatRolls;
  const servicesDict = TRANSLATIONS[lang].servicesData as Record<string, any>;
  const isDark = theme === 'dark';

  // Service records store icon names as strings, so resolve them to Lucide components here.
  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'Wrench':
        return <Wrench className="service-icon-motion service-icon-wrench w-5 h-5 text-accent-text group-hover:text-white transition-colors" />;
      case 'Activity':
        return <Activity className="service-icon-motion w-5 h-5 text-accent-text group-hover:text-white transition-colors" />;
      case 'Disc':
        return <Disc className="service-icon-motion service-icon-gear w-5 h-5 text-accent-text group-hover:text-white transition-colors" />;
      case 'Zap':
        return <Zap className="service-icon-motion w-5 h-5 text-accent-text group-hover:text-white transition-colors" />;
      default:
        return <Wrench className="service-icon-motion service-icon-wrench w-5 h-5 text-accent-text group-hover:text-white transition-colors" />;
    }
  };

  return (
    <section id="what-rolls-in" className={`py-20 border-y transition-colors duration-200 relative overflow-hidden ${
      isDark ? 'bg-[#0d0f15] border-white/5 text-white' : 'bg-white border-black/8 text-neutral-900'
    }`}>
      {/* Background ambient lighting */}
      <div className={`absolute top-0 right-1/4 w-80 h-80 rounded-full blur-3xl pointer-events-none ${
        isDark ? 'bg-accent/5' : 'bg-accent/5'
      }`} />
      <div className={`absolute bottom-0 left-10 w-96 h-96 rounded-full blur-3xl pointer-events-none ${
        isDark ? 'bg-amber-500/5' : 'bg-amber-500/5'
      }`} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Editorial Header */}
        <div className="max-w-3xl mb-14">
          <div className="text-xs sm:text-sm font-extrabold tracking-widest text-accent-text uppercase mb-3 flex items-center gap-2">
            <span className="w-6 h-0.5 bg-accent" />
            <span>{t.kicker}</span>
          </div>

          <h2 className={`text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight uppercase leading-tight mb-4 ${
            isDark ? 'text-white' : 'text-neutral-900'
          }`}>
            {t.headline}
          </h2>

          <p className={`text-base sm:text-lg leading-relaxed ${
            isDark ? 'text-neutral-300' : 'text-neutral-600'
          }`}>
            {t.subhead}
          </p>
        </div>

        {/* 4-column numbered cards */}
        <div data-reveal data-reveal-stagger className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {WHAT_ROLLS_THROUGH_OUR_DOOR.map((item: ServiceItem) => {
            const localized = servicesDict?.[item.id] || {};
            const itemTitle = localized.title || item.title;
            const itemDesc = localized.description || item.description;
            const itemHighlights = localized.highlights || item.highlights;
            const itemPrice = localized.estimatedPrice || item.estimatedPrice;
            const itemTime = localized.estimatedTime || item.estimatedTime;

            return (
              <div
                key={item.id}
                onMouseEnter={() => setActiveCard(item.id)}
                onMouseLeave={() => setActiveCard(null)}
                className={`group relative flex flex-col justify-between rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1.5 overflow-hidden ${
                  isDark
                    ? 'bg-[#141722]/90 border border-white/10 hover:border-[#ff3b19]/60 hover:shadow-2xl hover:shadow-[#ff3b19]/15'
                    : 'bg-[#fcfdfe] border border-black/8 hover:border-[#e8340f]/40 hover:shadow-xl hover:shadow-black/5 shadow-sm'
                }`}
              >
                {/* Visual Image Preview at card top */}
                <div className={`relative h-44 -mx-6 -mt-6 mb-5 overflow-hidden rounded-t-2xl ${
                  isDark ? 'bg-neutral-900' : 'bg-neutral-100'
                }`}>
                  <img
                    src={siteImages?.[item.id] || item.image}
                    alt={itemTitle}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                  />
                  <div className={`absolute inset-0 bg-gradient-to-t ${
                    isDark ? 'from-[#141722] via-[#141722]/30 to-transparent' : 'from-[#fcfdfe] via-[#fcfdfe]/20 to-transparent'
                  }`} />
                  
                  {/* Floating Icon badge */}
                  <div className="absolute top-3 left-3 w-10 h-10 rounded-xl bg-black/80 backdrop-blur-md border border-white/10 flex items-center justify-center group-hover:bg-accent transition-colors">
                    {renderIcon(item.icon)}
                  </div>

                  {/* Estimated time tag */}
                  <div className="absolute bottom-3 left-3 text-[11px] font-semibold text-neutral-200 bg-black/65 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/10 flex items-center gap-1.5 font-mono-numbers">
                    <Clock className="w-3 h-3 text-accent-text" />
                    <span>{itemTime}</span>
                  </div>
                </div>

                {/* Oversized Number in Background / Top-Right */}
                <div className={`absolute top-3 right-4 font-display font-extrabold text-5xl select-none font-mono-numbers pointer-events-none ${
                  isDark ? 'text-white/5 group-hover:text-accent-text/15' : 'text-black/5 group-hover:text-accent-text/15'
                }`}>
                  {item.number}
                </div>

                {/* Card Content */}
                <div className="relative z-10 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2 text-xs font-mono font-bold text-accent-text">
                      <span>{item.number}</span>
                      <span className={isDark ? 'text-neutral-600' : 'theme-text-muted'}>/</span>
                      <span className={`font-mono-numbers ${isDark ? 'theme-text-muted' : 'theme-text-muted'}`}>
                        {itemPrice}
                      </span>
                    </div>

                    <h3 className={`text-base font-bold tracking-wide uppercase mb-2 group-hover:text-accent-text transition-colors ${
                      isDark ? 'text-white' : 'text-neutral-900'
                    }`}>
                      {itemTitle}
                    </h3>

                    <p className={`text-xs sm:text-sm leading-relaxed mb-4 ${
                      isDark ? 'text-neutral-300' : 'text-neutral-600'
                    }`}>
                      {itemDesc}
                    </p>
                  </div>

                  {/* Highlights checklist */}
                  <div className={`pt-3 border-t mb-4 ${isDark ? 'border-white/10' : 'border-black/8'}`}>
                    <ul className={`space-y-1.5 text-xs ${isDark ? 'text-neutral-300' : 'text-neutral-600'}`}>
                      {itemHighlights.slice(0, 3).map((h: string, i: number) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Action Link */}
                  <button
                    onClick={() => onOpenBooking(itemTitle)}
                    className={`w-full mt-auto py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      isDark
                        ? 'bg-white/5 group-hover:bg-accent text-neutral-200 group-hover:text-white'
                        : 'bg-black/5 group-hover:bg-accent-hover text-neutral-700 group-hover:text-white'
                    }`}
                  >
                    <span>{lang === 'np' ? 'सर्भिस बुक गर्नुहोस्' : `Book ${item.title}`}</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bold Editorial Callout / CTA Strip */}
        <div className={`rounded-2xl border p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl ${
          isDark
            ? 'bg-gradient-to-r from-neutral-900 via-[#191e2b] to-neutral-900 border-white/15 text-white shadow-black/50'
            : 'bg-gradient-to-r from-white via-[#fff7f5] to-white border-black/10 text-neutral-900 shadow-sm'
        }`}>
          <div className="max-w-2xl text-center md:text-left">
            <span className="text-xs font-mono font-bold tracking-wider text-accent-text uppercase block mb-1">
              {t.calloutKicker}
            </span>
            <div className={`text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight uppercase ${
              isDark ? 'text-white' : 'text-neutral-900'
            }`}>
              {t.calloutHeadline}
            </div>
            <p className={`text-xs sm:text-sm mt-1 ${
              isDark ? 'text-neutral-300' : 'text-neutral-600'
            }`}>
              {t.calloutSub}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto justify-center">
            <button
              onClick={() => onOpenBooking()}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-accent hover:bg-accent-hover text-white font-bold text-sm tracking-wide shadow-lg shadow-[#ff3b19]/30 hover:shadow-[#ff3b19]/50 transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              <span>{t.bookButton}</span>
            </button>
          </div>
        </div>

      </div>
    </section>
  );
}
