import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BookOpen, Search, User, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { LanguageSwitcher } from '../common/LanguageSwitcher';
import { ThemeSwitcher } from '../common/ThemeSwitcher';
import { Button } from '@/components/ui/button';

export const PublicLayout: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, profile, signOut } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Skip to main content */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 z-50 px-4 py-2 bg-primary text-primary-foreground font-medium rounded-md shadow-elevated"
      >
        Skip to main content
      </a>

      {/* Main Header */}
      <header className="border-b border-border bg-card/95 backdrop-blur-sm sticky top-0 z-40 shadow-subtle">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl shadow-sm">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <span className="font-heading font-bold text-xl tracking-tight text-primary">
                LibraryOS
              </span>
              <span className="block text-[11px] text-muted-foreground font-sans">
                National Standards LSP
              </span>
            </div>
          </Link>

          {/* Quick Search in header */}
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
              <input
                type="text"
                placeholder={t('search.placeholder')}
                className="w-full pl-9 pr-4 py-2 text-sm bg-muted/50 rounded-full border border-input focus:outline-none focus:ring-2 focus:ring-primary focus:bg-card transition-all"
                aria-label="Quick search catalog"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSwitcher />
            <ThemeSwitcher />

            {/* Member Portal button ONLY when user is signed in */}
            {user ? (
              <div className="flex items-center gap-2">
                <Link
                  to="/account"
                  className="text-sm font-semibold px-3 py-2 rounded-lg bg-primary-soft text-primary hover:bg-primary/20 transition-colors flex items-center gap-1.5"
                >
                  <User className="w-4 h-4" />
                  <span>{profile?.fullName ? profile.fullName.split(' ')[0] : t('nav.portal')}</span>
                </Link>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={async () => {
                    await signOut();
                    navigate('/');
                  }}
                  title="Sign Out"
                  aria-label="Sign Out"
                  className="text-muted-foreground hover:text-danger"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <Button asChild variant="primary" size="sm">
                <Link to="/login">
                  {t('nav.signIn')} / {t('nav.register')}
                </Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Body content */}
      <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
        <Outlet />
      </main>

      {/* Accessible Footer */}
      <footer className="border-t border-border bg-card/50 py-8 px-4 mt-12 text-sm text-muted-foreground">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-center md:text-left">
            <span className="font-heading font-bold text-foreground">LibraryOS</span>
            <span>&copy; {new Date().getFullYear()} International Standard LSP. Built with React & Firebase.</span>
          </div>
          <div className="flex flex-wrap justify-center gap-6 text-xs text-muted-foreground">
            <span className="hover:text-foreground cursor-pointer transition-colors" title="Patron privacy standard compliance">Patron Privacy Policy</span>
            <span className="hover:text-foreground cursor-pointer transition-colors" title="Circulation and usage terms">Terms of Service</span>
            <span className="hover:text-foreground cursor-pointer transition-colors" title="WCAG 2.2 AA compliant typography & contrast">WCAG 2.2 AA Accessibility</span>
            <span className="hover:text-foreground cursor-pointer transition-colors" title="All local & sync services operational">System Status</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
