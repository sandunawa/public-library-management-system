import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ScanLine,
  LogIn,
  LogOut,
  Maximize2,
  Minimize2,
  Users,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Sparkles,
  ArrowRight,
  BookOpen,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { AttendanceRepository } from '@/services/repositories/AttendanceRepository';
import { LocalAuthService } from '@/services/auth/LocalAuthService';
import { SoundService } from '@/services/infrastructure/SoundService';
import { CountdownRing } from '@/components/ui/countdown-ring';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MemberProfile } from '@libraryos/shared';

export const KioskPage: React.FC = () => {
  const [direction, setDirection] = useState<'IN' | 'OUT'>('IN');
  const [scanVal, setScanVal] = useState('');
  const [lastScannedMember, setLastScannedMember] = useState<MemberProfile | null>(null);
  const [lastScanDirection, setLastScanDirection] = useState<'IN' | 'OUT'>('IN');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(SoundService.getMuted());
  const [occupancy, setOccupancy] = useState(AttendanceRepository.getLiveOccupancy());
  const [currentTime, setCurrentTime] = useState(new Date());

  const scanInputRef = useRef<HTMLInputElement | null>(null);
  const resetTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Keep clock updated
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto focus scan input
  const keepFocus = () => {
    if (scanInputRef.current) {
      scanInputRef.current.focus();
    }
  };

  useEffect(() => {
    keepFocus();
    const clickHandler = () => keepFocus();
    window.addEventListener('click', clickHandler);
    return () => window.removeEventListener('click', clickHandler);
  }, []);

  // Screen Wake Lock API
  useEffect(() => {
    let wakeLock: any = null;
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await (navigator as any).wakeLock.request('screen');
        }
      } catch (err) {
        console.warn('Screen WakeLock error:', err);
      }
    };
    requestWakeLock();
    return () => {
      if (wakeLock) wakeLock.release();
    };
  }, []);

  const handleFullscreenToggle = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handleMuteToggle = () => {
    const next = !isMuted;
    SoundService.setMuted(next);
    setIsMuted(next);
  };

  const processScan = (raw: string) => {
    const query = raw.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!query) return;

    const allMembers = LocalAuthService.getAllMembers();
    const member = allMembers.find((m) => {
      const idClean = m.memberIdNumber.toLowerCase().replace(/[^a-z0-9]/g, '');
      const uidClean = m.id.toLowerCase().replace(/[^a-z0-9]/g, '');
      const admClean = (m.admissionNo || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      return idClean === query || uidClean === query || (admClean && admClean === query);
    });

    if (!member) {
      SoundService.playError();
      setErrorMessage(`Card not recognized: "${raw}". Please visit the circulation desk.`);
      setLastScannedMember(null);
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
      resetTimerRef.current = setTimeout(() => setErrorMessage(null), 4000);
      return;
    }

    if (member.status === 'SUSPENDED' || member.status === 'BLOCKED') {
      SoundService.playWarning();
      setErrorMessage(`Account status: ${member.status}. Please visit the main desk.`);
      setLastScannedMember(null);
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
      resetTimerRef.current = setTimeout(() => setErrorMessage(null), 4000);
      return;
    }

    // Success scan
    SoundService.playSuccess();
    setErrorMessage(null);
    setLastScannedMember(member);
    setLastScanDirection(direction);

    AttendanceRepository.logScan({
      memberId: member.id,
      admissionNo: member.admissionNo,
      memberName: member.fullName,
      grade: member.grade,
      section: member.section,
      direction,
      method: 'SCAN',
    });

    setOccupancy(AttendanceRepository.getLiveOccupancy());

    // Auto reset welcome greeting after 4 seconds
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    resetTimerRef.current = setTimeout(() => {
      setLastScannedMember(null);
    }, 4500);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      processScan(scanVal);
      setScanVal('');
    } else if (e.key === ' ' && scanVal.trim() === '') {
      // Space toggles IN / OUT
      e.preventDefault();
      setDirection((d) => (d === 'IN' ? 'OUT' : 'IN'));
    }
  };

  return (
    <div className="min-h-screen bg-[#0E0C1B] text-white flex flex-col justify-between p-6 select-none relative overflow-hidden font-sans">
      {/* Background ambient lighting */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#7654D7]/20 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[#7654D7]/20 rounded-full blur-[140px] pointer-events-none" />

      {/* Invisible Auto-Refocus Scanner Field */}
      <input
        ref={scanInputRef}
        type="text"
        value={scanVal}
        onChange={(e) => setScanVal(e.target.value)}
        onKeyDown={handleKeyDown}
        className="opacity-0 absolute top-0 left-0 w-1 h-1 pointer-events-none"
        autoFocus
      />

      {/* Top Bar: Brand, Occupancy, Live Clock & Controls */}
      <header className="flex items-center justify-between border-b border-white/10 pb-4 z-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#7654D7] flex items-center justify-center shadow-lg shadow-[#7654D7]/30">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Smart Entrance Kiosk</h1>
            <p className="text-xs text-white/50">LibraryOS Automated Access Control</p>
          </div>
        </div>

        {/* Live Occupancy Meter */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-2xl border border-white/10">
            <Users className="w-5 h-5 text-[#7654D7]" />
            <div className="text-left">
              <span className="text-[11px] font-semibold text-white/50 uppercase block">Inside Library</span>
              <span className="text-xl font-black font-mono text-emerald-400">{occupancy.currentCount}</span>
            </div>
            <div className="h-6 w-px bg-white/10 mx-1" />
            <div className="text-left">
              <span className="text-[11px] font-semibold text-white/50 uppercase block">Total Today</span>
              <span className="text-xl font-black font-mono text-white/80">{occupancy.todayTotalEntries}</span>
            </div>
          </div>

          <div className="text-right hidden sm:block">
            <div className="text-xl font-bold font-mono">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
            <div className="text-xs text-white/50 font-medium">
              {currentTime.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handleMuteToggle}
              className="rounded-xl border-white/20 bg-white/5 hover:bg-white/10 text-white"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-white" />}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleFullscreenToggle}
              className="rounded-xl border-white/20 bg-white/5 hover:bg-white/10 text-white"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Interactive Scanning Center */}
      <main className="flex-1 flex flex-col items-center justify-center my-6 z-10 max-w-2xl mx-auto w-full text-center">
        {/* Direction Toggle (IN / OUT) */}
        <div className="flex p-1.5 rounded-2xl bg-white/5 border border-white/10 mb-8 w-full max-w-sm">
          <button
            type="button"
            onClick={() => {
              setDirection('IN');
              keepFocus();
            }}
            className={`flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
              direction === 'IN'
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <LogIn className="w-4 h-4" />
            ENTRANCE (IN)
          </button>
          <button
            type="button"
            onClick={() => {
              setDirection('OUT');
              keepFocus();
            }}
            className={`flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
              direction === 'OUT'
                ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/25'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <LogOut className="w-4 h-4" />
            EXIT (OUT)
          </button>
        </div>

        {/* Dynamic Display Area */}
        <div className="w-full">
          <AnimatePresence mode="wait">
            {lastScannedMember ? (
              <motion.div
                key="welcome"
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-8 rounded-3xl bg-white/5 border-2 border-[#7654D7] shadow-2xl backdrop-blur-xl relative"
              >
                <div className="absolute top-4 right-4">
                  <CountdownRing
                    secondsRemaining={4}
                    totalSeconds={4}
                    size={48}
                    strokeWidth={4}
                    className="text-[#7654D7]"
                  />
                </div>

                <div className="flex flex-col items-center">
                  <div className="w-24 h-24 rounded-full border-4 border-[#7654D7] bg-[#7654D7]/20 flex items-center justify-center text-3xl font-black text-white mb-4 shadow-xl">
                    {lastScannedMember.fullName.substring(0, 2).toUpperCase()}
                  </div>

                  <Badge className={lastScanDirection === 'IN' ? 'bg-emerald-500 mb-2' : 'bg-rose-500 mb-2'}>
                    {lastScanDirection === 'IN' ? 'WELCOME TO THE LIBRARY' : 'THANK YOU FOR VISITING'}
                  </Badge>

                  <h2 className="text-3xl font-extrabold tracking-tight text-white mb-1">
                    {lastScannedMember.fullName}
                  </h2>
                  <p className="text-white/60 font-mono text-sm">
                    Student ID: {lastScannedMember.memberIdNumber}
                    {lastScannedMember.grade ? ` • Grade ${lastScannedMember.grade}-${lastScannedMember.section || ''}` : ''}
                  </p>

                  <div className="mt-4 flex items-center gap-2 text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-4 py-1.5 rounded-full border border-emerald-500/20">
                    <ShieldCheck className="w-4 h-4" />
                    Attendance Successfully Recorded
                  </div>
                </div>
              </motion.div>
            ) : errorMessage ? (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="p-8 rounded-3xl bg-rose-500/10 border-2 border-rose-500/40 backdrop-blur-xl"
              >
                <AlertTriangle className="w-12 h-12 text-rose-400 mx-auto mb-3" />
                <h3 className="text-xl font-bold text-rose-300 mb-1">Notice</h3>
                <p className="text-white/80 text-sm max-w-md mx-auto">{errorMessage}</p>
              </motion.div>
            ) : (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-10 rounded-3xl bg-white/[0.03] border-2 border-[#7654D7]/40 shadow-2xl backdrop-blur-xl"
              >
                <div className="w-20 h-20 rounded-2xl bg-[#7654D7]/20 border-2 border-[#7654D7] flex items-center justify-center mx-auto mb-5 text-[#7654D7] animate-pulse">
                  <ScanLine className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight mb-2">Please Scan Your Member Card</h2>
                <p className="text-white/50 text-sm max-w-sm mx-auto mb-4">
                  Hold your student barcode or QR code beneath the reader to log your library entrance.
                </p>
                <div className="text-xs text-white/40 flex items-center justify-center gap-2">
                  <kbd className="px-2 py-0.5 rounded bg-white/10 font-mono text-[10px]">SPACE</kbd>
                  <span>to switch IN / OUT</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer Info */}
      <footer className="flex items-center justify-between text-xs text-white/40 border-t border-white/10 pt-4 z-10">
        <div>Offline-first resilient mode active • Instant synchronization</div>
        <div>Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-[10px]">ESC</kbd> to return to staff view</div>
      </footer>
    </div>
  );
};
