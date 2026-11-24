import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Zap,
  Clock,
  ArrowRight,
  Filter,
  EyeOff,
  Keyboard,
  Info,
  Calendar,
  Check,
  BookMarked,
  User,
  CreditCard,
  FileText,
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
  author?: string;
  coverImageUrl?: string;
  materialType?: string;
}

// Completed receipt item
interface ScannedSessionItem {
  id: string;
  barcode: string;
  title: string;
  dueDate?: string;
  status: 'ISSUED' | 'RETURNED';
  timestamp: Date;
  fine?: number;
  memberName?: string;
  hidden?: boolean;
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
  const [activityFilter, setActivityFilter] = useState<'ALL' | 'ISSUED' | 'RETURNED'>('ALL');
  const [isScanFocused, setIsScanFocused] = useState(false);
  const [justCheckedOut, setJustCheckedOut] = useState(false);

  const memberInputRef = useRef<HTMLInputElement | null>(null);
  const itemInputRef = useRef<HTMLInputElement | null>(null);

  // Policy rules
  const policy = useMemo(() => PolicyService.getSettings(), []);
  const maxLoans = policy.maxLoans || 5;
  const loanPeriodDays = policy.loanPeriodDays || 14;

  // Session Statistics derived directly from real transaction state
  const sessionStats = useMemo(() => {
    const issuedCount = sessionItems.filter((i) => i.status === 'ISSUED').length;
    const returnedCount = sessionItems.filter((i) => i.status === 'RETURNED').length;
    const inQueueCount = stagedItems.length;
    return { issuedCount, returnedCount, inQueueCount };
  }, [sessionItems, stagedItems]);

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

  // Hide an item from session activity (with reassurance)
  const handleHideSessionItem = (id: string) => {
    setSessionItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, hidden: true } : item))
    );
    toast.info('Receipt hidden from desk view. Note: The database loan record remains active.');
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
    } else if (e.key === 'Escape') {
      setMemberInput('');
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

        if (activeMember.status === 'SUSPENDED') {
          toast.error('Cannot issue books to a suspended account. Please resolve penalties first.');
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
        const bookAuthor = book && book.authorNames ? book.authorNames.join(', ') : 'Catalogued Item';

        setStagedItems((prev) => [
          ...prev,
          {
            barcode: code,
            title: bookTitle,
            author: bookAuthor,
            coverImageUrl: book?.coverImageUrl,
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
              id: `${Date.now()}-${Math.random()}`,
              barcode: code,
              title: `Copy ${code}`,
              status: 'RETURNED',
              fine: res.fineAmount,
              timestamp: new Date(),
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

  const handleItemKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setItemBarcode('');
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
    const remainingItems: StagedCartItem[] = [];

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
            id: `${Date.now()}-${Math.random()}`,
            barcode: item.barcode,
            title: item.title,
            dueDate: res.dueDate ? new Date(res.dueDate).toLocaleDateString() : `${loanPeriodDays} Days`,
            status: 'ISSUED',
            memberName: activeMember.fullName,
            timestamp: new Date(),
          });
        } else {
          toast.error(`Error issuing ${item.barcode}: ${res.error}`);
          remainingItems.push(item);
        }
      } catch (err: any) {
        toast.error(`Failed to issue ${item.barcode}: ${err.message}`);
        remainingItems.push(item);
      }
    }

    if (successCount > 0) {
      toast.success(`Successfully checked out ${successCount} book(s) for ${activeMember.fullName}!`);
      setJustCheckedOut(true);
      setTimeout(() => setJustCheckedOut(false), 2000);
      setActiveMember((prev) =>
        prev ? { ...prev, activeLoansCount: (prev.activeLoansCount || 0) + successCount } : null
      );
      setSessionItems((prev) => [...newReceipts, ...prev]);
      setStagedItems(remainingItems);
    }
    setIsProcessing(false);
    focusItemInput();
  };

  // Filtered session receipts
  const visibleSessionItems = useMemo(() => {
    return sessionItems.filter((item) => {
      if (item.hidden) return false;
      if (activityFilter === 'ISSUED') return item.status === 'ISSUED';
      if (activityFilter === 'RETURNED') return item.status === 'RETURNED';
      return true;
    });
  }, [sessionItems, activityFilter]);

  // Initials for patron avatar
  const patronInitials = useMemo(() => {
    if (!activeMember || !activeMember.fullName) return '??';
    const names = activeMember.fullName.trim().split(/\s+/);
    const firstName = names[0] || '';
    const lastName = names.length > 1 ? names[names.length - 1] || '' : '';
    if (!lastName) return firstName.substring(0, 2).toUpperCase() || '??';
    return (firstName[0] || '') + (lastName[0] || '').toUpperCase();
  }, [activeMember]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 max-w-7xl mx-auto"
      style={{
        color: '#242335',
      }}
    >
      {/* 1. Header with Eyebrow and Segmented Mode Selector */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-[#E6E3EE]">
        <div>
          <span className="text-[11px] font-bold tracking-widest text-[#7654D7] uppercase block mb-1">
            DAILY OPERATIONS
          </span>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-[#242335] font-heading">
            Circulation desk.
          </h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            A smoother chapter for every checkout.
          </p>
        </div>

        {/* Mode Selector Segmented Control */}
        <div
          role="tablist"
          aria-label="Circulation terminal mode"
          className="inline-flex bg-[#F1F0F7] p-1.5 rounded-2xl border border-[#E6E3EE] self-start md:self-auto"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'ISSUE'}
            onClick={() => setActiveTab('ISSUE')}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all min-h-[44px] flex items-center gap-2 ${
              activeTab === 'ISSUE'
                ? 'bg-white text-[#7654D7] shadow-sm font-bold'
                : 'text-muted-foreground hover:text-[#242335]'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            Check out
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'RETURN'}
            onClick={() => setActiveTab('RETURN')}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all min-h-[44px] flex items-center gap-2 ${
              activeTab === 'RETURN'
                ? 'bg-white text-[#7654D7] shadow-sm font-bold'
                : 'text-muted-foreground hover:text-[#242335]'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            Check in
          </button>
        </div>
      </div>

      {/* 2. Three Summary Cards with solid black border & blinking hover effect */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Issued this session */}
        <div className="bg-white rounded-2xl p-5 border-2 border-black shadow-sm flex items-center justify-between hover-border-blink transition-all duration-200 cursor-pointer">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-foreground block">
              Issued this session
            </span>
            <span className="text-3xl font-extrabold text-[#242335] font-mono">
              {sessionStats.issuedCount}
            </span>
            <span className="text-xs text-muted-foreground block">
              Books loaned to patrons
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#F4F1FD] text-[#7654D7] flex items-center justify-center shrink-0">
            <BookMarked className="w-6 h-6" />
          </div>
        </div>

        {/* Returned this session */}
        <div className="bg-white rounded-2xl p-5 border-2 border-black shadow-sm flex items-center justify-between hover-border-blink transition-all duration-200 cursor-pointer">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-foreground block">
              Returned this session
            </span>
            <span className="text-3xl font-extrabold text-[#242335] font-mono">
              {sessionStats.returnedCount}
            </span>
            <span className="text-xs text-muted-foreground block">
              Copies checked back into inventory
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#EDF9F3] text-[#15803D] flex items-center justify-center shrink-0">
            <RotateCcw className="w-6 h-6" />
          </div>
        </div>

        {/* In checkout queue */}
        <div className="bg-white rounded-2xl p-5 border-2 border-black shadow-sm flex items-center justify-between hover-border-blink transition-all duration-200 cursor-pointer">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-foreground block">
              In checkout queue
            </span>
            <span className="text-3xl font-extrabold text-[#7654D7] font-mono">
              {sessionStats.inQueueCount}
            </span>
            <span className="text-xs text-muted-foreground block">
              Awaiting confirmation
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#F4F1FD] text-[#7654D7] flex items-center justify-center shrink-0">
            <ShoppingBag className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 3. Desktop Two-Column Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Identify Patron */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl p-6 border-2 border-black shadow-sm space-y-5 hover-border-blink transition-all duration-200">
            <div>
              <h2 className="text-base font-bold text-[#242335] flex items-center gap-2">
                <ScanLine className="w-4 h-4 text-[#7654D7]" />
                Identify patron
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Scan digital member barcode, enter ID, or email
              </p>
            </div>

            {/* Member Lookup Form */}
            <form onSubmit={handleMemberScan} className="flex gap-2">
              <div className="relative flex-1">
                <input
                  ref={memberInputRef}
                  type="text"
                  placeholder="Scan or enter patron ID/email..."
                  value={memberInput}
                  onChange={handleMemberInputChange}
                  onKeyDown={handleMemberKeyDown}
                  autoFocus
                  aria-label="Patron barcode or ID"
                  className="w-full px-4 py-2.5 bg-[#F9F9FC] border border-[#E6E3EE] rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#7654D7]/20 focus:border-[#7654D7] transition-all min-h-[44px]"
                />
              </div>
              <button
                type="submit"
                disabled={isProcessing}
                className="px-5 py-2.5 bg-[#7654D7] hover:bg-[#6542C6] active:scale-[0.98] text-white text-sm font-semibold rounded-xl transition-all shadow-sm min-h-[44px]"
              >
                Find
              </button>
            </form>

            {/* Patron Detail Card or Empty State */}
            <AnimatePresence mode="wait">
              {activeMember ? (
                <motion.div
                  key={activeMember.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                  className={`p-5 rounded-2xl border space-y-4 ${
                    activeMember.status === 'SUSPENDED'
                      ? 'bg-[#FEF2F2] border-[#FCA5A5]'
                      : 'bg-[#F9F8FD] border-[#EAE6F5]'
                  }`}
                >
                  {/* Avatar & Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-[#7654D7] text-white flex items-center justify-center font-bold text-base shadow-sm">
                        {patronInitials}
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-[#242335] leading-tight">
                          {activeMember.fullName}
                        </h3>
                        <div className="text-xs font-mono text-muted-foreground mt-0.5">
                          ID: <strong className="text-[#242335]">{activeMember.memberIdNumber}</strong>
                        </div>
                      </div>
                    </div>

                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                        activeMember.status === 'ACTIVE'
                          ? 'bg-[#EDF9F3] text-[#15803D]'
                          : activeMember.status === 'SUSPENDED'
                          ? 'bg-[#FEE2E2] text-[#B91C1C]'
                          : 'bg-[#FEF3C7] text-[#B45309]'
                      }`}
                    >
                      {activeMember.status}
                    </span>
                  </div>

                  {/* Suspended Warning */}
                  {activeMember.status === 'SUSPENDED' && (
                    <div className="p-3 bg-[#DC2626] text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm">
                      <ShieldAlert className="w-4 h-4 shrink-0" />
                      <span>SUSPENDED ACCOUNT — Loan privileges suspended</span>
                    </div>
                  )}

                  {/* Key Stats: Membership & Loans */}
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#E6E3EE]/60 text-xs">
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Membership</span>
                      <strong className="text-[#242335] font-semibold">{activeMember.membershipType}</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Active Loans</span>
                      <strong className="text-[#242335] font-semibold">
                        {activeMember.activeLoansCount || 0} / {maxLoans} Max
                      </strong>
                    </div>
                  </div>

                  {/* Segmented Loan Utilization Indicator */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[11px] font-semibold text-muted-foreground">
                      <span>Loan quota utilization</span>
                      <span>
                        {Math.min(
                          100,
                          Math.round(((activeMember.activeLoansCount || 0) / maxLoans) * 100)
                        )}
                        %
                      </span>
                    </div>
                    <div className="grid grid-cols-5 gap-1.5 h-2">
                      {Array.from({ length: maxLoans }).map((_, i) => {
                        const isBorrowed = i < (activeMember.activeLoansCount || 0);
                        const isStaged =
                          i >= (activeMember.activeLoansCount || 0) &&
                          i < (activeMember.activeLoansCount || 0) + stagedItems.length;

                        return (
                          <div
                            key={i}
                            className={`rounded-full h-full transition-all ${
                              isBorrowed
                                ? 'bg-[#7654D7]'
                                : isStaged
                                ? 'bg-[#A78BFA]'
                                : 'bg-[#E5E3ED]'
                            }`}
                          />
                        );
                      })}
                    </div>
                  </div>

                  {/* Fines Indicator */}
                  {activeMember.unpaidFinesTotal && activeMember.unpaidFinesTotal > 0 ? (
                    <div className="p-3 rounded-xl bg-[#FEF2F2] border border-[#FECACA] flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#B91C1C] flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Outstanding fine:
                      </span>
                      <span className="font-mono font-bold text-[#B91C1C]">
                        LKR {activeMember.unpaidFinesTotal.toFixed(2)}
                      </span>
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-xl bg-[#EDF9F3] text-[#15803D] text-xs font-semibold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-[#15803D]" />
                      <span>Good standing — zero overdue fines</span>
                    </div>
                  )}

                  {/* Change Patron Action */}
                  <div className="pt-2 border-t border-[#E6E3EE]/60 flex justify-end">
                    <button
                      type="button"
                      onClick={handleClearPatron}
                      className="text-xs text-muted-foreground hover:text-[#B91C1C] flex items-center gap-1 py-1 font-medium transition-colors min-h-[36px]"
                    >
                      <UserX className="w-3.5 h-3.5" />
                      Change patron
                    </button>
                  </div>
                </motion.div>
              ) : (
                <div className="p-8 text-center rounded-2xl border-2 border-dashed border-[#E6E3EE] bg-[#FAF9FC] space-y-2">
                  <div className="w-10 h-10 rounded-full bg-[#F1EFF9] text-[#7654D7] mx-auto flex items-center justify-center">
                    <User className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-semibold text-[#242335]">No patron identified yet</p>
                  <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                    Scan a student or member ID barcode above to begin processing a transaction batch.
                  </p>
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* Keyboard Workflow Tip Card */}
          <div className="bg-[#FAF9FC] rounded-2xl p-4 border-2 border-black text-xs text-muted-foreground flex items-start gap-3 hover-border-blink transition-all duration-200">
            <Keyboard className="w-4 h-4 text-[#7654D7] shrink-0 mt-0.5" />
            <div>
              <strong className="text-[#242335] block mb-0.5">Desk Workflow Tip:</strong>
              Press <kbd className="px-1.5 py-0.5 bg-white border border-[#E6E3EE] rounded font-mono text-[10px]">Enter</kbd> after scanning to auto-advance. Press <kbd className="px-1.5 py-0.5 bg-white border border-[#E6E3EE] rounded font-mono text-[10px]">Esc</kbd> to quickly clear input.
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Scan & Checkout */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-2xl p-6 border-2 border-black shadow-sm space-y-5 hover-border-blink transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-[#242335] flex items-center gap-2">
                  <CornerDownLeft className="w-4 h-4 text-[#7654D7]" />
                  {activeTab === 'ISSUE' ? 'Scan & checkout' : 'Check in returned items'}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {activeTab === 'ISSUE'
                    ? 'Scan copy barcode to stage items in checkout queue'
                    : 'Scan item barcodes continuously to mark returns and check for fines'}
                </p>
              </div>

              {/* Scanner Ready Indicator */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EDF9F3] text-[#15803D] text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-[#15803D] animate-pulse" />
                <span>Scanner ready</span>
              </div>
            </div>

            {/* Barcode Input Form */}
            <form onSubmit={handleItemScan} className="flex gap-2">
              <div className="relative flex-1">
                <input
                  ref={itemInputRef}
                  type="text"
                  disabled={activeTab === 'ISSUE' && !activeMember}
                  placeholder={
                    activeTab === 'ISSUE'
                      ? activeMember
                        ? 'Scan book copy barcode to add to queue...'
                        : 'Please identify patron first'
                      : 'Scan returned book barcode...'
                  }
                  value={itemBarcode}
                  onChange={(e) => setItemBarcode(e.target.value)}
                  onKeyDown={handleItemKeyDown}
                  onFocus={() => setIsScanFocused(true)}
                  onBlur={() => setIsScanFocused(false)}
                  autoFocus={activeTab === 'RETURN'}
                  aria-label="Book copy barcode"
                  className="w-full px-4 py-2.5 bg-[#F9F9FC] border border-[#E6E3EE] rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#7654D7]/20 focus:border-[#7654D7] transition-all min-h-[44px] disabled:opacity-60"
                />
              </div>
              <button
                type="submit"
                disabled={isProcessing || (activeTab === 'ISSUE' && !activeMember)}
                className="px-6 py-2.5 bg-[#7654D7] hover:bg-[#6542C6] active:scale-[0.98] disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all shadow-sm min-h-[44px]"
              >
                {activeTab === 'ISSUE' ? 'Add item' : 'Check in'}
              </button>
            </form>

            {/* ISSUE MODE: Checkout Queue */}
            {activeTab === 'ISSUE' && (
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground pb-2 border-b border-[#E6E3EE]">
                  <span>Items in queue ({stagedItems.length})</span>
                  <span>Standard loan period: {loanPeriodDays} days</span>
                </div>

                {stagedItems.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl border-2 border-dashed border-[#E6E3EE] bg-[#FAF9FC] space-y-2">
                    <div className="w-10 h-10 rounded-full bg-[#F1EFF9] text-[#7654D7] mx-auto flex items-center justify-center">
                      <ShoppingBag className="w-5 h-5" />
                    </div>
                    <p className="text-sm font-semibold text-[#242335]">Checkout queue is empty</p>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                      Scan book barcodes with a barcode gun or type copy barcodes above to add them to this patron checkout batch.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    <AnimatePresence>
                      {stagedItems.map((item, idx) => (
                        <motion.div
                          key={item.barcode + idx}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 8, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="p-3.5 bg-[#FAF9FC] hover:bg-[#F4F1FD] border border-[#E6E3EE] rounded-xl flex items-center justify-between transition-colors text-xs"
                        >
                          <div className="flex items-center gap-3">
                            {item.coverImageUrl ? (
                              <img
                                src={item.coverImageUrl}
                                alt=""
                                className="w-9 h-12 object-cover rounded shadow-xs shrink-0"
                              />
                            ) : (
                              <div className="w-9 h-12 rounded bg-[#EAE6F5] text-[#7654D7] flex items-center justify-center font-bold text-xs shrink-0">
                                <BookOpen className="w-4 h-4" />
                              </div>
                            )}
                            <div>
                              <h4 className="font-bold text-sm text-[#242335] leading-snug">
                                {item.title}
                              </h4>
                              <p className="text-muted-foreground text-[11px] mt-0.5">
                                {item.author || 'Catalog Item'} • Barcode:{' '}
                                <span className="font-mono font-semibold text-[#242335]">
                                  {item.barcode}
                                </span>
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveStagedItem(idx)}
                            aria-label={`Remove ${item.title}`}
                            className="p-2 text-muted-foreground hover:text-[#B91C1C] hover:bg-[#FEE2E2] rounded-lg transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </motion.div>
                      ))}
                    </AnimatePresence>

                    {/* Bottom Queue Total & Confirm Checkout Button */}
                    <div className="pt-4 border-t border-[#E6E3EE] flex flex-col sm:flex-row items-center justify-between gap-3 bg-white">
                      <div className="text-xs text-muted-foreground">
                        Ready to issue <strong className="text-[#242335]">{stagedItems.length}</strong> book(s) to{' '}
                        <strong className="text-[#7654D7]">{activeMember?.fullName}</strong>.
                      </div>

                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={handleFinalCheckout}
                        className={`w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-sm flex items-center justify-center gap-2 min-h-[44px] ${
                          justCheckedOut
                            ? 'bg-[#15803D] text-white'
                            : 'bg-[#7654D7] hover:bg-[#6542C6] text-white active:scale-[0.98]'
                        }`}
                      >
                        {justCheckedOut ? (
                          <>
                            <Check className="w-4 h-4" />
                            Checked out!
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            Confirm checkout ({stagedItems.length} items)
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. Session Activity Table Below */}
      <div className="bg-white rounded-2xl p-6 border-2 border-black shadow-sm space-y-4 hover-border-blink transition-all duration-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E6E3EE]">
          <div>
            <h3 className="text-base font-bold text-[#242335] flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#7654D7]" />
              Session activity
            </h3>
            <p className="text-xs text-muted-foreground">
              Audit log of loans issued and returns processed in this browser session
            </p>
          </div>

          {/* Filter Pills */}
          <div className="inline-flex bg-[#F1F0F7] p-1 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActivityFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activityFilter === 'ALL'
                  ? 'bg-white text-[#7654D7] shadow-xs'
                  : 'text-muted-foreground hover:text-[#242335]'
              }`}
            >
              All ({sessionItems.filter((i) => !i.hidden).length})
            </button>
            <button
              type="button"
              onClick={() => setActivityFilter('ISSUED')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activityFilter === 'ISSUED'
                  ? 'bg-white text-[#7654D7] shadow-xs'
                  : 'text-muted-foreground hover:text-[#242335]'
              }`}
            >
              Checkouts
            </button>
            <button
              type="button"
              onClick={() => setActivityFilter('RETURNED')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activityFilter === 'RETURNED'
                  ? 'bg-white text-[#7654D7] shadow-xs'
                  : 'text-muted-foreground hover:text-[#242335]'
              }`}
            >
              Returns
            </button>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#FAF9FC] text-muted-foreground border-b border-[#E6E3EE] font-semibold">
                <th className="p-3.5">Title & details</th>
                <th className="p-3.5">Barcode</th>
                <th className="p-3.5">Transaction</th>
                <th className="p-3.5">Due date / status</th>
                <th className="p-3.5">Time</th>
                <th className="p-3.5 text-right">Receipt action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6E3EE]">
              {visibleSessionItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground text-xs">
                    No transactions recorded for the selected filter yet.
                  </td>
                </tr>
              ) : (
                visibleSessionItems.map((item) => (
                  <tr key={item.id} className="hover:bg-[#FAF9FC] transition-colors">
                    <td className="p-3.5">
                      <div className="font-bold text-sm text-[#242335]">{item.title}</div>
                      {item.memberName && (
                        <div className="text-[11px] text-muted-foreground">
                          Borrower: <span className="font-medium text-[#242335]">{item.memberName}</span>
                        </div>
                      )}
                    </td>
                    <td className="p-3.5 font-mono text-muted-foreground font-semibold">
                      {item.barcode}
                    </td>
                    <td className="p-3.5">
                      {item.status === 'ISSUED' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#F4F1FD] text-[#7654D7] font-semibold text-[11px]">
                          <ShoppingBag className="w-3 h-3" />
                          Checkout
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#EDF9F3] text-[#15803D] font-semibold text-[11px]">
                          <RotateCcw className="w-3 h-3" />
                          Return
                        </span>
                      )}
                    </td>
                    <td className="p-3.5">
                      {item.status === 'ISSUED' ? (
                        <span className="font-mono text-[#242335] font-semibold">
                          Due: {item.dueDate}
                        </span>
                      ) : (
                        <span className="font-semibold text-[#15803D]">
                          Returned {item.fine && item.fine > 0 ? `(Fine: LKR ${item.fine})` : '(No Fines)'}
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-muted-foreground font-mono text-[11px]">
                      {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => handleHideSessionItem(item.id)}
                        title="Hide receipt line"
                        className="p-1.5 text-muted-foreground hover:text-[#B91C1C] hover:bg-[#FEE2E2] rounded-lg transition-colors inline-flex items-center gap-1 min-h-[32px]"
                      >
                        <EyeOff className="w-3.5 h-3.5" />
                        <span className="text-[11px]">Hide</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
};
