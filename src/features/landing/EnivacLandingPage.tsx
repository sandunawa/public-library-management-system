import React, { useState } from 'react';
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
    <div className="min-h-screen bg-[#0B0630] text-[#F5F4FF] selection:bg-[#4F35E8] selection:text-white relative overflow-x-hidden">
      {/* Animated Subtle Grid Pattern Overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.06] bg-[radial-gradient(#A99BFF_1px,transparent_1px)] [background-size:24px_24px] -z-10" />

      {/* Floating Ambient Mesh Orbs */}
      <div className="fixed top-0 left-0 w-[500px] h-[500px] bg-[#1E0FA8]/25 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="fixed bottom-0 right-0 w-[600px] h-[600px] bg-[#4F35E8]/20 rounded-full blur-[160px] pointer-events-none -z-10" />

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
      <section className="py-20 max-w-6xl mx-auto px-4 sm:px-6 text-center space-y-10">
        <div className="space-y-4 max-w-3xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-[#A99BFF] px-4 py-1.5 rounded-full bg-white/5 border border-white/10 shadow-sm">
            Enterprise Overview
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white font-heading">
            {introT.title}
          </h2>
          <p className="text-base sm:text-lg text-[#F5F4FF]/80 leading-relaxed font-normal">
            {introT.p1}
          </p>
        </div>

        {/* Photorealistic 3D Connected Ecosystem Module Graphic */}
        <div className="relative rounded-3xl overflow-hidden border border-[#4F35E8]/40 shadow-2xl bg-gradient-to-b from-[#1E0FA8]/10 via-[#0B0630]/90 to-[#0B0630] p-2 sm:p-4 group">
          <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-inner">
            <img
              src="/images/enivac-ecosystem.jpg"
              alt="Interconnected Smart Library Operating System Modules"
              className="w-full h-auto max-h-[440px] object-cover object-center group-hover:scale-[1.02] transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B0630] via-transparent to-transparent opacity-60" />
            
            <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#0B0630]/85 border border-white/15 backdrop-blur-md text-left">
              <div>
                <span className="text-xs font-bold text-white block">
                  Unified Smart Operations Architecture (ඒකාබද්ධ ස්මාර්ට් පද්ධති ව්‍යුහය)
                </span>
                <span className="text-[11px] text-[#A99BFF]">
                  Entrance Kiosk • Circulation Desk • Member PVC Cards • Timetable Grid • Executive Analytics
                </span>
              </div>
              <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-[#16A34A]/20 text-emerald-300 border border-[#16A34A]/40 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Active Inter-Module Sync
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Sections 3-5: Key Numbers, 9 Features Grid & Showcase */}
      <FeaturesSection lang={lang} />

      {/* Sections 6-11: How it Works, Who It's For, Hardware, Login, Demo & Footer */}
      <div className="mt-20">
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
