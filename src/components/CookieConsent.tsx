import { useState, useEffect } from 'react';
import { Cookie, X } from 'lucide-react';
import { Language, TRANSLATIONS } from '../data/translations';
import type { Theme } from '../App';

interface CookieConsentProps {
  lang?: Language;
  theme?: Theme;
  onOpenPrivacy: () => void;
}

export default function CookieConsent({ lang = 'en', theme = 'dark', onOpenPrivacy }: CookieConsentProps) {
  const [showConsent, setShowConsent] = useState(false);
  const t = TRANSLATIONS[lang].cookieConsent;
  const isDark = theme === 'dark';

  
  useEffect(() => {
    const consent = localStorage.getItem('naresh_moto_cookie_consent');
    if (!consent) {
      const timer = setTimeout(() => setShowConsent(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('naresh_moto_cookie_consent', 'accepted');
    setShowConsent(false);
  };

  const handleDismiss = () => {
    localStorage.setItem('naresh_moto_cookie_consent', 'dismissed');
    setShowConsent(false);
  };

  if (!showConsent) return null;

  return (
    <div className={`fixed cookie-consent-safe-position left-4 right-4 sm:left-6 sm:max-w-md z-popover p-4 rounded-2xl shadow-2xl text-xs border ${
      isDark
        ? 'bg-[#12151f]/95 border-white/15 text-neutral-300'
        : 'bg-white/97 border-black/12 text-neutral-600'
    }`}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className={`flex items-center gap-2 font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
          <Cookie className="w-4 h-4 text-amber-400" />
          <span>{lang === 'en' ? 'Cookie & Privacy Notice' : 'कुकी र गोपनीयता जानकारी'}</span>
        </div>
        <button
          onClick={handleDismiss}
          className={`p-1 rounded cursor-pointer ${isDark ? 'theme-text-muted hover:text-white hover:bg-white/5' : 'theme-text-muted hover:text-neutral-700 hover:bg-black/5'}`}
          aria-label="Close cookie notice"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <p className={`text-[11px] leading-relaxed mb-3 ${isDark ? 'theme-text-muted' : 'theme-text-muted'}`}>
        {t.text}{' '}
        <button
          onClick={onOpenPrivacy}
          className="text-accent-text underline hover:text-[#e03010] cursor-pointer"
        >
          {t.privacyLink}
        </button>.
      </p>

      <div className="flex items-center gap-2">
        <button
          onClick={handleAccept}
          className="flex-1 py-1.5 px-3 rounded-lg bg-accent hover:bg-accent-hover text-white font-bold text-xs shadow-md shadow-[#ff3b19]/30 transition-all cursor-pointer"
        >
          {t.accept}
        </button>
        <button
          onClick={handleDismiss}
          className={`py-1.5 px-3 rounded-lg text-xs font-medium cursor-pointer ${isDark ? 'bg-white/5 hover:bg-white/10 text-neutral-300' : 'bg-black/5 hover:bg-black/10 text-neutral-600'}`}
        >
          {lang === 'en' ? 'Dismiss' : 'हटाउनुहोस्'}
        </button>
      </div>
    </div>
  );
}
