import { ShoppingCart, Plus, Minus, Trash2, IndianRupee, CreditCard, Receipt } from 'lucide-react';
import VegDot from '@/pages/pos/components/VegDot';

export type PaymentTiming = 'pre' | 'post';

interface POSCartProps {
  tableNo: string | null;
  items: any[];
  taxRate: number; // 0.05 => CGST 2.5% + SGST 2.5%
  busy?: boolean;
  creating?: boolean;
  paymentTiming: PaymentTiming;
  onPaymentTimingChange: (t: PaymentTiming) => void;
  onInc: (itemId: number) => void;
  onDec: (itemId: number) => void;
  onRemove: (itemId: number) => void;
  onClear: () => void;
  onCreateOrder: () => void;
}

export default function POSCart({
  tableNo, items, taxRate, busy, creating, paymentTiming, onPaymentTimingChange,
  onInc, onDec, onRemove, onClear, onCreateOrder,
}: POSCartProps) {
  const qtyOf = (i: any) => Number(i.quantity ?? i.qty ?? 0);
  const priceOf = (i: any) => Number(i.price ?? i.unit_price ?? 0);

  const subtotal = items.reduce((sum, i) => sum + priceOf(i) * qtyOf(i), 0);
  const halfTax = Math.round(subtotal * (taxRate / 2));
  const total = subtotal + halfTax * 2;
  const hasItems = !!tableNo && items.length > 0;

  const timingBtn = (active: boolean) =>
    `flex-1 flex items-center justify-center gap-1.5 rounded-xl border px-2 py-2 text-xs font-medium transition-all ${
      active ? 'border-violet-600 bg-violet-50 text-violet-700 ring-1 ring-violet-600' : 'border-border text-muted-foreground'
    }`;

  return (
    <aside className="w-[340px] shrink-0 border-l bg-card flex flex-col h-full">
      <div className="px-5 py-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-2 font-heading font-bold text-lg">
          <ShoppingCart className="h-5 w-5 text-violet-700" /> Current Order
        </div>
        {tableNo && (
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-violet-100 text-violet-700">
            Table {tableNo.replace(/^T/i, '')}
          </span>
        )}
      </div>

      {/* items */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {!hasItems && (
          <div className="h-full flex flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
            <IndianRupee className="h-8 w-8 opacity-40" />
            Select a table &amp; add items
          </div>
        )}
        {hasItems && items.map((i) => (
          <div key={i.item_id} className="flex items-center gap-2 rounded-xl border bg-background px-2.5 py-2">
            {(i.type ?? i.item_category) && <VegDot type={i.type ?? i.item_category} />}
            <div className="flex-1 min-w-0">
              <p className="truncate font-medium text-sm">{i.item_name ?? i.name}</p>
              <p className="text-[11px] text-muted-foreground">₹{priceOf(i)}</p>
            </div>
            <button disabled={busy} onClick={() => onDec(i.item_id)} className="h-6 w-6 flex items-center justify-center rounded-full bg-muted disabled:opacity-50">
              <Minus className="h-3 w-3" />
            </button>
            <span className="w-4 text-center text-sm font-bold">{qtyOf(i)}</span>
            <button disabled={busy} onClick={() => onInc(i.item_id)} className="h-6 w-6 flex items-center justify-center rounded-full bg-violet-600 text-white disabled:opacity-50">
              <Plus className="h-3 w-3" />
            </button>
            <span className="w-14 text-right font-bold text-sm">₹{priceOf(i) * qtyOf(i)}</span>
            <button disabled={busy} onClick={() => onRemove(i.item_id)} className="text-red-400 hover:text-red-600 disabled:opacity-50">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* totals + actions (only when cart has items, like the video) */}
      {hasItems && (
        <div className="border-t p-4 space-y-2 shrink-0">
          <Row label="Subtotal" value={subtotal} />
          <Row label={`CGST (${(taxRate * 50).toFixed(1)}%)`} value={halfTax} />
          <Row label={`SGST (${(taxRate * 50).toFixed(1)}%)`} value={halfTax} />
          <div className="flex justify-between border-t pt-2 text-lg font-bold">
            <span>Total</span>
            <span>₹{total}</span>
          </div>

          <div className="pt-1">
            <p className="text-[11px] text-muted-foreground mb-1.5">Payment Timing</p>
            <div className="flex gap-2">
              <button className={timingBtn(paymentTiming === 'pre')} onClick={() => onPaymentTimingChange('pre')}>
                <CreditCard className="h-3.5 w-3.5" /> Pre-Payment
              </button>
              <button className={timingBtn(paymentTiming === 'post')} onClick={() => onPaymentTimingChange('post')}>
                <Receipt className="h-3.5 w-3.5" /> Post-Payment
              </button>
            </div>
          </div>

          <button
            disabled={creating || busy}
            onClick={onCreateOrder}
            className="w-full mt-2 h-12 rounded-xl bg-violet-600 text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ShoppingCart className="h-4 w-4" />
            {creating ? 'Creating…' : 'Create Order'}
          </button>

          <button onClick={onClear} className="w-full text-sm text-red-600 py-1">
            Clear Cart
          </button>
        </div>
      )}
    </aside>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between text-sm text-muted-foreground">
      <span>{label}</span>
      <span>₹{value}</span>
    </div>
  );
}