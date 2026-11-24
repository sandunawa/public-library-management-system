import React, { useState, useMemo, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Coins,
  Search,
  ScanLine,
  User,
  Calendar,
  AlertTriangle,
  Clock,
  BookOpen,
  DollarSign,
  Info,
  X,
  Phone,
  Mail,
  RefreshCw,
  Receipt,
  CheckCircle2,
} from 'lucide-react';
import { CirculationRepository } from '@/services/repositories/CirculationRepository';
import { LocalAuthService } from '@/services/auth/LocalAuthService';
import { CatalogRepository } from '@/services/repositories/CatalogRepository';
import { PolicyService } from '@/services/circulation/PolicyService';
import { SampleCirculationSeeder } from '@/services/circulation/SampleCirculationSeeder';
import { Loan, calculateFine } from '@libraryos/shared';
import { toast } from 'sonner';

interface OverdueFineRecord {
  loan: Loan;
  memberIdNumber: string;
  memberPhone?: string;
  memberEmail?: string;
  bookBarcode: string;
  daysOverdue: number;
  fineAmount: number;
}

export const OverdueFinesPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<OverdueFineRecord | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const policy = useMemo(() => PolicyService.toLoanPolicy(), [refreshKey]);
  const policySettings = useMemo(() => PolicyService.getSettings(), [refreshKey]);
  const now = Date.now();

  // Compute all overdue active loans
  const overdueRecords = useMemo<OverdueFineRecord[]>(() => {
    const allLoans = CirculationRepository.getLocalLoans();
    const allMembers = LocalAuthService.getAllMembers();
    const allCopies = CatalogRepository.getLocalCopies();

    const records: OverdueFineRecord[] = [];

    allLoans.forEach((loan) => {
      // Must be ACTIVE and past Due Date
      if (loan.status === 'ACTIVE' && loan.dueDate < now) {
        const member = allMembers.find((m) => m.id === loan.memberId);
        const copy = allCopies.find((c) => c.id === loan.copyId);

        const diffMs = now - loan.dueDate;
        const daysOverdue = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
        const fineAmount = calculateFine(loan.dueDate, now, policy);

        records.push({
          loan,
          memberIdNumber: member ? member.memberIdNumber : 'N/A',
          memberPhone: member?.phone,
          memberEmail: member?.email,
          bookBarcode: copy ? copy.barcode : 'N/A',
          daysOverdue,
          fineAmount,
        });
      }
    });

    return records;
  }, [refreshKey, now, policy]);

  // Barcode / Text Search Filter
  const filteredRecords = useMemo(() => {
    const raw = searchTerm.trim().toLowerCase();
    if (!raw) return overdueRecords;

    const clean = raw.replace(/[^a-z0-9]/g, '');

    return overdueRecords.filter((rec) => {
      const titleMatch = rec.loan.bookTitle.toLowerCase().includes(raw);
      const nameMatch = rec.loan.memberName.toLowerCase().includes(raw);
      const loanNoMatch = rec.loan.loanNumber.toLowerCase().includes(raw);

      const mIdClean = rec.memberIdNumber.toLowerCase().replace(/[^a-z0-9]/g, '');
      const bCodeClean = rec.bookBarcode.toLowerCase().replace(/[^a-z0-9]/g, '');

      return (
        titleMatch ||
        nameMatch ||
        loanNoMatch ||
        mIdClean.includes(clean) ||
        clean.includes(mIdClean) ||
        bCodeClean.includes(clean) ||
        clean.includes(bCodeClean)
      );
    });
  }, [overdueRecords, searchTerm]);

  // Total Fine calculation
  const totalFineSum = useMemo(() => {
    return filteredRecords.reduce((acc, curr) => acc + curr.fineAmount, 0);
  }, [filteredRecords]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-foreground flex items-center gap-2">
            <Coins className="w-6 h-6 text-amber-600" />
            <span>Overdue Books & Fines Directory (ප්‍රමාද පොත් සහ දඩ මුදල් ලැයිස්තුව)</span>
          </h1>
          <p className="text-xs text-muted-foreground">
            Monitor accumulated late return fines. Scan Student ID Barcode or Book Barcode to filter records. Click any row to view complete fine breakdown.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              SampleCirculationSeeder.seedAllRealisticData();
              setRefreshKey((k) => k + 1);
              toast.success('Sample overdue loans & fines populated successfully!');
            }}
            className="text-xs gap-1.5 border-dashed border-primary/50 text-primary hover:bg-primary/5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Seed Sample Data
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setRefreshKey((k) => k + 1)}
            className="text-xs gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh Fines
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-rose-500/5 border-rose-500/20">
          <div className="text-xs font-semibold text-rose-600 uppercase">Overdue Items (ප්‍රමාද වූ පොත් ගණන)</div>
          <div className="text-2xl font-bold font-mono text-rose-700 mt-1">{filteredRecords.length}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Active books past due return date</div>
        </Card>
        <Card className="p-4 bg-amber-500/5 border-amber-500/20">
          <div className="text-xs font-semibold text-amber-700 uppercase">Total Accumulated Fines (මුළු දඩ එකතුව)</div>
          <div className="text-2xl font-bold font-mono text-amber-800 mt-1">Rs. {totalFineSum.toFixed(2)}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Calculated at Rs. {policySettings.finePerDay}/day</div>
        </Card>
        <Card className="p-4 bg-primary/5 border-primary/20">
          <div className="text-xs font-semibold text-primary uppercase">Active Fine Policy Rate</div>
          <div className="text-2xl font-bold font-mono mt-1">Rs. {policySettings.finePerDay}.00 / Day</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Loan duration: {policySettings.loanPeriodDays} days</div>
        </Card>
      </div>

      {/* Barcode Scanner / Instant Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <ScanLine className="w-4 h-4 text-primary absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                ref={searchInputRef}
                autoFocus
                placeholder="Scan Student ID Barcode or Book Barcode, or type Member Name to filter overdue fines..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 font-mono text-xs border-primary/40 focus:border-primary"
              />
            </div>
            {searchTerm && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  searchInputRef.current?.focus();
                }}
                className="text-xs"
              >
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Overdue Fines Table */}
      <Card>
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm font-bold flex items-center justify-between">
            <span>Overdue Records & Accrued Penalties ({filteredRecords.length})</span>
            <span className="text-xs font-normal text-muted-foreground">
              💡 පේළියක් (row) මත click කර සම්පූර්ණ විස්තර බලන්න
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-muted/70 text-muted-foreground border-y font-semibold uppercase tracking-wider text-[11px]">
                  <th className="p-3">Borrower (ශිෂ්‍යයාගේ නම / ID)</th>
                  <th className="p-3">Book Title & Barcode (පොතේ විස්තර)</th>
                  <th className="p-3">Issued Date (ගෙනගිය දිනය)</th>
                  <th className="p-3">Due Date (භාරදිය යුතු දිනය)</th>
                  <th className="p-3">Overdue (ප්‍රමාද දින ගණන)</th>
                  <th className="p-3 text-right">Fine Amount (දඩ මුදල)</th>
                  <th className="p-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                      {searchTerm
                        ? 'No overdue records match the scanned barcode / query.'
                        : 'No overdue books found! All library loans are currently up to date.'}
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((rec, idx) => (
                    <tr
                      key={idx}
                      onClick={() => setSelectedRecord(rec)}
                      className="cursor-pointer hover:bg-amber-50/50 dark:hover:bg-amber-950/20 transition-colors group"
                      title="Click to view detailed breakdown"
                    >
                      <td className="p-3">
                        <div className="font-semibold text-foreground text-sm flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-primary shrink-0" />
                          {rec.loan.memberName}
                        </div>
                        <div className="text-[11px] font-mono text-muted-foreground mt-0.5">
                          ID: <span className="font-bold text-foreground">{rec.memberIdNumber}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="font-semibold text-foreground flex items-center gap-1">
                          <BookOpen className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          {rec.loan.bookTitle}
                        </div>
                        <div className="text-[11px] font-mono text-muted-foreground">
                          Barcode: <span className="font-bold">{rec.bookBarcode}</span>
                        </div>
                      </td>
                      <td className="p-3 text-muted-foreground font-mono">
                        {new Date(rec.loan.issuedAt).toLocaleDateString()}
                      </td>
                      <td className="p-3">
                        <div className="font-mono text-rose-600 font-bold flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(rec.loan.dueDate).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="bg-rose-500/10 text-rose-700 border border-rose-300 dark:text-rose-300 px-2.5 py-0.5 rounded-full text-xs font-bold font-mono inline-flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {rec.daysOverdue} Days Late
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <span className="font-bold font-mono text-rose-600 text-sm">
                          Rs. {rec.fineAmount.toFixed(2)}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all"
                        >
                          View Details
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

      {/* Detailed Modal / Dialog for Selected Record */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border-2 border-primary/30 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 bg-muted/60 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-amber-600" />
                <h3 className="font-serif font-bold text-base text-foreground">
                  Overdue Loan & Fine Breakdown (දඩ විස්තරය)
                </h3>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-5 text-xs">
              {/* Member Box */}
              <div className="p-3.5 bg-primary/5 rounded-xl border border-primary/20 space-y-1.5">
                <div className="text-[11px] uppercase tracking-wider font-semibold text-primary">
                  Student / Patron Profile
                </div>
                <div className="text-sm font-bold text-foreground">{selectedRecord.loan.memberName}</div>
                <div className="text-muted-foreground font-mono">Student Card ID: <strong>{selectedRecord.memberIdNumber}</strong></div>
                {selectedRecord.memberPhone && (
                  <div className="text-muted-foreground flex items-center gap-1.5">
                    <Phone className="w-3 h-3" /> Contact: {selectedRecord.memberPhone}
                  </div>
                )}
                {selectedRecord.memberEmail && (
                  <div className="text-muted-foreground flex items-center gap-1.5">
                    <Mail className="w-3 h-3" /> Email: {selectedRecord.memberEmail}
                  </div>
                )}
              </div>

              {/* Book Details Box */}
              <div className="p-3.5 bg-muted/40 rounded-xl border space-y-1.5">
                <div className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
                  Borrowed Book Details
                </div>
                <div className="text-sm font-bold text-foreground">{selectedRecord.loan.bookTitle}</div>
                <div className="text-muted-foreground font-mono">Book Barcode: <strong>{selectedRecord.bookBarcode}</strong></div>
                <div className="text-muted-foreground font-mono">Loan Ref: {selectedRecord.loan.loanNumber}</div>
              </div>

              {/* Chronological Breakdown */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg border bg-background">
                  <div className="text-muted-foreground text-[11px]">Issued Date (ගෙනගිය දිනය)</div>
                  <div className="font-bold text-sm mt-0.5 font-mono">
                    {new Date(selectedRecord.loan.issuedAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="p-3 rounded-lg border bg-background">
                  <div className="text-muted-foreground text-[11px]">Agreed Due Date (භාරදිය යුතු දිනය)</div>
                  <div className="font-bold text-sm mt-0.5 font-mono text-rose-600">
                    {new Date(selectedRecord.loan.dueDate).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Fine Calculation Formula */}
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                <div className="flex justify-between items-center text-amber-900 dark:text-amber-200">
                  <span className="font-semibold">Days Overdue (ප්‍රමාද දින ගණන):</span>
                  <span className="font-mono font-bold text-sm">{selectedRecord.daysOverdue} Days</span>
                </div>
                <div className="flex justify-between items-center text-amber-900 dark:text-amber-200">
                  <span className="font-semibold">Fine Rate Per Day (දිනකට දඩය):</span>
                  <span className="font-mono font-bold text-sm">Rs. {policySettings.finePerDay}.00 / Day</span>
                </div>
                <div className="pt-2 border-t border-amber-500/20 flex justify-between items-center">
                  <span className="text-sm font-bold text-rose-700 dark:text-rose-300">Total Due Fine (ගෙවිය යුතු දඩය):</span>
                  <span className="font-mono font-bold text-base text-rose-700 dark:text-rose-300">
                    Rs. {selectedRecord.fineAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-muted/30 border-t flex justify-end">
              <Button size="sm" onClick={() => setSelectedRecord(null)} className="text-xs">
                Close (වසන්න)
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
