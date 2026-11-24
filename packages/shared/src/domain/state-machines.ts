import { BookCopyStatus } from '../constants/statuses';

export const VALID_COPY_TRANSITIONS: Record<BookCopyStatus, readonly BookCopyStatus[]> = {
  IN_PROCESSING: ['AVAILABLE', 'REFERENCE_ONLY', 'DAMAGED', 'WITHDRAWN'],
  AVAILABLE: ['ISSUED', 'ON_HOLD', 'RESERVED', 'DAMAGED', 'UNDER_REPAIR', 'LOST', 'MISSING', 'IN_TRANSIT', 'WITHDRAWN', 'REFERENCE_ONLY'],
  REFERENCE_ONLY: ['DAMAGED', 'UNDER_REPAIR', 'WITHDRAWN', 'AVAILABLE'],
  ISSUED: ['AVAILABLE', 'DAMAGED', 'LOST', 'IN_TRANSIT'],
  RESERVED: ['ON_HOLD', 'AVAILABLE', 'LOST', 'DAMAGED'],
  ON_HOLD: ['ISSUED', 'AVAILABLE', 'LOST', 'DAMAGED'],
  LOST: ['AVAILABLE', 'WITHDRAWN'],
  MISSING: ['AVAILABLE', 'LOST', 'WITHDRAWN'],
  DAMAGED: ['UNDER_REPAIR', 'AVAILABLE', 'WITHDRAWN'],
  UNDER_REPAIR: ['AVAILABLE', 'DAMAGED', 'WITHDRAWN'],
  IN_TRANSIT: ['AVAILABLE', 'ON_HOLD', 'DAMAGED', 'LOST', 'MISSING'],
  WITHDRAWN: [], // Terminal status
};

export function canTransitionCopy(from: BookCopyStatus, to: BookCopyStatus): boolean {
  if (from === to) return true;
  const allowed = VALID_COPY_TRANSITIONS[from];
  return allowed ? allowed.includes(to) : false;
}
