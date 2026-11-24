import { z } from 'zod';
import { BOOK_COPY_STATUSES } from '../constants/statuses';

export const bookSchema = z.object({
  title: z.string().min(1, 'Book title is required').max(255),
  subtitle: z.string().max(255).optional(),
  isbn10: z.string().max(10).optional(),
  isbn13: z.string().max(17).optional(),
  authorIds: z.array(z.string()).min(1, 'At least one author must be linked'),
  authorNames: z.array(z.string()).min(1),
  publisherId: z.string().optional(),
  publisherName: z.string().optional(),
  publicationYear: z.number().int().min(1000).max(new Date().getFullYear() + 2).optional(),
  edition: z.string().optional(),
  categoryId: z.string().min(1, 'Category is required'),
  categoryName: z.string().min(1),
  ddc: z.string().optional(),
  language: z.enum(['en', 'si', 'ta', 'other']).default('en'),
  format: z.enum(['PRINT', 'EBOOK', 'AUDIOBOOK', 'PERIODICAL', 'REFERENCE']).default('PRINT'),
  audience: z.enum(['CHILDREN', 'TEEN', 'ADULT']).default('ADULT'),
  description: z.string().optional(),
  coverImageUrl: z.string().url().optional(),
  tags: z.array(z.string()).default([]),
});

export const bookCopySchema = z.object({
  bookId: z.string().min(1),
  barcode: z.string().min(3, 'Barcode must be at least 3 characters'),
  branchId: z.string().min(1, 'Branch selection is required'),
  status: z.enum(BOOK_COPY_STATUSES as any).default('AVAILABLE'),
  callNumber: z.string().optional(),
  location: z.string().optional(),
  price: z.number().nonnegative().optional(),
  conditionNotes: z.string().optional(),
});

export type BookInput = z.infer<typeof bookSchema>;
export type BookCopyInput = z.infer<typeof bookCopySchema>;
