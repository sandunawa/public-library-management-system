import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { BookOpen, Users, Clock, CreditCard, ArrowUpRight, TrendingUp, AlertTriangle, CloudUpload, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CatalogRepository } from '@/services/repositories/CatalogRepository';
import { LocalAuthService } from '@/services/auth/LocalAuthService';
import { FirebaseSyncService } from '@/services/firebase/FirebaseSyncService';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { toast } from 'sonner';

export const StaffDashboardPage: React.FC = () => {
  const [stats, setStats] = useState({
    totalBooks: 0,
    totalMembers: 0,
    activeLoans: 0,
    pendingApprovals: 0,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Instant zero-delay memory stats calculation
    const books = CatalogRepository.getLocalBooks();
    const members = LocalAuthService.getAllMembers();
    const pending = members.filter((m) => m.status === 'PENDING').length;
    const activeLoans = members.reduce((sum, m) => sum + (m.activeLoansCount || 0), 0);

    setStats({
      totalBooks: books.length,
      totalMembers: members.length,
      activeLoans: activeLoans,
      pendingApprovals: pending,
    });
  }, []);

  // Circulation activity sample dataset for analytics
  const circulationData = [
    { day: 'Mon', loans: 42, returns: 35 },
    { day: 'Tue', loans: 55, returns: 48 },
    { day: 'Wed', loans: 68, returns: 52 },
    { day: 'Thu', loans: 50, returns: 46 },
    { day: 'Fri', loans: 78, returns: 60 },
    { day: 'Sat', loans: 95, returns: 80 },
    { day: 'Sun', loans: 25, returns: 20 },
  ];

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncStatusText, setSyncStatusText] = useState('');

  const handleSyncToFirebase = async () => {
    setIsSyncing(true);
    setSyncProgress(0);
    setSyncStatusText('Initializing connection to Firebase...');
    toast.info('Starting full sync to Cloud Firestore (libraryos-app-9fc34)...');

    try {
      const res = await FirebaseSyncService.syncAllToCloudFirestore((percent, status) => {
        setSyncProgress(percent);
        setSyncStatusText(status);
      });

      toast.success(
        `Firebase Cloud Synced! ${res.booksCount} Books, ${res.copiesCount} Barcodes, and ${res.membersCount} Members saved to Firestore.`
      );
      setTimeout(() => {
        setIsSyncing(false);
        setSyncProgress(0);
      }, 1500);
    } catch (err: any) {
      toast.error(err.message || 'Firestore sync encountered an error.');
      setIsSyncing(false);
      setSyncProgress(0);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-foreground">Library Operations Dashboard</h1>
          <p className="text-xs text-muted-foreground">
            Connected to Firebase Project: <strong className="text-primary">libraryos-app-9fc34</strong>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            onClick={handleSyncToFirebase}
            disabled={isSyncing}
            className="text-xs font-bold gap-2 bg-primary text-primary-foreground shadow-md hover:opacity-90 min-w-[200px]"
          >
            <CloudUpload className={`w-4 h-4 ${isSyncing ? 'animate-bounce' : ''}`} />
            <span>
              {isSyncing ? `Uploading... ${syncProgress}%` : 'Upload Data to Firebase'}
            </span>
          </Button>

          <div className="text-xs font-semibold px-2.5 py-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 rounded-full flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Live Project Active</span>
          </div>
        </div>
      </div>

      {/* Progress Bar Display when syncing (0% to 100%) */}
      {isSyncing && (
        <Card className="p-4 bg-primary/5 border border-primary/20 shadow-sm animate-in fade-in">
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-primary flex items-center gap-1.5">
                <CloudUpload className="w-4 h-4 animate-spin" />
                <span>{syncStatusText}</span>
              </span>
              <span className="font-mono text-sm font-black text-primary">{syncProgress}%</span>
            </div>
            {/* Visual Progress Bar Track */}
            <div className="w-full h-3 bg-muted rounded-full overflow-hidden p-0.5 border">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300 ease-out shadow-sm"
                style={{ width: `${syncProgress}%` }}
              ></div>
            </div>
          </div>
        </Card>
      )}

      {/* Bento Grid: 4 Metric Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Catalogued Titles</CardTitle>
            <BookOpen className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-bold">{loading ? '...' : stats.totalBooks}</div>
            <p className="text-[11px] text-muted-foreground flex items-center mt-1">
              <TrendingUp className="w-3 h-3 text-emerald-600 mr-1" />
              <span>Multi-branch unified catalog</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Registered Patrons</CardTitle>
            <Users className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-bold">{loading ? '...' : stats.totalMembers}</div>
            <p className="text-[11px] text-muted-foreground flex items-center mt-1">
              <span>Citizens with digital cards</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Active Circulating Loans</CardTitle>
            <Clock className="w-4 h-4 text-emerald-600" />
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-bold">{loading ? '...' : stats.activeLoans}</div>
            <p className="text-[11px] text-muted-foreground flex items-center mt-1">
              <span>Items in patron hands</span>
            </p>
          </CardContent>
        </Card>

        <Card className={stats.pendingApprovals > 0 ? 'border-amber-300 bg-amber-50/20' : ''}>
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Pending Approvals</CardTitle>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-bold text-amber-600">{loading ? '...' : stats.pendingApprovals}</div>
            <p className="text-[11px] text-muted-foreground flex items-center mt-1">
              <span>Awaiting staff verification</span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Circulation Chart & Operational Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-bold">Weekly Circulation Throughput</CardTitle>
            <CardDescription className="text-xs">Daily comparisons of checkouts vs check-ins</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={circulationData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="day" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip />
                <Bar dataKey="loans" fill="#142B4A" name="Loans" radius={[4, 4, 0, 0]} />
                <Bar dataKey="returns" fill="#2563EB" name="Returns" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base font-bold">Needs Attention</CardTitle>
            <CardDescription className="text-xs">Immediate operational tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 space-y-1">
              <div className="font-semibold text-amber-700 dark:text-amber-400">Membership Approval</div>
              <p className="text-muted-foreground">
                {stats.pendingApprovals} citizen registrations need manual review before card issuance.
              </p>
            </div>
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 space-y-1">
              <div className="font-semibold text-blue-700 dark:text-blue-400">Weekly Stocktake</div>
              <p className="text-muted-foreground">
                Shelf-reading scheduled for Colombo Central Dewey category 900 (History).
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
