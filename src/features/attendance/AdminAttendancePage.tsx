import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Calendar,
  CheckCircle,
  QrCode,
  AlertCircle,
  ExternalLink,
  Monitor,
  Sparkles,
  Volume2,
  UserCheck,
  Clock,
  History,
  ShieldAlert,
  CreditCard,
  X,
  School,
  AlertTriangle,
  BadgeAlert,
  Check,
  Globe,
  Radio,
  SlidersHorizontal,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Users,
  Edit3,
  Save,
  CheckCheck,
  Layers,
  Filter,
  FileSpreadsheet,
  Search,
} from 'lucide-react';
import { LocalAuthService } from '@/services/auth/LocalAuthService';
import { GateAttendanceService, GateAttendanceRecord } from '@/services/infrastructure/GateAttendanceService';
import { PhotoStore } from '@/services/infrastructure/PhotoStore';
import { MemberProfile } from '@libraryos/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

export const AdminAttendancePage: React.FC = () => {
  const [attendance, setAttendance] = useState<GateAttendanceRecord[]>([]);
  const [members, setMembers] = useState<MemberProfile[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState('batch-1');
  const [currentTime, setCurrentTime] = useState(new Date());

  const sessionDate = new Date().toISOString().split('T')[0];
  const [qrScanInput, setQrScanInput] = useState('');
  const [scanMessage, setScanMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const [lastScannedMember, setLastScannedMember] = useState<{
    member: MemberProfile;
    photoUrl?: string;
    scanTime: string;
    batchName: string;
    lastWeekAttended: boolean;
    lastSessionDate?: string;
    hasUnpaidFees: boolean;
    feeAmount: number;
    currentMonth: string;
  } | null>(null);

  const scanInputRef = useRef<HTMLInputElement | null>(null);

  const batches = useMemo(
    () => [
      { id: 'batch-1', name: '2026 Grade 10 Theory Master Batch (10 ශ්‍රේණිය)', startTime: '08:00', endTime: '10:30' },
      { id: 'batch-2', name: '2026 Grade 11 O/L Target Batch (11 ශ්‍රේණිය සා/පෙළ)', startTime: '10:45', endTime: '13:15' },
      { id: 'batch-3', name: '2026 A/L Sinhala Special Theory (උසස් පෙළ)', startTime: '13:30', endTime: '16:30' },
      { id: 'batch-general', name: 'General Library Reading & Study Hall (පොදු පුස්තකාල)', startTime: '08:00', endTime: '17:00' },
    ],
    []
  );

  const selectedBatch = batches.find((b) => b.id === selectedBatchId) || batches[0]!;

  const [startTime, setStartTime] = useState(selectedBatch.startTime);
  const [endTime, setEndTime] = useState(selectedBatch.endTime);
  const [isTimeSaved, setIsTimeSaved] = useState(false);
  const [saveTimeSuccessMessage, setSaveTimeSuccessMessage] = useState('');

  // Historical Session Archive & Search
  const [historySelectedDate, setHistorySelectedDate] = useState(sessionDate);
  const [historySearchQuery, setHistorySearchQuery] = useState('');

  const loadData = () => {
    setAttendance(GateAttendanceService.getAttendance());
    setMembers(LocalAuthService.getAllMembers());
  };

  useEffect(() => {
    loadData();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (selectedBatch) {
      setStartTime(selectedBatch.startTime);
      setEndTime(selectedBatch.endTime);
    }
  }, [selectedBatchId, selectedBatch]);

  // Sync selected batch to Student Gate Kiosk via BroadcastChannel
  useEffect(() => {
    const payload = {
      batchId: selectedBatchId,
      batchName: selectedBatch.name,
      startTime,
      endTime,
    };
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        const channel = new BroadcastChannel('gate_attendance_channel');
        channel.postMessage({
          type: 'GATE_BATCH_CHANGED',
          payload,
        });
        channel.close();
      } catch (e) {
        console.error(e);
      }
    }
    localStorage.setItem('gate_selected_batch', JSON.stringify(payload));
  }, [selectedBatchId, selectedBatch, startTime, endTime]);

  // Cross-Window Listener for Student Gate Kiosk Display Scans
  useEffect(() => {
    const handleKioskScanPayload = async (payload: any) => {
      if (!payload || !payload.studentId) return;
      const allMembers = LocalAuthService.getAllMembers();
      const matched = allMembers.find(
        (m) => m.id === payload.studentId || m.memberIdNumber === payload.studentId
      );
      if (matched) {
        await updateEmployeeLiveMonitor(matched, payload.batchName || selectedBatch.name);
        setScanMessage({
          text: `Gate Kiosk Scanner: Verified ${matched.fullName} (${matched.memberIdNumber})`,
          type: 'success',
        });
      }
    };

    let channel: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        channel = new BroadcastChannel('gate_attendance_channel');
        channel.onmessage = (event) => {
          if (event.data && event.data.type === 'GATE_STUDENT_SCANNED') {
            handleKioskScanPayload(event.data.payload);
            loadData();
          }
        };
      } catch (e) {
        console.error(e);
      }
    }

    return () => {
      if (channel) channel.close();
    };
  }, [selectedBatch]);

  const updateEmployeeLiveMonitor = async (member: MemberProfile, batchName: string) => {
    const safeSessionDate = sessionDate || new Date().toISOString().split('T')[0] || '';
    const studentHistory = GateAttendanceService.getAttendance()
      .filter((a) => a.studentId === member.id && a.sessionDate < safeSessionDate)
      .sort((a, b) => b.sessionDate.localeCompare(a.sessionDate));

    const mostRecentPastSession = studentHistory[0];
    const lastWeekAttended = mostRecentPastSession ? mostRecentPastSession.status === 'present' : false;

    const currentMonth = safeSessionDate.substring(0, 7);
    const hasUnpaidFees = (member.unpaidFinesTotal || 0) > 0;
    const photoUrl = await PhotoStore.getPhoto(member.id);

    setLastScannedMember({
      member,
      photoUrl: photoUrl || undefined,
      batchName,
      scanTime: new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      }),
      lastWeekAttended,
      lastSessionDate: mostRecentPastSession?.sessionDate,
      hasUnpaidFees,
      feeAmount: member.unpaidFinesTotal || 0,
      currentMonth,
    });
  };

  const determineArrivalStatus = (
    arrivalDate: Date,
    schedStart: string,
    schedEnd: string
  ): 'present' | 'late' | 'absent' => {
    // When a member scans at the gate/counter, they have physically arrived at the library.
    // They are 'present' (or 'late' if past the scheduled start time, but still present).
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

  const handleProcessScan = async (code: string) => {
    const raw = code.trim();
    if (!raw) return;

    const matched = LocalAuthService.findMemberByBarcodeOrId(raw);

    if (!matched) {
      setScanMessage({ text: `Member with ID / Barcode "${code}" not found!`, type: 'error' });
      return;
    }

    const determinedStatus = determineArrivalStatus(new Date(), startTime, endTime);

    GateAttendanceService.recordAttendance({
      batchId: selectedBatchId,
      batchName: selectedBatch.name,
      sessionDate: sessionDate || new Date().toISOString().split('T')[0] || '',
      studentId: matched.memberIdNumber || matched.id,
      studentName: matched.fullName,
      status: determinedStatus,
      markedBy: 'admin',
      verificationMethod: 'qr_scan',
      notes: `Gate Scanner Checked In (${determinedStatus.toUpperCase()})`,
    });

    await updateEmployeeLiveMonitor(matched, selectedBatch.name);
    setScanMessage({
      text: `Checked-In: ${matched.fullName} (${matched.memberIdNumber}) as ${determinedStatus.toUpperCase()}!`,
      type: 'success',
    });
    setQrScanInput('');
    loadData();
  };

  const handleCollectPaymentNow = (member: MemberProfile) => {
    member.unpaidFinesTotal = 0;
    LocalAuthService.updateMember(member);

    if (lastScannedMember && lastScannedMember.member.id === member.id) {
      setLastScannedMember({
        ...lastScannedMember,
        hasUnpaidFees: false,
        feeAmount: 0,
      });
    }

    // Broadcast success to kiosk
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        const channel = new BroadcastChannel('gate_attendance_channel');
        channel.postMessage({
          type: 'GATE_PAYMENT_SUCCESS',
          payload: {
            studentName: member.fullName,
          },
        });
        channel.close();
      } catch (e) {
        console.error(e);
      }
    }

    setScanMessage({
      text: `Payment for ${member.fullName} marked as PAID successfully!`,
      type: 'success',
    });
    toast.success('Payment verified and cleared!');
    loadData();
  };

  const openStudentKioskWindow = () => {
    const width = 1200;
    const height = 800;
    const left = window.screen.width ? (window.screen.width - width) / 2 : 100;
    const top = window.screen.height ? (window.screen.height - height) / 2 : 100;

    window.open(
      '/kiosk/gate-display',
      'StudentGateKioskDisplay',
      `width=${width},height=${height},top=${top},left=${left},resizable=yes,scrollbars=no,status=no`
    );
  };

  const getDisplayStudentId = (studentId: string) => {
    const found = members.find((m) => m.id === studentId || m.memberIdNumber === studentId);
    return found?.memberIdNumber || studentId;
  };

  const todayBatchAttendance = attendance.filter(
    (a) => a.sessionDate === sessionDate && (a.status === 'present' || a.status === 'late')
  );
  const todayPresentCount = todayBatchAttendance.length;

  const filteredHistory = attendance.filter((a) => {
    const matchesDate = historySelectedDate ? a.sessionDate === historySelectedDate : true;
    const matchesQuery = historySearchQuery
      ? a.studentName.toLowerCase().includes(historySearchQuery.toLowerCase()) ||
        a.studentId.toLowerCase().includes(historySearchQuery.toLowerCase())
      : true;
    return matchesDate && matchesQuery;
  });

  return (
    <div className="space-y-6 font-sinhala">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-[#064B2A]/90 via-[#003D22]/90 to-[#002213] text-white shadow-xl border border-[#C69A35]/40">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-black/40 border-2 border-[#C69A35] flex items-center justify-center text-[#C69A35] shadow-lg">
            <UserCheck className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight">Smart Attendance & Gate Operations</span>
              <Badge className="bg-[#C69A35] text-black font-bold uppercase text-[11px]">
                Live Terminal
              </Badge>
            </div>
            <p className="text-xs text-[#FFF5DF]/80 mt-0.5">
              Dual-screen hardware scanner reception console & historical attendance records
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={openStudentKioskWindow}
            className="bg-[#C69A35] hover:bg-[#b0872c] text-black font-bold shadow-lg flex items-center gap-2"
          >
            <Monitor className="w-4 h-4" />
            <span>Open Student Gate Kiosk (2nd Screen)</span>
            <ExternalLink className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>
      </div>

      {/* Main Grid: Controls & Live Monitor */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Session Setup & Hardware Scan */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-2 border-[#C69A35]/40 shadow-md">
            <CardContent className="p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b">
                <div>
                  <h3 className="font-bold text-base flex items-center gap-2">
                    <Radio className="w-4 h-4 text-emerald-600 animate-pulse" />
                    <span>Live Gate Scanner Terminal</span>
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Fast automated attendance verification for patrons entering the library premises
                  </p>
                </div>
                <div className="flex items-center gap-2 font-mono text-xs bg-muted px-3 py-1.5 rounded-lg">
                  <Clock className="w-3.5 h-3.5 text-primary" />
                  <span>{currentTime.toLocaleTimeString()}</span>
                </div>
              </div>

              {/* Hardware Scanner Field */}
              <div className="pt-2">
                <label className="text-xs font-bold block mb-1 flex items-center gap-1.5">
                  <QrCode className="w-4 h-4 text-emerald-600" />
                  <span>Hardware Barcode / QR Scanner Input</span>
                  <span className="text-[11px] text-muted-foreground font-normal">
                    (Auto-detects USB, Bluetooth & Laser Scanners)
                  </span>
                </label>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleProcessScan(qrScanInput);
                  }}
                  className="flex gap-2"
                >
                  <Input
                    ref={scanInputRef}
                    value={qrScanInput}
                    onChange={(e) => setQrScanInput(e.target.value)}
                    placeholder="Scan student ID card barcode..."
                    className="font-mono"
                    autoFocus
                  />
                  <Button type="submit" className="bg-[#064B2A] hover:bg-[#003D22] text-white">
                    Submit
                  </Button>
                </form>

                {scanMessage && (
                  <div
                    className={`mt-2 p-2.5 rounded-lg text-xs font-bold flex items-center gap-2 ${
                      scanMessage.type === 'success'
                        ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/30'
                        : 'bg-rose-500/10 text-rose-600 border border-rose-500/30'
                    }`}
                  >
                    {scanMessage.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <AlertCircle className="w-4 h-4" />
                    )}
                    <span>{scanMessage.text}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Today's Checked-In Roster (Members Currently Inside / Present) */}
          <Card className="border-2 border-[#C69A35]/30">
            <CardContent className="p-0">
              <div className="p-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold text-sm">
                    Today's Checked-in Roster ({todayPresentCount} Members Present Inside)
                  </span>
                </div>
                <Badge variant="outline" className="text-xs font-mono">
                  Date: {sessionDate}
                </Badge>
              </div>
              <div className="max-h-64 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50 border-b text-xs text-left">
                      <th className="p-2.5">Student ID</th>
                      <th className="p-2.5">Name</th>
                      <th className="p-2.5">Arrival Time</th>
                      <th className="p-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {todayBatchAttendance.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-6 text-center text-muted-foreground text-xs">
                          No members currently checked in for today.
                        </td>
                      </tr>
                    ) : (
                      todayBatchAttendance.map((rec) => (
                        <tr key={rec.id} className="border-b hover:bg-muted/30">
                          <td className="p-2.5 font-mono font-bold text-[#064B2A]">
                            {getDisplayStudentId(rec.studentId)}
                          </td>
                          <td className="p-2.5 font-medium">{rec.studentName}</td>
                          <td className="p-2.5 text-xs text-muted-foreground font-mono font-semibold">
                            {new Date(rec.markedAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                              hour12: true,
                            })}
                          </td>
                          <td className="p-2.5">
                            <Badge
                              className={
                                rec.status === 'present'
                                  ? 'bg-emerald-600 text-white font-bold text-[11px]'
                                  : rec.status === 'late'
                                  ? 'bg-amber-600 text-white font-bold text-[11px]'
                                  : 'bg-rose-600 text-white font-bold text-[11px]'
                              }
                            >
                              {rec.status.toUpperCase()}
                            </Badge>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Col: Live Employee Gate Monitor (Photo & Payment Status) */}
        <div>
          <Card className="border-2 border-[#C69A35] shadow-lg sticky top-6">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b">
                <h3 className="font-bold text-sm flex items-center gap-1.5 text-[#064B2A]">
                  <Monitor className="w-4 h-4" />
                  <span>Live Reception Gate Monitor</span>
                </h3>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              </div>

              {lastScannedMember ? (
                <div className="space-y-4 text-center">
                  <div className="w-28 h-28 rounded-full border-4 border-[#C69A35] overflow-hidden mx-auto shadow-md bg-muted">
                    {lastScannedMember.photoUrl ? (
                      <img
                        src={lastScannedMember.photoUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-bold text-2xl text-muted-foreground">
                        {lastScannedMember.member.fullName.charAt(0)}
                      </div>
                    )}
                  </div>

                  <div>
                    <h4 className="text-xl font-bold">{lastScannedMember.member.fullName}</h4>
                    <p className="text-xs text-muted-foreground font-mono">
                      ID: {lastScannedMember.member.memberIdNumber}
                      {lastScannedMember.member.admissionNo
                        ? ` • Adm: ${lastScannedMember.member.admissionNo}`
                        : ''}
                    </p>
                  </div>

                  {/* Previous Session Attendance Box */}
                  <div
                    className={`p-3 rounded-xl border text-xs font-bold text-left ${
                      lastScannedMember.lastWeekAttended
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800'
                        : 'bg-rose-500/10 border-rose-500/30 text-rose-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>Previous Class Attendance:</span>
                      <span>{lastScannedMember.lastWeekAttended ? 'ATTENDED' : 'ABSENT'}</span>
                    </div>
                  </div>

                  {/* Monthly Fee / Fine Alert Box */}
                  <div
                    className={`p-3 rounded-xl border text-xs font-bold text-left ${
                      lastScannedMember.hasUnpaidFees
                        ? 'bg-amber-500/10 border-amber-500/40 text-amber-900'
                        : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span>Fee / Fine Status:</span>
                      <span>
                        {lastScannedMember.hasUnpaidFees
                          ? `PENDING (Rs. ${lastScannedMember.feeAmount.toFixed(2)})`
                          : 'PAID / ALL CLEAR'}
                      </span>
                    </div>
                    {lastScannedMember.hasUnpaidFees && (
                      <Button
                        size="sm"
                        onClick={() => handleCollectPaymentNow(lastScannedMember.member)}
                        className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                      >
                        <Check className="w-3.5 h-3.5 mr-1" />
                        Mark Paid & Clear Balance
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground space-y-2">
                  <UserCheck className="w-12 h-12 mx-auto text-muted-foreground/40 animate-pulse" />
                  <p className="text-xs font-medium">Awaiting student card scan...</p>
                  <p className="text-[11px] text-muted-foreground/70">
                    Scans on the gate kiosk or reception bar will show live status here.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Daily Library Attendance Log & Patron Archive */}
      <Card className="border-2 border-[#C69A35]/30">
        <CardContent className="p-6 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b">
            <div>
              <h3 className="font-bold text-base flex items-center gap-2">
                <History className="w-4 h-4 text-emerald-600" />
                <span>Today's Library Attendance & Gate Activity Log</span>
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Browse and filter members who checked in to the library premises today and past dates
              </p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Input
                type="date"
                value={historySelectedDate}
                onChange={(e) => setHistorySelectedDate(e.target.value)}
                className="w-auto text-xs font-mono"
              />
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
                <Input
                  placeholder="Search by student name/ID..."
                  value={historySearchQuery}
                  onChange={(e) => setHistorySearchQuery(e.target.value)}
                  className="pl-9 text-xs"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b text-xs text-left">
                  <th className="p-2.5">Student ID</th>
                  <th className="p-2.5">Member Name</th>
                  <th className="p-2.5">Batch / Purpose</th>
                  <th className="p-2.5">Date</th>
                  <th className="p-2.5">Arrival Time</th>
                  <th className="p-2.5">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-muted-foreground text-xs">
                      No library attendance records found for {historySelectedDate || 'today'}.
                    </td>
                  </tr>
                ) : (
                  filteredHistory.map((rec) => (
                    <tr key={rec.id} className="border-b hover:bg-muted/20">
                      <td className="p-2.5 font-mono font-bold text-xs text-[#064B2A]">
                        {getDisplayStudentId(rec.studentId)}
                      </td>
                      <td className="p-2.5 font-medium">{rec.studentName}</td>
                      <td className="p-2.5 text-xs text-muted-foreground">{rec.batchName}</td>
                      <td className="p-2.5 font-mono text-xs">{rec.sessionDate}</td>
                      <td className="p-2.5 text-xs font-mono font-semibold text-muted-foreground">
                        {new Date(rec.markedAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                          hour12: true,
                        })}
                      </td>
                      <td className="p-2.5">
                        <Badge
                          className={
                            rec.status === 'present'
                              ? 'bg-emerald-600 text-white font-bold text-[11px]'
                              : rec.status === 'late'
                              ? 'bg-amber-600 text-white font-bold text-[11px]'
                              : 'bg-rose-600 text-white font-bold text-[11px]'
                          }
                        >
                          {rec.status.toUpperCase()}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
