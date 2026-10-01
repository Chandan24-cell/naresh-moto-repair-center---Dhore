import { useState, useEffect } from 'react';
import { Download, X, Smartphone, Check } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Wait 3 seconds before showing subtle banner
      setTimeout(() => {
        setIsVisible(true);
      }, 3000);
    };

    window.addEventListener('beforeinstallprompt', handler);

    const installedHandler = () => {
      setIsInstalled(true);
      setIsVisible(false);
      setDeferredPrompt(null);
    };
    window.addEventListener('appinstalled', installedHandler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installedHandler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  if (!isVisible || isInstalled || !deferredPrompt) return null;

  return (
    <div className="fixed top-20 right-4 z-popover max-w-sm rounded-2xl bg-[#141824] border border-white/15 p-4 shadow-2xl animate-fade-in">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center text-white shrink-0 shadow-md shadow-[#ff3b19]/30">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white leading-tight">
              Install Naresh Moto App
            </h4>
            <p className="text-[11px] text-neutral-300 mt-0.5">
              Quick access, offline directions & instant service booking from your home screen.
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="theme-text-muted hover:text-white p-1 rounded-lg hover:bg-white/10"
          aria-label="Dismiss app install banner"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-3 pt-3 border-t border-white/10 flex items-center gap-2">
        <button
          onClick={handleInstallClick}
          className="flex-1 py-1.5 px-3 rounded-lg bg-accent hover:bg-accent-hover text-white text-xs font-bold transition-all shadow-md shadow-[#ff3b19]/30 flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Install Now</span>
        </button>
        <button
          onClick={() => setIsVisible(false)}
          className="py-1.5 px-3 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 text-xs font-medium cursor-pointer"
        >
          Later
        </button>
      </div>
    </div>
  );
}
