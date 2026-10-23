import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';

interface BillItem {
  item_name: string;
  quantity: number;
  price: number;
  item_total: number;
}

interface BillDetails {
  restaurant_name: string | null;
  address: string | null;
  gst_no: string | null;
  order_id: string;
  table_no: string | null;
  date: string;
  time: string;
  payment_method: string;
  items: BillItem[];
  subtotal: number;
  cgst: number;
  sgst: number;
  grand_total: number;
}

interface ReceiptModalProps {
  show: boolean;
  bill: BillDetails | null;
  onClose: () => void;
}

const money = (n: number) => `₹${Number(n ?? 0).toFixed(2)}`;
const mono = 'font-mono text-xs';

export default function ReceiptModal({ show, bill, onClose }: ReceiptModalProps) {
  if (!bill) return null;
  const tableLabel = (bill.table_no ?? '').replace(/^T/i, '');

  const Line = ({ k, v, bold }: { k: string; v: string; bold?: boolean }) => (
    <div className={`flex justify-between ${mono} ${bold ? 'font-bold text-sm' : ''}`}>
      <span className={bold ? '' : 'text-muted-foreground'}>{k}</span>
      <span>{v}</span>
    </div>
  );

  return (
    <AnimatePresence>
      {show && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-50" onClick={onClose} />
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-xs bg-background rounded-2xl border border-border p-5 z-50 cafe-shadow-lg">

            {/* header */}
            <div className="text-center pb-3 border-b border-dashed border-border">
              <h3 className="font-heading font-bold text-lg">{bill.restaurant_name ?? 'Receipt'}</h3>
              {bill.address && <p className={`${mono} text-muted-foreground`}>{bill.address}</p>}
              {bill.gst_no && <p className={`${mono} text-muted-foreground`}>GST: {bill.gst_no}</p>}
            </div>

            {/* meta */}
            <div className="py-3 space-y-1 border-b border-dashed border-border">
              <Line k="Order:" v={bill.order_id} />
              <Line k="Table:" v={tableLabel} />
              <Line k="Date:" v={`${bill.date}, ${bill.time}`} />
              <Line k="Payment:" v={(bill.payment_method ?? '').toUpperCase()} />
            </div>

            {/* items */}
            <div className="py-3 space-y-1 border-b border-dashed border-border">
              {bill.items.map((it, i) => (
                <div key={i} className={`flex justify-between ${mono}`}>
                  <span>{it.quantity}x {it.item_name}</span>
                  <span>{money(it.item_total)}</span>
                </div>
              ))}
            </div>

            {/* totals */}
            <div className="py-3 space-y-1">
              <Line k="Subtotal" v={money(bill.subtotal)} />
              <Line k="CGST (2.5%)" v={money(bill.cgst)} />
              <Line k="SGST (2.5%)" v={money(bill.sgst)} />
              <div className="pt-1"><Line k="Grand Total" v={money(bill.grand_total)} bold /></div>
            </div>

            <div className="flex gap-2 mt-2">
              <Button onClick={() => window.print()} className="flex-1 rounded-xl bg-violet-600 hover:bg-violet-700 text-white">
                <Printer className="h-4 w-4 mr-1" /> Print
              </Button>
              <Button onClick={onClose} variant="outline" className="flex-1 rounded-xl">Close</Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}