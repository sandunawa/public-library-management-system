import {
  collection,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  runTransaction,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import {
  Loan,
  BookCopy,
  Book,
  MemberProfile,
  LoanPolicy,
  calculateDueDate,
  calculateFine,
  canTransitionCopy,
} from '@libraryos/shared';
import { LocalAuthService } from '../auth/LocalAuthService';
import { CatalogRepository } from './CatalogRepository';
import { PolicyService } from '../circulation/PolicyService';

const LOCAL_LOANS_KEY = 'libraryos_local_circulation_loans_v1';

export interface IssueResult {
  success: boolean;
  loanId?: string;
  dueDate?: number;
  error?: string;
}

export interface ReturnResult {
  success: boolean;
  loanId?: string;
  fineAmount?: number;
  error?: string;
}

export class CirculationRepository {
  private static loansCollection = collection(db, 'loans');
  private static copiesCollection = collection(db, 'bookCopies');
  private static membersCollection = collection(db, 'members');
  private static booksCollection = collection(db, 'books');
  private static policiesCollection = collection(db, 'loanPolicies');

  /**
   * Local storage helper for loans
   */
  static getLocalLoans(): Loan[] {
    try {
      const data = localStorage.getItem(LOCAL_LOANS_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // fallback
    }
    return [];
  }

  static saveLocalLoans(loans: Loan[]) {
    try {
      localStorage.setItem(LOCAL_LOANS_KEY, JSON.stringify(loans));
    } catch {
      // ignore
    }
  }

  /**
   * Find member by Card Number or UID
   */
  static async findMember(identifier: string): Promise<MemberProfile | null> {
    const trimmed = identifier.trim().toLowerCase();

    // 1. Instant check in LocalAuthService members (Contains all 100 sample members + newly registered)
    const allMembers = LocalAuthService.getAllMembers();
    const matchedLocal = allMembers.find(
      (m) =>
        m.id.toLowerCase() === trimmed ||
        m.memberIdNumber.toLowerCase() === trimmed ||
        m.email.toLowerCase() === trimmed
    );
    if (matchedLocal) {
      return matchedLocal;
    }

    // 2. Fallback to Cloud Firestore
    try {
      const directRef = doc(db, 'members', identifier.trim());
      const directSnap = await getDoc(directRef);
      if (directSnap.exists()) return directSnap.data() as MemberProfile;

      const q = query(this.membersCollection, where('memberIdNumber', '==', identifier.trim()));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs[0]!.data() as MemberProfile;
      }
    } catch {
      // offline
    }
    return null;
  }

  /**
   * Find copy by physical barcode
   */
  static async findCopyByBarcode(barcode: string): Promise<BookCopy | null> {
    const trimmed = barcode.trim().toLowerCase();

    // 1. Instant local lookup
    const localCopies = CatalogRepository.getLocalCopies();
    const matchedLocal = localCopies.find((c) => c.barcode.toLowerCase() === trimmed);
    if (matchedLocal) {
      return matchedLocal;
    }

    // 2. Cloud Firestore fallback
    try {
      const q = query(this.copiesCollection, where('barcode', '==', barcode.trim()));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs[0]!.data() as BookCopy;
      }
    } catch {
      // offline
    }
    return null;
  }

  /**
   * Transactional Issue of Book Copy
   * Enforces member status, eligibility, copy status transition, and policy due dates.
   */
  static async issueCopy(
    barcode: string,
    memberIdentifier: string,
    branchId: string,
    staffId: string
  ): Promise<IssueResult> {
    const member = await this.findMember(memberIdentifier);
    if (!member) {
      return { success: false, error: 'Member profile not found.' };
    }
    if (member.status !== 'ACTIVE') {
      return { success: false, error: `Member is currently ${member.status}. Only ACTIVE members can borrow.` };
    }

    const copy = await this.findCopyByBarcode(barcode);
    if (!copy) {
      return { success: false, error: `Copy barcode ${barcode} not found in inventory.` };
    }
    if (copy.status !== 'AVAILABLE') {
      return { success: false, error: `Copy is currently ${copy.status}. Only AVAILABLE copies can be issued.` };
    }

    // Dynamic Circulation Policy configured in Policy & Settings
    const policy = PolicyService.toLoanPolicy();

    const now = Date.now();
    const calculatedDueDate = calculateDueDate(now, policy);

    try {
      const loanId = doc(this.loansCollection).id;

      // Update local storage models first
      const localCopies = CatalogRepository.getLocalCopies();
      const targetCopy = localCopies.find((c) => c.id === copy.id);
      if (targetCopy) {
        targetCopy.status = 'ISSUED';
        targetCopy.lastCirculatedAt = now;
        CatalogRepository.saveLocalCopies(localCopies);
      }

      const localBooks = CatalogRepository.getLocalBooks();
      const targetBook = localBooks.find((b) => b.id === copy.bookId);
      if (targetBook) {
        targetBook.availableCopies = Math.max(0, (targetBook.availableCopies || 1) - 1);
        CatalogRepository.saveLocalBooks(localBooks);
      }

      // Record local loan
      const localLoan: Loan = {
        id: loanId,
        loanNumber: `LN-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`,
        copyId: copy.id,
        bookId: copy.bookId,
        bookTitle: targetBook ? targetBook.title : `Copy ${barcode}`,
        memberId: member.id,
        memberName: member.fullName,
        branchId,
        issuedByStaffId: staffId,
        issuedAt: now,
        dueDate: calculatedDueDate,
        renewalCount: 0,
        status: 'ACTIVE',
      };
      const existingLoans = this.getLocalLoans();
      this.saveLocalLoans([localLoan, ...existingLoans]);

      // Update local member active loans
      const allMembers = LocalAuthService.getAllMembers();
      const mIdx = allMembers.findIndex((m) => m.id === member.id);
      if (mIdx !== -1 && allMembers[mIdx]) {
        allMembers[mIdx]!.activeLoansCount = (allMembers[mIdx]!.activeLoansCount || 0) + 1;
        LocalAuthService.saveMembers(allMembers);
      }

      // Sync Firestore in background if online
      runTransaction(db, async (transaction) => {
        const copyRef = doc(db, 'bookCopies', copy.id);
        const bookRef = doc(db, 'books', copy.bookId);
        const memberRef = doc(db, 'members', member.id);
        const loanRef = doc(db, 'loans', loanId);

        const freshCopySnap = await transaction.get(copyRef);
        if (!freshCopySnap.exists()) return;
        const freshCopy = freshCopySnap.data() as BookCopy;
        if (freshCopy.status !== 'AVAILABLE') return;

        const freshBookSnap = await transaction.get(bookRef);
        const book = freshBookSnap.data() as Book;

        // 1. Create Loan record
        const loanData: Loan = {
          id: loanId,
          loanNumber: `LN-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`,
          copyId: copy.id,
          bookId: copy.bookId,
          bookTitle: book.title,
          memberId: member.id,
          memberName: member.fullName,
          branchId,
          issuedByStaffId: staffId,
          issuedAt: now,
          dueDate: calculatedDueDate,
          renewalCount: 0,
          status: 'ACTIVE',
        };
        transaction.set(loanRef, loanData);

        // 2. Transition Copy status to ISSUED
        transaction.update(copyRef, {
          status: 'ISSUED',
          lastCirculatedAt: now,
          updatedAt: now,
        });

        // 3. Update Book available copies
        transaction.update(bookRef, {
          availableCopies: Math.max(0, (book.availableCopies || 1) - 1),
          updatedAt: now,
        });

        // 4. Update Member active loans count
        transaction.update(memberRef, {
          activeLoansCount: (member.activeLoansCount || 0) + 1,
          updatedAt: now,
        });
      }).catch(() => {
        // offline fallback
      });

      return {
        success: true,
        loanId,
        dueDate: calculatedDueDate,
      };
    } catch (err: any) {
      return { success: false, error: err.message || 'Transaction failed.' };
    }
  }

  /**
   * Transactional Return of Book Copy
   * Computes fines, transitions status back to AVAILABLE, adjusts availability.
   */
  static async returnCopy(barcode: string, branchId: string): Promise<ReturnResult> {
    const copy = await this.findCopyByBarcode(barcode);
    if (!copy) {
      return { success: false, error: `Copy barcode ${barcode} not found.` };
    }

    const now = Date.now();
    const policy = PolicyService.toLoanPolicy();

    // 1. Check local loans first
    const localLoans = this.getLocalLoans();
    let localActiveLoan = localLoans.find((l) => l.copyId === copy.id && l.status === 'ACTIVE');

    // Fine calculation
    let fineAmount = 0;
    if (localActiveLoan) {
      fineAmount = calculateFine(localActiveLoan.dueDate, now, policy);
      localActiveLoan.status = 'RETURNED';
      localActiveLoan.returnedAt = now;
      this.saveLocalLoans(localLoans);

      // Decrement member loans in local auth
      const allMembers = LocalAuthService.getAllMembers();
      const mIdx = allMembers.findIndex((m) => m.id === localActiveLoan?.memberId);
      if (mIdx !== -1 && allMembers[mIdx]) {
        allMembers[mIdx]!.activeLoansCount = Math.max(0, (allMembers[mIdx]!.activeLoansCount || 1) - 1);
        allMembers[mIdx]!.unpaidFinesTotal = (allMembers[mIdx]!.unpaidFinesTotal || 0) + fineAmount;
        LocalAuthService.saveMembers(allMembers);
      }
    }

    // Update local copy to AVAILABLE
    const localCopies = CatalogRepository.getLocalCopies();
    const targetCopy = localCopies.find((c) => c.id === copy.id);
    if (targetCopy) {
      targetCopy.status = 'AVAILABLE';
      CatalogRepository.saveLocalCopies(localCopies);
    }

    // Increment available book copies
    const localBooks = CatalogRepository.getLocalBooks();
    const targetBook = localBooks.find((b) => b.id === copy.bookId);
    if (targetBook) {
      targetBook.availableCopies = (targetBook.availableCopies || 0) + 1;
      CatalogRepository.saveLocalBooks(localBooks);
    }

    // 2. Also sync Firestore if online
    try {
      const q = query(
        this.loansCollection,
        where('copyId', '==', copy.id),
        where('status', '==', 'ACTIVE')
      );
      const loanSnap = await getDocs(q);
      if (!loanSnap.empty) {
        const loan = loanSnap.docs[0]!.data() as Loan;
        const firestoreFine = calculateFine(loan.dueDate, now, policy);
        if (!fineAmount) fineAmount = firestoreFine;

        await runTransaction(db, async (transaction) => {
          const loanRef = doc(db, 'loans', loan.id);
          const copyRef = doc(db, 'bookCopies', copy.id);
          const bookRef = doc(db, 'books', copy.bookId);
          const memberRef = doc(db, 'members', loan.memberId);

          // Mark loan RETURNED
          transaction.update(loanRef, {
            status: 'RETURNED',
            returnedAt: now,
            returnBranchId: branchId,
          });

          // Set copy AVAILABLE
          transaction.update(copyRef, {
            status: 'AVAILABLE',
            updatedAt: now,
          });

          // Increment book available copies
          const bookSnap = await transaction.get(bookRef);
          if (bookSnap.exists()) {
            const b = bookSnap.data() as Book;
            transaction.update(bookRef, {
              availableCopies: (b.availableCopies || 0) + 1,
              updatedAt: now,
            });
          }

          // Decrement member active loans count
          const memberSnap = await transaction.get(memberRef);
          if (memberSnap.exists()) {
            const m = memberSnap.data() as MemberProfile;
            transaction.update(memberRef, {
              activeLoansCount: Math.max(0, (m.activeLoansCount || 1) - 1),
              unpaidFinesTotal: (m.unpaidFinesTotal || 0) + fineAmount,
              updatedAt: now,
            });
          }
        });
      }
    } catch {
      // Offline fallback
    }

    return {
      success: true,
      loanId: localActiveLoan?.id || 'offline-return',
      fineAmount,
    };
  }

  /**
   * Renew an active loan (additive method)
   */
  static async renewLoan(
    loanId: string,
    policy: LoanPolicy
  ): Promise<{ success: boolean; newDueDate?: number; error?: string }> {
    const loans = this.getLocalLoans();
    const loanIndex = loans.findIndex((l) => l.id === loanId);
    if (loanIndex === -1) {
      return { success: false, error: 'Loan not found' };
    }

    const loan = loans[loanIndex]!;
    if (loan.status !== 'ACTIVE') {
      return { success: false, error: 'Only active loans can be renewed' };
    }

    const maxRenewals = policy.maxRenewals || 2;
    if ((loan.renewalCount || 0) >= maxRenewals) {
      return { success: false, error: `Maximum renewal limit (${maxRenewals}) reached` };
    }

    const now = Date.now();
    const periodDays = policy.loanPeriodDays || 14;
    const newDueDate = (loan.dueDate > now ? loan.dueDate : now) + periodDays * 24 * 60 * 60 * 1000;

    loan.renewalCount = (loan.renewalCount || 0) + 1;
    loan.dueDate = newDueDate;

    loans[loanIndex] = loan;
    this.saveLocalLoans(loans);

    return { success: true, newDueDate };
  }
}
