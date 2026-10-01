import { useState } from 'react';
import { CalendarCheck, Search, Wrench, Bike } from 'lucide-react';
import { Language, TRANSLATIONS } from '../data/translations';
import type { Theme } from '../App';

interface HowItWorksProps {
  lang?: Language;
  theme?: Theme;
}

// The selected step controls emphasis without moving the rest of the sequence.
export default function HowItWorks({ lang = 'en', theme = 'dark' }: HowItWorksProps) {
  const [activeStep, setActiveStep] = useState(1);
  const t = TRANSLATIONS[lang].howItWorks;
  const isDark = theme === 'dark';

  const steps = [
    {
      num: 1,
      stepId: t.step1Num,
      title: t.step1Title,
      icon: CalendarCheck,
      summary: t.step1Desc,
      details: lang === 'en'
        ? "No complicated booking needed. We're open from 6:00 AM every day. For routine oil changes or puncture fixes, you can just ride straight in."
        : "अनलाइन बुकिङ अनिवार्य छैन। बिहान ६:०० बजेदेखि हामी खुला छौं। सामान्य काममा सिधै आउनुहोस्।"
    },
    {
      num: 2,
      stepId: t.step2Num,
      title: t.step2Title,
      icon: Search,
      summary: t.step2Desc,
      details: lang === 'en'
        ? "We examine oil quality, brake wear, chain slack, spark plug, and engine acoustics. We tell you exactly what needs fixing and what can wait."
        : "मोबिल, ब्रेक, चेन, स्पार्क प्लग र इन्जिनको अवस्था जाँचेर के चाँडो गर्नुपर्छ र के पर्खन सक्छ स्पष्ट बताइन्छ।"
    },
    {
      num: 3,
      stepId: t.step3Num,
      title: t.step3Title,
      icon: Wrench,
      summary: t.step3Desc,
      details: lang === 'en'
        ? "Hero, Bajaj, TVS, Honda, and Yamaha parts installed to factory torque specs. You're welcome to inspect the old removed parts."
        : "हिरो, बजाज, टिभिएस, होन्डा र यामाहाका सक्कली पार्ट्स सही टर्कमा लगाइन्छ। पुराना पार्ट्स तपाईंले आफैं हेर्न पाउनुहुन्छ।"
    },
    {
      num: 4,
      stepId: t.step4Num,
      title: t.step4Title,
      icon: Bike,
      summary: t.step4Desc,
      details: lang === 'en'
        ? "Our technician performs a rigorous road test to ensure smooth gear shifts, sharp brakes, and zero vibration before handing back your keys."
        : "प्राविधिकले सडकमा राइड गरेर गियर, ब्रेक र भाइब्रेसन सबै सही छ भनी निश्चित गरेपछि मात्र बाइक हस्तान्तरण गरिन्छ।"
    }
  ];

  const sectionBg = isDark ? 'bg-[#0c0e12]' : 'bg-white';
  const headClass = isDark ? 'text-white' : 'text-neutral-900';
  const subClass  = isDark ? 'theme-text-muted' : 'theme-text-muted';

  const cardActive = isDark
    ? 'bg-[#151a26] border-[#ff3b19] shadow-xl shadow-[#ff3b19]/10'
    : 'bg-[#fff4f1] border-[#e8340f] shadow-lg shadow-[#e8340f]/8';
  const cardIdle = isDark
    ? 'bg-[#11131a] border-white/10 hover:border-white/20'
    : 'bg-neutral-50 border-black/8 hover:border-black/15 shadow-sm';

  return (
    <section id="how-it-works" className={`py-20 ${sectionBg} border-t ${isDark ? 'border-white/5' : 'border-black/5'} relative`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="text-xs font-mono font-bold tracking-widest text-accent-text uppercase mb-2">
            {t.kicker}
          </div>
          <h2 className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${headClass}`}>{t.headline}</h2>
          <p className={`text-sm sm:text-base mt-2 ${subClass}`}>{t.subhead}</p>
        </div>

        <div data-reveal data-reveal-stagger className="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-6">
          {steps.map(step => {
            const Icon = step.icon;
            const isCurrent = activeStep === step.num;

            return (
              <div
                key={step.num}
                onClick={() => setActiveStep(step.num)}
                className={`group ui-motion-card cursor-pointer rounded-2xl p-6 transition-all border flex flex-col justify-between ${isCurrent ? cardActive : cardIdle}`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className={`font-mono text-xs font-bold ${isDark ? 'theme-text-muted' : 'theme-text-muted'}`}>
                      STEP {step.stepId}
                    </span>
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                      isCurrent
                        ? 'bg-accent text-white shadow-md shadow-[#ff3b19]/30'
                        : isDark ? 'bg-white/5 theme-text-muted' : 'bg-black/5 theme-text-muted'
                    }`}>
                      <Icon className="service-icon-motion w-4 h-4" />
                    </div>
                  </div>

                  <h3 className={`text-base font-bold mb-2 ${headClass}`}>{step.title}</h3>
                  <p className={`text-xs sm:text-sm leading-relaxed mb-3 ${isDark ? 'text-neutral-300' : 'text-neutral-600'}`}>
                    {step.summary}
                  </p>
                </div>

                <div className={`pt-3 border-t text-[11px] leading-relaxed ${
                  isDark ? 'border-white/5 theme-text-muted' : 'border-black/5 theme-text-muted'
                }`}>
                  {step.details}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
