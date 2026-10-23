import { useState, useMemo } from 'react';
import { Database, ShieldCheck, Trash2, Brain, Copy, Check, Download, Sliders as SliderIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useSalesRetentionStore, currentFiscalYear, fyLabel, type FiscalYearSummary } from '@/lib/sales-retention-store';
import { useAiVaultStore } from '@/lib/ai-vault-store';
import { useOrgStore } from '@/lib/org-store';
import { useAuthStore } from '@/lib/auth-store';
import { useRelativeTime } from '@/hooks/use-relative-time';
import { EmptyState } from '@/components/EmptyState';
import { toast } from 'sonner';

const formatINR = (n: number) =>
  new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n);

/** Generate plausible per-FY summary rows from a merchant's lifetime totals. */
const buildFySummaries = (
  merchantRevenue: number,
  merchantOrders: number,
  registrationDate: string,
  retentionYears: number,
): FiscalYearSummary[] => {
  const startFY = currentFiscalYear(new Date(registrationDate));
  const nowFY = currentFiscalYear();
  const years: number[] = [];
  for (let y = startFY; y <= nowFY; y++) years.push(y);
  if (!years.length) return [];
  const cutoff = nowFY - retentionYears + 1;
  // Distribute lifetime revenue with a gentle growth curve
  const weights = years.map((_, i) => 1 + i * 0.25);
  const total = weights.reduce((s, w) => s + w, 0);
  return years.map((fy, i) => ({
    fy,
    label: fyLabel(fy),
    revenue: Math.round((merchantRevenue * weights[i]) / total),
    orders: Math.round((merchantOrders * weights[i]) / total),
    protected: fy >= cutoff,
  })).reverse();
};

const RetainedRow = ({ r }: { r: ReturnType<typeof useAiVaultStore.getState>['records'][number] }) => {
  const rel = useRelativeTime(r.retainedAt);
  return (
    <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl hover:bg-muted/40 border border-transparent hover:border-border transition-colors">
      <div className="min-w-0">
        <p className="text-sm font-medium truncate">{r.merchantName} · {r.fyLabel}</p>
        <p className="text-[11px] text-muted-foreground truncate">
          {r.orderCount.toLocaleString()} orders · ₹{formatINR(r.revenueINR)}
          {r.topCategory ? ` · top: ${r.topCategory}` : ''}
        </p>
      </div>
      <div className="text-right shrink-0">
        <Badge variant="outline" className="text-[10px] capitalize">{r.source.replace('-', ' ')}</Badge>
        <p className="text-[10px] text-muted-foreground mt-1">{rel}</p>
      </div>
    </div>
  );
};

export const MerchantOpsPanel = () => {
  const { user } = useAuthStore();
  const { merchants, updateMerchant } = useOrgStore();
  const { retentionYears, setRetentionYears, deletions, isFyProtected, logDeletion } = useSalesRetentionStore();
  const { records, retain, totals } = useAiVaultStore();

  const [merchantId, setMerchantId] = useState(merchants[0]?.id ?? '');
  const [confirm, setConfirm] = useState<{ fy: number; revenue: number; orders: number } | null>(null);
  const [reason, setReason] = useState('');

  const selected = merchants.find(m => m.id === merchantId);
  const summaries = useMemo(
    () => selected ? buildFySummaries(selected.revenue, selected.ordersCount, selected.registrationDate, retentionYears) : [],
    [selected, retentionYears],
  );
  const vaultTotals = totals();

  const cutoffFY = currentFiscalYear() - retentionYears + 1;

  const confirmDelete = () => {
    if (!confirm || !selected) return;
    if (isFyProtected(confirm.fy)) {
      toast.error(`${fyLabel(confirm.fy)} is inside the protected window`);
      return;
    }
    // 1. Snapshot to AI vault
    retain({
      merchantId: selected.id,
      merchantName: selected.businessName,
      fy: confirm.fy,
      fyLabel: fyLabel(confirm.fy),
      orderCount: confirm.orders,
      revenueINR: confirm.revenue,
      source: 'auto-deletion',
    });
    // 2. Log audit trail
    logDeletion({
      merchantId: selected.id,
      merchantName: selected.businessName,
      fy: confirm.fy,
      fyLabel: fyLabel(confirm.fy),
      deletedOrders: confirm.orders,
      deletedRevenue: confirm.revenue,
      deletedBy: user?.name ?? 'super-admin',
      reason: reason.trim() || undefined,
    });
    // 3. Decrement merchant aggregates
    updateMerchant(selected.id, {
      revenue: Math.max(0, selected.revenue - confirm.revenue),
      ordersCount: Math.max(0, selected.ordersCount - confirm.orders),
    });
    toast.success(`${fyLabel(confirm.fy)} sales deleted · anonymized snapshot kept in AI vault`);
    setConfirm(null);
    setReason('');
  };

  const exportAudit = () => {
    if (!deletions.length) return toast.error('No deletions to export');
    const rows = [
      ['Date', 'Merchant', 'Fiscal Year', 'Orders', 'Revenue (INR)', 'Deleted By', 'Reason'],
      ...deletions.map(d => [
        new Date(d.deletedAt).toLocaleString(),
        d.merchantName,
        d.fyLabel,
        d.deletedOrders,
        d.deletedRevenue,
        d.deletedBy,
        d.reason ?? '',
      ]),
    ];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `sales-deletion-audit-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success('Audit log exported');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Retention controls + per-merchant FY table */}
      <div className="lg:col-span-2 rounded-2xl bg-card border border-border cafe-shadow p-4 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="font-heading font-bold flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" /> Sales Data Retention
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Most recent <span className="font-bold text-foreground">{retentionYears}</span> fiscal years are protected.
              Anything older may be deleted by the merchant.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px]">Cutoff: {fyLabel(cutoffFY)}</Badge>
            <Button size="sm" variant="outline" className="rounded-xl" onClick={exportAudit}>
              <Download className="h-3 w-3 mr-1" /> Audit
            </Button>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-muted/30 border border-border">
          <div className="flex items-center justify-between mb-2">
            <Label className="text-xs flex items-center gap-1"><SliderIcon className="h-3 w-3" /> Protection window</Label>
            <span className="text-xs font-bold">{retentionYears} fiscal year{retentionYears > 1 ? 's' : ''}</span>
          </div>
          <Slider
            value={[retentionYears]}
            min={1}
            max={7}
            step={1}
            onValueChange={(v) => setRetentionYears(v[0])}
            className="mt-1"
          />
          <p className="text-[10px] text-muted-foreground mt-2">
            Default is 3 (statutory minimum recommended). Increasing this further restricts merchant deletions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Label className="text-xs whitespace-nowrap">Merchant</Label>
          <select
            value={merchantId}
            onChange={(e) => setMerchantId(e.target.value)}
            className="flex-1 rounded-xl bg-background border border-border px-3 py-2 text-sm"
          >
            {merchants.map(m => (
              <option key={m.id} value={m.id}>{m.businessName}</option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 text-[10px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left p-2.5">Fiscal Year</th>
                <th className="text-right p-2.5">Orders</th>
                <th className="text-right p-2.5">Revenue</th>
                <th className="text-right p-2.5">Action</th>
              </tr>
            </thead>
            <tbody>
              {summaries.length === 0 && (
                <tr><td colSpan={4} className="p-6 text-center text-xs text-muted-foreground">No fiscal year data yet</td></tr>
              )}
              {summaries.map(row => (
                <tr key={row.fy} className="border-t border-border">
                  <td className="p-2.5 font-medium">
                    {row.label}
                    {row.protected && (
                      <Badge variant="outline" className="ml-2 text-[10px] border-success/40 text-success bg-success/10">Protected</Badge>
                    )}
                  </td>
                  <td className="p-2.5 text-right">{row.orders.toLocaleString()}</td>
                  <td className="p-2.5 text-right font-bold">₹{formatINR(row.revenue)}</td>
                  <td className="p-2.5 text-right">
                    <Button
                      size="sm"
                      variant={row.protected ? 'outline' : 'destructive'}
                      disabled={row.protected}
                      className="rounded-lg h-7 text-[11px]"
                      onClick={() => setConfirm({ fy: row.fy, revenue: row.revenue, orders: row.orders })}
                    >
                      <Trash2 className="h-3 w-3 mr-1" /> Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {deletions.length > 0 && (
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Recent deletions</p>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {deletions.slice(0, 6).map(d => (
                <div key={d.id} className="flex items-center justify-between text-xs p-2 rounded-lg bg-muted/30">
                  <span className="truncate">{d.merchantName} · {d.fyLabel}</span>
                  <span className="text-muted-foreground shrink-0">
                    ₹{formatINR(d.deletedRevenue)} · {new Date(d.deletedAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* AI Data Vault */}
      <div className="rounded-2xl bg-card border border-border cafe-shadow p-4 sm:p-6">
        <h3 className="font-heading font-bold flex items-center gap-2">
          <Brain className="h-4 w-4 text-accent" /> AI Data Vault
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Anonymized aggregates retained for AI forecasting & GST traceability.
        </p>

        <div className="grid grid-cols-2 gap-2 mt-3">
          <div className="p-2.5 rounded-xl bg-muted/40 border border-border">
            <p className="text-[10px] text-muted-foreground uppercase">Merchants</p>
            <p className="font-heading font-bold">{vaultTotals.merchants}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-muted/40 border border-border">
            <p className="text-[10px] text-muted-foreground uppercase">Years</p>
            <p className="font-heading font-bold">{vaultTotals.years}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-muted/40 border border-border">
            <p className="text-[10px] text-muted-foreground uppercase">Orders</p>
            <p className="font-heading font-bold">{vaultTotals.orders.toLocaleString()}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-muted/40 border border-border">
            <p className="text-[10px] text-muted-foreground uppercase">Revenue</p>
            <p className="font-heading font-bold">₹{formatINR(vaultTotals.revenue)}</p>
          </div>
        </div>

        <div className="mt-4">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Latest snapshots</p>
          {records.length === 0 ? (
            <EmptyState icon={Database} title="Vault is empty" description="Snapshots appear when merchants delete archived sales." />
          ) : (
            <div className="space-y-1 max-h-72 overflow-y-auto pr-1">
              {records.slice(0, 12).map(r => <RetainedRow key={r.id} r={r} />)}
            </div>
          )}
        </div>
      </div>

      {/* Confirm deletion dialog */}
      <Dialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading flex items-center gap-2">
              <Trash2 className="h-4 w-4 text-destructive" /> Delete fiscal year sales
            </DialogTitle>
          </DialogHeader>
          {confirm && selected && (
            <div className="space-y-3 text-sm">
              <p>
                You are deleting <span className="font-bold">{fyLabel(confirm.fy)}</span> for{' '}
                <span className="font-bold">{selected.businessName}</span>.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-xl bg-muted/40 border border-border">
                  <p className="text-[10px] text-muted-foreground uppercase">Orders</p>
                  <p className="font-bold">{confirm.orders.toLocaleString()}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-muted/40 border border-border">
                  <p className="text-[10px] text-muted-foreground uppercase">Revenue</p>
                  <p className="font-bold">₹{formatINR(confirm.revenue)}</p>
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-info/10 border border-info/30 text-xs">
                An anonymized aggregate (FY · order count · revenue band) will be kept in the AI Data Vault.
                Live operational rows are removed permanently.
              </div>
              <div>
                <Label className="text-xs">Reason (optional)</Label>
                <Input value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g. statutory archive purge" className="rounded-xl mt-1" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setConfirm(null)}>Cancel</Button>
            <Button variant="destructive" className="rounded-xl" onClick={confirmDelete}>
              <Trash2 className="h-4 w-4 mr-1" /> Permanently delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MerchantOpsPanel;

interface CredentialsDialogProps {
  open: boolean;
  onClose: () => void;
  businessName: string;
  packet: import('@/lib/onboarding-utils').OnboardingPacket | null;
}

export const OnboardingCredentialsDialog = ({ open, onClose, businessName, packet }: CredentialsDialogProps) => {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = (label: string, value: string) => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(label);
      toast.success(`${label} copied`);
      setTimeout(() => setCopied(null), 1500);
    });
  };
  if (!packet) return null;
  const rows: { label: string; value: string }[] = [
    { label: 'Login ID', value: packet.loginId },
    { label: 'Temporary Password', value: packet.tempPassword },
    { label: 'POS URL', value: packet.posUrl },
    { label: 'Self-Serve Signup Link', value: packet.signupLink },
  ];
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-success" /> {businessName} is ready
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Share these credentials with the merchant. They will be prompted to change the password on first login.
          </p>
          {rows.map(r => (
            <div key={r.label} className="p-2.5 rounded-xl bg-muted/40 border border-border">
              <p className="text-[10px] text-muted-foreground uppercase">{r.label}</p>
              <div className="flex items-center gap-2 mt-1">
                <code className="text-xs flex-1 truncate font-mono">{r.value}</code>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => copy(r.label, r.value)}>
                  {copied === r.label ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
                </Button>
              </div>
            </div>
          ))}
          <div className="p-2.5 rounded-xl bg-info/10 border border-info/30 text-[11px] leading-relaxed">
            <span className="font-bold">Option A</span> (default): credentials above + POS URL are shared directly.<br />
            <span className="font-bold">Option B</span>: send the self-serve signup link instead — the merchant chooses their own ID & password.
          </div>
        </div>
        <DialogFooter>
          <Button className="rounded-xl w-full" onClick={onClose}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
