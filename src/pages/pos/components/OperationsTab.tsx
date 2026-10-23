import { useState } from 'react';
import { Banknote, ClipboardList, PackagePlus, Plus, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth-context';
import {
  useCounterOpsSummary,
  useCounterOpsCashouts,
  useCounterOpsStockRequests,
  useCounterOpsOpen,
  useCounterOpsClose,
  useCounterOpsAddCashout,
  useCounterOpsCreateIssue,
} from '@/tanstack/alltanstack';

// Open-session details returned by POST /counter/operations/counter-session/open.
// The summary endpoint does not return them, so we keep them here.
const INFO_KEY = 'pos_ops_session_info';

interface SessionInfo {
  session_id: number;
  opened_by?: string | null;
  opened_at?: string | null;
  opening_cash?: number;
}

const readInfo = (): SessionInfo | null => {
  try {
    const v = localStorage.getItem(INFO_KEY);
    return v ? (JSON.parse(v) as SessionInfo) : null;
  } catch {
    return null;
  }
};
const writeInfo = (info: SessionInfo | null) => {
  try {
    if (info) localStorage.setItem(INFO_KEY, JSON.stringify(info));
    else localStorage.removeItem(INFO_KEY);
  } catch {
    /* ignore */
  }
};

const CASHOUT_CATEGORIES = ['Groceries', 'Utilities', 'Maintenance', 'Supplies', 'Transport', 'Other'];
const PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

const stockStyle: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-600',
  approved: 'bg-emerald-50 text-emerald-600',
  rejected: 'bg-red-50 text-red-600',
};

const rupee = (n: number) =>
  `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// "2026-10-14 10:44:07" -> "14/10/2026, 10:44:07"
const fmtDateTime = (s?: string | null) => {
  if (!s) return '-';
  const d = new Date(s.replace(' ', 'T'));
  return isNaN(d.getTime()) ? s : d.toLocaleString('en-GB');
};

function CardTitle({ icon: Icon, title, children }: { icon: typeof Banknote; title: string; children?: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-center gap-2">
      <Icon className="h-5 w-5 text-violet-600" />
      <h2 className="font-heading text-lg font-bold">{title}</h2>
      {children}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}

export default function OperationsTab() {
  const { user } = useAuth();
  const { data: summary, isLoading, error } = useCounterOpsSummary();
  const { data: stockRequests = [] } = useCounterOpsStockRequests();

  const openMut = useCounterOpsOpen();
  const closeMut = useCounterOpsClose();
  const cashoutMut = useCounterOpsAddCashout();
  const issueMut = useCounterOpsCreateIssue();

  const [localInfo, setLocalInfo] = useState<SessionInfo | null>(readInfo);

  const [openingCash, setOpeningCash] = useState('');
  const [countedCash, setCountedCash] = useState('');
  const [cashout, setCashout] = useState({ amount: '', category: CASHOUT_CATEGORIES[0], vendor: '', description: '' });
  const [issue, setIssue] = useState({ title: '', description: '', priority: 'medium' });

  const cs = summary?.counter_session;
  const isOpen = cs?.status === 'open';
  const info = isOpen ? localInfo : null;

  // backend summary wins if it ever sends these; otherwise use what /open returned
  const sessionId = isOpen ? (cs?.session_id ?? info?.session_id ?? null) : null;
  const openedBy = cs?.opened_by ?? info?.opened_by ?? null;
  const openedAt = cs?.opened_at ?? info?.opened_at ?? null;
  const openingCashValue: number | undefined = cs?.opening_cash ?? info?.opening_cash;

  const { data: cashouts = [] } = useCounterOpsCashouts(sessionId);

  if (isLoading) return <div className="py-20 text-center text-muted-foreground">Loading…</div>;
  if (error) return <div className="py-20 text-center text-destructive">{(error as Error).message}</div>;

  // expected = opening cash - cashouts (same rule the backend uses)
  const cashoutTotal = cashouts.reduce((s: number, c: any) => s + Number(c.amount ?? 0), 0);
  const expected: number | undefined =
    cs?.expected_cash ?? (openingCashValue !== undefined ? openingCashValue - cashoutTotal : undefined);
  const counted = countedCash === '' ? null : Number(countedCash);
  const diff = expected !== undefined && counted !== null && !isNaN(counted) ? counted - expected : null;

  // logged-in cashier's name (opened_by from the API is an id like "18")
  const u: any = user;
  const myName: string | null = u?.name ?? u?.full_name ?? u?.staff_name ?? u?.username ?? null;

  /* ---------- actions ---------- */
  const submitOpen = () => {
    const v = Number(openingCash);
    if (openingCash === '' || isNaN(v) || v < 0) return toast.error('Enter a valid opening cash amount');
    openMut.mutate(
      { opening_cash: v },
      {
        onSuccess: (res: any) => {
          if (res?.success === false) {
            toast.error(res.message || 'Unable to open counter');
            return;
          }
          const d = res?.data;
          if (d?.session_id) {
            const next: SessionInfo = {
              session_id: d.session_id,
              opened_by: myName ?? null,
              opened_at: d.opened_at ?? null,
              opening_cash: Number(d.opening_cash ?? v),
            };
            setLocalInfo(next);
            writeInfo(next);
          }
          setOpeningCash('');
        },
        onError: (e: any) => toast.error(e?.response?.data?.detail ?? 'Unable to open counter'),
      }
    );
  };

  const submitCashout = () => {
    const amount = Number(cashout.amount);
    if (cashout.amount === '' || isNaN(amount) || amount <= 0) return toast.error('Enter a cashout amount');
    if (!sessionId) return toast.error('Session not found. Refresh the page and try again');
    cashoutMut.mutate(
      {
        session_id: sessionId,
        amount,
        category: cashout.category,
        vendor: cashout.vendor.trim() || undefined,
        description: cashout.description.trim() || undefined,
      },
      {
        onSuccess: (res: any) => {
          if (res?.success === false) {
            toast.error(res.message || 'Unable to add cashout');
            return;
          }
          setCashout({ amount: '', category: CASHOUT_CATEGORIES[0], vendor: '', description: '' });
        },
      }
    );
  };

  const submitClose = () => {
    const v = Number(countedCash);
    if (countedCash === '' || isNaN(v) || v < 0) return toast.error('Enter the counted cash amount');
    closeMut.mutate(
      { closing_cash: v },
      {
        onSuccess: (res: any) => {
          if (res?.success === false) {
            toast.error(res.message || 'Unable to close counter');
            return;
          }
          setCountedCash('');
          setLocalInfo(null);
          writeInfo(null);
        },
      }
    );
  };

  const submitIssue = () => {
    if (!issue.title.trim() || !issue.description.trim()) return toast.error('Title and description are required');
    issueMut.mutate(
      { title: issue.title.trim(), description: issue.description.trim(), priority: issue.priority },
      { onSuccess: () => setIssue({ title: '', description: '', priority: 'medium' }) }
    );
  };

  return (
    <div className="space-y-6">
      <h1 className="flex items-center justify-center gap-3 pt-4 font-heading text-2xl font-bold">
        <ClipboardList className="h-6 w-6 text-violet-700" /> Operations
      </h1>

      {/* ---------------- COUNTER CASH SESSION ---------------- */}
      <div className="rounded-2xl border bg-card p-5">
        <CardTitle icon={Banknote} title="Counter Cash Session">
          {isOpen ? (
            <span className="rounded-full bg-violet-600 px-2.5 py-0.5 text-xs font-semibold text-white">Open</span>
          ) : (
            <Badge variant="outline" className="text-xs">Closed</Badge>
          )}
        </CardTitle>

        {!isOpen && (
          <>
            <Label>Opening cash (₹)</Label>
            <div className="mt-1 flex gap-3">
              <Input
                type="number"
                min={0}
                placeholder="e.g. 2000"
                value={openingCash}
                onChange={(e) => setOpeningCash(e.target.value)}
                className="max-w-xs rounded-xl"
              />
              <Button
                className="rounded-xl bg-violet-600 text-white hover:bg-violet-700"
                disabled={openMut.isPending}
                onClick={submitOpen}
              >
                {openMut.isPending ? 'Opening…' : 'Open Counter'}
              </Button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Last closing balance: {rupee(cs?.last_closing_balance ?? 0)}
            </p>
          </>
        )}

        {isOpen && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <Stat label="Opened by" value={openedBy ?? '-'} />
              <Stat label="Opened at" value={fmtDateTime(openedAt)} />
              <Stat label="Opening cash" value={openingCashValue !== undefined ? rupee(openingCashValue) : '-'} />
              <Stat label="Expected cash" value={expected !== undefined ? rupee(expected) : '-'} />
              {cs?.cash_sales !== undefined && <Stat label="Cash sales" value={rupee(cs.cash_sales)} />}
            </div>

            {/* record cashout */}
            <div className="rounded-xl border p-4">
              <h3 className="mb-3 font-medium">Record Cashout (store purchase / expense)</h3>
              <div className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_1.6fr]">
                <div>
                  <Label>Amount (₹)</Label>
                  <Input
                    type="number"
                    min={0}
                    className="rounded-xl"
                    value={cashout.amount}
                    onChange={(e) => setCashout((c) => ({ ...c, amount: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Category</Label>
                  <Select value={cashout.category} onValueChange={(v) => setCashout((c) => ({ ...c, category: v }))}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CASHOUT_CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Vendor</Label>
                  <Input
                    placeholder="optional"
                    className="rounded-xl"
                    value={cashout.vendor}
                    onChange={(e) => setCashout((c) => ({ ...c, vendor: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Input
                    placeholder="e.g. Milk supplier weekly"
                    className="rounded-xl"
                    value={cashout.description}
                    onChange={(e) => setCashout((c) => ({ ...c, description: e.target.value }))}
                  />
                </div>
              </div>
              <Button
                className="mt-3 rounded-xl bg-violet-600 text-white hover:bg-violet-700"
                disabled={cashoutMut.isPending}
                onClick={submitCashout}
              >
                <Plus className="mr-2 h-4 w-4" /> {cashoutMut.isPending ? 'Adding…' : 'Add Cashout'}
              </Button>

              {cashouts.length > 0 && (
                <div className="mt-4 divide-y rounded-xl border">
                  {cashouts.map((c: any) => (
                    <div key={c.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                      <div className="min-w-0">
                        <p className="font-medium">
                          {c.category}
                          {c.vendor ? <span className="font-normal text-muted-foreground"> · {c.vendor}</span> : null}
                        </p>
                        {c.description && <p className="truncate text-xs text-muted-foreground">{c.description}</p>}
                        <p className="text-xs text-muted-foreground">By {c.created_by ?? '-'}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="font-semibold">{rupee(c.amount)}</p>
                        <p className="text-xs text-muted-foreground">{fmtDateTime(c.created_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* close counter */}
            <div className="rounded-xl border p-4">
              <h3 className="mb-2 font-medium">Close Counter</h3>
              <p className="mb-3 text-sm text-muted-foreground">
                Expected in cash drawer:{' '}
                <span className="font-semibold text-foreground">{expected !== undefined ? rupee(expected) : '-'}</span>
              </p>
              <Label>Counted cash (₹)</Label>
              <div className="mt-1 flex gap-3">
                <Input
                  type="number"
                  min={0}
                  className="rounded-xl"
                  value={countedCash}
                  onChange={(e) => setCountedCash(e.target.value)}
                />
                <Button
                  className="rounded-xl bg-red-600 text-white hover:bg-red-700"
                  disabled={closeMut.isPending}
                  onClick={submitClose}
                >
                  {closeMut.isPending ? 'Closing…' : 'Close Counter'}
                </Button>
              </div>
              {diff !== null && (
                <p
                  className={`mt-2 text-xs font-medium ${
                    diff === 0 ? 'text-emerald-600' : diff < 0 ? 'text-red-600' : 'text-amber-600'
                  }`}
                >
                  {diff === 0 ? 'Cash matches the expected amount' : diff < 0 ? `Short by ${rupee(Math.abs(diff))}` : `Over by ${rupee(diff)}`}
                </p>
              )}
            </div>

            <p className="text-xs text-muted-foreground">Last closing balance: {rupee(cs?.last_closing_balance ?? 0)}</p>
          </div>
        )}
      </div>

      {/* ---------------- STORE ISSUES ---------------- */}
      <div className="rounded-2xl border bg-card p-5">
        <CardTitle icon={Wrench} title="Store Issues">
          <Badge variant="outline" className="text-xs">{summary?.store_issues?.active_count ?? 0} open</Badge>
        </CardTitle>
        <div className="grid gap-3 md:grid-cols-[1fr_1.6fr_0.8fr]">
          <div>
            <Label>Title</Label>
            <Input
              placeholder="e.g. AC not working"
              className="rounded-xl"
              value={issue.title}
              onChange={(e) => setIssue((i) => ({ ...i, title: e.target.value }))}
            />
          </div>
          <div>
            <Label>Description</Label>
            <Input
              placeholder="What's the problem?"
              className="rounded-xl"
              value={issue.description}
              onChange={(e) => setIssue((i) => ({ ...i, description: e.target.value }))}
            />
          </div>
          <div>
            <Label>Priority</Label>
            <Select value={issue.priority} onValueChange={(v) => setIssue((i) => ({ ...i, priority: v }))}>
              <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                {PRIORITIES.map((p) => (
                  <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button
          className="mt-3 w-full rounded-xl bg-violet-600 text-white hover:bg-violet-700"
          disabled={issueMut.isPending}
          onClick={submitIssue}
        >
          <Plus className="mr-2 h-4 w-4" /> {issueMut.isPending ? 'Reporting…' : 'Report Issue'}
        </Button>
      </div>

      {/* ---------------- STOCK UPDATE REQUESTS ---------------- */}
      <div className="rounded-2xl border bg-card p-5">
        <CardTitle icon={PackagePlus} title="Stock Update Requests">
          <Badge variant="outline" className="text-xs">{summary?.stock_requests?.pending_count ?? 0} pending</Badge>
        </CardTitle>

        {stockRequests.length === 0 ? (
          <p className="text-sm text-muted-foreground">No requests yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground">
                  {['Item', 'Quantity', 'Requested by', 'Requested at', 'Status'].map((h) => (
                    <th key={h} className="px-3 py-2 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stockRequests.map((r: any) => (
                  <tr key={r.id} className="border-t">
                    <td className="px-3 py-3 font-medium">{r.item_name}</td>
                    <td className="px-3 py-3">{r.requested_quantity}</td>
                    <td className="px-3 py-3 text-muted-foreground">{r.requested_by ?? '-'}</td>
                    <td className="px-3 py-3 text-muted-foreground">{fmtDateTime(r.requested_at)}</td>
                    <td className="px-3 py-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${stockStyle[r.status] ?? 'bg-gray-100 text-gray-500'}`}>
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}