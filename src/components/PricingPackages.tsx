import { useEffect, useState } from 'react';
import { Check, Star, Zap, Clock } from 'lucide-react';
import { PRICING_TIERS, PricingTier } from '../data/siteData';
import { Language, TRANSLATIONS } from '../data/translations';
import type { Theme } from '../App';

interface PricingPackagesProps {
  lang?: Language;
  theme?: Theme;
  onOpenBooking: (serviceName?: string) => void;
}

// Bundled tiers remain available while optional public pricing overrides load.
export default function PricingPackages({ lang = 'en', theme = 'dark', onOpenBooking }: PricingPackagesProps) {
  const t = TRANSLATIONS[lang].pricing;
  const tiersDict = TRANSLATIONS[lang].pricingTiers as Record<string, any>;
  const isDark = theme === 'dark';
  const [pricingOverrides, setPricingOverrides] = useState<Record<string, {
    priceNPR?: number;
    nameEn?: string;
    nameNp?: string;
    descriptionEn?: string;
    descriptionNp?: string;
    popular?: boolean;
    active?: boolean;
  }>>({});

  useEffect(() => {
    let active = true;
    const loadPricing = () => fetch('/api/public/data')
      .then((res) => res.ok ? res.json() : null)
      .then((data) => { if (active && data?.pricingOverrides) setPricingOverrides(data.pricingOverrides); })
      .catch(() => undefined);
    loadPricing();
    const refreshId = window.setInterval(loadPricing, 30000);
    return () => { active = false; window.clearInterval(refreshId); };
  }, []);

  return (
    <section id="pricing" className={`py-20 border-t transition-colors duration-200 relative ${
      isDark ? 'bg-[#0d1017] border-white/5 text-white' : 'bg-white border-black/8 text-neutral-900'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="text-xs font-mono font-bold tracking-widest text-accent-text uppercase mb-2">
            {t.kicker}
          </div>
          <h2 className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${
            isDark ? 'text-white' : 'text-neutral-900'
          }`}>
            {t.headline}
          </h2>
          <p className="text-sm sm:text-base mt-2 theme-text-muted">
            {t.subhead}
          </p>
        </div>

        {/* Pricing Cards */}
        <div data-reveal data-reveal-stagger className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {PRICING_TIERS.filter((tier) => pricingOverrides[tier.id]?.active !== false).map((tier: PricingTier) => {
            const override = pricingOverrides[tier.id] || {};
            const isPopular = override.popular ?? tier.popular;
            const localized = tiersDict?.[tier.id] || {};
            const tierName = (lang === 'np' ? override.nameNp : override.nameEn) || localized.name || tier.name;
            const tierTagline = (lang === 'np' ? override.descriptionNp : override.descriptionEn) || localized.tagline || tier.tagline;
            const tierDuration = localized.duration || tier.duration;
            const tierFeatures = localized.features || tier.features;

            return (
              <div
                key={tier.id}
                className={`relative rounded-2xl flex flex-col justify-between p-7 transition-all ${isPopular ? '' : 'ui-motion-card'} ${
                  isPopular
                    ? isDark
                      ? 'bg-[#151926] border-2 border-[#ff3b19] shadow-2xl shadow-[#ff3b19]/15 lg:-translate-y-2'
                      : 'bg-[#fffbfb] border-2 border-[#e8340f] shadow-xl shadow-[#e8340f]/10 lg:-translate-y-2'
                    : isDark
                      ? 'bg-[#12141c] border border-white/10 hover:border-white/20'
                      : 'bg-neutral-50/70 border border-black/8 hover:border-black/15 shadow-sm'
                }`}
              >
                {/* Popular label */}
                {isPopular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-accent text-white text-[11px] font-extrabold tracking-wider uppercase shadow-md shadow-[#ff3b19]/40 flex items-center gap-1">
                    <Star className="w-3 h-3 fill-white" />
                    <span>{t.mostPopular}</span>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                      {tierName}
                    </h3>
                    <span className={`text-xs font-mono-numbers flex items-center gap-1 ${
                      isDark ? 'theme-text-muted' : 'theme-text-muted'
                    }`}>
                      <Clock className="w-3 h-3 text-accent-text" />
                      <span>{tierDuration}</span>
                    </span>
                  </div>

                  <p className={`text-xs min-h-[32px] mb-5 ${
                    isDark ? 'text-neutral-300' : 'text-neutral-600'
                  }`}>
                    {tierTagline}
                  </p>

                  {/* Price */}
                  <div className={`pb-6 border-b mb-6 flex items-baseline gap-1 ${
                    isDark ? 'border-white/10' : 'border-black/10'
                  }`}>
                    <span className={`text-sm font-semibold ${isDark ? 'theme-text-muted' : 'theme-text-muted'}`}>
                      NPR
                    </span>
                    <span className={`text-4xl font-extrabold font-mono-numbers ${
                      isDark ? 'text-white' : 'text-neutral-900'
                    }`}>
                      रु {(override.priceNPR ?? tier.priceNPR).toLocaleString()}
                    </span>
                    <span className={`text-xs ml-1 ${isDark ? 'theme-text-muted' : 'theme-text-muted'}`}>
                      {lang === 'np' ? '+ पार्ट्स MRP अनुसार' : '+ parts at MRP'}
                    </span>
                  </div>

                  {/* Features list */}
                  <div className="space-y-3 mb-8">
                    <div className={`text-xs font-semibold uppercase tracking-wider ${
                      isDark ? 'text-neutral-300' : 'text-neutral-700'
                    }`}>
                      {t.includedTitle}
                    </div>
                    {tierFeatures.map((feature: string, idx: number) => (
                      <div key={idx} className={`flex items-start gap-2.5 text-xs ${
                        isDark ? 'text-neutral-200' : 'text-neutral-700'
                      }`}>
                        <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => onOpenBooking(tierName)}
                  className={`w-full py-3 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isPopular
                      ? 'bg-accent hover:bg-accent-hover text-white shadow-lg shadow-[#ff3b19]/30 hover:shadow-[#ff3b19]/50'
                      : isDark
                        ? 'bg-white/10 hover:bg-white/20 text-white'
                        : 'bg-black/5 hover:bg-black/10 text-neutral-800'
                  }`}
                >
                  {t.selectPkg} ({tierName})
                </button>
              </div>
            );
          })}
        </div>

        {/* Small note */}
        <div className={`mt-8 text-center text-xs ${isDark ? 'theme-text-muted' : 'theme-text-muted'}`}>
          {t.note}
        </div>

      </div>
    </section>
  );
}
