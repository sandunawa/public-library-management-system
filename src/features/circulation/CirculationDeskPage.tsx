import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import {
  ScanLine,
  CheckCircle2,
  CornerDownLeft,
  UserX,
  Trash2,
  UserCheck,
  BookOpen,
  ShoppingBag,
  ShieldAlert,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { CirculationRepository } from '@/services/repositories/CirculationRepository';
import { CatalogRepository } from '@/services/repositories/CatalogRepository';
import { PolicyService } from '@/services/circulation/PolicyService';
import { MemberProfile } from '@libraryos/shared';
import { toast } from 'sonner';
import { LocalAuthService } from '@/services/auth/LocalAuthService';

// Item prepared in the checkout cart before final checkout
interface StagedCartItem {
  barcode: string;
  title: string;
  materialType?: string;
}

// Completed receipt item
interface ScannedSessionItem {
  barcode: string;
  title: string;
  dueDate?: string;
  status: 'ISSUED' | 'RETURNED';
  fine?: number;
}

export const CirculationDeskPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ISSUE' | 'RETURN'>('ISSUE');
  const [memberInput, setMemberInput] = useState('');
  const [activeMember, setActiveMember] = useState<MemberProfile | null>(null);
  const [itemBarcode, setItemBarcode] = useState('');

  // Staged items awaiting final checkout confirmation
  const [stagedItems, setStagedItems] = useState<StagedCartItem[]>([]);
  // Completed transaction history for receipts
  const [sessionItems, setSessionItems] = useState<ScannedSessionItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const memberInputRef = useRef<HTMLInputElement | null>(null);
  const itemInputRef = useRef<HTMLInputElement | null>(null);

  // Focus helper to shift directly to Item barcode input without using mouse
  const focusItemInput = () => {
    setTimeout(() => {
      itemInputRef.current?.focus();
      itemInputRef.current?.select();
    }, 60);
  };

  // Clear/Change Patron
  const handleClearPatron = () => {
    setActiveMember(null);
    setMemberInput('');
    setStagedItems([]);
    toast.info('Patron cleared. Ready to scan new member card.');
    setTimeout(() => {
      memberInputRef.current?.focus();
    }, 60);
  };

  // Remove a staged item before checkout
  const handleRemoveStagedItem = (index: number) => {
    const itemToRemove = stagedItems[index];
    if (!itemToRemove) return;
    setStagedItems((prev) => prev.filter((_, i) => i !== index));
    toast.info(`Removed book copy ${itemToRemove.barcode} from checkout queue.`);
    focusItemInput();
  };

  // Remove an item from session history
  const handleRemoveSessionItem = (index: number) => {
    const itemToRemove = sessionItems[index];
    if (!itemToRemove) return;
    setSessionItems((prev) => prev.filter((_, i) => i !== index));
    toast.info(`Removed ${itemToRemove.barcode} from session receipts.`);
    focusItemInput();
  };

  // Step 1: Patron Lookup
  const executeMemberLookup = (inputVal: string): boolean => {
    const raw = inputVal.trim();
    if (!raw) return false;

    const allMembers = LocalAuthService.getAllMembers();
    const cleanSearch = raw.toLowerCase().replace(/[^a-z0-9]/g, '');

    const matched = allMembers.find((m) => {
      const mIdClean = m.memberIdNumber.toLowerCase().replace(/[^a-z0-9]/g, '');
      const uidClean = m.id.toLowerCase().replace(/[^a-z0-9]/g, '');
      const emailClean = m.email.toLowerCase().trim();

      return (
        mIdClean === cleanSearch ||
        uidClean === cleanSearch ||
        emailClean === raw.toLowerCase() ||
        m.memberIdNumber.toLowerCase() === raw.toLowerCase() ||
        cleanSearch.includes(mIdClean) ||
        mIdClean.includes(cleanSearch)
      );
    });

    if (matched) {
      setActiveMember(matched);
      setStagedItems([]);
      toast.success(`Patron identified: ${matched.fullName} (${matched.memberIdNumber})`);
      setMemberInput('');
      focusItemInput();
      return true;
    }
    return false;
  };

  const handleMemberScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberInput.trim()) return;

    setIsProcessing(true);
    const found = executeMemberLookup(memberInput);
    if (!found) {
      toast.error(`Member card '${memberInput}' not found in records.`);
    }
    setIsProcessing(false);
  };

  const handleMemberKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (memberInput.trim()) {
        const found = executeMemberLookup(memberInput);
        if (!found) {
          toast.error(`Member card '${memberInput}' not found.`);
        }
      }
    }
  };

  const handleMemberInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setMemberInput(val);
    const clean = val.replace(/[^a-zA-Z0-9-]/g, '').trim();

    if (clean.length >= 6) {
      executeMemberLookup(clean);
    }
  };

  // Step 2: Barcode Scan (Add to Cart / Return)
  const handleItemScan = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = itemBarcode.trim();
    if (!code) return;

    setIsProcessing(true);
    try {
      if (activeTab === 'ISSUE') {
        if (!activeMember) {
          toast.error('Please scan patron card before scanning items.');
          setIsProcessing(false);
          return;
        }

        if (stagedItems.some((item) => item.barcode.toLowerCase() === code.toLowerCase())) {
          toast.warning(`Copy ${code} is already in the checkout queue!`);
          setItemBarcode('');
          focusItemInput();
          setIsProcessing(false);
          return;
        }

        const policySettings = PolicyService.getSettings();
        const maxLoans = policySettings.maxLoans || 5;
        const totalProjected = (activeMember.activeLoansCount || 0) + stagedItems.length + 1;
        if (totalProjected > maxLoans) {
          toast.error(`Loan limit exceeded! Max allowed is ${maxLoans} books under current library policy.`);
          setItemBarcode('');
          setIsProcessing(false);
          return;
        }

        const copy = await CirculationRepository.findCopyByBarcode(code);
        if (!copy) {
          toast.error(`Copy barcode '${code}' not found in library catalog.`);
          setItemBarcode('');
          setIsProcessing(false);
          return;
        }

        if (copy.status !== 'AVAILABLE') {
          toast.error(`Cannot add copy ${code}: currently ${copy.status}.`);
          setItemBarcode('');
          setIsProcessing(false);
          return;
        }

        const allBooks = CatalogRepository.getLocalBooks();
        const book = allBooks.find((b) => b.id === copy.bookId);
        const bookTitle = book ? book.title : `Copy ${code}`;

        setStagedItems((prev) => [
          ...prev,
          {
            barcode: code,
            title: bookTitle,
            materialType: 'PRINT',
          },
        ]);

        toast.success(`Scanned: "${bookTitle}" (${code}) added to queue.`);
        setItemBarcode('');
        focusItemInput();
      } else {
        // Return Flow
        const res = await CirculationRepository.returnCopy(code, 'branch-colombo-hq');

        if (!res.success) {
          toast.error(res.error || 'Return check-in failed.');
        } else {
          const fineMsg = res.fineAmount && res.fineAmount > 0 ? ` (Overdue Fine: LKR ${res.fineAmount})` : '';
          toast.success(`Item ${code} checked in successfully!${fineMsg}`);
          setSessionItems((prev) => [
            {
              barcode: code,
              title: `Copy ${code}`,
              status: 'RETURNED',
              fine: res.fineAmount,
            },
            ...prev,
          ]);
          setItemBarcode('');
          focusItemInput();
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'Operation failed');
    } finally {
      setIsProcessing(false);
    }
  };

  // Final Action: Checkout
  const handleFinalCheckout = async () => {
    if (!activeMember) {
      toast.error('No active patron selected.');
      return;
    }
    if (stagedItems.length === 0) {
      toast.warning('Please scan at least one book copy barcode before checkout.');
      return;
    }

    setIsProcessing(true);
    let successCount = 0;
    const newReceipts: ScannedSessionItem[] = [];

    for (const item of stagedItems) {
      try {
        const res = await CirculationRepository.issueCopy(
          item.barcode,
          activeMember.id,
          'branch-colombo-hq',
          'staff-operator'
        );

        if (res.success) {
          successCount++;
          newReceipts.push({
            barcode: item.barcode,
            title: item.title,
            dueDate: res.dueDate ? new Date(res.dueDate).toLocaleDateString() : '14 Days',
            status: 'ISSUED',
          });
        } else {
          toast.error(`Error issuing ${item.barcode}: ${res.error}`);
        }
      } catch (err: any) {
        toast.error(`Failed to issue ${item.barcode}: ${err.message}`);
      }
    }

    if (successCount > 0) {
      toast.success(`Successfully checked out ${successCount} book(s) for ${activeMember.fullName}!`);
      setActiveMember((prev) =>
        prev ? { ...prev, activeLoansCount: (prev.activeLoansCount || 0) + successCount } : null
      );
      setSessionItems((prev) => [...newReceipts, ...prev]);
      setStagedItems([]);
    }
    setIsProcessing(false);
    focusItemInput();
  };

  return (
    <div className="space-y-6">
      {/* Top Desk Header with Mode Selector */}
      <PageHeader
        title="Circulation Desk Terminal"
        description="High-speed keyboard-first barcode checkout and return terminal"
        actions={
          <div className="flex bg-muted p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('ISSUE')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all min-h-[36px] ${
                activeTab === 'ISSUE'
                  ? 'bg-card text-foreground shadow-subtle'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Check Out (Issue)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('RETURN')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all min-h-[36px] ${
                activeTab === 'RETURN'
                  ? 'bg-card text-foreground shadow-subtle'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Check In (Return)
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Patron Verification */}
        {activeTab === 'ISSUE' && (
          <Card className="md:col-span-1 shadow-card border-border">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <ScanLine className="w-5 h-5 text-primary" />
                <span>1. Identify Patron Card</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Scan digital member barcode or enter Member ID
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 pt-2 space-y-4">
              <form onSubmit={handleMemberScan} className="flex gap-2">
                <Input
                  ref={memberInputRef}
                  placeholder="Scan Patron Card Barcode..."
                  value={memberInput}
                  onChange={handleMemberInputChange}
                  onKeyDown={handleMemberKeyDown}
                  autoFocus
                  className="font-mono text-xs"
                />
                <Button type="submit" disabled={isProcessing} size="sm" className="font-semibold">
                  Find
                </Button>
              </form>

              {activeMember && (
                <div
                  className={`p-4 rounded-xl border space-y-3 text-xs ${
                    activeMember.status === 'SUSPENDED'
                      ? 'bg-danger-soft border-danger/30 text-foreground'
                      : 'bg-primary-soft/40 border-primary/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-foreground flex items-center gap-1.5">
                      {activeMember.status === 'SUSPENDED' ? (
                        <UserX className="w-4 h-4 text-danger" />
                      ) : (
                        <UserCheck className="w-4 h-4 text-success" />
                      )}
                      {activeMember.fullName}
                    </span>
                    <Badge
                      variant={
                        activeMember.status === 'ACTIVE'
                          ? 'success'
                          : activeMember.status === 'SUSPENDED'
                          ? 'danger'
                          : 'warning'
                      }
                      size="sm"
                    >
                      {activeMember.status}
                    </Badge>
                  </div>

                  {/* Red Alert Banner if Suspended */}
                  {activeMember.status === 'SUSPENDED' && (
                    <div className="p-2.5 rounded-lg bg-danger text-danger-foreground font-bold text-xs flex items-center gap-2 shadow-sm">
                      <ShieldAlert className="w-4 h-4 shrink-0" />
                      <span>SUSPENDED ACCOUNT! (අත්හිටවූ ගිණුමකි)</span>
                    </div>
                  )}

                  <div className="text-muted-foreground">
                    Card No: <span className="font-mono font-bold text-foreground">{activeMember.memberIdNumber}</span>
                  </div>
                  <div className="text-muted-foreground">Type: {activeMember.membershipType}</div>
                  <div className="text-muted-foreground">
                    Active Loans: <strong className="text-foreground">{activeMember.activeLoansCount || 0}</strong> /{' '}
                    {PolicyService.getSettings().maxLoans} Max
                  </div>

                  {activeMember.unpaidFinesTotal && activeMember.unpaidFinesTotal > 0 ? (
                    <div className="p-2.5 rounded-lg bg-danger-soft border border-danger/30 text-danger-soft-foreground font-bold flex items-center justify-between shadow-sm">
                      <span className="flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4 text-danger" />
                        Outstanding Late Fine:
                      </span>
                      <span className="font-mono text-sm font-bold">
                        Rs. {activeMember.unpaidFinesTotal.toFixed(2)}
                      </span>
                    </div>
                  ) : null}

                  {/* Clear / Change Patron Button */}
                  <div className="pt-2 border-t border-border flex justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleClearPatron}
                      className="text-xs h-8 gap-1 text-danger hover:bg-danger-soft hover:text-danger"
                    >
                      <UserX className="w-3.5 h-3.5" />
                      Clear Patron
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Right Column: Barcode Scanning Feed */}
        <Card className={activeTab === 'ISSUE' ? 'md:col-span-2 shadow-card' : 'md:col-span-3 shadow-card'}>
          <CardHeader className="p-5 pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <CornerDownLeft className="w-5 h-5 text-primary" />
              <span>
                {activeTab === 'ISSUE' ? '2. Scan Item Copy Barcodes' : 'Scan Returned Item Barcodes'}
              </span>
            </CardTitle>
            <CardDescription className="text-xs">
              {activeTab === 'ISSUE'
                ? 'Scan book barcodes to add to the checkout queue, then confirm checkout'
                : 'Consecutively scan returned item barcodes to process check-in'}
            </CardDescription>
          </CardHeader>

          <CardContent className="p-5 pt-2 space-y-4">
            {/* Barcode input form */}
            <form onSubmit={handleItemScan} className="flex gap-2">
              <Input
                ref={itemInputRef}
                disabled={activeTab === 'ISSUE' && !activeMember}
                placeholder={
                  activeTab === 'ISSUE'
                    ? activeMember
                      ? 'Scan book barcode to add to queue...'
                      : 'Scan patron card first'
                    : 'Scan item barcode to return...'
                }
                value={itemBarcode}
                onChange={(e) => setItemBarcode(e.target.value)}
                autoFocus={activeTab === 'RETURN'}
                className="font-mono text-sm"
              />
              <Button type="submit" disabled={isProcessing || (activeTab === 'ISSUE' && !activeMember)}>
                {activeTab === 'ISSUE' ? 'Add Item' : 'Check In'}
              </Button>
            </form>

            {/* In ISSUE Mode: Scanned Staged Items waiting for checkout */}
            {activeTab === 'ISSUE' && (
              <div className="space-y-3">
                <div className="border border-primary/20 rounded-xl overflow-hidden bg-primary-soft/20">
                  <div className="p-3 bg-primary-soft/50 font-semibold text-xs text-primary flex justify-between items-center">
                    <span className="flex items-center gap-1.5">
                      <ShoppingBag className="w-4 h-4" />
                      Books Ready for Checkout ({stagedItems.length} Scanned)
                    </span>
                    <span className="text-[11px] font-normal text-muted-foreground">
                      * Not added to loans until Check Out is confirmed
                    </span>
                  </div>

                  {stagedItems.length === 0 ? (
                    <div className="p-8 text-center text-xs text-muted-foreground">
                      No books scanned yet. Scan book copy barcodes above to add them to this checkout batch.
                    </div>
                  ) : (
                    <div className="divide-y divide-border bg-card">
                      {stagedItems.map((item, idx) => (
                        <div key={idx} className="p-3.5 flex items-center justify-between text-xs hover:bg-muted/40">
                          <div className="flex items-center gap-3">
                            <BookOpen className="w-4 h-4 text-primary shrink-0" />
                            <div>
                              <div className="font-semibold text-sm text-foreground">{item.title}</div>
                              <div className="text-muted-foreground font-mono">Barcode: {item.barcode}</div>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleRemoveStagedItem(idx)}
                            title="Remove this book from queue"
                            aria-label="Remove book"
                            className="text-muted-foreground hover:text-danger"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* BOTTOM CHECKOUT BUTTON */}
                  {stagedItems.length > 0 && (
                    <div className="p-4 bg-card border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div className="text-xs text-muted-foreground">
                        Ready to issue <strong className="text-foreground">{stagedItems.length}</strong> book(s) to{' '}
                        <strong className="text-primary">{activeMember?.fullName}</strong>.
                      </div>
                      <Button
                        type="button"
                        size="default"
                        disabled={isProcessing}
                        onClick={handleFinalCheckout}
                        variant="success"
                        className="w-full sm:w-auto font-semibold gap-2 shadow-subtle px-6"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Check Out ({stagedItems.length} Books)
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Session Transactions History (Receipts) */}
            <div className="border border-border rounded-xl divide-y divide-border overflow-hidden text-xs mt-4">
              <div className="p-3 bg-muted/60 font-semibold text-muted-foreground flex justify-between">
                <span>Completed Session Receipts ({sessionItems.length} Items)</span>
                <span>Details / Due Date / Action</span>
              </div>
              {sessionItems.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">
                  No completed loans or returns in this desk session yet.
                </div>
              ) : (
                sessionItems.map((item, idx) => (
                  <div key={idx} className="p-3 flex items-center justify-between hover:bg-muted/30">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                      <div>
                        <div className="font-semibold text-sm">{item.title}</div>
                        <div className="text-muted-foreground font-mono">Barcode: {item.barcode}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div>
                        {item.status === 'ISSUED' ? (
                          <Badge variant="info" size="sm">
                            Due: {item.dueDate}
                          </Badge>
                        ) : (
                          <Badge variant="success" size="sm">
                            Returned {item.fine && item.fine > 0 ? `(Fine: LKR ${item.fine})` : '(No Fines)'}
                          </Badge>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleRemoveSessionItem(idx)}
                        title="Remove from receipt history"
                        aria-label="Remove receipt"
                        className="text-muted-foreground hover:text-danger"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
