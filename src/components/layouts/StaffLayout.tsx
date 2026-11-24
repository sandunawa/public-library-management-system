import React, { useEffect, useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
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
  Menu,
  X,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  BookmarkCheck,
  CalendarCheck,
  QrCode,
  UserPlus,
} from 'lucide-react';
import { LanguageSwitcher } from '../common/LanguageSwitcher';
import { ThemeSwitcher } from '../common/ThemeSwitcher';
import { TelegramBackupService } from '@/services/circulation/TelegramBackupService';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

export const StaffLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('libraryos-sidebar-collapsed') === 'true';
  });

  const toggleCollapsed = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('libraryos-sidebar-collapsed', String(next));
      return next;
    });
  };

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileDrawerOpen(false);
  }, [location.pathname, location.search]);

  // Run daily automated telegram backup check when staff logs in / opens workspace
  useEffect(() => {
    TelegramBackupService.checkAndRunDailyScheduledBackup();
  }, []);

  // Keyboard navigation: Escape closes drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileDrawerOpen) {
        setMobileDrawerOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileDrawerOpen]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileDrawerOpen]);

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors relative min-h-[40px]',
      isActive
        ? 'bg-primary-soft text-primary font-semibold shadow-subtle before:absolute before:left-0 before:top-2 before:bottom-2 before:w-[3px] before:bg-primary before:rounded-full'
        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
    );

  const navigationContent = (
    <div className="space-y-6">
      {/* Group 1: Circulation Desk */}
      <div>
        <div className="text-xs font-semibold text-muted-foreground px-3 mb-2 tracking-normal">
          Circulation Desk
        </div>
        <div className="space-y-1">
          <NavLink to="/staff/circulation" className={navLinkClass}>
            <ScanLine className="w-4 h-4 shrink-0 text-primary" />
            <span className="truncate">Desk Scan Mode</span>
          </NavLink>
          <NavLink to="/kiosk" target="_blank" className={navLinkClass}>
            <QrCode className="w-4 h-4 shrink-0 text-amber-500" />
            <span className="truncate">Smart Gate Kiosk Display</span>
          </NavLink>
          <NavLink to="/staff/attendance" className={navLinkClass}>
            <Users className="w-4 h-4 shrink-0 text-emerald-500" />
            <span className="truncate">Gate Attendance Console</span>
          </NavLink>
          <NavLink to="/staff/issued-books" className={navLinkClass}>
            <BookOpen className="w-4 h-4 shrink-0 text-success" />
            <span className="truncate">Issued Books</span>
          </NavLink>
          <NavLink to="/staff/reservations" className={navLinkClass}>
            <BookmarkCheck className="w-4 h-4 shrink-0 text-[#7654D7]" />
            <span className="truncate">Hold Requests</span>
          </NavLink>
          <NavLink to="/staff/fines" className={navLinkClass}>
            <Coins className="w-4 h-4 shrink-0 text-warning" />
            <span className="truncate">Overdue & Fines</span>
          </NavLink>
          <NavLink to="/staff/suspended" className={navLinkClass}>
            <ShieldAlert className="w-4 h-4 shrink-0 text-danger" />
            <span className="truncate">Suspended Members</span>
          </NavLink>
        </div>
      </div>

      {/* Group 2: Management */}
      <div>
        <div className="text-xs font-semibold text-muted-foreground px-3 mb-2 tracking-normal">
          Management
        </div>
        <div className="space-y-1">
          <NavLink to="/staff" end className={navLinkClass}>
            <LayoutDashboard className="w-4 h-4 shrink-0" />
            <span className="truncate">Dashboard</span>
          </NavLink>
          <NavLink to="/staff/catalog" className={navLinkClass}>
            <BookCopy className="w-4 h-4 shrink-0" />
            <span className="truncate">Catalogue & Copies</span>
          </NavLink>
          <NavLink to="/staff/timetable" className={navLinkClass}>
            <CalendarCheck className="w-4 h-4 shrink-0 text-[#7654D7]" />
            <span className="truncate">Library Timetable</span>
          </NavLink>
          <NavLink
            to="/staff/members?tab=directory"
            className={() =>
              navLinkClass({
                isActive:
                  location.pathname === '/staff/members' &&
                  (location.search === '' ||
                    location.search.includes('tab=directory')),
              })
            }
          >
            <Users className="w-4 h-4 shrink-0" />
            <span className="truncate">Members Directory</span>
          </NavLink>
          <NavLink to="/staff/bulk-registration" className={navLinkClass}>
            <UserPlus className="w-4 h-4 shrink-0 text-[#7654D7]" />
            <span className="truncate">Bulk Class Enrol</span>
          </NavLink>
          <NavLink
            to="/staff/members?tab=requests"
            className={() =>
              navLinkClass({
                isActive:
                  location.pathname === '/staff/members' &&
                  location.search.includes('tab=requests'),
              })
            }
          >
            <ClipboardList className="w-4 h-4 shrink-0 text-warning" />
            <span className="truncate">Registration Requests</span>
          </NavLink>
          <NavLink to="/staff/inventory" className={navLinkClass}>
            <BookCopy className="w-4 h-4 shrink-0" />
            <span className="truncate">Stocktake & Inventory</span>
          </NavLink>
          <NavLink to="/staff/missing-books" className={navLinkClass}>
            <AlertOctagon className="w-4 h-4 shrink-0 text-warning" />
            <span className="truncate">Missing Books</span>
          </NavLink>
          <NavLink to="/staff/reports" className={navLinkClass}>
            <FileSpreadsheet className="w-4 h-4 shrink-0" />
            <span className="truncate">Reports Center</span>
          </NavLink>
        </div>
      </div>

      {/* Group 3: Administration */}
      <div>
        <div className="text-xs font-semibold text-muted-foreground px-3 mb-2 tracking-normal">
          Administration
        </div>
        <div className="space-y-1">
          <NavLink to="/staff/settings" className={navLinkClass}>
            <Settings className="w-4 h-4 shrink-0" />
            <span className="truncate">Policy & Settings</span>
          </NavLink>
          <NavLink to="/staff/audit" className={navLinkClass}>
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span className="truncate">Audit & Security</span>
          </NavLink>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden">
      {/* Skip to main content link for screen readers */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 z-50 px-4 py-2 bg-primary text-primary-foreground font-medium rounded-md shadow-elevated outline-none ring-2 ring-ring"
      >
        Skip to main content
      </a>

      {/* Top Header (64px) - Fixed top, does not scroll with either column */}
      <header className="border-b border-border bg-card/95 backdrop-blur-sm px-4 lg:px-6 h-16 flex items-center justify-between shrink-0 z-30 shadow-subtle">
        <div className="flex items-center gap-3">
          {/* Mobile Drawer Trigger */}
          <button
            onClick={() => setMobileDrawerOpen(true)}
            className="lg:hidden p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="Open staff navigation drawer"
            aria-expanded={mobileDrawerOpen}
          >
            <Menu className="w-5 h-5" />
          </button>

          <NavLink to="/staff" className="flex items-center gap-2.5">
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

          <Badge variant="warning" size="sm" className="hidden sm:inline-flex ml-1">
            Staff Workspace
          </Badge>

          <span className="hidden md:inline-flex text-xs text-muted-foreground border-l border-border pl-3">
            Branch: <strong className="text-foreground ml-1 font-semibold">Colombo Central (HQ)</strong>
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <LanguageSwitcher />
          <ThemeSwitcher />
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              await signOut();
              navigate('/');
            }}
            className="text-muted-foreground hover:text-danger gap-1.5 px-2.5"
            aria-label="Sign Out"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Desktop Left Staff Navigation Sidebar - Scrolls independently */}
        <aside
          className={cn(
            'hidden lg:block border-r border-border bg-card/60 p-4 transition-all duration-200 overflow-y-auto shrink-0 relative h-full',
            isCollapsed ? 'w-20' : 'w-[264px]'
          )}
          aria-label="Staff navigation"
        >
          <div className="flex justify-end mb-2">
            <button
              onClick={toggleCollapsed}
              className="p-1 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground text-xs"
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>
          </div>
          {isCollapsed ? (
            <div className="space-y-4 flex flex-col items-center">
              <NavLink to="/staff" end className="p-2.5 rounded-lg hover:bg-muted text-muted-foreground" title="Dashboard">
                <LayoutDashboard className="w-5 h-5" />
              </NavLink>
              <NavLink to="/staff/circulation" className="p-2.5 rounded-lg hover:bg-muted text-muted-foreground" title="Desk Scan Mode">
                <ScanLine className="w-5 h-5" />
              </NavLink>
              <NavLink to="/staff/issued-books" className="p-2.5 rounded-lg hover:bg-muted text-muted-foreground" title="Issued Books">
                <BookOpen className="w-5 h-5" />
              </NavLink>
              <NavLink to="/staff/fines" className="p-2.5 rounded-lg hover:bg-muted text-muted-foreground" title="Overdue & Fines">
                <Coins className="w-5 h-5" />
              </NavLink>
              <NavLink to="/staff/catalog" className="p-2.5 rounded-lg hover:bg-muted text-muted-foreground" title="Catalog">
                <BookCopy className="w-5 h-5" />
              </NavLink>
              <NavLink to="/staff/members?tab=directory" className="p-2.5 rounded-lg hover:bg-muted text-muted-foreground" title="Members">
                <Users className="w-5 h-5" />
              </NavLink>
              <NavLink to="/staff/settings" className="p-2.5 rounded-lg hover:bg-muted text-muted-foreground" title="Settings">
                <Settings className="w-5 h-5" />
              </NavLink>
            </div>
          ) : (
            navigationContent
          )}
        </aside>

        {/* Mobile Off-canvas Drawer */}
        {mobileDrawerOpen && (
          <div
            className="fixed inset-0 z-50 lg:hidden flex"
            role="dialog"
            aria-modal="true"
            aria-label="Staff Navigation"
          >
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity animate-in fade-in"
              onClick={() => setMobileDrawerOpen(false)}
              aria-hidden="true"
            />

            {/* Off-canvas Sheet */}
            <div className="relative w-72 max-w-[85vw] bg-card border-r border-border h-full p-4 overflow-y-auto shadow-elevated z-10 flex flex-col animate-in slide-in-from-left duration-200">
              <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <span className="font-heading font-bold text-base text-primary">
                    LibraryOS
                  </span>
                </div>
                <button
                  onClick={() => setMobileDrawerOpen(false)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted"
                  aria-label="Close navigation"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1">{navigationContent}</div>

              <div className="pt-4 border-t border-border text-xs text-muted-foreground">
                Branch: <strong className="text-foreground">Colombo Central (HQ)</strong>
              </div>
            </div>
          </div>
        )}

        {/* Staff Main View - Scrolls independently without moving the sidebar */}
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto w-full h-full animate-fade-in outline-none"
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};
