import { create } from 'zustand';

export interface StockItem {
  menuItemId: string;
  quantity: number; // -1 = unlimited
  lastUpdated: Date;
  updatedBy: string;
}

interface StockStore {
  stock: Record<string, StockItem>;
  setStock: (menuItemId: string, quantity: number, updatedBy: string) => void;
  decrementStock: (menuItemId: string, qty: number) => void;
  getStock: (menuItemId: string) => number;
  isOutOfStock: (menuItemId: string) => boolean;
}

export const useStockStore = create<StockStore>((set, get) => ({
  stock: {},
  setStock: (menuItemId, quantity, updatedBy) => set(s => ({
    stock: { ...s.stock, [menuItemId]: { menuItemId, quantity, lastUpdated: new Date(), updatedBy } },
  })),
  decrementStock: (menuItemId, qty) => set(s => {
    const current = s.stock[menuItemId];
    if (!current || current.quantity === -1) return s;
    return { stock: { ...s.stock, [menuItemId]: { ...current, quantity: Math.max(0, current.quantity - qty), lastUpdated: new Date() } } };
  }),
  getStock: (menuItemId) => {
    const item = get().stock[menuItemId];
    return item ? item.quantity : -1; // -1 means unlimited
  },
  isOutOfStock: (menuItemId) => {
    const item = get().stock[menuItemId];
    return item ? item.quantity === 0 : false;
  },
}));
