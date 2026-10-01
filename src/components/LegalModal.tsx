import { useEffect } from 'react';
import { X, Shield, FileText, Cookie } from 'lucide-react';
import { Language } from '../data/translations';
import type { Theme } from '../App';

export type LegalModalType = 'privacy' | 'terms' | 'cookies' | null;

interface LegalModalProps {
  type: LegalModalType;
  onClose: () => void;
  lang?: Language;
  theme?: Theme;
}

export default function LegalModal({ type, onClose, lang = 'en', theme = 'dark' }: LegalModalProps) {
  
  // Prevent the background page from moving while the policy dialog is open.
  useEffect(() => {
    if (!type) return;
    (window as any).lenis?.stop();
    return () => {
      (window as any).lenis?.start();
    };
  }, [type]);

  useEffect(() => {
    if (!type) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [type, onClose]);

  if (!type) return null;

  const isDark = theme === 'dark';
  const isNp = lang === 'np';

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-2xl rounded-2xl border p-6 sm:p-8 shadow-2xl max-h-[85vh] overflow-y-auto text-xs sm:text-sm space-y-4 animate-view-in ${
          isDark
            ? 'bg-[#141722] border-white/15 text-neutral-300'
            : 'bg-white border-black/15 text-neutral-600 shadow-xl'
        }`}
        data-lenis-prevent
      >
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 p-1.5 rounded-lg cursor-pointer ${
            isDark ? 'theme-text-muted hover:text-white hover:bg-white/10' : 'theme-text-muted hover:text-black hover:bg-black/5'
          }`}
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {type === 'privacy' && (
          <div>
            <div className="flex items-center gap-2 text-accent-text font-bold text-sm mb-1 font-mono uppercase">
              <Shield className="w-4 h-4" />
              <span>{isNp ? 'नरेश मोटो रिपेयर सेन्टर' : 'Naresh Moto Repair Center'}</span>
            </div>
            <h2 className={`text-xl sm:text-2xl font-extrabold mb-4 ${isDark ? 'text-white' : 'text-neutral-900'}`}>
              {isNp ? 'गोपनीयता नीति (Privacy Policy)' : 'Privacy Policy'}
            </h2>
            <p className="leading-relaxed">
              {isNp
                ? 'नरेश मोटो रिपेयर सेन्टर (धोरे पकाहामैनपुर - १, वीरगन्ज, नेपाल) मा हामी तपाईंको गोपनीयताको सम्मान गर्छौं। यस नीतिले ग्राहकको सम्पर्क विवरण र सेवा रेकर्ड कसरी व्यवस्थापन गरिन्छ भन्ने स्पष्ट गर्दछ।'
                : 'At Naresh Moto Repair Center, located in Dhore pakahamainpur - 1, Dhore, Nepal, we respect your privacy. This policy outlines how we handle customer contact details and service logs.'}
            </p>
            <h3 className={`font-bold text-sm mt-4 ${isDark ? 'text-white' : 'text-neutral-900'}`}>
              {isNp ? '१. हामीले संकलन गर्ने जानकारी' : '1. Information We Collect'}
            </h3>
            <p className="leading-relaxed">
              {isNp
                ? 'मर्मत बुकिङ वा समीक्षा पेश गर्दा, हामी तपाईंको नाम, फोन नम्बर, मोटरसाइकल/स्कूटर मोडल र समस्या विवरणहरू संकलन गर्छौं।'
                : 'When booking a repair or submitting a review, we collect basic details including your name, contact phone number, bike make/model, and reported issues.'}
            </p>
            <h3 className={`font-bold text-sm mt-4 ${isDark ? 'text-white' : 'text-neutral-900'}`}>
              {isNp ? '२. जानकारीको प्रयोग' : '2. How We Use Information'}
            </h3>
            <p className="leading-relaxed">
              {isNp
                ? 'तपाईंको विवरणहरू केवल सेवा तालिका बनाउन, आवश्यक स्पेयर पार्ट्स व्यवस्थापन गर्न र गाडी तयार भएको जानकारी दिन प्रयोग गरिन्छ। हामी कुनै पनि तेस्रो पक्षलाई डाटा बेच्दैनौं वा साझा गर्दैनौं।'
                : 'Your details are used solely to schedule mechanical services, prepare required spare parts, and contact you regarding pickup readiness. We do not sell, rent, or share customer data with third parties.'}
            </p>
            <h3 className={`font-bold text-sm mt-4 ${isDark ? 'text-white' : 'text-neutral-900'}`}>
              {isNp ? '३. डाटा सुरक्षा' : '3. Data Security & Storage'}
            </h3>
            <p className="leading-relaxed">
              {isNp
                ? 'वारेन्टी रेकर्ड र सेवा इतिहास सुरक्षित रूपमा राखिन्छ। तपाईं कुनै पनि समय +977 982-9455583 मा सम्पर्क गरी आफ्नो विवरण हटाउन अनुरोध गर्न सक्नुहुन्छ।'
                : 'Contact logs are stored securely for warranty records and recall notices. You may contact us at +977 982-9455583 anytime to request deletion of your service records.'}
            </p>
          </div>
        )}

        {type === 'terms' && (
          <div>
            <div className="flex items-center gap-2 text-accent-text font-bold text-sm mb-1 font-mono uppercase">
              <FileText className="w-4 h-4" />
              <span>{isNp ? 'वर्कशप नियमहरू' : 'Workshop Regulations'}</span>
            </div>
            <h2 className={`text-xl sm:text-2xl font-extrabold mb-4 ${isDark ? 'text-white' : 'text-neutral-900'}`}>
              {isNp ? 'सेवाका सर्तहरू (Terms of Service)' : 'Terms of Service'}
            </h2>
            <p className="leading-relaxed">
              {isNp
                ? 'नरेश मोटो रिपेयर सेन्टरमा सेवा लिँदा वा अनलाइन बुकिङ गर्दा, ग्राहकहरू निम्न सर्तहरूमा सहमत हुनुहुन्छ:'
                : 'By requesting repair services or utilizing online booking at Naresh Moto Repair Center, customers agree to the following operational terms:'}
            </p>
            <h3 className={`font-bold text-sm mt-4 ${isDark ? 'text-white' : 'text-neutral-900'}`}>
              {isNp ? '१. परीक्षण र अनुमानित खर्च' : '1. Diagnostic & Quotation Process'}
            </h3>
            <p className="leading-relaxed">
              {isNp
                ? 'प्रारम्भिक जाँचपछि अनुमानित समय र लागत दिइन्छ। यदि भित्र खोल्दा कुनै लुकेको खराबी भेटिएमा काम अगाडि बढाउनु अघि ग्राहकलाई जानकारी दिई सहमति लिइन्छ।'
                : 'Estimated repair times and pricing are provided following visual and mechanical inspection. If hidden internal engine or chassis damage is discovered during teardown, the customer is notified for approval before work proceeds.'}
            </p>
            <h3 className={`font-bold text-sm mt-4 ${isDark ? 'text-white' : 'text-neutral-900'}`}>
              {isNp ? '२. कामको वारेन्टी' : '2. Workmanship Warranty'}
            </h3>
            <p className="leading-relaxed">
              {isNp
                ? 'इन्जिन ओभरहल, फोर्क मर्मत र तारिङ मर्मतमा ३० दिनको कार्यशाला ग्यारेन्टी रहन्छ। सामान्य घिस्रिने सामानहरू (जस्तै पन्चर) यसमा पर्दैनन्।'
                : 'Major engine overhauls, fork rebuilding, and electrical harness repairs include our 30-day workshop assurance. Normal wear-and-tear items (punctures, brake pads subjected to excessive misuse) are excluded.'}
            </p>
            <h3 className={`font-bold text-sm mt-4 ${isDark ? 'text-white' : 'text-neutral-900'}`}>
              {isNp ? '३. गाडी हस्तान्तरण र भुक्तानी' : '3. Vehicle Pickup & Payment'}
            </h3>
            <p className="leading-relaxed">
              {isNp
                ? 'काम सम्पन्न भई परीक्षण गरेपछि भुक्तानी गर्नुपर्नेछ। हामी नगद तथा Fonepay, eSewa, Khalti QR डिजिटल भुक्तानी स्वीकार गर्छौं।'
                : 'Payment is due upon completion of the service and post-repair test ride. We accept Nepali Rupees cash and digital payments via Fonepay, eSewa, and Khalti QR.'}
            </p>
          </div>
        )}

        {type === 'cookies' && (
          <div>
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm mb-1 font-mono uppercase">
              <Cookie className="w-4 h-4" />
              <span>{isNp ? 'ब्राउजर प्राथमिकताहरू' : 'Browser Preferences'}</span>
            </div>
            <h2 className={`text-xl sm:text-2xl font-extrabold mb-4 ${isDark ? 'text-white' : 'text-neutral-900'}`}>
              {isNp ? 'कुकी सूचना (Cookie Notice)' : 'Cookie Notice'}
            </h2>
            <p className="leading-relaxed">
              {isNp
                ? 'हाम्रो वेबसाइटले सहज अनुभवका लागि ब्राउजर स्टोरेज प्रयोग गर्दछ:'
                : 'Our website uses lightweight browser storage (cookies and localStorage) solely to improve usability:'}
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>
                <strong>{isNp ? 'भाषा प्राथमिकता:' : 'Language Choice:'}</strong>{' '}
                {isNp ? 'तपाईंले छान्नुभएको भाषा (English वा नेपाली) सम्झन।' : 'Remembering whether you prefer English or नेपाली.'}
              </li>
              <li>
                <strong>{isNp ? 'थिम प्राथमिकता:' : 'Theme Preference:'}</strong>{' '}
                {isNp ? 'तपाईंले छान्नुभएको थिम (Dark Garage वा Simple Light) सम्झन।' : 'Remembering whether you prefer Dark Garage or Simple Light.'}
              </li>
              <li>
                <strong>{isNp ? 'अफलाइन क्यास:' : 'Offline Caching:'}</strong>{' '}
                {isNp ? 'वीरगन्जमा द्रुत गतिमा लोड हुन सर्भिस वर्कर प्रयोग गर्न।' : 'Storing site shell assets via service worker for instant offline page loads in Dhore.'}
              </li>
            </ul>
            <p className={`mt-4 leading-relaxed ${isDark ? 'theme-text-muted' : 'theme-text-muted'}`}>
              {isNp
                ? 'हामी कुनै पनि अनधिकृत ट्र्याकिङ वा विज्ञापन कुकीहरू प्रयोग गर्दैनौं।'
                : 'We do not utilize cross-site tracking cookies or invasive third-party ad pixels.'}
            </p>
          </div>
        )}

        <div className={`pt-4 border-t flex justify-end ${isDark ? 'border-white/10' : 'border-black/10'}`}>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-accent hover:bg-accent-hover text-white font-bold text-xs shadow-md shadow-[#ff3b19]/30 cursor-pointer"
          >
            {isNp ? 'बन्द गर्नुहोस्' : 'Close Window'}
          </button>
        </div>
      </div>
    </div>
  );
}

