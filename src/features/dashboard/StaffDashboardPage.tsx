import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import {
  BookOpen,
  Users,
  Clock,
  CloudUpload,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  ScanLine,
  BookCopy,
  ClipboardList,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { StatCard } from '@/components/ui/stat-card';
import { PageHeader } from '@/components/ui/page-header';
import { CatalogRepository } from '@/services/repositories/CatalogRepository';
import { LocalAuthService } from '@/services/auth/LocalAuthService';
import { FirebaseSyncService } from '@/services/firebase/FirebaseSyncService';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
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
    const activeLoans = members.reduce(
      (sum, m) => sum + (m.activeLoansCount || 0),
      0
    );

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
      const res = await FirebaseSyncService.syncAllToCloudFirestore(
        (percent, status) => {
          setSyncProgress(percent);
          setSyncStatusText(status);
        }
      );

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
      {/* Title with PageHeader */}
      <PageHeader
        title="Library Operations Dashboard"
        description="Connected to Firebase Project: libraryos-app-9fc34 • Colombo Central (HQ)"
        badge={<Badge variant="success">Live Project Active</Badge>}
        actions={
          <Button
            size="sm"
            onClick={handleSyncToFirebase}
            disabled={isSyncing}
            isLoading={isSyncing}
            className="text-xs font-semibold gap-2 min-w-[200px]"
          >
            <CloudUpload className="w-4 h-4" />
            <span>
              {isSyncing
                ? `Uploading... ${syncProgress}%`
                : 'Upload Data to Firebase'}
            </span>
          </Button>
        }
      />

      {/* Progress Bar Display when syncing (0% to 100%) */}
      {isSyncing && (
        <Card className="p-4 bg-primary-soft/40 border border-primary/20 animate-in fade-in">
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-semibold">
              <span className="text-primary flex items-center gap-1.5">
                <CloudUpload className="w-4 h-4 animate-spin" />
                <span>{syncStatusText}</span>
              </span>
              <span className="font-mono text-sm font-bold text-primary">
                {syncProgress}%
              </span>
            </div>
            <Progress value={syncProgress} />
          </div>
        </Card>
      )}

      {/* Bento Grid: 4 Metric Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Catalogued Titles"
          value={loading ? '...' : stats.totalBooks}
          subtitle="Multi-branch unified catalog"
          icon={BookOpen}
        />
        <StatCard
          title="Registered Patrons"
          value={loading ? '...' : stats.totalMembers}
          subtitle="Citizens with digital cards"
          icon={Users}
        />
        <StatCard
          title="Active Circulating Loans"
          value={loading ? '...' : stats.activeLoans}
          subtitle="Items in patron hands"
          icon={Clock}
        />
        <StatCard
          title="Pending Approvals"
          value={loading ? '...' : stats.pendingApprovals}
          subtitle="Awaiting staff verification"
          icon={AlertTriangle}
          className={
            stats.pendingApprovals > 0 ? 'border-warning/50 bg-warning-soft/20' : ''
          }
        />
      </div>

      {/* Quick Action Navigation Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Button asChild variant="outline" className="justify-between h-auto py-3 px-4">
          <Link to="/staff/circulation">
            <div className="flex items-center gap-2.5">
              <ScanLine className="w-4 h-4 text-primary" />
              <div className="text-left">
                <div className="font-semibold text-xs">Circulation Desk</div>
                <div className="text-[11px] text-muted-foreground">Scan loans and returns</div>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
          </Link>
        </Button>
        <Button asChild variant="outline" className="justify-between h-auto py-3 px-4">
          <Link to="/staff/catalog">
            <div className="flex items-center gap-2.5">
              <BookCopy className="w-4 h-4 text-secondary" />
              <div className="text-left">
                <div className="font-semibold text-xs">Catalog Management</div>
                <div className="text-[11px] text-muted-foreground">Manage books and copies</div>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
          </Link>
        </Button>
        <Button asChild variant="outline" className="justify-between h-auto py-3 px-4">
          <Link to="/staff/members?tab=requests">
            <div className="flex items-center gap-2.5">
              <ClipboardList className="w-4 h-4 text-warning" />
              <div className="text-left">
                <div className="font-semibold text-xs">Pending Requests</div>
                <div className="text-[11px] text-muted-foreground">{stats.pendingApprovals} members awaiting review</div>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
          </Link>
        </Button>
      </div>

      {/* Circulation Chart & Operational Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">
                Weekly Circulation Throughput
              </CardTitle>
              <CardDescription className="text-xs">
                Daily comparisons of checkouts vs check-ins
              </CardDescription>
            </div>
            <Badge variant="muted" size="sm">
              Sample data
            </Badge>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={circulationData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="day" fontSize={12} stroke="#64748b" />
                <YAxis fontSize={12} stroke="#64748b" />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                  }}
                />
                <Legend />
                <Bar
                  dataKey="loans"
                  fill="#4338CA"
                  name="Loans (ණයට දීම්)"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="returns"
                  fill="#0F766E"
                  name="Returns (ආපසු ලැබීම්)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Needs Attention
            </CardTitle>
            <CardDescription className="text-xs">
              Immediate operational tasks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="p-3.5 rounded-xl bg-warning-soft border border-warning/20 space-y-1">
              <div className="font-semibold text-warning-soft-foreground flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Membership Approval</span>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                {stats.pendingApprovals} citizen registrations need manual review before card issuance.
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-info-soft border border-info/20 space-y-1">
              <div className="font-semibold text-info-soft-foreground flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Weekly Stocktake</span>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Shelf-reading scheduled for Colombo Central Dewey category 900 (History).
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
