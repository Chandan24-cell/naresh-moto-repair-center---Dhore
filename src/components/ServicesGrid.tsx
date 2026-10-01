import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { 
  Wrench, Activity, Disc, Zap, ShieldAlert, CalendarCheck, 
  PackageCheck, PhoneCall, Sparkles, Filter, ChevronRight, Check, Clock, X
} from 'lucide-react';
import { EXPANDED_SERVICES, ServiceItem, type CatalogService } from '../data/siteData';
import { Language, TRANSLATIONS } from '../data/translations';
import type { Theme } from '../App';
import ScrollReveal from './ui/ScrollReveal';
import LuxuryCard from './ui/LuxuryCard';

interface ServicesGridProps {
  lang?: Language;
  theme?: Theme;
  onOpenBooking: (serviceName?: string) => void;
  siteImages?: Record<string, string>;
}

const workshopServicePhotos: Record<string, string> = {
  '01-general-servicing': '/images/workshop/live-feed-02.jpg',
  '02-engine-starting': '/images/workshop/gallery-01.jpg',
  '03-brakes-tyres': '/images/workshop/gallery-06.jpg',
  '04-electrical-work': '/images/workshop/gallery-16.jpg'
};

// Keep bundled services visible until the public catalog has loaded.
export default function ServicesGrid({ lang = 'en', theme = 'dark', onOpenBooking, siteImages }: ServicesGridProps) {
  const prefersReducedMotion = useReducedMotion();
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  const [catalog, setCatalog] = useState<CatalogService[]>([]);
  const [catalogLoaded, setCatalogLoaded] = useState(false);
  useEffect(() => {
    let active = true;
    fetch('/api/public/data').then((response) => response.ok ? response.json() : null).then((data) => {
      if (active && Array.isArray(data?.services)) { setCatalog(data.services); setCatalogLoaded(true); }
    }).catch(() => undefined);
    return () => { active = false; };
  }, []);

  const t = TRANSLATIONS[lang].services;
  const servicesDict = TRANSLATIONS[lang].servicesData as Record<string, any>;
  const isDark = theme === 'dark';

  const catalogItems: ServiceItem[] = catalog.map((item, index) => ({
    id: item.id, number: String(index + 1).padStart(2, '0'), title: item.nameEn,
    description: item.descriptionEn, category: item.category.toLowerCase().includes('engine') ? 'engine' : item.category.toLowerCase().includes('brake') || item.category.toLowerCase().includes('tyre') ? 'safety' : item.category.toLowerCase().includes('elect') ? 'electrical' : 'routine',
    icon: 'Wrench', image: siteImages?.[item.id] || workshopServicePhotos[item.id] || item.photo || '', estimatedTime: '', estimatedPrice: `NPR ${item.price}`, highlights: []
  }));
  const publicServices = catalogLoaded ? catalogItems : EXPANDED_SERVICES;
  const filterTabs = [
    { id: 'all', label: t.tabs.all },
    { id: 'routine', label: t.tabs.routine },
    { id: 'engine', label: t.tabs.engine },
    { id: 'safety', label: t.tabs.safety },
    { id: 'specialty', label: t.tabs.specialty }
  ];

  const categories = Array.from(new Set(catalog.map((service) => service.category)));
  const filteredServices = publicServices.filter(service => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'safety') return service.category === 'safety' || service.id.includes('suspension');
    if (selectedFilter === 'specialty') return service.category === 'specialty' || service.category === 'electrical';
    if (categories.includes(selectedFilter)) return catalog.find((item) => item.id === service.id)?.category === selectedFilter;
    return service.category === selectedFilter;
  });
  const allTabs = [...filterTabs, ...categories.filter((category) => !filterTabs.some((tab) => tab.id.toLowerCase() === category.toLowerCase())).map((category) => ({ id: category, label: category }))];

  return (
    <section id="services" className={`py-20 fixed-ui-safe-section border-t transition-colors duration-200 relative ${
      isDark ? 'bg-[#0c0e12] border-white/5 text-white' : 'bg-[#f7f8fa] border-black/8 text-neutral-900'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <ScrollReveal direction="up" delay={0} className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="text-xs font-mono font-bold tracking-widest text-accent-text uppercase mb-2">
              {t.kicker}
            </div>
            <h2 className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${
              isDark ? 'text-white' : 'text-neutral-900'
            }`}>
              {t.headline}
            </h2>
            <p className={`text-sm sm:text-base mt-2 max-w-2xl ${
              isDark ? 'theme-text-muted' : 'text-neutral-600'
            }`}>
              {t.subhead}
            </p>
          </div>

          {/* Filter segment tabs */}
          <div className={`flex items-center gap-1.5 p-1 border rounded-xl overflow-x-auto max-w-full ${
            isDark ? 'bg-neutral-900 border-white/10' : 'bg-white border-black/10 shadow-sm'
          }`}>
            {allTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedFilter(tab.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                  selectedFilter === tab.id
                    ? 'bg-accent text-white shadow-sm shadow-[#ff3b19]/30 font-bold'
                    : isDark
                      ? 'theme-text-muted hover:text-white hover:bg-white/5'
                      : 'text-neutral-600 hover:text-neutral-900 hover:bg-black/5'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </ScrollReveal>

        {/* Services Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.12 }}
          variants={{ hidden: {}, visible: { transition: { staggerChildren: prefersReducedMotion ? 0 : 0.15 } } }}
        >
          {filteredServices.map((service, index) => {
            const localized = servicesDict?.[service.id] || {};
            const catalogItem = catalog.find((item) => item.id === service.id);
            const serviceTitle = catalogItem ? (lang === 'np' ? catalogItem.nameNp : catalogItem.nameEn) : localized.title || service.title;
            const serviceDesc = catalogItem ? (lang === 'np' ? catalogItem.descriptionNp : catalogItem.descriptionEn) : localized.description || service.description;
            const serviceHighlights = localized.highlights || service.highlights;
            const servicePrice = localized.estimatedPrice || service.estimatedPrice;
            const serviceTime = localized.estimatedTime || service.estimatedTime;

            return (
              <ScrollReveal key={service.id} direction="up" delay={prefersReducedMotion ? 0 : index * 0.1}>
                <LuxuryCard
                className={`p-6 flex flex-col justify-between group ${
                  isDark
                    ? 'bg-[#12151f] border-white/10 text-white'
                    : 'bg-white border-black/10 text-neutral-950'
                }`}
              >
                <div>
                  <div className="mb-4 flex h-36 items-center justify-center overflow-hidden rounded-xl bg-[var(--bg-surface-2)]">{service.image ? <img src={service.image} alt="" className="ui-image-zoom h-full w-full object-cover" loading="lazy" decoding="async" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = '/icon.svg'; event.currentTarget.className = 'h-9 w-9 opacity-60'; }} /> : <Wrench className="h-8 w-8 text-[var(--text-muted)]" />}</div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-xs font-mono font-bold text-accent-text">
                      {service.number}
                    </span>
                    <span className={`text-xs font-mono font-mono-numbers px-2 py-0.5 rounded border ${
                      isDark
                        ? 'theme-text-muted bg-white/5 border-white/5'
                        : 'text-neutral-600 bg-neutral-100 border-black/5'
                    }`}>
                      {catalogItem ? `NPR ${catalogItem.price}` : servicePrice}
                    </span>
                  </div>

                  <h3 className={`text-base font-bold mb-2 group-hover:text-accent-text transition-colors ${
                    isDark ? 'text-white' : 'text-neutral-900'
                  }`}>
                    {serviceTitle}
                  </h3>

                  <p className={`text-xs sm:text-sm mb-4 leading-relaxed ${
                    isDark ? 'text-neutral-300' : 'text-neutral-600'
                  }`}>
                    {serviceDesc}
                  </p>

                  <div className={`pt-3 border-t space-y-1.5 mb-6 ${
                    isDark ? 'border-white/5' : 'border-black/5'
                  }`}>
                    {serviceHighlights.map((h: string, i: number) => (
                      <div key={i} className={`flex items-center gap-2 text-xs ${
                        isDark ? 'text-neutral-300' : 'text-neutral-600'
                      }`}>
                        <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>{h}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={`flex items-center gap-2 pt-3 border-t ${
                  isDark ? 'border-white/10' : 'border-black/8'
                }`}>
                  <button
                    onClick={() => onOpenBooking(serviceTitle)}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all text-center cursor-pointer ${
                      isDark
                        ? 'bg-accent/15 hover:bg-accent text-[#ff4b2b] hover:text-white'
                        : 'bg-accent/10 hover:bg-accent-hover text-accent-text hover:text-white'
                    }`}
                  >
                    {t.bookBtn}
                  </button>
                  <button
                    onClick={() => setSelectedService(service)}
                    className={`py-2 px-3 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      isDark
                        ? 'bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white'
                        : 'bg-black/5 hover:bg-black/10 text-neutral-700 hover:text-neutral-900'
                    }`}
                    title="View details"
                  >
                    {t.detailsBtn}
                  </button>
                </div>
                </LuxuryCard>
              </ScrollReveal>
            );
          })}
        </motion.div>
        {catalogLoaded && filteredServices.length === 0 && <p className="py-10 text-center text-sm text-[var(--text-muted)]">{lang === 'np' ? 'यस वर्गमा हाल कुनै सेवा उपलब्ध छैन।' : 'No active services in this category right now.'}</p>}

        {/* Service Details Modal */}
        {selectedService && (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
            onClick={() => setSelectedService(null)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className={`relative w-full max-w-lg rounded-2xl border p-6 sm:p-7 shadow-2xl ${
                isDark ? 'bg-[#151926] border-white/15 text-white' : 'bg-white border-black/10 text-neutral-900 shadow-xl'
              }`}
            >
              <button
                onClick={() => setSelectedService(null)}
                className={`absolute top-4 right-4 p-1.5 rounded-lg cursor-pointer ${
                  isDark ? 'theme-text-muted hover:text-white hover:bg-white/10' : 'theme-text-muted hover:text-neutral-900 hover:bg-black/5'
                }`}
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-mono font-bold text-accent-text">
                  {selectedService.number}
                </span>
                <span className="text-xs font-mono theme-text-muted">
                  {servicesDict?.[selectedService.id]?.estimatedPrice || selectedService.estimatedPrice}
                </span>
              </div>

              <h3 className="text-xl font-bold mb-3">
                {servicesDict?.[selectedService.id]?.title || selectedService.title}
              </h3>

              <p className={`text-xs sm:text-sm leading-relaxed mb-5 ${
                isDark ? 'text-neutral-300' : 'text-neutral-600'
              }`}>
                {servicesDict?.[selectedService.id]?.description || selectedService.description}
              </p>

              <div className={`p-4 rounded-xl border mb-6 ${
                isDark ? 'bg-black/30 border-white/10' : 'bg-neutral-50 border-black/10'
              }`}>
                <div className="text-xs font-bold uppercase tracking-wider text-accent-text mb-3">
                  {lang === 'np' ? 'सेवामा समावेश कार्यहरू:' : 'Checklist & Scope:'}
                </div>
                <div className="space-y-2">
                  {(servicesDict?.[selectedService.id]?.highlights || selectedService.highlights).map((h: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-xs">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => {
                  const sTitle = servicesDict?.[selectedService.id]?.title || selectedService.title;
                  setSelectedService(null);
                  onOpenBooking(sTitle);
                }}
                className="w-full py-3 px-4 rounded-xl bg-accent hover:bg-accent-hover text-white font-bold text-xs shadow-md shadow-[#ff3b19]/30 transition-all cursor-pointer"
              >
                {t.bookBtn} ({servicesDict?.[selectedService.id]?.title || selectedService.title})
              </button>
            </div>
          </div>
        )}

      </div>
    </section>
  );
}
