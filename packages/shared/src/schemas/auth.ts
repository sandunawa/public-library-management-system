import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  rememberMe: z.boolean().optional().default(false),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerMemberSchema = z.object({
  // Step 1: Account
  fullName: z.string().min(2, 'Full name is required (minimum 2 characters)').max(100),
  email: z.string().email('Valid email address is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
  preferredLanguage: z.enum(['en', 'si', 'ta']).default('en'),

  // Step 2: Personal
  dob: z.string().min(1, 'Date of birth is required'),
  phone: z.string().min(9, 'Valid telephone number is required'),
  address: z.string().min(5, 'Residential address is required'),
  district: z.string().min(2, 'District is required'),
  nic: z.string().optional(),

  // Step 3: Membership
  homeBranchId: z.string().min(1, 'Please select your preferred home branch'),
  membershipType: z.enum(['GENERAL', 'STUDENT', 'TEACHER', 'SENIOR', 'JUNIOR', 'INSTITUTIONAL']),
  guardianName: z.string().optional(),
  guardianPhone: z.string().optional(),

  // Step 4: Consent & Opt-ins
  borrowingHistoryOptIn: z.boolean().default(false),
  acceptTerms: z.literal(true, {
    errorMap: () => ({ message: 'You must accept the terms of service and privacy policy' }),
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export type RegisterMemberInput = z.infer<typeof registerMemberSchema>;
