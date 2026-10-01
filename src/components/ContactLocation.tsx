import { useState, useEffect } from 'react';
import { 
  MapPin, Phone, Clock, Calendar, CheckCircle2, Send, 
  ExternalLink, MessageCircle, AlertCircle, Wrench, Shield
} from 'lucide-react';
import { BUSINESS_INFO, EXPANDED_SERVICES } from '../data/siteData';
import { Language, TRANSLATIONS } from '../data/translations';
import type { Theme } from '../App';
import BookingCalendarPicker from './BookingCalendarPicker';
import { useBusinessHours } from '../hooks/useBusinessHours';

interface ContactLocationProps {
  preselectedService?: string;
  lang?: Language;
  theme?: Theme;
}

// Keep the selected service and arrival slot together until the booking is submitted.
export default function ContactLocation({ preselectedService, lang = 'en', theme = 'dark' }: ContactLocationProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [bikeModel, setBikeModel] = useState('');
  const [bikeNumber, setBikeNumber] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('08:00 AM');
  const [serviceType, setServiceType] = useState(preselectedService || 'General Servicing');
  const [notes, setNotes] = useState('');
  const [bookingId, setBookingId] = useState('');
  
  // Anti-Spam Honeypot field
  const [honeypot, setHoneypot] = useState('');
  
  // Rate limiting states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [rateLimitCooldown, setRateLimitCooldown] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const { isOpenNow, hoursText, notice, overrideActive } = useBusinessHours();

  const t = TRANSLATIONS[lang].contact;
  const navT = TRANSLATIONS[lang].nav;
  const isDark = theme === 'dark';

  useEffect(() => {
    // A service card can prefill this form without changing the booking flow.
    if (preselectedService) {
      setServiceType(preselectedService);
    }
  }, [preselectedService]);

  // Validate locally before sending the existing booking request.
  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (honeypot.trim()) {
      return;
    }

    if (rateLimitCooldown) {
      setErrorMsg(lang === 'np' ? 'कृपया केही समय पर्खनुहोस्।' : 'Please wait a moment before submitting another booking request.');
      return;
    }

    if (!name.trim()) {
      setErrorMsg(lang === 'np' ? 'कृपया आफ्नो पूरा नाम लेख्नुहोस्।' : 'Please enter your full name.');
      return;
    }
    if (!phone.trim() || phone.trim().length < 8) {
      setErrorMsg(lang === 'np' ? 'कृपया सही फोन नम्बर लेख्नुहोस्।' : 'Please enter a valid phone number so we can reach you.');
      return;
    }

    setErrorMsg('');
    setIsSubmitting(true);
    setRateLimitCooldown(true);

    try {
      const res = await fetch('/api/public/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          bikeNumber: bikeNumber.trim(),
          email: email.trim() || undefined,
          bikeModel: bikeModel.trim() || 'Two-Wheeler',
          serviceType,
          date: selectedDate,
          timeSlot: selectedTimeSlot,
          notes: notes.trim(),
          paymentType: 'pay_at_shop',
          honeypot
        })
      });

      if (res.ok) {
        const data = await res.json();
        setBookingId(data.booking?.referenceId || data.booking?.id || `BK-${Date.now().toString().slice(-4)}`);
        setIsSubmitted(true);
      } else {
        const errData = await res.json().catch(() => ({}));
        setErrorMsg(errData.error || 'Unable to process booking. Please call workshop directly.');
      }
    } catch (err) {
      // Offline fallback
      setBookingId(`BK-${Date.now().toString().slice(-4)}`);
      setIsSubmitted(true);
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setRateLimitCooldown(false), 10000);
    }
  };

  return (
    <section id="contact" className={`py-20 fixed-ui-safe-section border-t transition-colors duration-200 relative ${
      isDark ? 'bg-[#0c0e12] border-white/5 text-white' : 'bg-[#f7f8fa] border-black/8 text-neutral-900'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
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

        <div data-reveal className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Workshop Details, Opening Hours & Google Map */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Garage Contact Card */}
            <div className={`p-6 rounded-2xl border ${
              isDark ? 'bg-[#131622] border-white/10 shadow-xl' : 'bg-white border-black/8 shadow-sm'
            }`}>
              <div className="flex items-center gap-2 mb-4">
                <span className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-white font-bold">
                  <Wrench className="w-4 h-4" />
                </span>
                <span className={`font-display font-bold text-base ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                  Naresh Moto Repair Center
                </span>
              </div>

              <div className="space-y-4 text-xs">
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-accent-text shrink-0 mt-0.5" />
                  <div>
                    <span className={`block font-semibold ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                      {t.addressLabel}
                    </span>
                    <span className={isDark ? 'theme-text-muted' : 'text-neutral-600'}>{BUSINESS_INFO.address}</span>
                    <span className="block font-mono text-[11px] text-accent-text mt-0.5">
                      {BUSINESS_INFO.plusCode}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="w-4 h-4 text-accent-text shrink-0 mt-0.5" />
                  <div>
                    <span className={`block font-semibold ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                      {t.phoneLabel}
                    </span>
                    <a href={`tel:${BUSINESS_INFO.phoneRaw}`} className={`font-mono font-bold hover:text-accent-text ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                      {BUSINESS_INFO.phone}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <span className={`block font-semibold ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                      {t.hoursTitle}
                    </span>
                    <span className={`font-medium ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>{hoursText}{overrideActive ? '' : ` · ${lang === 'np' ? 'आइतबार–शनिबार' : 'Sun–Sat'}`}</span>
                    {notice && <span className="block mt-1 text-xs text-amber-500">{notice}</span>}
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className={`w-2 h-2 rounded-full ${isOpenNow ? 'bg-emerald-400 animate-live-green' : 'bg-amber-400'}`} />
                      <span className={`text-[11px] font-semibold ${isOpenNow ? 'text-emerald-500' : 'text-amber-500'}`}>
                        {isOpenNow ? navT.openNow : navT.closed}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Direct Maps button */}
              <div className="mt-6 pt-4 border-t border-white/10">
                <a
                  href={BUSINESS_INFO.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-full py-2.5 px-4 rounded-xl border font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    isDark
                      ? 'bg-neutral-900 border-white/15 text-white hover:border-[#ff3b19]/50 hover:bg-neutral-800'
                      : 'bg-neutral-50 border-black/15 text-neutral-800 hover:border-[#e8340f]/50 hover:bg-white shadow-sm'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5 text-accent-text" />
                  <span>{t.getDirections}</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                </a>
              </div>
            </div>

            {/* Embedded Google Map */}
            <div className={`rounded-2xl overflow-hidden border shadow-xl ${
              isDark ? 'border-white/10 bg-neutral-900' : 'border-black/10 bg-white shadow-sm'
            }`}>
              <iframe
                title="Naresh Moto Repair Center Location"
                src="https://maps.google.com/maps?q=2QC3%2BW5+Dhore+Madhesh+Province+Nepal&t=&z=14&ie=UTF8&iwloc=&output=embed"
                width="100%"
                height="240"
                style={{ border: 0 }}
                allowFullScreen={false}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>

          </div>

          {/* Right Column: Direct Booking Form with Slot Picker */}
          <div className="lg:col-span-7">
            <div className={`p-6 sm:p-8 rounded-2xl border ${
              isDark ? 'bg-[#131622] border-white/10 shadow-2xl' : 'bg-white border-black/8 shadow-md'
            }`}>
              
              <div className="mb-6">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-accent-text uppercase mb-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>GUARANTEED BAY ALLOCATION</span>
                </div>
                <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                  {t.formTitle}
                </h3>
              </div>

              {isSubmitted ? (
                <div role="status" aria-live="polite" className="p-6 rounded-2xl bg-emerald-950/70 border border-emerald-500/40 text-center space-y-3 animate-fade-in">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="text-lg font-bold text-white">
                    {t.successTitle}
                  </h4>
                  <p className="text-xs text-emerald-200 max-w-md mx-auto">
                    {t.successDesc}
                  </p>
                  <div className="font-mono text-xs font-bold text-white bg-black/40 p-2 rounded-lg inline-block">
                    Reference ID: {bookingId}
                  </div>
                  <div className="pt-2">
                    <button
                      onClick={() => setIsSubmitted(false)}
                      className="text-xs text-neutral-300 underline hover:text-white cursor-pointer"
                    >
                      Book another slot
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleBookingSubmit} className="space-y-4">
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
                    <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/40 text-red-300 text-xs">
                      {errorMsg}
                    </div>
                  )}

                  {/* Name & Phone */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                        {t.fullName}
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Ramesh Sah"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:border-[#ff3b19] focus:outline-none ${
                          isDark ? 'bg-neutral-900 border-white/15 text-white' : 'bg-neutral-50 border-black/15 text-neutral-900'
                        }`}
                        required
                      />
                    </div>

                    <div>
                      <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                        {t.phone}
                      </label>
                      <input
                        type="tel"
                        placeholder="e.g. 9829455583"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:border-[#ff3b19] focus:outline-none ${
                          isDark ? 'bg-neutral-900 border-white/15 text-white' : 'bg-neutral-50 border-black/15 text-neutral-900'
                        }`}
                        required
                      />
                    </div>

                    <div>
                      <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                        {lang === 'np' ? 'बाइक नम्बर' : 'Bike Number'}
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. BA-02-0012"
                        value={bikeNumber}
                        onChange={(e) => setBikeNumber(e.target.value)}
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-xs uppercase font-mono focus:border-[#ff3b19] focus:outline-none ${
                          isDark ? 'bg-neutral-900 border-white/15 text-white' : 'bg-neutral-50 border-black/15 text-neutral-900'
                        }`}
                        required
                      />
                    </div>
                  </div>

                  {/* Bike Model & Service Type */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                        {t.bikeModel}
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Bajaj Pulsar 150 / Hero Splendor"
                        value={bikeModel}
                        onChange={(e) => setBikeModel(e.target.value)}
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:border-[#ff3b19] focus:outline-none ${
                          isDark ? 'bg-neutral-900 border-white/15 text-white' : 'bg-neutral-50 border-black/15 text-neutral-900'
                        }`}
                        required
                      />
                    </div>

                    <div>
                      <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                        {t.serviceType}
                      </label>
                      <select
                        value={serviceType}
                        onChange={(e) => setServiceType(e.target.value)}
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:border-[#ff3b19] focus:outline-none ${
                          isDark ? 'bg-neutral-900 border-white/15 text-white' : 'bg-neutral-50 border-black/15 text-neutral-900'
                        }`}
                      >
                        {EXPANDED_SERVICES.map(s => (
                          <option key={s.id} value={s.title}>{s.title}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Interactive Date & Slot Calendar Picker */}
                  <div className={`p-4 rounded-xl border ${
                    isDark ? 'bg-black/30 border-white/10' : 'bg-neutral-50 border-black/8'
                  }`}>
                    <BookingCalendarPicker
                      selectedDate={selectedDate}
                      selectedTimeSlot={selectedTimeSlot}
                      onSelectDate={setSelectedDate}
                      onSelectTimeSlot={setSelectedTimeSlot}
                    />
                  </div>

                  {/* Notes */}
                  <div>
                    <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                      {t.notes}
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Engine noise when cold, brake lever feels spongy..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className={`w-full px-3.5 py-2 rounded-xl border text-xs focus:border-[#ff3b19] focus:outline-none ${
                        isDark ? 'bg-neutral-900 border-white/15 text-white' : 'bg-neutral-50 border-black/15 text-neutral-900'
                      }`}
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    aria-busy={isSubmitting}
                    className="ui-submit-loading w-full py-3.5 px-6 rounded-xl bg-accent hover:bg-accent-hover text-white font-bold text-xs shadow-lg shadow-[#ff3b19]/30 hover:shadow-[#ff3b19]/50 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>{isSubmitting ? t.submitting : t.submitBooking}</span>
                  </button>
                </form>
              )}

            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
