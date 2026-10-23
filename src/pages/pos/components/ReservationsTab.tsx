import { Fragment, useState } from 'react';
import {
  BookOpen, Plus, Armchair, PartyPopper, Landmark, FileText, StickyNote, type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import {
  useResDashboard,
  useResFilter,
  useResAdd,
  useResAction,
  type ResRow,
  type ResStatus,
  type ResType,
} from '@/tanstack/alltanstack';
import { useCounterNewOrderDashboard } from '@/tanstack/alltanstack';

const statusStyle: Record<ResStatus, string> = {
  pending: 'bg-amber-50 text-amber-600',
  confirmed: 'bg-emerald-50 text-emerald-600',
  completed: 'bg-violet-50 text-violet-600',
  cancelled: 'bg-red-50 text-red-600',
  no_show: 'bg-gray-100 text-gray-500',
};

const emptyForm = {
  reservation_type: 'table' as ResType,
  customer_name: '',
  customer_phone: '',
  customer_email: '',
  reservation_date: '',
  reservation_time: '',
  duration_hours: '2',
  guests: '2',
  table_id: '',
  description: '',
  total_amount: '',
  advance_amount: '',
  special_request: '',
};

const rupee = (n: number) => `₹${n.toLocaleString('en-IN')}`;

const textareaCls =
  'w-full min-h-[76px] resize-none rounded-xl border border-input bg-background px-3 py-2 text-sm ' +
  'placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

/* ---------- small note block used in the table's detail row ---------- */
function Note({
  icon: Icon, label, text, className,
}: { icon: LucideIcon; label: string; text: string; className: string }) {
  return (
    <div className={`flex gap-3 rounded-r-xl border-l-4 px-3 py-2 ${className}`}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0">
        <p className="text-xs font-semibold">{label}</p>
        <p className="whitespace-pre-wrap break-words text-sm text-foreground/80">{text}</p>
      </div>
    </div>
  );
}

export default function ReservationsTab() {
  const { data, isLoading, error } = useResDashboard();
  const addMut = useResAdd();
  const actionMut = useResAction();

  const [statusFilter, setStatusFilter] = useState<'all' | ResStatus>('all');
  const filtering = statusFilter !== 'all';
  const { data: filtered } = useResFilter(
    { status: statusFilter === 'all' ? undefined : statusFilter },
    filtering
  );

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const set = (k: keyof typeof emptyForm, v: string) => setForm((f) => ({ ...f, [k]: v }));

  // total / advance / remaining (frontend only, backend does not store total amount yet)
  const totalAmt = Number(form.total_amount) || 0;
  const advanceAmt = Number(form.advance_amount) || 0;
  const remainingAmt = Math.max(0, totalAmt - advanceAmt);

  const settings = data?.settings;
  // Backend lo marpu lekunda: New Order tab vaade tables API nundi teesukuntam
  const { data: newOrderData } = useCounterNewOrderDashboard();
  const rawTables: any[] = (data as any)?.tables ?? newOrderData?.tables ?? [];
  const tables = rawTables
    .map((t: any) => ({
      id: t.id ?? t.table_id,
      name: t.table_name ?? t.table_no,
    }))
    .filter((t) => t.name);
  const tablesMissingId = tables.length > 0 && tables.every((t) => t.id === undefined);

  // The filter API does not return phone / description / special_request,
  // so fill those from the dashboard list (same reservation id).
  const detailById = new Map<number, ResRow>((data?.reservations ?? []).map((r) => [r.id, r]));
  const rows: ResRow[] = ((filtering ? filtered?.reservations : data?.reservations) ?? []).map(
    (r) => ({ ...detailById.get(r.id), ...r }) as ResRow
  );

  const submit = () => {
    if (!form.customer_name.trim() || !form.customer_phone.trim()) return toast.error('Name and phone are required');
    if (!form.reservation_date || !form.reservation_time) return toast.error('Pick date and time');
    if (form.reservation_type === 'table' && !form.table_id) return toast.error('Select a table');
    if (totalAmt > 0 && advanceAmt > totalAmt) return toast.error('Advance cannot be more than the total amount');

    addMut.mutate(
      {
        reservation_type: form.reservation_type,
        customer_name: form.customer_name.trim(),
        customer_phone: form.customer_phone.trim(),
        customer_email: form.customer_email.trim() || undefined,
        reservation_date: form.reservation_date,
        reservation_time: form.reservation_time,
        duration: Math.round(Number(form.duration_hours) * 60), // hours -> minutes
        guests: Number(form.guests),
        table_id: form.reservation_type === 'table' ? Number(form.table_id) : undefined,
        description: form.description.trim() || undefined,
        advance_amount: form.advance_amount ? Number(form.advance_amount) : undefined,
        special_request: form.special_request.trim() || undefined,
      },
      {
        onSuccess: () => {
          setOpen(false);
          setForm(emptyForm);
        },
      }
    );
  };

  if (isLoading) return <div className="py-20 text-center text-muted-foreground">Loading…</div>;
  if (error) return <div className="py-20 text-center text-destructive">{(error as Error).message}</div>;

  const typeOptions: { value: ResType; label: string; enabled: boolean }[] = [
    { value: 'table', label: 'Table', enabled: settings?.table_reservations ?? true },
    { value: 'event', label: 'Event', enabled: settings?.event_slots ?? true },
    { value: 'full_venue', label: 'Full Venue', enabled: settings?.full_venue_booking ?? false },
  ];

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="flex items-center gap-3 font-heading text-2xl font-bold">
          <BookOpen className="h-6 w-6 text-violet-700" /> Reservation Engine
        </h1>
        <Button className="rounded-xl bg-violet-600 hover:bg-violet-700 text-white" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> New Reservation
        </Button>
      </div>

      {/* Booking configuration (backend nundi vastundi, ippudiki read-only) */}
      <div className="rounded-2xl border bg-card p-5">
        <h2 className="font-heading font-bold mb-3">Booking Configuration</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: Armchair, label: 'Table Reservations', on: settings?.table_reservations },
            { icon: PartyPopper, label: 'Event Slots', on: settings?.event_slots },
            { icon: Landmark, label: 'Full Venue', on: settings?.full_venue_booking },
          ].map(({ icon: Icon, label, on }) => (
            <div key={label} className="flex items-center justify-between rounded-xl border p-4">
              <span className="flex items-center gap-2 text-sm">
                <Icon className="h-4 w-4" /> {label}
              </span>
              <Switch checked={!!on} disabled />
            </div>
          ))}
        </div>
      </div>

      {/* Reservations table */}
      <div className="rounded-2xl border bg-card">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="font-heading font-bold text-lg">All Reservations</h2>
          <div className="flex items-center gap-3">
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
              <SelectTrigger className="w-36 h-8 rounded-full text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="no_show">No show</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-xs font-medium border rounded-full px-3 py-1">{rows.length} total</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground">
                {['ID', 'Type', 'Customer', 'Phone', 'Date', 'Time', 'Duration', 'Guests', 'Table', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const hasNotes = !!(r.description || r.special_request);
                return (
                  <Fragment key={r.id}>
                    <tr className="border-t">
                      <td className="px-4 py-3 font-mono">{r.reservation_code}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-semibold border rounded-full px-2.5 py-1 capitalize">{r.reservation_type}</span>
                      </td>
                      <td className="px-4 py-3 font-medium">{r.customer_name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{r.customer_phone ?? '-'}</td>
                      <td className="px-4 py-3">{r.reservation_date}</td>
                      <td className="px-4 py-3">{r.reservation_time}</td>
                      <td className="px-4 py-3">{r.duration}</td>
                      <td className="px-4 py-3">{r.guests}</td>
                      <td className="px-4 py-3">{r.table_name ?? '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium rounded-full px-3 py-1 ${statusStyle[r.status] ?? ''}`}>{r.status}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          {r.status === 'pending' && (
                            <Button size="sm" className="h-7 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                              disabled={actionMut.isPending}
                              onClick={() => actionMut.mutate({ id: r.id, action: 'confirmed' })}>
                              Confirm
                            </Button>
                          )}
                          {r.status === 'confirmed' && (
                            <Button size="sm" className="h-7 rounded-full bg-violet-600 hover:bg-violet-700 text-white text-xs"
                              disabled={actionMut.isPending}
                              onClick={() => actionMut.mutate({ id: r.id, action: 'completed' })}>
                              Complete
                            </Button>
                          )}
                          {(r.status === 'pending' || r.status === 'confirmed') && (
                            <Button size="sm" variant="outline" className="h-7 rounded-full text-xs text-red-600"
                              disabled={actionMut.isPending}
                              onClick={() => actionMut.mutate({ id: r.id, action: 'cancelled' })}>
                              Cancel
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* details row: description + special request */}
                    {hasNotes && (
                      <tr>
                        <td colSpan={11} className="px-4 pb-4 pt-0">
                          <div className="grid gap-2 md:grid-cols-2">
                            {r.description && (
                              <Note
                                icon={FileText}
                                label="Description"
                                text={r.description}
                                className="border-violet-400 bg-violet-50/70 text-violet-700"
                              />
                            )}
                            {r.special_request && (
                              <Note
                                icon={StickyNote}
                                label="Special request"
                                text={r.special_request}
                                className="border-amber-400 bg-amber-50/80 text-amber-700"
                              />
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
          {rows.length === 0 && <div className="py-12 text-center text-muted-foreground">No reservations yet.</div>}
        </div>
      </div>

      {/* New reservation dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader><DialogTitle>New Reservation</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label>Booking type</Label>
              <div className="flex gap-2 mt-1">
                {typeOptions.filter((t) => t.enabled).map((t) => (
                  <button key={t.value} type="button" onClick={() => set('reservation_type', t.value)}
                    className={`px-4 py-2 rounded-xl text-sm border ${form.reservation_type === t.value ? 'bg-violet-600 text-white border-violet-600' : 'bg-card'}`}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div><Label>Customer name</Label><Input value={form.customer_name} onChange={(e) => set('customer_name', e.target.value)} /></div>
            <div><Label>Phone</Label><Input value={form.customer_phone} onChange={(e) => set('customer_phone', e.target.value)} /></div>
            <div className="col-span-2"><Label>Email (optional)</Label><Input type="email" value={form.customer_email} onChange={(e) => set('customer_email', e.target.value)} /></div>

            <div><Label>Date</Label><Input type="date" value={form.reservation_date} onChange={(e) => set('reservation_date', e.target.value)} /></div>
            <div><Label>Time</Label><Input type="time" value={form.reservation_time} onChange={(e) => set('reservation_time', e.target.value)} /></div>
            <div><Label>Duration (hours)</Label><Input type="number" min={1} step={0.5} value={form.duration_hours} onChange={(e) => set('duration_hours', e.target.value)} /></div>
            <div><Label>Guests</Label><Input type="number" min={1} value={form.guests} onChange={(e) => set('guests', e.target.value)} /></div>

            {form.reservation_type === 'table' && (
              <div className="col-span-2">
                <Label>Table</Label>
                <Select value={form.table_id} onValueChange={(v) => set('table_id', v)}>
                  <SelectTrigger><SelectValue placeholder="Select table" /></SelectTrigger>
                  <SelectContent>
                    {tables.length === 0 && (
                      <div className="px-3 py-2 text-sm text-muted-foreground">No tables found</div>
                    )}
                    {tables.filter((t) => t.id !== undefined).map((t) => (
                      <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {tablesMissingId && (
                  <p className="text-xs text-red-600 mt-1">Table ids are missing in the API response. The backend needs to return the table id.</p>
                )}
              </div>
            )}

            <div className="col-span-2">
              <Label>Description (optional)</Label>
              <textarea
                className={textareaCls}
                placeholder="Occasion, seating preference, event details…"
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
              />
            </div>

            {/* payment summary */}
            <div className="col-span-2 rounded-xl border p-3">
              <p className="mb-2 text-sm font-medium">Payment</p>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Total amount (₹)</Label>
                  <Input type="number" min={0} value={form.total_amount} onChange={(e) => set('total_amount', e.target.value)} />
                </div>
                <div>
                  <Label>Advance (₹)</Label>
                  <Input type="number" min={0} value={form.advance_amount} onChange={(e) => set('advance_amount', e.target.value)} />
                </div>
                <div>
                  <Label>Remaining (₹)</Label>
                  <div
                    className={`flex h-10 items-center rounded-xl border px-3 text-sm font-semibold ${
                      totalAmt === 0
                        ? 'text-muted-foreground'
                        : remainingAmt === 0
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : 'border-amber-200 bg-amber-50 text-amber-700'
                    }`}
                  >
                    {totalAmt === 0 ? '-' : rupee(remainingAmt)}
                  </div>
                </div>
              </div>
              {totalAmt > 0 && advanceAmt > totalAmt && (
                <p className="mt-2 text-xs text-red-600">Advance is more than the total amount.</p>
              )}
            </div>

            <div className="col-span-2">
              <Label>Special request (optional)</Label>
              <textarea
                className={textareaCls}
                placeholder="Birthday cake, window seat, allergies…"
                value={form.special_request}
                onChange={(e) => set('special_request', e.target.value)}
              />
            </div>
          </div>

          <Button className="w-full mt-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white" disabled={addMut.isPending} onClick={submit}>
            {addMut.isPending ? 'Saving…' : 'Create Reservation'}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}