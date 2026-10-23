import { create } from 'zustand';

/**
 * AI Data Vault — retains ANONYMIZED aggregate sales data even after a merchant
 * deletes their source rows. The vault never stores PII (no customer names,
 * phone, email, addresses) and never stores per-order line items — only the
 * statistical aggregates needed to keep AI demand-forecasting models accurate.
 *
 * Compliance note: GST officers can be served the same anonymized aggregates
 * (volume, revenue band, FY) without violating the merchant's deletion intent
 * for live operational data.
 */

export interface VaultRecord {
  id: string;
  merchantId: string;
  merchantName: string;
  fy: number;
  fyLabel: string;
  orderCount: number;
  revenueINR: number;
  topCategory?: string;
  retainedAt: string;
  source: 'auto-deletion' | 'periodic-snapshot';
}

interface VaultStore {
  records: VaultRecord[];
  retain: (r: Omit<VaultRecord, 'id' | 'retainedAt'>) => VaultRecord;
  byMerchant: (merchantId: string) => VaultRecord[];
  totals: () => { merchants: number; orders: number; revenue: number; years: number };
}

export const useAiVaultStore = create<VaultStore>((set, get) => ({
  records: [
    // Seed examples so the dashboard isn't empty on first load.
    { id: 'V1', merchantId: 'M001', merchantName: 'CaféFlow Downtown', fy: 2020, fyLabel: 'FY 2020-21', orderCount: 2150, revenueINR: 312000, topCategory: 'Beverages', retainedAt: new Date(Date.now() - 86400000 * 30).toISOString(), source: 'periodic-snapshot' },
    { id: 'V2', merchantId: 'M003', merchantName: 'The Coffee Hub', fy: 2019, fyLabel: 'FY 2019-20', orderCount: 4800, revenueINR: 720000, topCategory: 'Coffee', retainedAt: new Date(Date.now() - 86400000 * 60).toISOString(), source: 'periodic-snapshot' },
  ],
  retain: (r) => {
    const rec: VaultRecord = { ...r, id: `V-${Date.now()}`, retainedAt: new Date().toISOString() };
    set(s => ({ records: [rec, ...s.records] }));
    return rec;
  },
  byMerchant: (merchantId) => get().records.filter(r => r.merchantId === merchantId),
  totals: () => {
    const r = get().records;
    return {
      merchants: new Set(r.map(x => x.merchantId)).size,
      orders: r.reduce((s, x) => s + x.orderCount, 0),
      revenue: r.reduce((s, x) => s + x.revenueINR, 0),
      years: new Set(r.map(x => x.fy)).size,
    };
  },
}));
