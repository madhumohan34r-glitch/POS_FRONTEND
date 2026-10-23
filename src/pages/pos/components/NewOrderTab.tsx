import { useState, useMemo } from 'react';
import { Search, Utensils, GlassWater, Plus, Minus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import type { PayMethod } from '@/AllApis/AllApi';
import { useAuth } from '@/lib/auth-context';
import {
  useCounterNewOrderDashboard,
  useCounterCart,
  useAddToCounterCart,
  useUpdateCounterCartQuantity,
  useDeleteCounterCartItem,
  useClearCounterCart,
  useCreateCounterOrder,
  useConfirmCounterOrder,
  useMarkPaid,
} from '@/tanstack/alltanstack';

import POSCart, { type PaymentTiming } from './POSCart';
import CheckoutModal from './CheckoutModal';
import ReceiptModal from './ReceiptModal';
import VegDot from '@/pages/pos/components/VegDot';

const TAX_RATE = 0.05;

interface NewOrderTable { table_id?: number; table_no: string; status?: string }
interface NewOrderMenuItem {
  item_id: number;
  item_name: string;
  price: number;
  stock?: number;
  category?: string | null;
  is_available?: boolean;
  type?: 'veg' | 'non_veg' | null;         // backend: item_category
  category_type?: 'food' | 'drink' | null; // backend: item_type
  image_url?: string | null;
}

type VegFilter = 'all' | 'veg' | 'nonveg';
type TypeFilter = 'all' | 'food' | 'drink';

// Backend returns HTTP 200 + {success:false,message} when the subscription/feature
// check fails. Without this, every button "does nothing" silently.
const failed = (res: any, fallback: string) => {
  if (res?.success === false) {
    toast.error(res.message || fallback);
    return true;
  }
  return false;
};

interface Props {
  /** called after an order is placed so the parent can switch to the Active Orders tab */
  onOrderPlaced?: () => void;
}

export default function NewOrderTab({ onOrderPlaced }: Props) {
  const { user } = useAuth();

  const { data: dashboard, isLoading, error } = useCounterNewOrderDashboard();
  const tables: NewOrderTable[] = dashboard?.tables ?? [];
  const menuItems: NewOrderMenuItem[] = dashboard?.menu_items ?? [];

  const [tableNo, setTableNo] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [vegFilter, setVegFilter] = useState<VegFilter>('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [paymentTiming, setPaymentTiming] = useState<PaymentTiming>('post');

  const { data: cartData } = useCounterCart(tableNo);
  const cartItems = cartData?.current_order?.items ?? [];

  // item_id -> quantity (for the stepper on each menu card)
  const qtyById = useMemo(() => {
    const m = new Map<number, number>();
    cartItems.forEach((c: any) => m.set(Number(c.item_id), Number(c.quantity ?? c.qty ?? 0)));
    return m;
  }, [cartItems]);

  const addToCart = useAddToCounterCart();
  const updateQty = useUpdateCounterCartQuantity();
  const deleteItem = useDeleteCounterCartItem();
  const clearCart = useClearCounterCart();
  const createOrder = useCreateCounterOrder();
  const confirmOrder = useConfirmCounterOrder();
  const markPaid = useMarkPaid();

  const allCategories = useMemo(() => {
    const cats = new Set(menuItems.map((i) => i.category).filter(Boolean) as string[]);
    return ['All', ...Array.from(cats)];
  }, [menuItems]);

  const filteredItems = useMemo(() => {
    let items = menuItems;
    if (activeCategory !== 'All') items = items.filter((i) => i.category === activeCategory);
    if (vegFilter === 'veg') items = items.filter((i) => i.type === 'veg');
    if (vegFilter === 'nonveg') items = items.filter((i) => i.type === 'non_veg');
    if (typeFilter === 'food') items = items.filter((i) => i.category_type === 'food');
    if (typeFilter === 'drink') items = items.filter((i) => i.category_type === 'drink');
    if (search) items = items.filter((i) => i.item_name?.toLowerCase().includes(search.toLowerCase()));
    return items;
  }, [activeCategory, menuItems, search, vegFilter, typeFilter]);

  const [confirmedOrder, setConfirmedOrder] = useState<{ order_id: string; table_no: string; total_amount: number } | null>(null);
  const [payMethod, setPayMethod] = useState<PayMethod | null>(null);
  const [receiptBill, setReceiptBill] = useState<any>(null);

  // ---------- cart actions (all surface backend `success:false` + errors) ----------
  const inc = (itemId: number) =>
    tableNo && updateQty.mutate(
      { table_no: tableNo, item_id: itemId, action: 'increment' },
      { onSuccess: (r: any) => failed(r, 'Unable to update quantity'), onError: (e: any) => toast.error(e?.response?.data?.detail ?? 'Unable to update quantity') },
    );

  const dec = (itemId: number, currentQty?: number) => {
    if (!tableNo) return;
    // qty 1 -> remove the line instead of sending a decrement to 0
    if (currentQty === 1) return remove(itemId);
    updateQty.mutate(
      { table_no: tableNo, item_id: itemId, action: 'decrement' },
      { onSuccess: (r: any) => failed(r, 'Unable to update quantity'), onError: (e: any) => toast.error(e?.response?.data?.detail ?? 'Unable to update quantity') },
    );
  };

  const remove = (itemId: number) =>
    tableNo && deleteItem.mutate(
      { table_no: tableNo, item_id: itemId },
      { onSuccess: (r: any) => failed(r, 'Unable to remove item'), onError: (e: any) => toast.error(e?.response?.data?.detail ?? 'Unable to remove item') },
    );

  const handleClear = () =>
    tableNo && clearCart.mutate(
      { table_no: tableNo },
      { onSuccess: (r: any) => { if (!failed(r, 'Unable to clear cart')) toast.success('Cart cleared'); }, onError: (e: any) => toast.error(e?.response?.data?.detail ?? 'Unable to clear cart') },
    );

  const handleAddItem = (item: NewOrderMenuItem) => {
    if (!tableNo) { toast.error('Select a table first'); return; }
    addToCart.mutate(
      { table_no: tableNo, item_id: item.item_id, quantity: 1 },
      { onSuccess: (r: any) => failed(r, 'Unable to add item'), onError: (e: any) => toast.error(e?.response?.data?.detail ?? 'Unable to add item') },
    );
  };

  // ---------- create order (summary -> confirm) ----------
  const handleCreateOrder = () => {
    const staffId = Number(user?.id);
    if (!tableNo || cartItems.length === 0) return;
    if (!staffId) { toast.error('Staff id not found, please login again'); return; }
    const table = tableNo;

    createOrder.mutate(
      { table_no: table, staff_id: staffId },
      {
        onSuccess: (summary: any) => {
          if (failed(summary, 'Unable to create order')) return;
          confirmOrder.mutate(
            {
              table_no: table,
              items_count: summary.items_count,
              subtotal: summary.subtotal,
              tax: summary.tax,
              grand_total: summary.grand_total,
            },
            {
              onSuccess: (res: any) => {
                if (failed(res, 'Unable to confirm order')) return;
                toast.success(`Order ${res.order_id} placed for Table ${table.replace(/^T/i, '')}`);
                if (paymentTiming === 'pre') {
                  // pay now -> method picker -> receipt
                  setConfirmedOrder({ order_id: res.order_id, table_no: table, total_amount: res.grand_total });
                } else {
                  // pay later -> straight to Active Orders
                  setTableNo(null);
                  onOrderPlaced?.();
                }
              },
              onError: (e: any) => toast.error(e?.response?.data?.detail ?? 'Unable to confirm order'),
            },
          );
        },
        onError: (e: any) => toast.error(e?.response?.data?.detail ?? 'Unable to create order'),
      },
    );
  };

  const handleConfirmPayment = () => {
    if (!confirmedOrder || !payMethod) return;
    markPaid.mutate(
      { order_id: confirmedOrder.order_id, payment_method: payMethod },
      {
        onSuccess: (res: any) => {
          if (failed(res, 'Payment failed')) return;
          setPayMethod(null);
          setConfirmedOrder(null);
          setTableNo(null);
          if (res?.bill_details) setReceiptBill(res.bill_details);
        },
        onError: (e: any) => toast.error(e?.response?.data?.detail ?? 'Payment failed'),
      },
    );
  };

  const closeReceipt = () => {
    setReceiptBill(null);
    onOrderPlaced?.();
  };

  if (isLoading) return <div className="py-20 text-center text-muted-foreground">Loading…</div>;
  if (error) return <div className="py-20 text-center text-destructive">{(error as Error).message}</div>;

  const chip = (active: boolean) =>
    `px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2 ${
      active ? 'bg-white shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
    }`;

  const tableStyle = (t: NewOrderTable, selected: boolean) => {
    if (selected) return 'bg-violet-600 text-white border-violet-700 shadow-lg shadow-violet-200';
    const s = (t.status ?? '').toLowerCase();
    const busy = s !== '' && !['available', 'free', 'vacant', 'empty'].includes(s);
    return busy
      ? 'bg-red-50 text-red-600 border-red-300'
      : 'bg-emerald-50 text-emerald-700 border-emerald-300';
  };

  return (
    <div className="flex h-full bg-background font-body overflow-hidden">
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="px-6 py-4 shrink-0 space-y-4">
          {/* ---------- Select Table ---------- */}
          <div>
            <h2 className="font-heading text-base text-muted-foreground mb-3">Select Table</h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              {tables.map((t) => (
                <button
                  key={t.table_no}
                  onClick={() => setTableNo(t.table_no)}
                  className={`h-12 rounded-xl border-2 font-bold text-sm transition-all ${tableStyle(t, tableNo === t.table_no)}`}
                >
                  {t.table_no}
                </button>
              ))}
            </div>
          </div>

          {/* ---------- Search ---------- */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search menu..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-11 rounded-xl"
            />
          </div>

          {/* ---------- All / Veg / Non-Veg  +  All / Food / Drinks ---------- */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1 bg-muted/60 rounded-full p-1">
              <button className={chip(vegFilter === 'all')} onClick={() => setVegFilter('all')}>All</button>
              <button className={chip(vegFilter === 'veg')} onClick={() => setVegFilter('veg')}>
                <span className="w-3 h-3 rounded-full bg-green-600" /> Veg
              </button>
              <button className={chip(vegFilter === 'nonveg')} onClick={() => setVegFilter('nonveg')}>
                <span className="w-3 h-3 rounded-full bg-red-600" /> Non-Veg
              </button>
            </div>

            <div className="flex items-center gap-1 bg-muted/60 rounded-full p-1">
              <button className={chip(typeFilter === 'all')} onClick={() => setTypeFilter('all')}>All</button>
              <button className={chip(typeFilter === 'food')} onClick={() => setTypeFilter('food')}>
                <Utensils className="h-4 w-4" /> Food
              </button>
              <button className={chip(typeFilter === 'drink')} onClick={() => setTypeFilter('drink')}>
                <GlassWater className="h-4 w-4" /> Drinks
              </button>
            </div>
          </div>

          {/* ---------- Categories ---------- */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {allCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all capitalize ${
                  activeCategory === cat
                    ? 'bg-violet-600 text-white shadow'
                    : 'bg-card border border-border text-muted-foreground'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* ---------- Menu cards ---------- */}
        <main className="flex-1 overflow-y-auto px-6 pb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredItems.map((item) => {
              const qty = qtyById.get(item.item_id) ?? 0;
              const unavailable = item.is_available === false;
              return (
                <div
                  key={item.item_id}
                  className={`flex flex-col p-4 rounded-2xl border bg-card transition-all ${
                    unavailable ? 'opacity-50' : qty > 0 ? 'border-violet-400' : 'hover:border-violet-400'
                  }`}
                >
                  <div className="h-24 w-full rounded-xl overflow-hidden bg-muted mb-3">
                    {item.image_url && (
                      <img src={item.image_url} alt={item.item_name} className="h-full w-full object-cover" />
                    )}
                  </div>

                  {item.type !== undefined && <VegDot type={item.type} />}
                  <h3 className="font-heading font-semibold mt-1 line-clamp-1">{item.item_name}</h3>
                  <span className="font-bold text-violet-700 mt-1">₹{item.price}</span>
                  {item.stock !== undefined && item.stock !== -1 && (
                    <span className="text-[10px] text-muted-foreground">{item.stock} left</span>
                  )}

                  <div className="border-t mt-3 pt-3">
                    {qty > 0 ? (
                      <div className="flex items-center justify-between">
                        <button
                          disabled={updateQty.isPending || deleteItem.isPending}
                          className="h-8 w-8 rounded-full bg-muted flex items-center justify-center disabled:opacity-50"
                          onClick={() => dec(item.item_id, qty)}
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="font-bold">{qty}</span>
                        <button
                          disabled={updateQty.isPending}
                          className="h-8 w-8 rounded-full bg-violet-600 text-white flex items-center justify-center disabled:opacity-50"
                          onClick={() => inc(item.item_id)}
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        disabled={unavailable || addToCart.isPending}
                        onClick={() => handleAddItem(item)}
                        className="w-full text-center text-sm font-medium text-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {unavailable ? 'Unavailable' : '+ Add to Cart'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {filteredItems.length === 0 && <div className="py-20 text-center text-muted-foreground">No items found.</div>}
        </main>
      </div>

      <POSCart
        tableNo={tableNo}
        items={cartItems}
        taxRate={TAX_RATE}
        busy={updateQty.isPending || deleteItem.isPending || clearCart.isPending}
        creating={createOrder.isPending || confirmOrder.isPending}
        paymentTiming={paymentTiming}
        onPaymentTimingChange={setPaymentTiming}
        onInc={inc}
        onDec={(id: number) => dec(id, qtyById.get(id))}
        onRemove={remove}
        onClear={handleClear}
        onCreateOrder={handleCreateOrder}
      />

      {/* ---------- Pre-payment: choose method ---------- */}
      {confirmedOrder && !payMethod && (
        <div className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-40 flex items-center justify-center">
          <div className="bg-background rounded-2xl border border-border p-6 w-full max-w-sm">
            <h3 className="font-heading font-bold text-lg mb-1">Order {confirmedOrder.order_id} created</h3>
            <p className="text-sm text-muted-foreground mb-4">Total: ₹{confirmedOrder.total_amount.toFixed(0)}</p>
            <div className="grid grid-cols-3 gap-2">
              {(['cash', 'card', 'upi'] as PayMethod[]).map((m) => (
                <Button key={m} variant="outline" className="rounded-xl uppercase" onClick={() => setPayMethod(m)}>{m}</Button>
              ))}
            </div>
            <Button
              variant="ghost"
              className="w-full mt-3 text-muted-foreground"
              onClick={() => { setConfirmedOrder(null); setTableNo(null); onOrderPlaced?.(); }}
            >
              Pay later
            </Button>
          </div>
        </div>
      )}

      <CheckoutModal
        show={!!payMethod}
        order={confirmedOrder}
        method={payMethod ?? 'cash'}
        pending={markPaid.isPending}
        onClose={() => setPayMethod(null)}
        onConfirm={handleConfirmPayment}
      />
      <ReceiptModal show={!!receiptBill} bill={receiptBill} onClose={closeReceipt} />
    </div>
  );
}