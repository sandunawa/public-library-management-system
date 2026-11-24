import { doc, setDoc, writeBatch, collection, getDocs, limit, query } from 'firebase/firestore';
import { db } from '../firebase/config';
import { CatalogRepository } from '../repositories/CatalogRepository';
import { LocalAuthService } from '../auth/LocalAuthService';

export class FirebaseSyncService {
  /**
   * Verify Firestore connection before uploading
   */
  static async testConnection(): Promise<void> {
    try {
      await getDocs(query(collection(db, 'books'), limit(1)));
    } catch (err: any) {
      if (err.code === 'permission-denied') {
        throw new Error(
          'Firebase Permission Denied! Please go to Firestore -> Rules tab in Firebase Console and set "allow read, write: if true;"'
        );
      }
      throw err;
    }
  }

  /**
   * Sync all 100 books, barcodes, and 100 members to Cloud Firestore with live 0% to 100% progress callback
   */
  static async syncAllToCloudFirestore(
    onProgress?: (progressPercent: number, statusText: string) => void
  ): Promise<{
    booksCount: number;
    copiesCount: number;
    membersCount: number;
  }> {
    // 1. First test connection and permissions
    if (onProgress) onProgress(5, 'Connecting to Firebase & verifying credentials...');
    await this.testConnection();

    const books = CatalogRepository.getLocalBooks();
    const copies = CatalogRepository.getLocalCopies();
    const members = LocalAuthService.getAllMembers();

    const totalItems = books.length + copies.length + members.length;
    let processedItems = 0;

    let uploadedBooks = 0;
    let uploadedCopies = 0;
    let uploadedMembers = 0;

    // Helper to calculate progress between 10% and 95%
    const updateProgress = (text: string) => {
      if (onProgress) {
        const percent = Math.min(95, Math.floor(10 + (processedItems / totalItems) * 85));
        onProgress(percent, text);
      }
    };

    // Batch 1: Upload Books (chunk by 25 for fine-grained progress)
    const bookChunkSize = 25;
    for (let i = 0; i < books.length; i += bookChunkSize) {
      const batch = writeBatch(db);
      const chunk = books.slice(i, i + bookChunkSize);
      chunk.forEach((b) => {
        batch.set(doc(db, 'books', b.id), b, { merge: true });
      });
      await batch.commit();
      uploadedBooks += chunk.length;
      processedItems += chunk.length;
      updateProgress(`Uploading titles (${uploadedBooks}/${books.length})...`);
    }

    // Batch 2: Upload Copies with Barcodes (chunk by 25)
    const copyChunkSize = 25;
    for (let i = 0; i < copies.length; i += copyChunkSize) {
      const batch = writeBatch(db);
      const chunk = copies.slice(i, i + copyChunkSize);
      chunk.forEach((c) => {
        batch.set(doc(db, 'bookCopies', c.id), c, { merge: true });
      });
      await batch.commit();
      uploadedCopies += chunk.length;
      processedItems += chunk.length;
      updateProgress(`Uploading barcodes (${uploadedCopies}/${copies.length})...`);
    }

    // Batch 3: Upload Members (chunk by 25)
    const memberChunkSize = 25;
    for (let i = 0; i < members.length; i += memberChunkSize) {
      const batch = writeBatch(db);
      const chunk = members.slice(i, i + memberChunkSize);
      chunk.forEach((m) => {
        batch.set(doc(db, 'members', m.id), m, { merge: true });
      });
      await batch.commit();
      uploadedMembers += chunk.length;
      processedItems += chunk.length;
      updateProgress(`Uploading members (${uploadedMembers}/${members.length})...`);
    }

    if (onProgress) {
      onProgress(100, 'Upload Complete! All data saved to Cloud Firestore.');
    }

    return {
      booksCount: uploadedBooks,
      copiesCount: uploadedCopies,
      membersCount: uploadedMembers,
    };
  }
}
