import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Volume2,
  VolumeX,
  Maximize2,
  Clock,
  Calendar,
  CheckCircle2,
  QrCode,
  ShieldCheck,
  AlertTriangle,
  CreditCard,
  XCircle,
  Check,
  BookOpen,
  GraduationCap,
} from 'lucide-react';
import { LocalAuthService } from '@/services/auth/LocalAuthService';
import { GateAttendanceService, GateScanEvent, DEFAULT_GATE_SETTINGS } from '@/services/infrastructure/GateAttendanceService';
import { PhotoStore } from '@/services/infrastructure/PhotoStore';
import { MemberProfile } from '@libraryos/shared';

export const StudentGateKioskPage: React.FC = () => {
  const [activeScan, setActiveScan] = useState<GateScanEvent | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [paymentSuccessPopup, setPaymentSuccessPopup] = useState<{ studentName: string } | null>(null);
  const [webSettings, setWebSettings] = useState(GateAttendanceService.getSettings());

  const [currentActiveBatch, setCurrentActiveBatch] = useState<{
    id: string;
    name: string;
    startTime?: string;
    endTime?: string;
  }>(() => {
    try {
      const stored = localStorage.getItem('gate_selected_batch');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.batchId) {
          return {
            id: parsed.batchId,
            name: parsed.batchName,
            startTime: parsed.startTime,
            endTime: parsed.endTime,
          };
        }
      }
    } catch (e) {}
    return {
      id: 'batch-1',
      name: 'Sinhala Language Master Batch (සිංහල භාෂාව හා සාහිත්‍යය)',
      startTime: '08:00',
      endTime: '10:30',
    };
  });

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hiddenInputRef = useRef<HTMLInputElement | null>(null);

  // Digital Clock Tick
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Invisible, unlosable scanner input auto-focus
  useEffect(() => {
    const keepFocus = () => {
      hiddenInputRef.current?.focus();
    };
    keepFocus();
    window.addEventListener('click', keepFocus);
    const keydownHandler = () => {
      if (document.activeElement !== hiddenInputRef.current) {
        hiddenInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', keydownHandler);
    const interval = setInterval(keepFocus, 1000);
    return () => {
      window.removeEventListener('click', keepFocus);
      window.removeEventListener('keydown', keydownHandler);
      clearInterval(interval);
    };
  }, []);

  // Play Emergency Alarm Buzzer Tone
  const playEmergencyAlarmSound = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        for (let i = 0; i < 3; i++) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(440, ctx.currentTime + i * 0.2);
          osc.frequency.setValueAtTime(880, ctx.currentTime + i * 0.2 + 0.1);

          gain.gain.setValueAtTime(0.3, ctx.currentTime + i * 0.2);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.2 + 0.18);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + i * 0.2);
          osc.stop(ctx.currentTime + i * 0.2 + 0.19);
        }
      }
    } catch (e) {
      console.warn('Alarm audio error:', e);
    }
  };

  // Play Pleasant Success Chime & Voice Greeting
  const playGreetingAudio = (spokenText: string) => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      }

      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(spokenText);
        utterance.rate = 1.0;
        utterance.pitch = 1.05;
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice =
          voices.find(
            (v) =>
              v.lang.startsWith('en') &&
              (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Female'))
          ) || voices.find((v) => v.lang.startsWith('en'));
        if (preferredVoice) utterance.voice = preferredVoice;
        window.speechSynthesis.speak(utterance);
      }
    } catch (e) {
      console.warn('Speech playback error:', e);
    }
  };

  // Determine Time-Appropriate Greeting
  const getGreeting = (studentName: string) => {
    const hours = new Date().getHours();
    if (hours < 12) {
      return {
        greetingType: 'morning' as const,
        greetingText: `Good Morning, ${studentName}!`,
        spokenGreeting: `Good morning, ${studentName}! Welcome to your lecture!`,
      };
    } else if (hours < 16) {
      return {
        greetingType: 'afternoon' as const,
        greetingText: `Good Afternoon, ${studentName}!`,
        spokenGreeting: `Good afternoon, ${studentName}! Welcome to class!`,
      };
    } else {
      return {
        greetingType: 'evening' as const,
        greetingText: `Good Evening, ${studentName}!`,
        spokenGreeting: `Good evening, ${studentName}! Welcome to your class session!`,
      };
    }
  };

  // Auto-Reset Timer Effect
  useEffect(() => {
    if (!activeScan) return;
    const duration = activeScan.isAlert ? 10000 : 3500;
    const timer = setTimeout(() => {
      setActiveScan(null);
      setPaymentSuccessPopup(null);
      hiddenInputRef.current?.focus();
    }, duration);
    return () => clearTimeout(timer);
  }, [activeScan]);

  const handleStudentArrival = (member: MemberProfile, batchName?: string, photoUrl?: string) => {
    const todayStr = new Date().toISOString().split('T')[0] || '';
    const { wasAbsentLastSession, hasUnpaidFees, lastSessionDate, unpaidAmount } =
      GateAttendanceService.evaluateStudentStatus(member, todayStr);
    const greeting = getGreeting(member.fullName);

    const isAlert = wasAbsentLastSession || hasUnpaidFees;
    let alertType: 'absent_last_week' | 'unpaid_fees' | 'absent_and_unpaid' | undefined;
    let alertTitle: string | undefined;
    let alertMessage: string | undefined;
    let spokenMsg = greeting.spokenGreeting;

    if (wasAbsentLastSession && hasUnpaidFees) {
      alertType = 'absent_and_unpaid';
      alertTitle = '⚠️ ATTENDANCE & PAYMENT NOTICE';
      alertMessage = `පසුගිය දිනයේ නොපැමිණි අතර රු. ${unpaidAmount.toFixed(2)} ක ගෙවීම් ශේෂයක් පවතී. කරුණාකර කවුන්ටරය වෙත යොමු වන්න.`;
      spokenMsg = `Attention ${member.fullName}. Please report to the reception counter regarding your pending fees and absence.`;
    } else if (hasUnpaidFees) {
      alertType = 'unpaid_fees';
      alertTitle = '💳 MONTHLY FEE / FINE PAYMENT PENDING';
      alertMessage = `රු. ${unpaidAmount.toFixed(2)} ක මුදලක් ගෙවීමට ඉතිරිව ඇත. කරුණාකර කවුන්ටරයෙන් ගෙවීම සිදු කරන්න.`;
      spokenMsg = `Attention ${member.fullName}. You have a pending balance of ${Math.round(unpaidAmount)} rupees. Please visit the counter.`;
    } else if (wasAbsentLastSession) {
      alertType = 'absent_last_week';
      alertTitle = '⚠️ PREVIOUS CLASS ABSENT';
      alertMessage = `පසුගිය දින (${lastSessionDate || 'පෙර පන්තිය'}) නොපැමිණි බව සටහන්ව ඇත. අතපසු වූ පාඩම් සම්පූර්ණ කරගන්න.`;
      spokenMsg = `Welcome ${member.fullName}. You were marked absent last class. Please catch up on your missed lessons.`;
    }

    const event: GateScanEvent = {
      studentId: member.memberIdNumber,
      studentName: member.fullName,
      avatarUrl: photoUrl,
      batchName: batchName || currentActiveBatch.name,
      grade: member.grade,
      section: member.section,
      admissionNo: member.admissionNo,
      scanTime: new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      }),
      greetingText: isAlert ? alertTitle! : greeting.greetingText,
      spokenGreeting: spokenMsg,
      greetingType: greeting.greetingType,
      isAlert,
      alertType,
      alertTitle,
      alertMessage,
    };

    setActiveScan(event);

    if (isAlert) {
      playEmergencyAlarmSound();
      setTimeout(() => {
        playGreetingAudio(spokenMsg);
      }, 500);
    } else {
      playGreetingAudio(spokenMsg);
    }
  };

  // Cross-Window Listener via BroadcastChannel
  useEffect(() => {
    let channel: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== 'undefined') {
      channel = new BroadcastChannel('gate_attendance_channel');
      channel.onmessage = async (msgEvent) => {
        if (msgEvent.data) {
          if (msgEvent.data.type === 'GATE_STUDENT_SCANNED') {
            const payload = msgEvent.data.payload;
            const allMembers = LocalAuthService.getAllMembers();
            const matched = allMembers.find(
              (m) => m.id === payload.studentId || m.memberIdNumber === payload.studentId
            );
            if (matched) {
              const photo = await PhotoStore.getPhoto(matched.id);
              handleStudentArrival(matched, payload.batchName, photo || undefined);
            }
          } else if (msgEvent.data.type === 'GATE_BATCH_CHANGED') {
            const payload = msgEvent.data.payload;
            setCurrentActiveBatch({
              id: payload.batchId,
              name: payload.batchName,
              startTime: payload.startTime,
              endTime: payload.endTime,
            });
          } else if (msgEvent.data.type === 'GATE_PAYMENT_SUCCESS') {
            const payload = msgEvent.data.payload;
            setPaymentSuccessPopup({ studentName: payload.studentName });
            playGreetingAudio(`Thank you ${payload.studentName}! Your payment was successful!`);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            timeoutRef.current = setTimeout(() => {
              setPaymentSuccessPopup(null);
              setActiveScan(null);
              hiddenInputRef.current?.focus();
            }, 4000);
          }
        }
      };
    }

    return () => {
      if (channel) channel.close();
    };
  }, [soundEnabled, currentActiveBatch]);

  const determineArrivalStatus = (
    arrivalDate: Date,
    schedStart: string,
    schedEnd: string
  ): 'present' | 'late' | 'absent' => {
    const arrivalHours = arrivalDate.getHours();
    const arrivalMinutes = arrivalDate.getMinutes();
    const arrivalTotalMinutes = arrivalHours * 60 + arrivalMinutes;

    const [startH, startM] = (schedStart || '08:00').split(':').map((v) => Number(v) || 0);
    const [endH, endM] = (schedEnd || '10:30').split(':').map((v) => Number(v) || 0);

    const startTotalMinutes = (startH ?? 8) * 60 + (startM ?? 0);
    const endTotalMinutes = (endH ?? 10) * 60 + (endM ?? 30);

    if (arrivalTotalMinutes <= startTotalMinutes) {
      return 'present';
    } else if (arrivalTotalMinutes > endTotalMinutes) {
      return 'absent';
    } else {
      return 'late';
    }
  };

  const handleBarcodeScanned = async (scannedString: string) => {
    if (!scannedString.trim()) return;
    const raw = scannedString.trim();

    const matched = LocalAuthService.findMemberByBarcodeOrId(raw);

    if (matched) {
      const todayStr = new Date().toISOString().split('T')[0];
      const determinedStatus = determineArrivalStatus(
        new Date(),
        currentActiveBatch.startTime || '08:00',
        currentActiveBatch.endTime || '10:30'
      );

      // Record attendance
      GateAttendanceService.recordAttendance({
        batchId: currentActiveBatch.id,
        batchName: currentActiveBatch.name,
        sessionDate: todayStr || new Date().toISOString().split('T')[0] || '',
        studentId: matched.id,
        studentName: matched.fullName,
        status: determinedStatus,
        markedBy: 'gate_kiosk',
        verificationMethod: 'gate_kiosk',
        notes: `Gate Scanner Checked In (${determinedStatus.toUpperCase()})`,
      });

      const photo = await PhotoStore.getPhoto(matched.id);
      handleStudentArrival(matched, currentActiveBatch.name, photo || undefined);
    }
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const isBlinkingRed = activeScan?.isAlert;

  return (
    <div className="relative min-h-screen w-full text-white flex flex-col justify-between overflow-hidden select-none font-sinhala transition-colors duration-500 bg-black">
      {/* MASTER BACKGROUND IMAGE: Ultra-realistic cinematic Sri Lankan Literary Education & Library Environment */}
      <div className="absolute inset-0 z-0">
        <img
          src={webSettings.kioskBgImage}
          alt="Sinhala Literary Classroom & Heritage Library Background"
          className="w-full h-full object-cover object-center filter brightness-[0.78] contrast-[1.08]"
          onError={(e) => {
            // fallback
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/75 backdrop-blur-[0.5px]" />
        <div className="absolute inset-0 bg-[#064B2A]/20 mix-blend-color" />
      </div>

      {/* INVISIBLE HIGH-SPEED SCANNER INPUT */}
      <input
        ref={hiddenInputRef}
        type="text"
        className="opacity-0 absolute -top-100 left-0 pointer-events-none"
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            const target = e.target as HTMLInputElement;
            handleBarcodeScanned(target.value);
            target.value = '';
          }
        }}
      />

      {/* Emergency Aura Overlay if Alert Active */}
      {isBlinkingRed && (
        <div className="absolute inset-0 pointer-events-none z-10 border-[16px] border-rose-600 animate-ping opacity-75" />
      )}

      {/* Top Banner */}
      <header className="relative z-20 px-6 sm:px-10 py-5 flex items-center justify-between border-b border-[#C69A35]/30 backdrop-blur-xl bg-black/45 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#064B2A] via-[#003D22] to-[#C69A35] p-[2px] shadow-2xl">
            <div className="w-full h-full bg-[#002213] rounded-[14px] flex items-center justify-center font-black text-[#C69A35] text-xl tracking-wider">
              <BookOpen className="w-7 h-7 text-[#C69A35]" />
            </div>
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
              <span>Smart Gate Attendance Display</span>
              <span
                className={`px-3 py-0.5 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow ${
                  isBlinkingRed
                    ? 'bg-rose-600 text-white animate-bounce'
                    : 'bg-[#064B2A] text-[#FFF5DF] border border-[#C69A35]/50'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${isBlinkingRed ? 'bg-white' : 'bg-emerald-400'} animate-ping`}
                />
                {isBlinkingRed ? 'Security Alert' : 'Live Terminal'}
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-[#FFF5DF]/80 font-medium">
              {webSettings.kioskInstituteName}
            </p>
          </div>
        </div>

        {/* Live Clock & Screen Controls */}
        <div className="flex items-center gap-6">
          <div className="hidden md:flex flex-col items-end">
            <div className="font-mono text-2xl font-black text-[#C69A35] tracking-wider flex items-center gap-2 drop-shadow">
              <Clock className="w-5 h-5 text-[#C69A35]" />
              {currentTime.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true,
              })}
            </div>
            <div className="text-xs text-[#FFF5DF]/70 font-semibold tracking-wide flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#C69A35]" />
              {currentTime.toLocaleDateString('si-LK', {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-3 rounded-2xl border transition-all shadow-md ${
                soundEnabled
                  ? 'bg-[#064B2A] text-[#FFF5DF] border-[#C69A35]/60 hover:bg-[#003D22]'
                  : 'bg-black/60 text-slate-400 border-white/20 hover:bg-black/80'
              }`}
              title={soundEnabled ? 'Speech Voice Enabled' : 'Speech Muted'}
            >
              {soundEnabled ? <Volume2 className="w-5 h-5 text-[#C69A35]" /> : <VolumeX className="w-5 h-5" />}
            </button>

            <button
              onClick={toggleFullScreen}
              className="p-3 rounded-2xl bg-black/60 text-[#FFF5DF] border border-[#C69A35]/40 hover:bg-black/80 transition-all shadow-md"
              title="Toggle Fullscreen"
            >
              <Maximize2 className="w-5 h-5 text-[#C69A35]" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Center Content */}
      <main className="relative z-20 flex-1 flex items-center justify-center p-6 sm:p-12">
        {paymentSuccessPopup ? (
          <div className="w-full max-w-2xl bg-gradient-to-b from-[#064B2A]/95 to-[#002213]/95 border-4 border-[#C69A35] rounded-3xl p-8 sm:p-12 shadow-2xl shadow-black/80 backdrop-blur-2xl animate-in zoom-in-95 duration-300 flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full bg-[#C69A35]/20 border-4 border-[#C69A35] text-[#C69A35] flex items-center justify-center mb-6 shadow-xl animate-bounce">
              <Check className="w-14 h-14 stroke-[3]" />
            </div>

            <span className="px-5 py-1.5 rounded-full bg-[#064B2A] text-[#FFF5DF] text-xs font-black uppercase tracking-widest mb-3 border border-[#C69A35]/60">
              ගෙවීම තහවුරු විය (PAYMENT VERIFIED)
            </span>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight mb-3">
              ස්තූතියි! ඔබගේ ගෙවීම ලැබිණි!
            </h2>
            <p className="text-lg text-[#FFF5DF] font-bold mb-4">
              {paymentSuccessPopup.studentName} - ගෙවීම් ශේෂය සාර්ථකව පියවා අවසන්.
            </p>
            <div className="text-sm text-[#C69A35] font-bold">
              ✨ දේශන ශාලාවට / පුස්තකාලයට සාදරයෙන් පිළිගනිමු! සාර්ථක අධ්‍යයන දවසක් වේවා!
            </div>
          </div>
        ) : activeScan ? (
          <div
            className={`w-full max-w-2xl rounded-3xl p-8 sm:p-10 shadow-2xl backdrop-blur-2xl animate-in zoom-in-95 duration-300 flex flex-col items-center text-center relative overflow-hidden transition-all ${
              isBlinkingRed
                ? 'bg-gradient-to-b from-[#2a080c]/98 to-[#180306]/98 border-4 border-rose-500 shadow-rose-500/50'
                : 'bg-gradient-to-b from-[#002B18]/95 via-[#064B2A]/95 to-[#001A0E]/95 border-2 border-[#C69A35] shadow-2xl shadow-black/80'
            }`}
          >
            {/* Top decorative badge */}
            <div
              className={`absolute top-0 inset-x-0 h-2.5 ${
                isBlinkingRed
                  ? 'bg-gradient-to-r from-rose-600 via-amber-400 to-rose-600 animate-pulse'
                  : 'bg-gradient-to-r from-[#C69A35] via-[#FFF5DF] to-[#C69A35]'
              }`}
            />

            <div className="relative mb-5">
              <div
                className={`absolute -inset-3 rounded-full blur-xl opacity-85 ${
                  isBlinkingRed
                    ? 'bg-gradient-to-tr from-rose-600 via-red-500 to-amber-500 animate-ping'
                    : 'bg-gradient-to-tr from-[#C69A35] via-[#064B2A] to-[#D4AF37] animate-pulse'
                }`}
              />

              {/* Student Photo */}
              <div
                className={`relative w-36 h-36 sm:w-44 sm:h-44 rounded-full overflow-hidden border-4 shadow-2xl bg-black ${
                  isBlinkingRed ? 'border-rose-400' : 'border-[#C69A35]'
                }`}
              >
                {activeScan.avatarUrl ? (
                  <img
                    src={activeScan.avatarUrl}
                    alt={activeScan.studentName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-[#064B2A] to-[#002B18] flex items-center justify-center text-4xl sm:text-5xl font-black text-[#FFF5DF]">
                    {activeScan.studentName.charAt(0)}
                  </div>
                )}
              </div>

              {/* Status Badge Icon */}
              <div
                className={`absolute bottom-1 right-2 w-11 h-11 rounded-full border-4 border-[#002B18] flex items-center justify-center text-white shadow-lg ${
                  isBlinkingRed ? 'bg-rose-600 animate-bounce' : 'bg-[#C69A35] text-black font-black'
                }`}
              >
                {isBlinkingRed ? (
                  <AlertTriangle className="w-6 h-6 text-white" />
                ) : (
                  <CheckCircle2 className="w-7 h-7 text-[#002B18]" />
                )}
              </div>
            </div>

            {/* Alert / Greeting Pill */}
            <div
              className={`inline-flex items-center gap-2 px-5 py-1.5 rounded-full text-xs sm:text-sm font-black uppercase tracking-wider mb-2 border ${
                isBlinkingRed
                  ? 'bg-rose-500/30 border-rose-400 text-rose-200 animate-pulse'
                  : 'bg-[#C69A35]/20 border-[#C69A35]/60 text-[#FFF5DF]'
              }`}
            >
              {isBlinkingRed ? (
                <>
                  <AlertTriangle className="w-4 h-4 text-rose-300 animate-bounce" />
                  <span>{activeScan.alertTitle}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-[#C69A35] animate-spin" />
                  <span>{activeScan.greetingType.toUpperCase()} CHECK-IN VERIFIED</span>
                </>
              )}
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight mb-2">
              {activeScan.studentName}
            </h2>

            <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-[#FFF5DF]/90 mb-5 font-medium">
              <span className="font-mono px-3 py-1 rounded-lg bg-black/50 text-[#C69A35] font-bold border border-[#C69A35]/30">
                ID: {activeScan.studentId}
              </span>
              <span>•</span>
              <span className="text-white font-semibold">
                {activeScan.grade ? `Grade ${activeScan.grade}-${activeScan.section || ''}` : activeScan.batchName}
              </span>
              <span>•</span>
              <span className="text-[#C69A35] font-mono font-bold">{activeScan.scanTime}</span>
            </div>

            <div
              className={`w-full p-4 rounded-2xl border text-sm sm:text-base font-bold ${
                isBlinkingRed
                  ? 'bg-rose-950/70 border-rose-500/60 text-rose-100 shadow-inner'
                  : 'bg-black/40 border-[#C69A35]/40 text-[#FFF5DF] shadow-inner'
              }`}
            >
              {activeScan.alertMessage || '✨ සාදරයෙන් පිළිගනිමු! කරුණාකර ඔබගේ ආසනය වෙත යන්න. සාර්ථක දවසක් වේවා!'}
            </div>
          </div>
        ) : (
          <div className="max-w-xl w-full text-center flex flex-col items-center backdrop-blur-md bg-black/45 p-8 sm:p-10 rounded-3xl border border-[#C69A35]/40 shadow-2xl">
            <div className="relative mb-6">
              <div className="w-36 h-36 rounded-3xl bg-[#064B2A]/50 border-2 border-dashed border-[#C69A35] flex items-center justify-center shadow-inner relative group">
                <QrCode className="w-20 h-20 text-[#C69A35] animate-pulse" />
                <div className="absolute inset-x-2 h-1 bg-gradient-to-r from-transparent via-[#C69A35] to-transparent top-5 animate-bounce duration-1000 shadow-[0_0_20px_#C69A35]" />
              </div>
              <div className="absolute -bottom-3 inset-x-0 flex justify-center">
                <span className="px-4 py-1.5 rounded-full bg-[#064B2A] text-[#FFF5DF] text-xs font-black uppercase tracking-wider shadow-lg border border-[#C69A35]/60 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  Ready To Scan Barcode
                </span>
              </div>
            </div>

            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-2 font-sinhala">
              ශිෂ්‍ය හැඳුනුම්පත ස්කෑන් කරන්න
            </h2>
            <p className="text-xs sm:text-sm text-[#FFF5DF]/80 max-w-md mx-auto font-medium leading-relaxed font-sinhala">
              කරුණාකර ඔබගේ ශිෂ්‍ය කාඩ්පතෙහි ඇති Barcode එක හෝ QR කේතය ස්කෑනරය වෙත යොමු කරන්න.
            </p>

            <div className="mt-5 pt-4 border-t border-[#C69A35]/25 w-full text-center">
              <span className="text-[#C69A35] text-xs font-bold font-serif tracking-wide italic">
                “{webSettings.kioskQuoteText}”
              </span>
            </div>
          </div>
        )}
      </main>

      {/* Footer Instructions */}
      <footer className="relative z-20 px-8 py-4 border-t border-[#C69A35]/30 backdrop-blur-xl bg-black/45 flex flex-wrap items-center justify-between text-xs text-[#FFF5DF]/70">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#C69A35]" />
          <span>Smart Gate Check-in System • Dual-Screen Enabled</span>
        </div>
        <div className="flex items-center gap-4">
          <span>
            ප්‍රධාන දොරටුව: <b className="text-[#C69A35]">{webSettings.kioskGateTerminalName}</b>
          </span>
          <span className="hidden sm:inline">•</span>
          <span>
            කටහඬ ආචාරය (Voice): <b className="text-emerald-400">{soundEnabled ? 'Active' : 'Muted'}</b>
          </span>
        </div>
      </footer>
    </div>
  );
};
