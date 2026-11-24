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
  LogOut,
  ScanLine,
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

  const handleStudentArrival = (
    member: MemberProfile,
    batchName?: string,
    photoUrl?: string,
    direction: 'in' | 'out' = 'in',
    debounceWarning?: string
  ) => {
    const todayStr = new Date().toISOString().split('T')[0] || '';
    const { wasAbsentLastSession, hasUnpaidFees, lastSessionDate, unpaidAmount } =
      GateAttendanceService.evaluateStudentStatus(member, todayStr);
    const greeting = getGreeting(member.fullName);

    // If debounced within 3 minutes
    if (debounceWarning) {
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
        greetingText: '⚠️ DUPLICATE SCAN IGNORED',
        spokenGreeting: `Card already recorded. Please wait 3 minutes before scanning again.`,
        greetingType: greeting.greetingType,
        direction,
        isAlert: true,
        alertType: 'debounced',
        alertTitle: '⚠️ CARD ALREADY SCANNED (තත්පර කිහිපයකට පෙර ස්කෑන් කරන ලදී)',
        alertMessage: debounceWarning,
      };

      setActiveScan(event);
      playEmergencyAlarmSound();
      return;
    }

    const isExit = direction === 'out';
    const isAlert = !isExit && (wasAbsentLastSession || hasUnpaidFees);
    let alertType: 'absent_last_week' | 'unpaid_fees' | 'absent_and_unpaid' | undefined;
    let alertTitle: string | undefined;
    let alertMessage: string | undefined;
    let spokenMsg = isExit
      ? `Thank you ${member.fullName}! Have a great day. You have exited the library.`
      : greeting.spokenGreeting;

    if (!isExit) {
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
      greetingText: isExit
        ? `Goodbye, ${member.fullName}! (පුස්තකාලයෙන් පිටවීම සටහන් විය)`
        : isAlert
        ? alertTitle!
        : greeting.greetingText,
      spokenGreeting: spokenMsg,
      greetingType: greeting.greetingType,
      direction,
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
    // When scanning at the gate, the student has arrived at the library.
    const arrivalHours = arrivalDate.getHours();
    const arrivalMinutes = arrivalDate.getMinutes();
    const arrivalTotalMinutes = arrivalHours * 60 + arrivalMinutes;

    const [startH, startM] = (schedStart || '08:00').split(':').map((v) => Number(v) || 0);
    const startTotalMinutes = (startH ?? 8) * 60 + (startM ?? 0);

    if (arrivalTotalMinutes <= startTotalMinutes) {
      return 'present';
    } else {
      return 'late';
    }
  };

  const handleBarcodeScanned = async (scannedString: string) => {
    if (!scannedString.trim()) return;
    const raw = scannedString.trim();

    const matched = LocalAuthService.findMemberByBarcodeOrId(raw);

    if (matched) {
      const todayStr = new Date().toISOString().split('T')[0] || '';
      const determinedStatus = determineArrivalStatus(
        new Date(),
        currentActiveBatch.startTime || '08:00',
        currentActiveBatch.endTime || '10:30'
      );

      // Process via Smart Gate Attendance (In / Out toggle + 3-minute debounce)
      const scanResult = GateAttendanceService.processSmartGateScan({
        batchId: currentActiveBatch.id,
        batchName: currentActiveBatch.name,
        sessionDate: todayStr,
        studentId: matched.memberIdNumber || matched.id,
        studentName: matched.fullName,
        status: determinedStatus,
        markedBy: 'gate_kiosk',
        verificationMethod: 'gate_kiosk',
        notes: `Gate Scanner Checked`,
      });

      const photo = await PhotoStore.getPhoto(matched.id);

      if (scanResult.action === 'debounced') {
        handleStudentArrival(
          matched,
          currentActiveBatch.name,
          photo || undefined,
          'in',
          scanResult.message
        );
      } else if (scanResult.action === 'check_out') {
        handleStudentArrival(
          matched,
          currentActiveBatch.name,
          photo || undefined,
          'out'
        );
      } else {
        handleStudentArrival(
          matched,
          currentActiveBatch.name,
          photo || undefined,
          'in'
        );
      }
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
      {/* MASTER BACKGROUND IMAGE: Ultra-realistic daylight smart library matching hero aesthetic */}
      <div className="absolute inset-0 z-0">
        <img
          src="/images/smart-gate-kiosk-bg.jpg"
          alt="Smart Gate Library Access Terminal Background"
          className="w-full h-full object-cover object-center"
          onError={(e) => {
            // fallback
            (e.target as HTMLImageElement).src = '/images/enivac-hero-bg.jpg';
          }}
        />
        {/* Soft, subtle header & footer gradient scrims so text remains readable without dimming the bright library */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/35" />
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
      <header className="relative z-20 px-6 sm:px-10 py-4 flex items-center justify-between border-b border-indigo-200/80 backdrop-blur-xl bg-white/85 shadow-lg shadow-indigo-950/5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#1E0FA8] via-[#3621D8] to-[#4F35E8] p-[2px] shadow-lg shadow-indigo-500/20">
            <div className="w-full h-full bg-[#1E0FA8] rounded-[14px] flex items-center justify-center font-black text-white text-xl tracking-wider">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="text-left">
            <h1 className="text-lg sm:text-xl font-black tracking-tight text-slate-900 flex items-center gap-2.5">
              <span>Smart Gate Attendance Display</span>
              <span
                className={`px-3 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow ${
                  isBlinkingRed
                    ? 'bg-rose-600 text-white animate-bounce'
                    : 'bg-indigo-50 text-[#1E0FA8] border border-indigo-200'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${isBlinkingRed ? 'bg-white' : 'bg-[#1E0FA8]'} animate-ping`}
                />
                {isBlinkingRed ? 'Security Alert' : 'Live Terminal'}
              </span>
            </h1>
          </div>
        </div>

        {/* Live Clock & Screen Controls */}
        <div className="flex items-center gap-6">
          <div className="hidden md:flex flex-col items-end">
            <div className="font-mono text-2xl font-black text-[#1E0FA8] tracking-wider flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#1E0FA8]" />
              {currentTime.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true,
              })}
            </div>
            <div className="text-xs text-slate-500 font-semibold tracking-wide flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#1E0FA8]" />
              {currentTime.toLocaleDateString('en-US', {
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
              className={`p-2.5 rounded-2xl border transition-all shadow-sm ${
                soundEnabled
                  ? 'bg-indigo-50 text-[#1E0FA8] border-indigo-200 hover:bg-indigo-100'
                  : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200'
              }`}
              title={soundEnabled ? 'Speech Voice Enabled' : 'Speech Muted'}
            >
              {soundEnabled ? <Volume2 className="w-5 h-5 text-[#1E0FA8]" /> : <VolumeX className="w-5 h-5" />}
            </button>

            <button
              onClick={toggleFullScreen}
              className="p-2.5 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:text-[#1E0FA8] hover:border-[#1E0FA8] transition-all shadow-sm"
              title="Toggle Fullscreen"
            >
              <Maximize2 className="w-5 h-5" />
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
            className={`w-full max-w-2xl rounded-3xl p-8 sm:p-10 shadow-2xl backdrop-blur-xl animate-in zoom-in-95 duration-300 flex flex-col items-center text-center relative overflow-hidden transition-all ${
              isBlinkingRed
                ? 'bg-white/95 border-2 border-rose-500 shadow-rose-500/20'
                : 'bg-white/95 border border-indigo-200 shadow-xl shadow-indigo-950/10'
            }`}
          >
            {/* Top decorative badge */}
            <div
              className={`absolute top-0 inset-x-0 h-2 ${
                isBlinkingRed
                  ? 'bg-gradient-to-r from-rose-600 via-amber-400 to-rose-600 animate-pulse'
                  : 'bg-gradient-to-r from-[#1E0FA8] via-[#4F35E8] to-[#1E0FA8]'
              }`}
            />

            <div className="relative mb-5">
              {/* Student Photo */}
              <div
                className={`relative w-36 h-36 sm:w-44 sm:h-44 rounded-full overflow-hidden border-4 shadow-xl bg-slate-100 ${
                  isBlinkingRed ? 'border-rose-400' : 'border-[#1E0FA8]'
                }`}
              >
                {activeScan.avatarUrl ? (
                  <img
                    src={activeScan.avatarUrl}
                    alt={activeScan.studentName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-[#1E0FA8] to-[#4F35E8] flex items-center justify-center text-4xl sm:text-5xl font-black text-white">
                    {activeScan.studentName.charAt(0)}
                  </div>
                )}
              </div>

              {/* Status Badge Icon */}
              <div
                className={`absolute bottom-1 right-2 w-11 h-11 rounded-full border-4 border-white flex items-center justify-center text-white shadow-lg ${
                  isBlinkingRed ? 'bg-rose-600 animate-bounce' : 'bg-emerald-500'
                }`}
              >
                {isBlinkingRed ? (
                  <AlertTriangle className="w-6 h-6 text-white" />
                ) : (
                  <CheckCircle2 className="w-7 h-7 text-white" />
                )}
              </div>
            </div>

            {/* Alert / Greeting Pill */}
            <div
              className={`inline-flex items-center gap-2 px-5 py-1.5 rounded-full text-xs sm:text-sm font-black uppercase tracking-wider mb-2 border ${
                activeScan.alertType === 'debounced'
                  ? 'bg-amber-50 border-amber-300 text-amber-800 animate-pulse'
                  : isBlinkingRed
                  ? 'bg-rose-50 border-rose-300 text-rose-800 animate-pulse'
                  : activeScan.direction === 'out'
                  ? 'bg-blue-50 border-blue-300 text-blue-800'
                  : 'bg-emerald-50 border-emerald-300 text-emerald-800'
              }`}
            >
              {activeScan.alertType === 'debounced' ? (
                <>
                  <Clock className="w-4 h-4 text-amber-600 animate-spin" />
                  <span>3-MINUTE SCAN BUFFER ACTIVE</span>
                </>
              ) : isBlinkingRed ? (
                <>
                  <AlertTriangle className="w-4 h-4 text-rose-600 animate-bounce" />
                  <span>{activeScan.alertTitle}</span>
                </>
              ) : activeScan.direction === 'out' ? (
                <>
                  <LogOut className="w-4 h-4 text-blue-600" />
                  <span>EXIT VERIFIED</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-[#1E0FA8]" />
                  <span>{activeScan.greetingType.toUpperCase()} CHECK-IN VERIFIED</span>
                </>
              )}
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight mb-2 font-heading">
              {activeScan.studentName}
            </h2>

            <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-slate-600 mb-5 font-medium">
              <span className="font-mono px-3 py-1 rounded-lg bg-slate-100 text-[#1E0FA8] font-bold border border-slate-200">
                ID: {activeScan.studentId}
              </span>
              <span>•</span>
              <span className="text-slate-700 font-semibold">
                {activeScan.direction === 'out' ? (
                  <span className="text-blue-700 font-bold">LIBRARY EXIT</span>
                ) : (
                  <span className="text-emerald-700 font-bold">LIBRARY ENTRANCE</span>
                )}
              </span>
              <span>•</span>
              <span className="text-[#1E0FA8] font-mono font-bold">{activeScan.scanTime}</span>
            </div>

            <div
              className={`w-full p-4 rounded-2xl border text-sm sm:text-base font-bold ${
                activeScan.alertType === 'debounced'
                  ? 'bg-amber-50 border-amber-200 text-amber-900 shadow-sm'
                  : isBlinkingRed
                  ? 'bg-rose-50 border-rose-200 text-rose-900 shadow-sm'
                  : activeScan.direction === 'out'
                  ? 'bg-blue-50 border-blue-200 text-blue-900 shadow-sm'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-900 shadow-sm'
              }`}
            >
              {activeScan.alertMessage ||
                (activeScan.direction === 'out'
                  ? '👋 Have a great day! Your library exit has been recorded.'
                  : '✨ Welcome to the library! Enjoy your study session.')}
            </div>
          </div>
        ) : (
          /* DEFAULT IDLE STATE: Clean White Frosted Glass Card with Animated Barcode Scanning Laser */
          <div className="max-w-md w-full text-center flex flex-col items-center backdrop-blur-2xl bg-white/90 p-8 sm:p-10 rounded-3xl border border-indigo-200/80 shadow-2xl shadow-indigo-950/10">
            {/* Animated Barcode Scanner Terminal */}
            <div className="relative mb-6">
              <div className="w-36 h-36 rounded-3xl bg-violet-50/80 border-2 border-[#1E0FA8]/40 flex flex-col items-center justify-center shadow-inner relative overflow-hidden group">
                <ScanLine className="w-16 h-16 text-[#1E0FA8]" />
                {/* Horizontal Scanning Laser Bar Animation */}
                <div className="absolute inset-x-2 h-0.5 bg-gradient-to-r from-transparent via-[#4F35E8] to-transparent animate-pulse shadow-[0_0_12px_#4F35E8]" />
              </div>
              <div className="absolute -bottom-3 inset-x-0 flex justify-center">
                <span className="px-4 py-1.5 rounded-full bg-[#1E0FA8] text-white text-xs font-black uppercase tracking-wider shadow-md flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  Ready to Scan
                </span>
              </div>
            </div>

            {/* Simple concise English text */}
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-2 font-heading">
              Scan Your ID Card
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-sm mx-auto font-medium leading-relaxed">
              Please present your student or member barcode card to the scanner.
            </p>
          </div>
        )}
      </main>

      {/* Footer Instructions */}
      <footer className="relative z-20 px-8 py-3.5 border-t border-slate-200/80 backdrop-blur-xl bg-white/85 flex flex-wrap items-center justify-between text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#1E0FA8]" />
          <span className="font-semibold text-slate-700">Smart Gate Check-in System • Dual-Screen Enabled</span>
        </div>
        <div className="flex items-center gap-4 font-medium">
          <span>
            Terminal Gate: <b className="text-[#1E0FA8]">Gate 01 (Main Entrance)</b>
          </span>
          <span className="hidden sm:inline">•</span>
          <span>
            Audio Feedback: <b className="text-emerald-600">{soundEnabled ? 'Active' : 'Muted'}</b>
          </span>
        </div>
      </footer>
    </div>
  );
};
