import { Award, ShieldCheck, Banknote, Timer, Sparkles } from 'lucide-react';
import { Language, TRANSLATIONS } from '../data/translations';
import type { Theme } from '../App';

interface WhyChooseUsProps {
  lang?: Language;
  theme?: Theme;
}

// The wider lower cards give the two longer trust descriptions room to wrap.
export default function WhyChooseUs({ lang = 'en', theme = 'dark' }: WhyChooseUsProps) {
  const t = TRANSLATIONS[lang].whyUs;
  const isDark = theme === 'dark';

  const reasons = [
    { icon: Award,      title: t.card1Title, stat: lang === 'en' ? '14+ Yrs' : '१४+ वर्ष', description: t.card1Desc },
    { icon: ShieldCheck,title: t.card2Title, stat: lang === 'en' ? 'OEM Stock' : 'सक्कली', description: t.card2Desc },
    { icon: Banknote,   title: t.card3Title, stat: lang === 'en' ? 'Zero Surprise' : 'कुनै छुपाइ छैन', description: t.card3Desc },
    { icon: Timer,      title: t.card4Title, stat: lang === 'en' ? '45 Mins' : '४५ मिनेट', description: t.card4Desc },
    { icon: Sparkles,   title: t.card5Title, stat: lang === 'en' ? 'Local Rates' : 'उचित दाम', description: t.card5Desc },
  ];

  const sectionBg  = isDark ? 'bg-[#0d1017]' : 'bg-[#f4f6fa]';
  const cardClass  = isDark
    ? 'rounded-2xl bg-[#131722] border border-white/10 p-6 hover:border-[#ff3b19]/50 hover:bg-[#161a27] transition-all group relative overflow-hidden'
    : 'rounded-2xl bg-white border border-black/8 p-6 hover:border-[#e8340f]/30 hover:shadow-md transition-all group relative overflow-hidden shadow-sm';
  const headClass  = isDark ? 'text-white' : 'text-neutral-900';
  const subClass   = isDark ? 'theme-text-muted' : 'theme-text-muted';
  const kickerClass= 'text-xs font-mono font-bold tracking-widest text-accent-text uppercase mb-2';
  const statClass  = isDark
    ? 'text-xs font-mono font-bold theme-text-muted bg-white/5 px-2.5 py-1 rounded-md border border-white/10'
    : 'text-xs font-mono font-bold theme-text-muted bg-black/5 px-2.5 py-1 rounded-md border border-black/8';
  const descClass  = isDark ? 'text-neutral-300' : 'text-neutral-600';
  const iconWrap   = isDark
    ? 'w-12 h-12 rounded-xl bg-accent/10 border border-[#ff3b19]/30 flex items-center justify-center text-accent-text group-hover:scale-110 group-hover:bg-accent group-hover:text-white transition-all'
    : 'w-12 h-12 rounded-xl bg-accent/8 border border-[#ff3b19]/20 flex items-center justify-center text-accent-text group-hover:scale-110 group-hover:bg-accent-hover group-hover:text-white transition-all';

  return (
    <section id="why-us" className={`py-20 ${sectionBg} border-t ${isDark ? 'border-white/5' : 'border-black/5'} relative`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className={kickerClass}>{t.kicker}</div>
          <h2 className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${headClass}`}>{t.headline}</h2>
          <p className={`text-sm sm:text-base mt-3 ${subClass}`}>{t.subhead}</p>
        </div>

        {/* Top 3 cards */}
        <div data-reveal data-reveal-stagger className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reasons.slice(0, 3).map((r, i) => {
            const Icon = r.icon;
            return (
              <div key={i} className={`${cardClass} ui-motion-card`}>
                <div className="flex items-center justify-between mb-4">
                  <div className={iconWrap}><Icon className="service-icon-motion w-6 h-6" /></div>
                  <span className={statClass}>{r.stat}</span>
                </div>
                <h3 className={`text-base font-bold mb-2 group-hover:text-accent-text transition-colors ${headClass}`}>{r.title}</h3>
                <p className={`text-xs sm:text-sm leading-relaxed ${descClass}`}>{r.description}</p>
              </div>
            );
          })}
        </div>

        {/* Bottom 2 wide cards */}
        <div data-reveal data-reveal-stagger style={{ '--reveal-delay': '60ms' } as React.CSSProperties} className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {reasons.slice(3, 5).map((r, i) => {
            const Icon = r.icon;
            return (
              <div key={i} className={`${cardClass} ui-motion-card flex flex-col sm:flex-row items-start gap-5`}>
                <div className={`${iconWrap} shrink-0`}><Icon className="service-icon-motion w-6 h-6" /></div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className={`text-base font-bold group-hover:text-accent-text transition-colors ${headClass}`}>{r.title}</h3>
                    <span className={statClass}>{r.stat}</span>
                  </div>
                  <p className={`text-xs sm:text-sm leading-relaxed ${descClass}`}>{r.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
