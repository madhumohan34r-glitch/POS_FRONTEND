import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import type { Order, OrderPaymentSplit } from '@/lib/menu-data';
import { useOrderStore } from '@/lib/order-store';
import { useCafeStore } from '@/lib/cafe-store';
import { calcChange, sumPaid, formatINR } from '@/lib/payment-utils';
import { toast } from 'sonner';
import { Banknote, CreditCard, Smartphone, Plus, Trash2, Percent } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  order: Order | null;
}

const ICONS = { cash: Banknote, card: CreditCard, upi: Smartphone };

/** Counter checkout dialog: instant discount + split payments + auto change calc. */
export const SplitPaymentDialog = ({ open, onOpenChange, order }: Props) => {
  const { payOrder } = useOrderStore();
  const { discounts } = useCafeStore();
  const [discountType, setDiscountType] = useState<'none' | 'percent' | 'flat' | 'preset'>('none');
  const [discountValue, setDiscountValue] = useState('0');
  const [presetId, setPresetId] = useState<string>('');
  const [reason, setReason] = useState('');
  const [splits, setSplits] = useState<OrderPaymentSplit[]>([]);

  useEffect(() => {
    if (open && order) {
      setDiscountType('none');
      setDiscountValue('0');
      setPresetId('');
      setReason('');
      setSplits([{ method: 'cash', amount: order.grandTotal, cashTendered: order.grandTotal }]);
    }
  }, [open, order]);

  const subtotal = order ? order.total + order.tax : 0;
  const computedDiscount = useMemo(() => {
    if (!order) return 0;
    if (discountType === 'percent') return Math.min(subtotal, subtotal * (parseFloat(discountValue || '0') / 100));
    if (discountType === 'flat') return Math.min(subtotal, parseFloat(discountValue || '0') || 0);
    if (discountType === 'preset') {
      const d = discounts.find(x => x.id === presetId && x.active && x.scope === 'global');
      if (!d) return 0;
      return d.type === 'percentage' ? subtotal * (d.value / 100) : Math.min(subtotal, d.value);
    }
    return 0;
  }, [discountType, discountValue, presetId, subtotal, discounts, order]);

  const grandTotal = Math.max(0, subtotal - computedDiscount);
  const paid = sumPaid(splits);
  const remaining = Math.max(0, grandTotal - paid);
  const change = calcChange(splits);

  const updateSplit = (i: number, patch: Partial<OrderPaymentSplit>) => {
    setSplits(s => s.map((x, idx) => idx === i ? { ...x, ...patch } : x));
  };
  const removeSplit = (i: number) => setSplits(s => s.filter((_, idx) => idx !== i));
  const addSplit = (method: 'cash' | 'card' | 'upi') => {
    setSplits(s => [...s, { method, amount: remaining, cashTendered: method === 'cash' ? remaining : undefined }]);
  };

  const submit = () => {
    if (!order) return;
    const reasonText = discountType === 'preset'
      ? discounts.find(d => d.id === presetId)?.name
      : (reason || (discountType !== 'none' ? `Counter discount (${discountType})` : undefined));
    const r = payOrder(order.id, splits, computedDiscount, reasonText);
    if (!r.success) return toast.error(r.message);
    toast.success(r.change && r.change > 0 ? `Paid. Return change: ${formatINR(r.change)}` : 'Payment recorded');
    onOpenChange(false);
  };

  if (!order) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Checkout — {order.id} (Table {order.tableNumber})</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-xl border border-border/50 p-3 text-sm space-y-1">
            <div className="flex justify-between"><span>Subtotal (incl. tax)</span><span className="font-medium">{formatINR(subtotal)}</span></div>
            <div className="flex justify-between text-emerald-400"><span>Discount</span><span className="font-medium">− {formatINR(computedDiscount)}</span></div>
            <div className="flex justify-between text-base pt-1 border-t border-border/40"><span>Grand Total</span><span className="font-bold">{formatINR(grandTotal)}</span></div>
          </div>

          <div className="rounded-xl border border-border/50 p-3 space-y-3">
            <div className="flex items-center gap-2 font-medium"><Percent className="h-4 w-4" />Instant Discount</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Select value={discountType} onValueChange={(v) => setDiscountType(v as typeof discountType)}>
                <SelectTrigger><SelectValue placeholder="Discount type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No discount</SelectItem>
                  <SelectItem value="percent">Percentage (%)</SelectItem>
                  <SelectItem value="flat">Flat (₹)</SelectItem>
                  <SelectItem value="preset">Preset offer</SelectItem>
                </SelectContent>
              </Select>
              {discountType === 'preset' ? (
                <Select value={presetId} onValueChange={setPresetId}>
                  <SelectTrigger><SelectValue placeholder="Choose offer" /></SelectTrigger>
                  <SelectContent>
                    {discounts.filter(d => d.active && d.scope === 'global').map(d => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input type="number" value={discountValue} onChange={e => setDiscountValue(e.target.value)} disabled={discountType === 'none'} placeholder="Value" />
              )}
              <Input value={reason} onChange={e => setReason(e.target.value)} placeholder="Reason (optional)" />
            </div>
          </div>

          <div className="rounded-xl border border-border/50 p-3 space-y-3">
            <div className="flex justify-between items-center">
              <div className="font-medium">Payment Splits</div>
              <div className="text-xs">
                Paid <span className="font-semibold">{formatINR(paid)}</span> / <span className="font-semibold">{formatINR(grandTotal)}</span>
                {remaining > 0 && <Badge variant="destructive" className="ml-2">Remaining {formatINR(remaining)}</Badge>}
              </div>
            </div>
            <div className="space-y-2">
              {splits.map((s, i) => {
                const Icon = ICONS[s.method];
                return (
                  <div key={i} className="grid grid-cols-12 gap-2 items-center">
                    <Select value={s.method} onValueChange={(v) => updateSplit(i, { method: v as 'cash' | 'card' | 'upi', cashTendered: v === 'cash' ? s.amount : undefined })}>
                      <SelectTrigger className="col-span-3"><div className="flex items-center gap-2"><Icon className="h-4 w-4" /><SelectValue /></div></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
                        <SelectItem value="upi">UPI</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="col-span-3">
                      <Label className="text-xs">Amount</Label>
                      <Input type="number" value={s.amount} onChange={e => updateSplit(i, { amount: parseFloat(e.target.value) || 0 })} />
                    </div>
                    {s.method === 'cash' && (
                      <div className="col-span-3">
                        <Label className="text-xs">Cash tendered</Label>
                        <Input type="number" value={s.cashTendered ?? s.amount} onChange={e => updateSplit(i, { cashTendered: parseFloat(e.target.value) || 0 })} />
                      </div>
                    )}
                    <div className={s.method === 'cash' ? 'col-span-3 text-right' : 'col-span-6 text-right'}>
                      {s.method === 'cash' && (s.cashTendered ?? s.amount) > s.amount && (
                        <Badge variant="outline" className="border-emerald-500/50 text-emerald-400">Change {formatINR((s.cashTendered ?? s.amount) - s.amount)}</Badge>
                      )}
                      <Button variant="ghost" size="icon" className="ml-2" onClick={() => removeSplit(i)} disabled={splits.length === 1}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              <Button variant="outline" size="sm" onClick={() => addSplit('cash')}><Plus className="h-4 w-4 mr-1" />Cash</Button>
              <Button variant="outline" size="sm" onClick={() => addSplit('card')}><Plus className="h-4 w-4 mr-1" />Card</Button>
              <Button variant="outline" size="sm" onClick={() => addSplit('upi')}><Plus className="h-4 w-4 mr-1" />UPI</Button>
            </div>
            {change > 0 && (
              <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3 text-emerald-300 font-semibold">
                💵 Total change to return: {formatINR(change)}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={paid + 0.001 < grandTotal}>Confirm Payment</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SplitPaymentDialog;
