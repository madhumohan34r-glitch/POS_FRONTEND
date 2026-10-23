


import { useState, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Search, Filter, Calendar, Download, X, Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useOrdersPageList, useOrderPopup } from '@/tanstack/alltanstack';

// ---------------------------------------------------------------------------
// Backend response shape (confirmed from orders_page.py):
// {
//   message: string,
//   orders_categories: string[],   // e.g. ["all","pending","preparing",...]
//   orders: [{
//     order_id: string,
//     table_number: string,        // actually the table NAME, not a number
//     items: { [itemName: string]: { quantity: number } },  // OBJECT, not array
//     total: number,
//     payment: string,             // key is "payment", not "payment_method"
//     status: string,
//     time: string,                // pre-formatted e.g. "5m ago" — no raw date
//   }],
//   total_orders: number,
//   total_amount_of_all_orders: number,
//   error?: string,                // present when backend caught an exception (still 200 status)
// }
// ---------------------------------------------------------------------------
interface BackendOrder {
  order_id: string;
  table_number: string;
  items: Record<string, { quantity: number }>;
  total: number;
  payment: string;
  status: string;
  time: string;
}

const itemsSummary = (items: Record<string, { quantity: number }>) =>
  Object.entries(items || {}).map(([name, v]) => `${v.quantity}x ${name}`).join(', ');

const statusColor = (s: string) => {
  switch ((s || '').toLowerCase()) {
    case 'pending': return 'bg-accent/10 text-accent';
    case 'preparing': return 'bg-info/10 text-info';
    case 'ready': return 'bg-success/10 text-success';
    case 'served': return 'bg-muted text-muted-foreground';
    case 'paid': return 'bg-primary/10 text-primary';
    default: return 'bg-secondary text-secondary-foreground';
  }
};

export default function OrdersTab() {
  // ---- backend-supported date filter ----
  // Backend Literal values: 'today' | '7 days' | 'month' | 'year' | 'all'
  const [orderDateRange, setOrderDateRange] = useState<'today' | '7 days' | 'month' | 'year' | 'all'>('today');
  const { data: rawResponse, isLoading, isError } = useOrdersPageList(orderDateRange);

  const orders: BackendOrder[] = rawResponse?.orders ?? [];
  const backendError: string | undefined = rawResponse?.error;

  // ---- client-side filters (backend has no status/search param) ----
  const [orderFilter, setOrderFilter] = useState('all'); // status
  const [orderSearch, setOrderSearch] = useState('');

  const [viewingOrder, setViewingOrder] = useState<string | null>(null);
  const { data: detailOrder, isLoading: detailLoading } = useOrderPopup(viewingOrder);

  const filteredOrders = useMemo(() => {
    let result = [...orders];
    if (orderFilter !== 'all') result = result.filter(o => (o.status || '').toLowerCase() === orderFilter);
    if (orderSearch) {
      const q = orderSearch.toLowerCase();
      result = result.filter(o =>
        String(o.order_id).toLowerCase().includes(q) || itemsSummary(o.items).toLowerCase().includes(q)
      );
    }
    // Backend already returns orders sorted by created_at desc — no raw date
    // field is sent back, so we keep backend order instead of re-sorting.
    return result;
  }, [orders, orderFilter, orderSearch]);

  const exportData = (format: 'csv' | 'excel') => {
    const sep = format === 'csv' ? ',' : '\t';
    const header = ['Order ID', 'Table', 'Items', 'Total', 'Status', 'Time'].join(sep) + '\n';
    const rows = filteredOrders.map(o =>
      [o.order_id, o.table_number, `"${itemsSummary(o.items)}"`, `₹${o.total.toFixed(0)}`, o.status, o.time].join(sep)
    ).join('\n');
    const mime = format === 'csv' ? 'text/csv' : 'application/vnd.ms-excel';
    const ext = format === 'csv' ? 'csv' : 'xls';
    const blob = new Blob([header + rows], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `orders-${Date.now()}.${ext}`; a.click();
    URL.revokeObjectURL(url);
    toast.success(`${format.toUpperCase()} exported!`);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-card border border-border cafe-shadow p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none sm:w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search orders..." value={orderSearch} onChange={e => setOrderSearch(e.target.value)} className="pl-9 h-10 rounded-xl" />
            </div>
            <Select value={orderFilter} onValueChange={setOrderFilter}>
              <SelectTrigger className="w-28 sm:w-36 h-10 rounded-xl"><Filter className="h-3 w-3 mr-1" /><SelectValue /></SelectTrigger>
              <SelectContent>{['all', 'pending', 'preparing', 'ready', 'served', 'paid'].map(f => <SelectItem key={f} value={f} className="capitalize">{f}</SelectItem>)}</SelectContent>
            </Select>
            {/* Only the date-ranges the backend actually handles */}
            <Select value={orderDateRange} onValueChange={(v: any) => setOrderDateRange(v)}>
              <SelectTrigger className="w-32 sm:w-40 h-10 rounded-xl"><Calendar className="h-3 w-3 mr-1" /><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="7 days">Last 7 Days</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 flex-wrap">
            {(['csv', 'excel'] as const).map(fmt => (
              <Button key={fmt} variant="outline" size="sm" className="h-10 rounded-xl" onClick={() => exportData(fmt)}>
                <Download className="h-3 w-3 mr-1" /> {fmt.toUpperCase()}
              </Button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead><tr className="border-b border-border text-left">
              {['Order ID', 'Table', 'Items', 'Total', 'Payment', 'Status', 'Time'].map(h => <th key={h} className="p-3 text-xs font-semibold text-muted-foreground">{h}</th>)}
            </tr></thead>
            <tbody className="divide-y divide-border">
              {filteredOrders.map(o => (
                <tr key={o.order_id} className="hover:bg-muted/30 cursor-pointer transition-colors" onClick={() => setViewingOrder(o.order_id)}>
                  <td className="p-3 font-mono text-sm font-bold">{o.order_id}</td>
                  <td className="p-3 text-sm"><Badge variant="outline">{o.table_number}</Badge></td>
                  <td className="p-3 text-sm text-muted-foreground truncate max-w-[200px]">{itemsSummary(o.items)}</td>
                  <td className="p-3 text-sm font-bold">₹{o.total.toFixed(0)}</td>
                  <td className="p-3"><Badge variant="outline" className="text-[10px] uppercase">{o.payment || '—'}</Badge></td>
                  <td className="p-3"><span className={`px-2.5 py-1 rounded-lg text-xs font-medium capitalize ${statusColor(o.status)}`}>{o.status}</span></td>
                  <td className="p-3 text-sm text-muted-foreground">{o.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {isLoading && <p className="p-8 text-center text-muted-foreground">Loading orders...</p>}
        {(isError || backendError) && (
          <p className="p-8 text-center text-destructive">
            Failed to load orders{backendError ? `: ${backendError}` : '. Check console / network tab.'}
          </p>
        )}
        {!isLoading && !isError && !backendError && filteredOrders.length === 0 && <p className="p-8 text-center text-muted-foreground">No orders found</p>}

        <div className="flex items-center justify-between pt-4 border-t border-border mt-4">
          <span className="text-xs text-muted-foreground">{filteredOrders.length} orders</span>
          <span className="text-xs text-muted-foreground">Total: ₹{filteredOrders.reduce((s, o) => s + o.total, 0).toLocaleString()}</span>
        </div>
      </div>

      {/* Order Detail Dialog — fetched live from backend via useOrderPopup
          NOTE: haven't seen the order_popup route yet, so this block still
          uses defensive fallbacks. Send that route's code and I'll lock it in. */}
      <AnimatePresence>
        {viewingOrder && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-50" onClick={() => setViewingOrder(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-50 m-4 sm:m-0">
              <div className="bg-background rounded-2xl border border-border p-5 sm:p-6 cafe-shadow-lg max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-heading font-bold text-lg">Order {viewingOrder}</h3>
                  <button onClick={() => setViewingOrder(null)} className="h-8 w-8 rounded-xl bg-muted flex items-center justify-center"><X className="h-4 w-4" /></button>
                </div>
                {detailLoading && <p className="text-center text-muted-foreground py-8">Loading...</p>}
                {!detailLoading && detailOrder && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      <Badge variant="outline">Table {detailOrder.table_number ?? detailOrder.tableNumber}</Badge>
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-medium capitalize ${statusColor(detailOrder.status)}`}>{detailOrder.status}</span>
                      <Badge variant="outline" className="text-[10px] uppercase">{detailOrder.payment ?? detailOrder.payment_method ?? '—'}</Badge>
                    </div>
                    <div className="bg-card rounded-xl p-4 border border-border space-y-2">
                      {Array.isArray(detailOrder.items)
                        ? detailOrder.items.map((item: any, i: number) => (
                          <div key={i} className="flex justify-between text-sm"><span>{item.quantity}x {item.name}</span><span className="font-bold">₹{item.price * item.quantity}</span></div>
                        ))
                        : Object.entries(detailOrder.items || {}).map(([name, v]: any, i: number) => (
                          <div key={i} className="flex justify-between text-sm"><span>{v.quantity}x {name}</span>{v.price && <span className="font-bold">₹{v.price * v.quantity}</span>}</div>
                        ))}
                      <hr className="border-border" />
                      <div className="flex justify-between font-bold text-base"><span>Total</span><span>₹{Number(detailOrder.total ?? 0).toFixed(0)}</span></div>
                    </div>
                    {(detailOrder.status || '').toLowerCase() === 'ready' && (
                      <Button size="sm" className="w-full bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-xl">
                        <Check className="h-4 w-4 mr-1" /> Mark Served
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
