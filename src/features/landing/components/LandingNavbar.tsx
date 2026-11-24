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
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/90 backdrop-blur-xl border-b border-slate-200/80 shadow-md shadow-slate-900/5 py-3'
          : 'bg-white/75 backdrop-blur-md border-b border-slate-100 py-4'
      }`}
    >
      <div className="w-full px-4 sm:px-6 lg:px-10 flex items-center justify-between">
        {/* Brand Logo & Wordmark */}
        <a href="#" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#1E0FA8] to-[#4F35E8] p-[2px] shadow-md shadow-[#4F35E8]/20 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-[#1E0FA8] rounded-[10px] flex items-center justify-center text-white">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="flex flex-col text-left">
            <span className="font-heading font-extrabold text-base tracking-tight text-slate-900 flex items-center gap-1.5">
              <span>{brandConfig.shortName}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </span>
            <span className="text-[10px] text-slate-500 font-medium tracking-wider uppercase">
              {brandConfig.companyName}
            </span>
          </div>
        </a>

        {/* Desktop Navigation Links — Spaced & Styled as Professional Glass Nav Pills */}
        <nav className="hidden lg:flex items-center gap-3">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100/80 hover:bg-violet-50 border border-slate-200 hover:border-[#4F35E8]/40 hover:text-[#1E0FA8] transition-all duration-200 shadow-xs hover:shadow-sm hover:scale-[1.03] active:scale-[0.98]"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Right Actions: Clock, Language Switcher, Registration, Login */}
        <div className="hidden sm:flex items-center gap-3">
          {/* Live Date/Time Badge */}
          <div className="hidden xl:flex items-center gap-2 font-mono text-[11px] text-slate-700 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-full">
            <Clock className="w-3.5 h-3.5 text-[#4F35E8]" />
            <span>
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>

          {/* Bilingual Toggle */}
          <button
            onClick={() => setLang(lang === 'en' ? 'si' : 'en')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors"
            title="Switch Language (සිංහල / English)"
          >
            <Globe className="w-3.5 h-3.5 text-[#4F35E8]" />
            <span>{lang === 'en' ? 'සිංහල' : 'English'}</span>
          </button>

          {/* Registration Button (Pill Outline) */}
          <button
            type="button"
            onClick={onOpenRegister}
            className="px-4 py-1.5 rounded-xl text-xs font-bold text-[#1E0FA8] border border-[#4F35E8]/40 bg-violet-50/70 hover:bg-violet-100/80 hover:border-[#4F35E8] transition-all flex items-center gap-1.5 shadow-xs"
          >
            <span>{lang === 'en' ? 'Registration' : 'ලියාපදිංචිය'}</span>
          </button>

          {/* Login Solid Button (Solid Gradient) */}
          <button
            type="button"
            onClick={onOpenLogin}
            className="px-5 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#1E0FA8] via-[#4F35E8] to-[#1E0FA8] hover:shadow-lg hover:shadow-[#4F35E8]/30 hover:scale-[1.02] transition-all flex items-center gap-1.5"
          >
            <span>{lang === 'en' ? 'Login' : 'පිවිසෙන්න'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Mobile Hamburger Toggle */}
        <div className="flex sm:hidden items-center gap-2">
          <button
            onClick={() => setLang(lang === 'en' ? 'si' : 'en')}
            className="p-1.5 rounded-lg text-xs font-bold text-slate-800 bg-slate-100 border border-slate-200"
          >
            {lang === 'en' ? 'සිංහල' : 'EN'}
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-slate-800 hover:bg-slate-100"
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
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
