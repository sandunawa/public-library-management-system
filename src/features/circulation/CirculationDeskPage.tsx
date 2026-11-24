import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  Sparkles,
  QrCode,
  Search,
  Check,
  Library,
  BookMarked,
  ArrowRight,
  Info,
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
    <div className="relative min-h-[calc(100vh-5rem)] -m-4 sm:-m-6 p-4 sm:p-6 lg:p-8 overflow-hidden bg-slate-900 text-slate-800 font-sans selection:bg-blue-500 selection:text-white">
      {/* 1. Atmospheric Library Room Background Layer (Visual Inspiration) */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <img
          src="/images/opac-hero.webp"
          alt="Atmospheric university library"
          className="w-full h-full object-cover object-center scale-105 filter blur-[2px] opacity-25"
        />
        {/* Soft Blue / Cyan ambient radial glow effects */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-500/25 rounded-full filter blur-[100px]" />
        <div className="absolute top-1/4 -right-20 w-96 h-96 bg-cyan-400/20 rounded-full filter blur-[120px]" />
        <div className="absolute -bottom-20 left-1/3 w-[500px] h-[500px] bg-indigo-600/20 rounded-full filter blur-[130px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/70 via-slate-900/50 to-slate-950/80" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-6">
        {/* 2. Premium Header matching reference image */}
        <header className="rounded-2xl backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border border-white/50 dark:border-white/10 shadow-xl p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 w-full md:w-auto">
            {/* Library Logo Emblem */}
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-700 via-blue-600 to-cyan-400 p-0.5 shadow-lg shadow-blue-500/30 flex items-center justify-center shrink-0">
              <div className="w-full h-full bg-white dark:bg-slate-950 rounded-[10px] flex items-center justify-center">
                <BookMarked className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white font-heading">
                  SLIIT Library
                </span>
                <span className="text-[10px] tracking-wider font-semibold text-blue-600 dark:text-blue-400 uppercase bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full border border-blue-200/50 dark:border-blue-800/40">
                  Learn · Explore · Grow
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Circulation Desk Terminal
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                High-speed keyboard-first barcode checkout and return terminal
              </p>
            </div>
          </div>

          {/* Right Mode Switchers & Online Status */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/70 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Library Online</span>
            </div>

            <div className="flex items-center p-1 rounded-xl bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-inner">
              <button
                type="button"
                onClick={() => setActiveTab('ISSUE')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'ISSUE'
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md shadow-blue-500/25'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Check Out (Issue)</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('RETURN')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'RETURN'
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md shadow-blue-500/25'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Check In (Return)</span>
              </button>
            </div>
          </div>
        </header>

        {/* 3. Main Two-Column Working Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT COLUMN: Identify Patron Card (Glassmorphism Card) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="rounded-2xl backdrop-blur-xl bg-white/90 dark:bg-slate-900/90 border border-white/60 dark:border-white/10 shadow-2xl p-6 flex flex-col justify-between overflow-hidden relative">
              {/* Top Accent Gradient Bar */}
              <div className="rounded-xl p-4 bg-gradient-to-r from-blue-600 via-blue-700 to-cyan-500 text-white shadow-lg shadow-blue-600/20 mb-5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/15 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/20">
                  <ScanLine className="w-5 h-5 text-white animate-pulse" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white tracking-wide">1. Identify Patron Card</h2>
                  <p className="text-xs text-blue-100/90">Scan digital member barcode or enter Member ID</p>
                </div>
              </div>

              {/* Barcode Search Box */}
              <form onSubmit={handleMemberScan} className="flex gap-2 mb-6">
                <div className="relative flex-1">
                  <ScanLine className="w-4 h-4 absolute left-3.5 top-3.5 text-blue-500" />
                  <input
                    ref={memberInputRef}
                    placeholder="Scan Patron Card Barcode..."
                    value={memberInput}
                    onChange={handleMemberInputChange}
                    onKeyDown={handleMemberKeyDown}
                    autoFocus
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs font-mono bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all shadow-inner"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isProcessing}
                  size="sm"
                  className="rounded-xl font-bold bg-gradient-to-r from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white shadow-md shadow-blue-700/20 px-4"
                >
                  <Search className="w-3.5 h-3.5 mr-1" />
                  Find
                </Button>
              </form>

              {/* Active Patron Display OR 3D Holographic Card Stage */}
              {activeMember ? (
                <div
                  className={`p-5 rounded-2xl border transition-all shadow-lg ${
                    activeMember.status === 'SUSPENDED'
                      ? 'bg-rose-50/90 dark:bg-rose-950/40 border-rose-300 dark:border-rose-900/60'
                      : 'bg-gradient-to-br from-blue-50/80 via-white to-cyan-50/60 dark:from-slate-800/90 dark:to-slate-900 border-blue-200/80 dark:border-blue-900/50'
                  }`}
                >
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 dark:border-slate-700/60">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-md">
                        {activeMember.fullName.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                          {activeMember.fullName}
                          {activeMember.status === 'ACTIVE' && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          )}
                        </div>
                        <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                          ID: <strong className="text-blue-600 dark:text-blue-400">{activeMember.memberIdNumber}</strong>
                        </div>
                      </div>
                    </div>
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

                  {activeMember.status === 'SUSPENDED' && (
                    <div className="mt-3 p-3 rounded-xl bg-rose-500 text-white font-bold text-xs flex items-center gap-2 shadow-md">
                      <ShieldAlert className="w-4 h-4 shrink-0" />
                      <span>SUSPENDED ACCOUNT! (අත්හිටවූ ගිණුමකි)</span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 mt-4 text-xs">
                    <div className="p-2.5 rounded-xl bg-white/70 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                      <span className="text-[11px] text-slate-400 block">Category</span>
                      <strong className="text-slate-800 dark:text-slate-200">{activeMember.membershipType}</strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/70 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                      <span className="text-[11px] text-slate-400 block">Active Borrowed</span>
                      <strong className="text-blue-600 dark:text-blue-400">
                        {activeMember.activeLoansCount || 0} / {PolicyService.getSettings().maxLoans} Books
                      </strong>
                    </div>
                  </div>

                  {activeMember.unpaidFinesTotal && activeMember.unpaidFinesTotal > 0 ? (
                    <div className="mt-3 p-2.5 rounded-xl bg-rose-100/80 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 font-bold flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-rose-600" />
                        Accrued Overdue Fine:
                      </span>
                      <span className="font-mono text-sm font-black">
                        Rs. {activeMember.unpaidFinesTotal.toFixed(2)}
                      </span>
                    </div>
                  ) : null}

                  <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 flex justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleClearPatron}
                      className="text-xs h-8 gap-1 rounded-xl text-rose-600 border-rose-200 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    >
                      <UserX className="w-3.5 h-3.5" />
                      Clear Patron
                    </Button>
                  </div>
                </div>
              ) : (
                /* Holographic Floating 3D SLIIT Library Card from Reference Image */
                <div className="relative py-8 flex flex-col items-center justify-center">
                  {/* Subtle Light Ring / Pedestal */}
                  <div className="relative w-48 h-12 bg-gradient-to-r from-blue-400/20 via-cyan-400/40 to-blue-400/20 rounded-full flex items-center justify-center shadow-lg shadow-cyan-500/20">
                    <div className="w-40 h-8 bg-gradient-to-r from-blue-500/30 to-cyan-500/30 rounded-full animate-pulse" />
                  </div>

                  {/* 3D Floating Smart Card */}
                  <div className="absolute -top-1 transform -rotate-6 hover:rotate-0 transition-all duration-300 w-56 h-32 rounded-2xl bg-gradient-to-tr from-white via-slate-50 to-blue-50 dark:from-slate-800 dark:via-slate-800/90 dark:to-slate-700 border border-white/80 dark:border-white/20 shadow-2xl p-4 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-blue-600 text-white flex items-center justify-center font-bold text-[10px]">
                          SL
                        </div>
                        <span className="text-[11px] font-extrabold text-slate-800 dark:text-white tracking-tight">
                          SLIIT Library
                        </span>
                      </div>
                      <span className="text-[9px] font-semibold text-blue-600 dark:text-blue-400">SMART PASS</span>
                    </div>

                    <div className="text-center py-1">
                      <div className="text-[9px] uppercase tracking-widest text-slate-400">Patron Card</div>
                      <div className="text-xs font-bold text-slate-700 dark:text-slate-300 font-mono">
                        SCAN TO IDENTIFY
                      </div>
                    </div>

                    {/* Faux Barcode lines */}
                    <div className="flex items-center justify-center gap-0.5 h-4 bg-slate-900/10 dark:bg-white/10 rounded px-2">
                      <div className="w-1 h-3 bg-slate-700 dark:bg-slate-300" />
                      <div className="w-0.5 h-3 bg-slate-700 dark:bg-slate-300" />
                      <div className="w-1.5 h-3 bg-slate-700 dark:bg-slate-300" />
                      <div className="w-0.5 h-3 bg-slate-700 dark:bg-slate-300" />
                      <div className="w-2 h-3 bg-slate-700 dark:bg-slate-300" />
                      <div className="w-1 h-3 bg-slate-700 dark:bg-slate-300" />
                      <div className="w-1.5 h-3 bg-slate-700 dark:bg-slate-300" />
                      <div className="w-0.5 h-3 bg-slate-700 dark:bg-slate-300" />
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 text-center mt-6">
                    Awaiting patron identification. Scan barcode or search above.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Scan Item Copy Barcodes & Staged Books Queue */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <div className="rounded-2xl backdrop-blur-xl bg-white/90 dark:bg-slate-900/90 border border-white/60 dark:border-white/10 shadow-2xl p-6 flex flex-col gap-5">
              {/* Header Accent Banner */}
              <div className="rounded-xl p-4 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-700/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white/15 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/20">
                    <CornerDownLeft className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white tracking-wide">
                      {activeTab === 'ISSUE' ? '2. Scan Item Copy Barcodes' : 'Scan Returned Item Barcodes'}
                    </h2>
                    <p className="text-xs text-blue-100/90">
                      {activeTab === 'ISSUE'
                        ? 'Scan book barcodes to add to the checkout queue, then confirm checkout'
                        : 'Consecutively scan returned item barcodes to process check-in'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Barcode Scan Form */}
              <form onSubmit={handleItemScan} className="flex gap-2">
                <div className="relative flex-1">
                  <ScanLine className="w-4 h-4 absolute left-3.5 top-3.5 text-blue-500" />
                  <input
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
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs font-mono bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all shadow-inner disabled:opacity-50"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isProcessing || (activeTab === 'ISSUE' && !activeMember)}
                  size="sm"
                  className="rounded-xl font-bold bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white shadow-md shadow-blue-600/25 px-5"
                >
                  {activeTab === 'ISSUE' ? '+ Add Item' : 'Check In'}
                </Button>
              </form>

              {/* 7. Books Ready for Checkout Section */}
              {activeTab === 'ISSUE' && (
                <div className="rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/30 overflow-hidden shadow-sm">
                  <div className="p-3.5 bg-blue-50/70 dark:bg-blue-950/40 border-b border-slate-200/80 dark:border-slate-700/80 font-bold text-xs text-blue-900 dark:text-blue-300 flex justify-between items-center">
                    <span className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      Books Ready for Checkout ({stagedItems.length} Scanned)
                    </span>
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      * Not added to loans until Check Out is confirmed
                    </span>
                  </div>

                  {stagedItems.length === 0 ? (
                    <div className="py-12 px-6 flex flex-col items-center justify-center text-center">
                      <div className="w-14 h-14 rounded-2xl bg-blue-100/60 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-3 shadow-inner">
                        <BookOpen className="w-7 h-7" />
                      </div>
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                        No books scanned yet. Scan book copy barcodes above to add them to this checkout batch.
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-200/80 dark:divide-slate-700/80 bg-white dark:bg-slate-900">
                      {stagedItems.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 flex items-center justify-between text-xs hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                              <BookOpen className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="font-bold text-sm text-slate-900 dark:text-white">
                                {item.title}
                              </div>
                              <div className="text-slate-500 font-mono text-[11px]">
                                Barcode: <span className="font-semibold text-slate-700 dark:text-slate-300">{item.barcode}</span>
                              </div>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleRemoveStagedItem(idx)}
                            title="Remove this book from queue"
                            aria-label="Remove book"
                            className="text-slate-400 hover:text-rose-600 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}

                      {/* Checkout Confirm Action Bar */}
                      <div className="p-4 bg-slate-50 dark:bg-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200 dark:border-slate-700">
                        <div className="text-xs text-slate-600 dark:text-slate-300">
                          Ready to issue <strong className="text-slate-900 dark:text-white">{stagedItems.length}</strong> book(s) to{' '}
                          <strong className="text-blue-600 dark:text-blue-400">{activeMember?.fullName}</strong>.
                        </div>
                        <Button
                          type="button"
                          size="default"
                          disabled={isProcessing}
                          onClick={handleFinalCheckout}
                          className="w-full sm:w-auto font-bold gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-600/25 px-6 rounded-xl"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Check Out ({stagedItems.length} Books)
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 8. Completed Session Receipts */}
              <div className="rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/30 overflow-hidden shadow-sm">
                <div className="p-3.5 bg-slate-100/80 dark:bg-slate-800/80 border-b border-slate-200/80 dark:border-slate-700/80 font-bold text-xs text-slate-700 dark:text-slate-300 flex justify-between items-center">
                  <span className="flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-slate-500" />
                    Completed Session Receipts ({sessionItems.length} Items)
                  </span>
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    Details / Due Date / Action
                  </span>
                </div>

                {sessionItems.length === 0 ? (
                  <div className="py-8 px-6 text-center text-xs text-slate-500 dark:text-slate-400">
                    No completed loans or returns in this desk session yet.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-200/80 dark:divide-slate-700/80 bg-white dark:bg-slate-900">
                    {sessionItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 flex items-center justify-between text-xs hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                          <div>
                            <div className="font-bold text-sm text-slate-900 dark:text-white">{item.title}</div>
                            <div className="text-slate-500 font-mono text-[11px]">Barcode: {item.barcode}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {item.status === 'ISSUED' ? (
                            <Badge variant="info" size="sm">
                              Due: {item.dueDate}
                            </Badge>
                          ) : (
                            <Badge variant="success" size="sm">
                              Returned {item.fine && item.fine > 0 ? `(Fine: LKR ${item.fine})` : '(No Fines)'}
                            </Badge>
                          )}
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleRemoveSessionItem(idx)}
                            title="Remove from receipt history"
                            aria-label="Remove receipt"
                            className="text-slate-400 hover:text-rose-600 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Status / Footer matching reference */}
        <footer className="pt-2 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400/90 gap-2">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-slate-300">
            <Info className="w-3.5 h-3.5 text-blue-400" />
            <span>SLIIT Library · Smart Library Management System</span>
          </div>
          <div className="italic text-slate-300 font-serif text-sm tracking-wide">
            Knowledge at Your Fingertips...
          </div>
        </footer>
      </div>
    </div>
  );
};
