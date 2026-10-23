import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Minus, Plus, Trash2, ShoppingCart, Banknote, CreditCard, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUpdateCart, useDeleteCartItem, usePlaceOrder } from '@/tanstack/alltanstack';

interface ServerCartItem {
  item_id: number;
  item_name: string;
  quantity: number;
  price_per_item: number;
  total_price: number;
}

interface CartAndCheckoutProps {
  tableNumber: number;
  isPickup: boolean;
  showCart: boolean;
  setShowCart: (v: boolean) => void;
  openOrderTracker: () => void;
  cartItems: ServerCartItem[];
  subtotal: number;
  cgst: number;
  sgst: number;
  total: number;
}

type PaymentMethod = 'CASH' | 'CARD' | 'UPI';

const paymentOptions: { value: PaymentMethod; label: string; icon: typeof Banknote }[] = [
  { value: 'CASH', label: 'Cash', icon: Banknote },
  { value: 'CARD', label: 'Card', icon: CreditCard },
  { value: 'UPI', label: 'UPI', icon: Smartphone },
];

export default function CartAndCheckout({
  tableNumber,
  isPickup,
  showCart,
  setShowCart,
  openOrderTracker,
  cartItems,
  subtotal,
  cgst,
  sgst,
  total,
}: CartAndCheckoutProps) {
  const updateCartMutation = useUpdateCart();
  const deleteCartItemMutation = useDeleteCartItem();
  const placeOrderMutation = usePlaceOrder();

  // FIX: per-item special notes, keyed by menu_item_id — matches the new
  // backend PlaceOrderSchema's `item_notes: Dict[int, str]`. These are only
  // sent when the order is placed (the backend has no per-item note storage
  // on the cart itself, only on order items after the order exists).
  const [itemNotes, setItemNotes] = useState<Record<number, string>>({});
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');

  const handleQuantityChange = (itemId: number, newQty: number) => {
    if (newQty <= 0) {
      deleteCartItemMutation.mutate({ item_id: itemId });
      return;
    }
    updateCartMutation.mutate({ item_id: itemId, quantity: newQty });
  };

  const handleRemove = (itemId: number) => {
    deleteCartItemMutation.mutate({ item_id: itemId });
  };

  const handleNoteChange = (itemId: number, note: string) => {
    setItemNotes((prev) => ({ ...prev, [itemId]: note }));
  };

  const handlePlaceOrder = () => {
    // Only send notes that are non-empty.
    const notesToSend = Object.fromEntries(
      Object.entries(itemNotes).filter(([, v]) => v.trim().length > 0)
    );

    placeOrderMutation.mutate(
      {
        payment_method: paymentMethod,
        item_notes: Object.keys(notesToSend).length > 0 ? (notesToSend as Record<number, string>) : undefined,
      },
      {
        onSuccess: () => {
          setItemNotes({});
          setShowCart(false);
          openOrderTracker();
        },
      }
    );
  };

  return (
    <AnimatePresence>
      {showCart && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-50"
            onClick={() => setShowCart(false)}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.25 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-background z-50 flex flex-col border-l border-border"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="font-heading font-bold text-lg">
                Your Order — {isPickup ? 'Pickup' : `Table ${tableNumber}`}
              </h2>
              <button onClick={() => setShowCart(false)} className="h-8 w-8 rounded-xl bg-muted flex items-center justify-center">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {cartItems.length === 0 && (
                <div className="text-center py-16 text-muted-foreground">
                  <ShoppingCart className="h-10 w-10 mx-auto mb-2 opacity-40" />
                  <p>Your cart is empty</p>
                </div>
              )}
              {cartItems.map((item) => (
                <div key={item.item_id} className="p-3 rounded-2xl border border-border bg-card">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground truncate">{item.item_name}</p>
                      <p className="text-xs text-muted-foreground">₹{item.price_per_item} each</p>
                    </div>
                    <button onClick={() => handleRemove(item.item_id)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleQuantityChange(item.item_id, item.quantity - 1)}
                        className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-6 text-center font-medium">{item.quantity}</span>
                      <button
                        onClick={() => handleQuantityChange(item.item_id, item.quantity + 1)}
                        className="h-8 w-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <span className="font-semibold">₹{item.total_price}</span>
                  </div>
                  {/* Per-item special notes — sent as item_notes when the order is placed */}
                  <Input
                    value={itemNotes[item.item_id] ?? ''}
                    onChange={(e) => handleNoteChange(item.item_id, e.target.value)}
                    placeholder="Special notes (e.g., no onions)..."
                    className="mt-2 h-8 text-xs rounded-lg"
                  />
                </div>
              ))}
            </div>

            {/* Totals + Payment + Place Order */}
            {cartItems.length > 0 && (
              <div className="border-t border-border px-5 py-4 space-y-3">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Subtotal</span><span>₹{subtotal}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>CGST (2.5%)</span><span>₹{cgst}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>SGST (2.5%)</span><span>₹{sgst}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-1">
                  <span>Total</span><span>₹{total}</span>
                </div>

                {/* Payment method */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1.5">Payment method</p>
                  <div className="flex gap-1 bg-muted rounded-xl p-1">
                    {paymentOptions.map((opt) => {
                      const Icon = opt.icon;
                      return (
                        <button
                          key={opt.value}
                          onClick={() => setPaymentMethod(opt.value)}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${
                            paymentMethod === opt.value ? 'bg-card text-foreground cafe-shadow' : 'text-muted-foreground'
                          }`}
                        >
                          <Icon className="h-3.5 w-3.5" /> {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <Button
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground mt-1"
                  disabled={placeOrderMutation.isPending}
                  onClick={handlePlaceOrder}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  {placeOrderMutation.isPending ? 'Placing order…' : `Place Order — ₹${total}`}
                </Button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
