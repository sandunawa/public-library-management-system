import React, { useState, useEffect, useMemo } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { TimetableRepository } from '@/services/repositories/TimetableRepository';
import { TimetableSlot } from '@libraryos/shared';
import { toast } from 'sonner';
import {
  CalendarDays,
  Clock,
  Users,
  CheckCircle2,
  Trash2,
  BookOpen,
  CalendarCheck,
} from 'lucide-react';

const DAYS = [
  { dayIndex: 1, name: 'Monday (සඳුදා)' },
  { dayIndex: 2, name: 'Tuesday (අඟහරුවාදා)' },
  { dayIndex: 3, name: 'Wednesday (බදාදා)' },
  { dayIndex: 4, name: 'Thursday (බ්‍රහස්පතින්දා)' },
  { dayIndex: 5, name: 'Friday (සිකුරාදා)' },
];

const PERIOD_LABELS = [
  { index: 0, time: '07:50 - 08:30', name: 'Period 1' },
  { index: 1, time: '08:30 - 09:10', name: 'Period 2' },
  { index: 2, time: '09:10 - 09:50', name: 'Period 3' },
  { index: 3, time: '09:50 - 10:30', name: 'Period 4' },
  { index: 4, time: '10:50 - 11:30', name: 'Period 5' },
  { index: 5, time: '11:30 - 12:10', name: 'Period 6' },
  { index: 6, time: '12:10 - 12:50', name: 'Period 7' },
  { index: 7, time: '12:50 - 13:30', name: 'Period 8' },
];

export const TimetablePage: React.FC = () => {
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimetableSlot | null>(null);
  const [bookingGrade, setBookingGrade] = useState('');
  const [bookingTeacher, setBookingTeacher] = useState('');
  const [bookingPurpose, setBookingPurpose] = useState('');

  const loadSlots = () => {
    setSlots(TimetableRepository.getSlots());
  };

  useEffect(() => {
    loadSlots();
  }, []);

  // Today's day index (1 to 5)
  const currentDayIndex = new Date().getDay();

  const handleOpenBooking = (slot: TimetableSlot) => {
    setSelectedSlot(slot);
    setBookingGrade(slot.gradeSection || '');
    setBookingTeacher(slot.teacherName || '');
    setBookingPurpose(slot.purpose || '');
  };

  const handleSaveBooking = () => {
    if (!selectedSlot) return;
    if (!bookingGrade.trim()) {
      toast.warning('Please enter Class/Grade (e.g. 10-A).');
      return;
    }

    TimetableRepository.reserveSlot(selectedSlot.id, {
      gradeSection: bookingGrade.trim(),
      teacherName: bookingTeacher.trim() || 'Assigned Teacher',
      purpose: bookingPurpose.trim() || 'Library Reading & Research',
    });

    toast.success('Period reserved successfully!');
    setSelectedSlot(null);
    loadSlots();
  };

  const handleClearBooking = (slotId: string) => {
    if (confirm('Release this period reservation?')) {
      TimetableRepository.clearSlot(slotId);
      toast.info('Period released and marked available.');
      setSelectedSlot(null);
      loadSlots();
    }
  };

  const totalBooked = useMemo(() => slots.filter((s) => s.gradeSection).length, [slots]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="School Library Period Timetable"
        description="Weekly 5x8 period matrix for library research periods, reading sessions, and teacher reservations."
      />

      {/* Summary Info */}
      <div className="flex items-center justify-between bg-muted/40 p-4 rounded-xl border border-border">
        <div className="flex items-center gap-3">
          <CalendarDays className="w-5 h-5 text-[#7654D7]" />
          <div>
            <span className="text-sm font-bold text-foreground">Weekly Allocation Overview</span>
            <span className="text-xs text-muted-foreground block">
              {totalBooked} of {slots.length} periods currently assigned to classes
            </span>
          </div>
        </div>
        <Badge variant="outline" className="border-[#7654D7] text-[#7654D7] font-mono">
          5 Days × 8 Periods
        </Badge>
      </div>

      {/* 5x8 Timetable Matrix */}
      <Card className="border-2 border-[#7654D7] overflow-hidden">
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full border-collapse text-sm min-w-[700px]">
            <thead>
              <tr className="bg-muted/80 border-b border-border">
                <th className="p-3 text-left font-bold text-xs uppercase text-muted-foreground w-28">
                  Period / Time
                </th>
                {DAYS.map((day) => (
                  <th
                    key={day.dayIndex}
                    className={`p-3 text-center font-bold text-xs uppercase ${
                      day.dayIndex === currentDayIndex
                        ? 'bg-[#7654D7]/15 text-[#7654D7] border-b-2 border-[#7654D7]'
                        : 'text-foreground'
                    }`}
                  >
                    {day.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {PERIOD_LABELS.map((period) => (
                <tr key={period.index} className="hover:bg-muted/20 transition-colors">
                  <td className="p-3 font-semibold text-xs border-r border-border bg-muted/30">
                    <div>{period.name}</div>
                    <div className="text-[11px] font-mono text-muted-foreground">{period.time}</div>
                  </td>
                  {DAYS.map((day) => {
                    const slot = slots.find(
                      (s) => s.dayOfWeek === day.dayIndex && s.periodIndex === period.index
                    );
                    const isBooked = !!slot?.gradeSection;

                    return (
                      <td
                        key={day.dayIndex}
                        onClick={() => slot && handleOpenBooking(slot)}
                        className={`p-2.5 text-center cursor-pointer border-r border-border last:border-r-0 transition-all ${
                          isBooked
                            ? 'bg-[#F1EDFC] hover:bg-[#E6DEF9]'
                            : 'hover:bg-muted/50'
                        } ${day.dayIndex === currentDayIndex ? 'bg-[#7654D7]/5' : ''}`}
                      >
                        {isBooked ? (
                          <div className="p-2 rounded-lg bg-white border border-[#7654D7]/40 shadow-sm text-left">
                            <div className="font-bold text-[#7654D7] text-xs flex items-center justify-between">
                              <span>Class {slot.gradeSection}</span>
                              <BookOpen className="w-3 h-3 text-[#7654D7]" />
                            </div>
                            <div className="text-[11px] text-muted-foreground truncate">
                              {slot.teacherName}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground/50 hover:text-foreground">
                            + Available
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Booking Dialog */}
      {selectedSlot && (
        <Dialog open={!!selectedSlot} onOpenChange={() => setSelectedSlot(null)}>
          <DialogContent className="border-2 border-[#7654D7]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CalendarCheck className="w-5 h-5 text-[#7654D7]" />
                <span>Reserve Library Period</span>
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 pt-2">
              <div className="p-3 rounded-lg bg-muted text-xs flex justify-between font-mono">
                <span>
                  {DAYS.find((d) => d.dayIndex === selectedSlot.dayOfWeek)?.name}
                </span>
                <span>
                  Period {selectedSlot.periodIndex + 1} ({selectedSlot.startTime} - {selectedSlot.endTime})
                </span>
              </div>

              <div>
                <Label>Class / Grade Section *</Label>
                <Input
                  placeholder="e.g. 10-A or 11-B"
                  value={bookingGrade}
                  onChange={(e) => setBookingGrade(e.target.value)}
                  autoFocus
                />
              </div>

              <div>
                <Label>Supervising Teacher</Label>
                <Input
                  placeholder="Teacher's Name"
                  value={bookingTeacher}
                  onChange={(e) => setBookingTeacher(e.target.value)}
                />
              </div>

              <div>
                <Label>Session Purpose</Label>
                <Input
                  placeholder="e.g. History Reference, Free Reading"
                  value={bookingPurpose}
                  onChange={(e) => setBookingPurpose(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter className="flex justify-between items-center sm:justify-between pt-4">
              {selectedSlot.gradeSection ? (
                <Button
                  variant="outline"
                  className="text-rose-600 border-rose-300 hover:bg-rose-50"
                  onClick={() => handleClearBooking(selectedSlot.id)}
                >
                  <Trash2 className="w-4 h-4 mr-1.5" />
                  Release Period
                </Button>
              ) : (
                <div />
              )}
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setSelectedSlot(null)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveBooking} className="bg-[#7654D7] hover:bg-[#6342c4]">
                  Save Reservation
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
