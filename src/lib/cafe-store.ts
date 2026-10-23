import { create } from 'zustand';

export interface Discount {
  id: string;
  name: string;
  type: 'percentage' | 'flat';
  value: number;
  scope: 'global' | 'item';
  itemId?: string;
  active: boolean;
}

export interface Feedback {
  id: string;
  rating: number;
  message: string;
  tableNumber: number;
  createdAt: Date;
  orderId?: string;
  itemId?: string;
  itemName?: string;
}

export interface CafeSettings {
  name: string;
  address: string;
  phone: string;
  openingTime: string;
  closingTime: string;
  gstRate: number;
  cgstRate: number;
  sgstRate: number;
  currency: string;
  gstNumber: string;
  logo: string;
  banner: string;
  paymentMode: 'prepayment' | 'postpayment' | 'both';
  operationalDays: string[];
  postPaymentDirectToKDS: boolean;
  feedbackEnabled: boolean;
}

export interface LeaveRequest {
  id: string;
  staff: string;
  type: string;
  fromDate: string;
  toDate: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  appliedOn: string;
}

export interface ReadyNotification {
  id: string;
  orderId: string;
  tableNumber: number;
  message: string;
  time: Date;
  read: boolean;
}

interface CafeSettingsStore {
  settings: CafeSettings;
  discounts: Discount[];
  readyNotifications: ReadyNotification[];
  feedbacks: Feedback[];
  leaveRequests: LeaveRequest[];
  updateSettings: (updates: Partial<CafeSettings>) => void;
  addDiscount: (discount: Omit<Discount, 'id'>) => void;
  updateDiscount: (id: string, updates: Partial<Discount>) => void;
  deleteDiscount: (id: string) => void;
  toggleDiscount: (id: string) => void;
  addReadyNotification: (orderId: string, tableNumber: number) => void;
  markReadyNotificationRead: (id: string) => void;
  clearReadyNotifications: () => void;
  addFeedback: (feedback: Omit<Feedback, 'id' | 'createdAt'>) => void;
  addLeaveRequest: (request: Omit<LeaveRequest, 'id' | 'status' | 'appliedOn'>) => void;
  updateLeaveStatus: (id: string, status: 'approved' | 'rejected') => void;
}

export const useCafeStore = create<CafeSettingsStore>((set) => ({
  settings: {
    name: 'CaféFlow',
    address: '123 Coffee Street, City',
    phone: '+91 98765 43210',
    openingTime: '08:00',
    closingTime: '22:00',
    gstRate: 5,
    cgstRate: 2.5,
    sgstRate: 2.5,
    currency: 'INR (₹)',
    gstNumber: '29ABCDE1234F1Z5',
    logo: '',
    banner: '',
    paymentMode: 'both',
    operationalDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    postPaymentDirectToKDS: false,
    feedbackEnabled: false,
  },
  discounts: [
    { id: '1', name: 'Happy Hour 10%', type: 'percentage', value: 10, scope: 'global', active: true },
    { id: '2', name: 'Flat ₹50 Off Tiramisu', type: 'flat', value: 50, scope: 'item', itemId: '9', active: false },
  ],
  readyNotifications: [],
  feedbacks: [],
  leaveRequests: [
    { id: '1', staff: 'Priya Sharma', type: 'Casual', fromDate: '2026-04-01', toDate: '2026-04-02', reason: 'Family function', status: 'pending', appliedOn: '2026-03-28' },
    { id: '2', staff: 'Rahul Kumar', type: 'Sick', fromDate: '2026-03-28', toDate: '2026-03-29', reason: 'Medical appointment', status: 'pending', appliedOn: '2026-03-27' },
    { id: '3', staff: 'Sneha Patel', type: 'Earned', fromDate: '2026-03-20', toDate: '2026-03-20', reason: 'Personal', status: 'approved', appliedOn: '2026-03-18' },
  ],
  updateSettings: (updates) => set((s) => ({ settings: { ...s.settings, ...updates } })),
  addDiscount: (discount) => set((s) => ({ discounts: [...s.discounts, { ...discount, id: String(Date.now()) }] })),
  updateDiscount: (id, updates) => set((s) => ({ discounts: s.discounts.map(d => d.id === id ? { ...d, ...updates } : d) })),
  deleteDiscount: (id) => set((s) => ({ discounts: s.discounts.filter(d => d.id !== id) })),
  toggleDiscount: (id) => set((s) => ({ discounts: s.discounts.map(d => d.id === id ? { ...d, active: !d.active } : d) })),
  addReadyNotification: (orderId, tableNumber) => set((s) => ({
    readyNotifications: [
      { id: String(Date.now()), orderId, tableNumber, message: `Order ${orderId} for Table ${tableNumber} is ready to serve!`, time: new Date(), read: false },
      ...s.readyNotifications,
    ],
  })),
  markReadyNotificationRead: (id) => set((s) => ({
    readyNotifications: s.readyNotifications.map(n => n.id === id ? { ...n, read: true } : n),
  })),
  clearReadyNotifications: () => set({ readyNotifications: [] }),
  addFeedback: (feedback) => set((s) => ({
    feedbacks: [{ ...feedback, id: String(Date.now()), createdAt: new Date() }, ...s.feedbacks],
  })),
  addLeaveRequest: (request) => set((s) => ({
    leaveRequests: [...s.leaveRequests, { ...request, id: String(Date.now()), status: 'pending', appliedOn: new Date().toISOString().split('T')[0] }],
  })),
  updateLeaveStatus: (id, status) => set((s) => ({
    leaveRequests: s.leaveRequests.map(r => r.id === id ? { ...r, status } : r),
  })),
}));
