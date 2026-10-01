import { useState, useRef, useEffect } from 'react';
import { Eye, MoveHorizontal, ZoomIn, X, Camera, Share2, Check } from 'lucide-react';
import { Language, TRANSLATIONS } from '../data/translations';
import { WORKSHOP_GALLERY } from '../data/workshopGallery';
import type { Theme } from '../App';

interface GalleryData {
  splitBefore: string;
  splitAfter: string;
  siteImages?: Record<string, string>;
  images: Array<{ id: string; category: string; src: string; titleEn: string; titleNp: string; captionEn: string; captionNp: string; }>;
}

interface BeforeAfterGalleryProps {
  lang?: Language;
  theme?: Theme;
  data?: GalleryData;
}

// The clipped top image follows the pointer while the after image stays underneath.
export default function BeforeAfterGallery({ lang = 'en', theme = 'dark', data }: BeforeAfterGalleryProps) {
  const [sliderPos, setSliderPos] = useState(50);
  const [activeTab, setActiveTab] = useState<'all' | 'workshop' | 'parts' | 'repairs'>('all');
  const [lightboxImg, setLightboxImg] = useState<{ src: string; caption: string; id: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const t = TRANSLATIONS[lang].gallery;
  const isDark = theme === 'dark';

  useEffect(() => {
    if (!lightboxImg) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxImg(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxImg]);

  const handleShare = async (img: { id: string; title: string; caption: string }, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/#gallery-${img.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Naresh MOTO  - ${img.title}`,
          text: img.caption,
          url
        });
        return;
      } catch (err) {}
    }
    await navigator.clipboard.writeText(url);
    setCopiedId(img.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const offsetX = clientX - rect.left;
    const percentage = Math.max(5, Math.min(95, (offsetX / rect.width) * 100));
    setSliderPos(percentage);
  };

  const uploadedGalleryImages = (data?.images || []).filter(img =>
    img.src.startsWith('/images/') || img.src.startsWith('/uploads/')
  ).map(img => ({
    id: img.id,
    category: img.category,
    src: img.src,
    title: lang === 'np' ? img.titleNp : img.titleEn,
    caption: lang === 'np' ? img.captionNp : img.captionEn
  }));
  const galleryImages = [
    ...WORKSHOP_GALLERY.map(img => ({
      id: img.id,
      category: img.category,
      src: data?.siteImages?.[img.id] || img.src,
      title: img.alt,
      caption: img.description
    })),
    ...uploadedGalleryImages
  ];

  const filteredImages = galleryImages.filter(img => {
    if (activeTab === 'all') return true;
    if (img.category === activeTab) return true;
    if (activeTab === 'workshop') return img.category === 'Workshop Operations';
    if (activeTab === 'parts') return img.category === 'Service & Maintenance' || img.category === 'Electrical Repairs';
    return ['Diagnostics', 'Engine Work', 'Bike Restoration'].includes(img.category || '');
  });

  return (
    <section id="gallery" className={`py-20 border-t transition-colors duration-200 relative ${
      isDark ? 'bg-[#0c0e12] border-white/5 text-white' : 'bg-[#f7f8fa] border-black/8 text-neutral-900'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="text-xs font-mono font-bold tracking-widest text-accent-text uppercase mb-2">
            {t.kicker}
          </div>
          <h2 className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${
            isDark ? 'text-white' : 'text-neutral-900'
          }`}>
            {t.headline}
          </h2>
          <p className={`text-sm sm:text-base mt-2 ${
            isDark ? 'theme-text-muted' : 'text-neutral-600'
          }`}>
            {t.subhead}
          </p>
        </div>

        {/* 1. Interactive Before/After Split Comparison */}
        <div className="mb-16 max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-3 text-xs">
            <span className={`font-semibold uppercase tracking-wider flex items-center gap-1.5 ${
              isDark ? 'text-neutral-300' : 'text-neutral-700'
            }`}>
              <Eye className="w-4 h-4 text-accent-text" />
              <span>{lang === 'np' ? 'इन्जिन ओभरहल तुलना (स्लाइडर तान्नुहोस्):' : 'Engine Overhaul Split Comparison:'}</span>
            </span>
            <span className={`hidden sm:inline font-mono ${
              isDark ? 'theme-text-muted' : 'theme-text-muted'
            }`}>
              {t.dragHint}
            </span>
          </div>

          <div
            ref={containerRef}
            onMouseMove={handleMouseMove}
            onTouchMove={handleMouseMove}
            className={`relative h-72 sm:h-96 w-full rounded-2xl overflow-hidden cursor-ew-resize select-none border shadow-2xl ${
              isDark ? 'border-white/15 bg-neutral-900' : 'border-black/10 bg-neutral-200 shadow-md'
            }`}
          >
            {/* "After" Image (Background) */}
            <img
              src={data?.siteImages?.['before-after-after'] || '/images/before-after/after.png'}
              alt="After precision repair"
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
              decoding="async"
            />
            <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-emerald-600/90 backdrop-blur-md text-white font-bold text-xs shadow-lg font-mono">
              {t.afterLabel}
            </div>

            {/* "Before" Image (Clipped Overlay) */}
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ width: `${sliderPos}%` }}
            >
              <img
                src={data?.siteImages?.['before-after-before'] || '/images/before-after/before.png'}
                alt="Before repair condition"
                className="absolute inset-0 w-full h-full object-cover max-w-none filter grayscale contrast-125"
                style={{ width: containerRef.current ? `${containerRef.current.clientWidth}px` : '100%' }}
                loading="lazy"
                decoding="async"
              />
              <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-black/80 backdrop-blur-md text-white font-bold text-xs border border-white/20 font-mono">
                {t.beforeLabel}
              </div>
            </div>

            {/* Slider Divider Line & Thumb */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-white shadow-2xl pointer-events-none"
              style={{ left: `${sliderPos}%` }}
            >
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-accent border-2 border-white shadow-xl flex items-center justify-center text-white">
                <MoveHorizontal className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>

        {/* 2. Gallery Filter Tabs */}
        <div className="flex items-center justify-center gap-2 mb-8 overflow-x-auto pb-2">
          {[
            { id: 'all',      label: t.tabAll },
            { id: 'workshop', label: t.tabWorkshop },
            { id: 'parts',    label: t.tabParts },
            { id: 'repairs',  label: t.tabRepairs },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap border ${
                activeTab === tab.id
                  ? 'bg-accent border-[#ff3b19] text-white shadow-md shadow-[#ff3b19]/30'
                  : isDark
                    ? 'bg-[#141724] border-white/10 text-neutral-300 hover:text-white hover:border-white/25'
                    : 'bg-white border-black/10 text-neutral-700 hover:text-neutral-900 hover:border-black/20 shadow-sm'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 3. Grid of Workshop Gallery Images */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredImages.map((img, index) => (
            <div
              key={img.id}
              data-reveal=""
              style={index < 4 ? { '--reveal-delay': `${index * 45}ms` } as React.CSSProperties : undefined}
              onClick={() => setLightboxImg(img)}
              className={`ui-motion-card group rounded-2xl overflow-hidden border transition-all cursor-pointer flex flex-col justify-between ${
                isDark
                  ? 'bg-[#131622] border-white/10 hover:border-[#ff3b19]/50 shadow-xl'
                  : 'bg-white border-black/8 hover:border-[#e8340f]/30 hover:shadow-lg shadow-sm'
              }`}
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-neutral-900">
                <img
                  src={img.src}
                  alt={img.title}
                  className="ui-image-zoom w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <span className="p-3 rounded-full bg-white/20 backdrop-blur-md text-white">
                    <ZoomIn className="w-5 h-5" />
                  </span>
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className={`text-base font-bold mb-1.5 group-hover:text-accent-text transition-colors ${
                    isDark ? 'text-white' : 'text-neutral-900'
                  }`}>
                    {img.title}
                  </h3>
                  <p className={`text-xs leading-relaxed ${
                    isDark ? 'text-neutral-300' : 'text-neutral-600'
                  }`}>
                    {img.caption}
                  </p>
                </div>

                <div className={`mt-4 pt-3 border-t flex items-center justify-between text-xs ${
                  isDark ? 'border-white/10' : 'border-black/8'
                }`}>
                  {img.category && <span className={`text-[11px] font-mono uppercase ${
                    isDark ? 'theme-text-muted' : 'theme-text-muted'
                  }`}>
                    {img.category}
                  </span>}
                  <button
                    onClick={(e) => handleShare(img, e)}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      isDark ? 'theme-text-muted hover:text-white hover:bg-white/10' : 'theme-text-muted hover:text-neutral-900 hover:bg-black/5'
                    }`}
                    title="Share this photo"
                  >
                    {copiedId === img.id ? <Check className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 4. Lightbox View Modal */}
        {lightboxImg && (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in"
            onClick={() => setLightboxImg(null)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-4xl w-full rounded-2xl overflow-hidden bg-neutral-950 border border-white/20 shadow-2xl"
            >
              <button
                onClick={() => setLightboxImg(null)}
                className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/70 text-white hover:bg-black cursor-pointer"
                aria-label="Close lightbox"
              >
                <X className="w-6 h-6" />
              </button>

              <img
                src={lightboxImg.src}
                alt={lightboxImg.caption}
                className="w-full max-h-[75vh] object-contain bg-black"
              />

              <div className="p-5 bg-neutral-900 text-white text-xs sm:text-sm">
                <p className="font-bold text-base mb-1">{galleryImages.find(g => g.id === lightboxImg.id)?.title}</p>
                <p className="text-neutral-300">{lightboxImg.caption}</p>
              </div>
            </div>
          </div>
        )}

      </div>
    </section>
  );
}
