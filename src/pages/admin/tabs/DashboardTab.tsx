import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { DollarSign, ShoppingBag, Users, TrendingUp, BarChart3, PieChart as PieChartIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import {
  fetchAdminDashboard,
  fetchFilteredRevenue,
  fetchFilteredOrders,
  fetchFilteredSales,
  fetchFilteredTopItems,
  fetchFilteredRecentOrders,
} from '@/AllApis/AllApi';
import { ChartFilterPills, timeFilterOptions } from '@/components/ChartFilterPills';

const CHART_COLORS = ['hsl(262, 80%, 55%)', 'hsl(152, 60%, 40%)', 'hsl(210, 80%, 55%)', 'hsl(38, 92%, 50%)', 'hsl(0, 72%, 51%)'];

// cafe_token first (your app's key), then the others as fallback
const TOKEN_KEYS = ['cafe_token', 'access_token', 'token', 'authToken', 'jwt'];

function getToken(): string {
  for (const key of TOKEN_KEYS) {
    const value = localStorage.getItem(key);
    if (value) return value;
  }
  // Fallback: persisted store JSON, e.g. {"state":{"token":"..."}}
  for (const key of ['cafeflow-auth-storage', 'auth-storage']) {
    try {
      const parsed = JSON.parse(localStorage.getItem(key) || 'null');
      const t = parsed?.state?.token ?? parsed?.token;
      if (t) return t;
    } catch { /* ignore */ }
  }
  return '';
}

// Frontend pill ids -> backend filter strings
const toApiFilter = (f: string) => (f === '7days' || f === '7_days' ? '7 days' : f);

type TopItem = { name: string; value: number; pct: number };
type SalesPoint = { day: string; sales: number };

function normalizeTopItems(raw: any): TopItem[] {
  const list = Array.isArray(raw) ? raw : raw?.top_items_data ?? raw?.top_items ?? [];
  return list.map((item: any) => ({
    name: item.name ?? item.item_name ?? 'Unknown item',
    value: Number(item.value ?? item.percentage ?? 0),
    pct: Number(item.pct ?? item.percentage ?? 0),
  }));
}

// Backend returns: weekly_sales [{day, revenue}], filter_sales [{Date, revenue}] or [{month, revenue}]
function normalizeSales(raw: any): SalesPoint[] {
  const list = Array.isArray(raw)
    ? raw
    : raw?.revinue_data ?? raw?.revenue_data ?? raw?.weekly_sales ?? [];
  return list.map((i: any) => ({
    day: i.day ?? (i.Date ? String(i.Date).slice(5) : i.month ?? ''),
    sales: Number(i.sales ?? i.revenue ?? 0),
  }));
}

export default function DashboardTab() {
  const token = getToken();
  const navigate = useNavigate();

  const [revenueFilter, setRevenueFilter] = useState('today');
  const [ordersFilter, setOrdersFilter] = useState('today');
  const [salesFilter, setSalesFilter] = useState('7days');
  const [topItemsFilter, setTopItemsFilter] = useState('today');
  const [recentOrdersFilter, setRecentOrdersFilter] = useState('all');

  const [revenue, setRevenue] = useState(0);
  const [revenueGrowth, setRevenueGrowth] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [pendingOrders, setPendingOrders] = useState(0);
  const [activeStaff, setActiveStaff] = useState(0);
  const [totalStaff, setTotalStaff] = useState(0);
  const [avgOrderValue, setAvgOrderValue] = useState(0);

  const [salesData, setSalesData] = useState<SalesPoint[]>([]);
  const [topItems, setTopItems] = useState<TopItem[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [initialRecentOrders, setInitialRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // ---- Initial full dashboard summary ----
  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    fetchAdminDashboard(token)
      .then(res => {
        // Backend: { message, data: {...}, weekly_sales, top_items, recent_orders }
        const d = res?.data ?? {};
        setRevenue(Number(d.today_revenue ?? 0));
        setRevenueGrowth(Number(d.revenue_growth_percentage ?? 0));
        setTotalOrders(d.total_orders ?? 0);
        setPendingOrders(d.pending_orders ?? 0);
        setActiveStaff(d.active_staff ?? 0);
        setTotalStaff(d.total_staff ?? 0);
        setAvgOrderValue(Number(d.average_order_value ?? 0));
        setSalesData(normalizeSales(res?.weekly_sales ?? []));
        setTopItems(normalizeTopItems(res?.top_items ?? []));
        const recent = Array.isArray(res?.recent_orders) ? res.recent_orders : [];
        setRecentOrders(recent);
        setInitialRecentOrders(recent);
      })
      .catch(err => console.error('fetchAdminDashboard failed:', err))
      .finally(() => setLoading(false));
  }, [token]);

  // ---- Revenue card ----
  useEffect(() => {
    if (!token) return;
    fetchFilteredRevenue(toApiFilter(revenueFilter), token)
      .then(data => {
        setRevenue(Number(data.revinue_data ?? 0));
        setRevenueGrowth(Number(data.revenue_growth_percentage ?? 0));
      })
      .catch(err => console.error('fetchFilteredRevenue failed:', err));
  }, [revenueFilter, token]);

  // ---- Orders card ----
  // Backend: { message, total_orders, pending_Orders }
  useEffect(() => {
    if (!token) return;
    fetchFilteredOrders(toApiFilter(ordersFilter), token)
      .then(data => {
        setTotalOrders(data.total_orders ?? 0);
        setPendingOrders(data.pending_Orders ?? data.pending_orders ?? 0);
      })
      .catch(err => console.error('fetchFilteredOrders failed:', err));
  }, [ordersFilter, token]);

  // ---- Sales chart ----
  useEffect(() => {
    if (!token) return;
    fetchFilteredSales(toApiFilter(salesFilter), token)
      .then(data => setSalesData(normalizeSales(data)))
      .catch(err => console.error('fetchFilteredSales failed:', err));
  }, [salesFilter, token]);

  // ---- Top items donut ----
  useEffect(() => {
    if (!token) return;
    fetchFilteredTopItems(toApiFilter(topItemsFilter), token)
      .then(data => setTopItems(normalizeTopItems(data)))
      .catch(err => console.error('fetchFilteredTopItems failed:', err));
  }, [topItemsFilter, token]);

  // ---- Recent orders table ----
  // 'all' is not a backend filter, so we reuse the initial dashboard data.
  useEffect(() => {
    if (!token) return;
    if (recentOrdersFilter === 'all') {
      setRecentOrders(initialRecentOrders);
      return;
    }
    fetchFilteredRecentOrders(toApiFilter(recentOrdersFilter), token)
      .then(data => setRecentOrders(Array.isArray(data?.recent_orders) ? data.recent_orders : []))
      .catch(err => console.error('fetchFilteredRecentOrders failed:', err));
  }, [recentOrdersFilter, initialRecentOrders, token]);

  const growthLabel = `${revenueGrowth >= 0 ? '+' : ''}${revenueGrowth}% vs previous`;

  const statCards = [
    { label: "Today's Revenue", value: `₹${revenue.toLocaleString()}`, sub: growthLabel, icon: DollarSign, gradient: 'from-primary to-primary/60', filterValue: revenueFilter, setFilter: setRevenueFilter },
    { label: 'Total Orders', value: String(totalOrders), sub: `${pendingOrders} pending`, icon: ShoppingBag, gradient: 'from-accent to-accent/60', filterValue: ordersFilter, setFilter: setOrdersFilter },
    { label: 'Active Staff', value: String(activeStaff), sub: `${totalStaff} total members`, icon: Users, gradient: 'from-success to-success/60' },
    { label: 'Avg Order', value: `₹${avgOrderValue.toFixed(0)}`, sub: '', icon: TrendingUp, gradient: 'from-info to-info/60' },
  ];

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="p-4 sm:p-5 rounded-2xl bg-card border border-border cafe-shadow hover:cafe-shadow-lg transition-all"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-xl sm:text-3xl font-heading font-bold text-foreground mt-1">{stat.value}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 hidden sm:block">{stat.sub}</p>
              </div>
              <div className={`h-9 w-9 sm:h-11 sm:w-11 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center`}>
                <stat.icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary-foreground" />
              </div>
            </div>
            {'setFilter' in stat && stat.setFilter && (
              <div className="mt-2">
                <ChartFilterPills value={stat.filterValue!} onChange={stat.setFilter} options={timeFilterOptions} />
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Weekly sales + Top items */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 rounded-2xl bg-card border border-border cafe-shadow p-4 sm:p-6">
          <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
            <h3 className="font-heading font-bold text-foreground flex items-center gap-2 text-sm sm:text-base">
              <BarChart3 className="h-5 w-5 text-primary" /> Weekly Sales
            </h3>
            <ChartFilterPills value={salesFilter} onChange={setSalesFilter} options={timeFilterOptions} />
          </div>
          {salesData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={salesData}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(262, 80%, 55%)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(262, 80%, 55%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 90%)" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Area type="monotone" dataKey="sales" stroke="hsl(262, 80%, 55%)" fill="url(#salesGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-muted-foreground py-12">{loading ? 'Loading...' : 'No sales data'}</p>
          )}
        </div>

        <div className="lg:col-span-2 rounded-2xl bg-card border border-border cafe-shadow p-4 sm:p-6">
          <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
            <h3 className="font-heading font-bold text-foreground flex items-center gap-2 text-sm sm:text-base">
              <PieChartIcon className="h-5 w-5 text-accent" /> Top Items
            </h3>
            <ChartFilterPills value={topItemsFilter} onChange={setTopItemsFilter} options={timeFilterOptions} />
          </div>
          {topItems.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={topItems} cx="50%" cy="50%" outerRadius={75} innerRadius={40} dataKey="value" paddingAngle={3}>
                    {topItems.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-3">
                {topItems.map((item, i) => (
                  <div key={item.name} className="flex items-center gap-2 text-xs">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                    <span className="flex-1 text-muted-foreground truncate">{item.name}</span>
                    <span className="font-bold">{item.pct}%</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-center text-muted-foreground py-12">{loading ? 'Loading...' : 'No data yet'}</p>
          )}
        </div>
      </div>

      {/* Recent orders */}
      <div className="rounded-2xl bg-card border border-border cafe-shadow">
        <div className="p-4 sm:p-5 border-b border-border flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-heading font-bold text-foreground text-sm sm:text-base">Recent Orders</h3>
          <div className="flex items-center gap-2">
            <ChartFilterPills value={recentOrdersFilter} onChange={setRecentOrdersFilter} options={[{ id: 'all', label: 'All' }, ...timeFilterOptions]} />
            <Button variant="outline" size="sm" className="rounded-xl text-xs h-8" onClick={() => navigate('/admin/orders')}>View All</Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-border text-left">
                {['Order ID', 'Table', 'Items', 'Total', 'Status', 'Time'].map(h => (
                  <th key={h} className="p-3 sm:p-4 text-xs font-semibold text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {recentOrders.map((o: any) => (
                <tr key={o.order_id} className="hover:bg-muted/30 cursor-pointer transition-colors">
                  <td className="p-3 sm:p-4 font-mono text-sm font-bold">{o.order_id}</td>
                  <td className="p-3 sm:p-4 text-sm">
                    <Badge variant="outline">{o.table_number ?? '—'}</Badge>
                  </td>
                  <td className="p-3 sm:p-4 text-sm text-muted-foreground truncate max-w-[200px]">
                    {(o.items || []).map((i: any) => `${i.quantity}x ${i.name}`).join(', ')}
                  </td>
                  <td className="p-3 sm:p-4 text-sm font-bold">₹{Number(o.total_amount ?? 0).toFixed(0)}</td>
                  <td className="p-3 sm:p-4">
                    <span className="px-2.5 py-1 rounded-lg text-xs font-medium capitalize bg-muted">{o.status}</span>
                  </td>
                  <td className="p-3 sm:p-4 text-sm text-muted-foreground">{o.time}</td>
                </tr>
              ))}
              {recentOrders.length === 0 && (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">{loading ? 'Loading...' : 'No orders yet'}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}