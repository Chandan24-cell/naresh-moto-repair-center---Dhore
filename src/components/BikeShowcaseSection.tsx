import { useState, useEffect, useRef, useCallback, useMemo, useLayoutEffect } from 'react';
import { motion } from 'motion/react';
import { Phone, MapPin, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { Language, TRANSLATIONS } from '../data/translations';
import { BUSINESS_INFO } from '../data/siteData';
import type { Theme } from '../App';
import { useBusinessHours } from '../hooks/useBusinessHours';

export interface ShowcaseBike {
  slug: string;
  id: string;
  name: string;
  frameCount: number;
}

export const SHOWCASE_BIKES: ShowcaseBike[] = [
  { slug: 'bmw-r1250gs', name: 'BMW', frameCount: 240 },
  { slug: 'ducati-monster', name: 'DUCATI', frameCount: 240 },
  { slug: 'triumph-street-triple', name: 'TRIUMPH', frameCount: 300 },
  { slug: 'harley-davidson', name: 'HARLEY-DAVIDSON', frameCount: 300 },
];

interface BikeShowcaseProps {
  lang: Language;
  theme: Theme;
  onOpenBooking: () => void;
}

const padFrame = (n: number) => String(n).padStart(3, '0');
const mod = (n: number, m: number) => ((n % m) + m) % m;
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const SWIPE_HINT_KEY = 'naresh_swipe_hint_dismissed';
let activeShowcaseMouseListeners = 0;
let activeShowcaseRafLoops = 0;

type FeatherGrads = {
  key: string;
  top: CanvasGradient;
  bottom: CanvasGradient;
  left: CanvasGradient;
  right: CanvasGradient;
};

type FrameEntry = { bitmap: ImageBitmap; bytes: number; priority: number };

class FrameCache {
  private cache = new Map<string, FrameEntry>();
  private retained = new Set<string>();
  private queued = new Map<string, number>();
  private priorities = new Map<string, number>();
  private decodeQueue: { url: string; blob: Blob; priority: number }[] = [];
  private fetching = new Map<string, AbortController>();
  private decoding = new Set<string>();
  private fetchCount = 0;
  private decodeCount = 0;
  private bytes = 0;
  private decodeMs = 0;
  private decoded = 0;
  private maxBytes = 250 * 1024 * 1024;
  private resizeWidth = 3840;
  private onReady: (() => void) | null = null;
  private generation = 0;

  get(url: string): ImageBitmap | undefined {
    return this.cache.get(url)?.bitmap;
  }

  get stats() {
    return { frames: this.cache.size, memoryMb: this.bytes / (1024 * 1024), decodeMs: this.decoded ? this.decodeMs / this.decoded : 0 };
  }

  setReadyHandler(handler: () => void) {
    this.onReady = handler;
  }

  setBudget(mobile: boolean) {
    this.maxBytes = (mobile ? 80 : 250) * 1024 * 1024;
    this.evict();
  }

  setResizeWidth(width: number) {
    this.resizeWidth = Math.max(1, Math.round(width));
  }

  retain(urls: Set<string>) {
    this.retained = urls;
    for (const [url, controller] of this.fetching) {
      if (!urls.has(url)) controller.abort();
    }
    for (const [url, entry] of this.cache) {
      if (!urls.has(url)) {
        entry.bitmap.close();
        this.cache.delete(url);
        this.bytes -= entry.bytes;
      }
    }
    this.decodeQueue = this.decodeQueue.filter((job) => urls.has(job.url));
    this.queued.forEach((_, url) => {
      if (!urls.has(url) && !this.fetching.has(url) && !this.decoding.has(url)) this.queued.delete(url);
    });
    this.priorities.forEach((_, url) => {
      if (!urls.has(url)) this.priorities.delete(url);
    });
    this.evict();
  }

  request(url: string, priority: number) {
    this.priorities.set(url, priority);
    const cached = this.cache.get(url);
    if (cached) {
      cached.priority = priority;
      return;
    }
    if (!this.retained.has(url) || this.fetching.has(url) || this.decoding.has(url) || this.decodeQueue.some((job) => job.url === url)) return;
    const queuedPriority = this.queued.get(url);
    if (queuedPriority !== undefined) {
      if (priority > queuedPriority) this.queued.set(url, priority);
    } else {
      this.queued.set(url, priority);
    }
    this.pumpFetches();
  }

  clear() {
    this.generation++;
    this.retained = new Set();
    for (const controller of this.fetching.values()) controller.abort();
    this.cache.forEach(({ bitmap }) => bitmap.close());
    this.cache.clear();
    this.queued.clear();
    this.decodeQueue = [];
    this.bytes = 0;
  }

  private pumpFetches() {
    while (this.fetchCount < 6 && this.queued.size) {
      const next = [...this.queued.entries()].sort((a, b) => b[1] - a[1])[0];
      const [url, priority] = next;
      this.queued.delete(url);
      if (!this.retained.has(url)) continue;
      const controller = new AbortController();
      const generation = this.generation;
      this.fetching.set(url, controller);
      this.fetchCount++;
      fetch(url, { signal: controller.signal })
        .then((response) => {
          if (!response.ok) throw new Error(`Frame request failed: ${response.status}`);
          return response.blob();
        })
        .then((blob) => {
          if (generation === this.generation && this.retained.has(url)) {
            this.decodeQueue.push({ url, blob, priority });
            this.pumpDecodes();
          }
        })
        .catch(() => undefined)
        .finally(() => {
          this.fetching.delete(url);
          this.fetchCount--;
          this.pumpFetches();
        });
    }
  }

  private pumpDecodes() {
    this.decodeQueue.sort((a, b) => b.priority - a.priority);
    while (this.decodeCount < 2 && this.decodeQueue.length) {
      const { url, blob } = this.decodeQueue.shift()!;
      if (!this.retained.has(url)) continue;
      this.decoding.add(url);
      this.decodeCount++;
      const generation = this.generation;
      const started = performance.now();
      createImageBitmap(blob, { resizeWidth: this.resizeWidth, resizeHeight: Math.round(this.resizeWidth * 9 / 16) })
        .then((bitmap) => {
          this.decodeMs += performance.now() - started;
          this.decoded++;
          if (generation !== this.generation || !this.retained.has(url)) {
            bitmap.close();
            return;
          }
          const bytes = bitmap.width * bitmap.height * 4;
          this.cache.set(url, { bitmap, bytes, priority: this.priorities.get(url) || 0 });
          this.bytes += bytes;
          this.evict();
          this.onReady?.();
        })
        .catch(() => undefined)
        .finally(() => {
          this.decoding.delete(url);
          this.decodeCount--;
          this.pumpDecodes();
        });
    }
  }

  private evict() {
    if (this.bytes <= this.maxBytes) return;
    const candidates = [...this.cache.entries()].sort((a, b) => a[1].priority - b[1].priority);
    for (const [url, entry] of candidates) {
      if (this.bytes <= this.maxBytes) break;
      entry.bitmap.close();
      this.cache.delete(url);
      this.bytes -= entry.bytes;
    }
  }
}

export default function BikeShowcaseSection({ lang, onOpenBooking }: BikeShowcaseProps) {
  const t = TRANSLATIONS[lang];
  const tHero = t.hero;
  const tShow = t.bikeShowcase;
  const tNav = t.nav;

  const prefersReducedMotion = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    []
  );
  const showHud = useMemo(
    () =>
      import.meta.env.DEV &&
      typeof window !== 'undefined' &&
      new URLSearchParams(window.location.search).has('perf'),
    []
  );
  const perfFlags = useMemo(() => {
    if (typeof window === 'undefined') return new Set<string>();
    return new Set(new URLSearchParams(window.location.search).getAll('perf').flatMap((value) => value.split(/[,+]/)));
  }, []);

  const [activeBikeIdx, setActiveBikeIdx] = useState(0);
  const [hasSwiped, setHasSwiped] = useState(
    () => typeof sessionStorage !== 'undefined' && sessionStorage.getItem(SWIPE_HINT_KEY) === 'true'
  );
  const { isOpenNow } = useBusinessHours();
  const [useSm, setUseSm] = useState(() => perfFlags.has('sm'));
  const [isDragging, setIsDragging] = useState(false);
  const [stageBg, setStageBg] = useState('#050505');
  const [underline, setUnderline] = useState({ left: 0, width: 0, ready: false });
  const [dbg, setDbg] = useState<null | {
    fps: number;
    frameMs: number;
    drawMs: number;
    decodeMs: number;
    canvas: string;
    decoded: number;
    memoryMb: number;
    longTasks: number;
    bike: string;
    frame: number;
    src: string;
    drawn: string;
    dpr: number;
    size: 'lg' | 'sm';
    progress: number;
  }>(null);

  const [counters, setCounters] = useState({ bikes: 0, years: 0 });
  const statsRef = useRef<HTMLDivElement>(null);

  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
    const hoverRectRef = useRef({ left: 0, width: 0 });
    const hoverRef = useRef({ active: false, target: 1 });
  const wrapARef = useRef<HTMLDivElement>(null);
  const wrapBRef = useRef<HTMLDivElement>(null);
  const canvasARef = useRef<HTMLCanvasElement>(null);
  const canvasBRef = useRef<HTMLCanvasElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  const cacheRef = useRef(new FrameCache());
  const playheadRef = useRef({ current: 1, target: 1 });
  const posRef = useRef({ from: 0, to: 0, dir: 0, x: 0 });
  const settlingRef = useRef(false);
  const settleTargetRef = useRef(0);
  const switchLockRef = useRef(0);
  const wheelAccumRef = useRef(0);
  const wheelTimerRef = useRef<number | null>(null);
  const dragRef = useRef({
    id: -1,
    startX: 0,
    startY: 0,
    lastX: 0,
    lastT: 0,
    active: false,
    locked: false,
    dir: null as 'x' | 'y' | null,
    velocity: 0,
  });
  const clearColourRef = useRef('#050505');
  const featherGradsRef = useRef<FeatherGrads | null>(null);
  const srcInfoRef = useRef('—');
  const drawnInfoRef = useRef('—');
  const fpsRef = useRef({ frames: 0, last: 0, value: 0 });
  const frameTimingRef = useRef({ last: 0, continuing: false, average: 0, slowFrames: 0, drawMs: 0, longTasks: 0 });
  const canvasSizeRef = useRef({ width: 0, height: 0 });
  const blendingRef = useRef(!perfFlags.has('noblend'));
  const observedScrollRef = useRef({ top: 0, height: 0 });
  const inViewRef = useRef(false);
  const visibleTabRef = useRef(true);
  const dirtyRef = useRef(true);
  const lastTargetRef = useRef(1);
  const lastDrawRef = useRef({ frame: -1, blend: -1, bike: -1, x: NaN });
  const scheduleRef = useRef<() => void>(() => undefined);
  const scrubRef = useRef(0);
  const useSmRef = useRef(false);
  const sampleBikeRef = useRef<string | null>(null);
  
  useSmRef.current = useSm;

  const bikeName =
    tShow.bikes[SHOWCASE_BIKES[activeBikeIdx].slug as keyof typeof tShow.bikes] || SHOWCASE_BIKES[activeBikeIdx].name;

  const markSwiped = useCallback(() => {
    setHasSwiped(true);
    try {
      sessionStorage.setItem(SWIPE_HINT_KEY, 'true');
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const updateSize = () => {
      let sm = perfFlags.has('sm');
      const conn = (navigator as any).connection;
      if (conn && conn.saveData) sm = true;
      const mem = (navigator as any).deviceMemory;
      if (mem && mem <= 4) sm = true;
      setUseSm((prev) => (prev === sm ? prev : sm));
    };
    updateSize();
    window.addEventListener('resize', updateSize, { passive: true });
    return () => {
      window.removeEventListener('resize', updateSize);
    };
  }, [perfFlags]);

  useEffect(() => {
    const el = statsRef.current;
    if (!el) return;
    let done = false;
    const run = () => {
      if (done) return;
      done = true;
      if (prefersReducedMotion) {
        setCounters({ bikes: 5200, years: 12 });
        return;
      }
      const t0 = performance.now();
      const dur = 1400;
      const tick = (now: number) => {
        const p = Math.min((now - t0) / dur, 1);
        const e = 1 - Math.pow(1 - p, 3);
        setCounters({ bikes: Math.round(5200 * e), years: Math.round(12 * e) });
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver(
      (entries) => entries.forEach((en) => en.isIntersecting && run()),
      { threshold: 0.3 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [prefersReducedMotion]);

  const urlFor = useCallback(
    (bike: ShowcaseBike, n: number, size: 'lg' | 'sm' = useSmRef.current ? 'sm' : 'lg') =>
      size === 'sm'
        ? `/bike-frames/${bike.slug}/sm/frame-${String(n).padStart(4, '0')}.webp`
        : `/bike-frames/${bike.slug}/ezgif-frame-${padFrame(n)}.png`,
    []
  );

  const sampleCorner = useCallback((img: ImageBitmap) => {
    if (clearColourRef.current !== '#050505') return;
    try {
      const c = document.createElement('canvas');
      c.width = 4;
      c.height = 4;
      const cx = c.getContext('2d', { willReadFrequently: true });
      if (!cx) return;
      cx.drawImage(img, img.width - 4, img.height - 4, 4, 4, 0, 0, 4, 4);
      const d = cx.getImageData(0, 0, 4, 4).data;
      let r = 0, g = 0, b = 0;
      for (let i = 0; i < d.length; i += 4) {
        r += d[i];
        g += d[i + 1];
        b += d[i + 2];
      }
      const n = d.length / 4;
      const next = `rgb(${Math.round((r / n) * 0.88)},${Math.round((g / n) * 0.88)},${Math.round((b / n) * 0.88)})`;
      clearColourRef.current = next;
      // Defer state update to avoid interrupting the animation frame
      setTimeout(() => setStageBg(next), 0);
    } catch {
      /* ignore */
    }
  }, []);

  const drawScene = useCallback(
    (canvas: HTMLCanvasElement | null, bike: ShowcaseBike, frameFloat: number, scale = 1, dim = 1) => {
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = perfFlags.has('dpr1') ? 1 : window.devicePixelRatio || 1;
      const W = canvas.width;
      const H = canvas.height;

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      const count = bike.frameCount;
      const fFloor = Math.max(1, Math.min(count, Math.floor(frameFloat)));
      const fCeil = Math.max(1, Math.min(count, Math.ceil(frameFloat)));
      const alpha = clamp01(frameFloat - fFloor);

      const cache = cacheRef.current;
      let imgFloor = cache.get(urlFor(bike, fFloor));
      let imgCeil = cache.get(urlFor(bike, fCeil));
      
      if (!imgFloor && !imgCeil) {
        for (let d = 1; d <= count && !imgFloor; d++) {
          imgFloor = (fFloor - d >= 1 ? cache.get(urlFor(bike, fFloor - d)) : undefined) ||
            (fFloor + d <= count ? cache.get(urlFor(bike, fFloor + d)) : undefined);
        }
      }

      const base = imgFloor || imgCeil;
      if (!base) {
        // CRITICAL FIX: Do NOT clear the canvas. 
        // Keeping the last drawn frame prevents visible blanking/flashing 
        // while the cache fetches the missing frame.
        return;
      }

      if (clearColourRef.current === '#050505' && sampleBikeRef.current !== bike.slug) {
        sampleCorner(base);
        sampleBikeRef.current = bike.slug;
      }

      srcInfoRef.current = `${base.width}×${base.height}`;
      ctx.fillStyle = clearColourRef.current;
      ctx.fillRect(0, 0, W, H);

      const imgAspect = base.width / base.height;
      const canvasAspect = W / H;
      let dw = W;
      let dh = H;

      if (canvasAspect >= 1) {
        if (imgAspect > canvasAspect) {
          dh = H;
          dw = dh * imgAspect;
        } else {
          dw = W;
          dh = dw / imgAspect;
        }
      } else {
        dw = W;
        dh = dw / imgAspect;
      }

      const dx = (W - dw) / 2;
      const dy = (H - dh) / 2;
      drawnInfoRef.current = `${Math.round(dw / dpr)}×${Math.round(dh / dpr)} css`;

      ctx.save();
      if (scale !== 1) {
        const cx0 = W / 2;
        const cy0 = H / 2;
        ctx.translate(cx0, cy0);
        ctx.scale(scale, scale);
        ctx.translate(-cx0, -cy0);
      }

      ctx.globalAlpha = dim;
      if (imgFloor) ctx.drawImage(imgFloor, dx, dy, dw, dh);
      if (imgCeil && imgCeil !== imgFloor && alpha > 0 && blendingRef.current && !prefersReducedMotion) {
        ctx.globalAlpha = dim * alpha;
        ctx.drawImage(imgCeil, dx, dy, dw, dh);
      }
      ctx.restore();

      const grads = getFeatherGrads(ctx, W, H, clearColourRef.current, featherGradsRef);
      ctx.fillStyle = grads.top;
      ctx.fillRect(0, 0, W, Math.round(H * 0.04));
      ctx.fillStyle = grads.bottom;
      ctx.fillRect(0, Math.round(H * 0.96), W, Math.round(H * 0.04));
      ctx.fillStyle = grads.left;
      ctx.fillRect(0, 0, Math.round(W * 0.04), H);
      ctx.fillStyle = grads.right;
      ctx.fillRect(Math.round(W * 0.96), 0, Math.round(W * 0.04), H);
    },
    [perfFlags, prefersReducedMotion, sampleCorner, urlFor]
  );

  useEffect(() => {
    let rafId = 0;
    let activeLoop = false;
    let loopRegistered = false;
    let previousWindowKey = '';
    let previousWindowCenter = 0;
    let previousHoverTargetFrame = 0;
    let lastHudUpdate = 0;
    const section = sectionRef.current;
    const stage = stageRef.current;
    if (!section || !stage) return;

    const cache = cacheRef.current;
    cache.setBudget(window.innerWidth < 768 || useSmRef.current || Boolean((navigator as any).deviceMemory && (navigator as any).deviceMemory <= 4));
    
    const mobileViewport = window.innerWidth < 768;
    const dpr = perfFlags.has('dpr1') ? 1 : Math.min(window.devicePixelRatio || 1, 2);
    const initialWidth = useSmRef.current ? 960 : Math.min(
      Math.round(stage.clientWidth * dpr),
      1920
    );
    cache.setResizeWidth(initialWidth);
    cache.setReadyHandler(() => {
      dirtyRef.current = true;
      scheduleRef.current();
    });

    const updateTarget = () => {
      const geometry = observedScrollRef.current;
      const distance = geometry.height - window.innerHeight;
      const progress = distance > 0 ? clamp01((window.scrollY - geometry.top) / distance) : 0;
      scrubRef.current = progress;
      const bike = SHOWCASE_BIKES[posRef.current.from];
      playheadRef.current.target = 1 + progress * (bike.frameCount - 1);
    };

    const schedule = () => {
      if (rafId || !inViewRef.current || !visibleTabRef.current) return;
      activeLoop = true;
      if (!loopRegistered) {
        loopRegistered = true;
        if (import.meta.env.DEV && ++activeShowcaseRafLoops > 1) {
          console.warn('[BikeShowcase] More than one frame loop is active.');
        }
      }
      rafId = requestAnimationFrame(tick);
    };
    scheduleRef.current = schedule;

    const unregisterLoop = () => {
      if (!loopRegistered) return;
      loopRegistered = false;
      if (import.meta.env.DEV) activeShowcaseRafLoops = Math.max(0, activeShowcaseRafLoops - 1);
    };

    const updateFrames = (center: number, direction: number) => {
      const pos = posRef.current;
      const size = useSmRef.current ? 'sm' : 'lg';
      const radius = hoverRef.current.active ? 48 : useSmRef.current ? 48 : 24;
      const requested = new Set<string>();
      const requests: { url: string; priority: number }[] = [];
      
      const requestBike = (bikeIndex: number, frameCenter: number) => {
        const targetBike = SHOWCASE_BIKES[bikeIndex];
        const frames: { frame: number; priority: number }[] = [];
        for (let frame = Math.max(1, frameCenter - radius); frame <= Math.min(targetBike.frameCount, frameCenter + radius); frame++) {
          const delta = frame - frameCenter;
          const priority = 100 - Math.abs(delta) + (delta * direction > 0 ? 35 : 0);
          frames.push({ frame, priority });
        }
        frames.sort((a, b) => b.priority - a.priority);
        for (const { frame, priority } of frames) {
          const url = urlFor(targetBike, frame, size);
          requested.add(url);
          requests.push({ url, priority });
        }
        if (hoverRef.current.active && bikeIndex === pos.from) {
          const targetFrame = Math.round(hoverRef.current.target);
          const targetUrl = urlFor(targetBike, targetFrame, size);
          requested.add(targetUrl);
          requests.push({ url: targetUrl, priority: 1000 });
        }
      };
      
      requestBike(pos.from, center);
      if (pos.to !== pos.from) {
        const neighbor = SHOWCASE_BIKES[pos.to];
        requestBike(pos.to, Math.round(1 + scrubRef.current * (neighbor.frameCount - 1)));
      }
      cache.retain(requested);
      requests.sort((a, b) => b.priority - a.priority);
      for (const { url, priority } of requests) cache.request(url, priority);
    };

    const tick = (now: number) => {
      rafId = 0;
      if (activeLoop) activeLoop = false;
      if (!inViewRef.current || !visibleTabRef.current) {
        unregisterLoop();
        return;
      }
      const frameStarted = performance.now();

      const timing = frameTimingRef.current;
      timing.last = now;

      const geometry = observedScrollRef.current;
      const distance = geometry.height - window.innerHeight;
      const progress = distance > 0 ? clamp01((window.scrollY - geometry.top) / distance) : 0;
      scrubRef.current = progress;

      const pos = posRef.current;
      const bike = SHOWCASE_BIKES[pos.from];
      const scrollTarget = 1 + progress * (bike.frameCount - 1);
      const target = hoverRef.current.active ? hoverRef.current.target : scrollTarget;
      
      lastTargetRef.current = target;
      playheadRef.current.target = target;
      const ph = playheadRef.current;
      
      const lenisActive = Boolean((window as any).lenis) && !perfFlags.has('nolenis');
      if (prefersReducedMotion || lenisActive) {
        ph.current = target;
      } else {
        ph.current += (target - ph.current) * 0.3;
      }
      if (Math.abs(target - ph.current) < 0.001) ph.current = target;

      if (settlingRef.current) {
        // Premium weighted easing (0.1 is smoother and more luxurious than 0.16)
        pos.x += (settleTargetRef.current - pos.x) * (prefersReducedMotion ? 1 : 0.1);
        if (Math.abs(settleTargetRef.current - pos.x) < 0.5) {
          pos.x = settleTargetRef.current;
          if (settleTargetRef.current !== 0) {
            pos.from = pos.to;
            pos.to = pos.from;
            pos.x = 0;
            setActiveBikeIdx(pos.from);
          } else {
            pos.to = pos.from;
          }
          settlingRef.current = false;
        }
      }

      const center = Math.round(ph.current);
      const windowKey = `${pos.from}:${pos.to}:${useSmRef.current}`;
      const recenterDistance = hoverRef.current.active ? 12 : 1;
      const hoverTargetFrame = hoverRef.current.active ? Math.round(hoverRef.current.target) : 0;
      const hoverTargetMoved = hoverRef.current.active && Math.abs(hoverTargetFrame - previousHoverTargetFrame) >= 12;
      if (windowKey !== previousWindowKey || Math.abs(center - previousWindowCenter) >= recenterDistance || hoverTargetMoved) {
        const direction = Math.sign(center - previousWindowCenter) || 1;
        updateFrames(center, direction);
        cache.request(urlFor(bike, center), 1000);
        previousWindowKey = windowKey;
        previousWindowCenter = center;
        previousHoverTargetFrame = hoverTargetFrame;
      }

      const vw = window.innerWidth;
      const p = Math.min(1, Math.abs(pos.x) / vw);
      const showB = pos.to !== pos.from;
      const offsetB = showB && pos.dir !== 0 ? -pos.dir * 0.12 * vw * (1 - p) : 0;
      const blend = ph.current - Math.floor(ph.current);

      const frameChanged = Math.abs(ph.current - lastDrawRef.current.frame) > 0.05;
      const blendChanged = Math.abs(blend - lastDrawRef.current.blend) > 0.05;
      const bikeChanged = pos.from !== lastDrawRef.current.bike;
      const swipeChanged = Math.abs(p - lastDrawRef.current.x) > 0.05;

      const drawStarted = performance.now();
      if (dirtyRef.current || frameChanged || blendChanged || bikeChanged || swipeChanged) {
        drawScene(canvasARef.current, bike, ph.current, 1 - 0.04 * p, 1 - 0.3 * p);
        if (showB) drawScene(canvasBRef.current, SHOWCASE_BIKES[pos.to], ph.current);
        lastDrawRef.current = { frame: ph.current, blend, bike: pos.from, x: p };
        dirtyRef.current = false;
      }
      timing.drawMs = performance.now() - drawStarted;

      const elA = wrapARef.current;
      const elB = wrapBRef.current;
      if (!prefersReducedMotion && (swipeChanged || bikeChanged)) {
        if (elA) elA.style.transform = `translate3d(${pos.x.toFixed(2)}px,0,0)`;
        if (elB) {
          elB.style.opacity = showB ? '1' : '0';
          elB.style.visibility = showB ? 'visible' : 'hidden';
          if (showB) elB.style.transform = `translate3d(${offsetB.toFixed(2)}px,0,0)`;
        }
      } else if (prefersReducedMotion && (swipeChanged || bikeChanged) && elB) {
        elB.style.visibility = showB ? 'visible' : 'hidden';
        if (showB) elB.style.opacity = '1';
      }

      const fps = fpsRef.current;
      fps.frames++;
      if (now - fps.last >= 500) {
        fps.value = Math.round((fps.frames * 1000) / (now - fps.last));
        fps.frames = 0;
        fps.last = now;
      }

      if (showHud && now - lastHudUpdate >= 200) {
        lastHudUpdate = now;
        const stats = cache.stats;
        setDbg({
          fps: fps.value,
          frameMs: performance.now() - frameStarted,
          drawMs: timing.drawMs,
          decodeMs: stats.decodeMs,
          canvas: `${canvasARef.current?.width || 0}×${canvasARef.current?.height || 0}`,
          decoded: stats.frames,
          memoryMb: stats.memoryMb,
          longTasks: timing.longTasks,
          bike: `${String(pos.from + 1).padStart(2, '0')} ${bike.name}${pos.to !== pos.from ? ` → ${SHOWCASE_BIKES[pos.to].name}` : ''}`,
          frame: center,
          src: srcInfoRef.current,
          drawn: drawnInfoRef.current,
          dpr: perfFlags.has('dpr1') ? 1 : window.devicePixelRatio || 1,
          size: useSmRef.current ? 'sm' : 'lg',
          progress: Math.round(progress * 100),
        });
      }

      const stillEasing = !lenisActive && Math.abs(target - ph.current) >= 0.001;
      const lenisScrolling = lenisActive && Boolean((window as any).lenis.isScrolling);
      const continueLoop = hoverRef.current.active || settlingRef.current || (dragRef.current.active && dragRef.current.locked && dragRef.current.dir === 'x') || stillEasing || lenisScrolling;
      
      timing.continuing = continueLoop;
      if (continueLoop) schedule();
      else {
        timing.last = 0;
        unregisterLoop();
      }
    };

    const refreshGeometry = () => {
      const rect = section.getBoundingClientRect();
      observedScrollRef.current = { top: rect.top + window.scrollY, height: rect.height };
      const stageRect = stage.getBoundingClientRect();
      hoverRectRef.current = { left: stageRect.left, width: stageRect.width };
      
      const dpr = perfFlags.has('dpr1') ? 1 : Math.min(window.devicePixelRatio || 1, 2);
      const targetWidth = useSmRef.current ? 960 : Math.min(Math.round(stage.clientWidth * dpr), 1920);
      const targetHeight = Math.round(targetWidth * 9 / 16);
      
      // CRITICAL FIX: Only resize if the target is LARGER than current.
      // This prevents the browser from wiping the canvas on minor layout shifts.
      if (canvasARef.current && targetWidth > canvasARef.current.width) {
        canvasARef.current.width = targetWidth;
        canvasARef.current.height = targetHeight;
      }
      if (canvasBRef.current && targetWidth > canvasBRef.current.width) {
        canvasBRef.current.width = targetWidth;
        canvasBRef.current.height = targetHeight;
      }
      
      canvasSizeRef.current = { width: stage.clientWidth, height: stage.clientHeight };
      dirtyRef.current = true;
      updateTarget();
      schedule();
    };

    const resizeObserver = new ResizeObserver(refreshGeometry);
    resizeObserver.observe(section);
    resizeObserver.observe(stage);
    refreshGeometry();

    const pauseLoop = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = 0;
      activeLoop = false;
      unregisterLoop();
      frameTimingRef.current.last = 0;
      frameTimingRef.current.continuing = false;
      fpsRef.current.frames = 0;
      fpsRef.current.last = 0;
      previousWindowKey = '';
      cache.retain(new Set());
    };

    const intersectionObserver = new IntersectionObserver(([entry]) => {
      inViewRef.current = entry.isIntersecting;
      if (entry.isIntersecting) {
        dirtyRef.current = true;
        schedule();
      } else {
        pauseLoop();
      }
    });
    intersectionObserver.observe(stage);

    const visibilityChange = () => {
      visibleTabRef.current = document.visibilityState === 'visible';
      if (visibleTabRef.current) schedule();
      else pauseLoop();
    };

    let scrollRaf = 0;
    const onScroll = () => {
      hoverRef.current.active = false;
      if (scrollRaf) return;
      scrollRaf = requestAnimationFrame(() => {
        scrollRaf = 0;
        updateTarget();
        dirtyRef.current = true;
        schedule();
      });
    };

    const onMouseMove = (event: MouseEvent) => {
      const rect = hoverRectRef.current;
      if (!rect.width) return;
      const bike = SHOWCASE_BIKES[posRef.current.from];
      const progress = clamp01((event.clientX - rect.left) / rect.width);
      hoverRef.current.target = 1 + progress * (bike.frameCount - 1);
      hoverRef.current.active = true;
      dirtyRef.current = true;
      schedule();
    };

    const onMouseLeave = () => {
      if (!hoverRef.current.active) return;
      hoverRef.current.active = false;
      dirtyRef.current = true;
      schedule();
    };

    stage.addEventListener('mousemove', onMouseMove, { passive: true });
    stage.addEventListener('mouseleave', onMouseLeave, { passive: true });
    if (import.meta.env.DEV && ++activeShowcaseMouseListeners > 1) {
      console.warn('[BikeShowcase] More than one mousemove listener is active.');
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', refreshGeometry, { passive: true });
    document.addEventListener('visibilitychange', visibilityChange);
    
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      unregisterLoop();
      if (scrollRaf) cancelAnimationFrame(scrollRaf);
      scheduleRef.current = () => undefined;
      cache.setReadyHandler(() => undefined);
      cache.clear();
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      stage.removeEventListener('mousemove', onMouseMove);
      stage.removeEventListener('mouseleave', onMouseLeave);
      if (import.meta.env.DEV) activeShowcaseMouseListeners = Math.max(0, activeShowcaseMouseListeners - 1);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', refreshGeometry);
      document.removeEventListener('visibilitychange', visibilityChange);
    };
  }, [drawScene, perfFlags, prefersReducedMotion, showHud, urlFor]);

  useLayoutEffect(() => {
    const el = itemRefs.current[activeBikeIdx];
    if (el) {
      setUnderline({ left: el.offsetLeft, width: el.offsetWidth, ready: true });
    }
  }, [activeBikeIdx]);

  const beginSettle = useCallback((commit: boolean) => {
    const pos = posRef.current;
    if (pos.x === 0 && pos.from === pos.to) return;
    settlingRef.current = true;
    const dir = pos.x !== 0 ? (pos.x < 0 ? -1 : 1) : pos.dir || -1;
    settleTargetRef.current = commit ? dir * window.innerWidth : 0;
    scheduleRef.current();
  }, []);

  const switchTo = useCallback(
    (targetIdx: number, dir: -1 | 1) => {
      const now = performance.now();
      if (settlingRef.current || now - switchLockRef.current < 450) return;
      switchLockRef.current = now;
      markSwiped();
      const pos = posRef.current;

      if (prefersReducedMotion) {
        pos.to = targetIdx;
        pos.dir = 0;
        pos.x = 0;
        const elB = wrapBRef.current;
        const elA = wrapARef.current;
        if (elB) { elB.style.transition = 'none'; elB.style.opacity = '1'; }
        if (elA) { elA.style.transition = 'opacity 200ms ease'; elA.style.opacity = '0'; }
        scheduleRef.current();
        window.setTimeout(() => {
          const p = posRef.current;
          p.from = targetIdx; p.to = targetIdx; p.x = 0;
          setActiveBikeIdx(targetIdx);
          const a = wrapARef.current;
          const b = wrapBRef.current;
          if (a) { a.style.transition = 'none'; a.style.opacity = '1'; }
          if (b) { b.style.transition = 'none'; b.style.opacity = '0'; }
        }, 230);
        return;
      }
      pos.to = targetIdx;
      pos.dir = dir;
      beginSettle(true);
    },
    [beginSettle, markSwiped, prefersReducedMotion]
  );

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Completely disable mouse dragging to prevent jarring "flying" effects.
    // Only allow touch and pen inputs for intentional swiping.
    if (e.pointerType === 'mouse') return;
    settlingRef.current = false;
    dragRef.current = {
      id: e.pointerId,
      startX: e.clientX - posRef.current.x,
      startY: e.clientY,
      lastX: e.clientX,
      lastT: performance.now(),
      active: true,
      locked: false,
      dir: null,
      velocity: 0,
    };
    setIsDragging(true);
    dirtyRef.current = true;
    scheduleRef.current();
    try { stageRef.current?.setPointerCapture(e.pointerId); } catch {}
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (!d.active || e.pointerId !== d.id) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (!d.locked) {
      if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
      d.locked = true;
      d.dir = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      if (d.dir === 'x') markSwiped();
    }
    if (d.dir !== 'x') return;
    const now = performance.now();
    const dt = now - d.lastT;
    if (dt > 0) d.velocity = (e.clientX - d.lastX) / dt;
    d.lastX = e.clientX;
    d.lastT = now;
    const vw = window.innerWidth;
    const pos = posRef.current;
    pos.x = Math.max(-vw, Math.min(vw, dx));
    pos.dir = pos.x < 0 ? -1 : 1;
    pos.to = mod(pos.from + (pos.x < 0 ? 1 : -1), SHOWCASE_BIKES.length);
    dirtyRef.current = true;
    scheduleRef.current();
  };

  const endPointer = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (!d.active || e.pointerId !== d.id) return;
    d.active = false;
    setIsDragging(false);
    try { stageRef.current?.releasePointerCapture(e.pointerId); } catch {}
    if (!d.locked || d.dir !== 'x') return;
    const w = window.innerWidth;
    const commit = Math.abs(posRef.current.x) >= w * 0.18 || Math.abs(d.velocity) > 0.5;
    beginSettle(commit);
    dirtyRef.current = true;
    scheduleRef.current();
  };

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault();
      wheelAccumRef.current += e.deltaX;
      if (wheelTimerRef.current === null) {
        wheelTimerRef.current = window.setTimeout(() => {
          wheelAccumRef.current = 0;
          wheelTimerRef.current = null;
        }, 220);
      }
      if (Math.abs(wheelAccumRef.current) > 60 && !settlingRef.current) {
        const dir: -1 | 1 = wheelAccumRef.current > 0 ? -1 : 1;
        wheelAccumRef.current = 0;
        switchTo(mod(posRef.current.from + (dir === -1 ? 1 : -1), SHOWCASE_BIKES.length), dir);
      }
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', onWheel);
      if (wheelTimerRef.current !== null) clearTimeout(wheelTimerRef.current);
    };
  }, [switchTo]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      switchTo(mod(activeBikeIdx + 1, SHOWCASE_BIKES.length), -1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      switchTo(mod(activeBikeIdx - 1, SHOWCASE_BIKES.length), 1);
    }
  };

  const heroO = Math.max(0, 1 - scrubRef.current / 0.15);
  const asmO = clamp01((scrubRef.current - 0.85) / 0.15);

  const ctaRow = (
    <div className="flex flex-wrap gap-3 sm:gap-4">
      <a
        href={`tel:${BUSINESS_INFO.phoneRaw}`}
        className="hidden sm:inline-flex items-center justify-center gap-2 px-4 py-2.5 sm:px-6 sm:py-3.5 rounded-full bg-accent text-white font-semibold text-xs sm:text-sm tracking-wide hover:bg-accent-hover transition-all active:scale-95 shadow-lg shadow-[#ff3b19]/20"
      >
        <Phone className="w-4 h-4" />
        {tHero.callCta}
      </a>
      <a
        href={BUSINESS_INFO.mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="hidden sm:inline-flex items-center justify-center gap-2 px-4 py-2.5 sm:px-6 sm:py-3.5 rounded-full border border-white/20 bg-white/5 backdrop-blur-xl text-white font-semibold text-xs sm:text-sm hover:bg-white/10 transition-all active:scale-95"
      >
        <MapPin className="w-4 h-4 text-amber-400" />
        {tHero.directionsCta}
      </a>
      <button
        onClick={onOpenBooking}
        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 sm:px-6 sm:py-3.5 rounded-full border border-white/20 bg-white/5 backdrop-blur-xl text-white font-semibold text-xs sm:text-sm hover:bg-white/10 transition-all active:scale-95"
      >
        <Calendar className="w-4 h-4 text-amber-500" />
        {tHero.bookSlotCta}
      </button>
    </div>
  );

  return (
    <section
      ref={sectionRef}
      id="home"
      className="relative w-full select-none"
      style={{ height: '300vh', backgroundColor: stageBg }}
    >
      <div
        ref={stageRef}
        role="region"
        aria-roledescription="carousel"
        aria-label={tShow.selectBike}
        tabIndex={0}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
        className="sticky top-0 w-full h-svh overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-[#ff3b19]/60"
        style={{
          backgroundColor: stageBg,
          contain: 'layout paint',
          touchAction: 'pan-y',
          overscrollBehaviorX: 'none' as const,
          cursor: 'default', // Changed from grab to default since mouse drag is disabled
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 60% 50% at 50% 58%, #16181d 0%, #0a0b0d 55%, #050505 100%)',
            filter: perfFlags.has('noblur') ? 'none' : 'blur(2px)',
          }}
          aria-hidden="true"
        />

        <div ref={wrapBRef} className="absolute inset-0" style={{ opacity: 0, visibility: 'hidden', willChange: isDragging ? 'transform' : 'auto' }}>
          <canvas ref={canvasBRef} className="absolute inset-0 w-full h-full" aria-hidden="true" />
        </div>

        <div ref={wrapARef} className="absolute inset-0" style={{ willChange: isDragging ? 'transform' : 'auto' }}>
          <canvas ref={canvasARef} className="absolute inset-0 w-full h-full" aria-hidden="true" />
        </div>

        {/* Smooth fade improves title contrast without a hard shadow edge over the bike. */}
        <div
          className="absolute inset-0 z-[1] bg-gradient-to-r from-neutral-950 via-neutral-950/70 to-transparent pointer-events-none"
          aria-hidden="true"
        />

        <div
          className={`absolute inset-0 pointer-events-none opacity-[0.03] ${perfFlags.has('nograin') ? 'hidden' : ''}`}
          style={{
            backgroundImage: 'url("/showcase-grain.webp")',
            backgroundSize: '96px 96px',
          }}
          aria-hidden="true"
        />

        <motion.div
          className="absolute top-8 sm:top-12 inset-x-0 z-20 flex justify-center px-6 pointer-events-none"
          initial="hidden"
          animate="visible"
          variants={{ hidden: {}, visible: { transition: { staggerChildren: prefersReducedMotion ? 0 : 0.1, delayChildren: 0.1 } } }}
        >
          <div className="relative flex gap-8 sm:gap-16 text-[10px] sm:text-xs font-medium tracking-[0.2em] uppercase">
            {SHOWCASE_BIKES.map((b, i) => (
              <motion.div
                key={b.id}
                variants={{ hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 20 }, visible: { opacity: 1, y: 0, transition: { duration: prefersReducedMotion ? 0 : 0.45, ease: 'easeOut' } } }}
              >
                <div
                  ref={(el) => { itemRefs.current[i] = el; }}
                  className="flex flex-col items-center gap-2 pb-2 transition-opacity duration-500"
                  style={{ opacity: i === activeBikeIdx ? 1 : 0.4 }}
                >
                  <span className="text-white/60 font-mono">{b.id}</span>
                  <span className={`font-semibold transition-colors duration-300 ${i === activeBikeIdx ? 'text-white' : 'text-white/50'}`}>
                    {b.name}
                  </span>
                </div>
              </motion.div>
            ))}
            {underline.ready && (
              <div
                className="absolute -bottom-1 h-[2px] bg-gradient-to-r from-transparent via-[#ff3b19] to-transparent"
                style={{
                  left: underline.left,
                  width: underline.width,
                  transition: 'left 600ms cubic-bezier(0.22, 1, 0.36, 1), width 600ms cubic-bezier(0.22, 1, 0.36, 1)',
                }}
                aria-hidden="true"
              />
            )}
          </div>
        </motion.div>

        <div
          className="absolute bottom-16 left-4 sm:bottom-20 sm:left-12 lg:bottom-24 lg:left-16 z-10 pointer-events-none w-[calc(100%-2rem)] sm:w-[calc(100%-6rem)] lg:w-[calc(100%-8rem)] max-w-2xl"
          style={{ opacity: heroO, visibility: heroO < 0.02 ? 'hidden' : 'visible' }}
        >
          <div className="pointer-events-auto relative z-10 max-w-xl space-y-3 p-3 sm:space-y-6 sm:p-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-black/25 backdrop-blur-xl mb-2 sm:mb-4">
              <span className={`w-2 h-2 rounded-full ${isOpenNow ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span className="text-xs font-medium text-white/90 tracking-wide">
                {isOpenNow ? tNav.openNow : tNav.closed}
              </span>
              <span className="text-xs text-white/50 hidden sm:inline">· {tShow.hoursLabel}</span>
            </div>
            <h1 style={{ color: '#ffffff' }} className="max-w-[20ch] text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tighter leading-[1.05] mb-2 sm:mb-4 !text-white">
              {tShow.shopName}
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.96)' }} className="hidden sm:block text-sm lg:text-base max-w-xl leading-relaxed mb-5 !text-white/90">
              {tHero.subtitle}
            </p>
            {ctaRow}
          </div>
        </div>

        <div
          className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-center p-6 z-10"
          style={{
            opacity: asmO,
            visibility: asmO < 0.02 ? 'hidden' : 'visible',
          }}
        >
          {/* Solid background prevents any canvas bleed-through during assemble */}
          <div className="absolute inset-0 bg-black/95 backdrop-blur-md" />
          <div
            className="relative pointer-events-auto max-w-2xl"
            style={{ transform: `scale(${0.95 + asmO * 0.05})`, transition: 'transform 600ms cubic-bezier(0.22, 1, 0.36, 1)' }}
          >
            <p className="text-[11px] sm:text-xs font-mono tracking-[0.3em] uppercase text-[#ff7253] mb-4">
              {tShow.kicker}
            </p>
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tighter mb-4 text-white">
              {tShow.readyTitle}
            </h2>
            <p className="text-sm sm:text-base text-white/70 mb-8 max-w-md mx-auto">{tShow.servicedNote}</p>
            {ctaRow}
          </div>
        </div>

        <div
          className="absolute bottom-6 sm:bottom-12 left-6 sm:left-12 z-10 pointer-events-none overflow-hidden"
          aria-hidden="true"
        >
          <div key={activeBikeIdx} className="animate-mask-slide-up">
            <span className="block text-lg sm:text-2xl font-bold uppercase tracking-[0.2em] text-white/90">
              {bikeName}
            </span>
          </div>
        </div>

        {!hasSwiped && (
          <div className="absolute bottom-6 inset-x-0 flex justify-center items-center gap-3 pointer-events-none z-10">
            <ChevronLeft className="w-4 h-4 text-white/50 animate-swipe-hint-left" />
            <div className="h-px w-16 sm:w-24 bg-gradient-to-r from-transparent via-white/40 to-transparent" />
            <ChevronRight className="w-4 h-4 text-white/50 animate-swipe-hint-right" />
            <span className="sr-only">{tShow.swipeHint}</span>
          </div>
        )}

        <div aria-live="polite" className="sr-only">
          {bikeName}
        </div>

        {showHud && dbg && (
          <div className="fixed bottom-4 left-4 z-[80] font-mono text-[11px] leading-relaxed bg-black/85 text-emerald-300 border border-emerald-500/30 rounded-lg px-3 py-2 pointer-events-none">
            <div>{dbg.fps} avg FPS · frame {dbg.frameMs.toFixed(1)} ms · draw {dbg.drawMs.toFixed(1)} ms · decode {dbg.decodeMs.toFixed(1)} ms</div>
            <div>canvas {dbg.canvas} · decoded {dbg.decoded} · memory {dbg.memoryMb.toFixed(0)} MB</div>
            <div>long tasks &gt;50 ms {dbg.longTasks} · {Array.from(perfFlags).join(', ') || 'baseline'}</div>
            <div>{dbg.bike} · frame {dbg.frame} · scrub {dbg.progress}% · {dbg.size.toUpperCase()} DPR {dbg.dpr}</div>
          </div>
        )}
      </div>

      <motion.div
        ref={statsRef}
        className="min-h-20 bg-[#0a0a0c] border-t border-white/10 flex items-center justify-center px-4 py-4"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={{ hidden: {}, visible: { transition: { staggerChildren: prefersReducedMotion ? 0 : 0.1 } } }}
      >
        <div className="max-w-7xl w-full grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <motion.div variants={{ hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 20 }, visible: { opacity: 1, y: 0, transition: { duration: prefersReducedMotion ? 0 : 0.45, ease: 'easeOut' } } }}>
            <div className="text-xl md:text-2xl font-bold text-white font-mono-numbers">
              {counters.bikes.toLocaleString()}+
            </div>
            <div className="text-[10px] theme-text-muted uppercase tracking-wider">{tHero.statBikes}</div>
          </motion.div>
          <motion.div variants={{ hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 20 }, visible: { opacity: 1, y: 0, transition: { duration: prefersReducedMotion ? 0 : 0.45, ease: 'easeOut' } } }}>
            <div className="text-xl md:text-2xl font-bold text-white font-mono-numbers">{counters.years}+</div>
            <div className="text-[10px] theme-text-muted uppercase tracking-wider">{tHero.statYears}</div>
          </motion.div>
          <motion.div variants={{ hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 20 }, visible: { opacity: 1, y: 0, transition: { duration: prefersReducedMotion ? 0 : 0.45, ease: 'easeOut' } } }}>
            <div className="text-xl md:text-2xl font-bold text-amber-500 font-mono-numbers">4.5 ★</div>
            <div className="text-[10px] theme-text-muted uppercase tracking-wider">{tHero.statRating}</div>
          </motion.div>
          <motion.div variants={{ hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 20 }, visible: { opacity: 1, y: 0, transition: { duration: prefersReducedMotion ? 0 : 0.45, ease: 'easeOut' } } }}>
            <div className="text-xl md:text-2xl font-bold text-emerald-500 font-mono-numbers">100%</div>
            <div className="text-[10px] theme-text-muted uppercase tracking-wider">{tHero.statParts}</div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}

function getFeatherGrads(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  colour: string,
  ref: { current: FeatherGrads | null }
): FeatherGrads {
  const key = `${W}x${H}:${colour}`;
  if (ref.current && ref.current.key === key) return ref.current;
  const t = ctx.createLinearGradient(0, 0, 0, H * 0.04);
  t.addColorStop(0, colour);
  t.addColorStop(1, 'rgba(0,0,0,0)');
  const b = ctx.createLinearGradient(0, H, 0, H * 0.96);
  b.addColorStop(0, colour);
  b.addColorStop(1, 'rgba(0,0,0,0)');
  const l = ctx.createLinearGradient(0, 0, W * 0.04, 0);
  l.addColorStop(0, colour);
  l.addColorStop(1, 'rgba(0,0,0,0)');
  const r = ctx.createLinearGradient(W, 0, W * 0.96, 0);
  r.addColorStop(0, colour);
  r.addColorStop(1, 'rgba(0,0,0,0)');
  const g = { key, top: t, bottom: b, left: l, right: r };
  ref.current = g;
  return g;
}
