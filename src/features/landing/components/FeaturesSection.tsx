import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  QrCode,
  ScanLine,
  CreditCard,
  FileSpreadsheet,
  CalendarCheck,
  BookCopy,
  Coins,
  ShieldCheck,
  Server,
  ArrowRight,
  Check,
  Sparkles,
  Volume2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { landingEn } from '@/i18n/landing/en';
import { landingSi } from '@/i18n/landing/si';

interface FeaturesSectionProps {
  lang: 'en' | 'si';
}

export const FeaturesSection: React.FC<FeaturesSectionProps> = ({ lang }) => {
  const t = lang === 'en' ? landingEn.features : landingSi.features;
  const numT = lang === 'en' ? landingEn.numbers : landingSi.numbers;

  // Mini Interactive Kiosk Demo State
  const [demoStudentScanned, setDemoStudentScanned] = useState(false);

  const featureCards = [
    {
      id: '01',
      icon: QrCode,
      title: t.f1Title,
      desc: t.f1Desc,
      color: 'from-[#064B2A] to-[#C69A35]',
    },
    {
      id: '02',
      icon: ScanLine,
      title: t.f2Title,
      desc: t.f2Desc,
      color: 'from-[#1E0FA8] to-[#4F35E8]',
    },
    {
      id: '03',
      icon: CreditCard,
      title: t.f3Title,
      desc: t.f3Desc,
      color: 'from-[#4F35E8] to-[#A99BFF]',
    },
    {
      id: '04',
      icon: FileSpreadsheet,
      title: t.f4Title,
      desc: t.f4Desc,
      color: 'from-[#064B2A] to-[#16A34A]',
    },
    {
      id: '05',
      icon: CalendarCheck,
      title: t.f5Title,
      desc: t.f5Desc,
      color: 'from-[#1E0FA8] to-[#7654D7]',
    },
    {
      id: '06',
      icon: BookCopy,
      title: t.f6Title,
      desc: t.f6Desc,
      color: 'from-[#4F35E8] to-[#0B0630]',
    },
    {
      id: '07',
      icon: Coins,
      title: t.f7Title,
      desc: t.f7Desc,
      color: 'from-[#C69A35] to-[#F5A524]',
    },
    {
      id: '08',
      icon: ShieldCheck,
      title: t.f8Title,
      desc: t.f8Desc,
      color: 'from-[#1E0FA8] to-[#0B0630]',
    },
    {
      id: '09',
      icon: Server,
      title: t.f9Title,
      desc: t.f9Desc,
      color: 'from-[#4F35E8] to-[#1E0FA8]',
    },
  ];

  return (
    <div id="features" className="py-24 relative overflow-hidden">
      {/* Numbers Band (Section 3) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-xl text-left hover:border-[#4F35E8]/60 transition-all">
            <span className="text-4xl sm:text-5xl font-black text-[#A99BFF] font-heading block mb-1">
              {numT.stat1Val}
            </span>
            <span className="text-sm font-bold text-white block mb-0.5">{numT.stat1Label}</span>
            <span className="text-xs text-[#A99BFF]/80">{numT.stat1Desc}</span>
          </div>

          <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-xl text-left hover:border-[#4F35E8]/60 transition-all">
            <span className="text-4xl sm:text-5xl font-black text-[#16A34A] font-heading block mb-1">
              {numT.stat2Val}
            </span>
            <span className="text-sm font-bold text-white block mb-0.5">{numT.stat2Label}</span>
            <span className="text-xs text-[#A99BFF]/80">{numT.stat2Desc}</span>
          </div>

          <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-xl text-left hover:border-[#4F35E8]/60 transition-all">
            <span className="text-4xl sm:text-5xl font-black text-[#C69A35] font-heading block mb-1">
              {numT.stat3Val}
            </span>
            <span className="text-sm font-bold text-white block mb-0.5">{numT.stat3Label}</span>
            <span className="text-xs text-[#A99BFF]/80">{numT.stat3Desc}</span>
          </div>

          <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-xl text-left hover:border-[#4F35E8]/60 transition-all">
            <span className="text-4xl sm:text-5xl font-black text-white font-heading block mb-1">
              {numT.stat4Val}
            </span>
            <span className="text-sm font-bold text-white block mb-0.5">{numT.stat4Label}</span>
            <span className="text-xs text-[#A99BFF]/80">{numT.stat4Desc}</span>
          </div>
        </div>
      </div>

      {/* Section 4: 9 Core Features Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <h2 className="text-3xl sm:text-5xl font-extrabold text-[#F5F4FF] font-heading">
            {t.title}
          </h2>
          <p className="text-base text-[#A99BFF]/90 font-normal leading-relaxed">
            {t.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featureCards.map((feat) => {
            const Icon = feat.icon;
            return (
              <motion.div
                key={feat.id}
                whileHover={{ y: -6 }}
                className="p-8 rounded-3xl bg-gradient-to-b from-white/10 to-white/[0.02] border border-white/10 backdrop-blur-xl shadow-xl flex flex-col justify-between text-left group hover:border-[#4F35E8] transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#1E0FA8] to-[#4F35E8] p-[1px] flex items-center justify-center text-white shadow-lg">
                      <Icon className="w-6 h-6 text-[#A99BFF] group-hover:scale-110 transition-transform" />
                    </div>
                    <span className="text-xs font-mono font-bold text-[#A99BFF]/60">{feat.id}</span>
                  </div>

                  <h3 className="text-lg font-bold text-white mb-2 group-hover:text-[#A99BFF] transition-colors">
                    {feat.title}
                  </h3>
                  <p className="text-xs text-[#F5F4FF]/70 leading-relaxed font-normal mb-6">
                    {feat.desc}
                  </p>
                </div>

                <a
                  href="#showcase"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#A99BFF] hover:text-white transition-colors pt-4 border-t border-white/5"
                >
                  <span>{t.learnMore}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </motion.div>
            );
          })}
        </div>

        {/* Section 5: Interactive Feature Showcase Highlight */}
        <div id="showcase" className="mt-28 pt-12 border-t border-white/10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left text */}
            <div className="lg:col-span-6 space-y-6 text-left">
              <span className="text-xs font-bold uppercase tracking-wider text-[#C69A35] px-3 py-1 rounded-full bg-[#C69A35]/10 border border-[#C69A35]/30">
                Interactive Showcase 01
              </span>
              <h3 className="text-3xl sm:text-4xl font-extrabold text-white font-heading">
                Smart Gate Kiosk & Live Occupancy Headcount
              </h3>
              <p className="text-sm text-[#F5F4FF]/80 leading-relaxed">
                Contactless high-speed barcode card scanning terminal for patrons entering and exiting
                the library premises. Plays audio chime, speaks personalized greeting, evaluates past
                absences, and triggers sirens if overdue book fines are unpaid.
              </p>

              <ul className="space-y-3 text-xs text-[#A99BFF] font-medium">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Dual-direction tracking: 1st scan enters, 2nd scan exits automatically.</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>3-Minute duplicate scan prevention buffer protects against mis-scans.</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Full-screen second monitor display with photo and emergency alerts.</span>
                </li>
              </ul>

              <div className="p-4 rounded-2xl bg-white/5 border border-[#4F35E8]/30">
                <span className="text-xs font-bold text-white block mb-1">Key Institutional Benefit:</span>
                <span className="text-xs text-[#A99BFF]">
                  100% accurate student attendance logging without staff supervision or manual registers.
                </span>
              </div>
            </div>

            {/* Right: Live Interactive Mini Kiosk Demo */}
            <div className="lg:col-span-6">
              <div className="p-6 rounded-3xl bg-gradient-to-br from-[#0B0630] via-[#002213] to-[#0B0630] border-2 border-[#C69A35]/50 shadow-2xl relative overflow-hidden text-center">
                <div className="flex items-center justify-between pb-3 border-b border-[#C69A35]/30 mb-5">
                  <span className="text-xs font-bold text-[#FFF5DF] flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-[#C69A35]" />
                    <span>Live Interactive Kiosk Simulator</span>
                  </span>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                </div>

                {demoStudentScanned ? (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="space-y-4 py-4"
                  >
                    <div className="w-24 h-24 rounded-full border-4 border-[#C69A35] mx-auto overflow-hidden bg-[#064B2A] flex items-center justify-center font-black text-2xl text-white">
                      K
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-white">Kasun Perera</h4>
                      <p className="text-xs font-mono text-[#A99BFF]">LIB-STU-2026014 • Grade 10A</p>
                    </div>
                    <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-xs font-bold text-emerald-300">
                      ✨ සාදරයෙන් පිළිගනිමු! (Check-In Verified: 10:42 AM)
                    </div>
                    <button
                      onClick={() => setDemoStudentScanned(false)}
                      className="text-xs text-[#A99BFF] hover:underline"
                    >
                      Reset Simulator
                    </button>
                  </motion.div>
                ) : (
                  <div className="space-y-6 py-6">
                    <div className="w-24 h-24 rounded-2xl bg-[#064B2A]/50 border-2 border-dashed border-[#C69A35] mx-auto flex items-center justify-center">
                      <QrCode className="w-12 h-12 text-[#C69A35] animate-pulse" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">Tap below to test instant card scan</p>
                      <p className="text-xs text-[#A99BFF] mt-1">Simulates USB laser barcode scanner trigger</p>
                    </div>
                    <Button
                      onClick={() => setDemoStudentScanned(true)}
                      className="bg-[#C69A35] hover:bg-[#b0872c] text-black font-bold px-6 py-2.5 rounded-xl shadow-lg"
                    >
                      Scan Student Card (LIB-STU-2026014)
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
