import { useState } from 'react';
import { BookOpen, Clock, Calendar, ArrowRight, Share2, Check, Sparkles, X } from 'lucide-react';
import { BLOG_POSTS, BlogPost, Language, TRANSLATIONS } from '../data/translations';
import type { Theme } from '../App';

interface BlogSectionProps {
  lang: Language;
  theme?: Theme;
  onOpenBooking: (serviceName?: string) => void;
}

// Keep article details in the current page so reading a post doesn't change routes.
export default function BlogSection({ lang, theme = 'dark', onOpenBooking }: BlogSectionProps) {
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  const t = TRANSLATIONS[lang].blog;
  const isDark = theme === 'dark';

  // Fall back to copying the same in-page link when native sharing isn't available.
  const handleShare = async (post: BlogPost, e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/#blog-${post.slug}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: lang === 'np' ? post.titleNp : post.titleEn,
          text: lang === 'np' ? post.excerptNp : post.excerptEn,
          url: shareUrl
        });
        return;
      } catch (err) {}
    }
    await navigator.clipboard.writeText(shareUrl);
    setCopiedSlug(post.slug);
    setTimeout(() => setCopiedSlug(null), 2500);
  };

  return (
    <section id="blog" className={`py-20 border-t transition-colors duration-200 relative ${
      isDark ? 'bg-[#0d1017] border-white/5 text-white' : 'bg-[#f7f8fa] border-black/8 text-neutral-900'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
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

        {/* 4 Cards Grid */}
        <div data-reveal data-reveal-stagger className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {BLOG_POSTS.map((post) => {
            const title = lang === 'np' ? post.titleNp : post.titleEn;
            const excerpt = lang === 'np' ? post.excerptNp : post.excerptEn;

            return (
              <article
                key={post.id}
                onClick={() => setSelectedPost(post)}
                className={`ui-motion-card rounded-2xl border p-5 flex flex-col justify-between transition-all cursor-pointer group shadow-lg ${
                  isDark
                    ? 'bg-[#131622] border-white/10 hover:border-[#ff3b19]/50 hover:bg-[#161a28]'
                    : 'bg-white border-black/8 hover:border-[#e8340f]/40 hover:shadow-xl shadow-sm'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3 text-xs">
                    <span className="font-mono text-[10px] font-bold text-accent-text bg-accent/10 px-2 py-0.5 rounded border border-[#ff3b19]/20 uppercase">
                      {post.category}
                    </span>
                    <span className={`text-[11px] font-mono-numbers flex items-center gap-1 ${
                      isDark ? 'theme-text-muted' : 'theme-text-muted'
                    }`}>
                      <Clock className="w-3 h-3" />
                      <span>{post.readTime}</span>
                    </span>
                  </div>

                  <h3 className={`text-base font-bold mb-2 leading-snug group-hover:text-accent-text transition-colors ${
                    isDark ? 'text-white' : 'text-neutral-900'
                  }`}>
                    {title}
                  </h3>

                  <p className={`text-xs leading-relaxed line-clamp-3 mb-4 ${
                    isDark ? 'text-neutral-300' : 'text-neutral-600'
                  }`}>
                    {excerpt}
                  </p>
                </div>

                <div className={`pt-3 border-t flex items-center justify-between ${
                  isDark ? 'border-white/10' : 'border-black/8'
                }`}>
                  <span className="text-xs font-bold text-accent-text flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    <span>{t.readMore}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>

                  <button
                    onClick={(e) => handleShare(post, e)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      isDark ? 'theme-text-muted hover:text-white hover:bg-white/10' : 'theme-text-muted hover:text-neutral-900 hover:bg-black/5'
                    }`}
                    title={copiedSlug === post.slug ? 'Link copied!' : 'Share article'}
                  >
                    {copiedSlug === post.slug ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Share2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        {/* Modal for Reading Full Post */}
        {selectedPost && (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-modal flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in"
            onClick={() => setSelectedPost(null)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className={`relative w-full max-w-2xl rounded-2xl border p-6 sm:p-8 shadow-2xl max-h-[85vh] overflow-y-auto animate-view-in ${
                isDark ? 'bg-[#141824] border-white/15 text-white' : 'bg-white border-black/10 text-neutral-900'
              }`}
              data-lenis-prevent
            >
              <button
                onClick={() => setSelectedPost(null)}
                className={`absolute top-4 right-4 p-1.5 rounded-lg cursor-pointer ${
                  isDark ? 'theme-text-muted hover:text-white hover:bg-white/10' : 'theme-text-muted hover:text-neutral-900 hover:bg-black/5'
                }`}
                aria-label="Close article"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 text-xs mb-2">
                <span className="font-mono text-xs font-bold text-accent-text uppercase">
                  {selectedPost.category}
                </span>
                <span className="theme-text-muted">·</span>
                <span className={`flex items-center gap-1 font-mono-numbers ${isDark ? 'theme-text-muted' : 'theme-text-muted'}`}>
                  <Clock className="w-3 h-3 text-accent-text" />
                  <span>{selectedPost.readTime}</span>
                </span>
              </div>

              <h2 className={`text-xl sm:text-2xl font-extrabold mb-4 leading-tight ${
                isDark ? 'text-white' : 'text-neutral-900'
              }`}>
                {lang === 'np' ? selectedPost.titleNp : selectedPost.titleEn}
              </h2>

              <div className={`space-y-3 text-xs sm:text-sm leading-relaxed mb-6 ${
                isDark ? 'text-neutral-300' : 'text-neutral-700'
              }`}>
                {(lang === 'np' ? selectedPost.contentNp : selectedPost.contentEn).map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>

              <div className={`pt-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4 ${
                isDark ? 'border-white/10' : 'border-black/10'
              }`}>
                <div className={`text-xs ${isDark ? 'theme-text-muted' : 'theme-text-muted'}`}>
                  <span>{t.writtenBy}</span>
                </div>
                <button
                  onClick={() => {
                    const postTitle = lang === 'np' ? selectedPost.titleNp : selectedPost.titleEn;
                    setSelectedPost(null);
                    onOpenBooking(postTitle);
                  }}
                  className="w-full sm:w-auto py-2.5 px-5 rounded-xl bg-accent hover:bg-accent-hover text-white font-bold text-xs shadow-md shadow-[#ff3b19]/30 transition-all cursor-pointer"
                >
                  {t.bookAssociated}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </section>
  );
}
