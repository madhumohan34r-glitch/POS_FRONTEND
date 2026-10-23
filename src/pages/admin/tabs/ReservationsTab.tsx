
// import { useState } from 'react';
// import { motion, AnimatePresence } from 'framer-motion';
// import { BookOpen, Plus, X, CheckCircle2, Loader2 } from 'lucide-react';
// import { Button } from '@/components/ui/button';
// import { Badge } from '@/components/ui/badge';
// import { Label } from '@/components/ui/label';
// import { Input } from '@/components/ui/input';
// import { Switch } from '@/components/ui/switch';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// import { toast } from 'sonner';

// // Zod & React Hook Form
// import { useForm } from 'react-hook-form';
// import { zodResolver } from '@hookform/resolvers/zod';
// import * as z from 'zod';

// import { useReservationsDashboard, useAddReservation, useUpdateReservationAction } from '@/tanstack/alltanstack';

// // --- Zod Schema ---
// const resSchema = z.object({
//   reservation_type: z.enum(['table', 'event', 'venue']),
//   customer_name: z.string().min(2, 'Name is required'),
//   customer_phone: z.string().min(10, 'Valid phone number required'),
//   customer_email: z.string().email('Invalid email').optional().or(z.literal('')),
//   reservation_date: z.string().min(1, 'Date is required'),
//   reservation_time: z.string().min(1, 'Time is required'),
//   duration_hours: z.number().min(1, 'Min 1 hour').max(12, 'Max 12 hours'),
//   guests: z.number().min(1, 'At least 1 guest required'),
//   table_id: z.number().optional().nullable(),
//   special_request: z.string().optional(),
// }).refine(data => {
//   if (data.reservation_type === 'table' && (!data.table_id || data.table_id <= 0)) {
//     return false;
//   }
//   return true;
// }, { message: "Table ID is required for table reservations", path: ["table_id"] });

// type ReservationFormValues = z.infer<typeof resSchema>;

// export default function ReservationsTab() {
//   const { data, isLoading } = useReservationsDashboard();
//   const addResMut = useAddReservation();
//   const actionMut = useUpdateReservationAction();

//   const [showAddRes, setShowAddRes] = useState(false);

//   const reservations = data?.reservations || [];
//   const settings = data?.settings || { table_reservations: true, event_slots: true, full_venue_booking: false };

//   const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<ReservationFormValues>({
//     resolver: zodResolver(resSchema),
//     defaultValues: {
//       reservation_type: 'table', duration_hours: 2, guests: 2, table_id: 1,
//     }
//   });

//   const selectedType = watch('reservation_type');

//   const onSubmit = (formData: ReservationFormValues) => {
//     // Backend expects duration in minutes based on your "duration // 60" logic
//     const payload = {
//       reservation_type: formData.reservation_type,
//       customer_name: formData.customer_name,
//       customer_phone: formData.customer_phone,
//       customer_email: formData.customer_email || null,
//       reservation_date: formData.reservation_date,
//       reservation_time: formData.reservation_time + ':00', // Append seconds if backend strictness requires time format HH:MM:SS
//       duration: formData.duration_hours * 60, 
//       guests: formData.guests,
//       table_id: formData.reservation_type === 'table' ? formData.table_id : null,
//       advance_amount: 0,
//       special_request: formData.special_request || null,
//     };

//     addResMut.mutate(payload, {
//       onSuccess: () => {
//         toast.success("Reservation added successfully!");
//         setShowAddRes(false);
//         reset();
//       },
//       onError: (err: any) => {
//         toast.error(err.response?.data?.detail || "Failed to add reservation");
//       }
//     });
//   };

//   const handleAction = (id: number, action: 'confirmed' | 'cancelled') => {
//     actionMut.mutate({ id, action });
//   };

//   return (
//     <div className="space-y-6">
//       <div className="flex items-center justify-between flex-wrap gap-3">
//         <h2 className="text-lg font-heading font-bold flex items-center gap-2"><BookOpen className="h-5 w-5 text-primary" /> Reservation Engine</h2>
//         <Button className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-xl" onClick={() => setShowAddRes(true)}>
//           <Plus className="h-4 w-4 mr-1" /> New Reservation
//         </Button>
//       </div>

//       {/* Booking Config */}
//       <div className="rounded-2xl bg-card border border-border cafe-shadow p-4 space-y-3">
//         <h3 className="font-heading font-bold text-sm">Booking Configuration</h3>
//         <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
//           <div className="flex items-center justify-between p-3 rounded-xl border border-border">
//             <span className="text-sm">🪑 Table Reservations</span>
//             <Switch checked={settings.table_reservations} disabled />
//           </div>
//           <div className="flex items-center justify-between p-3 rounded-xl border border-border">
//             <span className="text-sm">🎉 Event Slots</span>
//             <Switch checked={settings.event_slots} disabled />
//           </div>
//           <div className="flex items-center justify-between p-3 rounded-xl border border-border">
//             <span className="text-sm">🏛️ Full Venue</span>
//             <Switch checked={settings.full_venue_booking} disabled />
//           </div>
//         </div>
//       </div>

//       {/* Reservations List */}
//       <div className="rounded-2xl bg-card border border-border cafe-shadow overflow-hidden">
//         <div className="p-4 border-b border-border"><h3 className="font-heading font-bold">All Reservations</h3></div>
//         {isLoading ? (
//           <div className="flex justify-center p-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
//         ) : (
//           <div className="overflow-x-auto">
//             <table className="w-full min-w-[700px]">
//               <thead>
//                 <tr className="border-b border-border text-left">
//                   {['Code', 'Type', 'Customer', 'Date', 'Time', 'Duration', 'Guests', 'Table', 'Status', 'Actions'].map(h => <th key={h} className="p-3 text-xs font-semibold text-muted-foreground">{h}</th>)}
//                 </tr>
//               </thead>
//               <tbody className="divide-y divide-border">
//                 {reservations.map((r: any) => (
//                   <tr key={r.id} className="hover:bg-muted/30">
//                     <td className="p-3 font-mono text-xs">{r.reservation_code}</td>
//                     <td className="p-3"><Badge variant="outline" className="text-[10px] capitalize">{r.reservation_type}</Badge></td>
//                     <td className="p-3 text-sm">{r.customer_name}</td>
//                     <td className="p-3 text-sm">{r.reservation_date}</td>
//                     <td className="p-3 text-sm">{r.reservation_time}</td>
//                     <td className="p-3 text-sm">{r.duration}</td>
//                     <td className="p-3 text-sm">{r.guests}</td>
//                     <td className="p-3 text-sm">{r.table_name || '-'}</td>
//                     <td className="p-3">
//                       <Badge className={`text-[10px] ${r.status === 'confirmed' ? 'bg-success/10 text-success' : r.status === 'cancelled' ? 'bg-destructive/10 text-destructive' : 'bg-accent/10 text-accent'}`}>
//                         {r.status}
//                       </Badge>
//                     </td>
//                     <td className="p-3">
//                       <div className="flex gap-1">
//                         {r.status === 'pending' && <Button size="sm" className="h-6 px-2 rounded-lg bg-success/90 text-success-foreground text-[10px]" onClick={() => handleAction(r.id, 'confirmed')}>Confirm</Button>}
//                         {r.status !== 'cancelled' && <Button size="sm" variant="outline" className="h-6 px-2 rounded-lg text-destructive text-[10px]" onClick={() => handleAction(r.id, 'cancelled')}>Cancel</Button>}
//                       </div>
//                     </td>
//                   </tr>
//                 ))}
//                 {reservations.length === 0 && <tr><td colSpan={10} className="p-8 text-center text-muted-foreground">No reservations found.</td></tr>}
//               </tbody>
//             </table>
//           </div>
//         )}
//       </div>

//       {/* New Reservation Dialog */}
//       <AnimatePresence>
//         {showAddRes && (
//           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
//             <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-card rounded-2xl border border-border cafe-shadow-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
              
//               <div className="flex items-center justify-between mb-4">
//                 <h3 className="text-lg font-heading font-bold flex items-center gap-2"><BookOpen className="h-5 w-5 text-primary" /> New Reservation</h3>
//                 <button onClick={() => setShowAddRes(false)} className="h-8 w-8 rounded-xl bg-muted flex items-center justify-center"><X className="h-4 w-4" /></button>
//               </div>
              
//               <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
//                 <div>
//                   <Label className="text-xs">Booking Type</Label>
//                   <Select value={selectedType} onValueChange={(v: any) => setValue('reservation_type', v)}>
//                     <SelectTrigger className="rounded-xl mt-1"><SelectValue /></SelectTrigger>
//                     <SelectContent>
//                       <SelectItem value="table">🪑 Table</SelectItem>
//                       <SelectItem value="event">🎉 Event Slot</SelectItem>
//                       <SelectItem value="venue">🏛️ Full Venue</SelectItem>
//                     </SelectContent>
//                   </Select>
//                 </div>
                
//                 <div className="grid grid-cols-2 gap-3">
//                   <div>
//                     <Label className="text-xs">Customer Name</Label>
//                     <Input {...register('customer_name')} className="mt-1 rounded-xl" />
//                     {errors.customer_name && <p className="text-[10px] text-destructive">{errors.customer_name.message}</p>}
//                   </div>
//                   <div>
//                     <Label className="text-xs">Phone</Label>
//                     <Input {...register('customer_phone')} placeholder="Phone Number" className="mt-1 rounded-xl" />
//                     {errors.customer_phone && <p className="text-[10px] text-destructive">{errors.customer_phone.message}</p>}
//                   </div>
//                 </div>

//                 <div className="grid grid-cols-2 gap-3">
//                   <div>
//                     <Label className="text-xs">Date</Label>
//                     <Input type="date" {...register('reservation_date')} className="mt-1 rounded-xl" />
//                     {errors.reservation_date && <p className="text-[10px] text-destructive">{errors.reservation_date.message}</p>}
//                   </div>
//                   <div>
//                     <Label className="text-xs">Time</Label>
//                     <Input type="time" {...register('reservation_time')} className="mt-1 rounded-xl" />
//                     {errors.reservation_time && <p className="text-[10px] text-destructive">{errors.reservation_time.message}</p>}
//                   </div>
//                 </div>

//                 <div className="grid grid-cols-3 gap-3">
//                   <div>
//                     <Label className="text-xs">Duration (h)</Label>
//                     <Input type="number" {...register('duration_hours', { valueAsNumber: true })} className="mt-1 rounded-xl" />
//                   </div>
//                   <div>
//                     <Label className="text-xs">Headcount</Label>
//                     <Input type="number" {...register('guests', { valueAsNumber: true })} className="mt-1 rounded-xl" />
//                   </div>
//                   {selectedType === 'table' && (
//                     <div>
//                       <Label className="text-xs">Table ID</Label>
//                       <Input type="number" {...register('table_id', { valueAsNumber: true })} className="mt-1 rounded-xl" />
//                       {errors.table_id && <p className="text-[10px] text-destructive break-words">{errors.table_id.message}</p>}
//                     </div>
//                   )}
//                 </div>

//                 <div>
//                   <Label className="text-xs">Special Notes / Requests</Label>
//                   <Input {...register('special_request')} placeholder="e.g. Birthday setup" className="mt-1 rounded-xl" />
//                 </div>

//                 <div className="flex gap-2 pt-4">
//                   <Button type="button" variant="outline" className="flex-1 rounded-xl" onClick={() => setShowAddRes(false)}>Cancel</Button>
//                   <Button type="submit" disabled={addResMut.isPending} className="flex-1 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-xl">
//                     {addResMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CheckCircle2 className="h-4 w-4 mr-1" /> Confirm Booking</>}
//                   </Button>
//                 </div>
//               </form>
//             </motion.div>
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </div>
//   );
// }
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Plus, X, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

// Zod & React Hook Form
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { useReservationsDashboard, useAddReservation, useUpdateReservationAction } from '@/tanstack/alltanstack';

// --- Zod Schema ---
const resSchema = z.object({
  reservation_type: z.enum(['table', 'event', 'venue']),
  customer_name: z.string().min(2, 'Name is required'),
  customer_phone: z.string().min(10, 'Valid phone number required'),
  customer_email: z.string().email('Invalid email').optional().or(z.literal('')),
  reservation_date: z.string().min(1, 'Date is required'),
  reservation_time: z.string().min(1, 'Time is required'),
  duration_hours: z.number().min(1, 'Min 1 hour').max(12, 'Max 12 hours'),
  guests: z.number().min(1, 'At least 1 guest required'),
  table_id: z.number().optional().nullable(),
  description: z.string().optional(),
  special_request: z.string().optional(),
  total_amount: z.number({ invalid_type_error: 'Enter amount' }).min(0, 'Cannot be negative'),
  advance_amount: z.number({ invalid_type_error: 'Enter amount' }).min(0, 'Cannot be negative'),
})
  .refine(data => {
    if (data.reservation_type === 'table' && (!data.table_id || data.table_id <= 0)) {
      return false;
    }
    return true;
  }, { message: "Table ID is required for table reservations", path: ["table_id"] })
  .refine(data => data.advance_amount <= data.total_amount, {
    message: "Advance can't exceed total",
    path: ["advance_amount"],
  });

type ReservationFormValues = z.infer<typeof resSchema>;

const formatAmount = (n: any) => `₹${Number(n ?? 0).toLocaleString('en-IN')}`;

export default function ReservationsTab() {
  const { data, isLoading } = useReservationsDashboard();
  const addResMut = useAddReservation();
  const actionMut = useUpdateReservationAction();

  const [showAddRes, setShowAddRes] = useState(false);

  const reservations = data?.reservations || [];
  const settings = data?.settings || { table_reservations: true, event_slots: true, full_venue_booking: false };

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<ReservationFormValues>({
    resolver: zodResolver(resSchema),
    defaultValues: {
      reservation_type: 'table', duration_hours: 2, guests: 2, table_id: 1,
      total_amount: 0, advance_amount: 0,
    }
  });

  const selectedType = watch('reservation_type');
  const totalAmount = Number(watch('total_amount')) || 0;
  const advanceAmount = Number(watch('advance_amount')) || 0;
  const remainingAmount = Math.max(totalAmount - advanceAmount, 0);

  const onSubmit = (formData: ReservationFormValues) => {
    // Backend expects duration in minutes based on your "duration // 60" logic
    const payload = {
      reservation_type: formData.reservation_type,
      customer_name: formData.customer_name,
      customer_phone: formData.customer_phone,
      customer_email: formData.customer_email || null,
      reservation_date: formData.reservation_date,
      reservation_time: formData.reservation_time + ':00', // Append seconds if backend strictness requires time format HH:MM:SS
      duration: formData.duration_hours * 60,
      guests: formData.guests,
      table_id: formData.reservation_type === 'table' ? formData.table_id : null,
      description: formData.description || null,
      special_request: formData.special_request || null,
      total_amount: formData.total_amount,
      advance_amount: formData.advance_amount,
      pending_amount: Math.max(formData.total_amount - formData.advance_amount, 0),
    };

    addResMut.mutate(payload as any, {
      onSuccess: () => {
        toast.success("Reservation added successfully!");
        setShowAddRes(false);
        reset();
      },
      onError: (err: any) => {
        toast.error(err.response?.data?.detail || "Failed to add reservation");
      }
    });
  };

  const handleAction = (id: number, action: 'confirmed' | 'cancelled') => {
    actionMut.mutate({ id, action });
  };

  const headers = ['Code', 'Type', 'Customer', 'Date', 'Time', 'Duration', 'Guests', 'Table', 'Description', 'Special Note', 'Total', 'Advance', 'Remaining', 'Status', 'Actions'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-lg font-heading font-bold flex items-center gap-2"><BookOpen className="h-5 w-5 text-primary" /> Reservation Engine</h2>
        <Button className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-xl" onClick={() => setShowAddRes(true)}>
          <Plus className="h-4 w-4 mr-1" /> New Reservation
        </Button>
      </div>

      {/* Booking Config */}
      <div className="rounded-2xl bg-card border border-border cafe-shadow p-4 space-y-3">
        <h3 className="font-heading font-bold text-sm">Booking Configuration</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-center justify-between p-3 rounded-xl border border-border">
            <span className="text-sm">🪑 Table Reservations</span>
            <Switch checked={settings.table_reservations} disabled />
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl border border-border">
            <span className="text-sm">🎉 Event Slots</span>
            <Switch checked={settings.event_slots} disabled />
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl border border-border">
            <span className="text-sm">🏛️ Full Venue</span>
            <Switch checked={settings.full_venue_booking} disabled />
          </div>
        </div>
      </div>

      {/* Reservations List */}
      <div className="rounded-2xl bg-card border border-border cafe-shadow overflow-hidden">
        <div className="p-4 border-b border-border"><h3 className="font-heading font-bold">All Reservations</h3></div>
        {isLoading ? (
          <div className="flex justify-center p-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px]">
              <thead>
                <tr className="border-b border-border text-left">
                  {headers.map(h => <th key={h} className="p-3 text-xs font-semibold text-muted-foreground whitespace-nowrap">{h}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {reservations.map((r: any) => {
                  const total = Number(r.total_amount ?? 0);
                  const advance = Number(r.advance_amount ?? 0);
                  const remaining = r.pending_amount != null ? Number(r.pending_amount) : Math.max(total - advance, 0);
                  return (
                    <tr key={r.id} className="hover:bg-muted/30">
                      <td className="p-3 font-mono text-xs">{r.reservation_code}</td>
                      <td className="p-3"><Badge variant="outline" className="text-[10px] capitalize">{r.reservation_type}</Badge></td>
                      <td className="p-3 text-sm">{r.customer_name}</td>
                      <td className="p-3 text-sm whitespace-nowrap">{r.reservation_date}</td>
                      <td className="p-3 text-sm">{r.reservation_time}</td>
                      <td className="p-3 text-sm">{r.duration}</td>
                      <td className="p-3 text-sm">{r.guests}</td>
                      <td className="p-3 text-sm">{r.table_name || '-'}</td>
                      <td className="p-3 text-sm max-w-[180px] truncate" title={r.description || ''}>{r.description || '-'}</td>
                      <td className="p-3 text-sm max-w-[180px] truncate" title={r.special_request || ''}>{r.special_request || '-'}</td>
                      <td className="p-3 text-sm font-medium whitespace-nowrap">{formatAmount(total)}</td>
                      <td className="p-3 text-sm text-success whitespace-nowrap">{formatAmount(advance)}</td>
                      <td className="p-3 text-sm text-destructive whitespace-nowrap">{formatAmount(remaining)}</td>
                      <td className="p-3">
                        <Badge className={`text-[10px] ${r.status === 'confirmed' ? 'bg-success/10 text-success' : r.status === 'cancelled' ? 'bg-destructive/10 text-destructive' : 'bg-accent/10 text-accent'}`}>
                          {r.status}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-1">
                          {r.status === 'pending' && <Button size="sm" className="h-6 px-2 rounded-lg bg-success/90 text-success-foreground text-[10px]" onClick={() => handleAction(r.id, 'confirmed')}>Confirm</Button>}
                          {r.status !== 'cancelled' && <Button size="sm" variant="outline" className="h-6 px-2 rounded-lg text-destructive text-[10px]" onClick={() => handleAction(r.id, 'cancelled')}>Cancel</Button>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {reservations.length === 0 && <tr><td colSpan={headers.length} className="p-8 text-center text-muted-foreground">No reservations found.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Reservation Dialog */}
      <AnimatePresence>
        {showAddRes && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-card rounded-2xl border border-border cafe-shadow-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">

              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-heading font-bold flex items-center gap-2"><BookOpen className="h-5 w-5 text-primary" /> New Reservation</h3>
                <button onClick={() => setShowAddRes(false)} className="h-8 w-8 rounded-xl bg-muted flex items-center justify-center"><X className="h-4 w-4" /></button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
                <div>
                  <Label className="text-xs">Booking Type</Label>
                  <Select value={selectedType} onValueChange={(v: any) => setValue('reservation_type', v)}>
                    <SelectTrigger className="rounded-xl mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="table">🪑 Table</SelectItem>
                      <SelectItem value="event">🎉 Event Slot</SelectItem>
                      <SelectItem value="venue">🏛️ Full Venue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Customer Name</Label>
                    <Input {...register('customer_name')} className="mt-1 rounded-xl" />
                    {errors.customer_name && <p className="text-[10px] text-destructive">{errors.customer_name.message}</p>}
                  </div>
                  <div>
                    <Label className="text-xs">Phone</Label>
                    <Input {...register('customer_phone')} placeholder="Phone Number" className="mt-1 rounded-xl" />
                    {errors.customer_phone && <p className="text-[10px] text-destructive">{errors.customer_phone.message}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Date</Label>
                    <Input type="date" {...register('reservation_date')} className="mt-1 rounded-xl" />
                    {errors.reservation_date && <p className="text-[10px] text-destructive">{errors.reservation_date.message}</p>}
                  </div>
                  <div>
                    <Label className="text-xs">Time</Label>
                    <Input type="time" {...register('reservation_time')} className="mt-1 rounded-xl" />
                    {errors.reservation_time && <p className="text-[10px] text-destructive">{errors.reservation_time.message}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs">Duration (h)</Label>
                    <Input type="number" {...register('duration_hours', { valueAsNumber: true })} className="mt-1 rounded-xl" />
                    {errors.duration_hours && <p className="text-[10px] text-destructive">{errors.duration_hours.message}</p>}
                  </div>
                  <div>
                    <Label className="text-xs">Headcount</Label>
                    <Input type="number" {...register('guests', { valueAsNumber: true })} className="mt-1 rounded-xl" />
                    {errors.guests && <p className="text-[10px] text-destructive">{errors.guests.message}</p>}
                  </div>
                  {selectedType === 'table' && (
                    <div>
                      <Label className="text-xs">Table ID</Label>
                      <Input type="number" {...register('table_id', { valueAsNumber: true })} className="mt-1 rounded-xl" />
                      {errors.table_id && <p className="text-[10px] text-destructive break-words">{errors.table_id.message}</p>}
                    </div>
                  )}
                </div>

                <div>
                  <Label className="text-xs">Description</Label>
                  <Input {...register('description')} placeholder="e.g. Anniversary dinner for 2" className="mt-1 rounded-xl" />
                </div>

                <div>
                  <Label className="text-xs">Special Notes / Requests</Label>
                  <Input {...register('special_request')} placeholder="e.g. Birthday setup" className="mt-1 rounded-xl" />
                </div>

                {/* Amounts */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs">Total Amount (₹)</Label>
                    <Input type="number" min={0} {...register('total_amount', { valueAsNumber: true })} className="mt-1 rounded-xl" />
                    {errors.total_amount && <p className="text-[10px] text-destructive break-words">{errors.total_amount.message}</p>}
                  </div>
                  <div>
                    <Label className="text-xs">Advance Amount (₹)</Label>
                    <Input type="number" min={0} {...register('advance_amount', { valueAsNumber: true })} className="mt-1 rounded-xl" />
                    {errors.advance_amount && <p className="text-[10px] text-destructive break-words">{errors.advance_amount.message}</p>}
                  </div>
                  <div>
                    <Label className="text-xs">Remaining (₹)</Label>
                    <Input type="number" value={remainingAmount} readOnly disabled className="mt-1 rounded-xl bg-muted" />
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="button" variant="outline" className="flex-1 rounded-xl" onClick={() => setShowAddRes(false)}>Cancel</Button>
                  <Button type="submit" disabled={addResMut.isPending} className="flex-1 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-xl">
                    {addResMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CheckCircle2 className="h-4 w-4 mr-1" /> Confirm Booking</>}
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}