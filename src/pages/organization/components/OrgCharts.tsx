import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Legend, ComposedChart, Line
} from 'recharts';
import { TrendingUp, Crown } from 'lucide-react';

const CHART_COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--info))', 'hsl(var(--success))', 'hsl(var(--destructive))'];

export function NetworkGrowthChart({ data }: { data: any[] }) {
  return (
    <div className="h-full rounded-2xl bg-card border border-border cafe-shadow p-4">
      <h3 className="font-heading font-bold text-sm mb-3 flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-primary" /> Network Growth (6 months)
      </h3>
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} />
          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
          <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 12 }} />
          <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="url(#rev)" name="Revenue (₹K)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function PlanDistributionChart({ data }: { data: any[] }) {
  return (
    <div className="h-full rounded-2xl bg-card border border-border cafe-shadow p-4">
      <h3 className="font-heading font-bold text-sm mb-3 flex items-center gap-2">
        <Crown className="h-4 w-4 text-accent" /> Plan Distribution
      </h3>
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} paddingAngle={3}>
            {data.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
          </Pie>
          <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 12 }} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

// Bar click -> onBarClick(merchantName) -> Organization.tsx restaurant revenue modal open chestundi
export function TopRevenueChart({ data, onBarClick }: { data: any[]; onBarClick?: (name: string) => void }) {
  return (
    <div className="h-full rounded-2xl bg-card border border-border cafe-shadow p-4">
      <h3 className="font-heading font-bold text-sm mb-1 flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-success" /> Top 5 Merchants by Revenue
      </h3>
      <p className="text-[11px] text-muted-foreground mb-2">Click a bar to see restaurant-wise revenue</p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} />
          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
          <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 12 }} />
          <Bar
            dataKey="revenue"
            fill="hsl(var(--primary))"
            radius={[8, 8, 0, 0]}
            name="Revenue (₹K)"
            cursor="pointer"
            onClick={(d: any) => onBarClick?.(d?.payload?.name ?? d?.name)}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ⚠️ SAMPLE data tho — real API vachaka Organization.tsx lo merchantGrowth replace cheyi
// data fields: month, new, deleted, active, inactive
export function MerchantGrowthChart({ data }: { data: any[] }) {
  return (
    <div className="rounded-2xl bg-card border border-border cafe-shadow p-4">
      <h3 className="font-heading font-bold text-sm mb-1 flex items-center gap-2">
        <Crown className="h-4 w-4 text-primary" /> Merchants – Monthly
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">Sample data</span>
      </h3>
      <p className="text-[11px] text-muted-foreground mb-2">New added, deleted, active and inactive merchants per month</p>
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} />
          <YAxis allowDecimals={false} stroke="hsl(var(--muted-foreground))" fontSize={11} />
          <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 12 }} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="new" name="New added" fill="hsl(var(--success))" radius={[6, 6, 0, 0]} />
          <Bar dataKey="deleted" name="Deleted" fill="hsl(var(--destructive))" radius={[6, 6, 0, 0]} />
          <Line type="monotone" dataKey="active" name="Active" stroke="hsl(var(--primary))" strokeWidth={2} />
          <Line type="monotone" dataKey="inactive" name="Inactive" stroke="hsl(var(--accent))" strokeWidth={2} strokeDasharray="5 3" />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
