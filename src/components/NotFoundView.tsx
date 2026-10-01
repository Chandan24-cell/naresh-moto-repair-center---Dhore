import { Wrench, Phone, Home } from 'lucide-react';
import { BUSINESS_INFO } from '../data/siteData';
import { Language, TRANSLATIONS } from '../data/translations';
import type { Theme } from '../App';

interface NotFoundProps {
  lang?: Language;
  theme?: Theme;
  onBackHome: () => void;
}

export default function NotFoundView({ lang = 'en', theme = 'dark', onBackHome }: NotFoundProps) {
  const t = TRANSLATIONS[lang].notFound;
  const isDark = theme === 'dark';

  return (
    <div
      className={`min-h-screen flex flex-col items-center justify-center p-6 text-center garage-grid-pattern animate-view-in ${isDark ? 'bg-[#0c0e12]' : 'bg-[#f7f8fa]'}`}
    >
      <div className="w-20 h-20 rounded-2xl bg-accent/10 border border-[#ff3b19]/30 flex items-center justify-center text-accent-text mb-6 shadow-2xl animate-pulse">
        <Wrench className="w-10 h-10" />
      </div>

      <div className="text-xs font-mono font-bold text-accent-text tracking-widest uppercase mb-2">
        {t.badge}
      </div>

      <h1 className={`text-4xl sm:text-5xl font-extrabold tracking-tight mb-4 ${isDark ? 'text-white' : 'text-neutral-900'}`}>
        {t.title}
      </h1>

      <p className={`text-sm sm:text-base max-w-md mb-8 leading-relaxed ${isDark ? 'theme-text-muted' : 'theme-text-muted'}`}>
        {t.desc}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-4">
        <button
          onClick={onBackHome}
          className="py-3 px-6 rounded-xl bg-accent hover:bg-accent-hover text-white font-bold text-xs shadow-lg shadow-[#ff3b19]/30 flex items-center gap-2 cursor-pointer transition-all"
        >
          <Home className="w-4 h-4" />
          <span>{t.backHome}</span>
        </button>

        <a
          href={`tel:${BUSINESS_INFO.phoneRaw}`}
          className={`py-3 px-6 rounded-xl font-semibold text-xs flex items-center gap-2 transition-all border ${
            isDark
              ? 'bg-neutral-900 border-white/15 text-white hover:border-[#ff3b19]/50'
              : 'bg-white border-black/12 text-neutral-800 hover:border-[#e8340f]/40 shadow-sm'
          }`}
        >
          <Phone className="w-4 h-4 text-accent-text" />
          <span>{BUSINESS_INFO.phone}</span>
        </a>
      </div>

      <div className={`mt-12 text-xs font-mono ${isDark ? 'theme-text-muted' : 'theme-text-muted'}`}>
        Naresh Moto Repair Center · Dhore, Nepal
      </div>
    </div>
  );
}
