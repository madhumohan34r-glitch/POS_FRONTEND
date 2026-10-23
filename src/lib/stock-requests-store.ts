import { create } from 'zustand';

export type StockRequestStatus = 'pending' | 'approved' | 'rejected';

export interface StockRequest {
  id: string;
  menuItemId: string;
  menuItemName: string;
  requestedQuantity: number; // proposed new available qty (-1 unlimited)
  reason: string;
  requestedBy: string;
  requestedAt: Date;
  status: StockRequestStatus;
  reviewedBy?: string;
  reviewedAt?: Date;
  reviewNote?: string;
}

interface StockRequestsStore {
  requests: StockRequest[];
  createRequest: (data: Pick<StockRequest, 'menuItemId' | 'menuItemName' | 'requestedQuantity' | 'reason' | 'requestedBy'>) => StockRequest;
  approveRequest: (id: string, reviewer: string, note?: string) => StockRequest | undefined;
  rejectRequest: (id: string, reviewer: string, note?: string) => void;
  pendingCount: () => number;
}

export const useStockRequestsStore = create<StockRequestsStore>((set, get) => ({
  requests: [],
  createRequest: (data) => {
    const req: StockRequest = {
      ...data,
      id: `SR-${String(Date.now()).slice(-6)}`,
      requestedAt: new Date(),
      status: 'pending',
    };
    set(s => ({ requests: [req, ...s.requests] }));
    return req;
  },
  approveRequest: (id, reviewer, note) => {
    let result: StockRequest | undefined;
    set(s => ({
      requests: s.requests.map(r => {
        if (r.id !== id) return r;
        result = { ...r, status: 'approved', reviewedBy: reviewer, reviewedAt: new Date(), reviewNote: note };
        return result;
      }),
    }));
    return result;
  },
  rejectRequest: (id, reviewer, note) => set(s => ({
    requests: s.requests.map(r => r.id === id ? { ...r, status: 'rejected', reviewedBy: reviewer, reviewedAt: new Date(), reviewNote: note } : r),
  })),
  pendingCount: () => get().requests.filter(r => r.status === 'pending').length,
}));
