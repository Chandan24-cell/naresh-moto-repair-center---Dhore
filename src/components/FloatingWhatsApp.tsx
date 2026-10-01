import { useState, useEffect } from 'react';
import { MessageCircle, Copy, Check, QrCode, X, ExternalLink, Smartphone } from 'lucide-react';
import { BUSINESS_INFO } from '../data/siteData';
import { Language, TRANSLATIONS } from '../data/translations';
import type { Theme } from '../App';

interface FloatingWhatsAppProps {
  lang?: Language;
  theme?: Theme;
}

export default function FloatingWhatsApp({ lang = 'en', theme = 'dark' }: FloatingWhatsAppProps) {
  const [copied, setCopied] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const t = TRANSLATIONS[lang].whatsApp;
  const isDark = theme === 'dark';

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 450);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!showQrModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowQrModal(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showQrModal]);

  const handleCopyNumber = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(BUSINESS_INFO.phone);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = BUSINESS_INFO.phone;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy phone number:', err);
    }
  };

  const handleOpenQrModal = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowQrModal(true);
  };

  const encodedWhatsappUrl = encodeURIComponent(BUSINESS_INFO.whatsAppUrl);
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodedWhatsappUrl}&margin=10&color=0-0-0&bgcolor=255-255-255`;

  return (
    <>
      <aside
        id="whatsapp-fab"
        aria-label="WhatsApp quick contact options"
        className={`hidden lg:flex items-center gap-1.5 fixed fixed-ui-bottom-right z-fab bg-emerald-600 hover:bg-emerald-500 rounded-full p-1.5 pl-3.5 pr-2 text-white shadow-xl shadow-emerald-950/40 transition-all duration-300 hover:scale-105 ${
          isVisible ? 'animate-float-in opacity-100' : 'opacity-0 pointer-events-none translate-x-10 scale-90'
        }`}
      >
        <a
          href={BUSINESS_INFO.whatsAppUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2.5 text-white pr-1 focus:outline-none"
          aria-label="Direct WhatsApp message to Naresh Moto Repair Center"
        >
          <div className="relative">
            <MessageCircle className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-300 animate-ping" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-300" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-[10px] font-medium leading-none text-emerald-100">{t.quickWhatsApp}</span>
            <span className="text-xs font-bold leading-tight mt-0.5">{t.chatWithNaresh}</span>
          </div>
        </a>

        {/* Subtle Divider */}
        <div className="h-6 w-px bg-white/25 my-auto" aria-hidden="true" />

        {/* QR Code Action Button */}
        <div className="relative flex items-center">
          <button
            type="button"
            onClick={handleOpenQrModal}
            className="group/qr p-2 rounded-full bg-emerald-700/70 hover:bg-emerald-800 text-white transition-all cursor-pointer flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-white/40"
            title={t.scanQr}
            aria-label="Display WhatsApp QR code modal for scanning"
          >
            <QrCode className="w-4 h-4 text-white group-hover/qr:scale-110 transition-transform" />
          </button>
        </div>

        {/* Copy Number Button with Spring Feedback Animation */}
        <div className="relative flex items-center">
          <button
            type="button"
            onClick={handleCopyNumber}
            className="group/copy p-2 rounded-full bg-emerald-700/70 hover:bg-emerald-800 text-white transition-all cursor-pointer flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-white/40"
            title={copied ? t.copied : t.copyNumber}
            aria-label="Copy workshop phone number"
          >
            {copied ? (
              <Check className="w-4 h-4 text-emerald-200 animate-spring-pop" />
            ) : (
              <Copy className="w-4 h-4 text-white group-hover/copy:scale-110 transition-transform" />
            )}
          </button>
        </div>
      </aside>

      {/* WhatsApp Scan Modal */}
      {showQrModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="qr-modal-title"
          className="fixed inset-0 z-modal flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
          onClick={() => setShowQrModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`relative max-w-sm w-full rounded-2xl border p-6 text-center shadow-2xl ${
              isDark ? 'bg-[#151926] border-white/15 text-white' : 'bg-white border-black/10 text-neutral-900 shadow-xl'
            }`}
          >
            <button
              onClick={() => setShowQrModal(false)}
              className={`absolute top-4 right-4 p-1.5 rounded-lg cursor-pointer ${
                isDark ? 'theme-text-muted hover:text-white hover:bg-white/10' : 'theme-text-muted hover:text-neutral-900 hover:bg-black/5'
              }`}
              aria-label="Close QR Modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500 mx-auto mb-3 shadow-md">
              <MessageCircle className="w-6 h-6" />
            </div>

            <h3 id="qr-modal-title" className="text-lg font-bold">
              {t.scanTitle}
            </h3>
            <p className={`text-xs mt-1 mb-5 leading-relaxed ${isDark ? 'text-neutral-300' : 'text-neutral-600'}`}>
              {t.scanSubtitle}
            </p>

            <div className="bg-white p-4 rounded-xl border border-neutral-300 inline-block shadow-inner mx-auto mb-4">
              <img
                src={qrCodeUrl}
                alt="Naresh Moto WhatsApp QR Code"
                className="w-48 h-48 mx-auto"
                width={192}
                height={192}
              />
            </div>

            <div className="space-y-2 text-xs">
              <div className={`font-mono font-bold ${isDark ? 'text-neutral-200' : 'text-neutral-800'}`}>
                {BUSINESS_INFO.phone}
              </div>
              <p className={`text-[11px] ${isDark ? 'theme-text-muted' : 'theme-text-muted'}`}>
                Dhore pakahamainpur - 1, Dhore, Nepal
              </p>
            </div>

            <div className="mt-5 pt-4 border-t border-white/10 flex gap-2">
              <button
                type="button"
                onClick={handleCopyNumber}
                className={`flex-1 py-2 px-3 rounded-xl border font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer ${
                  isDark
                    ? 'bg-neutral-900 border-white/10 text-neutral-200 hover:text-white'
                    : 'bg-neutral-100 border-black/10 text-neutral-800 hover:bg-neutral-200'
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? t.copied : t.copyNumber}</span>
              </button>

              <a
                href={BUSINESS_INFO.whatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/30"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open Chat</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
