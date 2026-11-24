import React from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  QrCode,
  Search,
  ScanLine,
  LayoutDashboard,
  Users,
  Clock,
  Radio,
  BookOpen,
  CheckCircle,
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
    <section className="relative min-h-[92vh] pt-32 pb-20 flex flex-col justify-center overflow-hidden bg-gradient-to-b from-[#F5F4FF]/50 via-white to-white">
      {/* Background Radial Glow & Concentric Rings (Pastel Glow) */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-tr from-[#1E0FA8]/10 via-[#4F35E8]/10 to-violet-100/40 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] border border-slate-200/50 rounded-full pointer-events-none -z-10" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1400px] h-[1400px] border border-slate-200/30 rounded-full pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Headlines & CTA */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="lg:col-span-7 space-y-6 text-left"
          >
            {/* Eyebrow Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-50 border border-violet-200/80 shadow-xs">
              <Sparkles className="w-4 h-4 text-[#4F35E8]" />
              <span className="text-xs font-bold text-[#1E0FA8] tracking-wide uppercase">
                {t.eyebrow}
              </span>
            </div>

            {/* Giant Headline */}
            <h1 className="text-4xl sm:text-6xl xl:text-7xl font-extrabold tracking-tight text-slate-900 font-heading leading-[1.1]">
              {t.headlineMain}{' '}
              <span className="bg-gradient-to-r from-[#1E0FA8] via-[#4F35E8] to-[#1E0FA8] bg-clip-text text-transparent">
                {t.headlineAccent}
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-base sm:text-lg text-slate-600 max-w-2xl font-normal leading-relaxed">
              {t.subheadline}
            </p>

            {/* Main Action Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={onOpenLogin}
                className="px-7 py-3.5 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-[#1E0FA8] via-[#4F35E8] to-[#1E0FA8] hover:shadow-xl hover:shadow-[#4F35E8]/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 group"
              >
                <span>{t.primaryCta}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <a
                href="#contact"
                className="px-7 py-3.5 rounded-2xl text-sm font-bold text-slate-800 bg-white border border-slate-300 hover:bg-slate-50 hover:border-[#4F35E8] shadow-xs transition-all"
              >
                {t.secondaryCta}
              </a>
            </div>
          </motion.div>

          {/* Right Column: 3D Floating Mockup Stack */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="lg:col-span-5 relative"
          >
            {/* Background Mesh for Mockups */}
            <div className="relative mx-auto w-full max-w-lg aspect-square flex items-center justify-center">
              {/* Card 1: Dashboard (Base Layer) */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute w-[85%] rounded-3xl bg-gradient-to-br from-[#1E0FA8]/80 to-[#0B0630]/90 border border-[#4F35E8]/40 p-4 shadow-2xl backdrop-blur-2xl -rotate-6 top-6 left-0"
              >
                <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3 text-xs text-[#A99BFF]">
                  <span className="font-bold flex items-center gap-1.5">
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    <span>Executive Real-Time Dashboard</span>
                  </span>
                  <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
                </div>
                <div className="grid grid-cols-2 gap-2 text-left">
                  <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
                    <span className="text-[10px] text-muted-foreground block">Active Loans</span>
                    <span className="text-lg font-black text-white">1,482</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
                    <span className="text-[10px] text-muted-foreground block">Circulation Rate</span>
                    <span className="text-lg font-black text-[#A99BFF]">98.4%</span>
                  </div>
                </div>
              </motion.div>

              {/* Card 2: Smart Gate Kiosk (Front Layer) */}
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute w-[88%] rounded-3xl bg-gradient-to-br from-[#064B2A]/90 via-[#0B0630]/95 to-[#1E0FA8]/90 border-2 border-[#C69A35]/60 p-5 shadow-2xl shadow-black/80 backdrop-blur-2xl rotate-3 bottom-8 right-0"
              >
                <div className="flex items-center justify-between pb-3 border-b border-[#C69A35]/30 mb-3">
                  <span className="text-xs font-bold text-[#FFF5DF] flex items-center gap-1.5">
                    <QrCode className="w-4 h-4 text-[#C69A35]" />
                    <span>Smart Entrance Kiosk Terminal</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#C69A35] text-black">
                    GATE LIVE
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full border-2 border-[#C69A35] bg-[#064B2A] flex items-center justify-center font-bold text-white text-base">
                    S
                  </div>
                  <div className="text-left">
                    <span className="text-sm font-bold text-white block">Sanduni Wickramasinghe</span>
                    <span className="text-[11px] font-mono text-[#A99BFF]">LIB-2026-1412 • Grade 10A</span>
                  </div>
                </div>
                <div className="mt-3 p-2 rounded-xl bg-black/60 border border-[#C69A35]/30 text-[11px] font-semibold text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Verified Entrance (ඇතුල්වීම තහවුරු විය)</span>
                </div>
              </motion.div>

              {/* Card 3: Circulation Quick Scan Pill */}
              <motion.div
                animate={{ scale: [1, 1.03, 1] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute top-1/2 -right-4 px-4 py-2.5 rounded-2xl bg-[#4F35E8] text-white font-bold text-xs shadow-xl flex items-center gap-2 border border-[#A99BFF]/40 backdrop-blur"
              >
                <ScanLine className="w-4 h-4 animate-pulse" />
                <span>Zero-Touch Circulation: 3.2s</span>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Live Operational Ticker & Info Glass Cards */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex items-center gap-3 text-left">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-900 font-bold block">{t.liveOccupancy}</span>
              <span className="text-xs text-slate-500">Automated gate counter active</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex items-center gap-3 text-left">
            <div className="w-10 h-10 rounded-xl bg-violet-50 border border-violet-200 flex items-center justify-center text-[#4F35E8] shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-900 font-bold block">{t.libraryHours}</span>
              <span className="text-xs text-slate-500">Open to patrons and scholars</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex items-center gap-3 text-left">
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
        <div className="mt-12 pt-8 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
          <span className="font-semibold uppercase tracking-wider text-slate-600">{t.trustHeading}</span>
          <div className="flex flex-wrap items-center gap-3 font-bold text-slate-800">
            <span className="px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200">
              🎓 {t.schools}
            </span>
            <span className="px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200">
              🏛️ {t.universities}
            </span>
            <span className="px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200">
              🏢 {t.corporate}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
