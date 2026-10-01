import { useState, useEffect } from 'react';
import { Clock, RefreshCw } from 'lucide-react';
import { LiveQueueStatus, DEFAULT_QUEUE_STATUS } from '../data/siteData';
import { Language } from '../data/translations';
import type { Theme } from '../App';

interface LiveQueueWidgetProps {
  onOpenBooking?: () => void;
  lang?: Language;
  theme?: Theme;
}

// Keep the current queue visible between server refreshes and during brief outages.
export default function LiveQueueWidget({
  onOpenBooking,
  lang = 'en',
  theme = 'dark'
}: LiveQueueWidgetProps) {
  const [queueStatus, setQueueStatus] = useState<LiveQueueStatus>(DEFAULT_QUEUE_STATUS);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [queueVisible, setQueueVisible] = useState(true);

  const isDark = theme === 'dark';
  const isNp = lang === 'np';

  // Use cached status only when the public endpoint is unreachable.
  const fetchQueue = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/public/data');
      if (res.ok) {
        const data = await res.json();
        if (data.queue) {
          setQueueStatus(data.queue);
          setQueueVisible(data.queue.isVisible !== false);
        }
      }
    } catch (err) {
      // Offline fallback using localStorage if available
      const cached = localStorage.getItem('naresh_moto_queue');
      if (cached) {
        try {
          setQueueStatus(JSON.parse(cached));
        } catch (_) {}
      }
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  useEffect(() => {
    fetchQueue();
    // Poll every 30 seconds
    const interval = setInterval(fetchQueue, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = () => {
    if (queueStatus.bikesAhead <= 2) {
      return {
        dot: 'bg-emerald-400',
        label: isNp ? 'थोरै पर्खाइ' : 'Low Wait'
      };
    }
    if (queueStatus.bikesAhead <= 5) {
      return {
        dot: 'bg-amber-400',
        label: isNp ? 'मध्यम भीड' : 'Moderate Rush'
      };
    }
    return {
      dot: 'bg-red-400',
      label: isNp ? 'व्यस्त' : 'Busy Bays'
    };
  };

  const status = getStatusColor();

  if (!queueVisible) return null;

  return (
    <div
      role="region"
      aria-label="Live workshop queue status"
      className={`inline-flex items-center gap-3 p-2 sm:px-4 sm:py-2.5 rounded-2xl border shadow-lg backdrop-blur-md text-xs ${
        isDark
          ? 'bg-[#141824]/90 border-white/10 text-white'
          : 'bg-white/95 border-black/10 text-neutral-900 shadow-md'
      }`}
    >
      <div className="flex items-center gap-2">
        <span className="relative flex h-2.5 w-2.5">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${status.dot} opacity-75`} />
          <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${status.dot}`} />
        </span>
        <span className={`font-bold font-mono-numbers ${isDark ? 'text-white' : 'text-neutral-900'}`}>
          {queueStatus.bikesAhead} {isNp ? 'बाइक लाइनमा' : 'bikes ahead'}
        </span>
      </div>

      <span className="theme-text-muted hidden sm:inline">·</span>

      <div className={`flex items-center gap-1.5 ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
        <Clock className="w-3.5 h-3.5 text-accent-text" />
        <span>~{queueStatus.estimatedWaitMinutes} {isNp ? 'मिनेट पर्खाइ' : 'min wait'}</span>
      </div>

      {queueStatus.customMessage && (
        <>
          <span className="theme-text-muted hidden md:inline">·</span>
          <span className={`hidden md:inline truncate max-w-[200px] ${isDark ? 'theme-text-muted' : 'theme-text-muted'}`}>
            {queueStatus.customMessage}
          </span>
        </>
      )}

      <button
        onClick={fetchQueue}
        disabled={isRefreshing}
        title={isNp ? 'ताजा गर्नुहोस्' : 'Refresh live queue status'}
        className={`p-1 rounded transition-colors cursor-pointer ${
          isDark ? 'theme-text-muted hover:text-white hover:bg-white/5' : 'theme-text-muted hover:text-black hover:bg-black/5'
        }`}
        aria-label="Refresh queue wait time"
      >
        <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin text-accent-text' : ''}`} />
      </button>

    </div>
  );
}
