import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/services/firebase/config';
import { LocalAuthService } from '@/services/auth/LocalAuthService';
import { MemberProfile } from '@libraryos/shared';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Clock, UserCheck, Search, Filter } from 'lucide-react';
import { toast } from 'sonner';

export const StaffApprovalQueuePage: React.FC = () => {
  const [pendingMembers, setPendingMembers] = useState<MemberProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const loadQueue = () => {
    // 1. First check LocalAuthService store (includes student registrations & 100 sample students)
    const localPending = LocalAuthService.getPendingMembers();

    // 2. Try Firestore realtime listener as well
    try {
      const q = query(collection(db, 'members'), where('status', '==', 'PENDING'));
      const unsub = onSnapshot(
        q,
        (snapshot) => {
          const list: MemberProfile[] = [...localPending];
          snapshot.forEach((d) => {
            const data = d.data() as MemberProfile;
            if (!list.some((m) => m.id === data.id || m.email === data.email)) {
              list.push(data);
            }
          });
          setPendingMembers(list);
          setLoading(false);
        },
        () => {
          setPendingMembers(localPending);
          setLoading(false);
        }
      );
      return unsub;
    } catch {
      setPendingMembers(localPending);
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsub = loadQueue();
    return () => {
      if (unsub) unsub();
    };
  }, []);

  const handleAction = async (memberId: string, action: 'ACTIVE' | 'REJECTED') => {
    try {
      // 1. Update in LocalAuthService
      LocalAuthService.updateMemberStatus(memberId, action === 'ACTIVE' ? 'ACTIVE' : 'CANCELLED');

      // 2. Update in Firestore if connected
      try {
        const memberRef = doc(db, 'members', memberId);
        await updateDoc(memberRef, {
          status: action === 'ACTIVE' ? 'ACTIVE' : 'CANCELLED',
          updatedAt: Date.now(),
        });
      } catch {
        // ignore offline
      }

      toast.success(
        `Member ${action === 'ACTIVE' ? 'Approved & Activated with Borrowing Privileges!' : 'Application Rejected.'}`
      );
      // Refresh local queue state
      setPendingMembers(LocalAuthService.getPendingMembers());
    } catch (err: any) {
      toast.error(err.message || 'Operation failed');
    }
  };

  const filteredMembers = pendingMembers.filter((m) => {
    const matchesSearch =
      m.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.memberIdNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.district.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = filterType === 'ALL' || m.membershipType === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-foreground">
            Member Registration Approval Queue
          </h1>
          <p className="text-xs text-muted-foreground">
            Review self-registered students, institutional applications, and citizens before issuing active digital library cards.
          </p>
        </div>
        <div className="flex items-center space-x-2 text-xs font-semibold px-3 py-1 bg-amber-500/10 text-amber-600 rounded-full">
          <Clock className="w-4 h-4" />
          <span>{pendingMembers.length} Applications Awaiting Staff Approval</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by student name, email, card ID, or district..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-card rounded-lg border border-input focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="h-10 px-3 rounded-lg border border-input bg-card text-xs min-w-[180px]"
        >
          <option value="ALL">All Categories ({pendingMembers.length})</option>
          <option value="STUDENT">Students Only</option>
          <option value="GENERAL">General Public</option>
          <option value="TEACHER">Teachers</option>
          <option value="JUNIOR">Junior (Minors)</option>
        </select>
      </div>

      {/* Queue Cards Grid */}
      {loading ? (
        <div className="p-12 text-center text-sm text-muted-foreground">Loading approval queue...</div>
      ) : filteredMembers.length === 0 ? (
        <Card className="p-12 text-center">
          <CardContent className="space-y-3">
            <UserCheck className="w-12 h-12 text-emerald-500 mx-auto" />
            <h3 className="font-serif font-bold text-lg">No Applications Pending</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              All member registrations have been verified and processed.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMembers.map((member) => (
            <Card key={member.id} className="border-border shadow-sm flex flex-col justify-between hover:border-primary/40 transition-colors">
              <CardHeader className="p-4 pb-2">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <CardTitle className="text-sm font-bold">{member.fullName}</CardTitle>
                    <div className="text-[11px] font-mono text-primary font-semibold mt-0.5">
                      {member.memberIdNumber}
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                      member.membershipType === 'STUDENT'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {member.membershipType}
                  </span>
                </div>
              </CardHeader>

              <CardContent className="p-4 pt-2 space-y-3 text-xs">
                <div className="bg-muted/40 p-2.5 rounded-lg space-y-1 text-[11px] text-muted-foreground">
                  <div><strong>Email:</strong> {member.email}</div>
                  <div><strong>Phone:</strong> {member.phone}</div>
                  <div><strong>District:</strong> {member.district}</div>
                  <div><strong>Home Branch:</strong> {member.homeBranchId}</div>
                  <div><strong>NIC / ID:</strong> {member.nic || 'Student Verification'}</div>
                </div>

                <div className="flex items-center justify-end space-x-2 pt-2 border-t">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs text-destructive hover:bg-destructive/10"
                    onClick={() => handleAction(member.id, 'REJECTED')}
                  >
                    <XCircle className="w-3.5 h-3.5 mr-1" />
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                    onClick={() => handleAction(member.id, 'ACTIVE')}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                    Approve & Issue Card
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
