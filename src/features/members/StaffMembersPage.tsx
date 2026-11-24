import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import { LocalAuthService } from '@/services/auth/LocalAuthService';
import { MemberProfile } from '@libraryos/shared';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MemberIdCard } from '@/components/common/MemberIdCard';
import {
  Users,
  UserCheck,
  Clock,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Shield,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CreditCard,
  Eye,
  X,
  Printer,
  UserPlus,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

export const StaffMembersPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') === 'requests' ? 'requests' : 'directory';

  const [members, setMembers] = useState<MemberProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [selectedMember, setSelectedMember] = useState<MemberProfile | null>(null);
  const [showIdCardModal, setShowIdCardModal] = useState<MemberProfile | null>(null);

  const loadData = () => {
    setLoading(true);
    const all = LocalAuthService.getAllMembers();
    setMembers(all);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const pendingRequests = members.filter((m) => m.status === 'PENDING');
  const activeMembersList = members.filter((m) => m.status !== 'PENDING');

  const handleAction = async (memberId: string, action: 'ACTIVE' | 'REJECTED') => {
    try {
      LocalAuthService.updateMemberStatus(memberId, action === 'ACTIVE' ? 'ACTIVE' : 'CANCELLED');
      const targetUser = LocalAuthService.getAllMembers().find((m) => m.id === memberId);
      
      if (action === 'ACTIVE' && targetUser) {
        toast.success(
          `Application Approved! Library ID Card ${targetUser.memberIdNumber} generated with scannable barcode.`
        );
        setShowIdCardModal(targetUser);
      } else {
        toast.info('Application marked as rejected.');
      }
      loadData();
      if (selectedMember && selectedMember.id === memberId) {
        setSelectedMember(null);
      }
    } catch (err: any) {
      toast.error(err.message || 'Operation failed');
    }
  };

  // Filter based on active tab
  const displayList = (currentTab === 'requests' ? pendingRequests : members).filter((m) => {
    const matchesSearch =
      m.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.memberIdNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.district.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = filterType === 'ALL' || m.membershipType === filterType;
    const matchesStatus =
      currentTab === 'requests' || filterStatus === 'ALL' || m.status === filterStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  const handleReSeed100Members = () => {
    LocalAuthService.seed100SampleMembers();
    loadData();
    toast.success('Successfully loaded 100 Sri Lankan sample members (Students, Teachers, General, Junior)!');
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">
            Patron & Membership Management
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage active library cards, student directories, and self-registration verification queues.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleReSeed100Members}
            className="text-xs font-semibold gap-1.5 border-primary/40 hover:bg-primary/10"
            title="Inject or Reset 100 Sample Members with full profiles and barcodes"
          >
            <RefreshCw className="w-3.5 h-3.5 text-primary" />
            <span>Load 100 Sample Members</span>
          </Button>

          {/* Section Tabs Switcher */}
          <div className="flex p-1 bg-muted rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setSearchParams({ tab: 'directory' })}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                currentTab === 'directory'
                  ? 'bg-background shadow text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Users className="w-4 h-4 text-primary" />
              <span>All Members ({members.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setSearchParams({ tab: 'requests' })}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                currentTab === 'requests'
                  ? 'bg-background shadow text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Clock className="w-4 h-4 text-warning" />
              <span>Registration Requests</span>
              {pendingRequests.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-xs bg-warning text-warning-foreground font-bold ml-1">
                  {pendingRequests.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by student/member name, card ID, email, or district..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="h-10 px-3 rounded-lg border border-input bg-card text-xs min-w-[150px]"
        >
          <option value="ALL">All Categories</option>
          <option value="STUDENT">Students</option>
          <option value="GENERAL">General Public</option>
          <option value="TEACHER">Teachers</option>
          <option value="JUNIOR">Junior</option>
        </select>

        {currentTab === 'directory' && (
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="h-10 px-3 rounded-lg border border-input bg-card text-xs min-w-[140px]"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="PENDING">Pending</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="CANCELLED">Rejected / Cancelled</option>
          </select>
        )}
      </div>

      {/* Section 1: REGISTRATION REQUESTS QUEUE VIEW */}
      {currentTab === 'requests' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
            <span>
              Showing <strong>{displayList.length}</strong> pending student & member applications
            </span>
            <span className="text-warning font-semibold">
              Action Required: Verify patron identity & grant borrowing privileges
            </span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-xs text-muted-foreground">Loading queue...</div>
          ) : displayList.length === 0 ? (
            <Card className="p-12 text-center">
              <CardContent className="space-y-3">
                <UserCheck className="w-12 h-12 text-success mx-auto" />
                <h3 className="font-heading font-bold text-lg">No Pending Registration Requests</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  All member registrations and student sign-ups have been verified and processed.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayList.map((member) => (
                <Card
                  key={member.id}
                  className="border-border shadow-sm flex flex-col justify-between hover:border-primary/40 transition-all bg-card"
                >
                  <CardHeader className="p-4 pb-2">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <CardTitle className="text-sm font-bold">{member.fullName}</CardTitle>
                        <div className="text-xs font-mono text-primary font-semibold mt-0.5">
                          {member.memberIdNumber}
                        </div>
                      </div>
                      <span className="text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider bg-warning-soft text-warning-soft-foreground dark:bg-card dark:text-warning">
                        {member.membershipType}
                      </span>
                    </div>
                  </CardHeader>

                  <CardContent className="p-4 pt-2 space-y-3 text-xs">
                    <div className="bg-muted/40 p-2.5 rounded-lg space-y-1 text-xs text-muted-foreground">
                      <div><strong>Email:</strong> {member.email}</div>
                      <div><strong>Phone:</strong> {member.phone}</div>
                      <div><strong>District:</strong> {member.district}</div>
                      <div><strong>Home Branch:</strong> {member.homeBranchId}</div>
                      <div><strong>NIC / ID:</strong> {member.nic || 'Student Verification'}</div>
                    </div>

                    <div className="pt-2 flex items-center justify-between border-t gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAction(member.id, 'REJECTED')}
                        className="flex-1 text-destructive hover:bg-destructive hover:text-destructive-foreground h-8 text-xs font-semibold"
                      >
                        <XCircle className="w-3.5 h-3.5 mr-1" />
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleAction(member.id, 'ACTIVE')}
                        className="flex-1 bg-success hover:bg-success/90 text-white h-8 text-xs font-semibold"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                        Approve
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Section 2: MEMBERS DIRECTORY TABLE VIEW */}
      {currentTab === 'directory' && (
        <Card className="shadow-sm border">
          <CardHeader className="p-4 border-b flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold">Registered Members Directory</CardTitle>
              <p className="text-xs text-muted-foreground">
                Showing {displayList.length} total patron accounts. Click any row to view full profile & card details.
              </p>
            </div>
          </CardHeader>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/60 text-muted-foreground font-semibold border-b">
                <tr>
                  <th className="p-3">Card / Member ID</th>
                  <th className="p-3">Full Name</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">District</th>
                  <th className="p-3">Contact</th>
                  <th className="p-3">Active Loans</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Card / Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-muted-foreground">
                      Loading members...
                    </td>
                  </tr>
                ) : displayList.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-muted-foreground">
                      No members match the current search filters.
                    </td>
                  </tr>
                ) : (
                  displayList.map((m) => (
                    <tr
                      key={m.id}
                      onClick={() => setSelectedMember(m)}
                      className="hover:bg-muted/30 cursor-pointer transition-colors"
                    >
                      <td className="p-3 font-mono font-bold text-primary">{m.memberIdNumber}</td>
                      <td className="p-3 font-medium text-foreground">{m.fullName}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-muted">
                          {m.membershipType}
                        </span>
                      </td>
                      <td className="p-3 text-muted-foreground">{m.district}</td>
                      <td className="p-3 text-muted-foreground">{m.email}</td>
                      <td className="p-3 font-semibold">{m.activeLoansCount} books</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded font-bold uppercase text-xs ${
                            m.status === 'ACTIVE'
                              ? 'bg-success-soft text-success dark:bg-card dark:text-success'
                              : m.status === 'PENDING'
                              ? 'bg-warning-soft text-warning-soft-foreground dark:bg-card dark:text-warning'
                              : 'bg-danger-soft text-danger-soft-foreground dark:bg-card dark:text-danger'
                          }`}
                        >
                          {m.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end space-x-1.5" onClick={(e) => e.stopPropagation()}>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setShowIdCardModal(m);
                            }}
                            className="h-7 px-2.5 text-xs font-semibold gap-1.5 hover:bg-primary/10 hover:text-primary transition-all shadow-xs"
                            title="Print Member Card with Barcode"
                          >
                            <Printer className="w-3.5 h-3.5 text-primary" />
                            <span>ID Card</span>
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setSelectedMember(m);
                            }}
                            className="h-7 px-2 text-xs"
                            title="View Full Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Member Details Modal */}
      {selectedMember &&
        createPortal(
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
            onClick={() => setSelectedMember(null)}
          >
            <Card
              className="w-full max-w-lg bg-card shadow-2xl my-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <CardHeader className="p-4 border-b flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold">{selectedMember.fullName}</CardTitle>
                  <div className="text-xs font-mono text-primary font-semibold">
                    Card ID: {selectedMember.memberIdNumber}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedMember(null)}
                  className="p-1 rounded-lg text-muted-foreground hover:bg-muted"
                >
                  <X className="w-5 h-5" />
                </button>
              </CardHeader>

              <CardContent className="p-6 space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3 bg-muted/40 p-3 rounded-xl">
                  <div>
                    <div className="text-muted-foreground text-xs uppercase font-bold">Category</div>
                    <div className="font-semibold">{selectedMember.membershipType}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs uppercase font-bold">Status</div>
                    <div className="font-semibold text-success font-bold">{selectedMember.status}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs uppercase font-bold">Email</div>
                    <div>{selectedMember.email}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs uppercase font-bold">Phone</div>
                    <div>{selectedMember.phone}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs uppercase font-bold">District / Address</div>
                    <div>{selectedMember.district} ({selectedMember.address})</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs uppercase font-bold">Home Branch</div>
                    <div>{selectedMember.homeBranchId}</div>
                  </div>
                </div>

                {/* ID Card with Barcode Preview */}
                <div className="pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowIdCardModal(selectedMember)}
                    className="w-full text-xs font-bold gap-2"
                  >
                    <Printer className="w-4 h-4 text-primary" />
                    <span>Preview & Print Official Member ID Card with Barcode</span>
                  </Button>
                </div>

                {selectedMember.status === 'PENDING' && (
                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      variant="outline"
                      onClick={() => handleAction(selectedMember.id, 'REJECTED')}
                      className="flex-1 text-destructive"
                    >
                      Reject Application
                    </Button>
                    <Button
                      onClick={() => handleAction(selectedMember.id, 'ACTIVE')}
                      className="flex-1 bg-success hover:bg-success/90 text-white"
                    >
                      Approve Application
                    </Button>
                  </div>
                )}
              </CardContent>

              <div className="p-4 border-t flex justify-end bg-muted/20">
                <Button variant="outline" onClick={() => setSelectedMember(null)} className="text-xs">
                  Close
                </Button>
              </div>
            </Card>
          </div>,
          document.body
        )}

      {/* Official Library ID Card Print Modal (Portaled directly to document.body so it floats over viewport with zero scrolling) */}
      {showIdCardModal &&
        createPortal(
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200"
            onClick={() => setShowIdCardModal(null)}
          >
            <div
              className="w-full max-w-sm bg-card border border-border shadow-2xl rounded-2xl overflow-hidden animate-in zoom-in-95 duration-200 my-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b flex flex-row items-center justify-between bg-muted/40">
                <div>
                  <h3 className="text-sm font-bold text-foreground">Official Library ID Card</h3>
                  <div className="text-xs text-muted-foreground font-mono font-semibold">
                    {showIdCardModal.memberIdNumber}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowIdCardModal(null)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 flex flex-col items-center bg-background">
                <MemberIdCard member={showIdCardModal} />
              </div>

              <div className="p-3 border-t flex justify-end bg-muted/20">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowIdCardModal(null)}
                  className="text-xs font-semibold px-4"
                >
                  Done
                </Button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
