import { LoanPolicy } from './models';

export interface PolicyCalculationResult {
  isEligible: boolean;
  rejectionReason?: string;
  calculatedDueDate?: number;
  calculatedFine?: number;
}

export function calculateDueDate(
  issuedAt: number,
  policy: LoanPolicy,
  holidays: string[] = [] // YYYY-MM-DD
): number {
  const msInDay = 24 * 60 * 60 * 1000;
  let target = new Date(issuedAt + policy.loanPeriodDays * msInDay);

  // If due date falls on a closed/holiday date, roll forward to the next business day
  while (true) {
    const isoDate = target.toISOString().split('T')[0]!;
    const dayOfWeek = target.getDay(); // 0 is Sunday
    const isHoliday = holidays.includes(isoDate);
    // Closed on Sunday by default if not overridden
    if (dayOfWeek === 0 || isHoliday) {
      target = new Date(target.getTime() + msInDay);
    } else {
      break;
    }
  }

  return target.getTime();
}

export function calculateFine(
  dueDate: number,
  returnDate: number,
  policy: LoanPolicy
): number {
  if (returnDate <= dueDate) {
    return 0;
  }

  const msInDay = 24 * 60 * 60 * 1000;
  const overdueDays = Math.floor((returnDate - dueDate) / msInDay);

  if (overdueDays <= policy.gracePeriodDays) {
    return 0;
  }

  const billableDays = overdueDays;
  const fine = billableDays * policy.finePerDay;

  return policy.fineCap > 0 ? Math.min(fine, policy.fineCap) : fine;
}
