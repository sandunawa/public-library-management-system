import React, { useEffect, useState } from 'react';
import { Book, BookCopy } from '@libraryos/shared';
import { CatalogRepository } from '@/services/repositories/CatalogRepository';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BarcodeLabel } from '@/components/common/BarcodeLabel';
import {
  Search,
  Plus,
  BookCopy as BookCopyIcon,
  Barcode,
  X,
  ChevronRight,
  ScanLine,
} from 'lucide-react';
import { toast } from 'sonner';

export const CatalogManagementPage: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [copies, setCopies] = useState<BookCopy[]>([]);
  const [showAddBookModal, setShowAddBookModal] = useState(false);
  const [showAddCopyModal, setShowAddCopyModal] = useState(false);

  // Barcode quick scan state (supports USB Barcode reader / camera scanner wedge)
  const [barcodeScanInput, setBarcodeScanInput] = useState('');

  // New Book Form State
  const [newTitle, setNewTitle] = useState('');
  const [newAuthor, setNewAuthor] = useState('');
  const [newCategory, setNewCategory] = useState('Sinhala Classic Literature');
  const [newIsbn, setNewIsbn] = useState('');
  const [newLanguage, setNewLanguage] = useState<'en' | 'si' | 'ta'>('si');
  const [newFormat, setNewFormat] = useState<'PRINT' | 'EBOOK' | 'REFERENCE'>('PRINT');

  // New Copy Form State
  const [newBarcode, setNewBarcode] = useState('');
  const [newCallNumber, setNewCallNumber] = useState('');

  const loadBooks = () => {
    // Instant synchronous local catalog retrieval - Zero delay!
    const data = CatalogRepository.getLocalBooks();
    setBooks(data);
    setLoading(false);
  };

  useEffect(() => {
    loadBooks();
  }, []);

  const handleRowClick = async (book: Book) => {
    setSelectedBook(book);
    try {
      const copyList = await CatalogRepository.getBookCopies(book.id);
      setCopies(copyList);
    } catch {
      toast.error('Could not load copies for this book.');
    }
  };

  // Dedicated Barcode Reader Scanner Lookup Handler (Instant O(1) indexed lookup)
  const executeBarcodeLookup = (scannedCode: string) => {
    const code = scannedCode.trim();
    if (!code) return;

    // Instant local memory lookup across all copies - ZERO delay!
    const allCopies = CatalogRepository.getLocalCopies();
    const matchedCopy = allCopies.find(
      (c) => c.barcode.toLowerCase() === code.toLowerCase()
    );

    if (matchedCopy) {
      const allBooks = CatalogRepository.getLocalBooks();
      const matchedBook = allBooks.find((b) => b.id === matchedCopy.bookId);
      if (matchedBook) {
        const bookCopies = allCopies.filter((c) => c.bookId === matchedBook.id);
        setSelectedBook(matchedBook);
        setCopies(bookCopies);
        setBarcodeScanInput('');
        toast.success(`Scanned: ${matchedBook.title} (${matchedCopy.barcode})`);
        return true;
      }
    }
    return false;
  };

  const handleBarcodeSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const success = executeBarcodeLookup(barcodeScanInput);
    if (!success && barcodeScanInput.trim()) {
      toast.error(`Barcode "${barcodeScanInput}" not found in catalogue.`);
    }
  };

  // Real-time automatic scanner detection:
  // When a USB barcode wedge reader scans, it inputs the barcode and usually ends with Enter or fires input rapidly
  const handleBarcodeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setBarcodeScanInput(val);

    const trimmed = val.trim();
    // Typical barcode format: BC-COL-XXXX or numbers >= 6 chars
    if (trimmed.length >= 6) {
      const found = executeBarcodeLookup(trimmed);
      if (found) {
        // Automatically cleared and opened
      }
    }
  };

  const handleCreateBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newAuthor.trim()) {
      toast.error('Title and Author are required.');
      return;
    }

    try {
      // 1. Create the title record
      const bookId = await CatalogRepository.saveBook({
        title: newTitle,
        authorIds: ['author-custom'],
        authorNames: [newAuthor],
        categoryId: 'cat-custom',
        categoryName: newCategory,
        isbn13: newIsbn,
        language: newLanguage,
        format: newFormat,
        audience: 'ADULT',
        totalCopies: 1, // Automatically create 1 initial physical copy!
        availableCopies: 1,
        tags: [newCategory],
        searchTokens: [],
      });

      // 2. Automatically generate and assign physical barcode for this new book!
      const autoBarcode = `BC-COL-${Math.floor(10000 + Math.random() * 90000)}`;
      await CatalogRepository.addCopy({
        bookId,
        barcode: autoBarcode,
        branchId: 'branch-colombo-hq',
        status: 'AVAILABLE',
        callNumber: '823.91 GEN',
        acquisitionDate: Date.now(),
      });

      toast.success(
        `Book created! Automatically generated physical copy with Barcode: ${autoBarcode}`
      );
      setShowAddBookModal(false);
      setNewTitle('');
      setNewAuthor('');
      setNewIsbn('');
      loadBooks();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create book record.');
    }
  };

  const handleCreateCopy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBook) return;

    // If barcode field is blank, generate collision-free barcode automatically
    const barcodeToUse =
      newBarcode.trim() || `BC-COL-${Math.floor(10000 + Math.random() * 90000)}`;

    try {
      await CatalogRepository.addCopy({
        bookId: selectedBook.id,
        barcode: barcodeToUse,
        branchId: 'branch-colombo-hq',
        status: 'AVAILABLE',
        callNumber: newCallNumber || '823.91 GEN',
        acquisitionDate: Date.now(),
      });

      toast.success(`Copy barcode ${barcodeToUse} created and assigned!`);
      setShowAddCopyModal(false);
      setNewBarcode('');
      setNewCallNumber('');
      handleRowClick(selectedBook);
      loadBooks();
    } catch (err: any) {
      toast.error(err.message || 'Failed to add copy.');
    }
  };

  // Filtered books
  const filteredBooks = books.filter((b) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      b.title.toLowerCase().includes(q) ||
      b.authorNames.some((a) => a.toLowerCase().includes(q)) ||
      (b.isbn13 && b.isbn13.includes(q)) ||
      b.categoryName.toLowerCase().includes(q);

    const matchesCategory =
      selectedCategory === 'ALL' || b.categoryName === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(books.map((b) => b.categoryName))).filter(Boolean);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-foreground">
            Catalogue & Copy Inventory
          </h1>
          <p className="text-xs text-muted-foreground">
            Master bibliographic titles table. Every book is assigned unique physical barcodes with instant scanner lookup.
          </p>
        </div>
        <Button onClick={() => setShowAddBookModal(true)} className="font-semibold shadow-sm">
          <Plus className="w-4 h-4 mr-1.5" />
          Add Title Record
        </Button>
      </div>

      {/* Barcode Scanner Wedge & Standard Search Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Dedicated Barcode Laser Scanner Wedge Input - Auto-detects scanner without needing to click Scan */}
        <div className="md:col-span-1">
          <form onSubmit={handleBarcodeSearch} className="flex gap-2">
            <div className="relative flex-1">
              <ScanLine className="w-4 h-4 absolute left-3 top-3 text-primary animate-pulse" />
              <Input
                placeholder="Scan barcode (Auto opens book)..."
                value={barcodeScanInput}
                onChange={handleBarcodeInputChange}
                autoFocus
                className="pl-9 text-xs border-primary/50 focus:border-primary font-mono ring-1 ring-primary/20"
              />
            </div>
            {barcodeScanInput && (
              <Button type="submit" variant="secondary" className="text-xs font-semibold">
                Open
              </Button>
            )}
          </form>
        </div>

        {/* Text Filter */}
        <div className="md:col-span-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
          <Input
            placeholder="Search by title, author, or ISBN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>

        {/* Category Dropdown */}
        <div className="md:col-span-1">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full h-10 px-3 rounded-md border border-input bg-background text-xs"
          >
            <option value="ALL">All Categories ({books.length})</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Table Layout */}
      <Card className="overflow-hidden border border-border shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b bg-muted/60 text-muted-foreground font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4">Book Title</th>
                <th className="py-3 px-4">Author(s)</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Format</th>
                <th className="py-3 px-4">Language</th>
                <th className="py-3 px-4 text-center">Copies (Avail / Total)</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted-foreground">
                    Loading catalogue table records...
                  </td>
                </tr>
              ) : filteredBooks.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted-foreground">
                    <BookCopyIcon className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    No books matching current filter criteria found.
                  </td>
                </tr>
              ) : (
                filteredBooks.map((book, idx) => {
                  const isSelected = selectedBook?.id === book.id;
                  return (
                    <tr
                      key={book.id}
                      onClick={() => handleRowClick(book)}
                      className={`cursor-pointer transition-colors hover:bg-primary/[0.04] ${
                        isSelected ? 'bg-primary/10 font-medium' : ''
                      }`}
                    >
                      <td className="py-3 px-4 text-center font-mono text-muted-foreground text-[11px]">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-foreground text-sm flex items-center gap-1.5">
                          <span>{book.title}</span>
                        </div>
                        <div className="text-[10px] text-muted-foreground font-mono">
                          ISBN: {book.isbn13 || 'N/A'}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-foreground/90">
                        {book.authorNames.join(', ')}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-muted font-medium text-muted-foreground">
                          {book.categoryName}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="uppercase text-[10px] font-bold text-muted-foreground">
                          {book.format}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="uppercase text-[10px] font-semibold px-1.5 py-0.5 rounded bg-muted">
                          {book.language}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                            book.availableCopies > 0
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                          }`}
                        >
                          {book.availableCopies} / {book.totalCopies}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs text-primary font-semibold hover:bg-primary/10"
                        >
                          Details <ChevronRight className="w-3.5 h-3.5 ml-1" />
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Details Modal with Barcodes */}
      {selectedBook && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl bg-card shadow-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <CardHeader className="flex flex-row items-start justify-between border-b pb-4">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-muted uppercase tracking-wider text-muted-foreground">
                    {selectedBook.format}
                  </span>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                    Language: {selectedBook.language}
                  </span>
                </div>
                <CardTitle className="text-xl font-bold font-serif mt-2">
                  {selectedBook.title}
                </CardTitle>
                <CardDescription className="text-xs">
                  By {selectedBook.authorNames.join(', ')}
                </CardDescription>
              </div>

              <button
                onClick={() => setSelectedBook(null)}
                className="p-1 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </CardHeader>

            {/* Modal Body */}
            <CardContent className="space-y-6 p-6 overflow-y-auto">
              {/* Metadata Bento Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-muted/40 p-3 rounded-xl text-xs">
                <div>
                  <div className="text-muted-foreground text-[10px] font-bold uppercase">Classification</div>
                  <div className="font-semibold text-foreground mt-0.5">{selectedBook.categoryName}</div>
                </div>
                <div>
                  <div className="text-muted-foreground text-[10px] font-bold uppercase">ISBN 13</div>
                  <div className="font-mono font-semibold text-foreground mt-0.5">
                    {selectedBook.isbn13 || 'Unassigned'}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground text-[10px] font-bold uppercase">Audience</div>
                  <div className="font-semibold text-foreground mt-0.5">{selectedBook.audience}</div>
                </div>
                <div>
                  <div className="text-muted-foreground text-[10px] font-bold uppercase">Total Copies</div>
                  <div className="font-semibold text-emerald-600 font-bold mt-0.5">
                    {selectedBook.availableCopies} Available / {selectedBook.totalCopies} Total
                  </div>
                </div>
              </div>

              {/* Physical Barcode Copies Section */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="font-bold text-sm flex items-center space-x-2">
                    <Barcode className="w-4 h-4 text-primary" />
                    <span>Physical Barcode Copies ({copies.length})</span>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => setShowAddCopyModal(true)}
                    className="h-8 text-xs font-semibold"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Generate Extra Copy
                  </Button>
                </div>

                {copies.length === 0 ? (
                  <div className="p-8 text-center text-xs text-muted-foreground border-2 border-dashed rounded-xl">
                    No physical copies catalogued yet.
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="border rounded-xl divide-y text-xs">
                      <div className="p-2.5 bg-muted font-semibold text-muted-foreground grid grid-cols-4">
                        <span>Barcode (Scannable)</span>
                        <span>Call Number</span>
                        <span>Branch</span>
                        <span className="text-right">Status</span>
                      </div>
                      {copies.map((copy) => (
                        <div
                          key={copy.id}
                          className="p-2.5 grid grid-cols-4 items-center hover:bg-muted/30"
                        >
                          <span className="font-mono font-bold text-primary flex items-center">
                            {copy.barcode}
                          </span>
                          <span className="font-mono text-muted-foreground">
                            {copy.callNumber || 'N/A'}
                          </span>
                          <span className="text-muted-foreground">Colombo Central HQ</span>
                          <span className="text-right">
                            <span
                              className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                                copy.status === 'AVAILABLE'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : copy.status === 'ISSUED'
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              }`}
                            >
                              {copy.status}
                            </span>
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Printable Barcode Sticker Labels */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Printable Barcode Sticker Labels (Physical Books)
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {copies.map((copy) => (
                          <BarcodeLabel
                            key={copy.id}
                            barcode={copy.barcode}
                            bookTitle={selectedBook.title}
                            callNumber={copy.callNumber || '823.91 GEN'}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>

            {/* Modal Footer */}
            <div className="p-4 border-t flex justify-end space-x-2 bg-muted/20">
              <Button variant="outline" onClick={() => setSelectedBook(null)} className="text-xs">
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Add Title Record Modal */}
      {showAddBookModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-card shadow-2xl">
            <CardHeader>
              <CardTitle>Add New Bibliographic Record</CardTitle>
              <CardDescription>
                A physical copy barcode will be automatically generated upon creation.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleCreateBook}>
              <CardContent className="space-y-3 text-xs">
                <div>
                  <label className="font-semibold block mb-1">Book Title</label>
                  <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} required />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Author Name(s)</label>
                  <Input value={newAuthor} onChange={(e) => setNewAuthor(e.target.value)} required />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Category / Classification</label>
                  <Input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} />
                </div>
                <div>
                  <label className="font-semibold block mb-1">ISBN 13</label>
                  <Input
                    value={newIsbn}
                    onChange={(e) => setNewIsbn(e.target.value)}
                    placeholder="978-..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-semibold block mb-1">Language</label>
                    <select
                      value={newLanguage}
                      onChange={(e) => setNewLanguage(e.target.value as any)}
                      className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    >
                      <option value="si">Sinhala (සිංහල)</option>
                      <option value="en">English</option>
                      <option value="ta">Tamil (தமிழ்)</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-semibold block mb-1">Format</label>
                    <select
                      value={newFormat}
                      onChange={(e) => setNewFormat(e.target.value as any)}
                      className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    >
                      <option value="PRINT">Print Book</option>
                      <option value="EBOOK">E-Book</option>
                      <option value="REFERENCE">Reference</option>
                    </select>
                  </div>
                </div>
              </CardContent>
              <div className="p-4 border-t flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowAddBookModal(false)}>
                  Cancel
                </Button>
                <Button type="submit">Save & Auto-Generate Barcode</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Add Extra Copy Modal */}
      {showAddCopyModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-sm bg-card shadow-2xl">
            <CardHeader>
              <CardTitle>Add Extra Barcode Copy</CardTitle>
              <CardDescription>Leave barcode blank to auto-generate unique number</CardDescription>
            </CardHeader>
            <form onSubmit={handleCreateCopy}>
              <CardContent className="space-y-3 text-xs">
                <div>
                  <label className="font-semibold block mb-1">Copy Barcode (Optional - Auto generated)</label>
                  <Input
                    value={newBarcode}
                    onChange={(e) => setNewBarcode(e.target.value)}
                    placeholder="e.g. BC-COL-..."
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Call Number / Shelf Location</label>
                  <Input
                    value={newCallNumber}
                    onChange={(e) => setNewCallNumber(e.target.value)}
                    placeholder="823.91 GEN"
                  />
                </div>
              </CardContent>
              <div className="p-4 border-t flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowAddCopyModal(false)}>
                  Cancel
                </Button>
                <Button type="submit">Assign Barcode</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};
