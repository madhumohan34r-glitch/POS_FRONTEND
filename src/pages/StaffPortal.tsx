import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock, LogOut, CalendarDays, CheckCircle2, XCircle, Timer, FileText, Plus, X,
  TrendingUp, Award, Wrench, Loader2, Bell, Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import LiveClock from '@/components/LiveClock';
import { useAuth } from '@/lib/auth-context';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

// All data comes straight from the APIs through TanStack Query (no zustand / no local store)
import {
  useStaffAttendanceDashboard,
  useStaffAttendanceHistory,
  useFilterStaffAttendance,
  useStaffLeaveDashboard,
  useFilterStaffLeaves,
  useStaffOpsDashboard,
  useClockInMutation,
  useClockOutMutation,
  useApplyLeaveMutation,
  useReportStoreIssueMutation,
  useStartStoreIssue,
  useCompleteStoreIssue,
  useStaffNotifications,
  useMarkStaffNotificationRead,
} from '@/tanstack/alltanstack';

// ============================================================================
// ZOD SCHEMAS
// ============================================================================
const leaveSchema = z
  .object({
    leave_type: z.string().min(1, 'Please select a leave type'),
    from_date: z.string().min(1, 'Start date is required'),
    to_date: z.string().min(1, 'End date is required'),
    reason: z.string().min(5, 'Reason must be at least 5 characters long'),
  })
  .refine((v) => !v.from_date || !v.to_date || v.to_date >= v.from_date, {
    message: 'End date cannot be before start date',
    path: ['to_date'],
  });

const issueSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
});

type LeaveForm = z.infer<typeof leaveSchema>;
type IssueForm = z.infer<typeof issueSchema>;

// ============================================================================
// TABS (kept in the URL so a page refresh stays on the same tab)
// ============================================================================
type Tab = 'attendance' | 'leave' | 'issues';
const VALID_TABS: Tab[] = ['attendance', 'leave', 'issues'];

// ============================================================================
// HELPERS
// ============================================================================
const formatAttDate = (d: string) => {
  if (!d) return '—';
  const dt = new Date(`${d}T00:00:00`);
  return isNaN(dt.getTime())
    ? d
    : dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
};

const formatHours = (h?: string | null) => {
  const n = parseFloat(String(h ?? ''));
  return !h || isNaN(n) || n === 0 ? '—' : `${n}h`;
};

const formatAttStatus = (s: string) => (s || '').replace(/\s+/g, '-');

// ISO date-time from the backend -> "Oct 14, 10:30 PM"
const formatDateTime = (iso?: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  return isNaN(d.getTime())
    ? ''
    : d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
};

// "in_progress" -> "in progress"
const formatIssueStatus = (s?: string) => (s || '').replace(/_/g, ' ');

// "In Progress" / "in-progress" -> "in_progress"
const normStatus = (s?: string) => String(s || '').toLowerCase().trim().replace(/[\s-]+/g, '_');

const statusColor = (s: string) => {
  const status = s?.toLowerCase() || '';
  if (
    status.includes('present') ||
    status.includes('approved') ||
    status.includes('resolved') ||
    status.includes('done') ||
    status.includes('finished')
  )
    return 'bg-success/10 text-success border-success/20';
  if (status.includes('absent') || status.includes('leave') || status.includes('rejected') || status.includes('critical'))
    return 'bg-destructive/10 text-destructive border-destructive/20';
  if (status.includes('half') || status.includes('medium') || status.includes('high'))
    return 'bg-accent/10 text-accent border-accent/20';
  if (status.includes('pending') || status.includes('open') || status.includes('progress') || status.includes('assigned'))
    return 'bg-info/10 text-info border-info/20';
  return 'bg-muted text-muted-foreground';
};

// The 4 leave cards are ALWAYS shown (even if the backend sends fewer / differently named keys)
const LEAVE_CARDS = [
  { key: 'casual', label: 'Casual Leave', color: 'from-primary/20 to-primary/5', iconColor: 'text-primary' },
  { key: 'sick', label: 'Sick Leave', color: 'from-destructive/20 to-destructive/5', iconColor: 'text-destructive' },
  { key: 'earned', label: 'Earned Leave', color: 'from-success/20 to-success/5', iconColor: 'text-success' },
  { key: 'unpaid', label: 'Unpaid Leave', color: 'from-muted-foreground/20 to-muted-foreground/5', iconColor: 'text-muted-foreground' },
];

// Works for { casual: {...} } , { casual_leave: {...} } , { "Casual Leave": {...} } and [ { leave_type: 'Casual', ... } ]
const pickBalance = (balance: any, key: string) => {
  if (!balance) return null;
  if (Array.isArray(balance)) {
    return balance.find((b) => String(b?.leave_type ?? b?.type ?? b?.name ?? '').toLowerCase().includes(key)) ?? null;
  }
  const k = Object.keys(balance).find((x) => x.toLowerCase().includes(key));
  return k ? balance[k] : null;
};

// first defined value among several possible backend field names
const firstOf = (obj: any, keys: string[]) => {
  for (const k of keys) if (obj?.[k] !== undefined && obj?.[k] !== null) return Number(obj[k]) || 0;
  return undefined;
};

const normalizeBalance = (raw: any) => {
  if (raw == null) return { total: 0, used: 0, remaining: 0 };
  if (typeof raw === 'number') return { total: raw, used: 0, remaining: raw };
  const total = firstOf(raw, ['total', 'total_leaves', 'total_days', 'allowed', 'allocated', 'quota', 'limit', 'max', 'yearly']) ?? 0;
  const used = firstOf(raw, ['used', 'used_days', 'used_leaves', 'taken', 'consumed']) ?? 0;
  const remaining =
    firstOf(raw, ['remaining', 'remaining_days', 'remaining_leaves', 'available', 'left', 'balance']) ?? Math.max(total - used, 0);
  return { total: total || used + remaining, used, remaining };
};

// the balance object may live under a different top-level key than `leave_balance`
const findBalanceSource = (res: any) => {
  if (!res) return null;
  if (res.leave_balance) return res.leave_balance;
  const k = Object.keys(res).find((x) => /balance|summary|quota|allowance/i.test(x));
  return k ? res[k] : null;
};

// Used only when the backend sends an empty `leave_balance` ({}). Change these numbers to your company policy.
const DEFAULT_ALLOWANCE: Record<string, number> = { casual: 8, sick: 5, earned: 12, unpaid: 0 };

const leaveDays = (from?: string, to?: string) => {
  const a = new Date(`${from}T00:00:00`).getTime();
  const b = new Date(`${to}T00:00:00`).getTime();
  return isNaN(a) || isNaN(b) || b < a ? 0 : Math.round((b - a) / 86400000) + 1;
};

// Approved leave days of one type, counted from the leave request list
const usedFromRequests = (approved: any[], key: string) =>
  approved
    .filter((l) => String(l?.leave_type ?? '').toLowerCase().includes(key))
    .reduce((sum, l) => sum + leaveDays(l.from_date, l.to_date), 0);

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

// ============================================================================
// COMPONENT
// ============================================================================
const StaffPortal = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // --- ACTIVE TAB lives in the URL (?tab=issues) so refresh keeps the same page ---
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as Tab | null;
  const activeTab: Tab = tabParam && VALID_TABS.includes(tabParam) ? tabParam : 'attendance';
  const setActiveTab = (t: Tab) => setSearchParams(t === 'attendance' ? {} : { tab: t }, { replace: true });

  // --- QUERIES ---
  const { data: attData, isLoading: isAttLoading } = useStaffAttendanceDashboard();
  const { data: leaveDataRes, isLoading: isLeaveLoading } = useStaffLeaveDashboard();
  const { data: opsData, isLoading: isOpsLoading, isError: isOpsError, refetch: refetchOps } = useStaffOpsDashboard();
  const { data: historyData, isLoading: isHistoryLoading } = useStaffAttendanceHistory();
  const { data: notifData, refetch: refetchNotif } = useStaffNotifications();
  // --- AUTO REFRESH: new assigned issues + notifications appear without a page refresh ---
  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === 'visible') {
        refetchOps();
        refetchNotif();
      }
    };
    const id = setInterval(refresh, 10000); // every 10 seconds
    document.addEventListener('visibilitychange', refresh); // also when the user comes back to the tab
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [refetchOps, refetchNotif]);
  // --- MUTATIONS ---
  const filterAttMut = useFilterStaffAttendance();
  const filterLeaveMut = useFilterStaffLeaves();
  const clockInMut = useClockInMutation();
  const clockOutMut = useClockOutMutation();
  const applyLeaveMut = useApplyLeaveMutation();
  const reportIssueMut = useReportStoreIssueMutation();
  const startIssueMut = useStartStoreIssue();
  const completeIssueMut = useCompleteStoreIssue();
  const markReadMut = useMarkStaffNotificationRead();

  // --- UI STATE ---
  const [showApplyLeave, setShowApplyLeave] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  // backend doesn't send is_read in the list, so remember what was opened in this session
  const [readIds, setReadIds] = useState<number[]>([]);
  // instant UI update for Start / Finished buttons (before the refetch comes back)
  const [statusOverride, setStatusOverride] = useState<Record<number, string>>({});

  // attendance filters
  const [filterDate, setFilterDate] = useState('');
  const [attendanceStatusFilter, setAttendanceStatusFilter] = useState('all');
  const [isFiltered, setIsFiltered] = useState(false);

  // leave filters
  const [leaveStatusFilter, setLeaveStatusFilter] = useState('all');
  const [leaveTypeFilter, setLeaveTypeFilter] = useState('all');
  const [isLeaveFiltered, setIsLeaveFiltered] = useState(false);

  // --- FORMS ---
  const formLeave = useForm<LeaveForm>({
    resolver: zodResolver(leaveSchema),
    defaultValues: { leave_type: '', from_date: '', to_date: '', reason: '' },
  });

  const formIssue = useForm<IssueForm>({
    resolver: zodResolver(issueSchema),
    defaultValues: { title: '', description: '', priority: 'medium' },
  });

  // --- HANDLERS: leave ---
  const clearLeaveFilter = () => {
    setLeaveStatusFilter('all');
    setLeaveTypeFilter('all');
    setIsLeaveFiltered(false);
    filterLeaveMut.reset();
  };

  const runLeaveFilter = (status: string, leaveType: string) => {
    if (status === 'all' && leaveType === 'all') {
      setIsLeaveFiltered(false);
      filterLeaveMut.reset();
      return;
    }
    filterLeaveMut.mutate(
      {
        ...(status !== 'all' && { status }),
        ...(leaveType !== 'all' && { leave_type: leaveType }),
      },
      { onSuccess: () => setIsLeaveFiltered(true) },
    );
  };

  const handleLeaveStatusChange = (v: string) => {
    setLeaveStatusFilter(v);
    runLeaveFilter(v, leaveTypeFilter);
  };
  const handleLeaveTypeChange = (v: string) => {
    setLeaveTypeFilter(v);
    runLeaveFilter(leaveStatusFilter, v);
  };

  const onSubmitLeave = (data: LeaveForm) => {
    applyLeaveMut.mutate(data, {
      onSuccess: () => {
        setShowApplyLeave(false);
        formLeave.reset();
        clearLeaveFilter();
      },
    });
  };

  // --- HANDLERS: issues ---
  const onSubmitIssue = (data: IssueForm) => {
    reportIssueMut.mutate(data, {
      onSuccess: () => formIssue.reset({ title: '', description: '', priority: 'medium' }),
    });
  };

  const handleStart = (id: number) =>
    startIssueMut.mutate(
      { issue_id: id },
      { onSuccess: () => setStatusOverride((p) => ({ ...p, [id]: 'in_progress' })) },
    );

  const handleComplete = (id: number) =>
    completeIssueMut.mutate(
      { issue_id: id },
      { onSuccess: () => setStatusOverride((p) => ({ ...p, [id]: 'finished' })) },
    );

  // backend status + what the user just did (override only applies while it is still "ahead" of the server data)
  const getIssueStatus = (issue: any) => {
    const s = normStatus(issue.status);
    const o = statusOverride[issue.issue_id];
    if (o === 'in_progress' && s === 'assigned') return o;
    if (o === 'finished' && s === 'in_progress') return o;
    return s;
  };

  // --- HANDLERS: attendance ---
  const clearAttendanceFilter = () => {
    setFilterDate('');
    setAttendanceStatusFilter('all');
    setIsFiltered(false);
    filterAttMut.reset();
  };

  const runAttendanceFilter = (date: string, status: string) => {
    if (!date && status === 'all') {
      setIsFiltered(false);
      filterAttMut.reset();
      return;
    }
    const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
    filterAttMut.mutate(
      {
        from_date: date || '2000-01-01',
        to_date: date || today,
        ...(status !== 'all' && { status }),
      },
      { onSuccess: () => setIsFiltered(true) },
    );
  };

  const handleDateFilterChange = (v: string) => {
    setFilterDate(v);
    runAttendanceFilter(v, attendanceStatusFilter);
  };
  const handleStatusFilterChange = (v: string) => {
    setAttendanceStatusFilter(v);
    runAttendanceFilter(filterDate, v);
  };

  // --- HANDLERS: notifications ---
  const isNotifRead = (n: any) => n.is_read === true || readIds.includes(n.notification_id);

  const openNotification = (n: any) => {
    if (isNotifRead(n)) return;
    setReadIds((prev) => [...prev, n.notification_id]);
    markReadMut.mutate(n.notification_id);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // --- LOADING ---
  if (isAttLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="animate-spin h-10 w-10 text-primary" />
      </div>
    );
  }

  // --- SAFE DATA ---
  const attSummary = attData?.summary || { present_days: 0, absent_days: 0, total_hours: '0h', avg_hours_per_day: 0 };
  const todayAtt = attData?.today_attendance || null;
  const isClockedIn = !!(todayAtt && todayAtt.clock_in_time && !todayAtt.clock_out_time);

  const historyRows: any[] = isFiltered ? filterAttMut.data?.attendance ?? [] : historyData?.attendance ?? [];
  const isTableLoading = isHistoryLoading || filterAttMut.isPending;

  const leaveBalance = findBalanceSource(leaveDataRes);
  const pendingLeaves: any[] = leaveDataRes?.leave_requests?.pending || [];
  const approvedLeaves: any[] = leaveDataRes?.leave_requests?.approved || [];
  const rejectedLeaves: any[] = leaveDataRes?.leave_requests?.rejected || [];
  const filteredLeaves: any[] = filterLeaveMut.data?.leaves ?? [];
  const leaveBlocked = leaveDataRes?.success === false;

  // ISSUES: backend returns { reported_issues, assigned_issues, counts }
  const reportedIssues: any[] = opsData?.reported_issues || [];
  const assignedRaw: any[] = opsData?.assigned_issues || [];
// newly assigned first, then in progress, finished ones at the bottom
const ISSUE_ORDER: Record<string, number> = { assigned: 0, in_progress: 1, finished: 2, resolved: 2 };
const assignedIssues: any[] = [...assignedRaw].sort(
  (a, b) => (ISSUE_ORDER[getIssueStatus(a)] ?? 3) - (ISSUE_ORDER[getIssueStatus(b)] ?? 3),
);
  const openIssues: number = reportedIssues.filter((i) => normStatus(i.status) === 'open').length;
  const activeAssigned: number = assignedIssues.filter((i) => {
    const s = getIssueStatus(i);
    return s === 'assigned' || s === 'in_progress';
  }).length;
  const opsBlocked = isOpsError || opsData?.success === false;

  const isStarting = (id: number) => startIssueMut.isPending && startIssueMut.variables?.issue_id === id;
  const isCompleting = (id: number) => completeIssueMut.isPending && completeIssueMut.variables?.issue_id === id;

  const notifications: any[] = notifData?.notifications ?? [];
  // already-read messages (from the server) are hidden; ones read in this session stay visible in light colour with a tick
  const visibleNotifications = notifications.filter(
    (n) => n.is_read !== true || readIds.includes(n.notification_id),
  );
  const unreadCount: number = notifData?.unread_notification_count ?? attData?.unread_notification_count ?? 0;

  const leaveCard = (l: any, i: number, tone: 'pending' | 'approved' | 'rejected' | 'plain') => (
    <motion.div
      key={`${tone}-${i}`}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={`p-4 rounded-2xl bg-card border cafe-shadow ${
        tone === 'pending' ? 'border-info/20' : tone === 'approved' ? 'border-success/20' : tone === 'rejected' ? 'border-destructive/20' : 'border-border'
      }`}
    >
      <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs capitalize">{l.leave_type}</Badge>
          <span className="text-sm font-medium text-foreground">{l.from_date} → {l.to_date}</span>
        </div>
        <Badge className={`text-[10px] capitalize border ${statusColor(l.status)}`}>{l.status}</Badge>
      </div>
      <p className="text-xs text-muted-foreground">{l.reason}</p>
      {l.applied_date && <p className="text-[10px] text-muted-foreground mt-1">Applied: {l.applied_date}</p>}
    </motion.div>
  );

  // Issue reported by this staff member (highlighted)
  const reportedIssueCard = (issue: any) => (
    <div
      key={issue.issue_id}
      className="p-4 rounded-2xl bg-primary/5 border border-primary/20 border-l-4 border-l-primary flex items-start justify-between gap-4"
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-bold text-foreground">{issue.title}</span>
          <Badge className={`text-[10px] capitalize border ${statusColor(issue.priority)}`}>{issue.priority}</Badge>
        </div>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          {issue.issue_code}
          {issue.reported_at ? ` • Reported on ${formatDateTime(issue.reported_at)}` : ''}
        </p>
        <p className="text-xs text-muted-foreground mt-1">{issue.description}</p>
      </div>
      <Badge className={`text-[10px] capitalize border shrink-0 ${statusColor(issue.status)}`}>
        {formatIssueStatus(issue.status)}
      </Badge>
    </div>
  );

  // Issue assigned to this staff member by the admin: small Start / Finished button on the right
  const assignedIssueCard = (issue: any) => {
    const status = getIssueStatus(issue);
    const canStart = status === 'assigned';
    const inProgress = status === 'in_progress';
    const isFinished = status === 'finished' || status === 'resolved';
    return (
      <div key={issue.issue_id} className="p-4 rounded-2xl bg-card border border-border flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-foreground">{issue.title}</span>
            <Badge className={`text-[10px] capitalize border ${statusColor(issue.priority)}`}>{issue.priority}</Badge>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {issue.issue_code}
            {issue.reported_by ? ` • Reported by ${issue.reported_by}` : ''}
            {issue.reported_at ? ` on ${formatDateTime(issue.reported_at)}` : ''}
          </p>
          <p className="text-xs text-muted-foreground mt-1">{issue.description}</p>
          {isFinished && issue.resolved_at && (
            <p className="text-[11px] text-success font-medium mt-2">Finished on {formatDateTime(issue.resolved_at)}</p>
          )}
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0">
          <Badge className={`text-[10px] capitalize border ${statusColor(status)}`}>{formatIssueStatus(status)}</Badge>

          {canStart && (
            <Button
              size="sm"
              onClick={() => handleStart(issue.issue_id)}
              disabled={isStarting(issue.issue_id)}
              className="h-8 px-4 rounded-lg text-xs bg-primary text-primary-foreground"
            >
              {isStarting(issue.issue_id) ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Start'}
            </Button>
          )}

          {inProgress && (
            <Button
              size="sm"
              onClick={() => handleComplete(issue.issue_id)}
              disabled={isCompleting(issue.issue_id)}
              className="h-8 px-4 rounded-lg text-xs bg-success text-success-foreground"
            >
              {isCompleting(issue.issue_id) ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Finished'}
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background font-body pb-10">
      {/* ============================ HEADER ============================ */}
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <CalendarDays className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-heading font-bold text-foreground">{user?.restaurant_name || 'CaféFlow'}</h1>
              <p className="text-[11px] text-muted-foreground">Staff Portal • <LiveClock /></p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* ---------- NOTIFICATION BELL ---------- */}
            <div className="relative">
              <button
                onClick={() => setShowNotif((v) => !v)}
                aria-label="Notifications"
                className="relative h-10 w-10 rounded-xl bg-muted flex items-center justify-center hover:bg-secondary transition-colors"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {showNotif && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowNotif(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.97 }}
                      className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] z-50 rounded-2xl bg-card border border-border cafe-shadow-lg overflow-hidden"
                    >
                      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                        <h4 className="font-heading font-bold text-sm text-foreground">Notifications</h4>
                        {unreadCount > 0 && (
                          <Badge className="text-[10px] bg-primary/10 text-primary border border-primary/20">{unreadCount} new</Badge>
                        )}
                      </div>
                      <div className="max-h-80 overflow-y-auto divide-y divide-border">
                        {notifData?.success === false ? (
                          <p className="p-6 text-center text-xs text-muted-foreground">{notifData.message}</p>
                        ) : visibleNotifications.length === 0 ? (
                          <p className="p-6 text-center text-xs text-muted-foreground">No notifications</p>
                        ) : (
                          visibleNotifications.map((n: any) => {
                            const read = isNotifRead(n);
                            return (
                              <button
                                key={n.notification_id}
                                onClick={() => openNotification(n)}
                                className={`w-full text-left p-3 flex gap-3 hover:bg-muted/30 transition-colors ${read ? 'opacity-60' : 'bg-primary/5'}`}
                              >
                                <span className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${read ? 'bg-transparent' : 'bg-primary'}`} />
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-medium text-foreground">{n.title}</p>
                                  <p className="text-xs text-muted-foreground">{n.message}</p>
                                </div>
                                {read && <Check className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-1" />}
                              </button>
                            );
                          })
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <nav className="flex gap-1 bg-muted rounded-xl p-1">
              {([
                { id: 'attendance' as const, label: 'Attendance', icon: Clock },
                { id: 'leave' as const, label: 'Leave', icon: CalendarDays },
                { id: 'issues' as const, label: 'Issues', icon: Wrench },
              ]).map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                    activeTab === t.id ? 'bg-card text-foreground cafe-shadow' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <t.icon className="h-4 w-4" /> <span className="hidden sm:inline">{t.label}</span>
                </button>
              ))}
            </nav>

            <div className="hidden sm:flex items-center gap-2 ml-3 pl-3 border-l border-border">
              <div className="text-right">
                <p className="text-sm font-medium text-foreground">{user?.name || 'Staff'}</p>
                <p className="text-[10px] text-muted-foreground capitalize">{user?.role || 'Staff Member'}</p>
              </div>
              <Button variant="outline" size="sm" className="rounded-xl" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {/* ========================== ATTENDANCE TAB ========================== */}
        {activeTab === 'attendance' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Present Days', value: attSummary.present_days, icon: CheckCircle2, color: 'from-success/20 to-success/5', iconColor: 'text-success' },
                { label: 'Total Hours', value: attSummary.total_hours, icon: Timer, color: 'from-primary/20 to-primary/5', iconColor: 'text-primary' },
                { label: 'Avg Hours/Day', value: attSummary.avg_hours_per_day, icon: TrendingUp, color: 'from-info/20 to-info/5', iconColor: 'text-info' },
                { label: 'Absent Days', value: attSummary.absent_days, icon: XCircle, color: 'from-destructive/20 to-destructive/5', iconColor: 'text-destructive' },
              ].map((stat) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-2xl bg-gradient-to-br ${stat.color} border border-border cafe-shadow`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <stat.icon className={`h-4 w-4 ${stat.iconColor}`} />
                    <span className="text-[11px] text-muted-foreground font-medium">{stat.label}</span>
                  </div>
                  <p className="text-2xl font-heading font-bold text-foreground">{stat.value}</p>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl bg-card border border-border cafe-shadow overflow-hidden"
            >
              <div className="bg-gradient-to-r from-primary/5 to-accent/5 p-6 text-center">
                <p className="text-sm text-muted-foreground mb-1">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
                <h2 className="text-xl font-heading font-bold text-foreground mb-4">Today's Attendance</h2>

                {todayAtt?.clock_out_time ? (
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-muted border border-border">
                    <span className="text-sm font-medium text-muted-foreground">
                      Shift Completed: {todayAtt.clock_in_time} to {todayAtt.clock_out_time}
                    </span>
                  </div>
                ) : isClockedIn ? (
                  <div className="space-y-3">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-success/10 border border-success/20">
                      <CheckCircle2 className="h-4 w-4 text-success" />
                      <span className="text-sm font-medium text-success">Clocked in at {todayAtt.clock_in_time}</span>
                    </div>
                    <div>
                      <Button onClick={() => clockOutMut.mutate()} disabled={clockOutMut.isPending} variant="destructive" className="rounded-xl px-8 py-5">
                        {clockOutMut.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <LogOut className="h-4 w-4 mr-2" />}
                        Clock Out
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    onClick={() => clockInMut.mutate()}
                    disabled={clockInMut.isPending}
                    className="bg-gradient-to-r from-success to-success/80 text-success-foreground rounded-xl px-10 py-5 text-base glow-primary"
                  >
                    {clockInMut.isPending ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <Clock className="h-5 w-5 mr-2" />}
                    Clock In
                  </Button>
                )}
              </div>
            </motion.div>

            {/* ---------------- ATTENDANCE HISTORY ---------------- */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl bg-card border border-border cafe-shadow overflow-hidden"
            >
              <div className="p-4 sm:p-5 border-b border-border">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  <h3 className="font-heading font-bold text-foreground flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" /> Attendance History
                  </h3>
                  <div className="flex flex-wrap items-center gap-2">
                    <Input
                      type="date"
                      value={filterDate}
                      onChange={(e) => handleDateFilterChange(e.target.value)}
                      className="h-8 w-[140px] rounded-xl text-xs"
                      aria-label="Filter by date"
                    />
                    <Select value={attendanceStatusFilter} onValueChange={handleStatusFilterChange}>
                      <SelectTrigger className="h-8 w-[130px] rounded-xl text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="present">Present</SelectItem>
                        <SelectItem value="half day">Half Day</SelectItem>
                        <SelectItem value="in progress">In Progress</SelectItem>
                        <SelectItem value="leave">Leave</SelectItem>
                      </SelectContent>
                    </Select>
                    {(filterDate || attendanceStatusFilter !== 'all') && (
                      <button onClick={clearAttendanceFilter} className="text-[10px] text-primary hover:underline">Clear</button>
                    )}
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[500px]">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      {['Date', 'Clock In', 'Clock Out', 'Hours', 'Status'].map((h) => (
                        <th key={h} className="p-3 sm:p-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider text-left">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {isTableLoading ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto text-primary" /></td>
                      </tr>
                    ) : historyRows.length > 0 ? (
                      historyRows.map((a: any, idx: number) => (
                        <tr key={`${a.date}-${idx}`} className="hover:bg-muted/20 transition-colors">
                          <td className="p-3 sm:p-4 text-sm font-medium text-foreground">{formatAttDate(a.date)}</td>
                          <td className="p-3 sm:p-4 text-sm text-muted-foreground">{a.clock_in_time || '—'}</td>
                          <td className="p-3 sm:p-4 text-sm text-muted-foreground">{a.clock_out_time || '—'}</td>
                          <td className="p-3 sm:p-4 text-sm font-semibold text-foreground">{formatHours(a.worked_hours)}</td>
                          <td className="p-3 sm:p-4">
                            <Badge className={`text-[10px] capitalize border ${statusColor(a.status)}`}>{formatAttStatus(a.status)}</Badge>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan={5} className="p-8 text-center text-muted-foreground text-sm">No records found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </div>
        )}

        {/* ============================ LEAVE TAB ============================ */}
        {activeTab === 'leave' && (
          <div className="space-y-6">
            {isLeaveLoading ? (
              <div className="py-16 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></div>
            ) : (
              <>
                {leaveBlocked && (
                  <p className="text-sm text-destructive text-center">{leaveDataRes?.message || 'Leave is not available for your plan'}</p>
                )}

                {/* ---- 4 BALANCE CARDS (always visible) ---- */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {LEAVE_CARDS.map((c) => {
                    const fromBackend = pickBalance(leaveBalance, c.key);
                    const total = DEFAULT_ALLOWANCE[c.key] ?? 0;
                    const usedDays = usedFromRequests(approvedLeaves, c.key);
                    const b = fromBackend
                      ? normalizeBalance(fromBackend)
                      : { total, used: usedDays, remaining: Math.max(total - usedDays, 0) };
                    return (
                      <motion.div
                        key={c.key}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-4 rounded-2xl bg-gradient-to-br ${c.color} border border-border cafe-shadow`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Award className={`h-4 w-4 ${c.iconColor}`} />
                          <span className="text-[11px] text-muted-foreground font-medium">{c.label}</span>
                        </div>
                        <p className="text-3xl font-heading font-bold text-foreground">{b.remaining}</p>
                        <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all"
                            style={{ width: `${b.total > 0 ? Math.min(100, (b.used / b.total) * 100) : 0}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1">{b.used} used of {b.total}</p>
                      </motion.div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between">
                  <h3 className="font-heading font-bold text-foreground flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-primary" /> Leave Requests
                  </h3>
                  <Button onClick={() => setShowApplyLeave(true)} className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-xl">
                    <Plus className="h-4 w-4 mr-1" /> Apply Leave
                  </Button>
                </div>

                {/* ---- FILTERS ---- */}
                <div className="flex flex-wrap items-center gap-2">
                  <Select value={leaveStatusFilter} onValueChange={handleLeaveStatusChange}>
                    <SelectTrigger className="h-8 w-[130px] rounded-xl text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={leaveTypeFilter} onValueChange={handleLeaveTypeChange}>
                    <SelectTrigger className="h-8 w-[140px] rounded-xl text-xs"><SelectValue placeholder="Leave type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="Casual Leave">Casual</SelectItem>
                      <SelectItem value="Sick Leave">Sick</SelectItem>
                      <SelectItem value="Earned Leave">Earned</SelectItem>
                      <SelectItem value="Unpaid Leave">Unpaid</SelectItem>
                    </SelectContent>
                  </Select>
                  {(isLeaveFiltered || leaveStatusFilter !== 'all' || leaveTypeFilter !== 'all') && (
                    <button onClick={clearLeaveFilter} className="text-[10px] text-primary hover:underline">Clear</button>
                  )}
                </div>

                {/* ---- LIST ---- */}
                {filterLeaveMut.isPending ? (
                  <div className="py-8 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto text-primary" /></div>
                ) : isLeaveFiltered ? (
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Results ({filteredLeaves.length})</h4>
                    {filteredLeaves.map((l, i) => leaveCard(l, i, 'plain'))}
                    {filteredLeaves.length === 0 && <p className="text-center text-muted-foreground py-8">No leave requests match these filters</p>}
                  </div>
                ) : (
                  <>
                    {pendingLeaves.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                          <Clock className="h-3 w-3" /> Pending ({pendingLeaves.length})
                        </h4>
                        {pendingLeaves.map((l, i) => leaveCard(l, i, 'pending'))}
                      </div>
                    )}
                    {approvedLeaves.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                          <CheckCircle2 className="h-3 w-3 text-success" /> Approved ({approvedLeaves.length})
                        </h4>
                        {approvedLeaves.map((l, i) => leaveCard(l, i, 'approved'))}
                      </div>
                    )}
                    {rejectedLeaves.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                          <XCircle className="h-3 w-3 text-destructive" /> Rejected ({rejectedLeaves.length})
                        </h4>
                        {rejectedLeaves.map((l, i) => leaveCard(l, i, 'rejected'))}
                      </div>
                    )}
                    {pendingLeaves.length + approvedLeaves.length + rejectedLeaves.length === 0 && (
                      <p className="text-center text-muted-foreground py-8">No leave requests yet</p>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        )}

        {/* ============================ ISSUES TAB ============================ */}
        {activeTab === 'issues' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* ===== BOX 1: REPORT FORM + MY REPORTED ISSUES ===== */}
            <div className="rounded-2xl bg-card border border-border cafe-shadow p-4 sm:p-6">
              <div className="flex items-center gap-2">
                <Wrench className="h-4 w-4 text-primary" />
                <h3 className="font-heading font-bold text-foreground">Store Issues</h3>
                <Badge variant="outline" className="text-[10px]">{openIssues} open</Badge>
              </div>

              {/* ---- INLINE REPORT FORM ---- */}
              <form onSubmit={formIssue.handleSubmit(onSubmitIssue)} className="space-y-3 mt-5">
                <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr_1fr] gap-3">
                  <div>
                    <Label className="text-xs font-medium">Title</Label>
                    <Input
                      {...formIssue.register('title')}
                      placeholder="e.g. AC not working"
                      className={`mt-1.5 rounded-xl ${formIssue.formState.errors.title ? 'border-destructive' : ''}`}
                    />
                    {formIssue.formState.errors.title && (
                      <p className="text-[10px] text-destructive mt-1 font-medium">{formIssue.formState.errors.title.message}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-xs font-medium">Description</Label>
                    <Input
                      {...formIssue.register('description')}
                      placeholder="What's the problem?"
                      className={`mt-1.5 rounded-xl ${formIssue.formState.errors.description ? 'border-destructive' : ''}`}
                    />
                    {formIssue.formState.errors.description && (
                      <p className="text-[10px] text-destructive mt-1 font-medium">{formIssue.formState.errors.description.message}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-xs font-medium">Priority</Label>
                    <Select
                      value={formIssue.watch('priority')}
                      onValueChange={(v) => formIssue.setValue('priority', v as IssueForm['priority'], { shouldValidate: true })}
                    >
                      <SelectTrigger className="mt-1.5 rounded-xl"><SelectValue placeholder="Priority" /></SelectTrigger>
                      <SelectContent>
                        {PRIORITY_OPTIONS.map((p) => (
                          <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button
                  type="submit"
                  disabled={reportIssueMut.isPending}
                  className="w-full rounded-xl py-5 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground"
                >
                  {reportIssueMut.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                  {reportIssueMut.isPending ? 'Reporting...' : 'Report Issue'}
                </Button>
              </form>

              {/* ---- MY REPORTED ISSUES: ~4 visible, the rest scroll ---- */}
              {!opsBlocked && (
                <div className="mt-5 p-3 sm:p-4 rounded-2xl bg-primary/[0.03] border border-primary/10 space-y-3">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-heading font-bold text-foreground">My Reported Issues</h4>
                    <Badge className="text-[10px] bg-primary/10 text-primary border border-primary/20">{reportedIssues.length}</Badge>
                  </div>
                  {isOpsLoading ? (
                    <div className="py-6 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto text-primary" /></div>
                  ) : reportedIssues.length === 0 ? (
                    <p className="text-center text-muted-foreground py-6 text-sm">You haven't reported any issues yet</p>
                  ) : (
                    <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                      {reportedIssues.map((issue: any) => reportedIssueCard(issue))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ===== BOX 2: ASSIGNED TO ME (separate box, ~4 visible, the rest scroll) ===== */}
            <div className="rounded-2xl bg-card border border-border cafe-shadow p-4 sm:p-6 space-y-3">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-heading font-bold text-foreground">Assigned to Me</h4>
                <Badge variant="outline" className="text-[10px]">{assignedIssues.length}</Badge>
                {activeAssigned > 0 && (
                  <Badge className="text-[10px] bg-primary/10 text-primary border border-primary/20">{activeAssigned} active</Badge>
                )}
              </div>
              {isOpsLoading ? (
                <div className="py-8 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto text-primary" /></div>
              ) : opsBlocked ? (
                <p className="text-center text-destructive text-sm py-6">{opsData?.message || 'Issues are not available for your plan'}</p>
              ) : assignedIssues.length === 0 ? (
                <p className="text-center text-muted-foreground py-6 text-sm">No issues assigned to you</p>
              ) : (
                <div className="space-y-3 max-h-[640px] overflow-y-auto pr-1">
                  {assignedIssues.map((issue: any) => assignedIssueCard(issue))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* ============================ APPLY LEAVE MODAL ============================ */}
      <AnimatePresence>
        {showApplyLeave && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowApplyLeave(false)}
              className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-40"
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md pointer-events-auto"
              >
                <div className="bg-background rounded-2xl border border-border p-6 cafe-shadow-lg">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="font-heading font-bold text-lg">Apply for Leave</h3>
                    <button
                      onClick={() => setShowApplyLeave(false)}
                      className="h-8 w-8 rounded-xl bg-muted flex items-center justify-center hover:bg-secondary transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <form onSubmit={formLeave.handleSubmit(onSubmitLeave)} className="space-y-4">
                    <div>
                      <Label className="text-xs font-medium">Leave Type</Label>
                      <Select
                        value={formLeave.watch('leave_type')}
                        onValueChange={(v) => formLeave.setValue('leave_type', v, { shouldValidate: true })}
                      >
                        <SelectTrigger className={`mt-1.5 rounded-xl ${formLeave.formState.errors.leave_type ? 'border-destructive' : ''}`}>
                          <SelectValue placeholder="Select Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Casual Leave">Casual Leave</SelectItem>
                          <SelectItem value="Sick Leave">Sick Leave</SelectItem>
                          <SelectItem value="Earned Leave">Earned Leave</SelectItem>
                          <SelectItem value="Unpaid Leave">Unpaid Leave</SelectItem>
                        </SelectContent>
                      </Select>
                      {formLeave.formState.errors.leave_type && (
                        <p className="text-[10px] text-destructive mt-1 font-medium">{formLeave.formState.errors.leave_type.message}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs font-medium">From</Label>
                        <Input
                          type="date"
                          {...formLeave.register('from_date')}
                          className={`mt-1.5 rounded-xl ${formLeave.formState.errors.from_date ? 'border-destructive' : ''}`}
                        />
                        {formLeave.formState.errors.from_date && (
                          <p className="text-[10px] text-destructive mt-1 font-medium">{formLeave.formState.errors.from_date.message}</p>
                        )}
                      </div>
                      <div>
                        <Label className="text-xs font-medium">To</Label>
                        <Input
                          type="date"
                          {...formLeave.register('to_date')}
                          className={`mt-1.5 rounded-xl ${formLeave.formState.errors.to_date ? 'border-destructive' : ''}`}
                        />
                        {formLeave.formState.errors.to_date && (
                          <p className="text-[10px] text-destructive mt-1 font-medium">{formLeave.formState.errors.to_date.message}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs font-medium">Reason</Label>
                      <Textarea
                        {...formLeave.register('reason')}
                        placeholder="Reason for leave..."
                        rows={3}
                        className={`mt-1.5 rounded-xl ${formLeave.formState.errors.reason ? 'border-destructive' : ''}`}
                      />
                      {formLeave.formState.errors.reason && (
                        <p className="text-[10px] text-destructive mt-1 font-medium">{formLeave.formState.errors.reason.message}</p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      disabled={applyLeaveMut.isPending}
                      className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground mt-2 w-full rounded-xl py-5"
                    >
                      {applyLeaveMut.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileText className="h-4 w-4 mr-2" />}
                      {applyLeaveMut.isPending ? 'Submitting...' : 'Submit Request'}
                    </Button>
                  </form>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StaffPortal;