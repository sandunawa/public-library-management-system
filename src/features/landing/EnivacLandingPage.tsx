import React, { useState } from 'react';
import ecosystemImage from '/images/enivac-ecosystem.jpg?url';
import { LandingNavbar } from './components/LandingNavbar';
import { HeroSection } from './components/HeroSection';
import { FeaturesSection } from './components/FeaturesSection';
import { SupportingSections } from './components/SupportingSections';
import { AuthModal } from './components/AuthModal';
import { landingEn } from '@/i18n/landing/en';
import { landingSi } from '@/i18n/landing/si';

export const EnivacLandingPage: React.FC = () => {
  const [lang, setLang] = useState<'en' | 'si'>('en');
  const [authModalState, setAuthModalState] = useState<{
    isOpen: boolean;
    mode: 'login' | 'register';
  }>({
    isOpen: false,
    mode: 'login',
  });

  const handleOpenLogin = () => {
    setAuthModalState({ isOpen: true, mode: 'login' });
  };

  const handleOpenRegister = () => {
    setAuthModalState({ isOpen: true, mode: 'register' });
  };

  const introT = lang === 'en' ? landingEn.intro : landingSi.intro;

  return (
    <div className="min-h-screen bg-[#FBFBFE] text-slate-900 selection:bg-[#4F35E8] selection:text-white relative overflow-x-hidden">
      {/* Subtle Grid Pattern Overlay for clean light theme */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.035] bg-[radial-gradient(#1E0FA8_1px,transparent_1px)] [background-size:24px_24px] -z-10" />

      {/* Floating Ambient Pastel Glow Orbs */}
      <div className="fixed top-0 left-0 w-[550px] h-[550px] bg-gradient-to-br from-indigo-100/60 to-purple-50/40 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="fixed bottom-0 right-0 w-[600px] h-[600px] bg-gradient-to-tr from-violet-100/50 to-blue-50/40 rounded-full blur-[160px] pointer-events-none -z-10" />

      {/* Sticky Glass Navbar */}
      <LandingNavbar
        lang={lang}
        setLang={setLang}
        onOpenLogin={handleOpenLogin}
        onOpenRegister={handleOpenRegister}
      />

      {/* Section 1: Hero Section */}
      <HeroSection lang={lang} onOpenLogin={handleOpenLogin} />

      {/* Section 2: What is Smart Library Intro with Connected Ecosystem Visual */}
      <section className="py-12 max-w-6xl mx-auto px-4 sm:px-6 text-center space-y-8">
        <div className="space-y-3 max-w-3xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-[#4F35E8] px-4 py-1.5 rounded-full bg-violet-50 border border-violet-200 shadow-xs">
            Enterprise Overview
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 font-heading">
            {introT.title}
          </h2>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
            {introT.p1}
          </p>
        </div>

        {/* Photorealistic 3D Connected Ecosystem Module Graphic */}
        <div className="relative rounded-3xl overflow-hidden border border-slate-200/80 shadow-2xl bg-white p-2 sm:p-4 group">
          <div className="relative rounded-2xl overflow-hidden border border-slate-100 shadow-inner">
            <img
              src={ecosystemImage}
              alt="Interconnected Smart Library Operating System Modules"
              className="w-full h-auto max-h-[460px] object-cover object-center group-hover:scale-[1.02] transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-75" />

            <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-white/90 border border-slate-200/80 backdrop-blur-md text-left shadow-lg">
              <div>
                <span className="text-xs font-bold text-slate-900 block">
                  Unified Smart Operations Architecture (ඒකාබද්ධ ස්මාර්ට් පද්ධති ව්‍යුහය)
                </span>
                <span className="text-[11px] text-slate-600">
                  Entrance Kiosk • Circulation Desk • Member PVC Cards • Timetable Grid • Executive Analytics
                </span>
              </div>
              <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Active Inter-Module Sync
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Sections 3-5: Key Numbers, 9 Features Grid & Showcase */}
      <FeaturesSection lang={lang} />

      {/* Sections 6-11: How it Works, Who It's For, Hardware, Login, Demo & Footer */}
      <div className="mt-12">
        <SupportingSections lang={lang} />
      </div>

      {/* Auth Pop-up Modal (Login & Registration) */}
      <AuthModal
        isOpen={authModalState.isOpen}
        initialMode={authModalState.mode}
        onClose={() => setAuthModalState({ ...authModalState, isOpen: false })}
        lang={lang}
      />
    </div>
  );
};
