export type MembershipStatus =
  | 'PENDING'
  | 'ACTIVE'
  | 'EXPIRED'
  | 'SUSPENDED'
  | 'BLOCKED'
  | 'CANCELLED';

export const MEMBERSHIP_STATUSES: readonly MembershipStatus[] = [
  'PENDING',
  'ACTIVE',
  'EXPIRED',
  'SUSPENDED',
  'BLOCKED',
  'CANCELLED',
] as const;

export type BookCopyStatus =
  | 'AVAILABLE'
  | 'ISSUED'
  | 'RESERVED'
  | 'ON_HOLD'
  | 'LOST'
  | 'DAMAGED'
  | 'UNDER_REPAIR'
  | 'WITHDRAWN'
  | 'IN_TRANSIT'
  | 'MISSING'
  | 'IN_PROCESSING'
  | 'REFERENCE_ONLY';

export const BOOK_COPY_STATUSES: readonly BookCopyStatus[] = [
  'AVAILABLE',
  'ISSUED',
  'RESERVED',
  'ON_HOLD',
  'LOST',
  'DAMAGED',
  'UNDER_REPAIR',
  'WITHDRAWN',
  'IN_TRANSIT',
  'MISSING',
  'IN_PROCESSING',
  'REFERENCE_ONLY',
] as const;

export type LoanStatus =
  | 'ACTIVE'
  | 'RETURNED'
  | 'OVERDUE'
  | 'LOST'
  | 'CLAIMED_RETURNED';

export type ReservationStatus =
  | 'WAITING'
  | 'READY_FOR_PICKUP'
  | 'FULFILLED'
  | 'EXPIRED'
  | 'CANCELLED'
  | 'FROZEN';

export type FineStatus =
  | 'OUTSTANDING'
  | 'PARTIALLY_PAID'
  | 'PAID'
  | 'WAIVED'
  | 'ADJUSTED';
