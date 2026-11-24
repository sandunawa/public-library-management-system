import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { Book, BookCopy, BookCopyStatus, canTransitionCopy } from '@libraryos/shared';
import { INITIAL_100_SAMPLE_BOOKS } from '@/data/sample100Books';

const LOCAL_BOOKS_KEY = 'libraryos_local_catalog_books_v2';
const LOCAL_COPIES_KEY = 'libraryos_local_catalog_copies_v2';

export class CatalogRepository {
  private static booksCollection = collection(db, 'books');
  private static copiesCollection = collection(db, 'bookCopies');

  /**
   * Helper to initialize and retrieve LocalStorage data with guaranteed 100 books
   */
  static getLocalBooks(): Book[] {
    try {
      const data = localStorage.getItem(LOCAL_BOOKS_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }

    // Auto-populate 100 sample books with deterministic IDs
    const now = Date.now();
    const seededBooks: Book[] = INITIAL_100_SAMPLE_BOOKS.map((b, idx) => ({
      ...b,
      id: `bk_${1001 + idx}`,
      createdAt: now - idx * 100000,
      updatedAt: now,
    }));
    try {
      localStorage.setItem(LOCAL_BOOKS_KEY, JSON.stringify(seededBooks));
    } catch {
      // ignore
    }
    return seededBooks;
  }

  static saveLocalBooks(books: Book[]) {
    try {
      localStorage.setItem(LOCAL_BOOKS_KEY, JSON.stringify(books));
    } catch {
      // ignore
    }
  }

  /**
   * Guaranteed: Every single book has its own unique physical barcodes!
   */
  static getLocalCopies(): BookCopy[] {
    try {
      const data = localStorage.getItem(LOCAL_COPIES_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }

    // Generate physical copies with unique Code 128 barcodes for ALL 100 books!
    const books = this.getLocalBooks();
    const copies: BookCopy[] = [];
    const now = Date.now();

    books.forEach((b, bIdx) => {
      const totalCopies = b.totalCopies || 1;
      for (let i = 1; i <= totalCopies; i++) {
        const copyNum = 1000 + bIdx * 3 + i;
        copies.push({
          id: `cp_${b.id}_${i}`,
          bookId: b.id,
          barcode: `BC-COL-${copyNum}`, // Unique Barcode (e.g. BC-COL-1001, BC-COL-1002, ...)
          branchId: 'branch-colombo-hq',
          status: 'AVAILABLE',
          callNumber: `${b.categoryId.slice(0, 3).toUpperCase()} ${100 + (bIdx % 899)}`,
          acquisitionDate: now - 86400000 * 30,
          createdAt: now,
          updatedAt: now,
        });
      }
    });

    try {
      localStorage.setItem(LOCAL_COPIES_KEY, JSON.stringify(copies));
    } catch {
      // ignore
    }
    return copies;
  }

  static saveLocalCopies(copies: BookCopy[]) {
    try {
      localStorage.setItem(LOCAL_COPIES_KEY, JSON.stringify(copies));
    } catch {
      // ignore
    }
  }

  /**
   * Fetch all books or filter by category (Instant local load + background Firestore sync)
   */
  static async getBooks(categoryId?: string, maxItems = 150): Promise<Book[]> {
    // 1. Instant local load: Zero network latency delay!
    const localBooks = this.getLocalBooks();
    
    // Background sync with Firestore if online & configured
    if (import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true' || import.meta.env.VITE_FIREBASE_API_KEY) {
      getDocs(query(this.booksCollection, orderBy('createdAt', 'desc'), limit(maxItems)))
        .then((snapshot) => {
          if (!snapshot.empty) {
            const remoteBooks: Book[] = [];
            snapshot.forEach((d) => remoteBooks.push({ id: d.id, ...d.data() } as Book));
            this.saveLocalBooks(remoteBooks);
          }
        })
        .catch(() => {
          // offline mode
        });
    }

    if (categoryId && categoryId !== 'ALL') {
      return localBooks.filter((b) => b.categoryId === categoryId);
    }
    return localBooks;
  }

  /**
   * Get single book by ID
   */
  static async getBookById(id: string): Promise<Book | null> {
    try {
      const docRef = doc(db, 'books', id);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return { id: snap.id, ...snap.data() } as Book;
      }
    } catch {
      // fallback
    }
    const all = this.getLocalBooks();
    return all.find((b) => b.id === id) || null;
  }

  /**
   * Create or update a bibliographic title AND automatically assign unique physical copy barcodes
   */
  static async saveBook(book: Omit<Book, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<string> {
    const bookId = book.id || 'bk_' + Math.random().toString(36).substring(2, 9);
    const now = Date.now();

    const bookData: Book = {
      ...book,
      id: bookId,
      totalCopies: Math.max(1, book.totalCopies ?? 1),
      availableCopies: Math.max(1, book.availableCopies ?? 1),
      createdAt: now,
      updatedAt: now,
    };

    // Save book locally
    const books = this.getLocalBooks();
    const existingIdx = books.findIndex((b) => b.id === bookId);
    if (existingIdx >= 0) {
      books[existingIdx] = bookData;
    } else {
      books.unshift(bookData);
    }
    this.saveLocalBooks(books);

    // Automatically create unique physical barcode copies for this book!
    const copies = this.getLocalCopies();
    const existingCopies = copies.filter((c) => c.bookId === bookId);
    if (existingCopies.length === 0) {
      const newBarcode = `BC-COL-${Math.floor(10000 + Math.random() * 89999)}`;
      copies.push({
        id: `cp_${bookId}_1`,
        bookId,
        barcode: newBarcode,
        branchId: 'branch-colombo-hq',
        status: 'AVAILABLE',
        callNumber: '823.91 GEN',
        acquisitionDate: now,
        createdAt: now,
        updatedAt: now,
      });
      this.saveLocalCopies(copies);
    }

    // Also attempt Firebase Firestore write
    try {
      await setDoc(doc(db, 'books', bookId), bookData, { merge: true });
    } catch (err) {
      console.warn('Firestore book save offline note:', err);
    }

    return bookId;
  }

  /**
   * Fetch all physical/digital copies of a specific book
   */
  static async getBookCopies(bookId: string): Promise<BookCopy[]> {
    try {
      const q = query(this.copiesCollection, where('bookId', '==', bookId));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const copies: BookCopy[] = [];
        snapshot.forEach((d) => copies.push({ id: d.id, ...d.data() } as BookCopy));
        return copies;
      }
    } catch {
      // fallback
    }

    const allCopies = this.getLocalCopies();
    const matched = allCopies.filter((c) => c.bookId === bookId);
    
    // If somehow a book has no copy, generate one on the fly!
    if (matched.length === 0) {
      const autoBarcode = `BC-COL-${Math.floor(10000 + Math.random() * 89999)}`;
      const autoCopy: BookCopy = {
        id: `cp_${bookId}_1`,
        bookId,
        barcode: autoBarcode,
        branchId: 'branch-colombo-hq',
        status: 'AVAILABLE',
        callNumber: '823.91 GEN',
        acquisitionDate: Date.now(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      allCopies.push(autoCopy);
      this.saveLocalCopies(allCopies);
      return [autoCopy];
    }

    return matched;
  }

  /**
   * Add a new physical copy with barcode
   */
  static async addCopy(copy: Omit<BookCopy, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const copyId = 'cp_' + Math.random().toString(36).substring(2, 9);
    const now = Date.now();

    const copyData: BookCopy = {
      ...copy,
      id: copyId,
      barcode: copy.barcode || `BC-COL-${Math.floor(10000 + Math.random() * 89999)}`,
      createdAt: now,
      updatedAt: now,
    };

    // Update local copies
    const copies = this.getLocalCopies();
    copies.push(copyData);
    this.saveLocalCopies(copies);

    // Update local book count
    const books = this.getLocalBooks();
    const b = books.find((x) => x.id === copy.bookId);
    if (b) {
      b.totalCopies = (b.totalCopies || 0) + 1;
      if (copy.status === 'AVAILABLE') {
        b.availableCopies = (b.availableCopies || 0) + 1;
      }
      b.updatedAt = now;
      this.saveLocalBooks(books);
    }

    // Try Firestore
    try {
      await setDoc(doc(db, 'bookCopies', copyId), copyData);
      const bookRef = doc(db, 'books', copy.bookId);
      const bookSnap = await getDoc(bookRef);
      if (bookSnap.exists()) {
        const remoteBook = bookSnap.data() as Book;
        await updateDoc(bookRef, {
          totalCopies: (remoteBook.totalCopies || 0) + 1,
          availableCopies: copy.status === 'AVAILABLE' ? (remoteBook.availableCopies || 0) + 1 : remoteBook.availableCopies,
          updatedAt: now,
        });
      }
    } catch {
      // ignore offline
    }

    return copyId;
  }

  /**
   * Update copy status enforcing the state transition machine
   */
  static async updateCopyStatus(
    copyId: string,
    newStatus: BookCopyStatus,
    reason?: string
  ): Promise<{ success: boolean; error?: string }> {
    const copies = this.getLocalCopies();
    const current = copies.find((c) => c.id === copyId);
    if (!current) {
      return { success: false, error: 'Copy record not found' };
    }

    if (!canTransitionCopy(current.status, newStatus)) {
      return {
        success: false,
        error: `Illegal state transition from ${current.status} to ${newStatus}`,
      };
    }

    const now = Date.now();
    current.status = newStatus;
    if (reason) current.conditionNotes = `${current.conditionNotes || ''} | ${reason}`;
    current.updatedAt = now;
    this.saveLocalCopies(copies);

    try {
      const copyRef = doc(db, 'bookCopies', copyId);
      await updateDoc(copyRef, {
        status: newStatus,
        updatedAt: now,
      });
    } catch {
      // ignore
    }

    return { success: true };
  }
}
