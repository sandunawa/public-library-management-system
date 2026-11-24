import { z } from 'zod';
import { MEMBERSHIP_STATUSES } from '../constants/statuses';

export const memberProfileUpdateSchema = z.object({
  fullName: z.string().min(2).max(100).optional(),
  phone: z.string().min(9).optional(),
  address: z.string().min(5).optional(),
  district: z.string().min(2).optional(),
  preferredLanguage: z.enum(['en', 'si', 'ta']).optional(),
  borrowingHistoryOptIn: z.boolean().optional(),
  homeBranchId: z.string().optional(),
});

export const memberStaffActionSchema = z.object({
  memberId: z.string(),
  action: z.enum(['APPROVE', 'REJECT', 'SUSPEND', 'ACTIVATE', 'BLOCK', 'EXTEND']),
  reason: z.string().min(3, 'A reason is mandatory for staff membership actions'),
});

export type MemberProfileUpdateInput = z.infer<typeof memberProfileUpdateSchema>;
export type MemberStaffActionInput = z.infer<typeof memberStaffActionSchema>;
