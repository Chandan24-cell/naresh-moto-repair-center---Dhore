import { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { FAQ_ITEMS } from '../data/siteData';
import { Language, TRANSLATIONS } from '../data/translations';
import type { Theme } from '../App';

interface FaqAccordionProps {
  lang?: Language;
  theme?: Theme;
}

const FAQ_ITEMS_NP = [
  {
    question: "के पहिले नै पालो बुक गर्नुपर्छ कि सिधै आउन मिल्छ?",
    answer: "तपाईं सिधै आउन सक्नुहुन्छ! हामी हप्ताको सातै दिन बिहान ६:०० बजेदेखि बेलुका ८:०० बजेसम्म खुला रहन्छौं। मोबिल फेर्ने, हावा/पन्चर, चेन टाइट वा सामान्य सर्भिसिङको लागि सिधै ढोरे पकहामैनपुर - १ मा आउनुहोस्। इन्जिन खोल्ने ठूला कामको लागि फोन गरेर समय लिँदा पालो छिटो आउँछ।"
  },
  {
    question: "के तपाईंसँग १००% सक्कली (Genuine) स्पेयर पार्ट्स पाइन्छ?",
    answer: "हो, हामीसँग हिरो (Hero), बजाज (Bajaj), होन्डा (Honda), टिभिएस (TVS) र यामाहा (Yamaha) का सक्कली पार्ट्सहरू र कम्पनी प्रमाणित मोबिल (Castrol, Servo, Gulf, Lazer), स्पार्क प्लग, ब्रेक शु, र फिल्टरहरू स्टक उपलब्ध छन्।"
  },
  {
    question: "कुन-कुन किसिमका मोटरसाइकल र स्कुटर बनाउनुहुन्छ?",
    answer: "हामी नेपालका सबै दुई-पाङ्ग्रे बनाउँछौं: दैनिक कम्युटर (Splendor, HF Deluxe, Shine, Unicorn, Platina), स्पोर्टी बाइक (Pulsar, FZ, Apache, R15), क्रुजर (Royal Enfield Bullet) तथा स्कुटरहरू (Dio, Activa, NTorq, Jupiter)।"
  },
  {
    question: "वीरगन्ज वरपर बाटोमा बाइक बिग्रियो भने सहयोग पाइन्छ?",
    answer: "पाइन्छ! ढोरे, पकहामैनपुर, बहुअर्वा वा वीरगन्ज आसपास बाटोमा बाइक रोकिएमा हाम्रो नम्बर (+977 982-9455583) मा तुरुन्त फोन गर्नुहोस्। हामी मेकानिक पठाएर वा वर्कशप ल्याउने प्रबन्ध गर्दछौं।"
  },
  {
    question: "भुक्तानीका माध्यमहरू के-के छन्?",
    answer: "हामी नगद (Cash) का साथै फोनपे (Fonepay), ईसेवा (eSewa) र खल्ती (Khalti) क्युआर कोड मार्फत भुक्तानी स्वीकार गर्छौं।"
  },
  {
    question: "के मर्मत कार्यमा वारेन्टी हुन्छ?",
    answer: "अवश्य हुन्छ। नरेश मोटोमा गरिएको काममा १५ देखि ३० दिनसम्म कुनै समस्या वा आवाज आएमा हामी निःशुल्क जाँच तथा समाधान गरिदिन्छौं।"
  }
];

// Keep one open index so answers stay easy to scan on narrow screens.
export default function FaqAccordion({ lang = 'en', theme = 'dark' }: FaqAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const t = TRANSLATIONS[lang].faq;
  const items = lang === 'np' ? FAQ_ITEMS_NP : FAQ_ITEMS;
  const isDark = theme === 'dark';

  const toggleIndex = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className={`py-20 border-t transition-colors duration-200 relative ${
      isDark ? 'bg-[#0d1017] border-white/5 text-white' : 'bg-white border-black/8 text-neutral-900'
    }`}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div data-reveal className="text-center mb-12">
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

        {/* Accordion List */}
        <div data-reveal className="space-y-3">
          {items.map((item, idx) => {
            const isOpen = openIndex === idx;

            return (
              <div
                key={idx}
                className={`rounded-2xl border overflow-hidden transition-colors ${
                  isDark ? 'bg-[#12151f] border-white/10' : 'bg-neutral-50/80 border-black/8 shadow-sm'
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleIndex(idx)}
                  className={`w-full py-4 px-5 text-left flex items-center justify-between gap-4 cursor-pointer transition-colors ${
                    isDark ? 'hover:bg-white/5' : 'hover:bg-black/5'
                  }`}
                  aria-expanded={isOpen}
                >
                  <span className="text-sm sm:text-base font-semibold" style={{ color: 'var(--color-fg)' }}>
                    {item.question}
                  </span>
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-transform duration-300 ${
                      isOpen
                        ? 'rotate-180 text-accent-text bg-accent/10'
                        : isDark ? 'bg-white/5 theme-text-muted' : 'bg-black/5 theme-text-muted'
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className={`px-5 pb-5 pt-1 text-xs sm:text-sm leading-relaxed border-t ${
                    isDark ? 'border-white/5 text-neutral-300' : 'border-black/5 text-neutral-700'
                  }`}>
                    {item.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
