import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  useCounterReservationsDashboard,
  useAddCounterReservation,
  useCounterReservationAction,
} from '@/tanstack/alltanstack';

interface TableOption {
  table_id?: number;
  table_no: string;
  status: string;
}

interface Props {
  tables: TableOption[];
}

const emptyForm = {
  reservation_type: 'table',
  customer_name: '',
  customer_phone: '',
  customer_email: '',
  reservation_date: '',
  reservation_time: '',
  duration_hours: '2',
  guests: '2',
  table_id: '' as string | number,
  advance_amount: '',
  special_request: '',
};

const statusStyle = (s: string) => {
  switch (s) {
    case 'confirmed': return 'bg-success/10 text-success';
    case 'pending': return 'bg-accent/10 text-accent';
    case 'completed': return 'bg-info/10 text-info';
    default: return 'bg-destructive/10 text-destructive'; // cancelled / no_show
  }
};

export default function CounterReservations({ tables }: Props) {
  const { data, isLoading } = useCounterReservationsDashboard();
  const addReservation = useAddCounterReservation();
  const doAction = useCounterReservationAction();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled'>('all');

  const notAllowed = data?.success === false;
  const settings = data?.settings ?? {};
  const reservations: any[] = data?.reservations ?? [];
  const visible = statusFilter === 'all' ? reservations : reservations.filter((r) => r.status === statusFilter);

  // Backend settings lo enabled ayina types matrame form lo chupistam
  const typeOptions = [
    { id: 'table', label: 'Table', enabled: settings.table_reservations },
    { id: 'event', label: 'Event', enabled: settings.event_slots },
    { id: 'full_venue', label: 'Full venue', enabled: settings.full_venue_booking },
  ].filter((t) => t.enabled);

  const set = (key: keyof typeof emptyForm, value: string | number) =>
    setForm((f) => ({ ...f, [key]: value }));

  const openForm = () => {
    setForm({ ...emptyForm, reservation_type: typeOptions[0]?.id ?? 'table' });
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!form.customer_name.trim() || !form.customer_phone.trim() || !form.reservation_date || !form.reservation_time) {
      toast.error('Name, phone, date and time are required');
      return;
    }
    if (Number(form.guests) < 1) { toast.error('Guests must be at least 1'); return; }
    if (form.reservation_type === 'table' && !form.table_id) {
      toast.error('Select a table');
      return;
    }
    addReservation.mutate(
      {
        reservation_type: form.reservation_type,
        customer_name: form.customer_name.trim(),
        customer_phone: form.customer_phone.trim(),
        customer_email: form.customer_email.trim() || null,
        reservation_date: form.reservation_date,
        reservation_time: form.reservation_time,
        duration: Math.round(Number(form.duration_hours) * 60), // backend minutes teesukuntundi
        guests: Number(form.guests),
        table_id: form.reservation_type === 'table' ? Number(form.table_id) : null,
        advance_amount: Number(form.advance_amount) || 0,
        special_request: form.special_request.trim() || null,
      },
      { onSuccess: (res: any) => { if (res?.success !== false) setShowForm(false); } }
    );
  };

  const tablesWithId = tables.filter((t) => t.table_id !== undefined);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-lg sm:text-xl font-heading font-bold flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" /> Reservation Engine
        </h2>
        <Button className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-xl"
          disabled={notAllowed || typeOptions.length === 0} onClick={openForm}>
          <Plus className="h-4 w-4 mr-1" /> New Reservation
        </Button>
      </div>

      {notAllowed && (
        <div className="rounded-2xl bg-card border border-border p-5 text-sm text-muted-foreground">
          {data?.message || 'Reservations are not available for this restaurant.'}
        </div>
      )}

      {/* Booking configuration (backend nunchi vasthundi, read-only) */}
      <div className="rounded-2xl bg-card border border-border cafe-shadow p-4 sm:p-5">
        <h3 className="font-heading font-bold text-sm mb-3">Booking Configuration</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: '🪑 Table Reservations', on: settings.table_reservations },
            { label: '🎉 Event Slots', on: settings.event_slots },
            { label: '🏛️ Full Venue', on: settings.full_venue_booking },
          ].map((s) => (
            <div key={s.label} className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
              <span className="text-sm">{s.label}</span>
              <span className={`h-5 w-9 rounded-full p-0.5 flex ${s.on ? 'bg-primary justify-end' : 'bg-muted justify-start'}`}>
                <span className="h-4 w-4 rounded-full bg-background" />
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="rounded-2xl bg-card border border-border cafe-shadow overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between flex-wrap gap-2">
          <h3 className="font-heading font-bold">All Reservations</h3>
          <div className="flex items-center gap-2">
            <div className="flex gap-1 bg-muted rounded-xl p-1">
              {(['all', 'pending', 'confirmed', 'completed', 'cancelled'] as const).map((s) => (
                <button key={s} onClick={() => setStatusFilter(s)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${statusFilter === s ? 'bg-card text-foreground cafe-shadow' : 'text-muted-foreground'}`}>
                  {s}
                </button>
              ))}
            </div>
            <Badge variant="outline" className="text-[10px]">{visible.length} total</Badge>
          </div>
        </div>

        {isLoading ? (
          <p className="p-6 text-sm text-muted-foreground">Loading reservations...</p>
        ) : visible.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <BookOpen className="h-10 w-10 mx-auto mb-2 opacity-20" />
            <p className="text-sm">No reservations yet. Use New Reservation to add one.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px]">
              <thead>
                <tr className="border-b border-border text-left">
                  {['ID', 'Type', 'Customer', 'Phone', 'Date', 'Time', 'Duration', 'Guests', 'Table', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="p-3 text-xs font-semibold text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {visible.map((r) => (
                  <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-3 font-mono text-xs font-bold">{r.reservation_code}</td>
                    <td className="p-3"><Badge variant="outline" className="text-[10px] capitalize">{r.reservation_type}</Badge></td>
                    <td className="p-3 text-sm">{r.customer_name}</td>
                    <td className="p-3 text-xs text-muted-foreground">{r.customer_phone ?? '-'}</td>
                    <td className="p-3 text-sm">{r.reservation_date}</td>
                    <td className="p-3 text-sm">{r.reservation_time}</td>
                    <td className="p-3 text-sm">{r.duration}</td>
                    <td className="p-3 text-sm">{r.guests}</td>
                    <td className="p-3 text-sm">{r.table_name ?? '-'}</td>
                    <td className="p-3">
                      <Badge className={`text-[10px] ${statusStyle(r.status)}`}>{r.status}</Badge>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-1.5">
                        {r.status === 'pending' && (
                          <Button size="sm" className="rounded-lg text-[10px] h-7 bg-success text-success-foreground"
                            disabled={doAction.isPending}
                            onClick={() => doAction.mutate({ id: r.id, action: 'confirmed' })}>
                            Confirm
                          </Button>
                        )}
                        {r.status === 'confirmed' && (
                          <Button size="sm" className="rounded-lg text-[10px] h-7 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground"
                            disabled={doAction.isPending}
                            onClick={() => doAction.mutate({ id: r.id, action: 'completed' })}>
                            Complete
                          </Button>
                        )}
                        {(r.status === 'pending' || r.status === 'confirmed') && (
                          <Button size="sm" variant="outline" className="rounded-lg text-[10px] h-7 text-destructive"
                            disabled={doAction.isPending}
                            onClick={() => doAction.mutate({ id: r.id, action: 'cancelled' })}>
                            Cancel
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Reservation dialog */}
      <AnimatePresence>
        {showForm && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-50" onClick={() => setShowForm(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg z-50 max-h-[90vh] overflow-y-auto bg-background rounded-2xl border border-border p-6 cafe-shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading font-bold text-lg">New Reservation</h3>
                <button onClick={() => setShowForm(false)} className="h-8 w-8 rounded-xl bg-muted flex items-center justify-center">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-xs">Type</Label>
                  <div className="flex gap-2 mt-1">
                    {typeOptions.map((t) => (
                      <button key={t.id} onClick={() => set('reservation_type', t.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium border-2 ${form.reservation_type === t.id ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground'}`}>
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Customer name *</Label>
                    <Input value={form.customer_name} onChange={(e) => set('customer_name', e.target.value)} className="mt-1 rounded-xl" />
                  </div>
                  <div>
                    <Label className="text-xs">Phone *</Label>
                    <Input value={form.customer_phone} onChange={(e) => set('customer_phone', e.target.value)} placeholder="+91..." className="mt-1 rounded-xl" />
                  </div>
                </div>

                <div>
                  <Label className="text-xs">Email</Label>
                  <Input type="email" value={form.customer_email} onChange={(e) => set('customer_email', e.target.value)} className="mt-1 rounded-xl" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Date *</Label>
                    <Input type="date" value={form.reservation_date} onChange={(e) => set('reservation_date', e.target.value)} className="mt-1 rounded-xl" />
                  </div>
                  <div>
                    <Label className="text-xs">Time *</Label>
                    <Input type="time" value={form.reservation_time} onChange={(e) => set('reservation_time', e.target.value)} className="mt-1 rounded-xl" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs">Duration (hours)</Label>
                    <Input type="number" min="0.5" step="0.5" value={form.duration_hours} onChange={(e) => set('duration_hours', e.target.value)} className="mt-1 rounded-xl" />
                  </div>
                  <div>
                    <Label className="text-xs">Guests</Label>
                    <Input type="number" min="1" value={form.guests} onChange={(e) => set('guests', e.target.value)} className="mt-1 rounded-xl" />
                  </div>
                  <div>
                    <Label className="text-xs">Advance (₹)</Label>
                    <Input type="number" min="0" value={form.advance_amount} onChange={(e) => set('advance_amount', e.target.value)} className="mt-1 rounded-xl" />
                  </div>
                </div>

                {form.reservation_type === 'table' && (
                  <div>
                    <Label className="text-xs">Table *</Label>
                    {tablesWithId.length === 0 ? (
                      <p className="text-xs text-muted-foreground mt-1">
                        Tables kanipinchaledu. Backend /new_order response lo "table_id" add cheyyali.
                      </p>
                    ) : (
                      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mt-1">
                        {tablesWithId.map((t) => (
                          <button key={t.table_id} onClick={() => set('table_id', t.table_id as number)}
                            className={`p-2 rounded-xl text-xs font-bold border-2 ${form.table_id === t.table_id ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground'}`}>
                            {t.table_no}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <Label className="text-xs">Special request</Label>
                  <Input value={form.special_request} onChange={(e) => set('special_request', e.target.value)} className="mt-1 rounded-xl" />
                </div>

                <Button className="w-full bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-xl py-5"
                  disabled={addReservation.isPending} onClick={handleSubmit}>
                  Save reservation
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
