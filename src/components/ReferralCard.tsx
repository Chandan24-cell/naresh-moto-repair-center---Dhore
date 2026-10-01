import { useState, useEffect } from 'react';
import { Gift, Share2, Copy, Check, MessageCircle, Tag, ArrowRight } from 'lucide-react';
import { BUSINESS_INFO } from '../data/siteData';
import { Language } from '../data/translations';
import type { Theme } from '../App';

interface ReferralCardProps {
  lang?: Language;
  theme?: Theme;
}

// Keep the visitor's code stable across visits so it can be shared later.
export default function ReferralCard({ lang = 'en', theme = 'dark' }: ReferralCardProps) {
  const [referralCode, setReferralCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [claimCode, setClaimCode] = useState('');
  const [claimPhone, setClaimPhone] = useState('');
  const [claimSuccess, setClaimSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const isDark = theme === 'dark';
  const isNp = lang === 'np';

  useEffect(() => {
    let savedCode = localStorage.getItem('naresh_moto_ref_code');
    if (!savedCode) {
      // Generate a unique, memorable code e.g. MOTO-8492
      const randomDigits = Math.floor(1000 + Math.random() * 9000);
      savedCode = `MOTO-${randomDigits}`;
      localStorage.setItem('naresh_moto_ref_code', savedCode);
    }
    setReferralCode(savedCode);
  }, []);

  const shareText = isNp
    ? `नमस्ते! वीरगन्जको नरेश मोटो रिपेयर सेन्टरमा बाइक वा स्कूटर मर्मत गर्दा १०% छुट पाउनुहोस्। मेरो रिफरल कोड: ${referralCode} प्रयोग गर्नुहोस्। सम्पर्क: +977 982-9455583 वा https://nareshmoto.np`
    : `Namaste! Get 10% off your next motorcycle or scooter service at Naresh Moto Repair Center in Dhore. Use my referral code: ${referralCode}. Call +977 982-9455583 or visit https://nareshmoto.np`;
  
  const whatsAppShareUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleClaimReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimCode.trim()) {
      setErrorMsg(isNp ? 'कृपया साथीको रिफरल कोड प्रविष्ट गर्नुहोस्।' : 'Please enter a friend’s referral code.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/referrals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: claimCode.trim().toUpperCase(),
          visitorPhone: claimPhone.trim() || undefined
        })
      });

      if (res.ok) {
        setClaimSuccess(true);
        localStorage.setItem('naresh_moto_applied_discount', '10%');
      } else {
        setErrorMsg(isNp ? 'कोड प्रमाणित हुन सकेन। कृपया काउन्टरमा कोड देखाउनुहोस्।' : 'Could not verify code. Please show code at counter.');
      }
    } catch (err) {
      // Offline fallback
      setClaimSuccess(true);
      localStorage.setItem('naresh_moto_applied_discount', '10%');
    } finally {
      setIsSubmitting(false);
    }
  };

  const containerBg = isDark
    ? 'bg-gradient-to-br from-[#161a26] via-[#141724] to-[#10121c] border-[#ff3b19]/30 text-white'
    : 'bg-gradient-to-br from-white via-[#fcfbf9] to-[#f4f5f8] border-black/10 text-neutral-900 shadow-lg';

  const subtextClass = isDark ? 'text-neutral-300' : 'text-neutral-600';
  const codeBoxClass = isDark
    ? 'bg-black/50 border-white/15 text-white'
    : 'bg-neutral-100 border-black/10 text-neutral-900';
  const rightColClass = isDark
    ? 'bg-black/40 border-white/10'
    : 'bg-white border-black/10 shadow-sm';
  const inputClass = isDark
    ? 'bg-neutral-900 border-white/15 text-white placeholder:text-muted'
    : 'bg-neutral-50 border-black/15 text-neutral-900 placeholder:text-muted';

  return (
    <div className={`rounded-2xl border p-6 sm:p-8 shadow-2xl relative overflow-hidden ${containerBg}`}>
      {/* Background ambient accent */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex items-center gap-2.5 text-xs font-mono font-bold tracking-widest text-accent-text uppercase mb-2">
        <Gift className="w-4 h-4" />
        <span>{isNp ? 'रिफरल र राइडर रिवार्ड्स' : 'Referral & Rider Rewards'}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Column: Share your code */}
        <div className="lg:col-span-7">
          <h3 className={`text-2xl sm:text-3xl font-extrabold tracking-tight mb-2 ${isDark ? 'text-white' : 'text-neutral-900'}`}>
            {isNp ? 'साथीलाई रिफर गर्नुहोस्, दुवैले १०% छुट पाउनुहोस्' : 'Refer a Fellow Rider, You Both Get 10% Off'}
          </h3>
          <p className={`text-xs sm:text-sm leading-relaxed mb-6 ${subtextClass}`}>
            {isNp
              ? 'आफ्नो व्यक्तिगत रिफरल कोड साथी वा छिमेकीलाई दिनुहोस्। उनीहरूले नरेश मोटोमा सर्भिसिङ गराउँदा १०% छुट पाउनेछन् र तपाईंले पनि अर्को सर्भिसिङमा १०% छुट पाउनुहुनेछ।'
              : 'Share your personal referral code with friends, neighbors, or daily commuters. When they service their bike at Naresh Moto, they receive 10% off their bill, and you get 10% off your next periodic servicing.'}
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Generated Code Display */}
            <div className={`flex items-center justify-between px-4 py-3 rounded-xl border font-mono font-bold text-base tracking-widest ${codeBoxClass}`}>
              <span>{referralCode}</span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="ml-3 p-1 rounded hover:bg-black/10 transition-colors cursor-pointer"
                title={isNp ? 'कोड कपी गर्नुहोस्' : 'Copy referral code'}
                aria-label="Copy referral code"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            {/* WhatsApp Share Button */}
            <a
              href={whatsAppShareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>{isNp ? 'व्हाट्सएपमा सेयर गर्नुहोस्' : 'Share on WhatsApp'}</span>
            </a>

            <button
              type="button"
              onClick={handleCopyCode}
              className={`px-4 py-3 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                isDark ? 'bg-white/10 hover:bg-white/15 text-white' : 'bg-black/5 hover:bg-black/10 text-neutral-700'
              }`}
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{copied ? (isNp ? 'कोड कपी भयो!' : 'Code Copied!') : (isNp ? 'कपी कोड' : 'Copy Code')}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Claim a Friend's Code */}
        <div className={`lg:col-span-5 rounded-xl border p-5 ${rightColClass}`}>
          <div className={`flex items-center gap-2 text-xs font-bold mb-2 ${isDark ? 'text-white' : 'text-neutral-900'}`}>
            <Tag className="w-4 h-4 text-accent-text" />
            <span>{isNp ? 'साथीको कोड छ?' : "Have a Friend's Code? currently unavailable🚫"}</span>
          </div>
          <p className={`text-[11px] mb-4 ${isDark ? 'theme-text-muted' : 'theme-text-muted'}`}>
            {isNp ? 'आजको मर्मतमा १०% छुट लिन कोड प्रविष्ट गर्नुहोस्।' : "Enter their code to activate your 10% discount on today's repair."}
          </p>

          {claimSuccess ? (
            <div className="p-3 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                <strong>{isNp ? '१०% छुट लागू भयो!' : '10% Discount Applied!'}</strong>{' '}
                {isNp ? 'यो कोड तपाईंको वर्कशप भ्रमणका लागि सुरक्षित गरिएको छ।' : "We've logged this code for your workshop visit."}
              </span>
            </div>
          ) : (
            <form onSubmit={handleClaimReferral} className="space-y-3">
              {errorMsg && (
                <div className="text-[11px] text-red-400">{errorMsg}</div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="e.g. MOTO-1234"
                  value={claimCode}
                  onChange={(e) => setClaimCode(e.target.value.toUpperCase())}
                  className={`px-3 py-2 rounded-lg border text-xs font-mono uppercase focus:border-[#ff3b19] focus:outline-none ${inputClass}`}
                  required
                />
                <input
                  type="tel"
                  placeholder={isNp ? 'तपाईंको फोन नम्बर' : 'Your Phone Number'}
                  value={claimPhone}
                  onChange={(e) => setClaimPhone(e.target.value)}
                  className={`px-3 py-2 rounded-lg border text-xs focus:border-[#ff3b19] focus:outline-none ${inputClass}`}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2 px-3 rounded-lg bg-accent hover:bg-accent-hover text-white text-xs font-bold transition-all shadow-md shadow-[#ff3b19]/30 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>{isSubmitting ? (isNp ? 'जाँच गर्दै...' : 'Checking...') : (isNp ? '१०% छुट लागू गर्नुहोस्' : 'Apply 10% Discount')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          )}

          <div className="mt-3 text-[10px] theme-text-muted text-center">
            {isNp ? 'बिलिङ काउन्टरमा छुट प्रमाणीकरण गरिन्छ (धोरे पकाहामैनपुर - १)' : 'Discount verified at billing counter in Dhore Pakahamainpur - 1'}
          </div>
        </div>
      </div>
    </div>
  );
}

