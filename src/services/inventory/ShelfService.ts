import { CatalogRepository } from '../repositories/CatalogRepository';

export interface LibraryShelf {
  id: string;
  code: string; // e.g. "SH-A12"
  name: string; // e.g. "Shelf A-12 (History & Social Sciences)"
  categoryDdc?: string; // e.g. "900-999"
  floorZone?: string; // e.g. "First Floor - East Wing"
  capacity?: number;
  createdAt: number;
}

const SHELVES_STORAGE_KEY = 'libraryos_shelves_registry_v1';

const DEFAULT_SHELVES: LibraryShelf[] = [
  { id: 'sh_01', code: 'SH-A1', name: 'Shelf A-01 (Generalities & Computer Science)', categoryDdc: '000-099', floorZone: 'Ground Floor - Main Hall', capacity: 150, createdAt: Date.now() },
  { id: 'sh_02', code: 'SH-A2', name: 'Shelf A-02 (Philosophy & Psychology)', categoryDdc: '100-199', floorZone: 'Ground Floor - Main Hall', capacity: 150, createdAt: Date.now() },
  { id: 'sh_03', code: 'SH-B1', name: 'Shelf B-01 (Religion & Buddhism Studies)', categoryDdc: '200-299', floorZone: 'Ground Floor - Quiet Zone', capacity: 200, createdAt: Date.now() },
  { id: 'sh_04', code: 'SH-B2', name: 'Shelf B-02 (Social Sciences & Law)', categoryDdc: '300-399', floorZone: 'Ground Floor - East Wing', capacity: 180, createdAt: Date.now() },
  { id: 'sh_05', code: 'SH-C1', name: 'Shelf C-01 (Languages & Linguistics)', categoryDdc: '400-499', floorZone: 'First Floor - West Wing', capacity: 160, createdAt: Date.now() },
  { id: 'sh_06', code: 'SH-C2', name: 'Shelf C-02 (Natural Sciences & Mathematics)', categoryDdc: '500-599', floorZone: 'First Floor - Science Section', capacity: 220, createdAt: Date.now() },
  { id: 'sh_07', code: 'SH-D1', name: 'Shelf D-01 (Technology & Applied Sciences)', categoryDdc: '600-699', floorZone: 'First Floor - Engineering Bay', capacity: 200, createdAt: Date.now() },
  { id: 'sh_08', code: 'SH-D2', name: 'Shelf D-02 (The Arts & Fine Arts)', categoryDdc: '700-799', floorZone: 'First Floor - Arts & Music Room', capacity: 140, createdAt: Date.now() },
  { id: 'sh_09', code: 'SH-E1', name: 'Shelf E-01 (Literature & Sinhala/Tamil/English Novels)', categoryDdc: '800-899', floorZone: 'Ground Floor - Fiction Corner', capacity: 300, createdAt: Date.now() },
  { id: 'sh_10', code: 'SH-E2', name: 'Shelf E-02 (History, Geography & Biography)', categoryDdc: '900-999', floorZone: 'Ground Floor - Reference Hall', capacity: 250, createdAt: Date.now() },
];

export class ShelfService {
  static getShelves(): LibraryShelf[] {
    try {
      const data = localStorage.getItem(SHELVES_STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    this.saveShelves(DEFAULT_SHELVES);
    return DEFAULT_SHELVES;
  }

  static saveShelves(shelves: LibraryShelf[]) {
    try {
      localStorage.setItem(SHELVES_STORAGE_KEY, JSON.stringify(shelves));
    } catch {
      // ignore
    }
  }

  static addShelf(shelf: Omit<LibraryShelf, 'id' | 'createdAt'>): LibraryShelf {
    const shelves = this.getShelves();
    const newShelf: LibraryShelf = {
      ...shelf,
      id: `sh_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      createdAt: Date.now(),
    };
    const updated = [newShelf, ...shelves];
    this.saveShelves(updated);
    return newShelf;
  }

  static deleteShelf(id: string) {
    const shelves = this.getShelves();
    const updated = shelves.filter((s) => s.id !== id);
    this.saveShelves(updated);
  }

  /**
   * Helper to automatically assign all 100 books to matching shelves
   */
  static autoPopulateBooksToShelves() {
    const copies = CatalogRepository.getLocalCopies();
    const books = CatalogRepository.getLocalBooks();
    const shelves = this.getShelves();

    if (copies.length === 0 || shelves.length === 0) return;

    // Helper map of category or index to shelf
    copies.forEach((copy, idx) => {
      const book = books.find((b) => b.id === copy.bookId);
      const cat = book?.categoryId || '';

      let targetShelf = shelves[idx % shelves.length]!;

      // Accurate thematic mapping
      if (cat.includes('sin-lit') || cat.includes('tam-lit') || cat.includes('eng-lit') || cat.includes('fiction')) {
        targetShelf = shelves.find((s) => s.code === 'SH-E1') || targetShelf;
      } else if (cat.includes('hist') || cat.includes('geo') || cat.includes('bio')) {
        targetShelf = shelves.find((s) => s.code === 'SH-E2') || targetShelf;
      } else if (cat.includes('sci') || cat.includes('math')) {
        targetShelf = shelves.find((s) => s.code === 'SH-C2') || targetShelf;
      } else if (cat.includes('tech') || cat.includes('applied') || cat.includes('eng')) {
        targetShelf = shelves.find((s) => s.code === 'SH-D1') || targetShelf;
      } else if (cat.includes('relig') || cat.includes('buddh')) {
        targetShelf = shelves.find((s) => s.code === 'SH-B1') || targetShelf;
      } else if (cat.includes('soc') || cat.includes('law')) {
        targetShelf = shelves.find((s) => s.code === 'SH-B2') || targetShelf;
      } else if (cat.includes('lang')) {
        targetShelf = shelves.find((s) => s.code === 'SH-C1') || targetShelf;
      } else if (cat.includes('arts') || cat.includes('music')) {
        targetShelf = shelves.find((s) => s.code === 'SH-D2') || targetShelf;
      } else if (cat.includes('comp') || cat.includes('gen')) {
        targetShelf = shelves.find((s) => s.code === 'SH-A1') || targetShelf;
      } else if (cat.includes('phil') || cat.includes('psych')) {
        targetShelf = shelves.find((s) => s.code === 'SH-A2') || targetShelf;
      }

      copy.location = `[${targetShelf.code}] ${targetShelf.name}`;
      copy.updatedAt = Date.now();
    });

    CatalogRepository.saveLocalCopies(copies);
  }
}
