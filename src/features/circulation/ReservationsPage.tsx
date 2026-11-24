import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { EmptyState } from '@/components/ui/empty-state';
import {
  BookmarkCheck,
  Search,
  Clock,
  User,
  BookOpen,
  CheckCircle,
  XCircle,
  PackageCheck,
} from 'lucide-react';
import { ReservationRepository } from '@/services/repositories/ReservationRepository';
import { Reservation, ReservationStatus } from '@libraryos/shared';
import { toast } from 'sonner';

export const ReservationsPage: React.FC = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | ReservationStatus>('ALL');

  const loadData = () => {
    setReservations(ReservationRepository.getReservations());
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = reservations.filter((r) => {
    const matchesSearch =
      r.bookTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.memberName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'ALL' || r.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const waitingCount = reservations.filter((r) => r.status === 'WAITING').length;
  const readyCount = reservations.filter((r) => r.status === 'READY_FOR_PICKUP').length;
  const fulfilledCount = reservations.filter((r) => r.status === 'FULFILLED').length;

  const handleMarkReady = (id: string) => {
    const copyBarcode = prompt('Enter or scan available copy barcode for this reservation:');
    if (!copyBarcode) return;
    ReservationRepository.markReady(id, copyBarcode);
    toast.success('Hold ready! Member notified for pickup.');
    loadData();
  };

  const handleFulfill = (id: string) => {
    ReservationRepository.fulfill(id);
    toast.success('Hold fulfilled and issued to member.');
    loadData();
  };

  const handleCancel = (id: string) => {
    if (confirm('Are you sure you want to cancel this reservation?')) {
      ReservationRepository.cancelReservation(id);
      toast.info('Reservation cancelled.');
      loadData();
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Holds & Reservations Queue"
        description="Monitor queue positions, allocate available copies, and process pickup holds."
      />

      {/* Summary Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Awaiting Copy"
          value={waitingCount}
          subtitle="In queue waiting for return"
          icon={Clock}
        />
        <StatCard
          title="Ready on Hold Shelf"
          value={readyCount}
          subtitle="Allocated & awaiting pickup"
          icon={PackageCheck}
        />
        <StatCard
          title="Fulfilled (Total)"
          value={fulfilledCount}
          subtitle="Collected by patrons"
          icon={BookmarkCheck}
        />
      </div>

      {/* Filter & Search Bar */}
      <Card className="border-2 border-[#7654D7]/30 shadow-sm">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
              <Input
                placeholder="Search by book or patron..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              {(['ALL', 'WAITING', 'READY_FOR_PICKUP', 'FULFILLED'] as const).map((st) => (
                <Button
                  key={st}
                  variant={filterStatus === st ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus(st)}
                  className={filterStatus === st ? 'bg-[#7654D7] hover:bg-[#6342c4]' : ''}
                >
                  {st === 'READY_FOR_PICKUP' ? 'READY' : st}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reservations Table */}
      <Card className="border-2 border-[#7654D7]">
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center justify-between">
            <span>Hold Requests ({filtered.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={BookmarkCheck}
                title="No Reservations Found"
                description="There are no hold requests matching your current filter criteria."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50 font-semibold text-muted-foreground text-left">
                    <th className="py-3 px-4">Queue #</th>
                    <th className="py-3 px-4">Book Title</th>
                    <th className="py-3 px-4">Patron</th>
                    <th className="py-3 px-4">Placed On</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item, idx) => (
                    <tr
                      key={item.id}
                      className={`border-b transition-colors hover:bg-[#E6DEF9] ${
                        idx % 2 === 0 ? 'bg-white' : 'bg-[#F1EDFC]'
                      }`}
                    >
                      <td className="py-3 px-4 font-bold text-[#7654D7]">#{item.queuePosition}</td>
                      <td className="py-3 px-4 font-medium flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-muted-foreground" />
                        {item.bookTitle}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span>{item.memberName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {new Date(item.placedAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={
                            item.status === 'READY_FOR_PICKUP'
                              ? 'success'
                              : item.status === 'WAITING'
                              ? 'warning'
                              : item.status === 'FULFILLED'
                              ? 'default'
                              : 'secondary'
                          }
                        >
                          {item.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end gap-2">
                          {item.status === 'WAITING' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-emerald-600 border-emerald-300 hover:bg-emerald-50"
                              onClick={() => handleMarkReady(item.id)}
                            >
                              <PackageCheck className="w-3.5 h-3.5 mr-1" />
                              Allocate Copy
                            </Button>
                          )}
                          {item.status === 'READY_FOR_PICKUP' && (
                            <Button
                              size="sm"
                              className="bg-emerald-600 hover:bg-emerald-700 text-white"
                              onClick={() => handleFulfill(item.id)}
                            >
                              <CheckCircle className="w-3.5 h-3.5 mr-1" />
                              Checkout Pickup
                            </Button>
                          )}
                          {(item.status === 'WAITING' || item.status === 'READY_FOR_PICKUP') && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive hover:bg-destructive/10"
                              onClick={() => handleCancel(item.id)}
                            >
                              <XCircle className="w-3.5 h-3.5 mr-1" />
                              Cancel
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
