import { Reservation, ReservationStatus } from '@libraryos/shared';

const LOCAL_RESERVATIONS_KEY = 'libraryos_reservations_v1';

class ReservationRepositoryClass {
  public getReservations(): Reservation[] {
    try {
      const data = localStorage.getItem(LOCAL_RESERVATIONS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public saveReservations(reservations: Reservation[]): void {
    try {
      localStorage.setItem(LOCAL_RESERVATIONS_KEY, JSON.stringify(reservations));
    } catch (e) {
      console.error('Failed to save reservations:', e);
    }
  }

  public placeReservation(params: {
    bookId: string;
    bookTitle: string;
    memberId: string;
    memberName: string;
    pickupBranchId: string;
  }): Reservation {
    const list = this.getReservations();
    const existingQueue = list.filter(
      (r) => r.bookId === params.bookId && (r.status === 'WAITING' || r.status === 'READY_FOR_PICKUP')
    );

    const newRes: Reservation = {
      id: `res-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      bookId: params.bookId,
      bookTitle: params.bookTitle,
      memberId: params.memberId,
      memberName: params.memberName,
      pickupBranchId: params.pickupBranchId,
      queuePosition: existingQueue.length + 1,
      placedAt: Date.now(),
      status: 'WAITING',
    };

    list.push(newRes);
    this.saveReservations(list);
    return newRes;
  }

  public cancelReservation(id: string): boolean {
    const list = this.getReservations();
    const target = list.find((r) => r.id === id);
    if (!target) return false;

    target.status = 'CANCELLED';
    this.saveReservations(list);
    return true;
  }

  public markReady(id: string, copyId: string): boolean {
    const list = this.getReservations();
    const target = list.find((r) => r.id === id);
    if (!target) return false;

    target.status = 'READY_FOR_PICKUP';
    target.allocatedCopyId = copyId;
    target.readyAt = Date.now();
    target.expiresAt = Date.now() + 3 * 24 * 60 * 60 * 1000; // 3 days hold
    this.saveReservations(list);
    return true;
  }

  public fulfill(id: string): boolean {
    const list = this.getReservations();
    const target = list.find((r) => r.id === id);
    if (!target) return false;

    target.status = 'FULFILLED';
    this.saveReservations(list);
    return true;
  }
}

export const ReservationRepository = new ReservationRepositoryClass();
