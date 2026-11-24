import { MemberProfile, Loan, calculateFine } from '@libraryos/shared';
import { LocalAuthService, LocalUser } from '../auth/LocalAuthService';
import { CirculationRepository } from '../repositories/CirculationRepository';
import { PolicyService } from './PolicyService';

export type SuspensionCategory = 'OVERDUE_30_DAYS' | 'UNRETURNED_BOOK' | 'MISCONDUCT' | 'CUSTOM';

export interface SuspensionRecord {
  id: string;
  memberId: string;
  memberIdNumber: string;
  memberName: string;
  reasonCategory: SuspensionCategory;
  reasonDetails: string;
  suspendedAt: number;
  suspendUntil?: number; // undefined means indefinite
  suspendedBy: string; // 'SYSTEM_AUTO' | 'ADMIN'
  unpaidFines: number;
  overdueBookTitle?: string;
  overdueBookBarcode?: string;
  daysLate?: number;
}

const SUSPENSIONS_STORAGE_KEY = 'libraryos_suspension_records_v1';

export class SuspensionService {
  static getSuspensions(): SuspensionRecord[] {
    try {
      const data = localStorage.getItem(SUSPENSIONS_STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  }

  static saveSuspensions(records: SuspensionRecord[]) {
    try {
      localStorage.setItem(SUSPENSIONS_STORAGE_KEY, JSON.stringify(records));
    } catch {
      // ignore
    }
  }

  /**
   * Run Automated Daily/Hourly Check:
   * Any member with unreturned book overdue for > 30 days (1 month) is AUTOMATICALLY suspended!
   */
  static runAutoSuspensionCheck(): { newlySuspended: number } {
    const allLoans = CirculationRepository.getLocalLoans();
    const allMembers = LocalAuthService.getAllMembers();
    const suspensions = this.getSuspensions();
    const policy = PolicyService.toLoanPolicy();

    const now = Date.now();
    const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
    let newlySuspendedCount = 0;

    allLoans.forEach((loan) => {
      // Check if loan is ACTIVE and has exceeded 30 days past Due Date
      if (loan.status === 'ACTIVE' && loan.dueDate < now) {
        const overdueDuration = now - loan.dueDate;

        if (overdueDuration >= THIRTY_DAYS_MS) {
          const member = allMembers.find((m) => m.id === loan.memberId);
          if (member) {
            // Check if already in suspension records
            const alreadyLogged = suspensions.some(
              (s) => s.memberId === member.id && s.reasonCategory === 'OVERDUE_30_DAYS'
            );

            const daysLate = Math.floor(overdueDuration / (1000 * 60 * 60 * 24));
            const fine = calculateFine(loan.dueDate, now, policy);

            if (!alreadyLogged) {
              const newRecord: SuspensionRecord = {
                id: `sus_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
                memberId: member.id,
                memberIdNumber: member.memberIdNumber,
                memberName: member.fullName,
                reasonCategory: 'OVERDUE_30_DAYS',
                reasonDetails: `පොත ආපසු භාරදීමට නියමිත දින සිට මාසයකට (දින ${daysLate}) වඩා ප්‍රමාද වීම නිසා පද්ධතියෙන් ස්වයංක්‍රීයව අත්හිටුවන ලදී.`,
                suspendedAt: now,
                suspendedBy: 'SYSTEM_AUTO',
                unpaidFines: fine,
                overdueBookTitle: loan.bookTitle,
                daysLate,
              };
              suspensions.unshift(newRecord);
              newlySuspendedCount++;
            }

            // Ensure member status is SUSPENDED in LocalAuth
            if (member.status !== 'SUSPENDED') {
              LocalAuthService.updateMemberStatus(member.id, 'SUSPENDED');
            }
          }
        }
      }
    });

    if (newlySuspendedCount > 0) {
      this.saveSuspensions(suspensions);
    }

    return { newlySuspended: newlySuspendedCount };
  }

  /**
   * Admin manual suspension with note and duration
   */
  static suspendMember(
    memberId: string,
    reasonCategory: SuspensionCategory,
    reasonDetails: string,
    durationDays?: number,
    adminId = 'Chief Librarian (Admin)'
  ): boolean {
    const allMembers = LocalAuthService.getAllMembers();
    const member = allMembers.find((m) => m.id === memberId || m.memberIdNumber === memberId);
    if (!member) return false;

    const suspensions = this.getSuspensions();
    const now = Date.now();

    const suspendUntil = durationDays && durationDays > 0
      ? now + durationDays * 24 * 60 * 60 * 1000
      : undefined;

    // Filter out existing active record for this member if exists
    const updated = suspensions.filter((s) => s.memberId !== member.id);

    const record: SuspensionRecord = {
      id: `sus_admin_${Date.now()}`,
      memberId: member.id,
      memberIdNumber: member.memberIdNumber,
      memberName: member.fullName,
      reasonCategory,
      reasonDetails,
      suspendedAt: now,
      suspendUntil,
      suspendedBy: adminId,
      unpaidFines: member.unpaidFinesTotal || 0,
    };

    updated.unshift(record);
    this.saveSuspensions(updated);
    LocalAuthService.updateMemberStatus(member.id, 'SUSPENDED');
    return true;
  }

  /**
   * Reactivate member account
   */
  static reactivateMember(memberId: string): boolean {
    const allMembers = LocalAuthService.getAllMembers();
    const member = allMembers.find((m) => m.id === memberId || m.memberIdNumber === memberId);
    if (!member) return false;

    const suspensions = this.getSuspensions();
    const filtered = suspensions.filter((s) => s.memberId !== member.id);
    this.saveSuspensions(filtered);

    LocalAuthService.updateMemberStatus(member.id, 'ACTIVE');
    return true;
  }
}
