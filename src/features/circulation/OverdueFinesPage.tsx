import React, { useState, useMemo, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import {
  Coins,
  ScanLine,
  User,
  Calendar,
  AlertTriangle,
  Clock,
  BookOpen,
  X,
  Phone,
  Mail,
  RefreshCw,
  Receipt,
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
      <PageHeader
        title="Overdue Books & Fines Directory"
        description="Monitor accumulated late return fines. Scan Student ID Barcode or Book Barcode to filter records."
        badge={
          <span className="text-xs text-muted-foreground font-sinhala">
            ප්‍රමාද පොත් සහ දඩ මුදල් ලැයිස්තුව
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                SampleCirculationSeeder.seedAllRealisticData();
                setRefreshKey((k) => k + 1);
                toast.success('Sample overdue loans & fines populated successfully!');
              }}
              className="text-xs gap-1.5"
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
        }
      />

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Overdue Items (ප්‍රමාද වූ පොත් ගණන)"
          value={filteredRecords.length}
          subtitle="Active books past due return date"
          icon={AlertTriangle}
          className="border-danger/30 bg-danger-soft/20"
        />
        <StatCard
          title="Total Accumulated Fines (මුළු දඩ එකතුව)"
          value={`Rs. ${totalFineSum.toFixed(2)}`}
          subtitle={`Calculated at Rs. ${policySettings.finePerDay}/day`}
          icon={Coins}
        />
        <StatCard
          title="Active Fine Policy Rate"
          value={`Rs. ${policySettings.finePerDay}.00`}
          subtitle={`Standard loan: ${policySettings.loanPeriodDays} days`}
          icon={Clock}
        />
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
                className="pl-9 font-mono text-xs"
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
      <Card className="overflow-hidden">
        <CardHeader className="p-4 pb-3 border-b border-border">
          <CardTitle className="text-sm font-semibold flex items-center justify-between">
            <span>Overdue Records & Accrued Penalties ({filteredRecords.length})</span>
            <span className="text-xs font-normal text-muted-foreground font-sinhala">
              පේළියක් මත click කර සම්පූර්ණ විස්තර බලන්න
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-muted/50 text-muted-foreground border-b border-border font-semibold text-xs">
                  <th className="p-3.5">Borrower (ශිෂ්‍යයාගේ නම / ID)</th>
                  <th className="p-3.5">Book Title & Barcode</th>
                  <th className="p-3.5">Issued Date</th>
                  <th className="p-3.5">Due Date</th>
                  <th className="p-3.5">Overdue Days</th>
                  <th className="p-3.5 text-right">Fine Amount</th>
                  <th className="p-3.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <img
                          src="/images/empty-all-clear.webp"
                          alt="All clear"
                          className="w-40 h-28 object-contain rounded-lg mb-1"
                        />
                        <div className="text-sm font-semibold text-foreground">
                          {searchTerm ? 'No overdue records match search' : 'All Clear — No Overdue Fines!'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {searchTerm
                            ? 'No overdue records match the scanned barcode / query.'
                            : 'All library loans are currently in good standing.'}
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((rec, idx) => (
                    <tr
                      key={idx}
                      onClick={() => setSelectedRecord(rec)}
                      className="cursor-pointer hover:bg-muted/30 transition-colors group"
                      title="Click to view detailed breakdown"
                    >
                      <td className="p-3.5">
                        <div className="font-semibold text-foreground flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-primary shrink-0" />
                          {rec.loan.memberName}
                        </div>
                        <div className="text-xs font-mono text-muted-foreground mt-0.5">
                          ID: <span className="font-semibold text-foreground">{rec.memberIdNumber}</span>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <div className="font-semibold text-foreground flex items-center gap-1">
                          <BookOpen className="w-3.5 h-3.5 text-secondary shrink-0" />
                          {rec.loan.bookTitle}
                        </div>
                        <div className="text-xs font-mono text-muted-foreground">
                          Barcode: <span className="font-medium">{rec.bookBarcode}</span>
                        </div>
                      </td>
                      <td className="p-3.5 text-muted-foreground font-mono text-xs">
                        {new Date(rec.loan.issuedAt).toLocaleDateString()}
                      </td>
                      <td className="p-3.5">
                        <div className="font-mono text-danger font-semibold flex items-center gap-1 text-xs">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(rec.loan.dueDate).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="p-3.5">
                        <Badge variant="danger" size="sm">
                          <Clock className="w-3 h-3" />
                          {rec.daysOverdue} Days Late
                        </Badge>
                      </td>
                      <td className="p-3.5 text-right">
                        <span className="font-bold font-mono text-danger">
                          Rs. {rec.fineAmount.toFixed(2)}
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all"
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
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-card border border-border rounded-2xl max-w-lg w-full shadow-elevated overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-warning" />
                <h3 className="font-heading font-semibold text-base text-foreground">
                  Overdue Loan & Fine Breakdown
                </h3>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-5 text-xs">
              {/* Member Box */}
              <div className="p-4 bg-primary-soft/40 rounded-xl border border-primary/20 space-y-1.5">
                <div className="text-[11px] font-semibold text-primary">
                  Student / Patron Profile
                </div>
                <div className="text-sm font-bold text-foreground">{selectedRecord.loan.memberName}</div>
                <div className="text-muted-foreground font-mono">
                  Student Card ID: <strong>{selectedRecord.memberIdNumber}</strong>
                </div>
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
              <div className="p-4 bg-muted/40 rounded-xl border border-border space-y-1.5">
                <div className="text-[11px] font-semibold text-muted-foreground">
                  Borrowed Book Details
                </div>
                <div className="text-sm font-bold text-foreground">{selectedRecord.loan.bookTitle}</div>
                <div className="text-muted-foreground font-mono">
                  Book Barcode: <strong>{selectedRecord.bookBarcode}</strong>
                </div>
                <div className="text-muted-foreground font-mono">
                  Loan Ref: {selectedRecord.loan.loanNumber}
                </div>
              </div>

              {/* Chronological Breakdown */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl border border-border bg-card">
                  <div className="text-muted-foreground text-xs">Issued Date (ගෙනගිය දිනය)</div>
                  <div className="font-semibold text-sm mt-0.5 font-mono">
                    {new Date(selectedRecord.loan.issuedAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="p-3.5 rounded-xl border border-border bg-card">
                  <div className="text-muted-foreground text-xs">Agreed Due Date (භාරදිය යුතු දිනය)</div>
                  <div className="font-semibold text-sm mt-0.5 font-mono text-danger">
                    {new Date(selectedRecord.loan.dueDate).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Fine Calculation Formula */}
              <div className="p-4 rounded-xl bg-warning-soft border border-warning/30 space-y-2">
                <div className="flex justify-between items-center text-foreground">
                  <span className="font-medium">Days Overdue (ප්‍රමාද දින ගණන):</span>
                  <span className="font-mono font-bold text-sm">{selectedRecord.daysOverdue} Days</span>
                </div>
                <div className="flex justify-between items-center text-foreground">
                  <span className="font-medium">Fine Rate Per Day:</span>
                  <span className="font-mono font-bold text-sm">Rs. {policySettings.finePerDay}.00 / Day</span>
                </div>
                <div className="pt-2 border-t border-warning/20 flex justify-between items-center">
                  <span className="text-sm font-bold text-danger">Total Due Fine:</span>
                  <span className="font-mono font-bold text-base text-danger">
                    Rs. {selectedRecord.fineAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-muted/30 border-t border-border flex justify-end">
              <Button size="sm" onClick={() => setSelectedRecord(null)} className="text-xs font-semibold">
                Close (වසන්න)
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
