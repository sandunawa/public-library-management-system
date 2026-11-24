import React from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  ArrowRight,
  Users,
  Clock,
  Radio,
} from 'lucide-react';
import { landingEn } from '@/i18n/landing/en';
import { landingSi } from '@/i18n/landing/si';

import heroBgImage from '/images/enivac-hero-bg.jpg?url';

interface HeroSectionProps {
  lang: 'en' | 'si';
  onOpenLogin: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ lang, onOpenLogin }) => {
  const t = lang === 'en' ? landingEn.hero : landingSi.hero;

  return (
    <section
      className="relative min-h-[92vh] pt-32 pb-20 flex flex-col justify-center overflow-hidden bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: `url(${heroBgImage})`,
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10">
        <div className="max-w-3xl space-y-7 text-left p-6 sm:p-8 rounded-3xl bg-white/70 backdrop-blur-md border border-white/60 shadow-xl">
          {/* Eyebrow Pill */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-violet-200 shadow-sm"
          >
            <Sparkles className="w-4 h-4 text-[#4F35E8]" />
            <span className="text-xs font-bold text-[#1E0FA8] tracking-wide uppercase">
              {t.eyebrow}
            </span>
          </motion.div>

          {/* Giant Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-6xl xl:text-7xl font-extrabold tracking-tight text-slate-900 font-heading leading-[1.12]"
          >
            {t.headlineMain}{' '}
            <span className="bg-gradient-to-r from-[#1E0FA8] via-[#4F35E8] to-[#1E0FA8] bg-clip-text text-transparent">
              {t.headlineAccent}
            </span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-base sm:text-xl text-slate-800 max-w-2xl font-medium leading-relaxed"
          >
            {t.subheadline}
          </motion.p>

          {/* Main Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-wrap items-center gap-4 pt-2"
          >
            <button
              onClick={onOpenLogin}
              className="px-8 py-4 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-[#1E0FA8] via-[#4F35E8] to-[#1E0FA8] hover:shadow-xl hover:shadow-[#4F35E8]/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 group"
            >
              <span>{t.primaryCta}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <a
              href="#contact"
              className="px-8 py-4 rounded-2xl text-sm font-bold text-slate-800 bg-white border border-slate-300 hover:bg-slate-50 hover:border-[#4F35E8] shadow-sm transition-all"
            >
              {t.secondaryCta}
            </a>
          </motion.div>
        </div>

        {/* Live Operational Ticker & Info Glass Cards — Premium Redesign */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: Live Occupancy */}
          <motion.div
            whileHover={{ y: -5, scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="group relative p-5 rounded-3xl bg-white/95 backdrop-blur-xl border border-emerald-200/80 shadow-lg shadow-emerald-900/5 hover:shadow-xl hover:shadow-emerald-500/10 hover:border-emerald-400 transition-all text-left flex items-center gap-4 overflow-hidden"
          >
            {/* Ambient background glow on hover */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-100/50 rounded-full blur-2xl pointer-events-none group-hover:scale-150 transition-transform duration-500" />
            <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/30 shrink-0 group-hover:rotate-6 transition-transform">
              <Users className="w-6 h-6" />
            </div>
            <div className="relative z-10 flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-sm font-extrabold text-slate-900 group-hover:text-emerald-700 transition-colors">
                  {t.liveOccupancy}
                </span>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
              </div>
              <span className="text-xs text-slate-500 font-medium">Automated gate counter active</span>
            </div>
          </motion.div>

          {/* Card 2: Today's Library Hours */}
          <motion.div
            whileHover={{ y: -5, scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="group relative p-5 rounded-3xl bg-white/95 backdrop-blur-xl border border-indigo-200/80 shadow-lg shadow-indigo-900/5 hover:shadow-xl hover:shadow-indigo-500/10 hover:border-[#4F35E8] transition-all text-left flex items-center gap-4 overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-100/50 rounded-full blur-2xl pointer-events-none group-hover:scale-150 transition-transform duration-500" />
            <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1E0FA8] to-[#4F35E8] flex items-center justify-center text-white shadow-md shadow-indigo-500/30 shrink-0 group-hover:rotate-6 transition-transform">
              <Clock className="w-6 h-6" />
            </div>
            <div className="relative z-10 flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-sm font-extrabold text-slate-900 group-hover:text-[#1E0FA8] transition-colors">
                  {t.libraryHours}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-100 text-[#1E0FA8]">
                  OPEN
                </span>
              </div>
              <span className="text-xs text-slate-500 font-medium">Open to patrons and scholars</span>
            </div>
          </motion.div>

          {/* Card 3: Now in Library */}
          <motion.div
            whileHover={{ y: -5, scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="group relative p-5 rounded-3xl bg-white/95 backdrop-blur-xl border border-amber-200/80 shadow-lg shadow-amber-900/5 hover:shadow-xl hover:shadow-amber-500/10 hover:border-amber-400 transition-all text-left flex items-center gap-4 overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-100/50 rounded-full blur-2xl pointer-events-none group-hover:scale-150 transition-transform duration-500" />
            <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-md shadow-amber-500/30 shrink-0 group-hover:rotate-6 transition-transform">
              <Radio className="w-6 h-6 animate-pulse" />
            </div>
            <div className="relative z-10 flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-sm font-extrabold text-slate-900 group-hover:text-amber-700 transition-colors">
                  {t.nowInLibrary}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                  LIVE
                </span>
              </div>
              <span className="text-xs text-slate-500 font-medium">Timetable scheduler synchronized</span>
            </div>
          </motion.div>
        </div>

        {/* Trust Chips Strip */}
        <div className="mt-12 pt-8 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600">
          <span className="font-semibold uppercase tracking-wider text-slate-700">{t.trustHeading}</span>
          <div className="flex flex-wrap items-center gap-3 font-bold text-slate-800">
            <span className="px-3.5 py-1.5 rounded-full bg-white/90 border border-slate-200 shadow-xs backdrop-blur">
              🎓 {t.schools}
            </span>
            <span className="px-3.5 py-1.5 rounded-full bg-white/90 border border-slate-200 shadow-xs backdrop-blur">
              🏛️ {t.universities}
            </span>
            <span className="px-3.5 py-1.5 rounded-full bg-white/90 border border-slate-200 shadow-xs backdrop-blur">
              🏢 {t.corporate}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
