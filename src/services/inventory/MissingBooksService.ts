import { BookCopy, Book } from '@libraryos/shared';
import { CatalogRepository } from '../repositories/CatalogRepository';

export interface MissingBookRecord {
  copyId: string;
  barcode: string;
  bookTitle: string;
  shelfLocation: string;
  reportedMissingAt: number;
  auditSessionId?: string;
  notes?: string;
  recoveredAt?: number;
}

const MISSING_BOOKS_STORAGE_KEY = 'libraryos_missing_books_registry_v1';

export class MissingBooksService {
  static getMissingBooks(): MissingBookRecord[] {
    try {
      const data = localStorage.getItem(MISSING_BOOKS_STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // fallback
    }
    return [];
  }

  static saveMissingBooks(records: MissingBookRecord[]) {
    try {
      localStorage.setItem(MISSING_BOOKS_STORAGE_KEY, JSON.stringify(records));
    } catch {
      // ignore
    }
  }

  /**
   * Log missing books detected from an audit session
   */
  static logMissingBooks(items: MissingBookRecord[]) {
    const existing = this.getMissingBooks();
    const updated = [...existing];

    items.forEach((item) => {
      const alreadyExists = updated.some((m) => m.barcode.toLowerCase() === item.barcode.toLowerCase());
      if (!alreadyExists) {
        updated.unshift(item);
      }
    });

    this.saveMissingBooks(updated);

    // Also update copy status in CatalogRepository to LOST / MISSING
    const copies = CatalogRepository.getLocalCopies();
    items.forEach((item) => {
      const match = copies.find((c) => c.barcode.toLowerCase() === item.barcode.toLowerCase());
      if (match) {
        match.status = 'LOST';
        match.updatedAt = Date.now();
      }
    });
    CatalogRepository.saveLocalCopies(copies);
  }

  /**
   * Recover a found missing book by scanning its barcode
   */
  static recoverBookByBarcode(barcode: string, targetShelf?: string): { success: boolean; bookTitle?: string; message: string } {
    const clean = barcode.trim().toLowerCase();
    const missing = this.getMissingBooks();
    const match = missing.find((m) => m.barcode.toLowerCase() === clean);

    if (!match) {
      return { success: false, message: `Barcode ${barcode} is not currently registered in Missing Books.` };
    }

    // Remove from missing list
    const filtered = missing.filter((m) => m.barcode.toLowerCase() !== clean);
    this.saveMissingBooks(filtered);

    // Update copy status back to AVAILABLE and assign shelf
    const copies = CatalogRepository.getLocalCopies();
    const targetCopy = copies.find((c) => c.barcode.toLowerCase() === clean);
    if (targetCopy) {
      targetCopy.status = 'AVAILABLE';
      if (targetShelf) {
        targetCopy.location = targetShelf;
      }
      targetCopy.updatedAt = Date.now();
      CatalogRepository.saveLocalCopies(copies);
    }

    return {
      success: true,
      bookTitle: match.bookTitle,
      message: `Book "${match.bookTitle}" (${match.barcode}) recovered successfully! Returned to active inventory.`,
    };
  }
}
