import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Award, ShieldAlert, HeartHandshake, CheckCircle2, MapPin, Wrench, Quote, Sparkles } from 'lucide-react';
import { BUSINESS_INFO, TEAM_MEMBERS } from '../data/siteData';
import { Language, TRANSLATIONS } from '../data/translations';
import type { Theme } from '../App';
import { fetchWithTimeout } from '../utils/fetchWithTimeout';
import ScrollReveal from './ui/ScrollReveal';
import LuxuryCard from './ui/LuxuryCard';

interface AboutTeamProps {
  lang?: Language;
  theme?: Theme;
  siteImages?: Record<string, string>;
}

// Show bundled profiles first so the story remains available during API refreshes.
export default function AboutTeam({ lang = 'en', theme = 'dark', siteImages }: AboutTeamProps) {
  const t = TRANSLATIONS[lang].aboutTeam;
  const teamDict = TRANSLATIONS[lang].teamData as Record<string, any>;
  const isDark = theme === 'dark';
  const prefersReducedMotion = useReducedMotion();
  const [members, setMembers] = useState(TEAM_MEMBERS);
  useEffect(() => {
    // Avoid overlapping refreshes while also retrying when the page becomes active again.
    let active = true;
    let requestInFlight = false;
    const loadMechanics = async () => {
      if (requestInFlight) return;
      requestInFlight = true;
      try {
        const response = await fetchWithTimeout('/api/public/data', { cache: 'no-store' });
        if (!response.ok) return;
        const data = await response.json();
        if (active && Array.isArray(data?.mechanics)) setMembers(data.mechanics);
      } catch {
        // Keep the bundled team profiles visible while the API is unavailable.
      } finally {
        requestInFlight = false;
      }
    };

    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') void loadMechanics();
    };
    void loadMechanics();
    const refreshTimer = window.setInterval(() => void loadMechanics(), 15_000);
    document.addEventListener('visibilitychange', refreshWhenVisible);
    window.addEventListener('focus', refreshWhenVisible);
    return () => {
      active = false;
      window.clearInterval(refreshTimer);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
      window.removeEventListener('focus', refreshWhenVisible);
    };
  }, []);

  const founder = members.find(m => m.isFounder) || members[0];
  const crew = members.filter(m => !m.isFounder);

  if (!founder) return null;

  return (
    <section id="about" className={`py-20 border-t transition-colors duration-200 relative ${
      isDark ? 'bg-[#0c0e12] border-white/5 text-white' : 'bg-[#f7f8fa] border-black/8 text-neutral-900'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Workshop Story Row */}
        <div data-reveal className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center mb-16">
          
          {/* Left Column: Visual Asset & Garage Scene */}
          <div className="lg:col-span-5">
            <div className={`relative rounded-3xl overflow-hidden border shadow-2xl ${
              isDark ? 'border-white/10 bg-neutral-900' : 'border-black/10 bg-neutral-100 shadow-md'
            }`}>
              <img
                src={siteImages?.[`team-${founder.id}`] || founder.photo}
                alt={`${founder.name} — ${founder.role}`}
                className="w-full h-80 sm:h-96 object-cover"
                referrerPolicy="no-referrer"
                onError={(event) => {
                  event.currentTarget.onerror = null;
                  event.currentTarget.src = '/icon.svg';
                  event.currentTarget.className = 'w-full h-80 sm:h-96 object-contain p-16';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
              
              <div className="absolute bottom-6 left-6 right-6 p-4 rounded-2xl bg-black/80 backdrop-blur-md border border-white/10 text-white">
                <div className="text-xs font-mono font-bold text-accent-text uppercase">
                  {t.leadMechanic}
                </div>
                <div className="text-base font-bold mt-0.5">
                  {founder.name} · {founder.role}
                </div>
                <p className="text-xs text-neutral-300 mt-1">
                  {founder.experienceYears}+ years serving two-wheeler riders across Dhore, Pakahamainpur, and the Dhore trade corridor.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Story & Philosophy */}
          <div className="lg:col-span-7">
            <div className="text-xs font-mono font-bold tracking-widest text-accent-text uppercase mb-2">
              {t.kicker}
            </div>
            
            <h2 className={`text-3xl sm:text-4xl font-extrabold tracking-tight mb-5 ${
              isDark ? 'text-white' : 'text-neutral-900'
            }`}>
              {t.headline}
            </h2>

            <p className={`text-sm sm:text-base leading-relaxed mb-4 ${
              isDark ? 'text-neutral-300' : 'text-neutral-600'
            }`}>
              {t.storyP1}
            </p>

            <p className={`text-sm sm:text-base leading-relaxed mb-6 ${
              isDark ? 'text-neutral-300' : 'text-neutral-600'
            }`}>
              {t.storyP2}
            </p>

            {/* Core Values */}
            <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t ${
              isDark ? 'border-white/10' : 'border-black/10'
            }`}>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-accent/10 border border-[#ff3b19]/30 flex items-center justify-center text-accent-text shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                    {t.zeroDuplicates}
                  </h4>
                  <p className={`text-xs mt-0.5 ${isDark ? 'theme-text-muted' : 'text-neutral-600'}`}>
                    {t.zeroDuplicatesDesc}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-accent/10 border border-[#ff3b19]/30 flex items-center justify-center text-accent-text shrink-0 mt-0.5">
                  <HeartHandshake className="w-4 h-4" />
                </div>
                <div>
                  <h4 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                    {t.communityFirst}
                  </h4>
                  <p className={`text-xs mt-0.5 ${isDark ? 'theme-text-muted' : 'text-neutral-600'}`}>
                    {t.communityFirstDesc}
                  </p>
                </div>
              </div>
            </div>

            <figure className={`mt-6 overflow-hidden rounded-2xl border ${isDark ? 'border-white/10' : 'border-black/10'}`}>
              <img
                src={siteImages?.['about-workshop'] || '/images/workshop/gallery-21.jpg'}
                alt="People and motorcycles gathered outside the workshop service area"
                className="aspect-[16/8] w-full object-cover"
                loading="lazy"
                decoding="async"
              />
              <figcaption className={`px-3 py-2 text-xs ${isDark ? 'theme-text-muted' : 'text-neutral-600'}`}>
                Motorcycles and people outside the service area.
              </figcaption>
            </figure>

          </div>

        </div>

        {/* Dedicated "Meet the Team" Section */}
        <div className={`pt-12 border-t ${isDark ? 'border-white/10' : 'border-black/10'}`}>
          <ScrollReveal direction="up" delay={0} className="text-center max-w-2xl mx-auto mb-12">
            <div className="text-xs font-mono font-bold tracking-widest text-accent-text uppercase mb-2">
              {t.meetTeamKicker}
            </div>
            <h3 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
              isDark ? 'text-white' : 'text-neutral-900'
            }`}>
              {t.meetTeamHeadline}
            </h3>
          </ScrollReveal>

          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.12 }}
            variants={{ hidden: {}, visible: { transition: { staggerChildren: prefersReducedMotion ? 0 : 0.15 } } }}
          >
            {members.map((member, index) => {
              const loc = teamDict?.[member.id] || {};
              const bundledMember = TEAM_MEMBERS.find((item) => item.id === member.id);
              const nameWasEdited = !bundledMember || member.name !== bundledMember.name;
              const roleWasEdited = !bundledMember || member.role !== bundledMember.role;
              const mName = nameWasEdited ? member.name : loc.name || member.name;
              const mRole = lang === 'np'
                ? member.roleNp || loc.role || member.role
                : roleWasEdited ? member.role : loc.role || member.role;
              const mSpec = lang === 'np' ? member.specialtyNp || loc.specialty || member.specialty : member.specialtyEn || loc.specialty || member.specialty;
              const mCert = loc.certifiedIn || member.certifiedIn;

              return (
                <ScrollReveal
                  key={member.id}
                  direction="up"
                  delay={prefersReducedMotion ? 0 : index * 0.1}
                  className={member.isFounder ? 'sm:col-span-2 lg:col-span-2' : undefined}
                >
                  <LuxuryCard className={`p-5 flex flex-col justify-between group ${
                    isDark
                      ? 'bg-[#131622] border-white/10 text-white'
                      : 'bg-white border-black/10 text-neutral-950'
                  }`}>
                  <div>
                    <div className="relative h-48 -mx-5 -mt-5 mb-4 overflow-hidden rounded-t-2xl bg-neutral-900">
                      <img
                        src={siteImages?.[`team-${member.id}`] || member.photo || '/icon.svg'}
                        alt={mName}
                        className="ui-image-zoom w-full h-full object-cover"
                        loading="lazy"
                        onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = '/icon.svg'; event.currentTarget.className = 'w-full h-full object-contain p-12 opacity-60'; }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                      <div className="absolute bottom-2.5 left-3 right-3 text-white">
                        {member.isFounder && <span className="mb-1 block text-[10px] font-bold uppercase text-white">{lang === 'np' ? 'विशेषज्ञ मास्टर प्राविधिक' : 'Featured Master Technician'}</span>}
                        <span className="text-[10px] font-mono font-bold uppercase text-accent-text">
                          {member.experienceYears}+ {lang === 'np' ? 'वर्ष अनुभव' : 'Yrs Experience'}
                        </span>
                      </div>
                    </div>

                    <h4 className={`text-base font-bold mb-0.5 group-hover:text-accent-text transition-colors ${
                      isDark ? 'text-white' : 'text-neutral-900'
                    }`}>
                      {mName}
                    </h4>

                    <div className="text-xs font-semibold text-accent-text mb-2">
                      {mRole}
                    </div>

                    <p className={`text-xs leading-relaxed mb-3 ${
                      isDark ? 'text-neutral-300' : 'text-neutral-600'
                    }`}>
                      {mSpec}
                    </p>
                  </div>

                  <div className={`pt-3 border-t text-[11px] flex items-center gap-1.5 ${
                    isDark ? 'border-white/5 theme-text-muted' : 'border-black/5 theme-text-muted'
                  }`}>
                    <Award className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span className="truncate">{mCert}</span>
                  </div>
                  </LuxuryCard>
                </ScrollReveal>
              );
            })}
          </motion.div>
        </div>

      </div>
    </section>
  );
}
