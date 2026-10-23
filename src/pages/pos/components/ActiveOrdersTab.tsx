import { useState, useMemo, useRef, type ReactNode } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  ClipboardList, Minus, Plus, Shuffle, UtensilsCrossed, Check, Send, CreditCard, X, Bell,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import VegDot from '@/pages/pos/components/VegDot';
import {
  markPaidAPI,
  fetchCounterNotifications,
  markNotificationReadAPIcounter,        // PATCH /counter/notifications/read/{id}
  markAllNotificationsReadAPIcounter,    // calls the above for each unread id
  type ActiveOrder,
  type PastOrder,
  type PayMethod,
} from '@/AllApis/AllApi';
import {
  getErrorMessage,
  useCounterActiveOrdersDashboard,
  useCounterPastOrders,
  useCounterNewOrderDashboard,
  useCounterProcessOrder,
  useMarkServed,
  useCounterMarkItemsServed,
  useUpdatePreparingQuantity,
  useConfirmTransferOrder,
} from '@/tanstack/alltanstack';
import { notify } from '@/lib/toastStore'; // global toast (mount <ToastHost /> once in App.tsx)

const rupee = (n: number) => `₹${Math.round(n)}`;

/* ---------- small persistent helpers ---------- */
const load = <T,>(key: string, fallback: T): T => {
  try { const v = localStorage.getItem(key); return v ? (JSON.parse(v) as T) : fallback; }
  catch { return fallback; }
};
const save = (key: string, v: unknown) => { try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* ignore */ } };

// ⚠️ Same token your other counter hooks use. Adjust key if yours differs.
const getCounterToken = () =>
  localStorage.getItem('cafe_token') ||
  localStorage.getItem('access_token') ||
  localStorage.getItem('counter_token') ||
  localStorage.getItem('counterToken') ||
  localStorage.getItem('token') || '';

const SENT_KEY = 'pos_sent_to_kitchen_ids';
// Fallback only: used when backend does not yet return `awaiting_checkout_orders`
const AWAIT_KEY = 'pos_awaiting_checkout';

/* ---------- UI bits ---------- */
function Modal({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl border border-border bg-background p-6" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

function TransferBtn({ onClick }: { onClick: () => void }) {
  return (
    <Button size="sm" variant="outline" className="h-7 gap-1 rounded-lg text-[10px]" onClick={onClick}>
      <Shuffle className="h-3 w-3" /> Transfer
    </Button>
  );
}

type Pill = [label: string, className: string];

function Column({
  title, dot, border, list, pill, render,
}: {
  title: string; dot: string; border: string; list: ActiveOrder[];
  pill: (o: ActiveOrder) => Pill; render: (o: ActiveOrder) => ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 border-b border-border px-1 pb-2">
        <span className={`h-3 w-3 rounded-full ${dot}`} />
        <h3 className="font-heading text-sm font-bold">{title}</h3>
        <Badge variant="outline" className="ml-auto text-[10px]">{list.length}</Badge>
      </div>
      {list.length === 0 && <div className="py-8 text-center text-xs text-muted-foreground/50">No orders</div>}
      {list.map((o) => {
        const p = pill(o);
        return (
          <div key={o.order_id} className={`cafe-shadow rounded-2xl border-2 bg-card p-4 ${border}`}>
            <div className="mb-2 flex items-start justify-between">
              <div>
                <h4 className="font-heading font-bold">Table {o.table_no ?? '—'}</h4>
                <p className="font-mono text-[10px] text-muted-foreground">{o.order_id} • {o.date} {o.time}</p>
              </div>
              <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${p[1]}`}>{p[0]}</span>
            </div>
            {render(o)}
          </div>
        );
      })}
    </div>
  );
}

export default function ActiveOrdersTab() {
  // ---- ALL HOOKS FIRST (before any early return) ----
  const { data, isLoading, error, refetch } = useCounterActiveOrdersDashboard();
  const { data: pastData, refetch: refetchPast } = useCounterPastOrders();
  const { data: menuData } = useCounterNewOrderDashboard();
  const processOrder = useCounterProcessOrder();
  const markServed = useMarkServed();
  const markItemsServed = useCounterMarkItemsServed();
  const updateQty = useUpdatePreparingQuantity();
  const transfer = useConfirmTransferOrder();

  const [view, setView] = useState<'active' | 'past'>('active');
  const [transferId, setTransferId] = useState<string | null>(null);
  const [target, setTarget] = useState('');
  const [sentIds, setSentIds] = useState<string[]>(() => load<string[]>(SENT_KEY, []));
  // order_id -> selected order_item_ids (multi select)
  const [selected, setSelected] = useState<Record<string, number[]>>({});
  // local fallback for fully-served but unpaid orders
  const [awaiting, setAwaiting] = useState<ActiveOrder[]>(() => load<ActiveOrder[]>(AWAIT_KEY, []));
  const [checkout, setCheckout] = useState<ActiveOrder | null>(null);
  const [method, setMethod] = useState<PayMethod>('cash');
  const [tendered, setTendered] = useState('');
  const [receipt, setReceipt] = useState<any | null>(null);
  const baseQty = useRef<Record<string, number>>({});
  // optimistic quantities (key = order_id:menu_item_id) + per-item request lock (no re-render => no flicker)
  const [qtyOver] = useState<Record<string, number>>({});
  const lock = useRef<Set<string>>(new Set());
  const [showNotifs, setShowNotifs] = useState(false);
  // notifications read in this session (server stops sending them after refresh)
  const [readLocal, setReadLocal] = useState<any[]>([]);

  const notifQ = useQuery({
    queryKey: ['counter-notifications-bell'],
    queryFn: () => fetchCounterNotifications(getCounterToken()),
    refetchInterval: 15000,
  });
  // backend returns ONLY unread notifications of this user
  const serverNotifs: any[] = notifQ.data?.data ?? [];
  const isNotifRead = (n: any) => n.is_read === true || readLocal.some((r) => r.id === n.id);
  const unread = serverNotifs.filter((n) => !isNotifRead(n)).length;
  // ones read in this session stay visible (light + tick) until refresh
  const notifList: any[] = [
    ...serverNotifs,
    ...readLocal.filter((r) => !serverNotifs.some((n) => n.id === r.id)),
  ];

  // silent background refresh (no loading screen => no blink)
  const refresh = () => Promise.all([refetch(), refetchPast(), notifQ.refetch()]);
  const markSent = (id: string) =>
    setSentIds((s) => { const n = s.includes(id) ? s : [...s, id]; save(SENT_KEY, n); return n; });
  const setAwait = (fn: (l: ActiveOrder[]) => ActiveOrder[]) =>
    setAwaiting((l) => { const n = fn(l); save(AWAIT_KEY, n); return n; });

  // ---------- notifications (bell) ----------
  const toggleBell = () => setShowNotifs((s) => !s);

  const markRead = useMutation({
    mutationFn: (id: number) => markNotificationReadAPIcounter(id, getCounterToken()),
    onSuccess: (res: any, id) => {
      if (res?.success === false) {
        setReadLocal((l) => l.filter((x) => x.id !== id));
        notify(res.message || 'Unable to update notification', 'error');
      }
      notifQ.refetch();
    },
    onError: (e, id) => {
      setReadLocal((l) => l.filter((x) => x.id !== id));
      notify(getErrorMessage(e), 'error');
    },
  });

  const markAll = useMutation({
    mutationFn: (ids: number[]) => markAllNotificationsReadAPIcounter(ids, getCounterToken()),
    onSuccess: () => notifQ.refetch(),
    onError: (e, ids) => {
      setReadLocal((l) => l.filter((x) => !ids.includes(x.id)));
      notify(getErrorMessage(e), 'error');
    },
  });

  const openNotif = (n: any) => {
    if (isNotifRead(n)) return;
    setReadLocal((l) => [...l, { ...n, is_read: true }]);
    markRead.mutate(n.id);
  };

  const markAllRead = () => {
    const items = notifList.filter((n) => !isNotifRead(n));
    if (!items.length) return;
    setReadLocal((l) => [...l, ...items.map((n) => ({ ...n, is_read: true }))]);
    markAll.mutate(items.map((n) => n.id));
  };

  const pay = useMutation({
    mutationFn: (v: { order_id: string; payment_method: PayMethod; amount_tendered?: number }) =>
      markPaidAPI(v as any, getCounterToken()),
    onSuccess: (res: any, v) => {
      setAwait((l) => l.filter((x) => x.order_id !== v.order_id));
      setCheckout(null);
      setReceipt(res?.bill_details ?? null);
      notify(res?.message ?? `Payment received for ${v.order_id}`);
      refresh();
    },
    onError: (e) => notify(getErrorMessage(e), 'error'),
  });

  // menu lookups (name -> id / price) for the +/- buttons and live totals
  const { menuIdByName, menuPriceByName } = useMemo(() => {
    const ids: Record<string, number> = {};
    const prices: Record<string, number> = {};
    const walk = (node: any) => {
      if (Array.isArray(node)) { node.forEach(walk); return; }
      if (node && typeof node === 'object') {
        const nm = node.item_name ?? node.name;
        const id = node.item_id ?? node.menu_item_id ?? node.id;
        const pr = node.price ?? node.item_price;
        if (typeof nm === 'string') {
          const k = nm.trim().toLowerCase();
          if (typeof id === 'number') ids[k] = id;
          if (pr !== undefined && !isNaN(Number(pr))) prices[k] = Number(pr);
        }
        Object.values(node).forEach(walk);
      }
    };
    walk(menuData);
    return { menuIdByName: ids, menuPriceByName: prices };
  }, [menuData]);

  // ---- EARLY RETURNS (only when there is nothing to show yet) ----
  if (isLoading && !data) return <div className="py-20 text-center text-muted-foreground">Loading orders…</div>;
  if (error && !data) return <div className="py-20 text-center text-destructive">{getErrorMessage(error)}</div>;

  const todo: ActiveOrder[] = data?.todo_orders?.orders ?? [];
  const preparing: ActiveOrder[] = data?.preparing_orders?.orders ?? [];
  const readyApi: ActiveOrder[] = data?.ready_orders?.orders ?? [];
  const awaitingApi: ActiveOrder[] = data?.awaiting_checkout_orders?.orders ?? [];
  const past: PastOrder[] = pastData?.orders ?? [];

  // ready column = backend ready orders + served-but-unpaid orders (Checkout)
  const readyIds = new Set(readyApi.map((o) => o.order_id));
  const apiAwaitIds = new Set(awaitingApi.map((o) => o.order_id));
  const pendingPay: ActiveOrder[] = [
    ...awaitingApi.filter((o) => !readyIds.has(o.order_id)),
    // local fallback (only orders the backend does not already list)
    ...awaiting.filter((o) => !readyIds.has(o.order_id) && !apiAwaitIds.has(o.order_id)),
  ];
  const ready: ActiveOrder[] = [...readyApi, ...pendingPay];
  const isAwaiting = (o: ActiveOrder) => pendingPay.some((x) => x.order_id === o.order_id);
  const activeCount = todo.length + preparing.length + ready.length;

  preparing.forEach((o) => {
    if (baseQty.current[o.order_id] === undefined)
      baseQty.current[o.order_id] = o.items.reduce((s, i) => s + i.quantity, 0);
  });

  const total = (o: ActiveOrder) => Number(o.final_amount ?? o.total_amount ?? 0);

  const qtyOf = (o: ActiveOrder, i: { item_id?: number; item_name: string; quantity: number }) => {
    const mid = i.item_id ?? menuIdByName[String(i.item_name).trim().toLowerCase()];
    return qtyOver[`${o.order_id}:${mid}`] ?? i.quantity;
  };

  // live total while quantities are being changed (items + 5% GST) when every price is known
  const livePreparingTotal = (o: ActiveOrder) => {
    let sub = 0;
    for (const i of o.items) {
      const p = menuPriceByName[String(i.item_name).trim().toLowerCase()];
      if (p === undefined) return total(o);
      sub += p * qtyOf(o, i);
    }
    return Math.round(sub * 1.05);
  };

  const changeQty = async (o: ActiveOrder, menuId: number, action: 'increment' | 'decrement') => {
    const key = `${o.order_id}:${menuId}`;
    if (lock.current.has(key)) return;            // double click block
    lock.current.add(key);
    try {
      const res: any = await updateQty.mutateAsync({ order_id: o.order_id, item_id: menuId, action });
      notify(res?.message ?? 'Quantity updated');
      await refetch();                            // success aite matrame UI update avtundi
    } catch (e) {
      notify(getErrorMessage(e), 'error');        // fail aite UI maaradu, popup matrame
    } finally {
      lock.current.delete(key);
    }
  };

  const canSelect = (o: ActiveOrder) => !isAwaiting(o) && o.items.every((i) => typeof i.order_item_id === 'number');

  const toggleItem = (orderId: string, itemId: number) =>
    setSelected((s) => ({
      ...s,
      [orderId]: (s[orderId] ?? [])[0] === itemId ? [] : [itemId],   // okasari okate
    }));

  const serve = (o: ActiveOrder) => {
    if (!canSelect(o)) {
      markServed.mutate({ order_id: o.order_id }, {
        onSuccess: (res: any) => { notify(res?.message ?? `Order ${o.order_id} served`); refresh(); },
        onError: (e: unknown) => notify(getErrorMessage(e), 'error'),
      });
      return;
    }
    const pending = o.items
      .filter((i) => i.item_status !== 'served')
      .map((i) => i.order_item_id as number);
    const picked = (selected[o.order_id] ?? [])[0];
    // oka item matrame pending unte select avasaram ledu, lekapote oka item select cheyyali
    const ids = picked !== undefined ? [picked] : pending.length === 1 ? pending : [];
    if (!ids.length) { notify('Select an item first, then click Mark Served', 'error'); return; }

    markItemsServed.mutate(
      { order_id: o.order_id, order_item_ids: ids },
      {
        onError: (e: unknown) => notify(getErrorMessage(e), 'error'),
        onSuccess: (res: any) => {
          notify(res?.message ?? 'Item marked as served');
          setSelected((s) => ({ ...s, [o.order_id]: [] }));
          const status = res?.data?.order_status ?? res?.order_status;
          if (status === 'served') {
            setAwait((l) => [
              ...l.filter((x) => x.order_id !== o.order_id),
              { ...o, status: 'served', items: o.items.map((i) => ({ ...i, item_status: 'served' })) },
            ]);
          }
          refresh();
        },
      },
    );
  };

  const openTransfer = (id: string) => { setTransferId(id); setTarget(''); };
  const openCheckout = (o: ActiveOrder) => { setCheckout(o); setMethod('cash'); setTendered(''); };
  const change = checkout ? Math.max(0, Number(tendered || 0) - total(checkout)) : 0;
  const cashShort = method === 'cash' && checkout && tendered !== '' && Number(tendered) < total(checkout);

  return (
    <div className="space-y-4">
      {/* ---------- HEADER ---------- */}
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-heading text-2xl font-bold">
          <ClipboardList className="h-5 w-5 text-primary" /> Orders
        </h2>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button onClick={toggleBell} className="relative rounded-xl bg-muted p-2">
              <Bell className="h-4 w-4" />
              {unread > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-white">{unread}</span>
              )}
            </button>
            {showNotifs && (
              <div className="absolute right-0 z-40 mt-2 max-h-80 w-72 overflow-y-auto rounded-2xl border border-border bg-background p-2 shadow-lg">
                {unread > 0 && (
                  <button
                    disabled={markAll.isPending}
                    onClick={markAllRead}
                    className="mb-1 w-full rounded-lg px-2 py-1 text-right text-[11px] font-medium text-primary hover:bg-muted disabled:opacity-50"
                  >
                    Mark all as read
                  </button>
                )}
                {notifQ.data?.success === false ? (
                  <p className="py-6 text-center text-xs text-muted-foreground">{notifQ.data.message}</p>
                ) : notifList.length === 0 ? (
                  <p className="py-6 text-center text-xs text-muted-foreground">No notifications</p>
                ) : null}
                {notifList.map((n) => {
                  const read = isNotifRead(n);
                  return (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => openNotif(n)}
                      className={`mb-1 block w-full rounded-xl p-2 text-left text-xs ${read ? 'opacity-60' : 'bg-muted/50 hover:bg-muted'}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold">{n.title}</span>
                        <span className="flex items-center gap-1 text-muted-foreground">
                          {n.time}
                          {read && <Check className="h-3 w-3" />}
                        </span>
                      </div>
                      <p className="text-muted-foreground">{n.message}</p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <div className="flex rounded-xl bg-muted p-1 text-xs font-medium">
            {([['active', 'Active', activeCount], ['past', 'Past', past.length]] as const).map(([id, label, n]) => (
              <button key={id} onClick={() => setView(id)}
                className={`rounded-lg px-3 py-1.5 transition-colors ${view === id ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'}`}>
                {label} <span className="ml-1 opacity-60">{n}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ---------- PAST ORDERS ---------- */}
      {view === 'past' && (
        <div className="cafe-shadow rounded-2xl border border-border bg-card p-5">
          <h3 className="font-heading text-lg font-bold">Past Orders</h3>
          <p className="mb-4 text-xs text-muted-foreground">{past.length} completed orders</p>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-xs text-muted-foreground">
                <tr>{['Order ID', 'Table', 'Items', 'Total', 'Payment', 'Time'].map((h) => <th key={h} className="py-2 font-medium">{h}</th>)}</tr>
              </thead>
              <tbody>
                {past.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-xs text-muted-foreground/50">No past orders</td></tr>}
                {past.map((o) => (
                  <tr key={o.order_id} className="border-b border-border/60 last:border-0">
                    <td className="py-3 font-mono text-xs font-bold">{o.order_id}</td>
                    <td><Badge variant="outline" className="text-[10px]">{o.table_no ?? '—'}</Badge></td>
                    <td className="text-muted-foreground">{o.items}</td>
                    <td className="font-bold">{rupee(o.total_amount)}</td>
                    <td><Badge variant="outline" className="text-[10px] uppercase">{o.payment_method ?? '—'}</Badge></td>
                    <td className="text-muted-foreground">{o.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ---------- KANBAN ---------- */}
      {view === 'active' && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* TO DO */}
          <Column
            title="To Do" dot="bg-accent" border="border-accent/30" list={todo}
            pill={() => ['Pending', 'bg-accent/15 text-accent']}
            render={(o) => {
              const sent = o.sent_to_kitchen || sentIds.includes(o.order_id);
              return (
                <>
                  <div className="mb-3 space-y-1">
                    {o.items.map((i, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2"><VegDot type={i.type} />{i.quantity}x {i.item_name}</span>
                        <span className="text-muted-foreground">{rupee((i.price ?? 0) * i.quantity)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between border-t border-border pt-2">
                    <span className="font-bold">{rupee(total(o))}</span>
                    {sent ? (
                      <Badge variant="outline" className="text-[10px]">Sent to kitchen</Badge>
                    ) : (
                      <Button size="sm" className="gap-1 rounded-lg text-xs" disabled={processOrder.isPending}
                        onClick={() => processOrder.mutate(
                          { order_id: o.order_id },
                          {
                            onSuccess: (res: any) => { markSent(o.order_id); notify(res?.message ?? `Order ${o.order_id} sent to kitchen`); refresh(); },
                            // backend says 400 "already sent" -> just reflect it
                            onError: (e: unknown) => { const m = getErrorMessage(e); if (/already sent/i.test(m)) markSent(o.order_id); notify(m, 'error'); },
                          },
                        )}>
                        <Send className="h-3.5 w-3.5" /> Process
                      </Button>
                    )}
                  </div>
                </>
              );
            }}
          />

          {/* PREPARING */}
          <Column
            title="Preparing" dot="bg-info" border="border-info/30" list={preparing}
            pill={() => ['Preparing', 'bg-info/15 text-info']}
            render={(o) => {
              const now = o.items.reduce((s, i) => s + qtyOf(o, i), 0);
              const base = baseQty.current[o.order_id] ?? now;
              return (
                <>
                  {now !== base && (
                    <span className="mb-2 inline-block rounded-full border border-accent/40 bg-accent/10 px-2 py-0.5 text-[10px] font-semibold text-accent">
                      {base} → {now} items
                    </span>
                  )}
                  <div className="mb-3 space-y-1">
                    {o.items.map((i, idx) => {
                      const menuId = i.item_id ?? menuIdByName[String(i.item_name).trim().toLowerCase()];
                      const q = qtyOf(o, i);
                      const noId = !menuId;
                      const onChange = (action: 'increment' | 'decrement') => changeQty(o, menuId!, action);
                      return (
                        <div key={i.item_id ?? `row-${idx}`} className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2"><VegDot type={i.type} />{i.item_name}</span>
                          <div className="flex items-center gap-1">
                            <button className="flex h-5 w-5 items-center justify-center rounded bg-muted disabled:opacity-40"
                              disabled={noId || q <= 1} onClick={() => onChange('decrement')}>
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="w-5 text-center text-xs font-bold">{q}</span>
                            <button className="flex h-5 w-5 items-center justify-center rounded bg-primary text-primary-foreground disabled:opacity-40"
                              disabled={noId} onClick={() => onChange('increment')}>
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold">{rupee(livePreparingTotal(o))}</span>
                    <TransferBtn onClick={() => openTransfer(o.order_id)} />
                  </div>
                </>
              );
            }}
          />

          {/* READY FOR SERVICE */}
          <Column
            title="Ready for Service" dot="bg-success" border="border-success/30" list={ready}
            pill={(o) => isAwaiting(o) ? ['Served', 'bg-primary/10 text-primary'] : ['Ready', 'bg-success/15 text-success']}
            render={(o) => {
              const awaitingPay = isAwaiting(o);
              const selectable = canSelect(o);
              const sel = selected[o.order_id] ?? [];
              const allDone = o.items.every((i) => i.item_status === 'served' || (typeof i.order_item_id === 'number' && sel.includes(i.order_item_id)));
              return (
                <>
                  <div className="mb-2 space-y-2">
                    {o.items.map((i, idx) => {
                      const id = i.order_item_id;
                      const isServed = i.item_status === 'served';
                      const isSel = typeof id === 'number' && sel.includes(id);
                      const on = isServed || isSel;
                      return (
                        <div key={id ?? `row-${idx}`} className="flex items-center justify-between gap-2 text-sm">
                          <div className="flex items-center gap-2">
                            <button type="button"
                              disabled={!selectable || isServed || markItemsServed.isPending}
                              onClick={() => typeof id === 'number' && toggleItem(o.order_id, id)}
                              className={`flex items-center gap-2 rounded-xl border-2 px-3 py-1.5 font-medium transition-colors ${
                                on ? 'border-success bg-success/10 text-success' : 'border-border bg-muted/40'
                              } ${selectable && !isServed ? 'cursor-pointer hover:border-primary/50' : 'cursor-default'}`}>
                              <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                                on ? 'border-success bg-success text-white' : 'border-border bg-background'}`}>
                                {on && <Check className="h-3 w-3" />}
                              </span>
                              <span>{i.quantity}x {i.item_name}</span>
                              {on && (
                                <span className="text-[9px] font-semibold uppercase opacity-70">
                                  {isServed ? 'Served' : 'Tap to undo'}
                                </span>
                              )}
                            </button>
                            <VegDot type={i.type} />
                          </div>
                          <span className="text-muted-foreground">{rupee((i.price ?? 0) * i.quantity)}</span>
                        </div>
                      );
                    })}
                  </div>
                  {(allDone || awaitingPay) && (
                    <p className="mb-2 text-[11px] font-medium text-success">✓ All items served</p>
                  )}

                  <div className="flex items-center justify-between border-t border-border pt-2">
                    <span className="font-bold">{rupee(total(o))}</span>
                    <div className="flex gap-2">
                      {awaitingPay ? (
                        <Button size="sm" className="gap-1 rounded-lg bg-info text-xs text-white hover:bg-info/90"
                          onClick={() => openCheckout(o)}>
                          <CreditCard className="h-3.5 w-3.5" /> Checkout
                        </Button>
                      ) : (
                        <>
                          <TransferBtn onClick={() => openTransfer(o.order_id)} />
                          <Button size="sm" className="gap-1 rounded-lg text-xs"
                            disabled={markServed.isPending || markItemsServed.isPending}
                            onClick={() => serve(o)}>
                            <UtensilsCrossed className="h-3.5 w-3.5" /> Mark Served
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </>
              );
            }}
          />
        </div>
      )}

      {/* ---------- TRANSFER MODAL ---------- */}
      {transferId && (
        <Modal onClose={() => setTransferId(null)}>
          <h3 className="mb-1 font-heading text-lg font-bold">Transfer Table</h3>
          <p className="mb-4 text-xs text-muted-foreground">Move order {transferId} to a different table.</p>
          <label className="mb-1 block text-xs font-medium">Target table number</label>
          <Input autoFocus value={target} onChange={(e) => setTarget(e.target.value)} placeholder="e.g. T4" className="mb-4 rounded-xl" />
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setTransferId(null)}>Cancel</Button>
            <Button className="flex-1 gap-1 rounded-xl" disabled={!target.trim() || transfer.isPending}
              onClick={() => transfer.mutate(
                { order_id: transferId, target_table: target.trim() },
                {
                  onSuccess: (res: any) => { setTransferId(null); notify(res?.message ?? `Order moved to ${target.trim()}`); refresh(); },
                  onError: (e: unknown) => notify(getErrorMessage(e), 'error'),
                },
              )}>
              <Shuffle className="h-4 w-4" /> Confirm Transfer
            </Button>
          </div>
        </Modal>
      )}

      {/* ---------- CHECKOUT MODAL ---------- */}
      {checkout && (
        <Modal onClose={() => setCheckout(null)}>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-heading text-lg font-bold">Checkout — {checkout.order_id} (Table {checkout.table_no ?? '—'})</h3>
            <button onClick={() => setCheckout(null)}><X className="h-4 w-4" /></button>
          </div>
          <div className="mb-3 space-y-1 rounded-xl border border-border p-3 text-sm">
            {checkout.items.map((i, idx) => (
              <div key={idx} className="flex justify-between text-muted-foreground">
                <span>{i.quantity}x {i.item_name}</span><span>{rupee((i.price ?? 0) * i.quantity)}</span>
              </div>
            ))}
            <div className="flex justify-between border-t border-border pt-2 font-bold">
              <span>Grand Total</span><span>{rupee(total(checkout))}</span>
            </div>
          </div>
          <label className="mb-1 block text-xs font-medium">Payment method</label>
          <div className="mb-3 grid grid-cols-3 gap-2">
            {(['cash', 'card', 'upi'] as PayMethod[]).map((m) => (
              <button key={m} onClick={() => setMethod(m)}
                className={`rounded-xl border-2 py-2 text-xs font-semibold uppercase ${method === m ? 'border-primary bg-primary/10 text-primary' : 'border-border'}`}>
                {m}
              </button>
            ))}
          </div>
          {method === 'cash' && (
            <div className="mb-3">
              <label className="mb-1 block text-xs font-medium">Cash tendered</label>
              <Input type="number" value={tendered} onChange={(e) => setTendered(e.target.value)} placeholder={String(Math.round(total(checkout)))} className="rounded-xl" />
              {tendered !== '' && !cashShort && <p className="mt-1 text-xs text-muted-foreground">Change: {rupee(change)}</p>}
              {cashShort && <p className="mt-1 text-xs text-destructive">Amount is less than the total</p>}
            </div>
          )}
          {pay.isError && <p className="mb-2 text-xs text-destructive">{getErrorMessage(pay.error)}</p>}
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setCheckout(null)}>Cancel</Button>
            <Button className="flex-1 rounded-xl" disabled={pay.isPending || !!cashShort}
              onClick={() => pay.mutate({
                order_id: checkout.order_id,
                payment_method: method,
                // blank cash field => assume exact amount
                amount_tendered: method === 'cash' ? (tendered !== '' ? Number(tendered) : total(checkout)) : undefined,
              })}>
              {pay.isPending ? 'Processing…' : 'Confirm Payment'}
            </Button>
          </div>
        </Modal>
      )}

      {/* ---------- RECEIPT ---------- */}
      {receipt && (
        <Modal onClose={() => setReceipt(null)}>
          <div className="text-center">
            <h3 className="font-heading text-lg font-bold">{receipt.restaurant_name ?? 'Receipt'}</h3>
            {receipt.address && <p className="text-[11px] text-muted-foreground">{receipt.address}</p>}
            {receipt.gst_no && <p className="text-[11px] text-muted-foreground">GST: {receipt.gst_no}</p>}
          </div>
          <div className="my-3 space-y-0.5 font-mono text-[11px]">
            <div className="flex justify-between"><span>Order</span><span>{receipt.order_id}</span></div>
            <div className="flex justify-between"><span>Table</span><span>{receipt.table_no ?? '—'}</span></div>
            <div className="flex justify-between"><span>Date</span><span>{receipt.date} {receipt.time}</span></div>
            <div className="flex justify-between"><span>Payment</span><span className="uppercase">{receipt.payment_method}</span></div>
          </div>
          <div className="space-y-0.5 border-y border-dashed border-border py-2 font-mono text-[11px]">
            {(receipt.items ?? []).map((i: any, idx: number) => (
              <div key={idx} className="flex justify-between"><span>{i.quantity}x {i.item_name}</span><span>{rupee(i.item_total)}</span></div>
            ))}
          </div>
          <div className="mt-2 space-y-0.5 font-mono text-[11px]">
            <div className="flex justify-between"><span>Subtotal</span><span>₹{Number(receipt.subtotal).toFixed(2)}</span></div>
            <div className="flex justify-between"><span>CGST</span><span>₹{Number(receipt.cgst).toFixed(2)}</span></div>
            <div className="flex justify-between"><span>SGST</span><span>₹{Number(receipt.sgst).toFixed(2)}</span></div>
            <div className="flex justify-between text-sm font-bold"><span>Grand Total</span><span>₹{Number(receipt.grand_total).toFixed(2)}</span></div>
            {receipt.amount_tendered != null && (
              <>
                <div className="flex justify-between"><span>Cash</span><span>₹{Number(receipt.amount_tendered).toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Change</span><span>₹{Number(receipt.change ?? 0).toFixed(2)}</span></div>
              </>
            )}
          </div>
          <div className="mt-4 flex gap-2">
            <Button className="flex-1 rounded-xl" onClick={() => window.print()}>Print</Button>
            <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setReceipt(null)}>Close</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}