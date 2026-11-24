import { AttendanceEntry, MemberProfile } from '@libraryos/shared';
import { LocalAuthService } from '../auth/LocalAuthService';

export interface GateScanEvent {
  studentId: string;
  studentName: string;
  avatarUrl?: string;
  batchName?: string;
  grade?: string;
  section?: string;
  admissionNo?: string;
  scanTime: string;
  greetingText: string;
  spokenGreeting: string;
  greetingType: 'morning' | 'afternoon' | 'evening';
  isAlert?: boolean;
  alertType?: 'absent_last_week' | 'unpaid_fees' | 'absent_and_unpaid';
  alertTitle?: string;
  alertMessage?: string;
}

export interface GateAttendanceRecord {
  id: string;
  batchId: string;
  batchName: string;
  sessionDate: string; // YYYY-MM-DD
  studentId: string;
  studentName: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  markedAt: string;
  exitTime?: string;
  direction?: 'in' | 'out';
  entryCount?: number;
  markedBy: string;
  verificationMethod: 'qr_scan' | 'manual' | 'gate_kiosk';
  notes?: string;
  bookActionSummary?: string;
}

const LOCAL_GATE_ATTENDANCE_KEY = 'libraryos_gate_attendance_v1';
const LOCAL_GATE_SETTINGS_KEY = 'libraryos_gate_settings_v1';

export interface GateSettings {
  kioskInstituteName: string;
  kioskGateTerminalName: string;
  kioskQuoteText: string;
  kioskBgImage: string;
  primaryColor: string;
  accentColor: string;
}

export const DEFAULT_GATE_SETTINGS: GateSettings = {
  kioskInstituteName: 'සිංහල පන්තිය • දුලාංජන පහට්ටුගේ ගුරුතුමා • ප්‍රධාන දොරටුව',
  kioskGateTerminalName: 'Gate Terminal 01 (Matara)',
  kioskQuoteText: 'සාහිත්‍යයෙන් දැනුමට — දැනුමෙන් අනාගතයට...',
  kioskBgImage: '/images/kiosk-gate-bg.jpg',
  primaryColor: '#064B2A',
  accentColor: '#C69A35',
};

class GateAttendanceServiceClass {
  public getSettings(): GateSettings {
    try {
      const data = localStorage.getItem(LOCAL_GATE_SETTINGS_KEY);
      if (data) {
        return { ...DEFAULT_GATE_SETTINGS, ...JSON.parse(data) };
      }
    } catch {}
    return DEFAULT_GATE_SETTINGS;
  }

  public saveSettings(settings: Partial<GateSettings>) {
    try {
      const current = this.getSettings();
      const updated = { ...current, ...settings };
      localStorage.setItem(LOCAL_GATE_SETTINGS_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  }

  public getAttendance(): GateAttendanceRecord[] {
    try {
      const data = localStorage.getItem(LOCAL_GATE_ATTENDANCE_KEY);
      if (data) {
        const records: GateAttendanceRecord[] = JSON.parse(data);
        // Self-heal: ensure records marked via scanner aren't wrongly displayed as 'absent'
        let changed = false;
        const cleaned = records.map((r) => {
          if (r.verificationMethod === 'qr_scan' || r.verificationMethod === 'gate_kiosk') {
            if (r.status === 'absent') {
              changed = true;
              return { ...r, status: 'present' as const };
            }
          }
          return r;
        });
        if (changed) {
          this.saveAttendance(cleaned);
          return cleaned;
        }
        return records;
      }
    } catch {}
    return [];
  }

  public saveAttendance(records: GateAttendanceRecord[]) {
    try {
      localStorage.setItem(LOCAL_GATE_ATTENDANCE_KEY, JSON.stringify(records));
    } catch (e) {
      console.error(e);
    }
  }

  public recordAttendance(record: Omit<GateAttendanceRecord, 'id' | 'markedAt'>): GateAttendanceRecord {
    const list = this.getAttendance();
    const nowIso = new Date().toISOString();

    // Check if the student has an existing record today without an exit time
    // If they scan within a short window, or if we toggle in/out:
    const newRecord: GateAttendanceRecord = {
      ...record,
      id: `gate-att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      markedAt: nowIso,
      direction: record.direction || 'in',
    };

    list.unshift(newRecord);
    if (list.length > 5000) list.length = 5000;
    this.saveAttendance(list);

    // Sync broadcast to any open monitoring consoles
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        const channel = new BroadcastChannel('gate_attendance_channel');
        channel.postMessage({
          type: 'GATE_STUDENT_SCANNED',
          payload: {
            studentId: newRecord.studentId,
            studentName: newRecord.studentName,
            batchId: newRecord.batchId,
            batchName: newRecord.batchName,
            timestamp: newRecord.markedAt,
            direction: newRecord.direction,
          },
        });
        channel.close();
      } catch (err) {
        console.error(err);
      }
    }

    return newRecord;
  }

  public recordStudentExit(studentId: string, sessionDate: string) {
    const list = this.getAttendance();
    const target = list.find(
      (r) => (r.studentId === studentId || r.id === studentId) && r.sessionDate === sessionDate && !r.exitTime
    );
    if (target) {
      target.exitTime = new Date().toISOString();
      target.direction = 'out';
      this.saveAttendance(list);
      return target;
    }
    return null;
  }

  /**
   * Evaluates student's past attendance and overdue book fines
   */
  public evaluateStudentStatus(member: MemberProfile, sessionDate: string) {
    const history = this.getAttendance()
      .filter((a) => a.studentId === member.id && a.sessionDate < sessionDate)
      .sort((a, b) => b.sessionDate.localeCompare(a.sessionDate));

    const lastSession = history[0];
    const wasAbsentLastSession = lastSession ? lastSession.status === 'absent' : false;

    // Check if member has unpaid fees or overdue fines
    const hasUnpaidFees = (member.unpaidFinesTotal || 0) > 0;

    return {
      wasAbsentLastSession,
      hasUnpaidFees,
      lastSessionDate: lastSession?.sessionDate,
      unpaidAmount: member.unpaidFinesTotal || 0,
    };
  }
}

export const GateAttendanceService = new GateAttendanceServiceClass();
