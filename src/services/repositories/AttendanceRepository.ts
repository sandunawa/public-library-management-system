import { AttendanceEntry } from '@libraryos/shared';

const LOCAL_ATTENDANCE_KEY = 'libraryos_attendance_v1';

class AttendanceRepositoryClass {
  public getAttendance(): AttendanceEntry[] {
    try {
      const data = localStorage.getItem(LOCAL_ATTENDANCE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public saveAttendance(entries: AttendanceEntry[]): void {
    try {
      localStorage.setItem(LOCAL_ATTENDANCE_KEY, JSON.stringify(entries));
    } catch (e) {
      console.error('Failed to save attendance records:', e);
    }
  }

  public logScan(entry: Omit<AttendanceEntry, 'id' | 'timestamp'>): AttendanceEntry {
    const list = this.getAttendance();
    const newEntry: AttendanceEntry = {
      id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
      ...entry,
    };

    list.unshift(newEntry);
    // Keep max 5000 recent scans
    if (list.length > 5000) {
      list.length = 5000;
    }

    this.saveAttendance(list);
    return newEntry;
  }

  /**
   * Calculates live occupancy for today
   */
  public getLiveOccupancy(): { currentCount: number; todayTotalEntries: number; activeMembers: string[] } {
    const list = this.getAttendance();
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const startMs = startOfDay.getTime();

    // Filter today's records sorted ascending
    const todayScans = list
      .filter((e) => e.timestamp >= startMs)
      .sort((a, b) => a.timestamp - b.timestamp);

    const insideSet = new Set<string>();
    let totalEntries = 0;

    for (const scan of todayScans) {
      if (scan.direction === 'IN') {
        insideSet.add(scan.memberId);
        totalEntries++;
      } else if (scan.direction === 'OUT') {
        insideSet.delete(scan.memberId);
      }
    }

    return {
      currentCount: insideSet.size,
      todayTotalEntries: totalEntries,
      activeMembers: Array.from(insideSet),
    };
  }
}

export const AttendanceRepository = new AttendanceRepositoryClass();
