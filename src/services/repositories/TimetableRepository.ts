import { TimetableSlot } from '@libraryos/shared';

const LOCAL_TIMETABLE_KEY = 'libraryos_timetable_v1';

const DEFAULT_PERIODS: { periodIndex: number; startTime: string; endTime: string }[] = [
  { periodIndex: 0, startTime: '07:50', endTime: '08:30' },
  { periodIndex: 1, startTime: '08:30', endTime: '09:10' },
  { periodIndex: 2, startTime: '09:10', endTime: '09:50' },
  { periodIndex: 3, startTime: '09:50', endTime: '10:30' },
  { periodIndex: 4, startTime: '10:50', endTime: '11:30' }, // after interval
  { periodIndex: 5, startTime: '11:30', endTime: '12:10' },
  { periodIndex: 6, startTime: '12:10', endTime: '12:50' },
  { periodIndex: 7, startTime: '12:50', endTime: '13:30' },
];

class TimetableRepositoryClass {
  public getSlots(): TimetableSlot[] {
    try {
      const data = localStorage.getItem(LOCAL_TIMETABLE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch {
      // ignore
    }
    return this.initializeDefaultSlots();
  }

  public initializeDefaultSlots(): TimetableSlot[] {
    const slots: TimetableSlot[] = [];
    const days: (1 | 2 | 3 | 4 | 5)[] = [1, 2, 3, 4, 5];

    for (const d of days) {
      for (const p of DEFAULT_PERIODS) {
        slots.push({
          id: `slot-${d}-${p.periodIndex}`,
          dayOfWeek: d,
          periodIndex: p.periodIndex,
          startTime: p.startTime,
          endTime: p.endTime,
        });
      }
    }

    this.saveSlots(slots);
    return slots;
  }

  public saveSlots(slots: TimetableSlot[]): void {
    try {
      localStorage.setItem(LOCAL_TIMETABLE_KEY, JSON.stringify(slots));
    } catch (e) {
      console.error('Failed to save timetable slots:', e);
    }
  }

  public reserveSlot(
    slotId: string,
    booking: { gradeSection: string; teacherName: string; purpose?: string }
  ): boolean {
    const slots = this.getSlots();
    const target = slots.find((s) => s.id === slotId);
    if (!target) return false;

    target.gradeSection = booking.gradeSection;
    target.teacherName = booking.teacherName;
    target.purpose = booking.purpose;
    target.reservedAt = Date.now();

    this.saveSlots(slots);
    return true;
  }

  public clearSlot(slotId: string): boolean {
    const slots = this.getSlots();
    const target = slots.find((s) => s.id === slotId);
    if (!target) return false;

    delete target.gradeSection;
    delete target.teacherName;
    delete target.purpose;
    delete target.reservedAt;

    this.saveSlots(slots);
    return true;
  }
}

export const TimetableRepository = new TimetableRepositoryClass();
