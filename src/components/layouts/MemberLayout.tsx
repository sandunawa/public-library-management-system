import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { BookOpen, Home, BookMarked, CreditCard, Clock, User, LogOut } from 'lucide-react';
import { LanguageSwitcher } from '../common/LanguageSwitcher';
import { ThemeSwitcher } from '../common/ThemeSwitcher';

export const MemberLayout: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b bg-background px-6 h-16 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center space-x-6">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold">
              <BookOpen className="w-5 h-5" />
            </div>
            <span className="font-serif font-bold text-lg text-primary">LibraryOS</span>
          </Link>
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            Member Portal
          </span>
        </div>

        <div className="flex items-center space-x-4">
          <LanguageSwitcher />
          <ThemeSwitcher />
          <button
            onClick={() => navigate('/login')}
            className="flex items-center space-x-1 text-sm text-muted-foreground hover:text-destructive"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      <div className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar Nav */}
        <aside className="space-y-1">
          <Link
            to="/account"
            className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium bg-muted text-foreground"
          >
            <Home className="w-4 h-4 text-primary" />
            <span>Dashboard</span>
          </Link>
          <Link
            to="/account/loans"
            className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium hover:bg-muted text-muted-foreground hover:text-foreground"
          >
            <BookMarked className="w-4 h-4" />
            <span>My Loans</span>
          </Link>
          <Link
            to="/account/holds"
            className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium hover:bg-muted text-muted-foreground hover:text-foreground"
          >
            <Clock className="w-4 h-4" />
            <span>Reservations & Holds</span>
          </Link>
          <Link
            to="/account/fines"
            className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium hover:bg-muted text-muted-foreground hover:text-foreground"
          >
            <CreditCard className="w-4 h-4" />
            <span>Fines & Payments</span>
          </Link>
          <Link
            to="/account/profile"
            className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium hover:bg-muted text-muted-foreground hover:text-foreground"
          >
            <User className="w-4 h-4" />
            <span>Profile & Digital Card</span>
          </Link>
        </aside>

        {/* Content Area */}
        <main className="md:col-span-3">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
