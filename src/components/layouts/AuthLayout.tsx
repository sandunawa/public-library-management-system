import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import { LanguageSwitcher } from '../common/LanguageSwitcher';
import { ThemeSwitcher } from '../common/ThemeSwitcher';

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="px-6 py-4 flex items-center justify-between border-b">
        <Link to="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold">
            <BookOpen className="w-5 h-5" />
          </div>
          <span className="font-serif font-bold text-lg text-primary">LibraryOS</span>
        </Link>
        <div className="flex items-center space-x-3">
          <LanguageSwitcher />
          <ThemeSwitcher />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <Outlet />
      </main>
    </div>
  );
};
