import { Phone, MessageCircle, MapPin } from 'lucide-react';
import { BUSINESS_INFO } from '../data/siteData';
import { Language, TRANSLATIONS } from '../data/translations';
import type { Theme } from '../App';

interface MobileStickyBarProps {
  lang?: Language;
  theme?: Theme;
}

// Keep the main contact actions reachable on small screens while the page scrolls.
export default function MobileStickyBar({ lang = 'en', theme = 'dark' }: MobileStickyBarProps) {
  const isDark = theme === 'dark';
  const navT = TRANSLATIONS[lang].nav;

  return (
    <div className={`fixed bottom-0 inset-x-0 z-fab lg:hidden border-t px-3 py-2 shadow-2xl transition-colors ${
      isDark
        ? 'bg-[#0e1118]/95 border-white/10 text-white'
        : 'bg-white/95 border-black/10 text-neutral-900 shadow-md'
    }`} style={{ paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom))' }}>
      <div className="max-w-md mx-auto grid grid-cols-3 gap-2">
        
        {/* Call Now with Pulse Ring */}
        <a
          href={`tel:${BUSINESS_INFO.phoneRaw}`}
          className="col-span-1 min-h-[42px] flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl bg-accent text-white text-xs font-bold tracking-tight shadow-md shadow-[#ff3b19]/30 active:scale-95 transition-transform"
          aria-label={`Call ${BUSINESS_INFO.phone}`}
        >
          <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center animate-call-pulse">
            <Phone className="w-2.5 h-2.5 text-white" />
          </span>
          <span className="whitespace-nowrap">{lang === 'np' ? 'फोन गर्नुहोस्' : 'Call Now'}</span>
        </a>

        {/* WhatsApp Button */}
        <a
          href={BUSINESS_INFO.whatsAppUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="col-span-1 min-h-[42px] flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold tracking-tight shadow-md shadow-emerald-600/30 active:scale-95 transition-transform"
          aria-label="Chat on WhatsApp"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          <span>{lang === 'np' ? 'ह्वाट्सएप' : 'WhatsApp'}</span>
        </a>

        {/* Directions Button */}
        <a
          href={BUSINESS_INFO.mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`col-span-1 min-h-[42px] flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl text-xs font-semibold tracking-tight border active:scale-95 transition-transform ${
            isDark
              ? 'bg-neutral-800 text-neutral-200 border-white/10'
              : 'bg-neutral-100 text-neutral-800 border-black/10'
          }`}
          aria-label="Get directions to workshop"
        >
          <MapPin className="w-3.5 h-3.5 text-red-500" />
          <span>{lang === 'np' ? 'लोकेशन' : 'Directions'}</span>
        </a>

      </div>
    </div>
  );
}
