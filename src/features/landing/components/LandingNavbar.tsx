import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Menu,
  X,
  Globe,
  Sparkles,
  ArrowRight,
  Clock,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { brandConfig } from '@/config/brand';
import { landingEn } from '@/i18n/landing/en';
import { landingSi } from '@/i18n/landing/si';

interface LandingNavbarProps {
  lang: 'en' | 'si';
  setLang: (l: 'en' | 'si') => void;
  onOpenLogin: () => void;
  onOpenRegister: () => void;
}

export const LandingNavbar: React.FC<LandingNavbarProps> = ({
  lang,
  setLang,
  onOpenLogin,
  onOpenRegister,
}) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const t = lang === 'en' ? landingEn.nav : landingSi.nav;

  const [activeTab, setActiveTab] = useState<string>('#features');

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearInterval(timer);
    };
  }, []);

  const navLinks = [
    { href: '#features', label: t.features },
    { href: '#how-it-works', label: t.howItWorks },
    { href: '#who-its-for', label: t.whoItsFor },
    { href: '#hardware', label: t.hardware },
    { href: '#contact', label: t.contact },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 pointer-events-none pt-4 px-4 sm:px-6">
      {/* Outer Floating Pill Dock Container matching user reference shape */}
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 pointer-events-auto">
        {/* Left: Brand Badge Pill */}
        <a
          href="#"
          className="flex items-center gap-3 px-4 py-2.5 rounded-full bg-white/90 backdrop-blur-xl border border-slate-200/90 shadow-lg shadow-indigo-950/5 hover:scale-[1.02] transition-transform"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#1E0FA8] to-[#4F35E8] flex items-center justify-center text-white shadow-md">
            <BookOpen className="w-4 h-4" />
          </div>
          <div className="flex flex-col text-left">
            <span className="font-heading font-extrabold text-sm tracking-tight text-slate-900 flex items-center gap-1.5 leading-none">
              <span>{brandConfig.shortName}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </span>
            <span className="text-[9px] text-[#1E0FA8] font-bold tracking-wider uppercase mt-0.5">
              {brandConfig.companyName}
            </span>
          </div>
        </a>

        {/* Center: Exact Capsule Dock Shape (like user reference image) */}
        <nav className="hidden lg:flex items-center p-1.5 rounded-full bg-slate-900/80 backdrop-blur-2xl border border-slate-800 shadow-2xl shadow-indigo-950/20">
          <div className="flex items-center p-1 rounded-full bg-slate-800/90 border border-slate-700/60">
            {navLinks.map((link) => {
              const isSelected = activeTab === link.href;
              return (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setActiveTab(link.href)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold transition-all duration-300 ${
                    isSelected
                      ? 'bg-white text-slate-900 shadow-md scale-100 font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  {link.label}
                </a>
              );
            })}

            {/* End Highlight Button in the Capsule (like 'Contact' in user reference image) */}
            <a
              href="#contact"
              onClick={() => setActiveTab('#contact')}
              className={`px-5 py-2 rounded-full text-xs font-extrabold transition-all duration-300 flex items-center gap-1.5 ${
                activeTab === '#contact'
                  ? 'bg-gradient-to-r from-[#1E0FA8] to-[#4F35E8] text-white shadow-lg'
                  : 'bg-[#1E0FA8] text-white hover:bg-[#180d85] shadow-md'
              }`}
            >
              <span>{t.contact}</span>
            </a>
          </div>
        </nav>

        {/* Right: Actions Capsule Pill */}
        <div className="hidden sm:flex items-center gap-2 p-1.5 rounded-full bg-white/90 backdrop-blur-xl border border-slate-200/90 shadow-lg shadow-indigo-950/5">
          {/* Live Date/Time Badge */}
          <div className="hidden xl:flex items-center gap-1.5 font-mono text-[11px] text-slate-700 px-3 py-1.5 rounded-full bg-slate-100/90">
            <Clock className="w-3.5 h-3.5 text-[#1E0FA8]" />
            <span>
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>

          {/* Bilingual Toggle */}
          <button
            onClick={() => setLang(lang === 'en' ? 'si' : 'en')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-slate-700 hover:text-[#1E0FA8] bg-slate-100/90 hover:bg-violet-50 transition-colors"
            title="Switch Language (සිංහල / English)"
          >
            <Globe className="w-3.5 h-3.5 text-[#1E0FA8]" />
            <span>{lang === 'en' ? 'සිංහල' : 'EN'}</span>
          </button>

          {/* Registration Button */}
          <button
            type="button"
            onClick={onOpenRegister}
            className="px-4 py-1.5 rounded-full text-xs font-bold text-[#1E0FA8] hover:bg-violet-50 transition-all border border-violet-200"
          >
            <span>{lang === 'en' ? 'Register' : 'ලියාපදිංචිය'}</span>
          </button>

          {/* Login Solid Button */}
          <button
            type="button"
            onClick={onOpenLogin}
            className="px-5 py-2 rounded-full text-xs font-bold text-white bg-gradient-to-r from-[#1E0FA8] via-[#4F35E8] to-[#1E0FA8] hover:shadow-lg hover:shadow-indigo-500/30 hover:scale-[1.03] transition-all flex items-center gap-1.5"
          >
            <span>{lang === 'en' ? 'Login' : 'පිවිසෙන්න'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Mobile Hamburger Toggle */}
        <div className="flex sm:hidden items-center gap-2 p-1 rounded-full bg-white/95 border border-slate-200 shadow-md">
          <button
            onClick={() => setLang(lang === 'en' ? 'si' : 'en')}
            className="px-2.5 py-1 rounded-full text-xs font-bold text-slate-800 bg-slate-100"
          >
            {lang === 'en' ? 'සිංහල' : 'EN'}
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-full text-slate-800 hover:bg-slate-100"
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-white/98 backdrop-blur-2xl border-b border-slate-200 px-6 py-6 space-y-4 shadow-xl"
          >
            <div className="flex flex-col space-y-3">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-sm font-semibold text-slate-800 hover:text-[#4F35E8]"
                >
                  {link.label}
                </a>
              ))}
            </div>
            <div className="pt-4 border-t border-slate-200 flex flex-col gap-2.5">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenLogin();
                }}
                className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#1E0FA8] to-[#4F35E8] text-center"
              >
                {lang === 'en' ? 'Login' : 'පිවිසෙන්න'}
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenRegister();
                }}
                className="w-full py-2.5 rounded-xl text-xs font-bold text-[#1E0FA8] border border-[#4F35E8]/40 bg-violet-50 text-center"
              >
                {lang === 'en' ? 'Registration' : 'ලියාපදිංචි වන්න'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
