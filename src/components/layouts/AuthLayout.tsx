import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { BookOpen, ShieldCheck, Sparkles, Globe } from 'lucide-react';
import { LanguageSwitcher } from '../common/LanguageSwitcher';
import { ThemeSwitcher } from '../common/ThemeSwitcher';

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-card px-6 h-16 flex items-center justify-between sticky top-0 z-30">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold shadow-sm">
            <BookOpen className="w-5 h-5" />
          </div>
          <span className="font-heading font-bold text-lg text-primary">LibraryOS</span>
        </Link>
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <ThemeSwitcher />
        </div>
      </header>

      {/* Main split viewport */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 gap-8 items-center">
        {/* Left Brand Panel (Desktop) */}
        <div className="hidden lg:flex lg:col-span-5 flex-col justify-between h-full max-h-[640px] rounded-2xl bg-card border border-border shadow-elevated overflow-hidden">
          <div className="relative w-full h-64 overflow-hidden bg-primary-soft">
            <img
              src="/images/auth-hero.webp"
              alt="Library interior reading nook"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />
          </div>

          <div className="p-8 pt-2 space-y-4 flex-1 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-soft text-xs font-semibold text-primary">
                <Sparkles className="w-3.5 h-3.5" />
                <span>National Standard Library Platform</span>
              </div>
              <h2 className="text-2xl font-bold font-heading text-foreground tracking-tight leading-snug">
                Access knowledge, explore collections, and borrow books seamlessly.
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Serving patrons, students, and researchers across public and academic libraries with digital cards, holds, and circulation services.
              </p>
            </div>

            <div className="space-y-2.5 pt-4 border-t border-border">
              <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                <ShieldCheck className="w-4 h-4 text-success shrink-0" />
                <span>National Library Policy & Grade-level borrowing limits</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                <Globe className="w-4 h-4 text-primary shrink-0" />
                <span>Sinhala, Tamil, and English trilingual OPAC support</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Form Container */}
        <div className="lg:col-span-7 flex justify-center w-full">
          <div className="w-full max-w-lg">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};
