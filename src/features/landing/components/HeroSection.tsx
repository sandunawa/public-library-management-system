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

interface HeroSectionProps {
  lang: 'en' | 'si';
  onOpenLogin: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ lang, onOpenLogin }) => {
  const t = lang === 'en' ? landingEn.hero : landingSi.hero;

  return (
    <section className="relative min-h-[92vh] pt-32 pb-20 flex flex-col justify-center overflow-hidden">
      {/* Photorealistic Hero Background Image with Clean White Glass Overlay */}
      <div className="absolute inset-0 -z-20">
        <img
          src="/images/enivac-hero-bg.jpg"
          alt="Bright modern smart automated library interior"
          className="w-full h-full object-cover object-center"
        />
        {/* Soft white gradient scrim ensuring 100% readable text and clean white aesthetic */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/88 to-white/75 backdrop-blur-[2px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-transparent to-white" />
      </div>

      {/* Background Radial Glow & Concentric Rings */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-tr from-[#1E0FA8]/10 via-[#4F35E8]/10 to-violet-100/40 rounded-full blur-[140px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="max-w-3xl space-y-7 text-left">
          {/* Eyebrow Pill */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 border border-violet-200 shadow-sm backdrop-blur-md"
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
            className="text-base sm:text-xl text-slate-700 max-w-2xl font-normal leading-relaxed"
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
              className="px-8 py-4 rounded-2xl text-sm font-bold text-slate-800 bg-white/90 border border-slate-300 hover:bg-white hover:border-[#4F35E8] shadow-sm backdrop-blur transition-all"
            >
              {t.secondaryCta}
            </a>
          </motion.div>
        </div>

        {/* Live Operational Ticker & Info Glass Cards */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-white/90 border border-slate-200/90 shadow-sm backdrop-blur-md flex items-center gap-3 text-left">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-900 font-bold block">{t.liveOccupancy}</span>
              <span className="text-xs text-slate-500">Automated gate counter active</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/90 border border-slate-200/90 shadow-sm backdrop-blur-md flex items-center gap-3 text-left">
            <div className="w-10 h-10 rounded-xl bg-violet-50 border border-violet-200 flex items-center justify-center text-[#4F35E8] shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-900 font-bold block">{t.libraryHours}</span>
              <span className="text-xs text-slate-500">Open to patrons and scholars</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/90 border border-slate-200/90 shadow-sm backdrop-blur-md flex items-center gap-3 text-left">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <span className="text-xs text-slate-900 font-bold block">{t.nowInLibrary}</span>
              <span className="text-xs text-slate-500">Timetable scheduler synchronized</span>
            </div>
          </div>
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
