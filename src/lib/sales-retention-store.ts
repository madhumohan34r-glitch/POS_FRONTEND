import { create } from 'zustand';

/**
 * Sales retention policy:
 * - The most recent N fiscal years (default 3) are PROTECTED and cannot be deleted.
 * - Any fiscal year strictly older than the protection window can be deleted by the merchant.
 * - Every deletion is logged for audit and (separately) the anonymized aggregate is sent
 *   to the AI Data Vault before the source rows are removed.
 *
 * Fiscal year convention (India): April 1 – March 31.
 */

export interface FiscalYearSummary {
  fy: number;           // year the FY started in (e.g. 2022 = FY2022-23)
  label: string;        // e.g. "FY 2022-23"
  orders: number;
  revenue: number;
  protected: boolean;
}

export interface RetentionDeletion {
  id: string;
  merchantId: string;
  merchantName: string;
  fy: number;
  fyLabel: string;
  deletedOrders: number;
  deletedRevenue: number;
  deletedBy: string;
  deletedAt: string;
  reason?: string;
}

interface RetentionStore {
  retentionYears: number;
  deletions: RetentionDeletion[];
  setRetentionYears: (n: number) => void;

  /** Returns the FY (start year) of the cutoff. Anything strictly older is deletable. */
  getProtectionCutoffFY: () => number;
  isFyProtected: (fy: number) => boolean;
  fiscalYearLabel: (fy: number) => string;

  /** Records a deletion event. */
  logDeletion: (d: Omit<RetentionDeletion, 'id' | 'deletedAt'>) => RetentionDeletion;
}

export const currentFiscalYear = (date = new Date()): number => {
  const y = date.getFullYear();
  // Before April → FY belongs to previous calendar year
  return date.getMonth() < 3 ? y - 1 : y;
};

export const fyLabel = (fy: number) => `FY ${fy}-${String((fy + 1) % 100).padStart(2, '0')}`;

export const useSalesRetentionStore = create<RetentionStore>((set, get) => ({
  retentionYears: 3,
  deletions: [],
  setRetentionYears: (n) => set({ retentionYears: Math.max(1, Math.min(10, Math.floor(n))) }),

  getProtectionCutoffFY: () => currentFiscalYear() - get().retentionYears + 1,
  isFyProtected: (fy) => fy >= get().getProtectionCutoffFY(),
  fiscalYearLabel: fyLabel,

  logDeletion: (d) => {
    const entry: RetentionDeletion = {
      ...d,
      id: `RD-${Date.now()}`,
      deletedAt: new Date().toISOString(),
    };
    set(s => ({ deletions: [entry, ...s.deletions].slice(0, 200) }));
    return entry;
  },
}));
