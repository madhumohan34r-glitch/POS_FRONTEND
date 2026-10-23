import { create } from 'zustand';
import { CartItem, MenuItem, Order, OrderPaymentSplit, TAX_RATE, menuItems as defaultMenuItems } from './menu-data';
import { useCafeStore } from './cafe-store';
import { useStockStore } from './stock-store';

interface OrderStore {
  cart: CartItem[];
  orders: Order[];
  menuItems: MenuItem[];
  tables: { number: number; status: 'vacant' | 'occupied' | 'reserved' }[];
  customCategories: string[];
  // Cart
  addToCart: (item: CartItem) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  updateNotes: (itemId: string, notes: string) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartTax: () => number;
  getCartGrandTotal: () => number;
  // Orders
  placeOrder: (tableNumber: number, paymentMethod: 'cash' | 'card' | 'upi', paymentTiming?: 'prepayment' | 'postpayment', extras?: { discount?: number; discountReason?: string; orderType?: 'dine-in' | 'pickup'; pickupAt?: string; customerName?: string; customerPhone?: string; }) => Order;
  payOrder: (orderId: string, splits: OrderPaymentSplit[], discount?: number, discountReason?: string) => { success: boolean; message: string; change?: number };
  updateOrderStatus: (orderId: string, status: Order['status'], issueNote?: string) => void;
  updateOrderItems: (orderId: string, items: CartItem[]) => void;
  routeOrderToKitchen: (orderId: string) => void;
  cancelOrder: (orderId: string) => void;
  getTableOrders: (tableNumber: number) => Order[];
  // Transfer Table
  transferTable: (orderId: string, newTableNumber: number) => void;
  // Fulfillment Checklist
  toggleItemServed: (orderId: string, itemId: string) => void;
  // Menu
  addMenuItem: (item: Omit<MenuItem, 'id'>) => void;
  updateMenuItem: (id: string, updates: Partial<MenuItem>) => void;
  deleteMenuItem: (id: string) => void;
  toggleItemAvailability: (id: string) => void;
  toggleTodaysSpecial: (id: string) => void;
  bulkAddMenuItems: (items: Omit<MenuItem, 'id'>[]) => void;
  // Categories
  addCustomCategory: (name: string) => void;
  getAllCategories: () => string[];
  // Tables
  getOccupiedTables: () => number[];
}

let orderCounter = 4;

export const useOrderStore = create<OrderStore>((set, get) => ({
  cart: [],
  menuItems: [...defaultMenuItems],
  customCategories: [],
  tables: Array.from({ length: 12 }, (_, i) => ({ number: i + 1, status: 'vacant' as const })),
  orders: [
    {
      id: 'ORD-001', tableNumber: 3,
      items: [
        { id: '3', name: 'Grilled Chicken Panini', description: '', price: 420, category: 'Mains', image: '', available: true, quantity: 2, type: 'food' as const },
        { id: '7', name: 'Iced Caramel Latte', description: '', price: 220, category: 'Beverages', image: '', available: true, quantity: 2, type: 'drink' as const },
      ],
      status: 'preparing', total: 1280, tax: 64, grandTotal: 1344, paymentMethod: 'card', paymentTiming: 'postpayment', routedToKitchen: true,
      createdAt: new Date(Date.now() - 15 * 60000),
    },
    {
      id: 'ORD-002', tableNumber: 7,
      items: [
        { id: '5', name: 'Butter Chicken Bowl', description: '', price: 450, category: 'Mains', image: '', available: true, quantity: 1, type: 'food' as const },
        { id: '6', name: 'Espresso', description: '', price: 150, category: 'Beverages', image: '', available: true, quantity: 1, type: 'drink' as const },
      ],
      status: 'pending', total: 600, tax: 30, grandTotal: 630, paymentMethod: 'upi', paymentTiming: 'postpayment', routedToKitchen: false,
      createdAt: new Date(Date.now() - 5 * 60000),
    },
    {
      id: 'ORD-003', tableNumber: 1,
      items: [
        { id: '9', name: 'Tiramisu', description: '', price: 320, category: 'Desserts', image: '', available: true, quantity: 3, type: 'food' as const },
      ],
      status: 'ready', total: 960, tax: 48, grandTotal: 1008, paymentMethod: 'cash', paymentTiming: 'postpayment', routedToKitchen: true,
      createdAt: new Date(Date.now() - 25 * 60000),
    },
  ],

  addToCart: (item) => set((state) => {
    const existing = state.cart.find(i => i.id === item.id);
    if (existing) {
      return { cart: state.cart.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i) };
    }
    return { cart: [...state.cart, { ...item, quantity: 1 }] };
  }),

  removeFromCart: (itemId) => set((state) => ({
    cart: state.cart.filter(i => i.id !== itemId),
  })),

  updateQuantity: (itemId, quantity) => set((state) => ({
    cart: quantity <= 0
      ? state.cart.filter(i => i.id !== itemId)
      : state.cart.map(i => i.id === itemId ? { ...i, quantity } : i),
  })),

  updateNotes: (itemId, notes) => set((state) => ({
    cart: state.cart.map(i => i.id === itemId ? { ...i, notes } : i),
  })),

  clearCart: () => set({ cart: [] }),

  getCartTotal: () => get().cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
  getCartTax: () => get().getCartTotal() * TAX_RATE,
  getCartGrandTotal: () => get().getCartTotal() + get().getCartTax(),

  placeOrder: (tableNumber, paymentMethod, paymentTiming = 'postpayment', extras) => {
    const state = get();
    const total = state.getCartTotal();
    const tax = state.getCartTax();
    const discount = Math.max(0, extras?.discount ?? 0);
    const hasFoodItems = state.cart.some(i => i.type !== 'drink');
    const { postPaymentDirectToKDS } = useCafeStore.getState().settings;
    const routedToKitchen = !hasFoodItems ? false : paymentTiming === 'prepayment' ? true : postPaymentDirectToKDS;
    const order: Order = {
      id: `ORD-${String(orderCounter++).padStart(3, '0')}`,
      tableNumber,
      items: [...state.cart],
      status: 'pending',
      total,
      tax,
      grandTotal: Math.max(0, total + tax - discount),
      discount: discount || undefined,
      discountReason: extras?.discountReason,
      paymentMethod,
      paymentTiming,
      routedToKitchen,
      createdAt: new Date(),
      orderType: extras?.orderType ?? 'dine-in',
      pickupAt: extras?.pickupAt,
      customerName: extras?.customerName,
      customerPhone: extras?.customerPhone,
      tableHistory: [tableNumber],
    };
    const stockStore = useStockStore.getState();
    state.cart.forEach(item => stockStore.decrementStock(item.id, item.quantity));
    set((s) => ({ orders: [order, ...s.orders], cart: [] }));
    return order;
  },

  payOrder: (orderId, splits, discount, discountReason) => {
    const order = get().orders.find(o => o.id === orderId);
    if (!order) return { success: false, message: 'Order not found' };
    const subtotal = order.total + order.tax;
    const finalDiscount = Math.max(0, discount ?? order.discount ?? 0);
    const grandTotal = Math.max(0, subtotal - finalDiscount);
    const paid = splits.reduce((s, x) => s + (Number.isFinite(x.amount) ? x.amount : 0), 0);
    if (Math.round(paid * 100) < Math.round(grandTotal * 100)) {
      return { success: false, message: `Insufficient payment: collected ₹${paid.toFixed(2)} of ₹${grandTotal.toFixed(2)}` };
    }
    const change = splits.reduce((s, x) => {
      if (x.method !== 'cash') return s;
      const tendered = x.cashTendered ?? x.amount;
      return s + Math.max(0, tendered - x.amount);
    }, 0);
    const primary = splits[0]?.method ?? order.paymentMethod ?? 'cash';
    set(state => ({
      orders: state.orders.map(o => o.id === orderId ? {
        ...o,
        status: 'paid',
        discount: finalDiscount || undefined,
        discountReason: discountReason ?? o.discountReason,
        grandTotal,
        paymentMethod: primary,
        paymentSplits: splits,
        changeReturned: change,
      } : o),
    }));
    return { success: true, message: 'Payment recorded', change };
  },

  updateOrderStatus: (orderId, status, issueNote?: string) => set((state) => ({
    orders: state.orders.map(o => o.id === orderId ? { ...o, status, ...(issueNote !== undefined ? { issueNote } : {}) } : o),
  })),

  updateOrderItems: (orderId, items) => set((state) => ({
    orders: state.orders.map(o => {
      if (o.id !== orderId) return o;
      const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
      const tax = total * TAX_RATE;
      return { ...o, items, total, tax, grandTotal: total + tax };
    }),
  })),

  routeOrderToKitchen: (orderId) => set((state) => ({
    orders: state.orders.map(o => o.id === orderId ? { ...o, routedToKitchen: true } : o),
  })),

  cancelOrder: (orderId) => set((state) => ({
    orders: state.orders.filter(o => o.id !== orderId),
  })),

  getTableOrders: (tableNumber) => {
    return get().orders.filter(o => o.tableNumber === tableNumber && !['paid', 'served'].includes(o.status));
  },

  transferTable: (orderId, newTableNumber) => set((state) => ({
    orders: state.orders.map(o => {
      if (o.id !== orderId) return o;
      const history = o.tableHistory && o.tableHistory.length ? [...o.tableHistory] : [o.tableNumber];
      if (history[history.length - 1] !== newTableNumber) history.push(newTableNumber);
      return { ...o, tableNumber: newTableNumber, tableHistory: history };
    }),
  })),

  toggleItemServed: (orderId, itemId) => set((state) => ({
    orders: state.orders.map(o => {
      if (o.id !== orderId) return o;
      return { ...o, items: o.items.map(i => i.id === itemId ? { ...i, served: !i.served } : i) };
    }),
  })),

  getOccupiedTables: () => {
    const activeOrders = get().orders.filter(o => !['paid', 'served'].includes(o.status));
    return [...new Set(activeOrders.map(o => o.tableNumber))];
  },

  addMenuItem: (item) => set((state) => ({
    menuItems: [...state.menuItems, { ...item, id: String(Date.now()) }],
  })),

  updateMenuItem: (id, updates) => set((state) => ({
    menuItems: state.menuItems.map(i => i.id === id ? { ...i, ...updates } : i),
  })),

  deleteMenuItem: (id) => set((state) => ({
    menuItems: state.menuItems.filter(i => i.id !== id),
  })),

  toggleItemAvailability: (id) => set((state) => ({
    menuItems: state.menuItems.map(i => i.id === id ? { ...i, available: !i.available } : i),
  })),

  toggleTodaysSpecial: (id) => set((state) => ({
    menuItems: state.menuItems.map(i => i.id === id ? { ...i, todaysSpecial: !i.todaysSpecial } : i),
  })),

  bulkAddMenuItems: (items) => set((state) => ({
    menuItems: [...state.menuItems, ...items.map(item => ({ ...item, id: String(Date.now() + Math.random()) }))],
  })),

  addCustomCategory: (name) => set((state) => ({
    customCategories: [...state.customCategories, name],
  })),

  getAllCategories: () => {
    const { customCategories } = get();
    const base = ['All', 'Starters', 'Mains', 'Beverages', 'Desserts', 'Snacks'];
    return [...base, ...customCategories.filter(c => !base.includes(c))];
  },
}));
