import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Building2, LogOut, Coffee, Settings as SettingsIcon, AlertTriangle, ShieldCheck, Crown,
  Sparkles, Activity, Globe, History, Plus, CreditCard, Download, Wallet, TrendingUp, CalendarPlus,
} from 'lucide-react';
import LiveClock from '@/components/LiveClock';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/lib/auth-context';
import { EmptyState } from '@/components/EmptyState';
import { MerchantOpsPanel } from '@/components/MerchantOpsPanel';
import { toast } from 'sonner';

import MerchantsTable, { type Merchant, type MerchantRow, type Restaurant } from './components/MerchantsTable';
import AddMerchantModal from './components/AddMerchantModal';
import AddRestaurantModal, { RESTAURANT_URL } from './components/AddRestaureantModal';
import MerchantDetailModal from './components/MerchantDetailModal';
import SubscriptionPlansPanel from './components/SubscriptionPlansPanel';
import RestaurantRevenueModal from './components/RestaurantRevenueModal';
import { NetworkGrowthChart, PlanDistributionChart, TopRevenueChart, MerchantGrowthChart } from './components/OrgCharts';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
const ORG = `${API_URL}/organization`;
// ⚠️ Dashboard router prefix main.py lo emi undo adi ikkada set cheyandi
const DASHBOARD_URL = `${ORG}/dashboard`;

const inr = (n: number) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const compact = (n: number) =>
  n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : n >= 1000 ? `₹${(n / 1000).toFixed(1)}K` : inr(n);

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function Organization() {
  const navigate = useNavigate();
  const { user, token, logout } = useAuth();

  const [dash, setDash] = useState<any>(null);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [planNames, setPlanNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [addOpen, setAddOpen] = useState(false);
  const [subsOpen, setSubsOpen] = useState(false);
  const [detailMerchant, setDetailMerchant] = useState<MerchantRow | null>(null);
  const [restaurantFor, setRestaurantFor] = useState<MerchantRow | null>(null);
  // NEW: Total Merchants monthly graph modal + top-chart bar click (merchant name)
  const [growthOpen, setGrowthOpen] = useState(false);
  const [revenueFor, setRevenueFor] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    const h = { headers: { Authorization: `Bearer ${token}` } };
    // allSettled: oka endpoint fail ayina migilina sections pani chestayi
    const [d, m, r, p] = await Promise.allSettled([
      axios.get(DASHBOARD_URL, h),
      axios.get(`${ORG}/merchant/all`, h),
      axios.get(`${RESTAURANT_URL}/all`, h),
      axios.get(`${ORG}/subscription-plans/list`, h),
    ]);
    if (p.status === 'fulfilled' && p.value.data?.success) {
      setPlanNames((p.value.data.data ?? []).map((pl: any) => pl.plan_name));
    }
    if (d.status === 'fulfilled' && d.value.data?.success) setDash(d.value.data.data);
    else toast.error('Could not load the dashboard. Please check the dashboard API URL.');
    if (m.status === 'fulfilled' && m.value.data?.success) setMerchants(m.value.data.data ?? []);
    if (r.status === 'fulfilled') setRestaurants(r.value.data?.restaurants ?? []);
    setLoading(false);
  }, [token]);

  useEffect(() => { if (token) fetchAll(); }, [token, fetchAll]);

  // merchant/all (code, phone, city) + dashboard registered_merchants (plan, expiry, revenue, orders)
  const rows: MerchantRow[] = useMemo(() => {
    const byId = new Map<number, any>((dash?.registered_merchants ?? []).map((r: any) => [r.merchant_id, r]));
    return merchants.map((m) => {
      const d = byId.get(m.id);
      return {
        ...m,
        plan: d?.plan ?? 'Free',
        expiry_date: d?.expiry_date ?? null,
        countdown_days: d?.countdown_days ?? null,
        revenue: d?.revenue ?? 0,
        orders: d?.orders ?? 0,
      };
    });
  }, [merchants, dash]);

  // ⚠️ SAMPLE data — merchants created/deleted date backend lo ledu.
  // Real API vachaka ee useMemo replace cheyi. Fields: month, new, deleted, active, inactive
  // (hooks anni `if (loading)` mundu undali)
  const merchantGrowth = useMemo(() => {
    const activeNow = rows.filter((r) => r.merchant_status === 'active').length;
    const inactiveNow = rows.length - activeNow;
    const now = new Date();
    let prev = 0;
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const active = Math.max(activeNow - (5 - i), 0);
      const row = {
        month: MONTH_NAMES[d.getMonth()],
        new: Math.max(active - prev, 0),
        deleted: i % 3 === 2 ? 1 : 0,
        active,
        inactive: i >= 4 ? inactiveNow : 0,
      };
      prev = active;
      return row;
    });
  }, [rows]);

  const extend = async (m: { id: number; business_name: string }, days: number) => {
    try {
      await axios.post(`${ORG}/merchant_features/extend-subscription`,
        { merchant_id: m.id, extra_days: days },
        { headers: { Authorization: `Bearer ${token}` } });
      toast.success(`${m.business_name} extended by ${days} days`);
      fetchAll();
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Failed to extend subscription');
    }
  };

  const exportCSV = () => {
    const q = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const head = ['Business', 'Code', 'Owner', 'Email', 'Plan', 'Expiry', 'Revenue', 'Orders', 'Status'];
    const body = rows.map((m) => [m.business_name, m.merchant_code, m.owner_name, m.email, m.plan, m.expiry_date, m.revenue, m.orders, m.merchant_status]);
    const blob = new Blob([[head, ...body].map((r) => r.map(q).join(',')).join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `merchants-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast.success('Exported merchants CSV');
  };

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><p className="text-sm text-muted-foreground">Loading organization dashboard...</p></div>;
  }

  const s = dash?.summary ?? {};
  const kpis = [
    { label: 'Total Merchants', value: s.total_merchants ?? rows.length, sub: `${s.active_merchants ?? 0} active · ${s.suspended_merchants ?? 0} suspended`, icon: Building2, color: 'from-primary to-primary/60' },
    { label: 'Network MRR', value: compact(s.network_mrr ?? 0), sub: `ARR ${compact(s.arr ?? 0)} · ARPU ${inr(s.arpu ?? 0)}`, icon: Wallet, color: 'from-success to-success/60' },
    { label: 'GMV (Lifetime)', value: compact(s.gmv_lifetime ?? 0), sub: `${(s.total_orders ?? 0).toLocaleString('en-IN')} orders · avg ${compact(s.avg_gmv_per_merchant ?? 0)}`, icon: TrendingUp, color: 'from-info to-info/60' },
    { label: 'At Risk', value: s.at_risk_merchants ?? 0, sub: `${s.expired_merchants ?? 0} expired · churn ${s.churn_rate ?? 0}%`, icon: AlertTriangle, color: 'from-accent to-accent/60' },
  ];

  // charts file expect chese keys ki map chestunna (revenue ₹K)
  const growth = (dash?.network_growth ?? []).map((g: any) => ({ month: g.month, revenue: Math.round(g.value / 1000) }));
  const plans = (dash?.plan_distribution ?? []).map((p: any) => ({ name: p.plan, value: p.count }));
  const top = (dash?.top_merchants ?? []).map((t: any) => ({ name: t.business_name, revenue: Math.round(t.revenue / 1000) }));
  const activities: any[] = dash?.recent_activities ?? [];
  // backend prathi expired subscription row ni istundi — merchant ki okate chupinchali
  const alerts = Array.from(new Map((dash?.subscription_alerts ?? []).map((a: any) => [a.merchant_id, a])).values()) as any[];
  const gs = dash?.global_settings;
  const emailOf = (id: number) => rows.find((r) => r.id === id)?.email;

  // top chart lo click chesina merchant ki sambandhinchina restaurants
  const revenueMerchant = rows.find((m) => m.business_name === revenueFor);
  const revenueRestaurants = revenueMerchant ? restaurants.filter((r) => r.merchant_id === revenueMerchant.id) : [];

  return (
    <div className="min-h-screen bg-background font-body flex flex-col">
      <header className="sticky top-0 z-40 px-4 sm:px-6 py-3 border-b border-border bg-card/95 backdrop-blur-sm flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary via-accent to-info flex items-center justify-center shadow-lg shadow-primary/20">
            <Crown className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-heading font-bold flex items-center gap-2">
              Organization Console
              <Badge variant="outline" className="text-[9px] uppercase tracking-wider border-accent/40 text-accent">Top-Level</Badge>
            </h1>
            <p className="text-[11px] text-muted-foreground flex items-center gap-1.5"><Globe className="h-3 w-3" /> Network Controller • <LiveClock /></p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <Button size="sm" variant="outline" className="rounded-xl hidden sm:inline-flex" onClick={() => setSubsOpen(true)}><CreditCard className="h-4 w-4 mr-1" /> Subscription Plans</Button>
          <Button size="sm" className="rounded-xl hidden sm:inline-flex" onClick={() => setAddOpen(true)}><Plus className="h-4 w-4 mr-1" /> Add Merchant</Button>
          <Button size="sm" variant="outline" className="rounded-xl hidden sm:inline-flex" onClick={exportCSV}><Download className="h-4 w-4 mr-1" /> Export</Button>
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium flex items-center gap-1 justify-end"><ShieldCheck className="h-3 w-3 text-success" />{user?.name || 'Org Owner'}</p>
            <p className="text-[11px] text-muted-foreground">Organization Owner</p>
          </div>
          <Button variant="outline" size="sm" className="rounded-xl" onClick={() => { logout(); navigate('/login'); }}>
            <LogOut className="h-4 w-4 sm:mr-1" /><span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </header>

      <div className="flex-1 p-4 sm:p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Welcome */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/15 via-accent/10 to-info/15 border border-border p-5 sm:p-7">
          <div className="relative flex items-start justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-heading font-bold flex items-center gap-2">
                Welcome back, {user?.name?.split(' ')[0] || 'Owner'} <Sparkles className="h-5 w-5 text-accent" />
              </h2>
              <p className="text-sm text-muted-foreground mt-1.5 max-w-xl">Monitor every registered merchant, subscription health, network revenue, and global settings from one unified console.</p>
              <div className="flex gap-2 mt-3 sm:hidden">
                <Button size="sm" className="rounded-xl" onClick={() => setAddOpen(true)}><Plus className="h-4 w-4 mr-1" /> Add</Button>
                <Button size="sm" variant="outline" className="rounded-xl" onClick={exportCSV}><Download className="h-4 w-4" /></Button>
              </div>
            </div>
            <div className="px-4 py-3 rounded-xl bg-card/70 border border-border text-right">
              <p className="text-[10px] uppercase text-muted-foreground tracking-wider">Today</p>
              <p className="font-heading font-bold"><LiveClock /></p>
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {kpis.map((k) => {
            const isMerchants = k.label === 'Total Merchants';
            return (
              <div
                key={k.label}
                onClick={isMerchants ? () => setGrowthOpen(true) : undefined}
                className={`p-4 rounded-2xl bg-card border border-border cafe-shadow ${isMerchants ? 'cursor-pointer hover:border-primary/50 transition-colors' : ''}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">{k.label}</p>
                    <p className="text-2xl font-heading font-bold mt-1 truncate">{k.value}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{k.sub}</p>
                    {isMerchants && <p className="text-[10px] text-primary mt-1">Click to view monthly graph</p>}
                  </div>
                  <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${k.color} flex items-center justify-center shrink-0`}>
                    <k.icon className="h-5 w-5 text-primary-foreground" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2"><NetworkGrowthChart data={growth} /></div>
          <PlanDistributionChart data={plans} />
        </div>
        <div className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2"><TopRevenueChart data={top} onBarClick={setRevenueFor} /></div>
          <div className="rounded-2xl bg-card border border-border cafe-shadow p-4 flex flex-col">
            <h3 className="font-heading font-bold text-sm mb-2 flex items-center gap-2"><History className="h-4 w-4 text-info" /> Recent Activity</h3>
            <div className="flex-1 overflow-y-auto max-h-[240px] space-y-1">
              {activities.length === 0 ? (
                <EmptyState compact icon={Activity} title="No activity yet" description="Merchant changes will appear here." />
              ) : activities.map((a, i) => (
                <div key={i} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-muted/40">
                  <div className="h-8 w-8 rounded-lg bg-info/10 text-info flex items-center justify-center shrink-0"><Activity className="h-4 w-4" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{a.activity}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{a.merchant}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0 mt-1">{a.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Subscription alerts */}
        {alerts.length > 0 && (
          <div className="rounded-2xl border border-accent/30 bg-accent/5 p-4">
            <h3 className="font-heading font-bold text-sm mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-accent" /> Subscription Alerts
              <Badge variant="outline" className="text-[10px]">{alerts.length} need attention</Badge>
            </h3>
            <div className="grid sm:grid-cols-2 gap-2">
              {alerts.map((a) => (
                <div key={a.merchant_id} className="flex items-center justify-between gap-2 p-3 rounded-xl bg-card border border-border">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{a.business_name}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{emailOf(a.merchant_id)}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge className="text-[10px] bg-destructive/10 text-destructive">{a.status}</Badge>
                    <Button size="sm" variant="outline" className="h-7 rounded-lg text-xs" onClick={() => extend(a, a.grace_days || 30)}>
                      <CalendarPlus className="h-3 w-3 mr-1" /> +{a.grace_days || 30}d
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <MerchantsTable
          rows={rows}
          restaurants={restaurants}
          planNames={planNames}
          onViewDetails={setDetailMerchant}
          onAddRestaurant={setRestaurantFor}
          onExtend={extend}
          onRefresh={fetchAll}
        />

        <MerchantOpsPanel />

        {/* Global settings — dashboard response nunchi */}
        <div className="rounded-2xl bg-card border border-border cafe-shadow p-4 sm:p-6">
          <h3 className="font-heading font-bold flex items-center gap-2 mb-3"><SettingsIcon className="h-4 w-4 text-primary" /> Global Network Settings</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            <div className="p-3 rounded-xl bg-muted/30 border border-border">
              <p className="text-xs text-muted-foreground">Default currency</p>
              <p className="font-bold mt-1">{gs?.default_currency ?? 'INR'}</p>
            </div>
            <div className="p-3 rounded-xl bg-muted/30 border border-border">
              <p className="text-xs text-muted-foreground">Brand identity</p>
              <p className="font-bold mt-1 flex items-center gap-1"><Coffee className="h-3 w-3" /> {gs?.brand_identity ?? 'CafeFlow'}</p>
            </div>
            <div className="p-3 rounded-xl bg-muted/30 border border-border">
              <p className="text-xs text-muted-foreground">Active modules</p>
              <p className="font-bold mt-1">{(gs?.active_modules ?? []).join(' · ')}</p>
            </div>
          </div>
        </div>
      </div>

      <AddMerchantModal open={addOpen} onOpenChange={setAddOpen} onSuccess={fetchAll} />
      <AddRestaurantModal merchant={restaurantFor} onOpenChange={(o) => !o && setRestaurantFor(null)} onSuccess={fetchAll} />
      <MerchantDetailModal merchant={detailMerchant} onClose={() => setDetailMerchant(null)} onRefresh={fetchAll} />
      <SubscriptionPlansPanel open={subsOpen} onOpenChange={(o) => { setSubsOpen(o); if (!o) fetchAll(); }} />

      {/* NEW: Total Merchants card click -> monthly merchants graph */}
      <Dialog open={growthOpen} onOpenChange={setGrowthOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader><DialogTitle className="font-heading">Merchant Overview</DialogTitle></DialogHeader>
          <MerchantGrowthChart data={merchantGrowth} />
        </DialogContent>
      </Dialog>

      {/* NEW: Top 5 chart bar click -> restaurant-wise revenue (monthly / yearly) */}
      <RestaurantRevenueModal
        merchantName={revenueFor}
        totalRevenueK={top.find((t: any) => t.name === revenueFor)?.revenue ?? 0}
        restaurants={revenueRestaurants}
        onClose={() => setRevenueFor(null)}
      />
    </div>
  );
}
