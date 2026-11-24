import React, { useState, useMemo, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertOctagon,
  Search,
  ScanLine,
  BookOpen,
  MapPin,
  RotateCcw,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  Layers,
  Sparkles,
} from 'lucide-react';
import { MissingBooksService, MissingBookRecord } from '@/services/inventory/MissingBooksService';
import { ShelfService, LibraryShelf } from '@/services/inventory/ShelfService';
import { toast } from 'sonner';

export const MissingBooksPage: React.FC = () => {
  const [missingBooks, setMissingBooks] = useState<MissingBookRecord[]>(() => MissingBooksService.getMissingBooks());
  const [shelves] = useState<LibraryShelf[]>(() => ShelfService.getShelves());
  const [recoveryBarcode, setRecoveryBarcode] = useState('');
  const [recoveryTargetShelf, setRecoveryTargetShelf] = useState(shelves[0]?.name || 'Main Hall');
  const [searchTerm, setSearchTerm] = useState('');

  const scanInputRef = useRef<HTMLInputElement | null>(null);

  const refreshList = () => {
    setMissingBooks(MissingBooksService.getMissingBooks());
  };

  // Recover found book by scanning its barcode
  const handleRecoverBook = (e: React.FormEvent) => {
    e.preventDefault();
    const code = recoveryBarcode.trim();
    if (!code) return;

    const res = MissingBooksService.recoverBookByBarcode(code, recoveryTargetShelf);
    if (res.success) {
      toast.success(res.message);
      setRecoveryBarcode('');
      refreshList();
    } else {
      toast.error(res.message);
    }
    scanInputRef.current?.focus();
  };

  // One-click recover from table
  const handleDirectRecover = (barcode: string) => {
    const res = MissingBooksService.recoverBookByBarcode(barcode, recoveryTargetShelf);
    if (res.success) {
      toast.success(res.message);
      refreshList();
    } else {
      toast.error(res.message);
    }
  };

  // Filter missing records
  const filteredRecords = useMemo(() => {
    const raw = searchTerm.trim().toLowerCase();
    if (!raw) return missingBooks;

    const clean = raw.replace(/[^a-z0-9]/g, '');

    return missingBooks.filter((item) => {
      const titleMatch = item.bookTitle.toLowerCase().includes(raw);
      const bCodeClean = item.barcode.toLowerCase().replace(/[^a-z0-9]/g, '');
      const shelfMatch = item.shelfLocation.toLowerCase().includes(raw);

      return titleMatch || bCodeClean.includes(clean) || shelfMatch;
    });
  }, [missingBooks, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground flex items-center gap-2">
            <AlertOctagon className="w-6 h-6 text-warning" />
            <span>Missing Books Directory (අස්ථානගත වූ පොත් නාමාවලිය)</span>
          </h1>
          <p className="text-xs text-muted-foreground">
            Books identified as physically missing during shelf audits. Scan found book barcode to restore into circulation.
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={refreshList} className="text-xs gap-1.5 self-start sm:self-auto">
          <RotateCcw className="w-3.5 h-3.5" />
          Refresh List
        </Button>
      </div>

      {/* Recover Book Barcode Scanner Card */}
      <Card className="border-2 border-success/30 bg-success-soft">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 text-success dark:text-success">
            <Sparkles className="w-5 h-5 text-success" />
            <span>Found a Missing Book? Scan Barcode to Restore (හමුවූ පොතක් නැවත භාරගන්න)</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Scan physical barcode of any recovered missing book to automatically remove it from this missing directory and mark as Available
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleRecoverBook} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative sm:col-span-2">
              <ScanLine className="w-4 h-4 text-success absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                ref={scanInputRef}
                autoFocus
                placeholder="Scan recovered book copy barcode here..."
                value={recoveryBarcode}
                onChange={(e) => setRecoveryBarcode(e.target.value)}
                className="pl-9 font-mono text-xs border-success/30 focus:border-success/30"
              />
            </div>

            <Button type="submit" className="font-bold bg-success hover:bg-success/90 text-white text-xs gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              Recover & Restore (නැවත භාරගන්න)
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Missing Books Table */}
      <Card>
        <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-warning" />
              <span>Current Missing Books Log ({filteredRecords.length})</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Unaccounted books identified during shelf audits across all bays
            </CardDescription>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              placeholder="Filter by barcode or title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 text-xs font-mono w-full sm:w-60"
            />
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-muted/70 text-muted-foreground border-y font-semibold uppercase tracking-wider text-xs">
                  <th className="p-3">Book Title & Barcode</th>
                  <th className="p-3">Assigned Shelf Location</th>
                  <th className="p-3">Date Reported Missing</th>
                  <th className="p-3">Audit Notes</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-muted-foreground space-y-1">
                      <CheckCircle2 className="w-8 h-8 text-success mx-auto mb-2 opacity-80" />
                      <div className="font-bold text-sm text-foreground">No missing books registered!</div>
                      <div className="text-xs">All library collection items are currently accounted for or on active loan.</div>
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((item, idx) => (
                    <tr key={idx} className="hover:bg-muted/40 dark:hover:bg-card/20 transition-colors">
                      <td className="p-3">
                        <div className="font-bold text-foreground text-sm flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-primary shrink-0" />
                          {item.bookTitle}
                        </div>
                        <div className="text-muted-foreground font-mono text-xs">
                          Barcode: <strong className="text-foreground">{item.barcode}</strong>
                        </div>
                      </td>

                      <td className="p-3 font-semibold text-foreground flex items-center gap-1.5 mt-2">
                        <MapPin className="w-3.5 h-3.5 text-warning shrink-0" />
                        {item.shelfLocation}
                      </td>

                      <td className="p-3 font-mono text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(item.reportedMissingAt).toLocaleDateString()}
                        </div>
                      </td>

                      <td className="p-3 text-muted-foreground max-w-xs truncate" title={item.notes}>
                        {item.notes || 'Detected in shelf verification'}
                      </td>

                      <td className="p-3 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDirectRecover(item.barcode)}
                          className="h-7 text-xs font-semibold text-success border-success/30 hover:bg-success hover:text-white"
                        >
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Mark Found
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
