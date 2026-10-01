import { useEffect, useState } from 'react';
import { Star, CheckCircle2, MessageSquare, ThumbsUp, Send, User, Share2, Check } from 'lucide-react';
import { REVIEWS_DATA, ReviewItem, BUSINESS_INFO } from '../data/siteData';
import { Language, TRANSLATIONS } from '../data/translations';
import type { Theme } from '../App';

interface ReviewsSectionProps {
  lang?: Language;
  theme?: Theme;
}

// Seed the list with bundled reviews, then merge in approved public reviews.
export default function ReviewsSection({ lang = 'en', theme = 'dark' }: ReviewsSectionProps) {
  const [reviews, setReviews] = useState<ReviewItem[]>(REVIEWS_DATA);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedRating, setSelectedRating] = useState(5);
  const [authorName, setAuthorName] = useState('');
  const [bikeModel, setBikeModel] = useState('');
  const [location, setLocation] = useState('');
  const [serviceType, setServiceType] = useState('General Servicing');
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [rateLimitCooldown, setRateLimitCooldown] = useState(false);
  const [honeypot, setHoneypot] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [copiedReviewId, setCopiedReviewId] = useState<string | null>(null);

  const t = TRANSLATIONS[lang].reviews;
  const isDark = theme === 'dark';

  useEffect(() => {
    // Keep the bundled list intact while pending or rejected API reviews are filtered out.
    let active = true;
    fetch('/api/public/data')
      .then((response) => response.ok ? response.json() : null)
      .then((data) => {
        if (!active || !Array.isArray(data?.reviews)) return;
        const approved = data.reviews.filter((review: ReviewItem & { status?: string }) => review.status === 'approved');
        const existingIds = new Set(approved.map((review: ReviewItem) => review.id));
        setReviews([...approved, ...REVIEWS_DATA.filter((review) => !existingIds.has(review.id))]);
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);

  const handleShareReview = async (rev: ReviewItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/#review-${rev.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Naresh Moto Review by ${rev.author}`,
          text: `"${rev.comment}" - ${rev.author} on ${rev.bikeModel}`,
          url
        });
        return;
      } catch (err) {}
    }
    await navigator.clipboard.writeText(url);
    setCopiedReviewId(rev.id);
    setTimeout(() => setCopiedReviewId(null), 2500);
  };

  const ratingCounts = {
    5: 118,
    4: 22,
    3: 5,
    2: 2,
    1: 1
  };
  const totalReviews = 148;

  // Run the local spam and cooldown checks before sending a review request.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (honeypot.trim()) {
      return;
    }

    if (rateLimitCooldown) {
      setErrorMsg(lang === 'np' ? 'कृपया केही सेकेन्ड पर्खनुहोस्।' : 'Please wait a few seconds before posting another review.');
      return;
    }

    if (!authorName.trim()) {
      setErrorMsg(lang === 'np' ? 'कृपया आफ्नो नाम लेख्नुहोस्।' : 'Please enter your name.');
      return;
    }
    if (!comment.trim() || comment.length < 10) {
      setErrorMsg(lang === 'np' ? 'कृपया कम्तिमा १० अक्षरको प्रतिक्रिया लेख्नुहोस्।' : 'Please write a short comment about your service experience (at least 10 characters).');
      return;
    }

    setErrorMsg('');
    setIsSubmitting(true);
    setRateLimitCooldown(true);

    try {
      const res = await fetch('/api/public/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          author: authorName.trim(),
          location: location.trim() || 'Dhore, Nepal',
          bikeModel: bikeModel.trim() || 'Two-Wheeler',
          rating: selectedRating,
          comment: comment.trim(),
          serviceType: serviceType,
          honeypot
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        setErrorMsg(errData.error || 'Unable to submit review at this time. Please try again.');
        setIsSubmitting(false);
        return;
      }

      setIsSuccess(true);

      // Reset form
      setAuthorName('');
      setBikeModel('');
      setLocation('');
      setComment('');
      setTimeout(() => {
        setIsSuccess(false);
        setShowReviewForm(false);
      }, 4000);
    } catch (err) {
      setErrorMsg('Failed to post review. Please check connection and try again.');
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setRateLimitCooldown(false), 8000);
    }
  };

  return (
    <section id="reviews" className={`py-20 fixed-ui-safe-section border-t transition-colors duration-200 relative ${
      isDark ? 'bg-[#0c0e12] border-white/5 text-white' : 'bg-white border-black/8 text-neutral-900'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div data-reveal className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="text-xs font-mono font-bold tracking-widest text-accent-text uppercase mb-2">
              {t.kicker}
            </div>
            <h2 className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${
              isDark ? 'text-white' : 'text-neutral-900'
            }`}>
              {t.headline}
            </h2>
            <p className="text-sm sm:text-base mt-2 max-w-2xl theme-text-muted">
              {t.subhead}
            </p>
          </div>

          <button
            onClick={() => setShowReviewForm(!showReviewForm)}
            className="px-5 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-white font-bold text-xs shadow-md shadow-[#ff3b19]/30 transition-all cursor-pointer whitespace-nowrap self-start md:self-auto"
          >
            {showReviewForm ? t.hideReview : t.writeReview}
          </button>
        </div>

        {/* Aggregate Ratings Bar */}
        <div className={`p-6 rounded-2xl border mb-12 grid grid-cols-1 md:grid-cols-12 gap-6 items-center ${
          isDark ? 'bg-[#131622] border-white/10 shadow-xl' : 'bg-neutral-50 border-black/8 shadow-sm'
        }`}>
          {/* Big Score */}
          <div className="md:col-span-4 text-center md:text-left flex flex-col items-center md:items-start">
            <div className="flex items-baseline gap-2">
              <span className={`text-5xl sm:text-6xl font-extrabold font-mono-numbers ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                4.5
              </span>
              <span className={`text-sm ${isDark ? 'theme-text-muted' : 'theme-text-muted'}`}>/ 5.0</span>
            </div>
            <div className="flex items-center my-2 text-amber-500">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`w-4 h-4 ${i < 4 ? 'fill-amber-400 text-amber-400' : 'fill-amber-400/50 text-amber-400'}`} />
              ))}
            </div>
            <p className={`text-xs ${isDark ? 'theme-text-muted' : 'text-neutral-600'}`}>
              Based on {totalReviews}+ verified local reviews in Dhore
            </p>
          </div>

          {/* Breakdown Bars */}
          <div className="md:col-span-8 space-y-2">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = ratingCounts[star as keyof typeof ratingCounts] || 0;
              const percent = Math.round((count / totalReviews) * 100);

              return (
                <div key={star} className="flex items-center gap-3 text-xs">
                  <span className={`w-8 font-mono flex items-center gap-1 ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                    <span>{star}</span>
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  </span>
                  <div className={`flex-1 h-2 rounded-full overflow-hidden ${isDark ? 'bg-neutral-800' : 'bg-neutral-200'}`}>
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-[#ff3b19] rounded-full"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <span className={`w-10 text-right font-mono font-mono-numbers ${isDark ? 'theme-text-muted' : 'theme-text-muted'}`}>
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Review Form (Toggleable) */}
        {showReviewForm && (
          <div className={`p-6 sm:p-8 rounded-2xl border mb-12 animate-fade-in ${
            isDark ? 'bg-[#151926] border-white/15' : 'bg-neutral-50 border-black/10'
          }`}>
            <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-neutral-900'}`}>
              {t.formTitle}
            </h3>

            {isSuccess ? (
              <div role="status" aria-live="polite" className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>{t.successToast}</span>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Honeypot hidden input */}
                <input
                  type="text"
                  name="honeypot"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                  className="hidden"
                  tabIndex={-1}
                  autoComplete="off"
                />

                {errorMsg && (
                  <div role="alert" className="p-3 rounded-xl bg-red-950/80 border border-red-500/40 text-red-300 text-xs">
                    {errorMsg}
                  </div>
                )}

                {/* Rating selection — ARIA radiogroup (keyboard operable) */}
                <div>
                  <div
                    role="radiogroup"
                    aria-label={t.ratingLabel}
                    className="flex items-center gap-1.5"
                  >
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        role="radio"
                        aria-checked={selectedRating === star}
                        aria-label={`${star} ${star === 1 ? 'star' : 'stars'}`}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setSelectedRating(star)}
                        className="p-1 cursor-pointer"
                      >
                        <Star
                          className={`w-6 h-6 transition-all ${
                            (hoverRating || selectedRating) >= star
                              ? 'fill-amber-400 text-amber-400 scale-110'
                              : isDark ? 'text-neutral-600' : 'text-neutral-300'
                          }`}
                        />
                      </button>
                    ))}
                    <span className={`ml-2 text-xs font-mono font-bold ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                      {selectedRating} / 5 Stars
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="rv-author" className={`block text-xs font-semibold mb-1 ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                      {t.authorLabel}
                    </label>
                    <input
                      id="rv-author"
                      name="author"
                      type="text"
                      placeholder={t.authorPlaceholder}
                      value={authorName}
                      onChange={(e) => setAuthorName(e.target.value)}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:border-[#ff3b19] focus:outline-none ${
                        isDark ? 'bg-neutral-900 border-white/15 text-white' : 'bg-white border-black/15 text-neutral-900'
                      }`}
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="rv-location" className={`block text-xs font-semibold mb-1 ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                      {t.locationLabel}
                    </label>
                    <input
                      id="rv-location"
                      name="location"
                      type="text"
                      placeholder={t.locationPlaceholder}
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:border-[#ff3b19] focus:outline-none ${
                        isDark ? 'bg-neutral-900 border-white/15 text-white' : 'bg-white border-black/15 text-neutral-900'
                      }`}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="rv-bike" className={`block text-xs font-semibold mb-1 ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                      {t.bikeLabel}
                    </label>
                    <input
                      id="rv-bike"
                      name="bikeModel"
                      type="text"
                      placeholder={t.bikePlaceholder}
                      value={bikeModel}
                      onChange={(e) => setBikeModel(e.target.value)}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:border-[#ff3b19] focus:outline-none ${
                        isDark ? 'bg-neutral-900 border-white/15 text-white' : 'bg-white border-black/15 text-neutral-900'
                      }`}
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="rv-service" className={`block text-xs font-semibold mb-1 ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                      {t.serviceLabel}
                    </label>
                    <select
                      id="rv-service"
                      name="serviceType"
                      value={serviceType}
                      onChange={(e) => setServiceType(e.target.value)}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:border-[#ff3b19] focus:outline-none ${
                        isDark ? 'bg-neutral-900 border-white/15 text-white' : 'bg-white border-black/15 text-neutral-900'
                      }`}
                    >
                      <option value="General Servicing">General Servicing & Tuning</option>
                      <option value="Engine & Starting">Engine Overhaul & Carburetion</option>
                      <option value="Brakes & Tyres">Disc Brakes & Tyre Replacement</option>
                      <option value="Electrical Work">12V Electricals & Battery</option>
                      <option value="Suspension & Shocks">Fork Overhaul & Suspension</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="rv-comment" className={`block text-xs font-semibold mb-1 ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                    {t.commentLabel}
                  </label>
                  <textarea
                    id="rv-comment"
                    name="comment"
                    rows={3}
                    placeholder={t.commentPlaceholder}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:border-[#ff3b19] focus:outline-none ${
                      isDark ? 'bg-neutral-900 border-white/15 text-white' : 'bg-white border-black/15 text-neutral-900'
                    }`}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  aria-busy={isSubmitting}
                  className="ui-submit-loading py-3 px-6 rounded-xl bg-accent hover:bg-accent-hover text-white text-xs font-bold shadow-md shadow-[#ff3b19]/30 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? t.submittingBtn : t.submitBtn}</span>
                </button>
              </form>
            )}
          </div>
        )}

        {/* Reviews Grid */}
        <div data-reveal data-reveal-stagger className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reviews.map((rev) => (
            <div
              key={rev.id}
              className={`ui-motion-card rounded-2xl border p-6 flex flex-col justify-between transition-all ${
                isDark
                  ? 'bg-[#131622] border-white/10 hover:border-white/20'
                  : 'bg-neutral-50/80 border-black/8 hover:border-black/15 shadow-sm'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-full bg-accent/10 border border-[#ff3b19]/30 flex items-center justify-center text-accent-text font-bold text-xs">
                      {rev.author.charAt(0)}
                    </div>
                    <div>
                      <h4 className={`text-sm font-bold leading-none ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                        {rev.author}
                      </h4>
                      <span className={`text-[11px] ${isDark ? 'theme-text-muted' : 'theme-text-muted'}`}>
                        {rev.location} · <span className="text-accent-text font-medium">{rev.bikeModel}</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center text-amber-500">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-neutral-600'}`}
                      />
                    ))}
                  </div>
                </div>

                <p className={`text-xs sm:text-sm leading-relaxed mb-4 ${
                  isDark ? 'text-neutral-300' : 'text-neutral-700'
                }`}>
                  "{rev.comment}"
                </p>
              </div>

              <div className={`pt-3 border-t flex items-center justify-between text-xs ${
                isDark ? 'border-white/5 theme-text-muted' : 'border-black/5 theme-text-muted'
              }`}>
                <span className="font-mono text-[11px]">{rev.serviceType}</span>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-mono-numbers">{rev.date}</span>
                  <button
                    onClick={(e) => handleShareReview(rev, e)}
                    className={`p-1 rounded transition-colors cursor-pointer ${
                      isDark ? 'hover:text-white hover:bg-white/5' : 'hover:text-neutral-900 hover:bg-black/5'
                    }`}
                    title="Share review"
                  >
                    {copiedReviewId === rev.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5" />}
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
