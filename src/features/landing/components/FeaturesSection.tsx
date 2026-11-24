import React, { useState } from 'react';
import { motion } from 'framer-motion';
import kioskScanImg from '/images/enivac-kiosk-scan-v3.jpg?url';
import libraryInteriorImg from '/images/enivac-library-interior-v3.jpg?url';
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
    <div id="features" className="py-14 relative overflow-hidden">
      {/* Numbers Band (Section 3) */}
      <div className="max-w-[90rem] mx-auto px-4 sm:px-8 lg:px-12 mb-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm text-left hover:border-[#4F35E8]/60 hover:shadow-md transition-all">
            <span className="text-4xl sm:text-5xl font-black text-[#1E0FA8] font-heading block mb-1">
              {numT.stat1Val}
            </span>
            <span className="text-sm font-bold text-slate-900 block mb-0.5">{numT.stat1Label}</span>
            <span className="text-xs text-slate-500">{numT.stat1Desc}</span>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm text-left hover:border-[#4F35E8]/60 hover:shadow-md transition-all">
            <span className="text-4xl sm:text-5xl font-black text-[#16A34A] font-heading block mb-1">
              {numT.stat2Val}
            </span>
            <span className="text-sm font-bold text-slate-900 block mb-0.5">{numT.stat2Label}</span>
            <span className="text-xs text-slate-500">{numT.stat2Desc}</span>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm text-left hover:border-[#4F35E8]/60 hover:shadow-md transition-all">
            <span className="text-4xl sm:text-5xl font-black text-[#C69A35] font-heading block mb-1">
              {numT.stat3Val}
            </span>
            <span className="text-sm font-bold text-slate-900 block mb-0.5">{numT.stat3Label}</span>
            <span className="text-xs text-slate-500">{numT.stat3Desc}</span>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm text-left hover:border-[#4F35E8]/60 hover:shadow-md transition-all">
            <span className="text-4xl sm:text-5xl font-black text-slate-900 font-heading block mb-1">
              {numT.stat4Val}
            </span>
            <span className="text-sm font-bold text-slate-900 block mb-0.5">{numT.stat4Label}</span>
            <span className="text-xs text-slate-500">{numT.stat4Desc}</span>
          </div>
        </div>
      </div>

      {/* Section 4: 9 Core Features Grid */}
      <div className="max-w-[90rem] mx-auto px-4 sm:px-8 lg:px-12">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 font-heading">
            {t.title}
          </h2>
          <p className="text-base text-slate-600 font-normal leading-relaxed">
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
                className="p-8 rounded-3xl bg-white border border-slate-200/90 shadow-sm hover:shadow-xl flex flex-col justify-between text-left group hover:border-[#4F35E8] transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-violet-50 border border-violet-200 flex items-center justify-center text-[#1E0FA8] shadow-xs">
                      <Icon className="w-6 h-6 text-[#1E0FA8] group-hover:scale-110 transition-transform" />
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-400">{feat.id}</span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-[#1E0FA8] transition-colors">
                    {feat.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed font-normal mb-6">
                    {feat.desc}
                  </p>
                </div>

                <a
                  href="#showcase"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#4F35E8] hover:text-[#1E0FA8] transition-colors pt-4 border-t border-slate-100"
                >
                  <span>{t.learnMore}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </motion.div>
            );
          })}
        </div>

        {/* Section 5: Interactive Feature Showcase Highlight */}
        <div id="showcase" className="mt-16 pt-10 border-t border-slate-200/90 space-y-16 max-w-[90rem] mx-auto px-4 sm:px-8 lg:px-12">
          {/* Showcase 01: Smart Gate Kiosk Hardware */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left text */}
            <div className="lg:col-span-6 space-y-6 text-left">
              <span className="text-xs font-bold uppercase tracking-wider text-[#1E0FA8] px-3 py-1 rounded-full bg-violet-50 border border-violet-200">
                Interactive Showcase 01
              </span>
              <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-heading">
                Smart Gate Kiosk & Live Occupancy Headcount
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Contactless high-speed barcode card scanning terminal for patrons entering and exiting
                the library premises. Plays audio chime, speaks personalized greeting, evaluates past
                absences, and triggers sirens if overdue book fines are unpaid.
              </p>

              <ul className="space-y-3 text-xs text-slate-700 font-medium">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Dual-direction tracking: 1st scan enters, 2nd scan exits automatically.</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>3-Minute duplicate scan prevention buffer protects against mis-scans.</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Full-screen second monitor display with photo and emergency alerts.</span>
                </li>
              </ul>

              <div className="p-4 rounded-2xl bg-violet-50/70 border border-violet-200/80">
                <span className="text-xs font-bold text-slate-900 block mb-1">Key Institutional Benefit:</span>
                <span className="text-xs text-slate-600">
                  100% accurate student attendance logging without staff supervision or manual registers.
                </span>
              </div>
            </div>

            {/* Right: Live Interactive Mini Kiosk Demo with Photo */}
            <div className="lg:col-span-6 space-y-4">
              <div className="rounded-3xl overflow-hidden border border-slate-200/90 shadow-xl relative group">
                <img
                  src={kioskScanImg}
                  alt="Student scanning smart barcode card at entrance kiosk"
                  className="w-full h-64 object-cover object-center group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
                <span className="absolute bottom-3 left-4 text-xs font-bold text-white bg-slate-900/80 px-3 py-1 rounded-full border border-white/20 backdrop-blur">
                  Hardware Integration: 1D/2D High-Speed Laser Scanner
                </span>
              </div>

              <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xl relative overflow-hidden text-center">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-5">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-[#1E0FA8]" />
                    <span>Live Interactive Kiosk Simulator</span>
                  </span>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                </div>

                {demoStudentScanned ? (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="space-y-4 py-2"
                  >
                    <div className="w-20 h-20 rounded-full border-4 border-[#1E0FA8] mx-auto overflow-hidden bg-violet-100 flex items-center justify-center font-black text-2xl text-[#1E0FA8]">
                      K
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-slate-900">Kasun Perera</h4>
                      <p className="text-xs font-mono text-slate-500">LIB-STU-2026014 • Grade 10A</p>
                    </div>
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800">
                      ✨ සාදරයෙන් පිළිගනිමු! (Check-In Verified: 10:42 AM)
                    </div>
                    <button
                      onClick={() => setDemoStudentScanned(false)}
                      className="text-xs text-[#1E0FA8] hover:underline font-semibold"
                    >
                      Reset Simulator
                    </button>
                  </motion.div>
                ) : (
                  <div className="space-y-4 py-2">
                    <p className="text-xs text-slate-600">
                      Simulate scanning barcode card <strong>LIB-STU-2026014</strong>
                    </p>
                    <Button
                      onClick={() => setDemoStudentScanned(true)}
                      className="bg-[#1E0FA8] hover:bg-[#150a7c] text-white font-bold px-6 py-2 rounded-xl shadow-md text-xs"
                    >
                      Trigger Test Scan
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Showcase 02: High-Tech Connected Library Learning Spaces */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Photo */}
            <div className="lg:col-span-6 rounded-3xl overflow-hidden border border-slate-200/90 shadow-xl relative group order-2 lg:order-1">
              <img
                src={libraryInteriorImg}
                alt="Modern High-Tech University Library Learning Center"
                className="w-full h-80 object-cover object-center group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent opacity-75" />
              <div className="absolute bottom-4 left-4 right-4 p-3 rounded-2xl bg-white/95 border border-slate-200/90 backdrop-blur text-left shadow-lg">
                <span className="text-xs font-bold text-slate-900 block">Next-Generation Smart Architecture</span>
                <span className="text-[11px] text-slate-600">Designed for high throughput in leading schools and university libraries</span>
              </div>
            </div>

            {/* Right Text */}
            <div className="lg:col-span-6 space-y-6 text-left order-1 lg:order-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#1E0FA8] px-3 py-1 rounded-full bg-violet-50 border border-violet-200">
                Showcase 02
              </span>
              <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-heading">
                Zero-Touch Circulation & Real-Time Stock Auditing
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Empower your library staff with hands-free loan circulation. The system auto-focuses
                between member card barcodes and book copies in milliseconds, eliminating manual mouse clicks.
                Issue, return, print 80mm thermal receipts, and audit shelf inventory effortlessly.
              </p>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
                  <span className="font-bold text-slate-900 block mb-0.5">3.2 Seconds</span>
                  <span className="text-slate-500">Average checkout duration</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
                  <span className="font-bold text-slate-900 block mb-0.5">Zero Clicks</span>
                  <span className="text-slate-500">Hardware scanner focus loop</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
