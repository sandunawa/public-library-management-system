import { z } from 'zod';

export const issueLoanSchema = z.object({
  copyBarcode: z.string().min(1, 'Barcode is required'),
  memberIdOrNumber: z.string().min(1, 'Member ID or Card Number is required'),
  branchId: z.string().min(1, 'Branch ID is required'),
  idempotencyKey: z.string().uuid(),
  overrideReason: z.string().optional(),
});

export const returnLoanSchema = z.object({
  copyBarcode: z.string().min(1, 'Barcode is required'),
  branchId: z.string().min(1, 'Return Branch ID is required'),
  idempotencyKey: z.string().uuid(),
  conditionNote: z.string().optional(),
  isDamaged: z.boolean().default(false),
});

export const renewLoanSchema = z.object({
  loanId: z.string().min(1, 'Loan ID is required'),
  idempotencyKey: z.string().uuid(),
  overrideReason: z.string().optional(),
});

export type IssueLoanInput = z.infer<typeof issueLoanSchema>;
export type ReturnLoanInput = z.infer<typeof returnLoanSchema>;
export type RenewLoanInput = z.infer<typeof renewLoanSchema>;
