import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Building2, LogOut, Coffee, Settings as SettingsIcon, TrendingUp, AlertTriangle,
  Search, Filter, Download, ShieldCheck, Crown, Sparkles, Activity, Globe, Calendar,
  Plus, MoreVertical, Pause, Play, CalendarPlus, ArrowUpDown, Wallet, History, ChevronRight
} from 'lucide-react';
import LiveClock from '@/components/LiveClock';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { useOrgStore, daysUntilExpiry, planMonthlyPrice, type Merchant } from '@/lib/org-store';
import { useAuthStore } from '@/lib/auth-store';
import { useCafeStore } from '@/lib/cafe-store';
import { EmptyState } from '@/components/EmptyState';
import { useRelativeTime } from '@/hooks/use-relative-time';
import { MerchantOpsPanel, OnboardingCredentialsDialog } from '@/components/MerchantOpsPanel';
import { createOnboardingPacket, type OnboardingPacket } from '@/lib/onboarding-utils';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Legend
} from 'recharts';
import { toast } from 'sonner';

const CHART_COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--info))', 'hsl(var(--success))', 'hsl(var(--destructive))'];

type SortKey = 'business' | 'plan' | 'expiry' | 'revenue' | 'orders' | 'status';

const ActivityRow = ({ a }: { a: ReturnType<typeof useOrgStore.getState>['activities'][number] }) => {
  const rel = useRelativeTime(a.timestamp);
  const colorMap: Record<string, string> = {
    create: 'bg-success/10 text-success',
    extend: 'bg-info/10 text-info',
    plan: 'bg-primary/10 text-primary',
    suspend: 'bg-destructive/10 text-destructive',
    activate: 'bg-success/10 text-success',
    update: 'bg-muted text-muted-foreground',
  };
  return (
    <div className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-muted/40 transition-colors">
      <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${colorMap[a.type] || 'bg-muted'}`}>
        <Activity className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{a.action}</p>
        <p className="text-[11px] text-muted-foreground truncate">
          {a.merchantName}{a.detail ? ` · ${a.detail}` : ''}
        </p>
      </div>
      <span className="text-[10px] text-muted-foreground shrink-0 mt-1">{rel}</span>
    </div>
  );
};

const Organization = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { merchants, activities, addMerchant, extendPlan, toggleStatus, updateMerchant } = useOrgStore();
  const { settings } = useCafeStore();

  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState<'all' | Merchant['plan']>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | Merchant['status']>('all');
  const [sortKey, setSortKey] = useState<SortKey>('revenue');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const [addOpen, setAddOpen] = useState(false);
  const [detailMerchant, setDetailMerchant] = useState<Merchant | null>(null);
  const [newMerchant, setNewMerchant] = useState({ businessName: '', ownerName: '', email: '', phone: '', plan: 'starter' as Merchant['plan'] });
  const [credentialsPacket, setCredentialsPacket] = useState<{ name: string; packet: OnboardingPacket } | null>(null);

  const handleLogout = () => { logout(); navigate('/login'); };

  const toggleSort = (k: SortKey) => {
    if (sortKey === k) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(k); setSortDir('desc'); }
  };

  const filteredMerchants = useMemo(() => {
    const filtered = merchants.filter(m => {
      const sm = search.toLowerCase();
      const matchSearch = !sm || m.businessName.toLowerCase().includes(sm) || m.ownerName.toLowerCase().includes(sm) || m.email.toLowerCase().includes(sm);
      const matchPlan = planFilter === 'all' || m.plan === planFilter;
      const matchStatus = statusFilter === 'all' || m.status === statusFilter;
      return matchSearch && matchPlan && matchStatus;
    });
    const dir = sortDir === 'asc' ? 1 : -1;
    return [...filtered].sort((a, b) => {
      switch (sortKey) {
        case 'business': return a.businessName.localeCompare(b.businessName) * dir;
        case 'plan': return a.plan.localeCompare(b.plan) * dir;
        case 'expiry': return (new Date(a.planExpiryDate).getTime() - new Date(b.planExpiryDate).getTime()) * dir;
        case 'revenue': return (a.revenue - b.revenue) * dir;
        case 'orders': return (a.ordersCount - b.ordersCount) * dir;
        case 'status': return a.status.localeCompare(b.status) * dir;
      }
    });
  }, [merchants, search, planFilter, statusFilter, sortKey, sortDir]);

  const totalMerchants = merchants.length;
  const activeCount = merchants.filter(m => m.status === 'active').length;
  const suspendedCount = merchants.filter(m => m.status === 'suspended').length;
  const expiringSoon = merchants.filter(m => daysUntilExpiry(m.planExpiryDate) <= 7 && daysUntilExpiry(m.planExpiryDate) > 0);
  const expired = merchants.filter(m => daysUntilExpiry(m.planExpiryDate) <= 0);
  const totalRevenue = merchants.reduce((s, m) => s + m.revenue, 0);
  const totalOrders = merchants.reduce((s, m) => s + m.ordersCount, 0);
  const avgRevenue = totalMerchants ? totalRevenue / totalMerchants : 0;
  const mrr = merchants.filter(m => m.status === 'active').reduce((s, m) => s + planMonthlyPrice(m.plan), 0);
  const arr = mrr * 12;
  const churnRate = totalMerchants ? ((suspendedCount + expired.length) / totalMerchants) * 100 : 0;
  const arpu = activeCount ? mrr / activeCount : 0;

  const planData = (['free', 'starter', 'pro', 'enterprise'] as const).map(p => ({
    name: p.charAt(0).toUpperCase() + p.slice(1),
    value: merchants.filter(m => m.plan === p).length,
  })).filter(p => p.value > 0);

  const topRevenue = [...merchants].sort((a, b) => b.revenue - a.revenue).slice(0, 5).map(m => ({
    name: m.businessName.length > 15 ? m.businessName.slice(0, 13) + '…' : m.businessName,
    revenue: Math.round(m.revenue / 1000),
  }));

  const growthData = [
    { month: 'Nov', merchants: Math.max(1, totalMerchants - 4), revenue: Math.round(totalRevenue * 0.45 / 1000) },
    { month: 'Dec', merchants: Math.max(1, totalMerchants - 3), revenue: Math.round(totalRevenue * 0.55 / 1000) },
    { month: 'Jan', merchants: Math.max(1, totalMerchants - 3), revenue: Math.round(totalRevenue * 0.65 / 1000) },
    { month: 'Feb', merchants: Math.max(1, totalMerchants - 2), revenue: Math.round(totalRevenue * 0.75 / 1000) },
    { month: 'Mar', merchants: Math.max(1, totalMerchants - 1), revenue: Math.round(totalRevenue * 0.88 / 1000) },
    { month: 'Apr', merchants: totalMerchants,                  revenue: Math.round(totalRevenue / 1000) },
  ];

  const stats = [
    { label: 'Total Merchants',  value: totalMerchants,                  sub: `${activeCount} active · ${suspendedCount} suspended`, icon: Building2,  color: 'from-primary to-primary/60' },
    { label: 'Network MRR',      value: `₹${(mrr/1000).toFixed(1)}K`,    sub: `ARR ₹${(arr/100000).toFixed(1)}L · ARPU ₹${arpu.toFixed(0)}`, icon: Wallet,     color: 'from-success to-success/60' },
    { label: 'GMV (Lifetime)',   value: `₹${(totalRevenue / 100000).toFixed(1)}L`, sub: `${totalOrders.toLocaleString()} orders · avg ₹${(avgRevenue/1000).toFixed(0)}K`, icon: TrendingUp, color: 'from-info to-info/60' },
    { label: 'At Risk',          value: expiringSoon.length + expired.length, sub: `${expired.length} expired · churn ${churnRate.toFixed(1)}%`, icon: AlertTriangle, color: 'from-accent to-accent/60' },
  ];

  const exportCSV = () => {
    const rows = [
      ['Business', 'Owner', 'Email', 'Phone', 'Plan', 'Expiry', 'Status', 'Revenue', 'Orders'],
      ...merchants.map(m => [m.businessName, m.ownerName, m.email, m.phone, m.plan, m.planExpiryDate, m.status, m.revenue, m.ordersCount]),
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `merchants-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported merchants CSV');
  };

  const handleAdd = () => {
    if (!newMerchant.businessName || !newMerchant.ownerName || !newMerchant.email) {
      toast.error('Business name, owner and email are required');
      return;
    }
    const expiry = new Date();
    expiry.setMonth(expiry.getMonth() + (newMerchant.plan === 'free' ? 1 : 12));
    addMerchant({
      ...newMerchant,
      registrationDate: new Date().toISOString().slice(0, 10),
      planExpiryDate: expiry.toISOString().slice(0, 10),
      status: 'active',
      revenue: 0,
      ordersCount: 0,
    });
    setAddOpen(false);
    const packet = createOnboardingPacket(newMerchant.businessName);
    setCredentialsPacket({ name: newMerchant.businessName, packet });
    setNewMerchant({ businessName: '', ownerName: '', email: '', phone: '', plan: 'starter' });
    toast.success(`${newMerchant.businessName} onboarded successfully`);
  };

  const handleExtend = (m: Merchant, days: number) => {
    extendPlan(m.id, days);
    toast.success(`${m.businessName} extended by ${days} days`);
  };

  const handleSuspend = (m: Merchant) => {
    toggleStatus(m.id);
    toast.success(`${m.businessName} ${m.status === 'active' ? 'suspended' : 'reactivated'}`);
  };

  const handlePlanChange = (m: Merchant, plan: Merchant['plan']) => {
    updateMerchant(m.id, { plan });
    toast.success(`${m.businessName} moved to ${plan}`);
  };

  const SortHeader = ({ label, k }: { label: string; k: SortKey }) => (
    <button onClick={() => toggleSort(k)} className="inline-flex items-center gap-1 hover:text-foreground transition-colors">
      {label}
      <ArrowUpDown className={`h-3 w-3 ${sortKey === k ? 'text-primary' : 'opacity-40'}`} />
    </button>
  );

  return (
    <div className="min-h-screen bg-background font-body flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 px-4 sm:px-6 py-3 border-b border-border bg-card/95 backdrop-blur-sm flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary via-accent to-info flex items-center justify-center shadow-lg shadow-primary/20">
            <Crown className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-heading font-bold text-foreground flex items-center gap-2">
              Organization Console
              <Badge variant="outline" className="text-[9px] uppercase tracking-wider border-accent/40 text-accent">Top-Level</Badge>
            </h1>
            <p className="text-[11px] text-muted-foreground flex items-center gap-1.5"><Globe className="h-3 w-3" /> Network Controller • <LiveClock /></p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <Button size="sm" className="rounded-xl hidden sm:inline-flex" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Add Merchant
          </Button>
          <Button variant="outline" size="sm" className="rounded-xl hidden sm:inline-flex" onClick={exportCSV}>
            <Download className="h-4 w-4 mr-1" /> Export
          </Button>
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-foreground flex items-center gap-1 justify-end"><ShieldCheck className="h-3 w-3 text-success" />{user?.name || 'Org Owner'}</p>
            <p className="text-[11px] text-muted-foreground">Organization Owner</p>
          </div>
          <Button variant="outline" size="sm" className="rounded-xl" onClick={handleLogout}>
            <LogOut className="h-4 w-4 sm:mr-1" /> <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/15 via-accent/10 to-info/15 border border-border p-5 sm:p-7">
          <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-accent/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
          <div className="relative flex items-start justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-heading font-bold text-foreground flex items-center gap-2">
                Welcome back, {user?.name?.split(' ')[0] || 'Owner'} <Sparkles className="h-5 w-5 text-accent" />
              </h2>
              <p className="text-sm text-muted-foreground mt-1.5 max-w-xl">
                Monitor every registered merchant, subscription health, network revenue, and global settings from one unified console.
              </p>
              <div className="flex gap-2 mt-3 sm:hidden">
                <Button size="sm" className="rounded-xl" onClick={() => setAddOpen(true)}><Plus className="h-4 w-4 mr-1" /> Add</Button>
                <Button size="sm" variant="outline" className="rounded-xl" onClick={exportCSV}><Download className="h-4 w-4 mr-1" /> Export</Button>
              </div>
            </div>
            <div className="flex gap-2 text-right">
              <div className="px-4 py-3 rounded-xl bg-card/70 backdrop-blur-sm border border-border">
                <p className="text-[10px] uppercase text-muted-foreground tracking-wider">Today</p>
                <p className="font-heading font-bold text-foreground"><LiveClock /></p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {stats.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="p-4 rounded-2xl bg-card border border-border cafe-shadow hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-2xl font-heading font-bold mt-1 truncate">{s.value}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{s.sub}</p>
                </div>
                <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center shrink-0`}>
                  <s.icon className="h-5 w-5 text-primary-foreground" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 rounded-2xl bg-card border border-border cafe-shadow p-4">
            <h3 className="font-heading font-bold text-sm mb-3 flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" /> Network Growth (6 months)</h3>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={growthData}>
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
          <div className="rounded-2xl bg-card border border-border cafe-shadow p-4">
            <h3 className="font-heading font-bold text-sm mb-3 flex items-center gap-2"><Crown className="h-4 w-4 text-accent" /> Plan Distribution</h3>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={planData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} paddingAngle={3}>
                  {planData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top revenue + Activity feed */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 rounded-2xl bg-card border border-border cafe-shadow p-4">
            <h3 className="font-heading font-bold text-sm mb-3 flex items-center gap-2"><TrendingUp className="h-4 w-4 text-success" /> Top 5 Merchants by Revenue</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 12 }} />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} name="Revenue (₹K)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="rounded-2xl bg-card border border-border cafe-shadow p-4 flex flex-col">
            <h3 className="font-heading font-bold text-sm mb-2 flex items-center gap-2"><History className="h-4 w-4 text-info" /> Recent Activity</h3>
            <div className="flex-1 overflow-y-auto -mr-2 pr-2 max-h-[260px] space-y-1">
              {activities.length === 0 ? (
                <EmptyState compact icon={Activity} title="No activity yet" description="Merchant changes will appear here." />
              ) : activities.slice(0, 8).map(a => <ActivityRow key={a.id} a={a} />)}
            </div>
          </div>
        </div>

        {/* Expiry alerts */}
        {(expiringSoon.length > 0 || expired.length > 0) && (
          <div className="rounded-2xl bg-gradient-to-r from-accent/5 to-destructive/5 border-2 border-accent/30 p-4">
            <h3 className="font-heading font-bold text-sm flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-accent" /> Subscription Alerts
              <Badge variant="outline" className="text-[10px]">{expiringSoon.length + expired.length} need attention</Badge>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[...expired, ...expiringSoon].map(m => {
                const d = daysUntilExpiry(m.planExpiryDate);
                return (
                  <div key={m.id} className="flex items-center justify-between p-2 rounded-xl bg-card/70 border border-border text-xs gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate">{m.businessName}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{m.email}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Badge className={d <= 0 ? 'bg-destructive/10 text-destructive' : 'bg-accent/10 text-accent'}>
                        {d <= 0 ? 'Expired' : `${d}d left`}
                      </Badge>
                      <Button size="sm" variant="ghost" className="h-7 px-2 text-[10px]" onClick={() => handleExtend(m, 30)}>
                        <CalendarPlus className="h-3 w-3 mr-0.5" /> +30d
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Merchants table with filters */}
        <div className="rounded-2xl bg-card border border-border cafe-shadow overflow-hidden">
          <div className="p-4 border-b border-border space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="font-heading font-bold flex items-center gap-2"><Building2 className="h-4 w-4 text-primary" /> Registered Merchants</h3>
                <p className="text-xs text-muted-foreground">All onboarded businesses across the network</p>
              </div>
              <Badge variant="outline" className="text-[11px]">{filteredMerchants.length} of {totalMerchants}</Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search business, owner, email..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 rounded-xl h-9" />
              </div>
              <Select value={planFilter} onValueChange={(v: any) => setPlanFilter(v)}>
                <SelectTrigger className="w-[140px] h-9 rounded-xl"><Filter className="h-3 w-3 mr-1" /><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Plans</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="starter">Starter</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
                <SelectTrigger className="w-[140px] h-9 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" className="rounded-xl h-9 sm:hidden" onClick={exportCSV}>
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead>
                <tr className="border-b border-border text-left bg-muted/30">
                  <th className="p-3 text-xs font-semibold text-muted-foreground"><SortHeader label="Business" k="business" /></th>
                  <th className="p-3 text-xs font-semibold text-muted-foreground">Owner</th>
                  <th className="p-3 text-xs font-semibold text-muted-foreground">Email</th>
                  <th className="p-3 text-xs font-semibold text-muted-foreground"><SortHeader label="Plan" k="plan" /></th>
                  <th className="p-3 text-xs font-semibold text-muted-foreground"><SortHeader label="Expiry" k="expiry" /></th>
                  <th className="p-3 text-xs font-semibold text-muted-foreground">Countdown</th>
                  <th className="p-3 text-xs font-semibold text-muted-foreground"><SortHeader label="Revenue" k="revenue" /></th>
                  <th className="p-3 text-xs font-semibold text-muted-foreground"><SortHeader label="Orders" k="orders" /></th>
                  <th className="p-3 text-xs font-semibold text-muted-foreground"><SortHeader label="Status" k="status" /></th>
                  <th className="p-3 text-xs font-semibold text-muted-foreground w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredMerchants.length === 0 ? (
                  <tr><td colSpan={10} className="p-8">
                    <EmptyState compact icon={Building2} title="No merchants match your filters" description="Try clearing search or filter selections." />
                  </td></tr>
                ) : filteredMerchants.map(m => {
                  const days = daysUntilExpiry(m.planExpiryDate);
                  return (
                    <tr key={m.id} className="hover:bg-muted/30 cursor-pointer" onClick={() => setDetailMerchant(m)}>
                      <td className="p-3 text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-xs font-bold text-primary">
                            {m.businessName.charAt(0)}
                          </div>
                          <div>
                            <p>{m.businessName}</p>
                            <p className="text-[10px] text-muted-foreground font-mono">{m.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-sm text-muted-foreground">{m.ownerName}</td>
                      <td className="p-3 text-xs text-muted-foreground">{m.email}</td>
                      <td className="p-3"><Badge variant="outline" className={`text-[10px] uppercase ${m.plan === 'enterprise' ? 'border-accent text-accent' : m.plan === 'pro' ? 'border-primary text-primary' : ''}`}>{m.plan}</Badge></td>
                      <td className="p-3 text-sm text-muted-foreground"><span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" />{m.planExpiryDate}</span></td>
                      <td className="p-3">
                        <Badge className={`text-[10px] ${days <= 0 ? 'bg-destructive/10 text-destructive' : days <= 7 ? 'bg-destructive/10 text-destructive' : days <= 30 ? 'bg-accent/10 text-accent' : 'bg-success/10 text-success'}`}>
                          {days <= 0 ? 'Expired' : `${days} days`}
                        </Badge>
                      </td>
                      <td className="p-3 text-sm font-bold">₹{m.revenue.toLocaleString()}</td>
                      <td className="p-3 text-sm">{m.ordersCount.toLocaleString()}</td>
                      <td className="p-3">
                        <Badge className={`text-[10px] ${m.status === 'active' ? 'bg-success/10 text-success' : m.status === 'suspended' ? 'bg-accent/10 text-accent' : 'bg-destructive/10 text-destructive'}`}>{m.status}</Badge>
                      </td>
                      <td className="p-3" onClick={e => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg"><MoreVertical className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-52">
                            <DropdownMenuLabel className="text-xs">{m.businessName}</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setDetailMerchant(m)}>
                              <ChevronRight className="h-4 w-4 mr-2" /> View details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleExtend(m, 30)}>
                              <CalendarPlus className="h-4 w-4 mr-2" /> Extend +30 days
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleExtend(m, 365)}>
                              <CalendarPlus className="h-4 w-4 mr-2" /> Extend +1 year
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">Change plan</DropdownMenuLabel>
                            {(['free', 'starter', 'pro', 'enterprise'] as const).filter(p => p !== m.plan).map(p => (
                              <DropdownMenuItem key={p} onClick={() => handlePlanChange(m, p)}>
                                <Crown className="h-4 w-4 mr-2" /> Move to {p}
                              </DropdownMenuItem>
                            ))}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleSuspend(m)} className={m.status === 'active' ? 'text-destructive focus:text-destructive' : 'text-success focus:text-success'}>
                              {m.status === 'active' ? <><Pause className="h-4 w-4 mr-2" /> Suspend</> : <><Play className="h-4 w-4 mr-2" /> Reactivate</>}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Retention + AI Vault */}
        <MerchantOpsPanel />

        {/* Global Settings */}
        <div className="rounded-2xl bg-card border border-border cafe-shadow p-4 sm:p-6">
          <h3 className="font-heading font-bold flex items-center gap-2 mb-3">
            <SettingsIcon className="h-4 w-4 text-primary" /> Global Network Settings
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            <div className="p-3 rounded-xl bg-muted/30 border border-border">
              <p className="text-[10px] text-muted-foreground uppercase">Default Currency</p>
              <p className="font-bold mt-1">{settings.currency || '₹ INR'}</p>
            </div>
            <div className="p-3 rounded-xl bg-muted/30 border border-border">
              <p className="text-[10px] text-muted-foreground uppercase">Brand Identity</p>
              <p className="font-bold mt-1 flex items-center gap-1"><Coffee className="h-3 w-3" /> CaféFlow</p>
            </div>
            <div className="p-3 rounded-xl bg-muted/30 border border-border">
              <p className="text-[10px] text-muted-foreground uppercase">Active Modules</p>
              <p className="font-bold mt-1">POS · KDS · Customer · Staff · Admin</p>
            </div>
          </div>
        </div>
      </div>

      {/* Add Merchant Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading flex items-center gap-2"><Plus className="h-4 w-4 text-primary" /> Onboard New Merchant</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Business Name *</Label>
              <Input value={newMerchant.businessName} onChange={e => setNewMerchant(s => ({ ...s, businessName: e.target.value }))} placeholder="e.g. Mocha Lounge" className="rounded-xl mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Owner Name *</Label>
                <Input value={newMerchant.ownerName} onChange={e => setNewMerchant(s => ({ ...s, ownerName: e.target.value }))} placeholder="Full name" className="rounded-xl mt-1" />
              </div>
              <div>
                <Label className="text-xs">Phone</Label>
                <Input value={newMerchant.phone} onChange={e => setNewMerchant(s => ({ ...s, phone: e.target.value }))} placeholder="+91-..." className="rounded-xl mt-1" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Email *</Label>
              <Input type="email" value={newMerchant.email} onChange={e => setNewMerchant(s => ({ ...s, email: e.target.value }))} placeholder="owner@business.com" className="rounded-xl mt-1" />
            </div>
            <div>
              <Label className="text-xs">Subscription Plan</Label>
              <Select value={newMerchant.plan} onValueChange={(v: Merchant['plan']) => setNewMerchant(s => ({ ...s, plan: v }))}>
                <SelectTrigger className="rounded-xl mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free · ₹0/mo · 30 day trial</SelectItem>
                  <SelectItem value="starter">Starter · ₹999/mo · 1 year</SelectItem>
                  <SelectItem value="pro">Pro · ₹2,999/mo · 1 year</SelectItem>
                  <SelectItem value="enterprise">Enterprise · ₹9,999/mo · 1 year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)} className="rounded-xl">Cancel</Button>
            <Button onClick={handleAdd} className="rounded-xl">Onboard Merchant</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Merchant Detail Drawer */}
      <Dialog open={!!detailMerchant} onOpenChange={(o) => !o && setDetailMerchant(null)}>
        <DialogContent className="sm:max-w-lg">
          {detailMerchant && (
            <>
              <DialogHeader>
                <DialogTitle className="font-heading flex items-center gap-2">
                  <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-sm font-bold text-primary">
                    {detailMerchant.businessName.charAt(0)}
                  </div>
                  {detailMerchant.businessName}
                  <Badge variant="outline" className="text-[10px] uppercase ml-auto">{detailMerchant.plan}</Badge>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="p-3 rounded-xl bg-muted/40 border border-border">
                    <p className="text-[10px] text-muted-foreground uppercase">Owner</p>
                    <p className="font-medium">{detailMerchant.ownerName}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/40 border border-border">
                    <p className="text-[10px] text-muted-foreground uppercase">Status</p>
                    <Badge className={`mt-0.5 text-[10px] ${detailMerchant.status === 'active' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>{detailMerchant.status}</Badge>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/40 border border-border col-span-2">
                    <p className="text-[10px] text-muted-foreground uppercase">Contact</p>
                    <p className="text-xs">{detailMerchant.email}</p>
                    <p className="text-xs">{detailMerchant.phone}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/40 border border-border">
                    <p className="text-[10px] text-muted-foreground uppercase">Lifetime Revenue</p>
                    <p className="font-heading font-bold">₹{detailMerchant.revenue.toLocaleString()}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/40 border border-border">
                    <p className="text-[10px] text-muted-foreground uppercase">Orders</p>
                    <p className="font-heading font-bold">{detailMerchant.ordersCount.toLocaleString()}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/40 border border-border">
                    <p className="text-[10px] text-muted-foreground uppercase">Registered</p>
                    <p className="text-xs">{detailMerchant.registrationDate}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/40 border border-border">
                    <p className="text-[10px] text-muted-foreground uppercase">Plan Expires</p>
                    <p className="text-xs">{detailMerchant.planExpiryDate} ({daysUntilExpiry(detailMerchant.planExpiryDate)}d)</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" className="rounded-xl" onClick={() => handleExtend(detailMerchant, 30)}>
                    <CalendarPlus className="h-4 w-4 mr-1" /> +30 days
                  </Button>
                  <Button size="sm" variant="outline" className="rounded-xl" onClick={() => handleExtend(detailMerchant, 365)}>
                    <CalendarPlus className="h-4 w-4 mr-1" /> +1 year
                  </Button>
                  <Button size="sm" variant={detailMerchant.status === 'active' ? 'destructive' : 'default'} className="rounded-xl ml-auto" onClick={() => { handleSuspend(detailMerchant); setDetailMerchant(null); }}>
                    {detailMerchant.status === 'active' ? <><Pause className="h-4 w-4 mr-1" /> Suspend</> : <><Play className="h-4 w-4 mr-1" /> Reactivate</>}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <OnboardingCredentialsDialog
        open={!!credentialsPacket}
        onClose={() => setCredentialsPacket(null)}
        businessName={credentialsPacket?.name ?? ''}
        packet={credentialsPacket?.packet ?? null}
      />
    </div>
  );
};

export default Organization;
