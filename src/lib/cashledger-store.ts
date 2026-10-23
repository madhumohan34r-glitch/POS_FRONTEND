import { create } from 'zustand';

export interface CashSession {
  id: string;
  openedAt: Date;
  openedBy: string;
  openingAmount: number;
  closedAt?: Date;
  closedBy?: string;
  closingAmount?: number; // counted cash at close
  expectedAmount?: number; // computed
  variance?: number;
  notes?: string;
}

export interface Cashout {
  id: string;
  sessionId: string;
  amount: number;
  category: string; // e.g. Groceries, Utility, Repair
  vendor?: string;
  description: string;
  createdAt: Date;
  createdBy: string;
}

interface CashLedgerStore {
  sessions: CashSession[];
  cashouts: Cashout[];
  getActiveSession: () => CashSession | undefined;
  openSession: (openedBy: string, openingAmount: number, notes?: string) => CashSession | { error: string };
  closeSession: (closedBy: string, closingAmount: number, cashSalesTotal: number, notes?: string) => CashSession | { error: string };
  addCashout: (data: Omit<Cashout, 'id' | 'createdAt' | 'sessionId'>) => Cashout | { error: string };
  getSessionCashouts: (sessionId: string) => Cashout[];
}

export const useCashLedgerStore = create<CashLedgerStore>((set, get) => ({
  sessions: [],
  cashouts: [],
  getActiveSession: () => get().sessions.find(s => !s.closedAt),
  openSession: (openedBy, openingAmount, notes) => {
    const active = get().getActiveSession();
    if (active) return { error: 'A counter session is already open. Close it first.' };
    const session: CashSession = {
      id: `CS-${Date.now()}`,
      openedAt: new Date(),
      openedBy,
      openingAmount,
      notes,
    };
    set(s => ({ sessions: [session, ...s.sessions] }));
    return session;
  },
  closeSession: (closedBy, closingAmount, cashSalesTotal, notes) => {
    const active = get().getActiveSession();
    if (!active) return { error: 'No open counter session.' };
    const cashoutsTotal = get().getSessionCashouts(active.id).reduce((s, c) => s + c.amount, 0);
    const expected = active.openingAmount + cashSalesTotal - cashoutsTotal;
    const updated: CashSession = {
      ...active,
      closedAt: new Date(),
      closedBy,
      closingAmount,
      expectedAmount: expected,
      variance: closingAmount - expected,
      notes: notes ?? active.notes,
    };
    set(s => ({ sessions: s.sessions.map(x => x.id === active.id ? updated : x) }));
    return updated;
  },
  addCashout: (data) => {
    const active = get().getActiveSession();
    if (!active) return { error: 'Open a counter session before recording a cashout.' };
    const cashout: Cashout = {
      ...data,
      id: `CO-${Date.now()}`,
      sessionId: active.id,
      createdAt: new Date(),
    };
    set(s => ({ cashouts: [cashout, ...s.cashouts] }));
    return cashout;
  },
  getSessionCashouts: (sessionId) => get().cashouts.filter(c => c.sessionId === sessionId),
}));
