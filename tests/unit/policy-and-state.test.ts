import { describe, it, expect } from 'vitest';
import { canTransitionCopy, calculateFine, calculateDueDate, LoanPolicy } from '@libraryos/shared';

describe('Copy State Machine Transitions', () => {
  it('allows valid transition from AVAILABLE to ISSUED', () => {
    expect(canTransitionCopy('AVAILABLE', 'ISSUED')).toBe(true);
  });

  it('allows valid transition from ISSUED to AVAILABLE', () => {
    expect(canTransitionCopy('ISSUED', 'AVAILABLE')).toBe(true);
  });

  it('rejects invalid transition from ISSUED to ON_HOLD', () => {
    expect(canTransitionCopy('ISSUED', 'ON_HOLD')).toBe(false);
  });

  it('rejects transitions out of terminal WITHDRAWN state', () => {
    expect(canTransitionCopy('WITHDRAWN', 'AVAILABLE')).toBe(false);
  });
});

describe('Loan Policy Fine Calculations', () => {
  const samplePolicy: LoanPolicy = {
    id: 'policy-general',
    name: 'General Public Book Policy',
    membershipType: 'GENERAL',
    materialType: 'PRINT',
    maxLoans: 5,
    loanPeriodDays: 14,
    maxRenewals: 2,
    finePerDay: 10, // 10 LKR per day
    gracePeriodDays: 3,
    fineCap: 200,
    holdPeriodDays: 7,
    isActive: true,
  };

  it('calculates 0 fine when returned on or before due date', () => {
    const due = Date.now();
    const returned = due - 1000;
    expect(calculateFine(due, returned, samplePolicy)).toBe(0);
  });

  it('calculates 0 fine when within grace period', () => {
    const msInDay = 24 * 60 * 60 * 1000;
    const due = Date.now();
    const returned = due + 2 * msInDay; // 2 days overdue (within 3 day grace)
    expect(calculateFine(due, returned, samplePolicy)).toBe(0);
  });

  it('calculates accrued fine and caps at fineCap', () => {
    const msInDay = 24 * 60 * 60 * 1000;
    const due = Date.now();
    const returned = due + 30 * msInDay; // 30 days overdue => 300 LKR, but capped at 200 LKR
    expect(calculateFine(due, returned, samplePolicy)).toBe(200);
  });
});
