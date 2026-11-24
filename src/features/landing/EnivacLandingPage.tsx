import React, { useState } from 'react';
import { LandingNavbar } from './components/LandingNavbar';
import { HeroSection } from './components/HeroSection';
import { FeaturesSection } from './components/FeaturesSection';
import { SupportingSections } from './components/SupportingSections';
import { landingEn } from '@/i18n/landing/en';
import { landingSi } from '@/i18n/landing/si';

export const EnivacLandingPage: React.FC = () => {
  const [lang, setLang] = useState<'en' | 'si'>('en');

  const scrollToLogin = () => {
    const el = document.getElementById('login');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
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
      <LandingNavbar lang={lang} setLang={setLang} onOpenLogin={scrollToLogin} />

      {/* Section 1: Hero Section */}
      <HeroSection lang={lang} onOpenLogin={scrollToLogin} />

      {/* Section 2: What is Smart Library Intro */}
      <section className="py-20 max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-6">
        <span className="text-xs font-bold uppercase tracking-wider text-[#A99BFF] px-4 py-1.5 rounded-full bg-white/5 border border-white/10">
          Enterprise Overview
        </span>
        <h2 className="text-3xl sm:text-5xl font-extrabold text-white font-heading">
          {introT.title}
        </h2>
        <p className="text-base sm:text-lg text-[#F5F4FF]/80 leading-relaxed max-w-3xl mx-auto font-normal">
          {introT.p1}
        </p>
      </section>

      {/* Sections 3-5: Key Numbers, 9 Features Grid & Showcase */}
      <FeaturesSection lang={lang} />

      {/* Sections 6-11: How it Works, Who It's For, Hardware, Login, Demo & Footer */}
      <div className="mt-20">
        <SupportingSections lang={lang} />
      </div>
    </div>
  );
};
