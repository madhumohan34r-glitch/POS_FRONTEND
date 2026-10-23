import { useMemo, useState } from 'react';
import { Store } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { Restaurant } from './MerchantsTable';

const COLORS = [
  'hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--info))',
  'hsl(var(--success))', 'hsl(var(--destructive))', 'hsl(var(--muted-foreground))',
];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface Props {
  merchantName: string | null;
  totalRevenueK: number; // merchant revenue in ₹K (top chart tho same)
  restaurants: Restaurant[];
  onClose: () => void;
}

// ⚠️ SAMPLE: merchant total revenue ni restaurants madhya split chestundi.
// Real API vachaka ee function ni replace cheyi (rows: { label, [restaurantName]: revenueK }).
function buildData(rs: Restaurant[], totalK: number, mode: 'monthly' | 'yearly') {
  const w = rs.map((r) => ((r.id * 37) % 40) + 60);
  const sum = w.reduce((a, b) => a + b, 0) || 1;
  const share = (i: number) => w[i] / sum;
  const now = new Date();

  const buckets =
    mode === 'monthly'
      ? Array.from({ length: 6 }, (_, i) => {
          const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
          return {
            label: `${MONTHS[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`,
            factor: (0.8 + ((d.getMonth() * 7) % 5) * 0.08) / 12,
          };
        })
      : [2, 1, 0].map((back, i) => ({ label: String(now.getFullYear() - back), factor: [0.5, 0.75, 1][i] }));

  return buckets.map((b) => {
    const row: Record<string, any> = { label: b.label };
    rs.forEach((r, i) => { row[r.name] = Math.round(totalK * b.factor * share(i)); });
    return row;
  });
}

export default function RestaurantRevenueModal({ merchantName, totalRevenueK, restaurants, onClose }: Props) {
  const [mode, setMode] = useState<'monthly' | 'yearly'>('monthly');
  const data = useMemo(() => buildData(restaurants, totalRevenueK, mode), [restaurants, totalRevenueK, mode]);

  return (
    <Dialog open={!!merchantName} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading flex items-center gap-2">
            <Store className="h-4 w-4 text-primary" /> {merchantName} – Restaurant Revenue
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">Sample data</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-2">
          <Button size="sm" className="rounded-xl" variant={mode === 'monthly' ? 'default' : 'outline'} onClick={() => setMode('monthly')}>Monthly</Button>
          <Button size="sm" className="rounded-xl" variant={mode === 'yearly' ? 'default' : 'outline'} onClick={() => setMode('yearly')}>Yearly</Button>
        </div>

        {restaurants.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">Ee merchant ki inka restaurants add cheyaledu.</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {restaurants.map((r, i) => (
                <Bar key={r.id} dataKey={r.name} name={`${r.name} (₹K)`} fill={COLORS[i % COLORS.length]} radius={[6, 6, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}
      </DialogContent>
    </Dialog>
  );
}
