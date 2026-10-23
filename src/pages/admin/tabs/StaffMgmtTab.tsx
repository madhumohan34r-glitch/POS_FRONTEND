import { useState, useMemo, useEffect } from 'react';
import { CalendarDays, Search, Calendar, Check, X as XIcon, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

// Zod & React Hook Form
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

// TanStack Hooks
import { useStaffMgmtDashboard, useFilterAttendance, useRespondToLeave } from '@/tanstack/alltanstack';

// FIXED: was `import { Label } from 'recharts'` — that's the recharts chart
// axis/pie Label component, not a form label. Using it here (outside a
// chart) either fails to render or throws in the console. This is the
// correct UI-kit Label used everywhere else (e.g. StaffTab.tsx).
import { Label } from '@/components/ui/label';

const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];

// Zod Schema for Admin Response Modal
const responseSchema = z.object({
  admin_response: z.string().optional(),
});
type ResponseFormValues = z.infer<typeof responseSchema>;

export default function StaffMgmtTab() {
  // Queries & Mutations
  const { data: dashboardData, isLoading } = useStaffMgmtDashboard();
  const filterMut = useFilterAttendance();
  const respondMut = useRespondToLeave();

  // Local State
  const [staffMgmtSearch, setStaffMgmtSearch] = useState('');
  const [staffMgmtDate, setStaffMgmtDate] = useState('');
  const [staffMgmtMonthFilter, setStaffMgmtMonthFilter] = useState('');

  // Custom state to hold filtered attendance (defaults to dashboard data)
  const [displayAttendance, setDisplayAttendance] = useState<any[]>([]);

  // Modal State
  const [processingLeave, setProcessingLeave] = useState<{ id: number, action: 'approved' | 'rejected', name: string } | null>(null);

  const { register, handleSubmit, reset } = useForm<ResponseFormValues>({
    resolver: zodResolver(responseSchema),
    defaultValues: { admin_response: '' }
  });

  // Safe extraction of backend data
  const baseAttendance = dashboardData?.staff_attendance || [];
  const pendingLeaves = dashboardData?.pending_leave_requests || [];
  const approvedLeaves = dashboardData?.approved_requests || [];
  const rejectedLeaves = dashboardData?.rejected_requests || [];

  // Update display attendance when dashboard loads
  useEffect(() => {
    if (!staffMgmtDate && !staffMgmtMonthFilter) {
      setDisplayAttendance(baseAttendance);
    }
  }, [baseAttendance, staffMgmtDate, staffMgmtMonthFilter]);

  // Handle Search Filtering locally
  const filteredAttendance = useMemo(() => {
    if (!staffMgmtSearch) return displayAttendance;
    return displayAttendance.filter((s: any) =>
      s.staff_name?.toLowerCase().includes(staffMgmtSearch.toLowerCase()) ||
      s.role?.toLowerCase().includes(staffMgmtSearch.toLowerCase())
    );
  }, [displayAttendance, staffMgmtSearch]);

  // --- Handlers ---

  // Handle Date/Month Filters (converts to Python backend format)
  const applyFilter = (type: 'date' | 'month', value: string) => {
    let formattedDate = '';

    if (type === 'date') {
      setStaffMgmtDate(value);
      setStaffMgmtMonthFilter('');
      // Convert "YYYY-MM-DD" to "DD-MM-YYYY"
      if (value) {
        const [y, m, d] = value.split('-');
        formattedDate = `${d}-${m}-${y}`;
      }
    } else {
      setStaffMgmtMonthFilter(value);
      setStaffMgmtDate('');
      // Convert "05" to "May-2026"
      if (value && value !== 'all') {
        const monthName = months[parseInt(value) - 1];
        const year = new Date().getFullYear();
        formattedDate = `${monthName}-${year}`;
      }
    }

    if (formattedDate) {
      filterMut.mutate(formattedDate, {
        onSuccess: (data) => setDisplayAttendance(data.staff_attendance || [])
      });
    } else {
      setDisplayAttendance(baseAttendance); // Reset
    }
  };

  const clearFilters = () => {
    setStaffMgmtDate('');
    setStaffMgmtMonthFilter('');
    setDisplayAttendance(baseAttendance);
  };

  const submitLeaveResponse = (data: ResponseFormValues) => {
    if (!processingLeave) return;

    respondMut.mutate({
      leave_id: processingLeave.id,
      action: processingLeave.action,
      admin_response: data.admin_response || null
    }, {
      onSuccess: () => {
        setProcessingLeave(null);
        reset();
      }
    });
  };

  if (isLoading) {
    return <div className="py-20 flex justify-center text-muted-foreground"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-heading font-bold flex items-center gap-2">
        <CalendarDays className="h-5 w-5 text-primary" /> Staff Attendance & Leave Management
      </h2>

      {/* Attendance Overview with Filters */}
      <div className="rounded-2xl bg-card border border-border cafe-shadow p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h3 className="font-heading font-bold">Staff Attendance</h3>
          <div className="flex flex-wrap items-center gap-2">

            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
              <Input placeholder="Search staff..." value={staffMgmtSearch} onChange={e => setStaffMgmtSearch(e.target.value)} className="pl-8 h-8 w-[160px] rounded-xl text-xs" />
            </div>

            <Select value={staffMgmtMonthFilter || 'all'} onValueChange={v => applyFilter('month', v)}>
              <SelectTrigger className="h-8 w-[140px] rounded-xl text-xs"><Calendar className="h-3 w-3 mr-1" /><SelectValue placeholder="All Months" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Months</SelectItem>
                {months.map((m, i) => (
                  <SelectItem key={m} value={String(i + 1).padStart(2, '0')}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input type="date" value={staffMgmtDate} onChange={e => applyFilter('date', e.target.value)} className="h-8 w-[140px] rounded-xl text-xs" />

            {(staffMgmtDate || staffMgmtMonthFilter) && (
              <button onClick={clearFilters} className="text-[10px] text-primary hover:underline">Clear</button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          {filterMut.isPending ? (
            <div className="py-10 flex justify-center text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : (
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-border text-left">
                  {['Staff Name', 'Role', 'Shift', 'Clock In', 'Clock Out', 'Status'].map(h => (
                    <th key={h} className="p-3 text-xs font-semibold text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredAttendance.map((s: any, idx: number) => (
                  <tr key={idx} className="hover:bg-muted/30">
                    <td className="p-3 text-sm font-medium">{s.staff_name}</td>
                    <td className="p-3"><Badge variant="outline" className="text-xs">{s.role}</Badge></td>
                    <td className="p-3 text-sm text-muted-foreground capitalize">{s.shift}</td>
                    <td className="p-3 text-sm text-muted-foreground">{s.clock_in || '--:--'}</td>
                    <td className="p-3 text-sm text-muted-foreground">{s.clock_out || '--:--'}</td>
                    <td className="p-3">
                      <Badge className={s.status?.toLowerCase() === 'present' ? 'bg-success/10 text-success text-[10px]' : 'bg-destructive/10 text-destructive text-[10px]'}>
                        {s.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {filteredAttendance.length === 0 && (
                  <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">No attendance records found for this filter.</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Pending Leave Requests */}
      <div className="rounded-2xl bg-card border border-border cafe-shadow p-4 sm:p-6">
        <h3 className="font-heading font-bold mb-4">Pending Leave Requests</h3>
        <div className="space-y-3">
          {pendingLeaves.length === 0 ? (
            <p className="text-center text-muted-foreground py-4 text-sm">No pending requests</p>
          ) : pendingLeaves.map((req: any) => (
            // NOTE: key + the Approve/Reject handlers below rely on
            // req.id / req.leave_id. The backend's staff_manamgment.py
            // pending_leave_requests list currently does NOT include
            // "leave_id" (only "staff_id") — add it there, otherwise
            // processingLeave.id will be undefined and the
            // /admin/leave-request-response call will 422.
            <div key={req.leave_id || req.id} className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/20">
              <div>
                <p className="text-sm font-medium">{req.staff_name}</p>
                <p className="text-xs text-muted-foreground capitalize">{req.type_of_leave} • {req.from_date} → {req.to_date}</p>
                <p className="text-[10px] text-muted-foreground mt-1">Reason: {req.reason}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="text-[10px] bg-accent/10 text-accent">Pending</Badge>
                <div className="flex gap-1">
                  <Button size="sm" className="h-7 px-2 rounded-lg bg-success/90 text-success-foreground text-[10px]" onClick={() => setProcessingLeave({ id: req.leave_id || req.id, action: 'approved', name: req.staff_name })}>
                    Approve
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 px-2 rounded-lg text-destructive text-[10px]" onClick={() => setProcessingLeave({ id: req.leave_id || req.id, action: 'rejected', name: req.staff_name })}>
                    Reject
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Approved Requests */}
      {approvedLeaves.length > 0 && (
        <div className="rounded-2xl bg-card border border-border cafe-shadow p-4 sm:p-6">
          <h3 className="font-heading font-bold mb-4 text-success">✅ Approved Requests</h3>
          <div className="space-y-3">
            {approvedLeaves.map((req: any, idx: number) => (
              <div key={req.leave_id || idx} className="flex items-center justify-between p-4 rounded-xl border border-success/20 bg-success/5">
                <div>
                  <p className="text-sm font-medium">{req.staff_name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{req.type_of_leave} • {req.from_date} → {req.to_date}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Reason: {req.reason}</p>
                </div>
                <Badge className="text-[10px] bg-success/10 text-success">Approved</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rejected Requests */}
      {rejectedLeaves.length > 0 && (
        <div className="rounded-2xl bg-card border border-border cafe-shadow p-4 sm:p-6">
          <h3 className="font-heading font-bold mb-4 text-destructive">❌ Rejected Requests</h3>
          <div className="space-y-3">
            {rejectedLeaves.map((req: any, idx: number) => (
              <div key={req.leave_id || idx} className="flex items-center justify-between p-4 rounded-xl border border-destructive/20 bg-destructive/5">
                <div>
                  <p className="text-sm font-medium">{req.staff_name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{req.type_of_leave} • {req.from_date} → {req.to_date}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Reason: {req.reason}</p>
                </div>
                <Badge className="text-[10px] bg-destructive/10 text-destructive">Rejected</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- Admin Response Modal --- */}
      <AnimatePresence>
        {processingLeave && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-40" />

            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 pointer-events-none">

              <div className="bg-background rounded-2xl border border-border p-6 cafe-shadow-lg w-full max-w-sm pointer-events-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-heading font-bold text-lg capitalize">{processingLeave.action} Leave</h3>
                  <button onClick={() => setProcessingLeave(null)} className="h-8 w-8 rounded-xl bg-muted flex items-center justify-center"><XIcon className="h-4 w-4" /></button>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  You are about to <strong className={processingLeave.action === 'approved' ? 'text-success' : 'text-destructive'}>{processingLeave.action}</strong> the leave request for <strong>{processingLeave.name}</strong>.
                </p>

                <form onSubmit={handleSubmit(submitLeaveResponse)}>
                  <div>
                    <Label>Admin Comment / Reason (Optional)</Label>
                    <Input {...register('admin_response')} placeholder="Add a note..." className="mt-1 rounded-xl" />
                  </div>

                  <div className="flex gap-2 mt-6">
                    <Button type="button" variant="outline" className="flex-1 rounded-xl" onClick={() => setProcessingLeave(null)}>Cancel</Button>
                    <Button type="submit" disabled={respondMut.isPending} className={`flex-1 rounded-xl text-white ${processingLeave.action === 'approved' ? 'bg-success hover:bg-success/90' : 'bg-destructive hover:bg-destructive/90'}`}>
                      {respondMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Check className="h-4 w-4 mr-1" /> Confirm</>}
                    </Button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
