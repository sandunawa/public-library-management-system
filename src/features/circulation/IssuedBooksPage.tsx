import React, { useState, useMemo, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { EmptyState } from '@/components/ui/empty-state';
import {
  BookOpen,
  ScanLine,
  User,
  Calendar,
  AlertTriangle,
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

    const allCopies = CatalogRepository.getLocalCopies();
    const allMembers = LocalAuthService.getAllMembers();

    return loans.filter((loan) => {
      if (
        loan.loanNumber.toLowerCase().includes(raw) ||
        loan.bookTitle.toLowerCase().includes(raw) ||
        loan.memberName.toLowerCase().includes(raw)
      ) {
        return true;
      }

      const member = allMembers.find((m) => m.id === loan.memberId);
      if (member) {
        const mIdClean = member.memberIdNumber.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (mIdClean.includes(clean) || clean.includes(mIdClean)) return true;
      }

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
      <PageHeader
        title="Issued Books Directory"
        description="Search or scan patron ID card barcode or book copy barcode to monitor all active and historical loans"
        badge={
          <span className="text-xs text-muted-foreground font-sinhala">
            ණයට දුන් පොත් ලැයිස්තුව
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSeedSamples}
              className="text-xs gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Seed Sample Data
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="text-xs gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </Button>
          </div>
        }
      />

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Records"
          value={filteredLoans.length}
          subtitle="Matched circulation loans"
          icon={BookOpen}
        />
        <StatCard
          title="Currently Borrowed (Active)"
          value={activeLoans.length}
          subtitle="Books in patrons' possession"
          icon={User}
        />
        <StatCard
          title="Overdue Items (ප්‍රමාද පොත්)"
          value={overdueLoans.length}
          subtitle="Subject to late return fees"
          icon={AlertTriangle}
          className={overdueLoans.length > 0 ? 'border-danger/30 bg-danger-soft/20' : ''}
        />
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

      {/* Loans Table */}
      <Card className="overflow-hidden">
        <CardHeader className="p-4 pb-3 border-b border-border">
          <CardTitle className="text-sm font-semibold flex items-center justify-between">
            <span>Issued Books & Borrowing History ({filteredLoans.length})</span>
            {searchTerm && (
              <Badge variant="muted" size="sm">
                Filtered: "{searchTerm}"
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-muted/50 text-muted-foreground border-b border-border font-semibold text-xs">
                  <th className="p-3.5">Loan ID / Book Title</th>
                  <th className="p-3.5">Borrower (Student / Patron)</th>
                  <th className="p-3.5">Issued Date</th>
                  <th className="p-3.5">Due Date</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Overdue Fine (LKR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredLoans.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground text-xs">
                      No matching issued books found for this search/barcode.
                    </td>
                  </tr>
                ) : (
                  filteredLoans.map((loan) => {
                    const isOverdue = loan.status === 'ACTIVE' && loan.dueDate < now;
                    const calculatedFine =
                      loan.status === 'ACTIVE'
                        ? calculateFine(loan.dueDate, now, policy)
                        : 0;

                    return (
                      <tr key={loan.id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-3.5">
                          <div className="font-semibold text-foreground flex items-center gap-1.5">
                            <BookOpen className="w-4 h-4 text-primary shrink-0" />
                            {loan.bookTitle}
                          </div>
                          <div className="text-xs font-mono text-muted-foreground mt-0.5">
                            Loan: {loan.loanNumber}
                          </div>
                        </td>
                        <td className="p-3.5">
                          <div className="font-semibold text-foreground flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-muted-foreground" />
                            {loan.memberName}
                          </div>
                          <div className="text-xs font-mono text-muted-foreground">
                            Patron ID: {loan.memberId}
                          </div>
                        </td>
                        <td className="p-3.5 text-muted-foreground text-xs">
                          {new Date(loan.issuedAt).toLocaleDateString()}
                        </td>
                        <td className="p-3.5">
                          <div
                            className={`font-semibold text-xs flex items-center gap-1 ${
                              isOverdue ? 'text-danger font-bold' : 'text-foreground'
                            }`}
                          >
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(loan.dueDate).toLocaleDateString()}
                          </div>
                          {isOverdue && (
                            <div className="text-[11px] text-danger flex items-center gap-0.5 mt-0.5 font-bold">
                              <AlertTriangle className="w-3 h-3" />
                              Past Due Date!
                            </div>
                          )}
                        </td>
                        <td className="p-3.5">
                          {loan.status === 'ACTIVE' ? (
                            isOverdue ? (
                              <Badge variant="danger" size="sm">
                                Overdue
                              </Badge>
                            ) : (
                              <Badge variant="info" size="sm">
                                Borrowed
                              </Badge>
                            )
                          ) : (
                            <Badge variant="muted" size="sm">
                              Returned
                            </Badge>
                          )}
                        </td>
                        <td className="p-3.5 text-right font-mono">
                          {calculatedFine > 0 ? (
                            <span className="font-bold text-danger">
                              Rs. {calculatedFine.toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-xs">Rs. 0.00</span>
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
