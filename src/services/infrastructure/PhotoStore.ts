import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface LibraryPhotoDB extends DBSchema {
  photos: {
    key: string; // memberId or admissionNo
    value: {
      id: string;
      dataUrl: string;
      updatedAt: number;
    };
  };
}

const DB_NAME = 'libraryos_photos_v1';
const STORE_NAME = 'photos';

class PhotoStoreClass {
  private dbPromise: Promise<IDBPDatabase<LibraryPhotoDB>> | null = null;

  private getDB() {
    if (!this.dbPromise) {
      this.dbPromise = openDB<LibraryPhotoDB>(DB_NAME, 1, {
        upgrade(db) {
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          }
        },
      });
    }
    return this.dbPromise;
  }

  public async savePhoto(id: string, dataUrl: string): Promise<void> {
    const db = await this.getDB();
    await db.put(STORE_NAME, {
      id,
      dataUrl,
      updatedAt: Date.now(),
    });
  }

  public async getPhoto(id: string): Promise<string | null> {
    const db = await this.getDB();
    const entry = await db.get(STORE_NAME, id);
    return entry ? entry.dataUrl : null;
  }

  public async deletePhoto(id: string): Promise<void> {
    const db = await this.getDB();
    await db.delete(STORE_NAME, id);
  }

  public async clearAll(): Promise<void> {
    const db = await this.getDB();
    await db.clear(STORE_NAME);
  }
}

export const PhotoStore = new PhotoStoreClass();
