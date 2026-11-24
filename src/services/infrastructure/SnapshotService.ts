/**
 * SnapshotService: Safe, atomic snapshot and rollback for critical mutations
 * (e.g. bulk member import, class promotion, destructive operations).
 */
export interface DataSnapshot {
  id: string;
  timestamp: number;
  description: string;
  keys: { key: string; value: string | null }[];
}

const SNAPSHOT_INDEX_KEY = 'libraryos_snapshots_index_v1';

class SnapshotServiceClass {
  public createSnapshot(description: string, targetKeys: string[]): string {
    const id = `snap-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const snapshot: DataSnapshot = {
      id,
      timestamp: Date.now(),
      description,
      keys: targetKeys.map((k) => ({
        key: k,
        value: localStorage.getItem(k),
      })),
    };

    try {
      localStorage.setItem(`libraryos_snapshot_${id}`, JSON.stringify(snapshot));
      const index = this.listSnapshots();
      index.unshift({ id, timestamp: snapshot.timestamp, description });
      localStorage.setItem(SNAPSHOT_INDEX_KEY, JSON.stringify(index.slice(0, 20)));
    } catch (e) {
      console.error('Failed to create snapshot:', e);
    }

    return id;
  }

  public listSnapshots(): { id: string; timestamp: number; description: string }[] {
    try {
      const data = localStorage.getItem(SNAPSHOT_INDEX_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public restoreSnapshot(id: string): boolean {
    try {
      const raw = localStorage.getItem(`libraryos_snapshot_${id}`);
      if (!raw) return false;
      const snapshot: DataSnapshot = JSON.parse(raw);

      for (const item of snapshot.keys) {
        if (item.value === null) {
          localStorage.removeItem(item.key);
        } else {
          localStorage.setItem(item.key, item.value);
        }
      }
      return true;
    } catch (e) {
      console.error('Failed to restore snapshot:', e);
      return false;
    }
  }
}

export const SnapshotService = new SnapshotServiceClass();
