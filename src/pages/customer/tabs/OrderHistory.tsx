import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, ChefHat, CheckCircle2, StickyNote, Send } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useActiveOrders, usePastOrders, useAddSpecialNote, toItemIdFormat } from '@/tanstack/alltanstack';

interface OrderHistoryProps {
  tableNumber: number;
  showOrderTracker: boolean;
  setShowOrderTracker: (val: boolean) => void;
  showPastOrders: boolean;
  setShowPastOrders: (val: boolean) => void;
}

const statusSteps = ['pending', 'preparing', 'ready', 'served'];
const statusLabel = (s: string) => ({ pending: 'Order Received', preparing: 'Being Prepared', ready: 'Ready!', served: 'Served' }[s] || s);
const statusIcon = (s: string) => {
  switch (s) {
    case 'pending': return <Clock className="h-4 w-4 text-accent" />;
    case 'preparing': return <ChefHat className="h-4 w-4 text-info" />;
    case 'ready': return <CheckCircle2 className="h-4 w-4 text-success" />;
    case 'served': return <CheckCircle2 className="h-4 w-4 text-primary" />;
    default: return <Clock className="h-4 w-4" />;
  }
};

// NOTE: backend `active_orders`/`past_orders` items don't include a
// `vegetarian` flag today (see customer_orders.py — item_name, type,
// quantity, price fields only). Kept as optional so this still renders
// safely if that field is added to the backend response later.
const VegIcon = ({ veg }: { veg?: boolean }) => (
  <div className={`h-5 w-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${veg ? 'border-success' : 'border-destructive'}`}>
    <span className={`h-2.5 w-2.5 rounded-full ${veg ? 'bg-success' : 'bg-destructive'}`} />
  </div>
);

export default function OrderHistory({ tableNumber, showOrderTracker, setShowOrderTracker, showPastOrders, setShowPastOrders }: OrderHistoryProps) {
  // FIX: previously pulled from local Zustand `useOrderStore`, which only
  // held hardcoded/in-memory data with no backend connection. Now backed by
  // the real customer_orders.py endpoints via react-query, so this reflects
  // actual DB state and refreshes automatically (active orders poll every
  // 10s to pick up kitchen status changes).
  const { data: activeData, isLoading: activeLoading } = useActiveOrders();
  const { data: pastData, isLoading: pastLoading } = usePastOrders();

  // Backend does not currently filter by tableNumber (it scopes by the
  // logged-in customer via the auth token), so no client-side tableNumber
  // filter is applied here — every order returned already belongs to this
  // customer. If you need table-specific filtering too, that should happen
  // server-side in active_orders/past_orders using the table context.
  const myOrders = activeData?.orders ?? [];
  const myPastOrders = pastData?.orders ?? [];

  // ==========================================================================
  // ADD NOTE (customer_instructions/add_note.py)
  // Only makes sense on ACTIVE orders — the backend looks up the customer's
  // latest order with status in todo/preparing/ready. Keyed by item_id so
  // each item row has its own draft text and its own open/closed state.
  // Requires the backend fix that adds `item_id` to active_orders' item
  // dicts (see customer_orders.py) — without it, item.item_id is undefined
  // and notes can't be targeted to a specific item.
  // ==========================================================================
  const addNoteMutation = useAddSpecialNote();
  const [openNoteFor, setOpenNoteFor] = useState<string | null>(null); // "orderId-idx" key
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});

  const handleNoteChange = (key: string, value: string) => {
    setNoteDrafts((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmitNote = (key: string, itemId: number) => {
    const note = (noteDrafts[key] ?? '').trim();
    if (!note) return;
    addNoteMutation.mutate(
      { item_id: toItemIdFormat(itemId), note },
      {
        onSuccess: () => {
          setNoteDrafts((prev) => ({ ...prev, [key]: '' }));
          setOpenNoteFor(null);
        },
      }
    );
  };

  return (
    <>
      {/* Order Tracker Modal (Active Orders) */}
      <AnimatePresence>
        {showOrderTracker && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-50" onClick={() => setShowOrderTracker(false)} />
            {/* Centered with a flex wrapper (not translate) so framer-motion's scale can't
                shift it; height is capped to the viewport and the list scrolls inside. */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="pointer-events-auto w-full max-w-sm bg-background rounded-2xl border border-border p-5 cafe-shadow-lg max-h-[calc(100dvh-2rem)] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading font-bold text-lg">Your Orders</h3>
                <button onClick={() => setShowOrderTracker(false)} className="h-8 w-8 rounded-xl bg-muted flex items-center justify-center"><X className="h-4 w-4" /></button>
              </div>
              {activeLoading ? (
                <p className="text-center text-muted-foreground py-6">Loading orders...</p>
              ) : myOrders.length === 0 ? (
                <p className="text-center text-muted-foreground py-6">No active orders</p>
              ) : (
                <div className="space-y-4">
                  {myOrders.map((order: any) => (
                    <div key={order.order_id} className="p-4 rounded-2xl bg-card border border-border cafe-shadow">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono font-bold text-sm">{order.order_id}</span>
                        <div className="flex items-center gap-1.5">{statusIcon(order.status)}<span className="text-xs font-medium">{statusLabel(order.status)}</span></div>
                      </div>
                      <div className="flex gap-1 mb-3">{statusSteps.map((step, idx) => {
                        const currentIdx = statusSteps.indexOf(order.status);
                        return <div key={step} className={`flex-1 h-2 rounded-full transition-all ${idx <= currentIdx ? 'bg-gradient-to-r from-primary to-accent' : 'bg-muted'}`} />;
                      })}</div>
                      <div className="space-y-2">{order.items.map((item: any, idx: number) => {
                        const noteKey = `${order.order_id}-${idx}`;
                        const hasItemId = item.item_id !== undefined && item.item_id !== null;
                        return (
                          <div key={noteKey}>
                            <div className="flex justify-between text-xs items-center">
                              <span className="flex items-center gap-1.5">
                                {item.quantity}x {item.item_name}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="text-muted-foreground">₹{item.total_price}</span>
                                {hasItemId && (
                                  <button
                                    onClick={() => setOpenNoteFor(openNoteFor === noteKey ? null : noteKey)}
                                    className="text-muted-foreground hover:text-primary"
                                    title="Add a note for this item"
                                  >
                                    <StickyNote className="h-3.5 w-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                            {openNoteFor === noteKey && (
                              <div className="flex items-center gap-1.5 mt-1.5">
                                <Input
                                  value={noteDrafts[noteKey] ?? ''}
                                  onChange={(e) => handleNoteChange(noteKey, e.target.value)}
                                  placeholder="e.g. less spicy, no onions..."
                                  className="h-8 text-xs rounded-lg"
                                />
                                <button
                                  onClick={() => handleSubmitNote(noteKey, item.item_id)}
                                  disabled={addNoteMutation.isPending || !(noteDrafts[noteKey] ?? '').trim()}
                                  className="h-8 w-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 flex-shrink-0"
                                >
                                  <Send className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}</div>
                      <div className="flex justify-between font-bold text-sm mt-2 pt-2 border-t border-border"><span>Total</span><span>₹{order.total_amount.toFixed(0)}</span></div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Past Orders Modal */}
      <AnimatePresence>
        {showPastOrders && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-50" onClick={() => setShowPastOrders(false)} />
            {/* Centered with a flex wrapper (not translate) so framer-motion's scale can't
                shift it; height is capped to the viewport and the list scrolls inside. */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="pointer-events-auto w-full max-w-sm bg-background rounded-2xl border border-border p-5 cafe-shadow-lg max-h-[calc(100dvh-2rem)] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading font-bold text-lg">Past Orders</h3>
                <button onClick={() => setShowPastOrders(false)} className="h-8 w-8 rounded-xl bg-muted flex items-center justify-center"><X className="h-4 w-4" /></button>
              </div>
              {pastLoading ? (
                <p className="text-center text-muted-foreground py-6">Loading orders...</p>
              ) : myPastOrders.length === 0 ? (
                <p className="text-center text-muted-foreground py-6">No past orders</p>
              ) : (
                <div className="space-y-3">
                  {myPastOrders.map((order: any) => (
                    <div key={order.order_id} className="p-4 rounded-2xl bg-card border border-border cafe-shadow">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono font-bold text-sm">{order.order_id}</span>
                        {order.payment_method && (
                          <Badge variant="outline" className="text-[10px] uppercase">{order.payment_method}</Badge>
                        )}
                      </div>
                      <div className="space-y-1">{order.items.map((item: any, idx: number) => (
                        <div key={`${order.order_id}-${idx}`} className="flex justify-between text-xs">
                          <span className="flex items-center gap-1.5">
                            {item.quantity}x {item.item_name}
                          </span>
                          <span className="text-muted-foreground">₹{item.total_price}</span>
                        </div>
                      ))}</div>
                      <div className="flex justify-between font-bold text-sm mt-2 pt-2 border-t border-border">
                        <span>Total</span><span>₹{order.total_amount.toFixed(0)}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1">{order.date} · {order.time}</p>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}