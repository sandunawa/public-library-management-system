import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScanLine, CheckCircle2, CornerDownLeft, Undo2, ArrowLeftRight, UserX, Trash2, UserCheck, BookOpen, ShoppingBag, ArrowRight, ShieldAlert, AlertTriangle } from 'lucide-react';
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
    setStagedItems([]); // Clear unconfirmed staged items
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

  // Step 1: Patron Lookup (Supports Enter, Submit & Barcode Reader Wedge)
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

  // Keyboard wedge scanner listener: catches Enter key from scanner instantly!
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

  // Auto-detect Barcode Reader Scanner for Patron ID Card
  const handleMemberInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setMemberInput(val);
    const clean = val.replace(/[^a-zA-Z0-9-]/g, '').trim();

    // Barcodes like LIB-MEM-2026081 or numeric scanner feeds
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

        // Check if barcode already added to this staged list
        if (stagedItems.some((item) => item.barcode.toLowerCase() === code.toLowerCase())) {
          toast.warning(`Copy ${code} is already in the checkout queue!`);
          setItemBarcode('');
          focusItemInput();
          setIsProcessing(false);
          return;
        }

        // Check dynamic borrow limits from Policy & Settings
        const policySettings = PolicyService.getSettings();
        const maxLoans = policySettings.maxLoans || 5;
        const totalProjected = (activeMember.activeLoansCount || 0) + stagedItems.length + 1;
        if (totalProjected > maxLoans) {
          toast.error(`Loan limit exceeded! Max allowed is ${maxLoans} books under current library policy.`);
          setItemBarcode('');
          setIsProcessing(false);
          return;
        }

        // Verify copy exists in inventory and is AVAILABLE
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

        // Retrieve book title
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
        // Return Flow (Instant check-in)
        const res = await CirculationRepository.returnCopy(
          code,
          'branch-colombo-hq'
        );

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

  // Final Action: Checkout all staged books at once!
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
      // Update local activeMember count
      setActiveMember((prev) =>
        prev ? { ...prev, activeLoansCount: (prev.activeLoansCount || 0) + successCount } : null
      );
      setSessionItems((prev) => [...newReceipts, ...prev]);
      setStagedItems([]); // Clear queue after successful checkout
    }
    setIsProcessing(false);
    focusItemInput();
  };

  return (
    <div className="space-y-6">
      {/* Top Desk Header with Mode Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-foreground">Circulation Desk Terminal</h1>
          <p className="text-sm text-muted-foreground">High-speed keyboard-first barcode checkout and return mode</p>
        </div>

        {/* Issue / Return Toggle */}
        <div className="flex bg-muted p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('ISSUE')}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'ISSUE' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground'
            }`}
          >
            Check Out (Issue)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('RETURN')}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'RETURN' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground'
            }`}
          >
            Check In (Return)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Patron Verification (Required for Issue) */}
        {activeTab === 'ISSUE' && (
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle className="text-base flex items-center space-x-2">
                <ScanLine className="w-5 h-5 text-primary" />
                <span>1. Identify Patron Card</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Scan member digital barcode or enter Member ID
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleMemberScan} className="flex gap-2">
                <Input
                  ref={memberInputRef}
                  placeholder="Scan Patron Card Barcode..."
                  value={memberInput}
                  onChange={handleMemberInputChange}
                  onKeyDown={handleMemberKeyDown}
                  autoFocus
                  className="font-mono text-xs border-primary/50 focus:border-primary ring-1 ring-primary/20"
                />
                <Button type="submit" disabled={isProcessing} className="text-xs font-semibold">
                  Find
                </Button>
              </form>

              {activeMember && (
                <div className={`p-4 rounded-xl border space-y-3 text-xs ${
                  activeMember.status === 'SUSPENDED'
                    ? 'bg-rose-500/10 border-rose-500/40 text-foreground ring-2 ring-rose-500/30'
                    : 'bg-primary/5 border-primary/20'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-foreground flex items-center gap-1.5">
                      {activeMember.status === 'SUSPENDED' ? (
                        <UserX className="w-4 h-4 text-rose-600" />
                      ) : (
                        <UserCheck className="w-4 h-4 text-emerald-600" />
                      )}
                      {activeMember.fullName}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded font-bold uppercase ${
                        activeMember.status === 'ACTIVE'
                          ? 'bg-emerald-500/10 text-emerald-600'
                          : activeMember.status === 'SUSPENDED'
                          ? 'bg-rose-600 text-white animate-pulse'
                          : 'bg-amber-500/10 text-amber-600'
                      }`}
                    >
                      {activeMember.status}
                    </span>
                  </div>

                  {/* Red Alert Banner if Suspended */}
                  {activeMember.status === 'SUSPENDED' && (
                    <div className="p-2.5 rounded-lg bg-rose-600 text-white font-bold text-xs flex items-center gap-2 shadow-sm">
                      <ShieldAlert className="w-4 h-4 shrink-0" />
                      <span>SUSPENDED ACCOUNT! (අත්හිටවූ ගිණුමකි - පොත් නිකුත් කළ නොහැක)</span>
                    </div>
                  )}

                  <div className="text-muted-foreground">Card No: <span className="font-mono font-bold text-foreground">{activeMember.memberIdNumber}</span></div>
                  <div className="text-muted-foreground">Type: {activeMember.membershipType}</div>
                  <div className="text-muted-foreground">
                    Active Loans: <strong className="text-foreground">{activeMember.activeLoansCount || 0}</strong> / {PolicyService.getSettings().maxLoans} Max
                  </div>

                  {/* Late Fine Warning if member has outstanding fines */}
                  {(activeMember.unpaidFinesTotal && activeMember.unpaidFinesTotal > 0) ? (
                    <div className="p-2.5 rounded-lg bg-rose-500/15 border-2 border-rose-500/40 text-rose-800 dark:text-rose-200 font-bold flex items-center justify-between shadow-sm">
                      <span className="flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4 text-rose-600" />
                        Outstanding Late Fine (හිඟ දඩ මුදල):
                      </span>
                      <span className="font-mono text-base font-extrabold text-rose-700 dark:text-rose-300">
                        Rs. {activeMember.unpaidFinesTotal.toFixed(2)}
                      </span>
                    </div>
                  ) : null}

                  {/* Clear / Change Patron Button */}
                  <div className="pt-2 border-t border-primary/10 flex justify-end">
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={handleClearPatron}
                      className="text-xs h-7 gap-1"
                    >
                      <UserX className="w-3.5 h-3.5" />
                      Clear / Change Patron
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Right Column: Barcode Scanning Feed */}
        <Card className={activeTab === 'ISSUE' ? 'md:col-span-2' : 'md:col-span-3'}>
          <CardHeader>
            <CardTitle className="text-base flex items-center space-x-2">
              <CornerDownLeft className="w-5 h-5 text-primary" />
              <span>
                {activeTab === 'ISSUE' ? '2. Scan Item Copy Barcodes' : 'Scan Returned Item Barcodes'}
              </span>
            </CardTitle>
            <CardDescription className="text-xs">
              {activeTab === 'ISSUE'
                ? 'Scan all book barcodes to add to the checkout queue, then click "Complete Check Out" at the bottom'
                : 'Consecutively scan returned item barcodes to process check-in'}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
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
                <div className="border-2 border-dashed border-primary/20 rounded-xl overflow-hidden bg-primary/5">
                  <div className="p-3 bg-primary/10 font-semibold uppercase tracking-wider text-xs text-primary flex justify-between items-center">
                    <span className="flex items-center gap-1.5">
                      <ShoppingBag className="w-4 h-4" />
                      Books Ready for Checkout ({stagedItems.length} Scanned)
                    </span>
                    <span className="text-[11px] font-normal lowercase text-muted-foreground">
                      * Not added to loans until Checkout button is clicked
                    </span>
                  </div>

                  {stagedItems.length === 0 ? (
                    <div className="p-6 text-center text-xs text-muted-foreground">
                      No books scanned yet. Scan book copy barcodes above to add them to this checkout batch.
                    </div>
                  ) : (
                    <div className="divide-y divide-primary/10">
                      {stagedItems.map((item, idx) => (
                        <div key={idx} className="p-3 flex items-center justify-between text-xs hover:bg-primary/5">
                          <div className="flex items-center space-x-3">
                            <BookOpen className="w-4 h-4 text-primary shrink-0" />
                            <div>
                              <div className="font-semibold text-sm text-foreground">{item.title}</div>
                              <div className="text-muted-foreground font-mono">Barcode: {item.barcode}</div>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveStagedItem(idx)}
                            title="Remove this book from queue"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* BOTTOM CHECKOUT BUTTON */}
                  {stagedItems.length > 0 && (
                    <div className="p-3 bg-background border-t border-primary/20 flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div className="text-xs text-muted-foreground">
                        Ready to issue <strong className="text-foreground">{stagedItems.length}</strong> book(s) to <strong className="text-primary">{activeMember?.fullName}</strong>.
                      </div>
                      <Button
                        type="button"
                        size="default"
                        disabled={isProcessing}
                        onClick={handleFinalCheckout}
                        className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 shadow-md px-6"
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
            <div className="border rounded-xl divide-y overflow-hidden text-xs mt-4">
              <div className="p-3 bg-muted font-semibold uppercase tracking-wider text-muted-foreground flex justify-between">
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
                    <div className="flex items-center space-x-3">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <div className="font-semibold text-sm">{item.title}</div>
                        <div className="text-muted-foreground font-mono">Barcode: {item.barcode}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div>
                        {item.status === 'ISSUED' ? (
                          <span className="font-semibold text-primary">Due: {item.dueDate}</span>
                        ) : (
                          <span className="font-semibold text-emerald-600">
                            Returned {item.fine && item.fine > 0 ? `(Fine: LKR ${item.fine})` : '(No Fines)'}
                          </span>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveSessionItem(idx)}
                        title="Remove / Void from receipt history"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
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
