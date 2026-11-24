import React from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  BookOpen,
  Home,
  BookMarked,
  CreditCard,
  Clock,
  User,
  LogOut,
} from 'lucide-react';
import { LanguageSwitcher } from '../common/LanguageSwitcher';
import { ThemeSwitcher } from '../common/ThemeSwitcher';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export const MemberLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors relative min-h-[40px]',
      isActive
        ? 'bg-primary-soft text-primary font-semibold shadow-subtle before:absolute before:left-0 before:top-2 before:bottom-2 before:w-[3px] before:bg-primary before:rounded-full'
        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
    );

  const bottomTabClass = (path: string, exact = false) => {
    const isActive = exact
      ? location.pathname === path
      : location.pathname.startsWith(path);
    return cn(
      'flex flex-col items-center justify-center flex-1 py-1 text-[11px] font-medium transition-colors',
      isActive ? 'text-primary font-semibold' : 'text-muted-foreground'
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Skip to main content */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 z-50 px-4 py-2 bg-primary text-primary-foreground font-medium rounded-md shadow-elevated"
      >
        Skip to main content
      </a>

      {/* Header */}
      <header className="border-b border-border bg-card/95 backdrop-blur-sm px-4 lg:px-6 h-16 flex items-center justify-between sticky top-0 z-30 shadow-subtle">
        <div className="flex items-center gap-3">
          <NavLink to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold shadow-sm">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-heading font-bold text-lg leading-tight text-primary">
                LibraryOS
              </span>
              <span className="text-[11px] text-muted-foreground hidden sm:inline">
                National LSP
              </span>
            </div>
          </NavLink>
          <Badge variant="info" size="sm" className="ml-1">
            Member Portal
          </Badge>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <LanguageSwitcher />
          <ThemeSwitcher />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/login')}
            className="text-muted-foreground hover:text-danger gap-1.5 px-2.5"
            aria-label="Sign Out"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </Button>
        </div>
      </header>

      {/* Content layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 md:grid-cols-4 gap-6 pb-20 md:pb-8">
        {/* Desktop Sidebar Nav */}
        <aside className="hidden md:block space-y-1 self-start sticky top-24">
          <NavLink to="/account" end className={navLinkClass}>
            <Home className="w-4 h-4" />
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/account/loans" className={navLinkClass}>
            <BookMarked className="w-4 h-4" />
            <span>My Loans</span>
          </NavLink>
          <NavLink to="/account/holds" className={navLinkClass}>
            <Clock className="w-4 h-4" />
            <span>Reservations & Holds</span>
          </NavLink>
          <NavLink to="/account/fines" className={navLinkClass}>
            <CreditCard className="w-4 h-4" />
            <span>Fines & Payments</span>
          </NavLink>
          <NavLink to="/account/profile" className={navLinkClass}>
            <User className="w-4 h-4" />
            <span>Profile & Digital Card</span>
          </NavLink>
        </aside>

        {/* Content Area */}
        <main
          id="main-content"
          tabIndex={-1}
          className="md:col-span-3 outline-none animate-fade-in"
        >
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Tab Bar for Account */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border h-16 flex items-center justify-around px-2 z-40 shadow-elevated"
        aria-label="Member Navigation"
      >
        <NavLink to="/account" end className={bottomTabClass('/account', true)}>
          <Home className="w-5 h-5 mb-1" />
          <span>Home</span>
        </NavLink>
        <NavLink to="/account/loans" className={bottomTabClass('/account/loans')}>
          <BookMarked className="w-5 h-5 mb-1" />
          <span>Loans</span>
        </NavLink>
        <NavLink to="/account/holds" className={bottomTabClass('/account/holds')}>
          <Clock className="w-5 h-5 mb-1" />
          <span>Holds</span>
        </NavLink>
        <NavLink to="/account/fines" className={bottomTabClass('/account/fines')}>
          <CreditCard className="w-5 h-5 mb-1" />
          <span>Fines</span>
        </NavLink>
        <NavLink to="/account/profile" className={bottomTabClass('/account/profile')}>
          <User className="w-5 h-5 mb-1" />
          <span>Profile</span>
        </NavLink>
      </nav>
    </div>
  );
};
