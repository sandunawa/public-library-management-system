import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  ShieldAlert,
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
  UserX,
  CheckCircle2,
  Ban,
  RotateCcw,
  PlusCircle,
  FileText,
} from 'lucide-react';
import { SuspensionService, SuspensionRecord, SuspensionCategory } from '@/services/circulation/SuspensionService';
import { LocalAuthService } from '@/services/auth/LocalAuthService';
import { CirculationRepository } from '@/services/repositories/CirculationRepository';
import { SampleCirculationSeeder } from '@/services/circulation/SampleCirculationSeeder';
import { toast } from 'sonner';

export const SuspendedMembersPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | SuspensionCategory>('ALL');
  const [suspensions, setSuspensions] = useState<SuspensionRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<SuspensionRecord | null>(null);

  // Manual Suspension Modal State
  const [isSuspendModalOpen, setIsSuspendModalOpen] = useState(false);
  const [manualPatronInput, setManualPatronInput] = useState('');
  const [manualCategory, setManualCategory] = useState<SuspensionCategory>('MISCONDUCT');
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

    // Filter by Category
    if (selectedCategory !== 'ALL') {
      list = list.filter((r) => r.reasonCategory === selectedCategory);
    }

    // Filter by Search (Student ID barcode, name, book title)
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
      toast.success(`Account for ${memberName} has been REACTIVATED successfully!`);
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
    const cleanSearch = manualPatronInput.toLowerCase().replace(/[^a-z0-9]/g, '');

    const matched = allMembers.find((m) => {
      const mIdClean = m.memberIdNumber.toLowerCase().replace(/[^a-z0-9]/g, '');
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
      toast.success(`Account for ${matched.fullName} (${matched.memberIdNumber}) has been SUSPENDED.`);
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-foreground flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-rose-600" />
            <span>Suspended Accounts Directory (අත්හිටුවූ සාමාජික ගිණුම්)</span>
          </h1>
          <p className="text-xs text-muted-foreground">
            Automatic suspension for unreturned books past 30 days & Admin disciplinary actions. Scan Barcode or click row to inspect and reactivate.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              SampleCirculationSeeder.seedAllRealisticData();
              refreshData();
              toast.success('Sample suspended members populated successfully!');
            }}
            className="text-xs gap-1.5 border-dashed border-rose-500/50 text-rose-600 hover:bg-rose-500/5"
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
            onClick={() => setIsSuspendModalOpen(true)}
            className="text-xs font-bold gap-1.5 bg-rose-600 hover:bg-rose-700 text-white shadow"
          >
            <UserX className="w-4 h-4" />
            Suspend Member (ගිණුමක් අත්හිටුවන්න)
          </Button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { id: 'ALL', label: 'All Suspended (සියල්ල)', count: suspensions.length, color: 'text-foreground' },
          {
            id: 'OVERDUE_30_DAYS',
            label: '1+ Month Overdue (මාස 1ට වැඩි ප්‍රමාද)',
            count: suspensions.filter((s) => s.reasonCategory === 'OVERDUE_30_DAYS').length,
            color: 'text-rose-600',
          },
          {
            id: 'MISCONDUCT',
            label: 'Misconduct / Violation (විනය කඩකිරීම්)',
            count: suspensions.filter((s) => s.reasonCategory === 'MISCONDUCT').length,
            color: 'text-amber-600',
          },
          {
            id: 'CUSTOM',
            label: 'Other Admin Holds (වෙනත් හේතු)',
            count: suspensions.filter((s) => s.reasonCategory === 'CUSTOM' || s.reasonCategory === 'UNRETURNED_BOOK').length,
            color: 'text-primary',
          },
        ].map((tab) => (
          <Card
            key={tab.id}
            onClick={() => setSelectedCategory(tab.id as any)}
            className={`cursor-pointer transition-all border p-3 ${
              selectedCategory === tab.id
                ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-500/[0.04]'
                : 'hover:border-border'
            }`}
          >
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-muted-foreground">{tab.label}</span>
              <span className={`text-lg font-bold font-mono ${tab.color}`}>{tab.count}</span>
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

      {/* Suspended Records Table */}
      <Card>
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm font-bold flex items-center justify-between">
            <span>Suspended Members List ({filteredRecords.length})</span>
            <span className="text-xs font-normal text-muted-foreground">
              💡 පේළියක් මත click කර සම්පූර්ණ විස්තර බලා නැවත Active කරන්න
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-muted/70 text-muted-foreground border-y font-semibold uppercase tracking-wider text-[11px]">
                  <th className="p-3">Member (සාමාජිකයා)</th>
                  <th className="p-3">Reason Category (හේතුව කාණ්ඩය)</th>
                  <th className="p-3">Suspended Details (විස්තරය)</th>
                  <th className="p-3">Duration / Expiry</th>
                  <th className="p-3">Suspended By</th>
                  <th className="p-3 text-right">Unpaid Fines</th>
                  <th className="p-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                      No suspended members in this category.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((rec) => (
                    <tr
                      key={rec.id}
                      onClick={() => setSelectedRecord(rec)}
                      className="cursor-pointer hover:bg-rose-50/50 dark:hover:bg-rose-950/20 transition-colors group"
                      title="Click to view details and reactivate"
                    >
                      <td className="p-3">
                        <div className="font-semibold text-foreground text-sm flex items-center gap-1.5">
                          <Ban className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                          {rec.memberName}
                        </div>
                        <div className="text-[11px] font-mono text-muted-foreground mt-0.5">
                          ID: <span className="font-bold text-foreground">{rec.memberIdNumber}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        {rec.reasonCategory === 'OVERDUE_30_DAYS' ? (
                          <span className="bg-rose-500/10 text-rose-700 border border-rose-300 dark:text-rose-300 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase">
                            1+ Mo Overdue
                          </span>
                        ) : rec.reasonCategory === 'MISCONDUCT' ? (
                          <span className="bg-amber-500/10 text-amber-700 border border-amber-300 dark:text-amber-300 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase">
                            Misconduct
                          </span>
                        ) : (
                          <span className="bg-blue-500/10 text-blue-700 border border-blue-300 dark:text-blue-300 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase">
                            Custom Hold
                          </span>
                        )}
                      </td>
                      <td className="p-3 max-w-xs truncate text-muted-foreground" title={rec.reasonDetails}>
                        {rec.reasonDetails}
                      </td>
                      <td className="p-3 font-mono">
                        {rec.suspendUntil ? (
                          <span className="text-amber-600 font-semibold">
                            Until {new Date(rec.suspendUntil).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-rose-600 font-semibold">Indefinite (නොනැවතී)</span>
                        )}
                      </td>
                      <td className="p-3 text-muted-foreground text-[11px]">
                        {rec.suspendedBy}
                      </td>
                      <td className="p-3 text-right">
                        {rec.unpaidFines > 0 ? (
                          <span className="font-bold font-mono text-rose-600 text-sm">
                            Rs. {rec.unpaidFines.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground font-mono">Rs. 0.00</span>
                        )}
                      </td>
                      <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReactivate(rec.memberId, rec.memberName)}
                          className="h-7 text-xs font-semibold text-emerald-600 border-emerald-300 hover:bg-emerald-600 hover:text-white"
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border-2 border-rose-500/40 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 bg-rose-500/10 border-b border-rose-500/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Ban className="w-5 h-5 text-rose-600" />
                <h3 className="font-serif font-bold text-base text-foreground">
                  Suspension Details & Audit (අත්හිටුවීමේ විස්තරය)
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
            <div className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-rose-500/5 rounded-xl border border-rose-500/20 space-y-1">
                <div className="text-[11px] uppercase tracking-wider font-semibold text-rose-600">
                  Suspended Patron Account
                </div>
                <div className="text-sm font-bold text-foreground">{selectedRecord.memberName}</div>
                <div className="text-muted-foreground font-mono">
                  Card ID: <strong>{selectedRecord.memberIdNumber}</strong>
                </div>
              </div>

              <div className="p-3 rounded-lg border bg-background space-y-1">
                <div className="text-[11px] font-semibold text-muted-foreground uppercase">Reason Category</div>
                <div className="font-bold text-sm text-foreground">{selectedRecord.reasonCategory}</div>
                <div className="text-muted-foreground mt-1 leading-relaxed bg-muted/40 p-2.5 rounded">
                  {selectedRecord.reasonDetails}
                </div>
              </div>

              {selectedRecord.overdueBookTitle && (
                <div className="p-3 rounded-lg border bg-background">
                  <div className="text-[11px] font-semibold text-muted-foreground uppercase">Associated Overdue Book</div>
                  <div className="font-bold text-foreground mt-0.5">{selectedRecord.overdueBookTitle}</div>
                  {selectedRecord.daysLate && (
                    <div className="text-rose-600 font-mono mt-0.5">
                      Days Overdue: {selectedRecord.daysLate} Days past Due Date
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg border bg-background">
                  <div className="text-muted-foreground text-[11px]">Suspended Date</div>
                  <div className="font-bold text-sm mt-0.5 font-mono">
                    {new Date(selectedRecord.suspendedAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="p-3 rounded-lg border bg-background">
                  <div className="text-muted-foreground text-[11px]">Suspension Period</div>
                  <div className="font-bold text-sm mt-0.5 font-mono text-amber-600">
                    {selectedRecord.suspendUntil
                      ? `Until ${new Date(selectedRecord.suspendUntil).toLocaleDateString()}`
                      : 'Indefinite Hold'}
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex justify-between items-center">
                <span className="font-semibold text-amber-900 dark:text-amber-200">Accumulated Overdue Fines:</span>
                <span className="font-mono font-bold text-base text-rose-600">
                  Rs. {selectedRecord.unpaidFines.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-muted/30 border-t flex justify-between items-center">
              <Button variant="outline" size="sm" onClick={() => setSelectedRecord(null)} className="text-xs">
                Close
              </Button>
              <Button
                size="sm"
                onClick={() => handleReactivate(selectedRecord.memberId, selectedRecord.memberName)}
                className="text-xs font-bold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border-2 border-primary/30 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <form onSubmit={handleManualSuspend}>
              <div className="p-4 bg-muted/60 border-b flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserX className="w-5 h-5 text-rose-600" />
                  <h3 className="font-serif font-bold text-base text-foreground">
                    Suspend Member Account (සාමාජිකයෙකු අත්හිටුවන්න)
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSuspendModalOpen(false)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">
                    Member Name or Scan ID Barcode (නම හෝ Card Barcode):
                  </label>
                  <Input
                    autoFocus
                    placeholder="Scan Barcode or type member name / card ID..."
                    value={manualPatronInput}
                    onChange={(e) => setManualPatronInput(e.target.value)}
                    className="font-mono text-xs border-primary/40 focus:border-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Suspension Category (අත්හිටුවන හේතුව කාණ්ඩය):</label>
                  <select
                    value={manualCategory}
                    onChange={(e) => setManualCategory(e.target.value as any)}
                    className="w-full border rounded-lg p-2 bg-background font-sans text-xs focus:ring-1 focus:ring-primary"
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
                    className="w-full border rounded-lg p-2 bg-background font-sans text-xs focus:ring-1 focus:ring-primary"
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
                    className="w-full border rounded-lg p-2.5 bg-background font-sans text-xs focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="p-4 bg-muted/30 border-t flex justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsSuspendModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="font-bold bg-rose-600 hover:bg-rose-700 text-white">
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
