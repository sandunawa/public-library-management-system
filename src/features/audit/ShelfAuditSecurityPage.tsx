import React, { useState, useMemo, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ShieldAlert,
  ClipboardCheck,
  ScanLine,
  CheckCircle2,
  AlertOctagon,
  AlertTriangle,
  RotateCcw,
  Library,
  BookOpen,
  User,
  Calendar,
  Layers,
  MapPin,
  Clock,
  Check,
  Search,
  ArrowRight,
  UserX,
  FileSpreadsheet,
} from 'lucide-react';
import { CirculationRepository } from '@/services/repositories/CirculationRepository';
import { CatalogRepository } from '@/services/repositories/CatalogRepository';
import { ShelfService, LibraryShelf } from '@/services/inventory/ShelfService';
import { MissingBooksService, MissingBookRecord } from '@/services/inventory/MissingBooksService';
import { LocalAuthService } from '@/services/auth/LocalAuthService';
import { BookCopy, Book, Loan } from '@libraryos/shared';
import { toast } from 'sonner';

interface VerifiedScanRecord {
  barcode: string;
  bookTitle: string;
  callNumber: string;
  timestamp: string;
  isRegisteredOnThisShelf: boolean;
  status: string;
}

interface AuditFinishedReport {
  shelfName: string;
  shelfCode: string;
  totalAssignedToShelf: number;
  presentCount: number;
  borrowedCount: number;
  missingCount: number;
  severeDefaultersCount: number; // overdue > 3 months
  presentList: VerifiedScanRecord[];
  borrowedList: { loan: Loan; memberPhone?: string; isSevereDefaulter: boolean; daysLate?: number }[];
  missingList: { copy: BookCopy; title: string }[];
}

export const ShelfAuditSecurityPage: React.FC = () => {
  const [shelves, setShelves] = useState<LibraryShelf[]>(() => ShelfService.getShelves());
  const [selectedShelfId, setSelectedShelfId] = useState<string>(() => shelves[0]?.id || '');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [scannedRecords, setScannedRecords] = useState<VerifiedScanRecord[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Completed Audit Report State
  const [auditReport, setAuditReport] = useState<AuditFinishedReport | null>(null);

  const barcodeInputRef = useRef<HTMLInputElement | null>(null);

  const targetShelf = useMemo(() => {
    return shelves.find((s) => s.id === selectedShelfId) || shelves[0];
  }, [shelves, selectedShelfId]);

  const allCopies = useMemo(() => CatalogRepository.getLocalCopies(), [auditReport]);
  const allBooks = useMemo(() => CatalogRepository.getLocalBooks(), []);
  const allLoans = useMemo(() => CirculationRepository.getLocalLoans(), []);
  const allMembers = useMemo(() => LocalAuthService.getAllMembers(), []);

  const bookTitleMap = useMemo(() => {
    const map = new Map<string, string>();
    allBooks.forEach((b) => map.set(b.id, b.title));
    return map;
  }, [allBooks]);

  // Handle continuous barcode scanning during audit
  const handleBarcodeScan = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = barcodeInput.trim();
    if (!code) return;

    if (!targetShelf) {
      toast.error('Please select an active shelf to audit.');
      return;
    }

    // Check if barcode already scanned in this session
    if (scannedRecords.some((r) => r.barcode.toLowerCase() === code.toLowerCase())) {
      toast.warning(`Item ${code} has already been verified in this audit session.`);
      setBarcodeInput('');
      barcodeInputRef.current?.focus();
      return;
    }

    setIsProcessing(true);
    try {
      const copy = await CirculationRepository.findCopyByBarcode(code);
      const now = new Date().toLocaleTimeString();

      if (!copy) {
        toast.error(`Barcode ${code} not found in central database! Marked as Unregistered.`);
        setScannedRecords((prev) => [
          {
            barcode: code,
            bookTitle: 'Unregistered Book Copy',
            callNumber: 'N/A',
            timestamp: now,
            isRegisteredOnThisShelf: false,
            status: 'UNREGISTERED',
          },
          ...prev,
        ]);
      } else {
        const title = bookTitleMap.get(copy.bookId) || `Copy ${code}`;
        const targetShelfCode = targetShelf.code?.toLowerCase();
        const copyLocation = (copy.location || '').toLowerCase();
        const isRegisteredOnThisShelf = targetShelfCode ? copyLocation.includes(targetShelfCode) : true;

        // Auto-mark copy as present and AVAILABLE
        copy.status = 'AVAILABLE';
        copy.location = `[${targetShelf.code}] ${targetShelf.name}`;
        copy.lastCirculatedAt = Date.now();
        copy.updatedAt = Date.now();

        // Save updated copy
        const currentCopies = CatalogRepository.getLocalCopies();
        const matchIdx = currentCopies.findIndex((c) => c.barcode.toLowerCase() === copy.barcode.toLowerCase());
        if (matchIdx !== -1) {
          currentCopies[matchIdx] = copy;
          CatalogRepository.saveLocalCopies(currentCopies);
        }

        setScannedRecords((prev) => [
          {
            barcode: copy.barcode,
            bookTitle: title,
            callNumber: copy.callNumber || 'DDC-Standard',
            timestamp: now,
            isRegisteredOnThisShelf,
            status: 'PRESENT_VERIFIED',
          },
          ...prev,
        ]);

        toast.success(`Verified: "${title}" (${code}) is Present on ${targetShelf.name}!`);
      }
      setBarcodeInput('');
      barcodeInputRef.current?.focus();
    } catch {
      toast.error('Audit scan error.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Reset current scanning session
  const handleResetSession = () => {
    setScannedRecords([]);
    setAuditReport(null);
    setBarcodeInput('');
    barcodeInputRef.current?.focus();
    toast.info('Audit session reset.');
  };

  // FINISH AUDIT BUTTON: Generates audit report, identifies borrowed books, defaulters (>3 mo), and missing books!
  const handleFinishAudit = () => {
    if (!targetShelf) return;
    const now = Date.now();
    const THREE_MONTHS_MS = 90 * 24 * 60 * 60 * 1000;

    const shelfCode = targetShelf.code?.toLowerCase() || '';
    const shelfName = targetShelf.name.toLowerCase();

    // 1. Identify all copies officially assigned to this shelf
    const shelfAssignedCopies = allCopies.filter((copy) => {
      const loc = (copy.location || '').toLowerCase();
      return (shelfCode && loc.includes(shelfCode)) || loc.includes(shelfName);
    });

    const scannedBarcodesSet = new Set(scannedRecords.map((r) => r.barcode.toLowerCase()));

    // 2. Identify currently borrowed books for this shelf
    const borrowedItems: { loan: Loan; memberPhone?: string; isSevereDefaulter: boolean; daysLate?: number }[] = [];
    const missingCopies: { copy: BookCopy; title: string }[] = [];

    shelfAssignedCopies.forEach((copy) => {
      const isScannedPresent = scannedBarcodesSet.has(copy.barcode.toLowerCase());

      if (!isScannedPresent) {
        // Check if there is an active loan
        const activeLoan = allLoans.find((l) => l.copyId === copy.id && l.status === 'ACTIVE');

        if (activeLoan) {
          const isOverdue = activeLoan.dueDate < now;
          const overdueMs = now - activeLoan.dueDate;
          const isSevereDefaulter = isOverdue && overdueMs >= THREE_MONTHS_MS;
          const daysLate = isOverdue ? Math.floor(overdueMs / (1000 * 60 * 60 * 24)) : 0;
          const member = allMembers.find((m) => m.id === activeLoan.memberId);

          borrowedItems.push({
            loan: activeLoan,
            memberPhone: member?.phone,
            isSevereDefaulter,
            daysLate,
          });
        } else {
          // Not scanned AND not currently on loan -> MISSING / ASTHAANAGATHA!
          missingCopies.push({
            copy,
            title: bookTitleMap.get(copy.bookId) || `Copy ${copy.barcode}`,
          });
        }
      }
    });

    // 3. Automatically dispatch missing copies to MissingBooksService!
    if (missingCopies.length > 0) {
      const recordsToLog: MissingBookRecord[] = missingCopies.map((item) => ({
        copyId: item.copy.id,
        barcode: item.copy.barcode,
        bookTitle: item.title,
        shelfLocation: `[${targetShelf.code}] ${targetShelf.name}`,
        reportedMissingAt: now,
        notes: `Detected as missing during shelf audit on ${new Date().toLocaleDateString()}`,
      }));
      MissingBooksService.logMissingBooks(recordsToLog);
    }

    const severeCount = borrowedItems.filter((b) => b.isSevereDefaulter).length;

    setAuditReport({
      shelfName: targetShelf.name,
      shelfCode: targetShelf.code,
      totalAssignedToShelf: shelfAssignedCopies.length,
      presentCount: scannedRecords.length,
      borrowedCount: borrowedItems.length,
      missingCount: missingCopies.length,
      severeDefaultersCount: severeCount,
      presentList: scannedRecords,
      borrowedList: borrowedItems,
      missingList: missingCopies,
    });

    toast.success(
      `Shelf Audit Completed! Verified: ${scannedRecords.length}, Borrowed: ${borrowedItems.length}, Missing: ${missingCopies.length}`
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-foreground flex items-center gap-2">
            <ClipboardCheck className="w-6 h-6 text-primary" />
            <span>Shelf Audit & Security Verification (රාක්ක විගණනය සහ ආරක්ෂාව)</span>
          </h1>
          <p className="text-xs text-muted-foreground">
            Audit physical books on shelves, detect borrowed loans & severe defaulters (3+ months late), and log missing books automatically
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button variant="outline" size="sm" onClick={handleResetSession} className="text-xs gap-1.5">
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Audit Session
          </Button>
        </div>
      </div>

      {/* Main Audit Control Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Shelf Selector & Continuous Scanner */}
        <Card className="md:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <Library className="w-4 h-4 text-primary" />
                <span>Audit Target Shelf</span>
              </span>
              <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary">
                {shelves.length} Shelves
              </span>
            </CardTitle>
            <CardDescription className="text-xs">
              Select shelf to audit, then continuously scan book barcodes
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 text-xs">
            {/* Shelf Selector */}
            <div className="space-y-1.5">
              <label className="font-semibold block text-foreground">
                Shelf Being Audited (විගණනය කරන රාක්කය තෝරන්න):
              </label>
              <select
                value={selectedShelfId}
                onChange={(e) => {
                  setSelectedShelfId(e.target.value);
                  setScannedRecords([]);
                  setAuditReport(null);
                }}
                className="w-full border rounded-lg p-2.5 bg-background font-sans text-xs focus:ring-1 focus:ring-primary border-primary/40 font-semibold"
              >
                {shelves.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.code ? `[${s.code}] ` : ''}{s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Active Shelf Metadata */}
            {targetShelf && (
              <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 space-y-1 text-xs">
                <div className="font-bold text-sm text-foreground flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-primary shrink-0" />
                  {targetShelf.name}
                </div>
                <div className="text-muted-foreground flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-amber-600" />
                  Zone: {targetShelf.floorZone}
                </div>
                <div className="text-muted-foreground font-mono">
                  Assigned in Inventory: <strong>
                    {allCopies.filter((c) => (c.location || '').includes(targetShelf.code || '')).length} Books
                  </strong>
                </div>
              </div>
            )}

            {/* Continuous Barcode Scanner Form */}
            <form onSubmit={handleBarcodeScan} className="space-y-3 pt-2 border-t">
              <label className="font-semibold block text-foreground">
                Scan Book Barcode (පොත් Barcodes එක දිගට scan කරන්න):
              </label>
              <div className="relative">
                <ScanLine className="w-4 h-4 text-primary absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  ref={barcodeInputRef}
                  autoFocus
                  placeholder="Scan physical barcode on shelf..."
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  className="pl-9 font-mono text-xs border-primary/50 focus:border-primary ring-1 ring-primary/20"
                />
              </div>
              <Button type="submit" disabled={isProcessing} className="w-full font-bold text-xs gap-1">
                Verify Book Copy (තහවුරු කරන්න)
              </Button>
            </form>

            {/* FINISH AUDIT BUTTON */}
            <div className="pt-3 border-t">
              <Button
                type="button"
                size="default"
                onClick={handleFinishAudit}
                className="w-full font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md text-xs gap-2 py-5"
              >
                <CheckCircle2 className="w-4 h-4" />
                Finish Shelf Audit (විගණනය අවසන් කරන්න)
              </Button>
              <p className="text-[11px] text-muted-foreground text-center mt-1.5">
                Calculates present books, active loans, severe defaulters, and missing items.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Right Column: Live Scanned Items Verification Table */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Present & Verified on Shelf ({scannedRecords.length} Items)</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Real-time log of scanned book barcodes confirmed physically on {targetShelf?.name}
              </CardDescription>
            </div>

            {scannedRecords.length > 0 && (
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                {scannedRecords.length} Verified Present
              </span>
            )}
          </CardHeader>

          <CardContent>
            <div className="border rounded-xl divide-y text-xs max-h-[380px] overflow-y-auto">
              <div className="p-3 bg-muted font-semibold text-muted-foreground flex justify-between uppercase tracking-wider text-[11px] sticky top-0 z-10">
                <span>Book Title & Barcode</span>
                <span>Call Number / Status / Time</span>
              </div>

              {scannedRecords.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground space-y-1">
                  <ScanLine className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                  <div className="font-semibold text-sm">No books scanned in this audit session yet.</div>
                  <div className="text-xs">
                    Scan each book copy barcode on this shelf bay to verify its physical presence.
                  </div>
                </div>
              ) : (
                scannedRecords.map((item, idx) => (
                  <div key={idx} className="p-3 flex justify-between items-center hover:bg-muted/30">
                    <div className="flex items-center space-x-3">
                      <BookOpen className="w-4 h-4 text-primary shrink-0" />
                      <div>
                        <div className="font-semibold text-sm text-foreground">{item.bookTitle}</div>
                        <div className="text-muted-foreground font-mono text-[11px]">
                          Barcode: <strong className="text-foreground">{item.barcode}</strong>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <span className="text-[11px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">
                        {item.callNumber}
                      </span>
                      <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-full text-[10px] uppercase">
                        Present
                      </span>
                      <span className="text-[11px] text-muted-foreground font-mono">
                        {item.timestamp}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* =========================================================================
          AUDIT REPORT SECTION (Finish එබූ පසු විවෘත වන විස්තරාත්මක වාර්තාව)
         ========================================================================= */}
      {auditReport && (
        <div className="space-y-6 pt-4 border-t">
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Card className="p-4 bg-emerald-500/5 border-emerald-500/20">
              <div className="text-xs font-semibold text-emerald-600 uppercase">Physically Present (තිබූ පොත්)</div>
              <div className="text-2xl font-bold font-mono text-emerald-700 mt-1">{auditReport.presentCount}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">Verified on shelf bay</div>
            </Card>

            <Card className="p-4 bg-blue-500/5 border-blue-500/20">
              <div className="text-xs font-semibold text-blue-600 uppercase">On Loan to Members (ගෙනගිය පොත්)</div>
              <div className="text-2xl font-bold font-mono text-blue-700 mt-1">{auditReport.borrowedCount}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">Officially borrowed loans</div>
            </Card>

            <Card className="p-4 bg-rose-500/10 border-2 border-rose-500/40">
              <div className="text-xs font-bold text-rose-700 uppercase flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                Severe Defaulters (මාස 3+ පැහැරහැරීම්)
              </div>
              <div className="text-2xl font-extrabold font-mono text-rose-700 mt-1">
                {auditReport.severeDefaultersCount}
              </div>
              <div className="text-[11px] font-semibold text-rose-700/80 mt-0.5">Overdue past 90+ days</div>
            </Card>

            <Card className="p-4 bg-amber-500/10 border-2 border-amber-500/40">
              <div className="text-xs font-bold text-amber-700 uppercase flex items-center gap-1">
                <AlertOctagon className="w-3.5 h-3.5 text-amber-600" />
                Missing Books (අස්ථානගත වූ පොත්)
              </div>
              <div className="text-2xl font-extrabold font-mono text-amber-700 mt-1">
                {auditReport.missingCount}
              </div>
              <div className="text-[11px] text-amber-800 dark:text-amber-300 mt-0.5">
                Sent to Missing Books Section!
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Table 1: Borrowed Books & Severe Defaulters (Red Alert for 3+ Months) */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-600" />
                    <span>Members Borrowed Loans ({auditReport.borrowedList.length})</span>
                  </span>
                  <span className="text-[11px] text-rose-600 font-bold">
                    🔴 Red: Overdue &gt; 3 Months
                  </span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Copies of this shelf currently on loan to library members
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-muted/70 text-muted-foreground border-y font-semibold uppercase text-[11px]">
                        <th className="p-3">Borrower & Book</th>
                        <th className="p-3">Due Date</th>
                        <th className="p-3">Contact</th>
                        <th className="p-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {auditReport.borrowedList.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-6 text-center text-muted-foreground">
                            No active loans registered for this shelf.
                          </td>
                        </tr>
                      ) : (
                        auditReport.borrowedList.map((item, idx) => (
                          <tr
                            key={idx}
                            className={`transition-colors ${
                              item.isSevereDefaulter
                                ? 'bg-rose-500/15 border-l-4 border-l-rose-600 text-rose-950 dark:text-rose-200'
                                : 'hover:bg-muted/30'
                            }`}
                          >
                            <td className="p-3">
                              <div className="font-bold text-foreground flex items-center gap-1.5">
                                {item.isSevereDefaulter ? (
                                  <UserX className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                                ) : (
                                  <User className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                )}
                                {item.loan.memberName}
                              </div>
                              <div className="text-[11px] text-muted-foreground font-mono mt-0.5">
                                {item.loan.bookTitle}
                              </div>
                            </td>

                            <td className="p-3 font-mono">
                              <div>{new Date(item.loan.dueDate).toLocaleDateString()}</div>
                              {item.daysLate && item.daysLate > 0 ? (
                                <span className="text-rose-600 font-bold text-[10px]">
                                  {item.daysLate} Days Overdue
                                </span>
                              ) : null}
                            </td>

                            <td className="p-3 text-muted-foreground font-mono">
                              {item.memberPhone || item.loan.memberId}
                            </td>

                            <td className="p-3 text-right">
                              {item.isSevereDefaulter ? (
                                <span className="bg-rose-600 text-white font-extrabold px-2.5 py-1 rounded-full text-[10px] uppercase shadow-sm inline-flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3" />
                                  3+ Mo Defaulter!
                                </span>
                              ) : (
                                <span className="bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 font-semibold px-2 py-0.5 rounded-full text-[10px] uppercase">
                                  Borrowed
                                </span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Table 2: Missing / Asthaanagatha Books (Sent to Missing Registry) */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <AlertOctagon className="w-4 h-4 text-amber-600" />
                    <span>Missing Books Discrepancy ({auditReport.missingList.length})</span>
                  </span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-700">
                    Logged to Missing Directory
                  </span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Books assigned to this shelf not scanned and not on loan
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-muted/70 text-muted-foreground border-y font-semibold uppercase text-[11px]">
                        <th className="p-3">Missing Book Title</th>
                        <th className="p-3">Barcode</th>
                        <th className="p-3">Call Number</th>
                        <th className="p-3 text-right">Action Log</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {auditReport.missingList.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-6 text-center text-muted-foreground">
                            🎉 No missing books on this shelf! 100% reconciled.
                          </td>
                        </tr>
                      ) : (
                        auditReport.missingList.map((item, idx) => (
                          <tr key={idx} className="hover:bg-amber-50/50 dark:hover:bg-amber-950/20">
                            <td className="p-3 font-semibold text-foreground flex items-center gap-1.5">
                              <BookOpen className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              {item.title}
                            </td>
                            <td className="p-3 font-mono font-bold text-foreground">
                              {item.copy.barcode}
                            </td>
                            <td className="p-3 font-mono text-muted-foreground">
                              {item.copy.callNumber || 'DDC-Standard'}
                            </td>
                            <td className="p-3 text-right">
                              <span className="bg-amber-500/15 text-amber-800 dark:text-amber-200 border border-amber-500/30 px-2 py-0.5 rounded font-bold text-[10px] uppercase">
                                Flagged Missing
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
          </div>
        </div>
      )}
    </div>
  );
};
