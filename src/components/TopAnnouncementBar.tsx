import { useState, useEffect, useCallback } from 'react';
import { X, Phone, MessageCircle, Calendar, Sparkles, ChevronRight, Wrench, Star, Sun } from 'lucide-react';
import { BUSINESS_INFO } from '../data/siteData';
import { Language, TRANSLATIONS } from '../data/translations';
import type { Theme } from '../App';

export interface AnnouncementItem {
  id: string;
  textKey?: 'morning' | 'afternoon' | 'evening' | 'promo' | 'liveQueue' | 'emergency' | 'custom';
  textEn?: string;
  textNp?: string;
  icon?: string;
  actionType?: 'book' | 'call' | 'whatsapp' | 'none';
  isActive: boolean;
}

// MASTER §5: no emoji as UI icons. Admin-authored strings may still arrive with
// legacy emoji prefixes — strip them at render time.
const LEADING_EMOJI = /^\s*(?:\p{Extended_Pictographic}|\uFE0F|\u200d)+\s*/u;

// Per-message-type leading icon (replaces the legacy emoji prefixes)
const ANNOUNCEMENT_ICONS: Record<string, typeof Wrench> = {
  promo: Wrench,
  liveQueue: Star,
  morning: Sun,
  afternoon: Sun,
  evening: Sun,
  emergency: Phone,
  custom: Sparkles,
};
const CUSTOM_ICONS: Record<string, typeof Wrench> = {
  wrench: Wrench,
  star: Star,
  sun: Sun,
  phone: Phone,
  sparkles: Sparkles,
};

interface TopAnnouncementBarProps {
  lang: Language;
  theme: Theme;
  onOpenBooking: () => void;
}

const DEFAULT_ANNOUNCEMENTS: AnnouncementItem[] = [
  {
    id: 'ann-1',
    textKey: 'promo',
    textEn: '🛠️ Free brake check with every General Service this week',
    textNp: '🛠️ यस हप्ता नियमित सर्भिसिङ गराउँदा निःशुल्क ब्रेक चेकजाँच!',
    actionType: 'book',
    isActive: true
  },
  {
    id: 'ann-2',
    textKey: 'liveQueue',
    textEn: '⭐ Rated 4.5/5 by 500+ riders in Dhore & Pakahamainpur',
    textNp: '⭐ वीरगन्ज र पकहामैनपुरका ५००+ राइडरहरूद्वारा ४.५/५ रेटिङ प्राप्त',
    actionType: 'book',
    isActive: true
  },
  {
    id: 'ann-3',
    textKey: 'morning',
    textEn: "🌅 Good morning! We're open till 8:00 PM today · Bring your bike in",
    textNp: '🌅 शुभ प्रभात! आज बेलुका ८:०० बजेसम्म वर्कशप खुला छ · समयमै बाइक ल्याउनुहोस्',
    actionType: 'call',
    isActive: true
  },
  {
    id: 'ann-4',
    textKey: 'afternoon',
    textEn: '💬 Message us on WhatsApp for instant mechanical help & estimates',
    textNp: '💬 तत्काल मेकानिकल सल्लाह र खर्च सोधपुछको लागि ह्वाट्सएपमा म्यासेज गर्नुहोस्',
    actionType: 'whatsapp',
    isActive: true
  },
  {
    id: 'ann-5',
    textKey: 'emergency',
    textEn: '📞 Call now — same-day repair & maintenance slots available (+977 982-9455583)',
    textNp: '📞 तुरुन्त फोन गर्नुहोस् — आजै मर्मतको पालो उपलब्ध छ (+977 982-9455583)',
    actionType: 'call',
    isActive: true
  }
];

// Choose the greeting from Nepal time instead of the visitor's local clock.
function getTimeGreetingKey(): 'morning' | 'afternoon' | 'evening' {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const nepalTime = new Date(utc + 3600000 * 5.75);
  const hour = nepalTime.getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

// Pause the rotating message while someone is reading or interacting with it.
export default function TopAnnouncementBar({
  lang,
  theme,
  onOpenBooking
}: TopAnnouncementBarProps) {
  const [dismissed, setDismissed] = useState(() =>
    sessionStorage.getItem('naresh_announcement_dismissed') === 'true'
  );
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const t = TRANSLATIONS[lang].announcements;
  const isDark = theme === 'dark';

  // Load announcements from admin API or default
  useEffect(() => {
    let active = true;
    const loadAnnouncements = () => fetch('/api/public/data')
      .then((r) => r.ok ? r.json() : null)
      .then(data => {
        if (!active) return;
        const items: AnnouncementItem[] = data?.announcements && Array.isArray(data.announcements)
          ? data.announcements.filter((a: AnnouncementItem) => a.isActive)
          : DEFAULT_ANNOUNCEMENTS;
        
        setAnnouncements(items);
      })
      .catch(() => {
        if (active) setAnnouncements(DEFAULT_ANNOUNCEMENTS);
      });
    loadAnnouncements();
    const interval = window.setInterval(loadAnnouncements, 15000);
    return () => { active = false; window.clearInterval(interval); };
  }, []);

  // Auto rotation ticker (every 4.5 seconds)
  const advance = useCallback(() => {
    if (announcements.length <= 1 || isPaused) return;
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentIdx(prev => (prev + 1) % announcements.length);
      setIsAnimating(false);
    }, 220);
  }, [announcements.length, isPaused]);

  useEffect(() => {
    if (dismissed || announcements.length === 0) return;
    let interval: number | undefined;
    const start = () => {
      if (interval === undefined) interval = window.setInterval(advance, 4500);
    };
    const stop = () => {
      if (interval !== undefined) window.clearInterval(interval);
      interval = undefined;
    };
    const onShowcaseVisibility = (event: Event) => {
      if ((event as CustomEvent<boolean>).detail) stop();
      else start();
    };
    if (!(window as any).__bikeShowcaseVisible) start();
    window.addEventListener('bike-showcase-visibility', onShowcaseVisibility);
    return () => {
      stop();
      window.removeEventListener('bike-showcase-visibility', onShowcaseVisibility);
    };
  }, [advance, dismissed, announcements.length]);

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('naresh_announcement_dismissed', 'true');
  };

  const handleAction = (type?: 'book' | 'call' | 'whatsapp' | 'none') => {
    if (!type || type === 'none') return;
    if (type === 'book') {
      onOpenBooking();
    } else if (type === 'call') {
      window.location.href = `tel:${BUSINESS_INFO.phoneRaw}`;
    } else if (type === 'whatsapp') {
      const waButton = document.getElementById('whatsapp-fab');
      if (waButton) waButton.click();
      else window.open(BUSINESS_INFO.whatsAppUrl, '_blank', 'noopener');
    }
  };

  if (dismissed || announcements.length === 0) return null;

  const current = announcements[currentIdx];
  
  // Resolve localized text (emoji prefixes stripped — icons render instead)
  let messageText = '';
  if (lang === 'np') {
    messageText = current.textNp || (current.textKey && t[current.textKey as keyof typeof t]) || current.textEn || '';
  } else {
    messageText = current.textEn || (current.textKey && t[current.textKey as keyof typeof t]) || '';
  }
  messageText = messageText.replace(LEADING_EMOJI, '');

  const actionLabels: Record<string, string> = {
    book: t.actionBook,
    call: t.actionCall,
    whatsapp: t.actionChat
  };

  const ActionIcons = {
    book: Calendar,
    call: Phone,
    whatsapp: MessageCircle
  };

  return (
    <aside
      id="top-announcement-bar"
      role="banner"
      aria-label="Workshop announcements and status"
      data-reveal=""
      className="w-full z-50 relative select-none transition-colors duration-200"
      style={{
        backgroundColor: isDark ? '#141724' : '#fff4f1',
        borderBottom: isDark ? '1px solid rgba(255, 59, 25, 0.35)' : '1px solid rgba(232, 52, 15, 0.25)',
      }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-2.5 py-1.5 sm:py-2 min-h-[38px]">

          {/* Left Message Section */}
          <div
            onClick={() => current.actionType && handleAction(current.actionType)}
            className={`flex-1 flex items-center gap-2.5 min-w-0 transition-opacity duration-200 cursor-pointer ${
              isAnimating ? 'opacity-0' : 'opacity-100'
            }`}
          >
            {/* Pill Indicator dots */}
            <div className="hidden sm:flex items-center gap-1 shrink-0" aria-hidden="true">
              {announcements.map((_, i) => (
                <span
                  key={i}
                  className="rounded-full transition-all duration-300"
                  style={{
                    width: i === currentIdx ? 16 : 4,
                    height: 4,
                    backgroundColor: i === currentIdx
                      ? (isDark ? '#ff3b19' : '#e8340f')
                      : (isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)'),
                  }}
                />
              ))}
            </div>

            {/* Sparkle badge */}
            <span
              className={`hidden md:inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded tracking-wider shrink-0 ${
                isDark
                  ? 'bg-accent/20 text-[#ff7253] border border-[#ff3b19]/30'
                  : 'bg-accent/10 text-accent-text border border-[#e8340f]/20'
              }`}
            >
              <Sparkles className="w-3 h-3" />
            </span>

            {/* Leading icon per message type (replaces legacy emoji prefixes) */}
            {(() => {
              const LeadIcon = (current.icon && CUSTOM_ICONS[current.icon]) || (current.textKey && ANNOUNCEMENT_ICONS[current.textKey]) || Sparkles;
              return <LeadIcon className={`w-3.5 h-3.5 shrink-0 ${isDark ? 'text-[#ff7253]' : 'text-accent-text'}`} aria-hidden="true" />;
            })()}

            {/* Banner text */}
            <p
              className={`text-xs sm:text-[13px] font-medium truncate leading-tight tracking-tight ${
                isDark ? 'text-neutral-100' : 'text-neutral-900'
              }`}
            >
              {messageText}
            </p>
          </div>

          {/* Right Action & Dismiss */}
          <div className="flex items-center gap-2 shrink-0">
            {current.actionType && current.actionType !== 'none' && (
              <button
                type="button"
                onClick={() => handleAction(current.actionType)}
                className={`hidden sm:inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold text-white transition-all active:scale-95 cursor-pointer shadow-sm ${
                  isDark
                    ? 'bg-accent hover:bg-accent-hover shadow-[#ff3b19]/20'
                    : 'bg-accent hover:bg-[#c82a09] shadow-[#e8340f]/20'
                }`}
              >
                {(() => {
                  const Icon = ActionIcons[current.actionType as keyof typeof ActionIcons] || Calendar;
                  return <Icon className="w-3 h-3" />;
                })()}
                <span>{actionLabels[current.actionType] || t.actionBook}</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            )}

            <button
              type="button"
              onClick={handleDismiss}
              aria-label="Dismiss top announcement bar for this session"
              className={`p-1 rounded-md transition-colors cursor-pointer ${
                isDark
                  ? 'theme-text-muted hover:text-white hover:bg-white/10'
                  : 'theme-text-muted hover:text-neutral-900 hover:bg-black/5'
              }`}
              title="Dismiss for session"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>
    </aside>
  );
}
