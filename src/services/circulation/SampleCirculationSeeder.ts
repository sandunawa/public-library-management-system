import { Loan, MemberProfile, BookCopy, Book } from '@libraryos/shared';
import { LocalAuthService } from '../auth/LocalAuthService';
import { CatalogRepository } from '../repositories/CatalogRepository';
import { CirculationRepository } from '../repositories/CirculationRepository';
import { SuspensionService, SuspensionRecord } from './SuspensionService';
import { PolicyService } from './PolicyService';

export class SampleCirculationSeeder {
  static seedAllRealisticData() {
    const allMembers = LocalAuthService.getAllMembers();
    const allBooks = CatalogRepository.getLocalBooks();
    const allCopies = CatalogRepository.getLocalCopies();

    if (allMembers.length === 0 || allBooks.length === 0 || allCopies.length === 0) {
      return;
    }

    const now = Date.now();
    const DAY_MS = 24 * 60 * 60 * 1000;
    const policy = PolicyService.toLoanPolicy();

    // 1. Prepare Realistic Sample Loans
    // We will generate:
    // - 5 Active Normal Loans (borrowed recently, not overdue)
    // - 5 Overdue Loans (4 to 15 days late -> will appear in Overdue & Fines)
    // - 3 Long Overdue Loans (> 30 days late -> will appear in Auto-Suspended!)
    // - 3 Returned historical loans

    const loansToSeed: Loan[] = [];

    // Helper to pick members safely
    const m = (idx: number) => allMembers[idx % allMembers.length]!;
    const b = (idx: number) => allBooks[idx % allBooks.length]!;
    const c = (idx: number) => allCopies[idx % allCopies.length]!;

    // A. 5 Currently Borrowed (ACTIVE, on time)
    for (let i = 0; i < 5; i++) {
      const member = m(i);
      const book = b(i);
      const copy = c(i);
      const issuedAt = now - (i + 2) * DAY_MS;
      const dueDate = issuedAt + 14 * DAY_MS; // Due in future

      loansToSeed.push({
        id: `loan_active_${100 + i}`,
        loanNumber: `LN-2026-${10000 + i}`,
        copyId: copy.id,
        bookId: book.id,
        bookTitle: book.title,
        memberId: member.id,
        memberName: member.fullName,
        branchId: 'branch-colombo-hq',
        issuedByStaffId: 'staff-admin-01',
        issuedAt,
        dueDate,
        renewalCount: 0,
        status: 'ACTIVE',
      });
    }

    // B. 5 Overdue Loans (4 to 15 days late -> Appears in Overdue & Fines)
    const overdueLates = [4, 7, 10, 14, 18];
    for (let i = 0; i < overdueLates.length; i++) {
      const lateDays = overdueLates[i]!;
      const member = m(5 + i);
      const book = b(5 + i);
      const copy = c(5 + i);
      const dueDate = now - lateDays * DAY_MS; // Overdue by `lateDays`
      const issuedAt = dueDate - 14 * DAY_MS;

      loansToSeed.push({
        id: `loan_overdue_${200 + i}`,
        loanNumber: `LN-2026-${20000 + i}`,
        copyId: copy.id,
        bookId: book.id,
        bookTitle: book.title,
        memberId: member.id,
        memberName: member.fullName,
        branchId: 'branch-colombo-hq',
        issuedByStaffId: 'staff-admin-01',
        issuedAt,
        dueDate,
        renewalCount: 0,
        status: 'ACTIVE',
      });
    }

    // C. 3 Long Overdue Loans (> 30 days late: 35, 45, 60 days late -> Triggers Auto-Suspension)
    const longOverdueLates = [35, 45, 60];
    for (let i = 0; i < longOverdueLates.length; i++) {
      const lateDays = longOverdueLates[i]!;
      const member = m(10 + i);
      const book = b(10 + i);
      const copy = c(10 + i);
      const dueDate = now - lateDays * DAY_MS;
      const issuedAt = dueDate - 14 * DAY_MS;

      loansToSeed.push({
        id: `loan_long_overdue_${300 + i}`,
        loanNumber: `LN-2026-${30000 + i}`,
        copyId: copy.id,
        bookId: book.id,
        bookTitle: book.title,
        memberId: member.id,
        memberName: member.fullName,
        branchId: 'branch-colombo-hq',
        issuedByStaffId: 'staff-admin-01',
        issuedAt,
        dueDate,
        renewalCount: 0,
        status: 'ACTIVE',
      });
    }

    // D. 3 Historical Returned Loans
    for (let i = 0; i < 3; i++) {
      const member = m(13 + i);
      const book = b(13 + i);
      const copy = c(13 + i);
      const issuedAt = now - (25 + i) * DAY_MS;
      const dueDate = issuedAt + 14 * DAY_MS;

      loansToSeed.push({
        id: `loan_returned_${400 + i}`,
        loanNumber: `LN-2026-${40000 + i}`,
        copyId: copy.id,
        bookId: book.id,
        bookTitle: book.title,
        memberId: member.id,
        memberName: member.fullName,
        branchId: 'branch-colombo-hq',
        issuedByStaffId: 'staff-admin-01',
        issuedAt,
        dueDate,
        returnedAt: now - (5 + i) * DAY_MS,
        renewalCount: 1,
        status: 'RETURNED',
      });
    }

    // Save all sample loans
    CirculationRepository.saveLocalLoans(loansToSeed);

    // 2. Prepare Sample Suspended Members
    // - Members 10, 11, 12 are auto-suspended due to 30+ days overdue
    // - Add 2 Disciplinary / Misconduct suspensions (e.g. damaged book, library rule violation)
    const suspensionsToSeed: SuspensionRecord[] = [];

    // Long overdue auto-suspensions
    for (let i = 0; i < longOverdueLates.length; i++) {
      const lateDays = longOverdueLates[i]!;
      const member = m(10 + i);
      const book = b(10 + i);
      const copy = c(10 + i);
      const fine = lateDays * policy.finePerDay;

      suspensionsToSeed.push({
        id: `sus_auto_${100 + i}`,
        memberId: member.id,
        memberIdNumber: member.memberIdNumber,
        memberName: member.fullName,
        reasonCategory: 'OVERDUE_30_DAYS',
        reasonDetails: `පොත ආපසු භාරදීමට නියමිත දින සිට දින ${lateDays}ක් (මාසයකට වඩා) ප්‍රමාද වීම නිසා පද්ධතියෙන් ස්වයංක්‍රීයව අත්හිටුවන ලදී.`,
        suspendedAt: now - 5 * DAY_MS,
        suspendedBy: 'SYSTEM_AUTO',
        unpaidFines: fine,
        overdueBookTitle: book.title,
        overdueBookBarcode: copy.barcode,
        daysLate: lateDays,
      });

      // Update Member Profile Status & Unpaid Fines
      member.status = 'SUSPENDED';
      member.unpaidFinesTotal = fine;
      member.activeLoansCount = 1;
    }

    // Member 14: Misconduct suspension
    const mMisconduct = m(14);
    suspensionsToSeed.push({
      id: 'sus_misconduct_01',
      memberId: mMisconduct.id,
      memberIdNumber: mMisconduct.memberIdNumber,
      memberName: mMisconduct.fullName,
      reasonCategory: 'MISCONDUCT',
      reasonDetails: 'පුස්තකාලය තුළ ශබ්ද නගා කතා කිරීම සහ අධ්‍යයන ශාලාවේ විනය නීති කඩකිරීම.',
      suspendedAt: now - 3 * DAY_MS,
      suspendUntil: now + 11 * DAY_MS,
      suspendedBy: 'Chief Librarian (Admin)',
      unpaidFines: 0,
    });
    mMisconduct.status = 'SUSPENDED';

    // Member 15: Damaged Book / Custom Hold
    const mDamaged = m(15);
    suspensionsToSeed.push({
      id: 'sus_custom_02',
      memberId: mDamaged.id,
      memberIdNumber: mDamaged.memberIdNumber,
      memberName: mDamaged.fullName,
      reasonCategory: 'UNRETURNED_BOOK',
      reasonDetails: 'ණයට ගත් පොතේ පිටු ඉරා දැමීම හා හානි කිරීම සම්බන්ධ විමර්ශනයක් හේතුවෙන්.',
      suspendedAt: now - 2 * DAY_MS,
      suspendUntil: now + 28 * DAY_MS,
      suspendedBy: 'Senior Assistant Librarian',
      unpaidFines: 250,
    });
    mDamaged.status = 'SUSPENDED';
    mDamaged.unpaidFinesTotal = 250;

    // Save suspensions
    SuspensionService.saveSuspensions(suspensionsToSeed);

    // Update active loans count and unpaid fines for other sample members
    for (let i = 0; i < 5; i++) {
      const mem = m(i);
      mem.activeLoansCount = 1;
    }
    for (let i = 0; i < overdueLates.length; i++) {
      const lateDays = overdueLates[i]!;
      const mem = m(5 + i);
      mem.activeLoansCount = 1;
      mem.unpaidFinesTotal = lateDays * policy.finePerDay;
    }

    LocalAuthService.saveMembers(allMembers);
  }
}
