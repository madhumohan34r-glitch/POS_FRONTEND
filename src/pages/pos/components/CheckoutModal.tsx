import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Banknote, CreditCard, Smartphone, CheckCircle2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import type { PayMethod } from '@/AllApis/AllApi';

interface CheckoutModalProps {
  show: boolean;
  order: { order_id: string; table_no: string; total_amount: number } | null;
  method: PayMethod;
  pending?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const ICONS = { cash: Banknote, card: CreditCard, upi: Smartphone } as const;

export default function CheckoutModal({ show, order, method, pending, onClose, onConfirm }: CheckoutModalProps) {
  const due = order?.total_amount ?? 0;
  const [cashReceived, setCashReceived] = useState(due);

  useEffect(() => { setCashReceived(due); }, [order?.order_id, due]);

  if (!order) return null;

  const Icon = ICONS[method];
  const quick = [due, Math.ceil(due / 100) * 100, Math.ceil(due / 500) * 500, 1000, 2000]
    .filter((v, i, a) => a.indexOf(v) === i && v >= due);
  const change = Math.max(0, cashReceived - due);

  const submit = () => {
    if (method === 'cash' && cashReceived < due) {
      toast.error('Cash received is less than the amount due.');
      return;
    }
    onConfirm();
  };

  return (
    <AnimatePresence>
      {show && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-50" onClick={onClose} />
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-md bg-background rounded-2xl border border-border p-6 z-50 cafe-shadow-lg">
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-border">
              <div>
                <h3 className="font-heading font-bold text-xl">Checkout</h3>
                <p className="text-xs text-muted-foreground">{order.order_id} • Table {order.table_no}</p>
              </div>
              <button onClick={onClose} className="h-8 w-8 rounded-xl bg-muted flex items-center justify-center hover:bg-muted/80"><X className="h-4 w-4" /></button>
            </div>

            <div className="bg-card rounded-xl p-5 border border-border mb-5">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground flex items-center gap-2 text-sm"><Icon className="h-4 w-4" /> <span className="uppercase font-semibold">{method}</span></span>
                <span className="text-3xl font-heading font-bold">₹{due.toFixed(0)}</span>
              </div>

              {method === 'cash' && (
                <div className="space-y-4 pt-4 mt-4 border-t border-border">
                  <div>
                    <Label className="text-xs text-muted-foreground mb-2 block">Cash received</Label>
                    <div className="flex flex-wrap gap-2">
                      {quick.map((amt) => (
                        <Button key={amt} size="sm" variant={cashReceived === amt ? 'default' : 'outline'} className="rounded-xl" onClick={() => setCashReceived(amt)}>
                          ₹{amt}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Change to return</span>
                    <span className={`font-bold ${change > 0 ? 'text-success' : ''}`}>₹{change.toFixed(0)}</span>
                  </div>
                </div>
              )}

              {method === 'upi' && <p className="pt-4 mt-4 border-t border-border text-sm text-center text-muted-foreground">Confirm only after the UPI payment shows success.</p>}
              {method === 'card' && <p className="pt-4 mt-4 border-t border-border text-sm text-center text-muted-foreground">Confirm after the card machine approves.</p>}
            </div>

            <Button className="w-full bg-gradient-to-r from-success to-success/80 text-success-foreground rounded-xl py-6 text-base"
              disabled={pending} onClick={submit}>
              <CheckCircle2 className="h-5 w-5 mr-2" /> Complete Payment
            </Button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
