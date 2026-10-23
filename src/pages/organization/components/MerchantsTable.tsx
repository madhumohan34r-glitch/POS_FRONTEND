import { useState, useMemo, Fragment } from 'react';
import axios from 'axios';
import {
  Search, Filter, Building2, MoreVertical, ChevronRight, ChevronDown, CalendarPlus,
  Pause, Play, ArrowUpDown, Trash2, Store, Plus, Calendar, CreditCard,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { EmptyState } from '@/components/EmptyState';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';
import RestaurantAdminsModal, { type RestaurantLite } from './RestaurantAdminsModal';


const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

// GET /organization/merchant/all response shape (MerchantDetailModal ikkada nunchi import chestundi)
export interface Merchant {
  id: number;
  merchant_code: string;
  business_name: string;
  owner_name: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  merchant_status: string;
  onboarding_status: string;
}

// Merchant + dashboard `registered_merchants` fields (plan, expiry, revenue, orders)
export interface MerchantRow extends Merchant {
  plan: string;
  expiry_date: string | null;
  countdown_days: number | null;
  revenue: number;
  orders: number;
}

// GET /restaurant/all item
export interface Restaurant {
  id: number;
  merchant_id: number;
  restaurant_code: string | null;
  name: string;
  phone?: string | null;
  city?: string | null;
  state?: string | null;
  restaurant_type?: string | null;
  opening_time?: string | null;
  closing_time?: string | null;
  is_active: boolean;
}

type SortKey = 'business' | 'revenue' | 'orders' | 'status';

interface Props {
  rows: MerchantRow[];
  restaurants: Restaurant[];
  planNames: string[]; // all subscription plans (from /subscription-plans/list)
  onViewDetails: (m: MerchantRow) => void;
  onAddRestaurant: (m: MerchantRow) => void;
  onExtend: (m: MerchantRow, days: number) => void;
  onRefresh: () => void;
}

const inr = (n: number) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

const planStyle: Record<string, string> = {
  enterprise: 'border-accent/50 text-accent',
  pro: 'border-info/50 text-info',
  starter: 'border-primary/40 text-primary',
  free: 'border-border text-muted-foreground',
};

const Countdown = ({ days }: { days: number | null }) => {
  if (days === null) return <span className="text-xs text-muted-foreground">—</span>;
  const cls = days <= 0 ? 'bg-destructive/10 text-destructive'
    : days <= 30 ? 'bg-accent/10 text-accent' : 'bg-success/10 text-success';
  return <Badge className={`text-[10px] ${cls}`}>{days <= 0 ? 'Expired' : `${days} days`}</Badge>;
};

export default function MerchantsTable({ rows, restaurants, planNames, onViewDetails, onAddRestaurant, onExtend, onRefresh }: Props) {
  const { token } = useAuth();
  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');
  const [sortKey, setSortKey] = useState<SortKey>('revenue');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  // Restaurant card click chesthe aa restaurant admins modal open avthundi
  const [adminRestaurant, setAdminRestaurant] = useState<RestaurantLite | null>(null);

  const toggleSort = (k: SortKey) => {
    if (sortKey === k) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(k); setSortDir('desc'); }
  };

  // Free + every plan from the subscription plans list + any plan a merchant already has
  const planOptions = useMemo(
    () => Array.from(new Set(['Free', ...planNames, ...rows.map((r) => r.plan)].filter(Boolean))),
    [planNames, rows]
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const list = rows.filter((m) =>
      (!q || m.business_name.toLowerCase().includes(q) || (m.owner_name || '').toLowerCase().includes(q) || (m.email || '').toLowerCase().includes(q)) &&
      (statusFilter === 'all' || m.merchant_status === statusFilter) &&
      (planFilter === 'all' || m.plan === planFilter)
    );
    const dir = sortDir === 'asc' ? 1 : -1;
    return [...list].sort((a, b) => {
      switch (sortKey) {
        case 'business': return a.business_name.localeCompare(b.business_name) * dir;
        case 'status': return a.merchant_status.localeCompare(b.merchant_status) * dir;
        case 'orders': return (a.orders - b.orders) * dir;
        default: return (a.revenue - b.revenue) * dir;
      }
    });
  }, [rows, search, statusFilter, planFilter, sortKey, sortDir]);

  const handleSuspend = async (m: MerchantRow) => {
    const next = m.merchant_status === 'active' ? 'suspended' : 'active';
    try {
      await axios.put(`${API_URL}/organization/merchant/update/${m.id}`, { merchant_status: next }, authHeaders);
      toast.success(`${m.business_name} ${next === 'suspended' ? 'suspended' : 'reactivated'}`);
      onRefresh();
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Failed to update merchant status');
    }
  };

  const handleDelete = async (m: MerchantRow) => {
    if (!window.confirm(`Permanently delete ${m.business_name}? This action cannot be undone.`)) return;
    try {
      const res = await axios.delete(`${API_URL}/organization/merchant/delete/${m.id}`, authHeaders);
      if (!res.data?.success) { toast.error(res.data?.message || 'Failed to delete merchant'); return; }
      toast.success(`${m.business_name} deleted successfully`);
      onRefresh();
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Failed to delete merchant');
    }
  };

  const SortHeader = ({ label, k }: { label: string; k: SortKey }) => (
    <button onClick={() => toggleSort(k)} className="inline-flex items-center gap-1 hover:text-foreground transition-colors">
      {label}
      <ArrowUpDown className={`h-3 w-3 ${sortKey === k ? 'text-primary' : 'opacity-40'}`} />
    </button>
  );
  // sticky + solid bg: scroll chesthunnappudu header kanipinchali
  const th = 'p-2.5 text-xs font-semibold text-muted-foreground sticky top-0 z-20 bg-muted shadow-[inset_0_-1px_0_hsl(var(--border))]';

  return (
    <div className="rounded-2xl bg-card border border-border cafe-shadow overflow-hidden">
      <div className="p-4 border-b border-border space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="font-heading font-bold flex items-center gap-2"><Building2 className="h-4 w-4 text-primary" /> Registered Merchants</h3>
            <p className="text-xs text-muted-foreground">All onboarded businesses across the network. Click a merchant to see its restaurants.</p>
          </div>
          <Badge variant="outline" className="text-[11px]">{filtered.length} merchants</Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search business, owner, email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 rounded-xl h-9" />
          </div>
          <Select value={planFilter} onValueChange={setPlanFilter}>
            <SelectTrigger className="w-[140px] h-9 rounded-xl"><Filter className="h-3 w-3 mr-1" /><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Plans</SelectItem>
              {planOptions.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px] h-9 rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ~4 rows kanipinchela max height, migilinavi scroll chesthe vasthayi */}
      <div className="overflow-y-auto overflow-x-auto xl:overflow-x-hidden max-h-[19rem]">
        <table className="w-full min-w-[1100px] xl:min-w-0">
          <thead className="sticky top-0 z-20">
            <tr className="text-left">
              <th className={th}><SortHeader label="Business" k="business" /></th>
              <th className={th}>Owner</th>
              <th className={th}>Email</th>
              <th className={th}>Plan</th>
              <th className={th}>Expiry</th>
              <th className={th}>Countdown</th>
              <th className={th}><SortHeader label="Revenue" k="revenue" /></th>
              <th className={th}><SortHeader label="Orders" k="orders" /></th>
              <th className={th}><SortHeader label="Status" k="status" /></th>
              <th className={`${th} w-px`}></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.length === 0 ? (
              <tr><td colSpan={10} className="p-8">
                <EmptyState compact icon={Building2} title="No merchants match your filters" description="Try clearing search or filter selections." />
              </td></tr>
            ) : filtered.map((m) => {
              const open = expandedId === m.id;
              const mine = restaurants.filter((r) => r.merchant_id === m.id);
              return (
                <Fragment key={m.id}>
                  <tr className="hover:bg-muted/30 cursor-pointer" onClick={() => setExpandedId(open ? null : m.id)}>
                    <td className="p-2.5 text-sm font-medium">
                      <div className="flex items-center gap-2">
                        {open ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-xs font-bold text-primary">
                          {m.business_name.charAt(0)}
                        </div>
                        <div>
                          <p>{m.business_name}</p>
                          <p className="text-[10px] text-muted-foreground font-mono">{m.merchant_code}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-2.5 text-sm text-muted-foreground">{m.owner_name}</td>
                    <td className="p-2.5 text-xs text-muted-foreground max-w-[200px] truncate" title={m.email}>{m.email}</td>
                    <td className="p-2.5">
                      <Badge variant="outline" className={`text-[10px] uppercase ${planStyle[m.plan?.toLowerCase()] || ''}`}>{m.plan}</Badge>
                    </td>
                    <td className="p-2.5 text-xs text-muted-foreground">
                      {m.expiry_date ? <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" />{m.expiry_date}</span> : '—'}
                    </td>
                    <td className="p-2.5"><Countdown days={m.countdown_days} /></td>
                    <td className="p-2.5 text-sm font-semibold">{inr(m.revenue)}</td>
                    <td className="p-2.5 text-sm text-muted-foreground">{m.orders.toLocaleString('en-IN')}</td>
                    <td className="p-2.5">
                      <Badge className={`text-[10px] ${m.merchant_status === 'active' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>{m.merchant_status}</Badge>
                    </td>
                    <td className="p-2.5" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1 whitespace-nowrap">
                        {/* Add Restaurant — ikkade okate (dropdown lo, expanded panel lo teesesam) */}
                        <Button variant="outline" size="sm" className="h-8 rounded-lg text-xs" onClick={() => onAddRestaurant(m)}>
                          <Plus className="h-3 w-3 mr-1" /> Restaurant
                        </Button>
                        {/* Subscription — UI matrame, backend API ledu */}
                        <Button variant="outline" size="sm" className="h-8 rounded-lg text-xs" onClick={() => toast.info('Subscription feature coming soon')}>
                          <CreditCard className="h-3 w-3 mr-1" /> Subscription
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg"><MoreVertical className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-52">
                            <DropdownMenuLabel className="text-xs">{m.business_name}</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => onViewDetails(m)}><ChevronRight className="h-4 w-4 mr-2" /> View details</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onExtend(m, 30)}><CalendarPlus className="h-4 w-4 mr-2" /> Extend +30 days</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onExtend(m, 365)}><CalendarPlus className="h-4 w-4 mr-2" /> Extend +1 year</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleSuspend(m)} className={m.merchant_status === 'active' ? 'text-destructive focus:text-destructive' : 'text-success focus:text-success'}>
                              {m.merchant_status === 'active' ? <><Pause className="h-4 w-4 mr-2" /> Suspend</> : <><Play className="h-4 w-4 mr-2" /> Reactivate</>}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(m)} className="text-destructive focus:text-destructive">
                              <Trash2 className="h-4 w-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>

                  {open && (
                    <tr className="bg-muted/20">
                      <td colSpan={10} className="px-6 py-4">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-sm font-semibold flex items-center gap-2">
                            <Store className="h-4 w-4 text-primary" /> Restaurants of {m.business_name}
                            <Badge variant="outline" className="text-[10px]">{mine.length}</Badge>
                          </p>
                        </div>
                        {mine.length === 0 ? (
                          <p className="text-xs text-muted-foreground py-2">No restaurants yet for this merchant.</p>
                        ) : (
                          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                            {mine.map((r) => (
                              <div
                                key={r.id}
                                title="View / manage admins"
                                onClick={() => setAdminRestaurant({ id: r.id, name: r.name })}
                                className="p-2.5 rounded-xl bg-card border border-border cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <p className="text-sm font-medium truncate">{r.name}</p>
                                  <Badge className={`text-[10px] ${r.is_active ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>
                                    {r.is_active ? 'active' : 'inactive'}
                                  </Badge>
                                </div>
                                <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{r.restaurant_code || 'no code'}</p>
                                <p className="text-xs text-muted-foreground mt-1.5">
                                  {[r.restaurant_type, [r.city, r.state].filter(Boolean).join(', ')].filter(Boolean).join(' · ') || '—'}
                                </p>
                                {(r.opening_time || r.closing_time) && (
                                  <p className="text-[11px] text-muted-foreground mt-0.5">{r.opening_time || '--'} – {r.closing_time || '--'}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      <RestaurantAdminsModal restaurant={adminRestaurant} onClose={() => setAdminRestaurant(null)} />
    </div>
  );
}