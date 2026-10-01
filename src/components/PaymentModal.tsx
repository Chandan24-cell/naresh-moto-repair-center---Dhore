import { useState, useEffect } from 'react';
import { X, CheckCircle2, ShieldCheck, ArrowRight, Phone, Copy, Check, ExternalLink } from 'lucide-react';
import { BUSINESS_INFO } from '../data/siteData';
import type { Theme } from '../App';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang?: 'en' | 'np';
  theme?: Theme;
  siteImages?: Record<string, string>;
}

export default function PaymentModal({ isOpen, onClose, lang = 'en', theme = 'dark', siteImages }: PaymentModalProps) {
  const [customerName, setCustomerName] = useState('');
  const [bikeNumber, setBikeNumber] = useState('');
  const [purpose, setPurpose] = useState('');
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [receiptText, setReceiptText] = useState('');
  const [copied, setCopied] = useState(false);

  const isDark = theme === 'dark';
  const isNp = lang === 'np';

  // Clear stale receipt details on close so the next payment starts fresh.
  useEffect(() => {
    if (!isOpen) {
      setIsDone(false);
      setCustomerName('');
      setBikeNumber('');
      setPurpose('');
      setAmount('');
      setReceiptText('');
      setCopied(false);
      return;
    }
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  // Open the payment destination with the amount currently entered in the form.
  const handleOpenEsewaApp = () => {
    const payAmount = amount || '100';
    const esewaUrl = `https://esewa.com.np/#/home?amt=${payAmount}&pid=NareshMoto-${Date.now()}&scd=EPAYTEST`;
    window.open(esewaUrl, '_blank');
  };

  // Build the receipt from the entered payment details for the existing share flow.
  const handleSimulatePayment = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    setTimeout(() => {
      const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kathmandu' });
      const generatedTxn = `ESEWA-${Date.now().toString().slice(-6)}`;
      
      const textEn = `🧾 *NARESH MOTO PAYMENT RECEIPT* 🧾\n\n- *Customer Name:* ${customerName}\n- *Bike Number:* ${bikeNumber}\n- *Purpose:* ${purpose}\n- *Amount Paid:* NPR ${amount}\n- *Transaction ID:* ${generatedTxn}\n- *Time:* ${timestamp}\n\n*(Please attach payment screenshot below)*`;
      const textNp = `🧾 *नरेश मोटो भुक्तानी रसिद* 🧾\n\n- *ग्राहकको नाम:* ${customerName}\n- *बाइक नम्बर:* ${bikeNumber}\n- *उद्देश्य:* ${purpose}\n- *भुक्तानी रकम:* रु ${amount}\n- *ट्रान्जेक्सन ID:* ${generatedTxn}\n- *समय:* ${timestamp}\n\n*(कृपया तल भुक्तानीको स्क्रिनसट पठाउनुहोस्)*`;

      const formatted = isNp ? textNp : textEn;
      setReceiptText(formatted);
      setIsProcessing(false);
      setIsDone(true);

      navigator.clipboard.writeText(formatted).catch(() => {});
    }, 1200);
  };

  const handleOpenWhatsApp = () => {
    const message = encodeURIComponent(receiptText);
    window.open(`https://wa.me/${BUSINESS_INFO.phoneRaw.replace('+', '')}?text=${message}`, '_blank');
  };

  const handleCopyReceipt = async () => {
    await navigator.clipboard.writeText(receiptText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const modalBg = isDark ? 'bg-[#131622] border-white/15 text-white' : 'bg-white border-black/15 text-neutral-900 shadow-2xl';
  const inputBg = isDark ? 'bg-neutral-900 border-white/15 text-white' : 'bg-neutral-50 border-black/15 text-neutral-900';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className={`relative w-full max-w-md rounded-2xl border p-6 shadow-2xl text-xs ${modalBg} max-h-[90vh] overflow-y-auto animate-view-in`}>
        <button onClick={onClose} className={`absolute top-4 right-4 p-1.5 rounded-lg cursor-pointer ${isDark ? 'text-neutral-400 hover:text-white hover:bg-white/10' : 'text-neutral-500 hover:text-black hover:bg-black/5'}`}>
          <X className="w-5 h-5" />
        </button>

        {isDone ? (
          <div className="text-center py-4 animate-view-in">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto mb-3 border border-emerald-500/40">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className={`text-lg font-extrabold mb-1 ${isDark ? 'text-white' : 'text-neutral-900'}`}>
              {isNp ? 'भुक्तानी विवरण तयार भयो!' : 'Payment Receipt Ready!'}
            </h3>
            <p className={`text-xs mb-4 leading-relaxed ${isDark ? 'text-neutral-300' : 'text-neutral-600'}`}>
              {isNp
                ? 'तपाईंको विवरण तयार छ। नरेश दाइको WhatsApp मा पठाउन तलको बटन थिच्नुहोस् र स्क्रिनसट अट्याच गर्नुहोस्।'
                : 'Your receipt details have been generated. Click below to send to Naresh Dai via WhatsApp and attach your payment screenshot.'}
            </p>

            <div className={`p-3 rounded-xl border mb-4 text-left font-mono text-[11px] whitespace-pre-line ${isDark ? 'bg-black/60 border-white/10 text-neutral-300' : 'bg-neutral-100 border-black/10 text-neutral-800'}`}>
              {receiptText}
            </div>

            <div className="flex gap-2">
              <button onClick={handleCopyReceipt} className={`flex-1 py-2.5 rounded-xl border font-semibold flex items-center justify-center gap-1.5 cursor-pointer ${isDark ? 'border-white/20 bg-white/5 hover:bg-white/10 text-white' : 'border-black/20 bg-neutral-100 hover:bg-neutral-200 text-neutral-800'}`}>
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied!' : 'Copy Receipt'}</span>
              </button>
              <button onClick={handleOpenWhatsApp} className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow-md shadow-emerald-600/30 flex items-center justify-center gap-1.5 cursor-pointer">
                <Phone className="w-4 h-4" />
                <span>{isNp ? 'WhatsApp मा पठाउनुहोस्' : 'Send on WhatsApp'}</span>
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-accent-text uppercase mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span>{isNp ? 'सुरक्षित eSewa भुक्तानी' : 'Secure eSewa Payment'}</span>
            </div>
            
            <h3 className={`text-lg font-extrabold mb-1 ${isDark ? 'text-white' : 'text-neutral-900'}`}>
              {isNp ? 'सिधा भुक्तानी गर्नुहोस्' : 'Direct Payment'}
            </h3>
            <p className={`text-xs mb-4 ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
              {isNp ? 'मोबाइलमा हुनुहुन्छ? आधिकारिक eSewa एप खोल्न तलको बटन थिच्नुहोस्।' : 'Browsing on mobile? Tap below to open the official eSewa app directly.'}
            </p>

            {/* Official eSewa App Button */}
            <button
              type="button"
              onClick={handleOpenEsewaApp}
              className="button-micro-interaction w-full mb-3 py-3 px-4 rounded-xl bg-[#60bb46] hover:bg-[#52a43b] text-white font-extrabold transition-all shadow-lg shadow-[#60bb46]/30 flex items-center justify-center gap-2.5 cursor-pointer text-xs sm:text-sm"
            >
              <span className="w-6 h-6 rounded-full bg-white text-[#60bb46] font-black flex items-center justify-center text-[10px] shrink-0 shadow">e</span>
              <span className="truncate">{isNp ? 'आधिकारिक eSewa एपबाट तिर्नुहोस्' : 'Pay via Official eSewa App'}</span>
              <ExternalLink className="w-4 h-4 shrink-0" />
            </button>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-neutral-500/30"></div>
              <span className="flex-shrink mx-3 text-[10px] theme-text-muted uppercase">Or scan QR</span>
              <div className="flex-grow border-t border-neutral-500/30"></div>
            </div>

            <div className={`p-4 rounded-xl border mb-4 flex flex-col items-center justify-center text-center ${isDark ? 'bg-black/40 border-emerald-500/30' : 'bg-emerald-50 border-emerald-500/20'}`}>
              <div className="w-44 h-52 bg-white p-2 rounded-xl mb-2 shadow-lg border border-neutral-200 flex items-center justify-center">
                <img src={siteImages?.['payment-qr'] || '/images/esewa-qr.jpg'} alt="eSewa QR Code" className="max-w-full max-h-full object-contain rounded-lg" />
              </div>
              <span className={`text-xs font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                {isNp ? 'स्क्यान गर्नुहोस्' : 'Scan QR Code'}
              </span>
            </div>

            <form onSubmit={handleSimulatePayment} className="space-y-3">
              <div>
                <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                  {isNp ? 'तपाईंको नाम' : 'Your Name'}
                </label>
                <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} required placeholder="Enter full name" className={`w-full px-3 py-2 rounded-xl border text-xs focus:border-emerald-500 focus:outline-none ${inputBg}`} />
              </div>
              <div>
                <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                  {isNp ? 'बाइक नम्बर' : 'Bike Number'}
                </label>
                <input type="text" value={bikeNumber} onChange={(e) => setBikeNumber(e.target.value)} required placeholder="BA-02-0012" className={`w-full px-3 py-2 rounded-xl border text-xs uppercase font-mono focus:border-emerald-500 focus:outline-none ${inputBg}`} />
              </div>
              <div>
                <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                  {isNp ? 'भुक्तानीको उद्देश्य (सेवा/पार्ट्स)' : 'Purpose of Payment (Service/Parts)'}
                </label>
                <input type="text" value={purpose} onChange={(e) => setPurpose(e.target.value)} required placeholder="e.g. Oil change" className={`w-full px-3 py-2 rounded-xl border text-xs focus:border-emerald-500 focus:outline-none ${inputBg}`} />
              </div>
              <div>
                <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                  {isNp ? 'भुक्तानी गरेको रकम (रु)' : 'Amount Paid (NPR)'}
                </label>
                <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required min="1" placeholder="Enter amount" className={`w-full px-3 py-2 rounded-xl border text-xs focus:border-emerald-500 focus:outline-none ${inputBg}`} />
              </div>

              <button type="submit" disabled={isProcessing} aria-busy={isProcessing} className="ui-submit-loading w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 mt-1">
                <span>{isProcessing ? (isNp ? 'प्रमाणीकरण गर्दै...' : 'Processing...') : (isNp ? 'भुक्तानी रसिद तयार गर्नुहोस्' : 'Confirm Payment & Send to WhatsApp')}</span>
                {!isProcessing && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
