import { useState } from 'react';
import { Share2, Heart, MessageCircle, ExternalLink, ThumbsUp, Check, Play } from 'lucide-react';
import { BUSINESS_INFO } from '../data/siteData';
import { Language, TRANSLATIONS } from '../data/translations';
import type { Theme } from '../App';

interface SocialProofProps {
  lang?: Language;
  theme?: Theme;
  siteImages?: Record<string, string>;
}

// Likes stay local to this feed; sharing uses the browser share sheet when available.
export default function SocialProofFeed({ lang = 'en', theme = 'dark', siteImages }: SocialProofProps) {
  const [likes, setLikes] = useState({ post1: 142, post2: 89, post3: 231, post4: 76 });
  const [userLiked, setUserLiked] = useState<Record<string, boolean>>({});
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  const t = TRANSLATIONS[lang].socialProof;
  const isDark = theme === 'dark';

  const toggleLike = (key: keyof typeof likes) => {
    setUserLiked(prev => ({ ...prev, [key]: !prev[key] }));
    setLikes(prev => ({
      ...prev,
      [key]: userLiked[key] ? prev[key] - 1 : prev[key] + 1
    }));
  };

  const handleShare = async (id: string, text: string) => {
    const url = `${window.location.origin}/#social-${id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Naresh Moto Dhore Workshop', text, url });
        return;
      } catch (err) {}
    }
    await navigator.clipboard.writeText(url);
    setCopiedLink(id);
    setTimeout(() => setCopiedLink(null), 2500);
  };

  const feedPosts = [
    {
      id: 'post1',
      tag: lang === 'np' ? 'वर्कशप गतिविधि' : 'Workshop Operations',
      user: '@nareshmotorepair',
      time: lang === 'np' ? 'आज' : 'Today',
      text: lang === 'np'
        ? 'वर्कशप बाहिर धेरै मोटरसाइकलसँग प्राविधिकहरू देखिन्छन्।'
        : 'Mechanics and riders gather beside several motorcycles outside the workshop.',
      img: '/images/workshop/live-feed-01.jpg',
      alt: 'People and motorcycles outside the workshop'
    },
    {
      id: 'post2',
      tag: lang === 'np' ? 'सर्भिस सामग्री' : 'Service Supplies',
      user: '@nareshmotorepair',
      time: lang === 'np' ? 'आज' : 'Today',
      text: lang === 'np'
        ? 'वर्कशपका सेल्फमा तेल र अन्य सर्भिस सामग्री राखिएका छन्।'
        : 'Workshop shelves hold oils and other service supplies.',
      img: '/images/workshop/live-feed-02.jpg',
      alt: 'Shelves stocked with workshop supplies'
    },
    {
      id: 'post3',
      tag: lang === 'np' ? 'वर्कशप मर्मत' : 'Workshop Repairs',
      user: '@nareshmotorepair',
      time: lang === 'np' ? 'आज' : 'Today',
      text: lang === 'np'
        ? 'एक प्राविधिक पसलभित्रका सामग्रीका सेल्फ नजिक काम गर्दैछन्।'
        : 'A mechanic works beside stocked shelves inside the shop.',
      img: '/images/workshop/live-feed-03.jpg',
      alt: 'Mechanic working beside workshop shelves'
    },
    {
      id: 'post4',
      tag: lang === 'np' ? 'सेवा क्षेत्र' : 'Service Area',
      user: '@nareshmotorepair',
      time: lang === 'np' ? 'आज' : 'Today',
      text: lang === 'np'
        ? 'बाहिर धेरै मोटरसाइकल सेवा क्षेत्र वरिपरि राखिएका छन्।'
        : 'Several motorcycles are lined up outside as service continues.',
      img: '/images/workshop/live-feed-04.jpg',
      alt: 'Motorcycles gathered outside the service area'
    }
  ];

  return (
    <section id="community" className={`py-20 border-t transition-colors duration-200 relative ${
      isDark ? 'bg-[#0c0e12] border-white/5 text-white' : 'bg-white border-black/8 text-neutral-900'
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

        {/* 3 Social Cards Grid */}
        <div data-reveal data-reveal-stagger className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {feedPosts.map((post) => (
            <div
              key={post.id}
              className={`ui-motion-card rounded-2xl border overflow-hidden flex flex-col justify-between shadow-xl transition-all ${
                isDark
                  ? 'bg-[#131622] border-white/10'
                  : 'bg-neutral-50/70 border-black/8 shadow-sm'
              }`}
            >
              <div className="relative aspect-[4/3] bg-neutral-900 overflow-hidden group">
                <img
                  src={siteImages?.[`feed-${post.id}`] || post.img}
                  alt={post.alt}
                  className="ui-image-zoom w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
                  width={400}
                  height={300}
                />
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-black/75 backdrop-blur-sm border border-white/10 text-[11px] font-bold text-white flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span>{post.tag}</span>
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className={`flex items-center justify-between text-xs mb-2 font-mono ${
                    isDark ? 'theme-text-muted' : 'theme-text-muted'
                  }`}>
                    <span>{post.user}</span>
                    <span>{post.time}</span>
                  </div>
                  <p className={`text-xs sm:text-sm leading-relaxed mb-4 ${
                    isDark ? 'text-neutral-300' : 'text-neutral-700'
                  }`}>
                    {post.text}
                  </p>
                </div>

                <div className={`pt-3 border-t flex items-center justify-between text-xs ${
                  isDark ? 'border-white/10' : 'border-black/8'
                }`}>
                  <button
                    onClick={() => toggleLike(post.id as any)}
                    className={`flex items-center gap-1.5 font-semibold transition-colors cursor-pointer ${
                      userLiked[post.id]
                        ? 'text-accent-text'
                        : isDark ? 'theme-text-muted hover:text-white' : 'theme-text-muted hover:text-neutral-900'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${userLiked[post.id] ? 'fill-[#ff3b19]' : ''}`} />
                    <span className="font-mono-numbers">{likes[post.id as keyof typeof likes]}</span>
                  </button>

                  <button
                    onClick={() => handleShare(post.id, post.text)}
                    className={`flex items-center gap-1 transition-colors cursor-pointer ${
                      isDark ? 'theme-text-muted hover:text-white' : 'theme-text-muted hover:text-neutral-900'
                    }`}
                  >
                    {copiedLink === post.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5" />}
                    <span>{copiedLink === post.id ? t.copied : t.share}</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
