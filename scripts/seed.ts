import { doc, setDoc } from 'firebase/firestore';
import { db } from '../src/services/firebase/config';
import { CatalogRepository } from '../src/services/repositories/CatalogRepository';

/**
 * Comprehensive Dev/Staging Database Seed Script
 * Generates Sri Lankan National Branches, Categories, Authors, and Realistic Multilingual Books.
 */
export async function seedLibraryDatabase() {
  console.info('Starting LibraryOS Database Seed...');

  // 1. Seed Branches
  const branches = [
    {
      id: 'branch-colombo-hq',
      name: 'Colombo Central Public Library (HQ)',
      code: 'COL-01',
      address: 'Sir Marcus Fernando Mawatha, Colombo 07',
      district: 'Colombo',
      phone: '+94 11 269 3152',
      email: 'central@library.colombo.gov.lk',
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: 'branch-kandy',
      name: 'Kandy Municipal Public Library',
      code: 'KDY-01',
      address: 'D.S. Senanayake Veediya, Kandy',
      district: 'Kandy',
      phone: '+94 81 222 3456',
      email: 'info@kandylibrary.gov.lk',
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  ];

  for (const b of branches) {
    await setDoc(doc(db, 'branches', b.id), b);
  }
  console.info(`Seeded ${branches.length} branches.`);

  // 2. Seed Realistic Multilingual Books and Barcode Copies
  const sampleBooks = [
    {
      title: 'Madol Doova (මාදොල් දූව)',
      authorNames: ['Martin Wickramasinghe (මාර්ටින් වික්‍රමසිංහ)'],
      categoryName: 'Sinhala Classic Literature',
      isbn13: '978-955-020-101-2',
      language: 'si' as const,
      format: 'PRINT' as const,
      copies: ['BC-COL-1001', 'BC-COL-1002'],
    },
    {
      title: 'The Village in the Jungle',
      authorNames: ['Leonard Woolf'],
      categoryName: 'Colonial Fiction & History',
      isbn13: '978-955-020-102-9',
      language: 'en' as const,
      format: 'PRINT' as const,
      copies: ['BC-COL-1003', 'BC-COL-1004'],
    },
    {
      title: 'Ponnar Sankar (பொன்னர் சங்கர்)',
      authorNames: ['M. Karunanidhi'],
      categoryName: 'Tamil Historical Literature',
      isbn13: '978-955-020-103-6',
      language: 'ta' as const,
      format: 'PRINT' as const,
      copies: ['BC-COL-1005'],
    },
    {
      title: 'A History of Sri Lanka (Comprehensive Edition)',
      authorNames: ['K. M. de Silva'],
      categoryName: 'National History 954',
      isbn13: '978-955-020-104-3',
      language: 'en' as const,
      format: 'REFERENCE' as const,
      copies: ['BC-COL-1006'],
    },
  ];

  for (const b of sampleBooks) {
    const bookId = await CatalogRepository.saveBook({
      title: b.title,
      authorIds: ['author-seed'],
      authorNames: b.authorNames,
      categoryId: 'cat-general',
      categoryName: b.categoryName,
      isbn13: b.isbn13,
      language: b.language,
      format: b.format,
      audience: 'ADULT',
      totalCopies: 0,
      availableCopies: 0,
      tags: [b.categoryName],
      searchTokens: [],
    });

    for (const barcode of b.copies) {
      await CatalogRepository.addCopy({
        bookId,
        barcode,
        branchId: 'branch-colombo-hq',
        status: 'AVAILABLE',
        callNumber: '823.91 SRI',
        acquisitionDate: Date.now(),
      });
    }
  }

  console.info(`Seeded ${sampleBooks.length} titles with associated physical barcode copies.`);
  console.info('Database Seed Completed Successfully.');
}
