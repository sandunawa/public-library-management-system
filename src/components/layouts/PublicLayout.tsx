import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BookOpen, Search, User, Shield, Monitor, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { LanguageSwitcher } from '../common/LanguageSwitcher';
import { ThemeSwitcher } from '../common/ThemeSwitcher';

export const PublicLayout: React.FC = () => {
  const { t } = useTranslation();
  const { user, profile, signOut } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Main Header */}
      <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl shadow-md">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <span className="font-serif font-bold text-xl tracking-tight text-primary">LibraryOS</span>
              <span className="block text-xs text-muted-foreground font-sans">National Standards LSP</span>
            </div>
          </Link>

          {/* Quick Search in header */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
              <input
                type="text"
                placeholder={t('search.placeholder')}
                className="w-full pl-9 pr-4 py-2 text-sm bg-muted/40 rounded-full border border-input focus:outline-none focus:ring-2 focus:ring-primary focus:bg-background transition-all"
              />
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Show Member Portal button ONLY when user is signed in */}
            {user ? (
              <div className="flex items-center space-x-2">
                <Link
                  to="/account"
                  className="text-sm font-semibold px-3 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors flex items-center space-x-1.5"
                >
                  <User className="w-4 h-4" />
                  <span>{profile?.fullName ? profile.fullName.split(' ')[0] : t('nav.portal')}</span>
                </Link>
                <button
                  onClick={signOut}
                  title="Sign Out"
                  className="p-2 text-muted-foreground hover:text-destructive hover:bg-muted rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="text-sm font-medium px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
              >
                {t('nav.signIn')} / {t('nav.register')}
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Body content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Accessible Footer */}
      <footer className="border-t bg-muted/40 py-8 px-4 mt-12 text-sm text-muted-foreground">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="font-serif font-bold text-foreground">LibraryOS</span>
            <span>&copy; {new Date().getFullYear()} International Standard LSP. Built with React & Firebase.</span>
          </div>
          <div className="flex space-x-6 text-xs">
            <a href="#privacy" className="hover:underline">Patron Privacy Policy</a>
            <a href="#terms" className="hover:underline">Terms of Service</a>
            <a href="#a11y" className="hover:underline">WCAG 2.2 AA Accessibility</a>
            <a href="#status" className="hover:underline">System Status</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
