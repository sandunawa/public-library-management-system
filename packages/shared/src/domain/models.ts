import { UserRole } from '../constants/roles';
import { MembershipStatus, BookCopyStatus, LoanStatus, ReservationStatus, FineStatus } from '../constants/statuses';

export interface LibrarySettings {
  id: string;
  libraryName: string;
  tagline?: string;
  logoUrl?: string;
  defaultBranchId: string;
  defaultLanguage: 'en' | 'si' | 'ta';
  supportedLanguages: ('en' | 'si' | 'ta')[];
  currency: string;
  timezone: string;
  registrationMode: 'OPEN_AUTO_APPROVE' | 'OPEN_STAFF_APPROVAL' | 'INVITE_ONLY' | 'CLOSED';
  minorAgeThreshold: number;
  privacyRetentionDays: number;
  themePreset: 'CLASSIC_NAVY' | 'HERITAGE_GREEN' | 'WARM_PAPER' | 'MIDNIGHT';
  primaryColor?: string;
}

export interface Branch {
  id: string;
  name: string;
  code: string;
  address: string;
  district: string;
  phone: string;
  email: string;
  openingHours: Record<string, { open: string; close: string; closed?: boolean }>;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface Book {
  id: string;
  title: string;
  subtitle?: string;
  isbn10?: string;
  isbn13?: string;
  authorIds: string[];
  authorNames: string[];
  publisherId?: string;
  publisherName?: string;
  publicationYear?: number;
  edition?: string;
  categoryId: string;
  categoryName: string;
  ddc?: string;
  language: 'en' | 'si' | 'ta' | string;
  format: 'PRINT' | 'EBOOK' | 'AUDIOBOOK' | 'PERIODICAL' | 'REFERENCE';
  audience: 'CHILDREN' | 'TEEN' | 'ADULT';
  description?: string;
  coverImageUrl?: string;
  totalCopies: number;
  availableCopies: number;
  tags: string[];
  searchTokens: string[];
  createdAt: number;
  updatedAt: number;
}

export interface BookCopy {
  id: string;
  bookId: string;
  barcode: string;
  branchId: string;
  status: BookCopyStatus;
  callNumber?: string;
  location?: string;
  price?: number;
  conditionNotes?: string;
  acquisitionDate: number;
  lastCirculatedAt?: number;
  createdAt: number;
  updatedAt: number;
}

export interface MemberProfile {
  id: string; // matches Firebase Auth UID
  memberIdNumber: string; // e.g. LIB-2026-0001
  fullName: string;
  email: string;
  phone: string;
  dob: string;
  address: string;
  district: string;
  nic?: string;
  membershipType: 'GENERAL' | 'STUDENT' | 'TEACHER' | 'SENIOR' | 'JUNIOR' | 'INSTITUTIONAL';
  status: MembershipStatus;
  homeBranchId: string;
  preferredLanguage: 'en' | 'si' | 'ta';
  borrowingHistoryOptIn: boolean;
  activeLoansCount: number;
  unpaidFinesTotal: number;
  guardianName?: string;
  guardianPhone?: string;
  approvedBy?: string;
  approvedAt?: number;
  expiryDate: number;
  createdAt: number;
  updatedAt: number;
}

export interface LoanPolicy {
  id: string;
  name: string;
  membershipType: string;
  materialType: string;
  branchId?: string;
  maxLoans: number;
  loanPeriodDays: number;
  maxRenewals: number;
  finePerDay: number;
  gracePeriodDays: number;
  fineCap: number;
  holdPeriodDays: number;
  isActive: boolean;
}

export interface Loan {
  id: string;
  loanNumber: string;
  copyId: string;
  bookId: string;
  bookTitle: string;
  memberId: string;
  memberName: string;
  branchId: string;
  issuedByStaffId: string;
  issuedAt: number;
  dueDate: number;
  returnedAt?: number;
  returnBranchId?: number;
  renewalCount: number;
  status: LoanStatus;
  idempotencyKey?: string;
}

export interface Reservation {
  id: string;
  bookId: string;
  bookTitle: string;
  memberId: string;
  memberName: string;
  pickupBranchId: string;
  allocatedCopyId?: string;
  queuePosition: number;
  placedAt: number;
  readyAt?: number;
  expiresAt?: number;
  status: ReservationStatus;
}

export interface Fine {
  id: string;
  loanId?: string;
  memberId: string;
  memberName: string;
  amount: number;
  balance: number;
  reason: 'OVERDUE' | 'DAMAGED' | 'LOST' | 'MANUAL';
  status: FineStatus;
  createdAt: number;
  updatedAt: number;
}

export interface LedgerEntry {
  id: string;
  timestamp: number;
  fineId?: string;
  memberId: string;
  amount: number;
  type: 'FINE_ASSESSED' | 'PAYMENT_RECEIVED' | 'FINE_WAIVED' | 'FINE_ADJUSTED' | 'REFUND';
  paymentMethod?: 'CASH' | 'CARD' | 'PAYHERE' | 'STRIPE';
  referenceId?: string;
  staffId: string;
  notes?: string;
}

export interface AuditLog {
  id: string;
  timestamp: number;
  action: string;
  entityType: string;
  entityId: string;
  performedBy: string;
  performerRole: UserRole;
  branchId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
}
