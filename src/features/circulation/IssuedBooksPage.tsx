import React, { useState, useMemo, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  BookOpen,
  Search,
  ScanLine,
  User,
  Calendar,
  AlertTriangle,
  Clock,
  ArrowRight,
  UserCheck,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { CirculationRepository } from '@/services/repositories/CirculationRepository';
import { LocalAuthService } from '@/services/auth/LocalAuthService';
import { CatalogRepository } from '@/services/repositories/CatalogRepository';
import { PolicyService } from '@/services/circulation/PolicyService';
import { SampleCirculationSeeder } from '@/services/circulation/SampleCirculationSeeder';
import { Loan, calculateFine } from '@libraryos/shared';
import { toast } from 'sonner';

export const IssuedBooksPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [loans, setLoans] = useState<Loan[]>(() => CirculationRepository.getLocalLoans());
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const policy = useMemo(() => PolicyService.toLoanPolicy(), []);
  const now = Date.now();

  const handleRefresh = () => {
    setLoans(CirculationRepository.getLocalLoans());
  };

  const handleSeedSamples = () => {
    SampleCirculationSeeder.seedAllRealisticData();
    setLoans(CirculationRepository.getLocalLoans());
    toast.success('Sample Issued Books, Overdue Fines & Suspended Members populated successfully!');
  };

  // Filter loans by Student barcode/ID or Book barcode
  const filteredLoans = useMemo(() => {
    const raw = searchTerm.trim().toLowerCase();
    if (!raw) return loans;

    const clean = raw.replace(/[^a-z0-9]/g, '');

    // Get copies to match book barcodes
    const allCopies = CatalogRepository.getLocalCopies();
    const allMembers = LocalAuthService.getAllMembers();

    return loans.filter((loan) => {
      // 1. Direct loan number or title or member name match
      if (
        loan.loanNumber.toLowerCase().includes(raw) ||
        loan.bookTitle.toLowerCase().includes(raw) ||
        loan.memberName.toLowerCase().includes(raw)
      ) {
        return true;
      }

      // 2. Member ID / student barcode match
      const member = allMembers.find((m) => m.id === loan.memberId);
      if (member) {
        const mIdClean = member.memberIdNumber.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (mIdClean.includes(clean) || clean.includes(mIdClean)) return true;
      }

      // 3. Book barcode match
      const copy = allCopies.find((c) => c.id === loan.copyId);
      if (copy) {
        const bCodeClean = copy.barcode.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (bCodeClean.includes(clean) || clean.includes(bCodeClean)) return true;
      }

      return false;
    });
  }, [loans, searchTerm]);

  // Statistics
  const activeLoans = filteredLoans.filter((l) => l.status === 'ACTIVE');
  const overdueLoans = activeLoans.filter((l) => l.dueDate < now);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-foreground flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary" />
            <span>Issued Books Directory (ණයට දුන් පොත් ලැයිස්තුව)</span>
          </h1>
          <p className="text-xs text-muted-foreground">
            Search or scan Student ID Card barcode or Book copy barcode to monitor all active and historical loans
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button variant="outline" size="sm" onClick={handleSeedSamples} className="text-xs gap-1.5 border-dashed border-primary/50 text-primary hover:bg-primary/5">
            <RefreshCw className="w-3.5 h-3.5" />
            Seed Sample Data
          </Button>
          <Button variant="outline" size="sm" onClick={handleRefresh} className="text-xs gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-primary/5 border-primary/20">
          <div className="text-xs font-semibold text-primary uppercase">Total Records</div>
          <div className="text-2xl font-bold font-mono mt-1">{filteredLoans.length}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Matched circulation loans</div>
        </Card>
        <Card className="p-4 bg-emerald-500/5 border-emerald-500/20">
          <div className="text-xs font-semibold text-emerald-600 uppercase">Currently Borrowed (Active)</div>
          <div className="text-2xl font-bold font-mono text-emerald-700 mt-1">{activeLoans.length}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Books in patrons' possession</div>
        </Card>
        <Card className="p-4 bg-rose-500/5 border-rose-500/20">
          <div className="text-xs font-semibold text-rose-600 uppercase">Overdue Items (ප්‍රමාද පොත්)</div>
          <div className="text-2xl font-bold font-mono text-rose-700 mt-1">{overdueLoans.length}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Subject to late return fees</div>
        </Card>
      </div>

      {/* Universal Scanner / Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <ScanLine className="w-4 h-4 text-primary absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                ref={searchInputRef}
                autoFocus
                placeholder="Scan Student ID Card barcode or Book Copy Barcode, or type Member Name..."
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

      {/* Loans Table */}
      <Card>
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm font-bold flex items-center justify-between">
            <span>Issued Books & Borrowing History ({filteredLoans.length})</span>
            {searchTerm && (
              <span className="text-xs font-mono font-normal border px-2 py-0.5 rounded-full bg-muted">
                Filtered: "{searchTerm}"
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-muted/70 text-muted-foreground border-y font-semibold uppercase tracking-wider text-[11px]">
                  <th className="p-3">Loan ID / Book Title</th>
                  <th className="p-3">Borrower (Student / Patron)</th>
                  <th className="p-3">Issued Date</th>
                  <th className="p-3">Due Date</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Overdue Fine (LKR)</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredLoans.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      No matching issued books found for this search/barcode.
                    </td>
                  </tr>
                ) : (
                  filteredLoans.map((loan) => {
                    const isOverdue = loan.status === 'ACTIVE' && loan.dueDate < now;
                    const calculatedFine = loan.status === 'ACTIVE'
                      ? calculateFine(loan.dueDate, now, policy)
                      : 0;

                    return (
                      <tr key={loan.id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-3">
                          <div className="font-semibold text-foreground text-sm flex items-center gap-1.5">
                            <BookOpen className="w-3.5 h-3.5 text-primary shrink-0" />
                            {loan.bookTitle}
                          </div>
                          <div className="text-[11px] font-mono text-muted-foreground mt-0.5">
                            Loan: {loan.loanNumber}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="font-semibold text-foreground flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-muted-foreground" />
                            {loan.memberName}
                          </div>
                          <div className="text-[11px] font-mono text-muted-foreground">
                            Patron ID: {loan.memberId}
                          </div>
                        </td>
                        <td className="p-3 text-muted-foreground">
                          {new Date(loan.issuedAt).toLocaleDateString()}
                        </td>
                        <td className="p-3">
                          <div className={`font-semibold flex items-center gap-1 ${isOverdue ? 'text-destructive font-bold' : 'text-foreground'}`}>
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(loan.dueDate).toLocaleDateString()}
                          </div>
                          {isOverdue && (
                            <div className="text-[10px] text-destructive flex items-center gap-0.5 mt-0.5 font-bold">
                              <AlertTriangle className="w-3 h-3" />
                              Past Due Date!
                            </div>
                          )}
                        </td>
                        <td className="p-3">
                          {loan.status === 'ACTIVE' ? (
                            isOverdue ? (
                              <span className="bg-rose-500/10 text-rose-700 border border-rose-300 dark:text-rose-300 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase">
                                Overdue
                              </span>
                            ) : (
                              <span className="bg-emerald-500/10 text-emerald-700 border border-emerald-300 dark:text-emerald-300 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase">
                                Borrowed
                              </span>
                            )
                          ) : (
                            <span className="bg-muted text-muted-foreground border px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase">
                              Returned
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          {calculatedFine > 0 ? (
                            <span className="font-bold font-mono text-rose-600 text-sm">
                              Rs. {calculatedFine.toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground font-mono">Rs. 0.00</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
