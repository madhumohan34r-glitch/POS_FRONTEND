import { create } from 'zustand';

export type BookingType = 'table' | 'event' | 'venue';

export interface Reservation {
  id: string;
  type: BookingType;
  date: string;
  time: string;
  duration: number; // hours
  headcount: number;
  tableNumber?: number;
  customerName: string;
  customerPhone: string;
  description?: string; // purpose, e.g. "Wedding photography" — required at form level
  specialRequirements?: string; // OPTIONAL extra notes (cake, projector, etc.)
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  createdAt: Date;
  source?: 'admin' | 'counter' | 'customer-qr';
}

export interface ReservationConfig {
  tableBookingEnabled: boolean;
  eventBookingEnabled: boolean;
  venueBookingEnabled: boolean;
  maxTableCapacity: number;
  maxEventCapacity: number;
  maxVenueCapacity: number;
  standingCapacity: number;
  minBookingDuration: number;
  maxBookingDuration: number;
}

interface ReservationStore {
  reservations: Reservation[];
  config: ReservationConfig;
  addReservation: (res: Omit<Reservation, 'id' | 'status' | 'createdAt'>) => { success: boolean; message: string; reservation?: Reservation };
  updateReservationStatus: (id: string, status: Reservation['status']) => void;
  updateConfig: (updates: Partial<ReservationConfig>) => void;
  getAvailableTables: (date: string, time: string, duration: number) => number[];
  hasConflict: (type: BookingType, date: string, time: string, duration: number, tableNumber?: number) => boolean;
}

export const useReservationStore = create<ReservationStore>((set, get) => ({
  reservations: [
    { id: 'RES-001', type: 'table', date: '2026-04-16', time: '19:00', duration: 2, headcount: 4, tableNumber: 5, customerName: 'Anita Desai', customerPhone: '+91-9876500001', status: 'confirmed', createdAt: new Date() },
    { id: 'RES-002', type: 'event', date: '2026-04-18', time: '18:00', duration: 4, headcount: 30, customerName: 'Corporate Events Ltd', customerPhone: '+91-9876500002', specialRequirements: 'Projector needed', status: 'pending', createdAt: new Date() },
  ],
  config: {
    tableBookingEnabled: true,
    eventBookingEnabled: true,
    venueBookingEnabled: false,
    maxTableCapacity: 8,
    maxEventCapacity: 50,
    maxVenueCapacity: 100,
    standingCapacity: 30,
    minBookingDuration: 1,
    maxBookingDuration: 8,
  },
  addReservation: (res) => {
    const state = get();
    if (state.hasConflict(res.type, res.date, res.time, res.duration, res.tableNumber)) {
      return { success: false, message: 'Time slot conflict detected. Please choose another time.' };
    }
    const reservation: Reservation = { ...res, id: `RES-${String(Date.now()).slice(-6)}`, status: 'pending', createdAt: new Date() };
    set(s => ({ reservations: [reservation, ...s.reservations] }));
    return { success: true, message: 'Reservation created!', reservation };
  },
  updateReservationStatus: (id, status) => set(s => ({
    reservations: s.reservations.map(r => r.id === id ? { ...r, status } : r),
  })),
  updateConfig: (updates) => set(s => ({ config: { ...s.config, ...updates } })),
  getAvailableTables: (date, time, duration) => {
    const booked = get().reservations
      .filter(r => r.type === 'table' && r.date === date && r.status !== 'cancelled' && r.tableNumber)
      .filter(r => {
        const rStart = parseInt(r.time.split(':')[0]) * 60 + parseInt(r.time.split(':')[1]);
        const rEnd = rStart + r.duration * 60;
        const qStart = parseInt(time.split(':')[0]) * 60 + parseInt(time.split(':')[1]);
        const qEnd = qStart + duration * 60;
        return qStart < rEnd && qEnd > rStart;
      })
      .map(r => r.tableNumber!);
    return Array.from({ length: 12 }, (_, i) => i + 1).filter(t => !booked.includes(t));
  },
  hasConflict: (type, date, time, duration, tableNumber) => {
    const reservations = get().reservations.filter(r => r.date === date && r.status !== 'cancelled');
    const qStart = parseInt(time.split(':')[0]) * 60 + parseInt(time.split(':')[1]);
    const qEnd = qStart + duration * 60;
    return reservations.some(r => {
      if (type === 'table' && r.type === 'table' && tableNumber && r.tableNumber !== tableNumber) return false;
      if (type === 'venue' || r.type === 'venue') {
        const rStart = parseInt(r.time.split(':')[0]) * 60 + parseInt(r.time.split(':')[1]);
        const rEnd = rStart + r.duration * 60;
        return qStart < rEnd && qEnd > rStart;
      }
      if (type === 'table' && r.type === 'table' && r.tableNumber === tableNumber) {
        const rStart = parseInt(r.time.split(':')[0]) * 60 + parseInt(r.time.split(':')[1]);
        const rEnd = rStart + r.duration * 60;
        return qStart < rEnd && qEnd > rStart;
      }
      return false;
    });
  },
}));
