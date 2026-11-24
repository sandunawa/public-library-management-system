import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import {
  ShieldAlert,
  ScanLine,
  User,
  Calendar,
  AlertTriangle,
  Clock,
  BookOpen,
  X,
  RefreshCw,
  UserX,
  RotateCcw,
  Ban,
} from 'lucide-react';
import {
  SuspensionService,
  SuspensionRecord,
  SuspensionCategory,
} from '@/services/circulation/SuspensionService';
import { LocalAuthService } from '@/services/auth/LocalAuthService';
import { SampleCirculationSeeder } from '@/services/circulation/SampleCirculationSeeder';
import { toast } from 'sonner';

export const SuspendedMembersPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<
    'ALL' | SuspensionCategory
  >('ALL');
  const [suspensions, setSuspensions] = useState<SuspensionRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<SuspensionRecord | null>(
    null
  );

  // Manual Suspension Modal State
  const [isSuspendModalOpen, setIsSuspendModalOpen] = useState(false);
  const [manualPatronInput, setManualPatronInput] = useState('');
  const [manualCategory, setManualCategory] =
    useState<SuspensionCategory>('MISCONDUCT');
  const [manualNote, setManualNote] = useState('');
  const [manualDurationDays, setManualDurationDays] = useState<number>(30);

  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Load and run auto-check on mount
  const refreshData = () => {
    SuspensionService.runAutoSuspensionCheck();
    setSuspensions(SuspensionService.getSuspensions());
  };

  useEffect(() => {
    refreshData();
  }, []);

  // Filter by category and search
  const filteredRecords = useMemo(() => {
    let list = suspensions;

    if (selectedCategory !== 'ALL') {
      list = list.filter((r) => r.reasonCategory === selectedCategory);
    }

    const raw = searchTerm.trim().toLowerCase();
    if (!raw) return list;

    const clean = raw.replace(/[^a-z0-9]/g, '');

    return list.filter((r) => {
      const nameMatch = r.memberName.toLowerCase().includes(raw);
      const mIdClean = r.memberIdNumber.toLowerCase().replace(/[^a-z0-9]/g, '');
      const noteMatch = r.reasonDetails.toLowerCase().includes(raw);
      const bookMatch = r.overdueBookTitle?.toLowerCase().includes(raw);

      return (
        nameMatch ||
        noteMatch ||
        bookMatch ||
        mIdClean.includes(clean) ||
        clean.includes(mIdClean)
      );
    });
  }, [suspensions, selectedCategory, searchTerm]);

  // Reactivate a member
  const handleReactivate = (memberId: string, memberName: string) => {
    const success = SuspensionService.reactivateMember(memberId);
    if (success) {
      toast.success(
        `Account for ${memberName} has been REACTIVATED successfully!`
      );
      setSelectedRecord(null);
      refreshData();
    } else {
      toast.error('Failed to reactivate member.');
    }
  };

  // Submit manual suspension
  const handleManualSuspend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualPatronInput.trim()) {
      toast.error('Please enter Member Name or scan ID Card barcode.');
      return;
    }
    if (!manualNote.trim()) {
      toast.error('Please enter a suspension reason note.');
      return;
    }

    const allMembers = LocalAuthService.getAllMembers();
    const cleanSearch = manualPatronInput
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');

    const matched = allMembers.find((m) => {
      const mIdClean = m.memberIdNumber
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
      return (
        mIdClean === cleanSearch ||
        m.id.toLowerCase() === cleanSearch ||
        m.fullName.toLowerCase().includes(manualPatronInput.toLowerCase().trim())
      );
    });

    if (!matched) {
      toast.error(`Member '${manualPatronInput}' not found in database.`);
      return;
    }

    const success = SuspensionService.suspendMember(
      matched.id,
      manualCategory,
      manualNote.trim(),
      manualDurationDays > 0 ? manualDurationDays : undefined
    );

    if (success) {
      toast.success(
        `Account for ${matched.fullName} (${matched.memberIdNumber}) has been SUSPENDED.`
      );
      setIsSuspendModalOpen(false);
      setManualPatronInput('');
      setManualNote('');
      refreshData();
    } else {
      toast.error('Could not suspend member.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Suspended Accounts Directory"
        description="Automatic suspension for unreturned books past 30 days & Admin disciplinary actions."
        badge={
          <span className="text-xs text-muted-foreground font-sinhala">
            අත්හිටුවූ සාමාජික ගිණුම්
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                SampleCirculationSeeder.seedAllRealisticData();
                refreshData();
                toast.success('Sample suspended members populated successfully!');
              }}
              className="text-xs gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Seed Sample Data
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshData}
              className="text-xs gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Check & Refresh
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={() => setIsSuspendModalOpen(true)}
              className="text-xs font-semibold gap-1.5"
            >
              <UserX className="w-4 h-4" />
              <span>Suspend Member</span>
            </Button>
          </div>
        }
      />

      {/* Category Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            id: 'ALL',
            label: 'All Suspended',
            count: suspensions.length,
            variant: 'default' as const,
          },
          {
            id: 'OVERDUE_30_DAYS',
            label: '1+ Month Overdue',
            count: suspensions.filter((s) => s.reasonCategory === 'OVERDUE_30_DAYS')
              .length,
            variant: 'danger' as const,
          },
          {
            id: 'MISCONDUCT',
            label: 'Misconduct / Violation',
            count: suspensions.filter((s) => s.reasonCategory === 'MISCONDUCT')
              .length,
            variant: 'warning' as const,
          },
          {
            id: 'CUSTOM',
            label: 'Other Admin Holds',
            count: suspensions.filter(
              (s) =>
                s.reasonCategory === 'CUSTOM' ||
                s.reasonCategory === 'UNRETURNED_BOOK'
            ).length,
            variant: 'info' as const,
          },
        ].map((tab) => (
          <Card
            key={tab.id}
            onClick={() => setSelectedCategory(tab.id as any)}
            className={`cursor-pointer transition-all p-3.5 border ${
              selectedCategory === tab.id
                ? 'border-primary ring-2 ring-primary/20 bg-primary-soft/20'
                : 'hover:border-border'
            }`}
          >
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-muted-foreground truncate">
                {tab.label}
              </span>
              <span className="text-lg font-bold font-mono text-foreground">
                {tab.count}
              </span>
            </div>
          </Card>
        ))}
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
                placeholder="Scan Student ID Card barcode or enter name to search suspended members..."
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

      {/* Suspended Records Table */}
      <Card className="overflow-hidden">
        <CardHeader className="p-4 pb-3 border-b border-border">
          <CardTitle className="text-sm font-semibold flex items-center justify-between">
            <span>Suspended Members List ({filteredRecords.length})</span>
            <span className="text-xs font-normal text-muted-foreground font-sinhala">
              පේළියක් මත click කර සම්පූර්ණ විස්තර බලා නැවත Active කරන්න
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-muted/50 text-muted-foreground border-b border-border font-semibold text-xs">
                  <th className="p-3.5">Member (සාමාජිකයා)</th>
                  <th className="p-3.5">Reason Category</th>
                  <th className="p-3.5">Suspended Details</th>
                  <th className="p-3.5">Duration / Expiry</th>
                  <th className="p-3.5">Suspended By</th>
                  <th className="p-3.5 text-right">Unpaid Fines</th>
                  <th className="p-3.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground text-xs">
                      No suspended members in this category.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((rec) => (
                    <tr
                      key={rec.id}
                      onClick={() => setSelectedRecord(rec)}
                      className="cursor-pointer hover:bg-muted/30 transition-colors group"
                      title="Click to view details and reactivate"
                    >
                      <td className="p-3.5">
                        <div className="font-semibold text-foreground flex items-center gap-1.5">
                          <Ban className="w-3.5 h-3.5 text-danger shrink-0" />
                          {rec.memberName}
                        </div>
                        <div className="text-xs font-mono text-muted-foreground mt-0.5">
                          ID: <span className="font-semibold text-foreground">{rec.memberIdNumber}</span>
                        </div>
                      </td>
                      <td className="p-3.5">
                        {rec.reasonCategory === 'OVERDUE_30_DAYS' ? (
                          <Badge variant="danger" size="sm">
                            1+ Mo Overdue
                          </Badge>
                        ) : rec.reasonCategory === 'MISCONDUCT' ? (
                          <Badge variant="warning" size="sm">
                            Misconduct
                          </Badge>
                        ) : (
                          <Badge variant="info" size="sm">
                            Custom Hold
                          </Badge>
                        )}
                      </td>
                      <td className="p-3.5 max-w-xs truncate text-muted-foreground text-xs" title={rec.reasonDetails}>
                        {rec.reasonDetails}
                      </td>
                      <td className="p-3.5 font-mono text-xs">
                        {rec.suspendUntil ? (
                          <span className="text-warning font-semibold">
                            Until {new Date(rec.suspendUntil).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-danger font-semibold">Indefinite Hold</span>
                        )}
                      </td>
                      <td className="p-3.5 text-muted-foreground text-xs">
                        {rec.suspendedBy}
                      </td>
                      <td className="p-3.5 text-right font-mono">
                        {rec.unpaidFines > 0 ? (
                          <span className="font-bold text-danger text-xs">
                            Rs. {rec.unpaidFines.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs">Rs. 0.00</span>
                        )}
                      </td>
                      <td className="p-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReactivate(rec.memberId, rec.memberName)}
                          className="h-8 text-xs font-semibold text-success hover:bg-success-soft hover:text-success"
                        >
                          <RotateCcw className="w-3 h-3 mr-1" />
                          Reactivate
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

      {/* Detail & Reactivation Modal */}
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
                <Ban className="w-5 h-5 text-danger" />
                <h3 className="font-heading font-semibold text-base text-foreground">
                  Suspension Details & Audit (අත්හිටුවීමේ විස්තරය)
                </h3>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4 text-xs">
              <div className="p-4 bg-danger-soft/40 rounded-xl border border-danger/20 space-y-1">
                <div className="text-xs font-semibold text-danger">
                  Suspended Patron Account
                </div>
                <div className="text-sm font-bold text-foreground">{selectedRecord.memberName}</div>
                <div className="text-muted-foreground font-mono">
                  Card ID: <strong>{selectedRecord.memberIdNumber}</strong>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-border bg-card space-y-1">
                <div className="text-xs font-semibold text-muted-foreground uppercase">Reason Category</div>
                <div className="font-semibold text-sm text-foreground">{selectedRecord.reasonCategory}</div>
                <div className="text-muted-foreground mt-1 leading-relaxed bg-muted/40 p-3 rounded-lg">
                  {selectedRecord.reasonDetails}
                </div>
              </div>

              {selectedRecord.overdueBookTitle && (
                <div className="p-3.5 rounded-xl border border-border bg-card">
                  <div className="text-xs font-semibold text-muted-foreground uppercase">Associated Overdue Book</div>
                  <div className="font-semibold text-foreground mt-0.5">{selectedRecord.overdueBookTitle}</div>
                  {selectedRecord.daysLate && (
                    <div className="text-danger font-mono mt-0.5 text-xs">
                      Days Overdue: {selectedRecord.daysLate} Days past Due Date
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl border border-border bg-card">
                  <div className="text-muted-foreground text-xs">Suspended Date</div>
                  <div className="font-semibold text-sm mt-0.5 font-mono">
                    {new Date(selectedRecord.suspendedAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="p-3.5 rounded-xl border border-border bg-card">
                  <div className="text-muted-foreground text-xs">Suspension Period</div>
                  <div className="font-semibold text-sm mt-0.5 font-mono text-warning">
                    {selectedRecord.suspendUntil
                      ? `Until ${new Date(selectedRecord.suspendUntil).toLocaleDateString()}`
                      : 'Indefinite Hold'}
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-warning-soft border border-warning/20 flex justify-between items-center">
                <span className="font-semibold text-foreground">Accumulated Overdue Fines:</span>
                <span className="font-mono font-bold text-base text-danger">
                  Rs. {selectedRecord.unpaidFines.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-muted/30 border-t border-border flex justify-between items-center">
              <Button variant="outline" size="sm" onClick={() => setSelectedRecord(null)} className="text-xs">
                Close
              </Button>
              <Button
                size="sm"
                variant="success"
                onClick={() => handleReactivate(selectedRecord.memberId, selectedRecord.memberName)}
                className="text-xs font-semibold gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reactivate Account (නැවත Active කරන්න)
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Manual Suspension Modal */}
      {isSuspendModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-card border border-border rounded-2xl max-w-md w-full shadow-elevated overflow-hidden animate-in zoom-in-95 duration-200">
            <form onSubmit={handleManualSuspend}>
              <div className="p-5 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserX className="w-5 h-5 text-danger" />
                  <h3 className="font-heading font-semibold text-base text-foreground">
                    Suspend Member Account
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSuspendModalOpen(false)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted"
                  aria-label="Close dialog"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">
                    Member Name or Scan ID Barcode (නම හෝ Card Barcode):
                  </label>
                  <Input
                    autoFocus
                    placeholder="Scan Barcode or type member name / card ID..."
                    value={manualPatronInput}
                    onChange={(e) => setManualPatronInput(e.target.value)}
                    className="font-mono text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">
                    Suspension Category (අත්හිටුවන හේතුව කාණ්ඩය):
                  </label>
                  <select
                    value={manualCategory}
                    onChange={(e) => setManualCategory(e.target.value as any)}
                    className="w-full h-10 border border-input rounded-[10px] px-3 bg-card text-foreground font-sans text-xs focus:ring-2 focus:ring-ring focus:outline-none"
                  >
                    <option value="MISCONDUCT">Misconduct / Disciplinary (විනය විරෝධී ක්‍රියා)</option>
                    <option value="UNRETURNED_BOOK">Unreturned Books / Damaged Item (පොත් හානි කිරීම් / භාර නොදීම)</option>
                    <option value="OVERDUE_30_DAYS">Long Overdue (මාසයකට වඩා ප්‍රමාද වීම)</option>
                    <option value="CUSTOM">Custom Administrative Hold (වෙනත් විශේෂ හේතුවක්)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">
                    Suspension Duration (අත්හිටුවන කාල සීමාව):
                  </label>
                  <select
                    value={manualDurationDays}
                    onChange={(e) => setManualDurationDays(parseInt(e.target.value))}
                    className="w-full h-10 border border-input rounded-[10px] px-3 bg-card text-foreground font-sans text-xs focus:ring-2 focus:ring-ring focus:outline-none"
                  >
                    <option value={7}>7 Days (දින 7ක්)</option>
                    <option value={14}>14 Days (දින 14ක්)</option>
                    <option value={30}>30 Days (මාස 1ක්)</option>
                    <option value={90}>90 Days (මාස 3ක්)</option>
                    <option value={180}>180 Days (මාස 6ක්)</option>
                    <option value={0}>Indefinite / Permanent (නැවත දැනුම් දෙන තුරු)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">
                    Suspension Reason / Officer Note (සටහන):
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Enter detailed reason note for this disciplinary action..."
                    value={manualNote}
                    onChange={(e) => setManualNote(e.target.value)}
                    className="w-full border border-input rounded-[10px] p-2.5 bg-card text-foreground font-sans text-xs focus:ring-2 focus:ring-ring focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-4 bg-muted/30 border-t border-border flex justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsSuspendModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" variant="danger" className="font-semibold">
                  Confirm Suspension (අත්හිටුවන්න)
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
