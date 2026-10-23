
import { useState, useMemo } from 'react';
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { Loader2 } from 'lucide-react';
import { usePaymentsDashboard, useFilterRevenueTrends, useFilterPaymentDistribution } from '@/tanstack/alltanstack';
import { ChartFilterPills, timeFilterOptions } from '@/components/ChartFilterPills';

const CHART_COLORS = ['hsl(262, 80%, 55%)', 'hsl(152, 60%, 40%)', 'hsl(210, 80%, 55%)'];

// Distribution filter options — these values must match exactly what the
// backend's filter_payment_distribution route accepts ('today' | '7days' |
// 'month' | 'all'). No remapping needed here, unlike the dashboard filters.
const distributionFilterOptions = [
  { id: 'today', label: 'Today' },
  { id: '7days', label: '7 Days' },
  { id: 'month', label: 'Month' },
  { id: 'all', label: 'All' },
];

export default function PaymentsTab() {
  const { data, isLoading } = usePaymentsDashboard();
  const filterRevenueMut = useFilterRevenueTrends();
  const filterDistributionMut = useFilterPaymentDistribution();

  const [payRevenueTrendFilter, setPayRevenueTrendFilter] = useState('6M');
  const [payDistributionFilter, setPayDistributionFilter] = useState('all');

  // Local override state — null means "use the dashboard's initial data",
  // populated once a filter mutation succeeds.
  const [displayRevenueTrends, setDisplayRevenueTrends] = useState<any[] | null>(null);
  const [displayDistribution, setDisplayDistribution] = useState<Record<string, { amount: number }> | null>(null);

  const paymentsData = data?.payments_dashboard;
  const summary = paymentsData?.summary || { total_revenue: 0, total_orders: 0, average_order_value: 0, total_transactions: 0 };

  // Use the locally-filtered data once a filter has been applied, otherwise
  // fall back to whatever the dashboard loaded initially.
  const revenueTrends = displayRevenueTrends ?? (paymentsData?.revenue_trends?.monthly_revenue || []);
  const distribution = displayDistribution ?? (paymentsData?.payment_distribution || {});

  const distributionChartData = useMemo(
    () => Object.entries(distribution).map(([k, v]: any) => ({ name: k, value: v.amount })),
    [distribution]
  );

  const handleRevenueTrendFilterChange = (filterId: string) => {
    setPayRevenueTrendFilter(filterId);
    filterRevenueMut.mutate(filterId, {
      onSuccess: (res) => setDisplayRevenueTrends(res.monthly_revenue || []),
    });
  };

  const handleDistributionFilterChange = (filterId: string) => {
    setPayDistributionFilter(filterId);
    filterDistributionMut.mutate(filterId, {
      onSuccess: (res) => setDisplayDistribution(res.payment_distribution || {}),
    });
  };

  if (isLoading) return <div className="py-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: 'Total Revenue', value: `₹${summary.total_revenue}`, icon: '💰' },
          { label: 'Total Orders', value: summary.total_orders, icon: '📦' },
          { label: 'Avg Order Value', value: `₹${summary.average_order_value}`, icon: '📈' },
          { label: 'Transactions', value: summary.total_transactions, icon: '💳' },
        ].map(p => (
          <div key={p.label} className="p-4 sm:p-5 rounded-2xl bg-card border border-border cafe-shadow">
            <div className="flex justify-between items-start">
              <div><p className="text-xs text-muted-foreground">{p.label}</p><p className="text-xl font-bold mt-1">{p.value}</p></div>
              <span className="text-xl">{p.icon}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trends */}
        <div className="rounded-2xl bg-card border border-border cafe-shadow p-4 sm:p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-sm">Revenue Trends</h3>
            <ChartFilterPills value={payRevenueTrendFilter} onChange={handleRevenueTrendFilterChange} options={[
              { id: '3M', label: '3M' }, { id: '6M', label: '6M' }, { id: '1Y', label: '1Y' },
            ]} />
          </div>
          {filterRevenueMut.isPending ? (
            <div className="h-[250px] flex items-center justify-center text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={revenueTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" /> <YAxis /> <Tooltip />
                <Line type="monotone" dataKey="revenue" stroke="hsl(262, 80%, 55%)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Distribution Pie Chart */}
        <div className="rounded-2xl bg-card border border-border cafe-shadow p-4 sm:p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-sm">Payment Distribution</h3>
            <ChartFilterPills value={payDistributionFilter} onChange={handleDistributionFilterChange} options={distributionFilterOptions} />
          </div>
          {filterDistributionMut.isPending ? (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : distributionChartData.length === 0 ? (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
              No payments for this filter
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={distributionChartData}
                     cx="50%" cy="50%" outerRadius={80} dataKey="value">
                  {distributionChartData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
