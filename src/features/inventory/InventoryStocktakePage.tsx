import React, { useState, useMemo, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ClipboardCheck,
  Library,
  Layers,
  MapPin,
  X,
  Trash2,
  Search,
  ScanLine,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  PlusCircle,
  Eye,
  RotateCcw,
  BookMarked,
  SlidersHorizontal,
  BookmarkCheck,
} from 'lucide-react';
import { CirculationRepository } from '@/services/repositories/CirculationRepository';
import { CatalogRepository } from '@/services/repositories/CatalogRepository';
import { ShelfService, LibraryShelf } from '@/services/inventory/ShelfService';
import { BookCopy, Book } from '@libraryos/shared';
import { toast } from 'sonner';

interface StagedShelfItem {
  barcode: string;
  bookTitle: string;
  copyId: string;
  currentShelf?: string;
}

export const InventoryStocktakePage: React.FC = () => {
  // Main Navigation: 2 Primary Parts as requested
  const [activeView, setActiveView] = useState<'ASSIGN_SHELF' | 'SHELF_DIRECTORY'>('ASSIGN_SHELF');

  const [shelves, setShelves] = useState<LibraryShelf[]>(() => ShelfService.getShelves());
  const [selectedShelfId, setSelectedShelfId] = useState<string>(() => shelves[0]?.id || '');

  // Part 1: Batch Shelf Assignment State
  const [barcodeInput, setBarcodeInput] = useState('');
  const [stagedBatchItems, setStagedBatchItems] = useState<StagedShelfItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Part 2: Shelf Inventory Directory Filter
  const [directorySearch, setDirectorySearch] = useState('');
  const [directoryShelfFilter, setDirectoryShelfFilter] = useState<string>('ALL');

  // New Shelf Modal state
  const [isAddShelfOpen, setIsAddShelfOpen] = useState(false);
  const [newShelfCode, setNewShelfCode] = useState('');
  const [newShelfName, setNewShelfName] = useState('');
  const [newShelfCategory, setNewShelfCategory] = useState('');
  const [newShelfZone, setNewShelfZone] = useState('');
  const [newShelfCapacity, setNewShelfCapacity] = useState<number>(200);

  const barcodeInputRef = useRef<HTMLInputElement | null>(null);

  // Auto-seed books to shelves if none are assigned yet
  React.useEffect(() => {
    const copies = CatalogRepository.getLocalCopies();
    const hasAnyShelf = copies.some((c) => c.location && c.location.includes('[SH-'));
    if (!hasAnyShelf) {
      ShelfService.autoPopulateBooksToShelves();
    }
  }, []);

  const handleAutoPopulateShelves = () => {
    ShelfService.autoPopulateBooksToShelves();
    toast.success('Successfully distributed all 100 library books across matching classification shelves!');
    // trigger re-render
    setShelves(ShelfService.getShelves());
  };
  const targetShelf = useMemo(() => {
    return shelves.find((s) => s.id === selectedShelfId) || shelves[0];
  }, [shelves, selectedShelfId]);

  // All copies and books for inventory mapping
  const allCopies = useMemo(() => CatalogRepository.getLocalCopies(), [stagedBatchItems, activeView]);
  const allBooks = useMemo(() => CatalogRepository.getLocalBooks(), []);

  // Map book titles to copies
  const bookTitleMap = useMemo(() => {
    const map = new Map<string, string>();
    allBooks.forEach((b) => map.set(b.id, b.title));
    return map;
  }, [allBooks]);

  // Part 1: Read/Scan Barcode into Batch Queue
  const handleScanBarcodeToQueue = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = barcodeInput.trim();
    if (!code) return;

    if (!targetShelf) {
      toast.error('Please select or create a destination shelf first.');
      return;
    }

    // Check if barcode is already staged in current queue
    if (stagedBatchItems.some((item) => item.barcode.toLowerCase() === code.toLowerCase())) {
      toast.warning(`Barcode ${code} is already in the batch queue.`);
      setBarcodeInput('');
      barcodeInputRef.current?.focus();
      return;
    }

    setIsProcessing(true);
    try {
      const copy = await CirculationRepository.findCopyByBarcode(code);
      if (!copy) {
        toast.error(`Book Copy Barcode '${code}' not found in library inventory!`);
      } else {
        const title = bookTitleMap.get(copy.bookId) || `Copy ${code}`;
        setStagedBatchItems((prev) => [
          {
            barcode: copy.barcode,
            bookTitle: title,
            copyId: copy.id,
            currentShelf: copy.location || 'Unassigned / Storage',
          },
          ...prev,
        ]);
        toast.success(`Scanned: "${title}" (${code}) added to queue.`);
      }
      setBarcodeInput('');
      barcodeInputRef.current?.focus();
    } catch {
      toast.error('Scan error.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Remove single item from batch queue
  const handleRemoveFromQueue = (index: number) => {
    setStagedBatchItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Commit and Assign All Scanned Books to the Target Shelf
  const handleCommitBatchAssignment = () => {
    if (!targetShelf) return;
    if (stagedBatchItems.length === 0) {
      toast.warning('Please scan at least one book barcode into the queue.');
      return;
    }

    const currentCopies = CatalogRepository.getLocalCopies();
    const targetShelfName = `${targetShelf.code ? `[${targetShelf.code}] ` : ''}${targetShelf.name}`;

    let updatedCount = 0;
    stagedBatchItems.forEach((staged) => {
      const match = currentCopies.find((c) => c.barcode.toLowerCase() === staged.barcode.toLowerCase());
      if (match) {
        match.location = targetShelfName;
        match.updatedAt = Date.now();
        updatedCount++;
      }
    });

    CatalogRepository.saveLocalCopies(currentCopies);
    toast.success(`Successfully assigned ${updatedCount} books to "${targetShelf.name}"!`);
    setStagedBatchItems([]);
    barcodeInputRef.current?.focus();
  };

  // Create New Shelf
  const handleCreateShelf = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShelfName.trim()) {
      toast.error('Please enter a Shelf Name.');
      return;
    }

    const created = ShelfService.addShelf({
      code: newShelfCode.trim() || `SH-${Math.floor(100 + Math.random() * 900)}`,
      name: newShelfName.trim(),
      categoryDdc: newShelfCategory.trim() || 'General Collection',
      floorZone: newShelfZone.trim() || 'Main Library Hall',
      capacity: newShelfCapacity || 200,
    });

    const updatedShelves = ShelfService.getShelves();
    setShelves(updatedShelves);
    setSelectedShelfId(created.id);
    setIsAddShelfOpen(false);

    setNewShelfCode('');
    setNewShelfName('');
    setNewShelfCategory('');
    setNewShelfZone('');
    setNewShelfCapacity(200);

    toast.success(`New Shelf "${created.name}" created and ready for book assignment!`);
  };

  // Part 2: Filtered Books for Shelf Explorer Table
  const filteredShelfBooks = useMemo(() => {
    let list = allCopies.map((copy) => ({
      ...copy,
      title: bookTitleMap.get(copy.bookId) || `Copy ${copy.barcode}`,
      shelf: copy.location || 'Unassigned / Central Stack',
    }));

    // Filter by specific shelf dropdown if not ALL
    if (directoryShelfFilter !== 'ALL') {
      const selectedShelf = shelves.find((s) => s.id === directoryShelfFilter);
      if (selectedShelf) {
        const shelfCode = selectedShelf.code?.toLowerCase();
        const shelfName = selectedShelf.name.toLowerCase();
        list = list.filter((item) => {
          const loc = item.shelf.toLowerCase();
          return (shelfCode && loc.includes(shelfCode)) || loc.includes(shelfName);
        });
      }
    }

    // Filter by search query (Barcode, title, call number)
    const raw = directorySearch.trim().toLowerCase();
    if (!raw) return list;

    const clean = raw.replace(/[^a-z0-9]/g, '');

    return list.filter((item) => {
      const titleMatch = item.title.toLowerCase().includes(raw);
      const bCodeClean = item.barcode.toLowerCase().replace(/[^a-z0-9]/g, '');
      const callMatch = item.callNumber?.toLowerCase().includes(raw);
      const shelfMatch = item.shelf.toLowerCase().includes(raw);

      return titleMatch || bCodeClean.includes(clean) || callMatch || shelfMatch;
    });
  }, [allCopies, bookTitleMap, shelves, directoryShelfFilter, directorySearch]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground flex items-center gap-2">
            <ClipboardCheck className="w-6 h-6 text-primary" />
            <span>Stocktake & Shelf Management (රාක්ක සහ තොග කළමනාකරණය)</span>
          </h1>
          <p className="text-xs text-muted-foreground">
            Batch assign books to physical shelves by scanning barcodes & explore shelf inventory in organized tables
          </p>
        </div>

        {/* 2 Main Primary Navigation Modes */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleAutoPopulateShelves}
            className="text-xs font-semibold gap-1.5 border-primary/40 text-primary hover:bg-primary/5"
            title="Auto organize and distribute all 100 books to matching classification shelves"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Distribute Books to Shelves (පොත් රාක්කගත කරන්න)
          </Button>

          <Button
            size="sm"
            onClick={() => setIsAddShelfOpen(true)}
            className="text-xs font-bold gap-1.5 bg-primary text-primary-foreground shadow"
          >
            <PlusCircle className="w-4 h-4" />
            + New Shelf (අලුත් රාක්කයක්)
          </Button>

          <div className="flex bg-muted p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveView('ASSIGN_SHELF')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeView === 'ASSIGN_SHELF'
                  ? 'bg-primary text-primary-foreground shadow'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <ScanLine className="w-3.5 h-3.5" />
              1. Batch Shelf Assignment (රාක්කගත කිරීම)
            </button>
            <button
              type="button"
              onClick={() => setActiveView('SHELF_DIRECTORY')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeView === 'SHELF_DIRECTORY'
                  ? 'bg-primary text-primary-foreground shadow'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              2. Shelf Inventory Explorer (රාක්ක ලැයිස්තුව)
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          PART 1: BATCH SHELF ASSIGNMENT (පොත් එකවර රාක්කගත කිරීම)
         ========================================================================= */}
      {activeView === 'ASSIGN_SHELF' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column: Target Shelf Selector & Continuous Barcode Scanner */}
          <Card className="md:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center space-x-2">
                  <Library className="w-4 h-4 text-primary" />
                  <span>Destination Shelf (යොමුකරන රාක්කය)</span>
                </span>
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary">
                  {shelves.length} Shelves
                </span>
              </CardTitle>
              <CardDescription className="text-xs">
                Select target shelf and consecutively scan multiple book barcodes
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 text-xs">
              {/* Shelf Selector Dropdown */}
              <div className="space-y-1.5">
                <label className="font-semibold block text-foreground">
                  Target Shelf (පොත් තැන්පත් කරන රාක්කය තෝරන්න):
                </label>
                <select
                  value={selectedShelfId}
                  onChange={(e) => setSelectedShelfId(e.target.value)}
                  className="w-full border rounded-lg p-2.5 bg-background font-sans text-xs focus:ring-1 focus:ring-primary border-primary/40 font-semibold"
                >
                  {shelves.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code ? `[${s.code}] ` : ''}{s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Target Shelf Meta Preview */}
              {targetShelf && (
                <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 space-y-1.5 text-xs">
                  <div className="font-bold text-sm text-foreground flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-primary shrink-0" />
                    {targetShelf.name}
                  </div>
                  {targetShelf.categoryDdc && (
                    <div className="text-muted-foreground font-mono">
                      Category/DDC: <strong className="text-foreground">{targetShelf.categoryDdc}</strong>
                    </div>
                  )}
                  {targetShelf.floorZone && (
                    <div className="text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-warning" />
                      Location: {targetShelf.floorZone}
                    </div>
                  )}
                  <div className="text-muted-foreground">
                    Shelf Capacity: <strong>{targetShelf.capacity || 200}</strong> Books Max
                  </div>
                </div>
              )}

              {/* Continuous Barcode Input */}
              <form onSubmit={handleScanBarcodeToQueue} className="space-y-3 pt-2 border-t">
                <label className="font-semibold block text-foreground">
                  Scan Multiple Book Barcodes (පොත් Barcodes scan කරන්න):
                </label>
                <div className="relative">
                  <ScanLine className="w-4 h-4 text-primary absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    ref={barcodeInputRef}
                    autoFocus
                    placeholder="Scan book barcode to add to queue..."
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    className="pl-9 font-mono text-xs border-primary/50 focus:border-primary ring-1 ring-primary/20"
                  />
                </div>
                <Button type="submit" disabled={isProcessing} className="w-full font-bold text-xs gap-1">
                  Add to Batch Queue (පෝලිමට එක් කරන්න)
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Right Column: Scanned Books Batch Queue */}
          <Card className="md:col-span-2">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <BookMarked className="w-4 h-4 text-primary" />
                  <span>Books Ready to Assign ({stagedBatchItems.length} Scanned)</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Scan all book copies one by one, then click "Confirm & Move to Shelf" below
                </CardDescription>
              </div>

              {stagedBatchItems.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setStagedBatchItems([])}
                  className="text-xs text-muted-foreground"
                >
                  Clear Queue
                </Button>
              )}
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="border rounded-xl divide-y text-xs max-h-[420px] overflow-y-auto">
                <div className="p-3 bg-muted font-semibold text-muted-foreground flex justify-between uppercase tracking-wider text-xs sticky top-0 z-10">
                  <span>Book Title & Barcode</span>
                  <span>Previous Location / Action</span>
                </div>

                {stagedBatchItems.length === 0 ? (
                  <div className="p-12 text-center text-muted-foreground space-y-1">
                    <ScanLine className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                    <div className="font-semibold text-sm">No books scanned into queue yet.</div>
                    <div className="text-xs">
                      Select the destination shelf on the left, then scan physical book barcodes consecutively.
                    </div>
                  </div>
                ) : (
                  stagedBatchItems.map((item, idx) => (
                    <div key={idx} className="p-3 flex justify-between items-center hover:bg-muted/30">
                      <div className="flex items-center space-x-3">
                        <BookOpen className="w-4 h-4 text-primary shrink-0" />
                        <div>
                          <div className="font-semibold text-sm text-foreground">{item.bookTitle}</div>
                          <div className="text-muted-foreground font-mono text-xs">
                            Barcode: <span className="font-bold text-foreground">{item.barcode}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded font-mono">
                          Was: {item.currentShelf}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveFromQueue(idx)}
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Bottom Commit Action Button */}
              {stagedBatchItems.length > 0 && (
                <div className="p-4 rounded-xl bg-success-soft border border-success/30 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-xs text-success dark:text-success">
                    Ready to move <strong>{stagedBatchItems.length}</strong> book(s) to{' '}
                    <strong className="text-primary">{targetShelf?.name}</strong>.
                  </div>
                  <Button
                    size="default"
                    onClick={handleCommitBatchAssignment}
                    className="w-full sm:w-auto font-bold bg-success hover:bg-success/90 text-white shadow-md px-6 gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Confirm & Move All to Shelf ({stagedBatchItems.length} Books)
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* =========================================================================
          PART 2: SHELF INVENTORY EXPLORER (රාක්ක වල ඇති පොත් පිළිවෙළට බැලීම)
         ========================================================================= */}
      {activeView === 'SHELF_DIRECTORY' && (
        <Card>
          <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Layers className="w-5 h-5 text-primary" />
                <span>Physical Shelf Inventory Table (රාක්ක අනුව පොත් ලැයිස්තුව)</span>
              </CardTitle>
              <CardDescription className="text-xs">
                View, filter, and inspect which books are currently located on each shelf bay
              </CardDescription>
            </div>

            {/* Filter by Shelf Dropdown & Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  placeholder="Filter by barcode, title, DDC..."
                  value={directorySearch}
                  onChange={(e) => setDirectorySearch(e.target.value)}
                  className="pl-8 text-xs font-mono w-full sm:w-56"
                />
              </div>

              <select
                value={directoryShelfFilter}
                onChange={(e) => setDirectoryShelfFilter(e.target.value)}
                className="border rounded-lg p-2 bg-background font-sans text-xs focus:ring-1 focus:ring-primary border-primary/40 font-semibold"
              >
                <option value="ALL">All Shelves (සියලුම රාක්ක)</option>
                {shelves.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.code ? `[${s.code}] ` : ''}{s.name}
                  </option>
                ))}
              </select>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-muted/70 text-muted-foreground border-y font-semibold uppercase tracking-wider text-xs">
                    <th className="p-3">Physical Shelf Location (රාක්කය)</th>
                    <th className="p-3">Book Title (පොතේ නම)</th>
                    <th className="p-3">Copy Barcode (බාර්කෝඩ් අංකය)</th>
                    <th className="p-3">Call Number</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredShelfBooks.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-10 text-center text-muted-foreground">
                        No books found matching this shelf filter or search criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredShelfBooks.map((item, idx) => (
                      <tr key={idx} className="hover:bg-muted/30 transition-colors">
                        <td className="p-3">
                          <span className="font-bold text-foreground flex items-center gap-1.5 text-xs bg-warning-soft text-foreground dark:text-foreground border border-warning/30 px-2.5 py-1 rounded-lg inline-flex">
                            <MapPin className="w-3.5 h-3.5 text-warning shrink-0" />
                            {item.shelf}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="font-semibold text-foreground text-sm flex items-center gap-1.5">
                            <BookOpen className="w-3.5 h-3.5 text-primary shrink-0" />
                            {item.title}
                          </div>
                        </td>
                        <td className="p-3 font-mono font-bold text-foreground">
                          {item.barcode}
                        </td>
                        <td className="p-3 font-mono text-muted-foreground">
                          {item.callNumber || 'DDC-Standard'}
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2.5 py-0.5 rounded-full font-bold uppercase text-xs ${
                              item.status === 'AVAILABLE'
                                ? 'bg-success-soft text-success dark:bg-card dark:text-success'
                                : item.status === 'ISSUED'
                                ? 'bg-info-soft text-info-soft-foreground dark:bg-card dark:text-info'
                                : 'bg-warning-soft text-warning-soft-foreground dark:bg-card dark:text-warning'
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal: Create New Shelf */}
      {isAddShelfOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border-2 border-primary/30 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <form onSubmit={handleCreateShelf}>
              <div className="p-4 bg-muted/60 border-b flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Library className="w-5 h-5 text-primary" />
                  <h3 className="font-heading font-bold text-base text-foreground">
                    Create New Library Shelf (අලුත් රාක්කයක් එක් කරන්න)
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddShelfOpen(false)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">Shelf Code (කේතය):</label>
                    <Input
                      autoFocus
                      placeholder="e.g. SH-F01"
                      value={newShelfCode}
                      onChange={(e) => setNewShelfCode(e.target.value)}
                      className="font-mono text-xs uppercase"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">Capacity (ධාරිතාව):</label>
                    <Input
                      type="number"
                      min={10}
                      max={1000}
                      value={newShelfCapacity}
                      onChange={(e) => setNewShelfCapacity(parseInt(e.target.value) || 200)}
                      className="font-mono text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Shelf Name & Description (රාක්කයේ නම):</label>
                  <Input
                    required
                    placeholder="e.g. Shelf F-01 (Science Fiction & Novels)"
                    value={newShelfName}
                    onChange={(e) => setNewShelfName(e.target.value)}
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Dewey DDC / Classification Range:</label>
                  <Input
                    placeholder="e.g. 500-599 (Natural Sciences)"
                    value={newShelfCategory}
                    onChange={(e) => setNewShelfCategory(e.target.value)}
                    className="font-mono text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Floor / Section Zone (පිහිටි ස්ථානය):</label>
                  <Input
                    placeholder="e.g. Ground Floor - East Wing Bay 3"
                    value={newShelfZone}
                    onChange={(e) => setNewShelfZone(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="p-4 bg-muted/30 border-t flex justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsAddShelfOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="font-bold bg-primary text-primary-foreground shadow">
                  Save New Shelf (රාක්කය සුරකින්න)
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
