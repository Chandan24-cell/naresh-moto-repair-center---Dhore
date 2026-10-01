import { Phone, MapPin, Clock, MessageCircle, Wrench, ShieldCheck } from 'lucide-react';
import { BUSINESS_INFO, EXPANDED_SERVICES } from '../data/siteData';
import { Language, TRANSLATIONS } from '../data/translations';
import { LegalModalType } from './LegalModal';
import type { Theme } from '../App';
import { useBusinessHours } from '../hooks/useBusinessHours';

interface FooterProps {
  lang?: Language;
  theme?: Theme;
  onOpenLegal?: (type: 'privacy' | 'terms' | 'cookies') => void;
}

// Legal actions stay optional so the footer can render without a modal host.
export default function Footer({ lang = 'en', theme = 'dark', onOpenLegal }: FooterProps) {
  const t = TRANSLATIONS[lang].footer;
  const navT = TRANSLATIONS[lang].nav;
  const isDark = theme === 'dark';
  const { hoursText, scheduleText } = useBusinessHours();

  return (
    <footer className={`site-footer border-t text-xs transition-colors duration-500 ${
      isDark ? 'bg-black/80 border-white/10 text-neutral-200' : 'bg-white/80 border-black/10 text-neutral-800'
    }`}>
      <div data-reveal className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 fixed-ui-safe-footer">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          
          {/* Brand & Overview */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-white font-bold">
                <Wrench className="w-4 h-4" />
              </span>
              <span className={`font-display font-extrabold text-base ${isDark ? 'text-white' : 'text-black'}`}>
                Naresh Moto Repair Center
              </span>
            </div>
            <p className="theme-text-muted leading-relaxed mb-4">
              {t.desc}
            </p>
            <div className="flex items-center gap-2 text-neutral-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{t.certified}</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className={`${isDark ? 'text-white' : 'text-black'} font-bold uppercase tracking-wider mb-4 text-xs font-mono`}>
              {t.navTitle}
            </h4>
            <ul className="space-y-2.5">
              <li><a href="#home" className="hover:text-white transition-colors">{navT.home}</a></li>
              <li><a href="#what-rolls-in" className="hover:text-white transition-colors">{navT.whatWeFix}</a></li>
              <li><a href="#services" className="hover:text-white transition-colors">{navT.services}</a></li>
              <li><a href="#why-us" className="hover:text-white transition-colors">{navT.whyUs}</a></li>
              <li><a href="#pricing" className="hover:text-white transition-colors">{navT.packages}</a></li>
              <li><a href="#gallery" className="hover:text-white transition-colors">{navT.gallery}</a></li>
              <li><a href="#community" className="hover:text-white transition-colors">Workshop Community</a></li>
              <li><a href="#blog" className="hover:text-white transition-colors">{navT.tips}</a></li>
              <li><a href="#reviews" className="hover:text-white transition-colors">{navT.reviews}</a></li>
              <li><a href="#contact" className="hover:text-white transition-colors">{navT.contact}</a></li>
            </ul>
          </div>

          {/* Services list */}
          <div>
            <h4 className={`${isDark ? 'text-white' : 'text-black'} font-bold uppercase tracking-wider mb-4 text-xs font-mono`}>
              {t.servicesTitle}
            </h4>
            <ul className="space-y-2.5">
              {EXPANDED_SERVICES.slice(0, 6).map(s => (
                <li key={s.id}>
                  <a href="#services" className="hover:text-white transition-colors">
                    {s.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact & Hours */}
          <div>
            <h4 className={`${isDark ? 'text-white' : 'text-black'} font-bold uppercase tracking-wider mb-4 text-xs font-mono`}>
              {t.contactTitle}
            </h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-accent-text shrink-0 mt-0.5" />
                <span className="text-neutral-300">
                  {BUSINESS_INFO.address}
                  <span className="block theme-text-muted font-mono text-[11px] mt-0.5">{BUSINESS_INFO.plusCode}</span>
                </span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-accent-text shrink-0" />
                  <a href={`tel:${BUSINESS_INFO.phoneRaw}`} className={`${isDark ? 'text-white' : 'text-black'} font-mono font-bold hover:text-accent-text`}>
                  {BUSINESS_INFO.phone}
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-neutral-200">{hoursText}</strong>
                  <span className="block theme-text-muted">{scheduleText}</span>
                </span>
              </li>
              <li className="pt-2">
                <a
                  href={BUSINESS_INFO.whatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700/80 hover:bg-emerald-600 text-white text-xs font-semibold transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp: {BUSINESS_INFO.phone}</span>
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Legal, Admin & Copyright Sub-footer */}
        <div className="pt-8 border-t border-[var(--border-subtle)] flex flex-col md:flex-row items-center justify-between gap-4 theme-text-muted text-[11px]">
          <div className="flex flex-wrap items-center gap-4">
            <a href="/admin" className={`font-semibold transition-colors ${isDark ? 'text-neutral-200 hover:text-white' : 'text-neutral-800 hover:text-black'}`}>Admin Login</a>
            <span>·</span>
            <button
              onClick={() => onOpenLegal?.('privacy')}
              className={`transition-colors cursor-pointer ${isDark ? 'hover:text-white' : 'hover:text-black'}`}
            >
              {t.privacy}
            </button>
            <span>·</span>
            <button
              onClick={() => onOpenLegal?.('terms')}
              className={`transition-colors cursor-pointer ${isDark ? 'hover:text-white' : 'hover:text-black'}`}
            >
              {t.terms}
            </button>
            <span>·</span>
            <button
              onClick={() => onOpenLegal?.('cookies')}
              className={`transition-colors cursor-pointer ${isDark ? 'hover:text-white' : 'hover:text-black'}`}
            >
              {t.cookies}
            </button>
          </div>

          <div className="text-center md:text-right">
            © {new Date().getFullYear()} Naresh Moto Repair Center. {t.rights}
          </div>
        </div>

      </div>
    </footer>
  );
}
