import { create } from 'zustand';

export interface Merchant {
  id: string;
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  registrationDate: string;
  plan: 'free' | 'starter' | 'pro' | 'enterprise';
  planExpiryDate: string;
  status: 'active' | 'suspended' | 'expired';
  revenue: number;
  ordersCount: number;
}

export interface OrgActivity {
  id: string;
  timestamp: string;
  merchantId?: string;
  merchantName?: string;
  action: string;
  detail?: string;
  type: 'create' | 'update' | 'suspend' | 'activate' | 'extend' | 'plan';
}

interface OrgStore {
  merchants: Merchant[];
  activities: OrgActivity[];
  addMerchant: (m: Omit<Merchant, 'id'>) => void;
  updateMerchant: (id: string, updates: Partial<Merchant>) => void;
  logActivity: (a: Omit<OrgActivity, 'id' | 'timestamp'>) => void;
  extendPlan: (id: string, days: number) => void;
  toggleStatus: (id: string) => void;
}

const daysUntilExpiry = (date: string) => Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);

export { daysUntilExpiry };

const PLAN_PRICE: Record<Merchant['plan'], number> = { free: 0, starter: 999, pro: 2999, enterprise: 9999 };
export const planMonthlyPrice = (p: Merchant['plan']) => PLAN_PRICE[p];

export const useOrgStore = create<OrgStore>((set, get) => ({
  merchants: [
    { id: 'M001', businessName: 'CaféFlow Downtown', ownerName: 'Rajesh Kumar', email: 'rajesh@cafeflow.com', phone: '+91-9876543210', registrationDate: '2025-06-15', plan: 'pro', planExpiryDate: '2026-06-15', status: 'active', revenue: 450000, ordersCount: 3200 },
    { id: 'M002', businessName: 'Spice Garden', ownerName: 'Priya Nair', email: 'priya@spicegarden.com', phone: '+91-9876543211', registrationDate: '2025-09-01', plan: 'starter', planExpiryDate: '2026-04-20', status: 'active', revenue: 180000, ordersCount: 1100 },
    { id: 'M003', businessName: 'The Coffee Hub', ownerName: 'Amit Shah', email: 'amit@coffeehub.com', phone: '+91-9876543212', registrationDate: '2025-03-10', plan: 'enterprise', planExpiryDate: '2026-12-31', status: 'active', revenue: 890000, ordersCount: 6500 },
    { id: 'M004', businessName: 'Biryani Palace', ownerName: 'Fatima Begum', email: 'fatima@biryanip.com', phone: '+91-9876543213', registrationDate: '2025-11-20', plan: 'free', planExpiryDate: '2026-04-17', status: 'active', revenue: 45000, ordersCount: 320 },
    { id: 'M005', businessName: 'Vegan Bites', ownerName: 'Sneha Patel', email: 'sneha@veganbites.com', phone: '+91-9876543214', registrationDate: '2026-01-05', plan: 'starter', planExpiryDate: '2026-07-05', status: 'active', revenue: 120000, ordersCount: 780 },
  ],
  activities: [
    { id: 'A1', timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), merchantId: 'M003', merchantName: 'The Coffee Hub', action: 'Plan renewed', detail: 'Enterprise · 12 months', type: 'extend' },
    { id: 'A2', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), merchantId: 'M005', merchantName: 'Vegan Bites', action: 'Merchant onboarded', detail: 'Starter plan', type: 'create' },
    { id: 'A3', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(), merchantId: 'M002', merchantName: 'Spice Garden', action: 'Plan upgraded', detail: 'Free → Starter', type: 'plan' },
  ],
  addMerchant: (m) => set(s => {
    const id = `M${String(s.merchants.length + 1).padStart(3, '0')}`;
    const activity: OrgActivity = { id: `A${Date.now()}`, timestamp: new Date().toISOString(), merchantId: id, merchantName: m.businessName, action: 'Merchant onboarded', detail: `${m.plan} plan`, type: 'create' };
    return { merchants: [...s.merchants, { ...m, id }], activities: [activity, ...s.activities] };
  }),
  updateMerchant: (id, updates) => set(s => ({ merchants: s.merchants.map(m => m.id === id ? { ...m, ...updates } : m) })),
  logActivity: (a) => set(s => ({ activities: [{ ...a, id: `A${Date.now()}`, timestamp: new Date().toISOString() }, ...s.activities].slice(0, 50) })),
  extendPlan: (id, days) => {
    const m = get().merchants.find(x => x.id === id);
    if (!m) return;
    const base = new Date(m.planExpiryDate);
    if (base.getTime() < Date.now()) base.setTime(Date.now());
    base.setDate(base.getDate() + days);
    const newDate = base.toISOString().slice(0, 10);
    const act: OrgActivity = { id: `A${Date.now()}`, timestamp: new Date().toISOString(), merchantId: id, merchantName: m.businessName, action: 'Plan extended', detail: `+${days} days → ${newDate}`, type: 'extend' };
    set(s => ({
      merchants: s.merchants.map(x => x.id === id ? { ...x, planExpiryDate: newDate, status: 'active' as const } : x),
      activities: [act, ...s.activities].slice(0, 50),
    }));
  },
  toggleStatus: (id) => {
    const m = get().merchants.find(x => x.id === id);
    if (!m) return;
    const next: Merchant['status'] = m.status === 'active' ? 'suspended' : 'active';
    const act: OrgActivity = { id: `A${Date.now()}`, timestamp: new Date().toISOString(), merchantId: id, merchantName: m.businessName, action: next === 'active' ? 'Merchant reactivated' : 'Merchant suspended', type: next === 'active' ? 'activate' : 'suspend' };
    set(s => ({
      merchants: s.merchants.map(x => x.id === id ? { ...x, status: next } : x),
      activities: [act, ...s.activities].slice(0, 50),
    }));
  },
}));
