import React, { useEffect } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  LayoutDashboard,
  ScanLine,
  BookCopy,
  Users,
  Settings,
  ShieldAlert,
  ClipboardList,
  LogOut,
  Coins,
  AlertOctagon,
} from 'lucide-react';
import { LanguageSwitcher } from '../common/LanguageSwitcher';
import { ThemeSwitcher } from '../common/ThemeSwitcher';
import { TelegramBackupService } from '@/services/circulation/TelegramBackupService';

export const StaffLayout: React.FC = () => {
  const navigate = useNavigate();

  // Run daily automated telegram backup check when staff logs in / opens workspace
  useEffect(() => {
    TelegramBackupService.checkAndRunDailyScheduledBackup();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top Header */}
      <header className="border-b bg-card px-6 h-16 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center space-x-4">
          <Link to="/staff" className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold">
              <BookOpen className="w-5 h-5" />
            </div>
            <span className="font-serif font-bold text-lg text-primary">LibraryOS</span>
          </Link>
          <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 uppercase tracking-wider">
            Staff Workspace
          </span>
          <span className="text-xs text-muted-foreground border-l pl-3">
            Branch: <strong className="text-foreground">Colombo Central (HQ)</strong>
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

      <div className="flex-1 flex">
        {/* Left Staff Navigation Sidebar */}
        <aside className="w-64 border-r bg-card/50 p-4 space-y-6">
          <div>
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-3 mb-2">
              Circulation Desk
            </div>
            <div className="space-y-1">
              <Link
                to="/staff/circulation"
                className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-semibold bg-primary text-primary-foreground shadow-sm"
              >
                <ScanLine className="w-4 h-4" />
                <span>Desk Scan Mode</span>
              </Link>
              <Link
                to="/staff/issued-books"
                className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
              >
                <BookOpen className="w-4 h-4 text-emerald-600" />
                <span>Issued Books (ණයට දුන් පොත්)</span>
              </Link>
              <Link
                to="/staff/fines"
                className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
              >
                <Coins className="w-4 h-4 text-amber-500" />
                <span>Overdue & Fines (ප්‍රමාද දඩ මුදල්)</span>
              </Link>
              <Link
                to="/staff/suspended"
                className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
              >
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <span>Suspended (අත්හිටුවූ ගිණුම්)</span>
              </Link>
            </div>
          </div>

          <div>
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-3 mb-2">
              Management
            </div>
            <div className="space-y-1 text-sm font-medium">
              <Link
                to="/staff"
                className="flex items-center space-x-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </Link>
              <Link
                to="/staff/catalog"
                className="flex items-center space-x-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <BookCopy className="w-4 h-4" />
                <span>Catalogue & Copies</span>
              </Link>
              <Link
                to="/staff/members?tab=directory"
                className="flex items-center space-x-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <Users className="w-4 h-4" />
                <span>Members Directory</span>
              </Link>
              <Link
                to="/staff/members?tab=requests"
                className="flex items-center space-x-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <ClipboardList className="w-4 h-4 text-amber-500" />
                <span>Registration Requests</span>
              </Link>
              <Link
                to="/staff/inventory"
                className="flex items-center space-x-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <BookCopy className="w-4 h-4" />
                <span>Stocktake & Inventory</span>
              </Link>
              <Link
                to="/staff/missing-books"
                className="flex items-center space-x-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <AlertOctagon className="w-4 h-4 text-amber-600" />
                <span>Missing Books (අස්ථානගත පොත්)</span>
              </Link>
            </div>
          </div>

          <div>
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-3 mb-2">
              Administration
            </div>
            <div className="space-y-1 text-sm font-medium">
              <Link
                to="/staff/settings"
                className="flex items-center space-x-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <Settings className="w-4 h-4" />
                <span>Policy & Settings</span>
              </Link>
              <Link
                to="/staff/audit"
                className="flex items-center space-x-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Audit & Security</span>
              </Link>
            </div>
          </div>
        </aside>

        {/* Staff Main View */}
        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
