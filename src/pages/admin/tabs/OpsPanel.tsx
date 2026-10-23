// import { useState } from 'react';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
// import { Badge } from '@/components/ui/badge';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// import { toast } from 'sonner';
// import { Banknote, Wrench, PackagePlus, Plus, Check, X as XIcon, Loader2 } from 'lucide-react';

// // Import our hooks (all data comes straight from the backend via TanStack Query)
// import {
//   useOpsDashboard, useOpenCounter, useCloseCounter,
//   useStoreIssues, useCreateIssue, useAssignIssue, useUpdateIssueStatus,
//   useStockRequests, useActionStockRequest,
//   useStaffOpsDashboard,
//   useReportStoreIssueMutation,          // Staff Issue Mutation
//   useReportKitchenStoreIssueMutation,   // Kitchen Issue Mutation
//   useSendKitchenStockRequestMutation,   // Kitchen Stock Request Mutation (correct one - do NOT duplicate this)
//   useKitchenOpsDashboard,               
//   useStaffDashboard,                    
// } from '@/tanstack/alltanstack';  

// type Mode = 'counter' | 'kitchen' | 'staff' | 'admin';

// interface Props { mode: Mode; }

// // ---------------------------------------------------------------------------
// // Staff dropdown (shows names, value = staff_id). Only mounted when the assign
// // UI is visible, so the staff query is not fired for modes that never need it.
// // Backend only accepts ACTIVE staff, so inactive ones are filtered out here.
// // ---------------------------------------------------------------------------
// const StaffSelect = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => {
//   const { data, isLoading } = useStaffDashboard();
//   const activeStaff = (data?.staff_details || []).filter((s: any) => s.active_status === 'active');

//   return (
//     <Select value={value} onValueChange={onChange} disabled={isLoading}>
//       <SelectTrigger className="h-8 w-56">
//         <SelectValue placeholder={isLoading ? 'Loading staff...' : 'Select staff'} />
//       </SelectTrigger>
//       <SelectContent>
//         {activeStaff.length === 0 && (
//           <div className="px-2 py-1.5 text-xs text-muted-foreground">No active staff found</div>
//         )}
//         {activeStaff.map((s: any) => (
//           <SelectItem key={s.staff_id} value={String(s.staff_id)}>
//             {s.staff_name}{s.role ? ` (${s.role})` : ''}
//           </SelectItem>
//         ))}
//       </SelectContent>
//     </Select>
//   );
// };

// // ---------------------------------------------------------------------------
// // Kitchen stock request form.
// // IMPORTANT: this must NOT call useMenuDashboard() (GET /admin/menu/) because
// // that endpoint is admin-only and returns 401 for a kitchen token.
// // Menu items are passed in from the kitchen ops dashboard response instead.
// // If the backend does not send a list, the user can type the item name.
// // ---------------------------------------------------------------------------
// const StockRequestForm = ({ menuItems }: { menuItems: any[] }) => {
//   const createKitchenStockMut = useSendKitchenStockRequestMutation(); // -> /kitchen/ops_dashboard/send_stock_request
//   const isSending = createKitchenStockMut.isPending;

//   const [srItem, setSrItem] = useState(''); // menu item NAME (backend expects the name)
//   const [srQty, setSrQty] = useState('');
//   const [srReason, setSrReason] = useState('');

//   const hasList = menuItems.length > 0;

//   const handleStockReq = () => {
//     const name = srItem.trim();
//     if (!name) return toast.error('Pick a menu item');
//     const qty = parseInt(srQty, 10);
//     if (!Number.isFinite(qty) || qty < 0) return toast.error('Enter quantity');

//     createKitchenStockMut.mutate(
//       { menu_item: name, new_available_qty: qty, reason: srReason },
//       { onSuccess: () => { setSrReason(''); setSrQty(''); setSrItem(''); } }
//     );
//   };

//   return (
//     <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
//       <div className="md:col-span-2">
//         <Label>Menu Item</Label>
//         {hasList ? (
//           <Select value={srItem} onValueChange={setSrItem}>
//             <SelectTrigger><SelectValue placeholder="Select Item" /></SelectTrigger>
//             <SelectContent>
//               {menuItems.map((m: any) => (
//                 <SelectItem key={m.id ?? m.item_name} value={String(m.item_name)}>{m.item_name}</SelectItem>
//               ))}
//             </SelectContent>
//           </Select>
//         ) : (
//           <Input value={srItem} onChange={e => setSrItem(e.target.value)} placeholder="Type menu item name" />
//         )}
//       </div>
//       <div><Label>Qty</Label><Input type="number" value={srQty} onChange={e => setSrQty(e.target.value)} /></div>
//       <div className="md:col-span-2"><Label>Reason</Label><Input value={srReason} onChange={e => setSrReason(e.target.value)} /></div>
//       <Button onClick={handleStockReq} disabled={isSending} className="md:col-span-5 md:w-auto"><Plus className="h-4 w-4 mr-1" />Send Request</Button>
//     </div>
//   );
// };

// export const OpsPanel = ({ mode }: Props) => {
//   // --- Boolean Flags ---
//   const isAdmin = mode === 'admin';
//   const isKitchen = mode === 'kitchen';
//   const isStaffRole = !isAdmin && !isKitchen; // counter, staff

//   // --- Queries (Safely conditional) ---
//   const { data: adminSummary, isLoading: loadingAdminSummary } = useOpsDashboard(isAdmin);
//   const { data: adminIssues, isLoading: loadingAdminIssues } = useStoreIssues(isAdmin);
//   const { data: adminStock, isLoading: loadingAdminStock } = useStockRequests(isAdmin);

//   const { data: staffData, isLoading: loadingStaffData } = useStaffOpsDashboard(isStaffRole);
//   const { data: kitchenData, isLoading: loadingKitchenData } = useKitchenOpsDashboard(isKitchen);

//   // --- Mutations ---
//   const openMut = useOpenCounter();
//   const closeMut = useCloseCounter();
//   const createAdminIssMut = useCreateIssue();                       // Admin version
//   const createStaffIssMut = useReportStoreIssueMutation();          // Staff/Counter version
//   const createKitchenIssMut = useReportKitchenStoreIssueMutation(); // Kitchen version
//   const assignIssMut = useAssignIssue();
//   const statusIssMut = useUpdateIssueStatus();
//   const approveStockMut = useActionStockRequest('approve');
//   const rejectStockMut = useActionStockRequest('reject');

//   // --- Extracts & Data Mapping ---
//   const activeSession = isAdmin ? adminSummary?.data?.counter_session?.status === 'open' : false;
//   const issues = isAdmin
//     ? (adminIssues?.data || [])
//     : isKitchen
//       ? (kitchenData?.store_issues || [])
//       : (staffData?.store_issues || []);
//   const requests = isAdmin
//     ? (adminStock?.data || [])
//     : isKitchen
//       ? (kitchenData?.stock_requests || [])
//       : (staffData?.stock_requests || []);

//   // Menu items for the kitchen stock form (comes from /kitchen/ops_dashboard/ if backend sends it)
//   const kitchenMenuItems: any[] =
//     kitchenData?.menu_items ?? kitchenData?.menu_details ?? [];

//   // --- Local States ---
//   const [openAmt, setOpenAmt] = useState('');
//   const [closeAmt, setCloseAmt] = useState('');

//   const [issTitle, setIssTitle] = useState('');
//   const [issDesc, setIssDesc] = useState('');
//   const [issPri, setIssPri] = useState('medium');
//   // issue id -> selected staff_id (as string, because Select values are strings)
//   const [assignTo, setAssignTo] = useState<Record<string, string>>({});

//   // --- Handlers ---
//   const handleOpen = () => {
//     const n = parseFloat(openAmt);
//     if (!Number.isFinite(n) || n < 0) return toast.error('Enter a valid amount.');
//     openMut.mutate({ opening_cash: n }, { onSuccess: () => setOpenAmt('') });
//   };

//   const handleClose = () => {
//     const n = parseFloat(closeAmt);
//     if (!Number.isFinite(n) || n < 0) return toast.error('Enter counted cash.');
//     closeMut.mutate({ closing_cash: n }, { onSuccess: () => setCloseAmt('') });
//   };

//   const handleReportIssue = () => {
//     if (!issTitle.trim()) return toast.error('Title required');
//     const payload = { title: issTitle, description: issDesc, priority: issPri };
//     const onSuccess = () => { setIssTitle(''); setIssDesc(''); };

//     // Dynamically choose which API endpoint to hit based on the user's role!
//     if (isAdmin) {
//       createAdminIssMut.mutate(payload, { onSuccess });
//     } else if (isKitchen) {
//       createKitchenIssMut.mutate(payload, { onSuccess });
//     } else {
//       createStaffIssMut.mutate(payload, { onSuccess });
//     }
//   };

//   const handleAssign = (issueId: number) => {
//     const key = String(issueId);
//     const staffId = Number(assignTo[key]);
//     if (!staffId) return toast.error('Select a staff member');

//     assignIssMut.mutate({ issue_id: issueId, staff_id: staffId }, {
//       onSuccess: (res: any) => {
//         // Backend returns HTTP 200 with success:false for "Issue not found" / "Staff not found"
//         if (res?.success === false) {
//           toast.error(res.message || 'Could not assign issue');
//           return;
//         }
//         setAssignTo(prev => {
//           const next = { ...prev };
//           delete next[key];
//           return next;
//         });
//       },
//     });
//   };

//   // --- Visibility Flags ---
//   const showCash = mode === 'counter' || mode === 'admin';
//   const showIssuesReport = mode === 'staff' || mode === 'kitchen' || mode === 'counter';
//   const showIssuesManage = mode === 'admin' || mode === 'counter';
//   const showStockRequestForm = mode === 'kitchen';
//   const showStockRequestManage = mode === 'counter' || mode === 'admin';

//   const isLoading = isAdmin
//     ? (loadingAdminSummary || loadingAdminIssues || loadingAdminStock)
//     : isKitchen
//       ? loadingKitchenData
//       : loadingStaffData;
//   const isReportingIssue = createAdminIssMut.isPending || createStaffIssMut.isPending || createKitchenIssMut.isPending;

//   if (isLoading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-primary" /></div>;

//   return (
//     <div className="space-y-6">

//       {/* 1. COUNTER SESSION */}
//       {showCash && (
//         <section className="rounded-2xl border border-border bg-card p-5 space-y-4">
//           <div className="flex items-center gap-2">
//             <Banknote className="h-5 w-5 text-primary" />
//             <h3 className="text-lg font-semibold">Counter Cash Session</h3>
//             <Badge variant={activeSession ? 'default' : 'outline'}>{activeSession ? 'Open' : 'Closed'}</Badge>
//           </div>

//           {!activeSession ? (
//             <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
//               <div>
//                 <Label>Opening cash (₹)</Label>
//                 <Input type="number" value={openAmt} onChange={e => setOpenAmt(e.target.value)} placeholder="e.g. 2000" />
//               </div>
//               <div className="md:col-span-2">
//                 <Button onClick={handleOpen} disabled={openMut.isPending} className="w-full md:w-auto">
//                   {openMut.isPending ? 'Opening...' : 'Open Counter'}
//                 </Button>
//               </div>
//             </div>
//           ) : (
//             <div className="rounded-xl border border-border/50 p-4 space-y-3">
//               <div className="font-medium">Close Counter</div>
//               <div className="flex gap-3 items-end">
//                 <div className="flex-1">
//                   <Label>Counted cash (₹)</Label>
//                   <Input type="number" value={closeAmt} onChange={e => setCloseAmt(e.target.value)} />
//                 </div>
//                 <Button variant="destructive" disabled={closeMut.isPending} onClick={handleClose}>
//                   {closeMut.isPending ? 'Closing...' : 'Close Counter'}
//                 </Button>
//               </div>
//             </div>
//           )}
//         </section>
//       )}

//       {/* 2. STORE ISSUES */}
//       {(showIssuesReport || showIssuesManage) && (
//         <section className="rounded-2xl border border-border bg-card p-5 space-y-4">
//           <div className="flex items-center gap-2">
//             <Wrench className="h-5 w-5 text-primary" />
//             <h3 className="text-lg font-semibold">Store Issues</h3>
//             <Badge variant="outline">{issues.filter((i: any) => i.status !== 'resolved' && i.status !== 'closed').length} active</Badge>
//           </div>

//           {showIssuesReport && (
//             <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
//               <div className="md:col-span-1"><Label>Title</Label><Input value={issTitle} onChange={e => setIssTitle(e.target.value)} /></div>
//               <div className="md:col-span-2"><Label>Description</Label><Input value={issDesc} onChange={e => setIssDesc(e.target.value)} /></div>
//               <div>
//                 <Label>Priority</Label>
//                 <Select value={issPri} onValueChange={setIssPri}>
//                   <SelectTrigger><SelectValue /></SelectTrigger>
//                   <SelectContent>
//                     <SelectItem value="low">Low</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="high">High</SelectItem>
//                   </SelectContent>
//                 </Select>
//               </div>
//               <Button onClick={handleReportIssue} disabled={isReportingIssue} className="md:col-span-4 md:w-auto"><Plus className="h-4 w-4 mr-1" />Report Issue</Button>
//             </div>
//           )}

//           <div className="space-y-2">
//             {issues.length === 0 && <div className="text-sm text-muted-foreground">No issues reported.</div>}
//             {issues.map((i: any) => {
//               // Admin list returns `id`; kitchen/staff dashboards may return `issue_id`
//               const issueId: number = i.id ?? i.issue_id;
//               const key = String(issueId);
//               return (
//                 <div key={key} className="rounded-xl border border-border p-3 space-y-2">
//                   <div className="flex justify-between items-start">
//                     <div>
//                       <div className="font-medium">{i.title} <Badge variant="secondary">{i.priority}</Badge></div>
//                       <div className="text-xs text-muted-foreground">{i.issue_code || i.issue_id} • Reported by {i.reported_by || 'System'}</div>
//                       <div className="text-sm mt-1">{i.description}</div>
//                       {i.assigned_to && <div className="text-xs mt-1 font-medium text-primary">Assigned to: {i.assigned_to}</div>}
//                     </div>
//                     <Badge variant={i.status === 'resolved' ? 'outline' : 'default'}>{i.status}</Badge>
//                   </div>

//                   {showIssuesManage && i.status !== 'resolved' && i.status !== 'closed' && (
//                     <div className="flex flex-wrap gap-2 items-end pt-2">
//                       {i.status === 'open' && (
//                         <>
//                           <div>
//                             <Label className="text-xs">Assign to</Label>
//                             <StaffSelect
//                               value={assignTo[key] ?? ''}
//                               onChange={v => setAssignTo(prev => ({ ...prev, [key]: v }))}
//                             />
//                           </div>
//                           <Button
//                             size="sm"
//                             disabled={!assignTo[key] || assignIssMut.isPending}
//                             onClick={() => handleAssign(issueId)}
//                           >
//                             {assignIssMut.isPending ? 'Assigning...' : 'Assign'}
//                           </Button>
//                         </>
//                       )}
//                       {i.status === 'assigned' && <Button size="sm" variant="outline" onClick={() => statusIssMut.mutate({ issue_id: issueId, status: 'in_progress' })}>Start Work</Button>}
//                       {(i.status === 'assigned' || i.status === 'in_progress') && (
//                         <Button size="sm" onClick={() => statusIssMut.mutate({ issue_id: issueId, status: 'resolved' })}><Check className="h-4 w-4 mr-1" />Mark Resolved</Button>
//                       )}
//                     </div>
//                   )}
//                 </div>
//               );
//             })}
//           </div>
//         </section>
//       )}

//       {/* 3. STOCK REQUESTS */}
//       {(showStockRequestForm || showStockRequestManage) && (
//         <section className="rounded-2xl border border-border bg-card p-5 space-y-4">
//           <div className="flex items-center gap-2">
//             <PackagePlus className="h-5 w-5 text-primary" />
//             <h3 className="text-lg font-semibold">Stock Requests</h3>
//             <Badge variant="outline">{requests.filter((r: any) => r.status === 'pending').length} pending</Badge>
//           </div>

//           {showStockRequestForm && <StockRequestForm menuItems={kitchenMenuItems} />}

//           <div className="space-y-2">
//             {requests.length === 0 && <div className="text-sm text-muted-foreground">No requests found.</div>}
//             {requests.map((r: any) => (
//               <div key={r.id} className="rounded-xl border border-border p-3 flex flex-wrap justify-between gap-3 items-center">
//                 <div>
//                   <div className="font-medium">{r.item_name}</div>
//                   <div className="text-xs text-muted-foreground">Req by {r.requested_by || 'Staff'} on {r.requested_at}</div>
//                   <div className="text-sm">Qty: <span className="font-semibold">{r.requested_quantity}</span></div>
//                 </div>
//                 <div className="flex gap-2 items-center">
//                   <Badge variant={r.status === 'approved' ? 'default' : r.status === 'rejected' ? 'destructive' : 'outline'}>{r.status}</Badge>
//                   {showStockRequestManage && r.status === 'pending' && (
//                     <>
//                       <Button size="sm" onClick={() => { approveStockMut.mutate({ request_id: r.id }, { onSuccess: () => toast.success("Approved") }) }}><Check className="h-4 w-4" /></Button>
//                       <Button size="sm" variant="destructive" onClick={() => { rejectStockMut.mutate({ request_id: r.id, reason: 'Declined by admin' }, { onSuccess: () => toast.error("Rejected") }) }}><XIcon className="h-4 w-4" /></Button>
//                     </>
//                   )}
//                 </div>
//               </div>
//             ))}
//           </div>
//         </section>
//       )}
//     </div>
//   );
// };

// export default OpsPanel;

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Banknote, Wrench, PackagePlus, Plus, Check, X as XIcon, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { addCashoutAPI, fetchCashoutListAPI } from '@/AllApis/AllApi';

// Import our hooks (all data comes straight from the backend via TanStack Query)
import {
  useOpsDashboard, useOpenCounter, useCloseCounter,
  useStoreIssues, useCreateIssue, useAssignIssue, useUpdateIssueStatus,
  useStockRequests, useActionStockRequest,
  useStaffOpsDashboard,
  useReportStoreIssueMutation,          // Staff Issue Mutation
  useReportKitchenStoreIssueMutation,   // Kitchen Issue Mutation
  useSendKitchenStockRequestMutation,   // Kitchen Stock Request Mutation (correct one - do NOT duplicate this)
  useKitchenOpsDashboard,               
  useStaffDashboard,                    
} from '@/tanstack/alltanstack';

type Mode = 'counter' | 'kitchen' | 'staff' | 'admin';

interface Props { mode: Mode; }

// ---------------------------------------------------------------------------
// Counter-session helpers (admin panel)
// POST /operations/counter-session/open returns session_id / opened_at / opening_cash,
// but the dashboard-summary does not, so we keep what /open returned.
// ---------------------------------------------------------------------------
const INFO_KEY = 'pos_admin_ops_session_info';

interface SessionInfo {
  session_id: number;
  opened_by?: string | null;
  opened_at?: string | null;
  opening_cash?: number;
}

const readInfo = (): SessionInfo | null => {
  try { const v = localStorage.getItem(INFO_KEY); return v ? (JSON.parse(v) as SessionInfo) : null; }
  catch { return null; }
};
const writeInfo = (i: SessionInfo | null) => {
  try { if (i) localStorage.setItem(INFO_KEY, JSON.stringify(i)); else localStorage.removeItem(INFO_KEY); }
  catch { /* ignore */ }
};

// ⚠️ Same token lookup used in ActiveOrdersTab. Change keys if your admin token is stored differently.
const getToken = () =>
  localStorage.getItem('cafe_token') ||
  localStorage.getItem('access_token') ||
  localStorage.getItem('admin_token') ||
  localStorage.getItem('token') || '';

const CASHOUT_CATEGORIES = ['Groceries', 'Utilities', 'Maintenance', 'Supplies', 'Transport', 'Other'];

const rupee = (n: number) =>
  `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// "2026-10-14 10:44:07" -> "14/10/2026, 10:44:07"
const fmtDateTime = (s?: string | null) => {
  if (!s) return '-';
  const d = new Date(s.replace(' ', 'T'));
  return isNaN(d.getTime()) ? s : d.toLocaleString('en-GB');
};

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-sm text-muted-foreground">{label}</p>
    <p className="font-medium">{value}</p>
  </div>
);

// ---------------------------------------------------------------------------
// Staff dropdown (shows names, value = staff_id). Only mounted when the assign
// UI is visible, so the staff query is not fired for modes that never need it.
// Backend only accepts ACTIVE staff, so inactive ones are filtered out here.
// ---------------------------------------------------------------------------
const StaffSelect = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => {
  const { data, isLoading } = useStaffDashboard();
  const activeStaff = (data?.staff_details || []).filter((s: any) => s.active_status === 'active');

  return (
    <Select value={value} onValueChange={onChange} disabled={isLoading}>
      <SelectTrigger className="h-8 w-56">
        <SelectValue placeholder={isLoading ? 'Loading staff...' : 'Select staff'} />
      </SelectTrigger>
      <SelectContent>
        {activeStaff.length === 0 && (
          <div className="px-2 py-1.5 text-xs text-muted-foreground">No active staff found</div>
        )}
        {activeStaff.map((s: any) => (
          <SelectItem key={s.staff_id} value={String(s.staff_id)}>
            {s.staff_name}{s.role ? ` (${s.role})` : ''}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

// ---------------------------------------------------------------------------
// Kitchen stock request form.
// IMPORTANT: this must NOT call useMenuDashboard() (GET /admin/menu/) because
// that endpoint is admin-only and returns 401 for a kitchen token.
// Menu items are passed in from the kitchen ops dashboard response instead.
// If the backend does not send a list, the user can type the item name.
// ---------------------------------------------------------------------------
const StockRequestForm = ({ menuItems }: { menuItems: any[] }) => {
  const createKitchenStockMut = useSendKitchenStockRequestMutation(); // -> /kitchen/ops_dashboard/send_stock_request
  const isSending = createKitchenStockMut.isPending;

  const [srItem, setSrItem] = useState(''); // menu item NAME (backend expects the name)
  const [srQty, setSrQty] = useState('');
  const [srReason, setSrReason] = useState('');

  const hasList = menuItems.length > 0;

  const handleStockReq = () => {
    const name = srItem.trim();
    if (!name) return toast.error('Pick a menu item');
    const qty = parseInt(srQty, 10);
    if (!Number.isFinite(qty) || qty < 0) return toast.error('Enter quantity');

    createKitchenStockMut.mutate(
      { menu_item: name, new_available_qty: qty, reason: srReason },
      { onSuccess: () => { setSrReason(''); setSrQty(''); setSrItem(''); } }
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
      <div className="md:col-span-2">
        <Label>Menu Item</Label>
        {hasList ? (
          <Select value={srItem} onValueChange={setSrItem}>
            <SelectTrigger><SelectValue placeholder="Select Item" /></SelectTrigger>
            <SelectContent>
              {menuItems.map((m: any) => (
                <SelectItem key={m.id ?? m.item_name} value={String(m.item_name)}>{m.item_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input value={srItem} onChange={e => setSrItem(e.target.value)} placeholder="Type menu item name" />
        )}
      </div>
      <div><Label>Qty</Label><Input type="number" value={srQty} onChange={e => setSrQty(e.target.value)} /></div>
      <div className="md:col-span-2"><Label>Reason</Label><Input value={srReason} onChange={e => setSrReason(e.target.value)} /></div>
      <Button onClick={handleStockReq} disabled={isSending} className="md:col-span-5 md:w-auto"><Plus className="h-4 w-4 mr-1" />Send Request</Button>
    </div>
  );
};

export const OpsPanel = ({ mode }: Props) => {
  const { user } = useAuth();

  // --- Boolean Flags ---
  const isAdmin = mode === 'admin';
  const isKitchen = mode === 'kitchen';
  const isStaffRole = !isAdmin && !isKitchen; // counter, staff

  // --- Queries (Safely conditional) ---
  const { data: adminSummary, isLoading: loadingAdminSummary } = useOpsDashboard(isAdmin);
  const { data: adminIssues, isLoading: loadingAdminIssues } = useStoreIssues(isAdmin);
  const { data: adminStock, isLoading: loadingAdminStock } = useStockRequests(isAdmin);

  const { data: staffData, isLoading: loadingStaffData } = useStaffOpsDashboard(isStaffRole);
  const { data: kitchenData, isLoading: loadingKitchenData } = useKitchenOpsDashboard(isKitchen);

  // --- Mutations ---
  const openMut = useOpenCounter();
  const closeMut = useCloseCounter();
  const createAdminIssMut = useCreateIssue();                       // Admin version
  const createStaffIssMut = useReportStoreIssueMutation();          // Staff/Counter version
  const createKitchenIssMut = useReportKitchenStoreIssueMutation(); // Kitchen version
  const assignIssMut = useAssignIssue();
  const statusIssMut = useUpdateIssueStatus();
  const approveStockMut = useActionStockRequest('approve');
  const rejectStockMut = useActionStockRequest('reject');

  // --- Counter session (admin) state ---
  const [localInfo, setLocalInfo] = useState<SessionInfo | null>(readInfo);
  // flips to true right after /open succeeds so the counter UI shows instantly (no waiting for a refetch)
  const [justOpened, setJustOpened] = useState(false);
  const [cashout, setCashout] = useState({ amount: '', category: CASHOUT_CATEGORIES[0], vendor: '', description: '' });

  const summarySession = adminSummary?.data?.counter_session;
  const serverOpen = summarySession?.status === 'open';

  // --- Extracts & Data Mapping ---
  const activeSession = isAdmin ? (serverOpen || justOpened) : false;
  const info = activeSession ? localInfo : null;
  const sessionId: number | null = activeSession ? (summarySession?.session_id ?? info?.session_id ?? null) : null;

  const issues = isAdmin
    ? (adminIssues?.data || [])
    : isKitchen
      ? (kitchenData?.store_issues || [])
      : (staffData?.store_issues || []);
  const requests = isAdmin
    ? (adminStock?.data || [])
    : isKitchen
      ? (kitchenData?.stock_requests || [])
      : (staffData?.stock_requests || []);

  // Menu items for the kitchen stock form (comes from /kitchen/ops_dashboard/ if backend sends it)
  const kitchenMenuItems: any[] =
    kitchenData?.menu_items ?? kitchenData?.menu_details ?? [];

  // --- Cashouts of the open session ---
  const cashoutsQ = useQuery({
    queryKey: ['admin-ops-cashouts', sessionId],
    queryFn: () => fetchCashoutListAPI(sessionId as number, getToken()),
    enabled: isAdmin && !!sessionId,
  });
  const cashouts: any[] = cashoutsQ.data?.data ?? [];

  const addCashoutMut = useMutation({
    mutationFn: (v: { session_id: number; amount: number; category: string; vendor: string; description: string }) =>
      addCashoutAPI(v, getToken()),
    onSuccess: (res: any) => {
      if (res?.success === false) { toast.error(res.message || 'Unable to add cashout'); return; }
      toast.success(res?.message ?? 'Cashout added');
      setCashout({ amount: '', category: CASHOUT_CATEGORIES[0], vendor: '', description: '' });
      cashoutsQ.refetch();
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail ?? 'Unable to add cashout'),
  });

  // --- Local States ---
  const [openAmt, setOpenAmt] = useState('');
  const [closeAmt, setCloseAmt] = useState('');

  const [issTitle, setIssTitle] = useState('');
  const [issDesc, setIssDesc] = useState('');
  const [issPri, setIssPri] = useState('medium');
  // issue id -> selected staff_id (as string, because Select values are strings)
  const [assignTo, setAssignTo] = useState<Record<string, string>>({});

  // --- Session display values ---
  const u: any = user;
  const myName: string | null = u?.name ?? u?.full_name ?? u?.staff_name ?? u?.username ?? null;
  const openedBy = summarySession?.opened_by ?? info?.opened_by ?? null;
  const openedAt = summarySession?.opened_at ?? info?.opened_at ?? null;
  const openingCashValue: number | undefined = summarySession?.opening_cash ?? info?.opening_cash;
  const cashoutTotal = cashouts.reduce((s, c) => s + Number(c.amount ?? 0), 0);
  const expected: number | undefined =
    summarySession?.expected_cash ?? (openingCashValue !== undefined ? openingCashValue - cashoutTotal : undefined);
  const counted = closeAmt === '' ? null : Number(closeAmt);
  const diff = expected !== undefined && counted !== null && !isNaN(counted) ? counted - expected : null;

  // --- Handlers ---
  const handleOpen = () => {
    const n = parseFloat(openAmt);
    if (!Number.isFinite(n) || n < 0) return toast.error('Enter a valid amount.');
    openMut.mutate({ opening_cash: n }, {
      onSuccess: (res: any) => {
        if (res?.success === false) { toast.error(res.message || 'Unable to open counter'); return; }
        const d = res?.data ?? res;
        if (d?.session_id) {
          const next: SessionInfo = {
            session_id: d.session_id,
            opened_by: myName ?? null,       // API returns an id like "18", so use the logged-in name
            opened_at: d.opened_at ?? null,
            opening_cash: Number(d.opening_cash ?? n),
          };
          setLocalInfo(next);
          writeInfo(next);
        }
        setJustOpened(true);
        setOpenAmt('');
      },
    });
  };

  const handleClose = () => {
    const n = parseFloat(closeAmt);
    if (!Number.isFinite(n) || n < 0) return toast.error('Enter counted cash.');
    closeMut.mutate({ closing_cash: n }, {
      onSuccess: (res: any) => {
        if (res?.success === false) { toast.error(res.message || 'Unable to close counter'); return; }
        setCloseAmt('');
        setJustOpened(false);
        setLocalInfo(null);
        writeInfo(null);
      },
    });
  };

  const handleAddCashout = () => {
    const amount = Number(cashout.amount);
    if (cashout.amount === '' || isNaN(amount) || amount <= 0) return toast.error('Enter a cashout amount');
    if (!sessionId) return toast.error('Session not found. Refresh the page and try again');
    addCashoutMut.mutate({
      session_id: sessionId,
      amount,
      category: cashout.category,
      vendor: cashout.vendor.trim(),
      description: cashout.description.trim(),
    });
  };

  const handleReportIssue = () => {
    if (!issTitle.trim()) return toast.error('Title required');
    const payload = { title: issTitle, description: issDesc, priority: issPri };
    const onSuccess = () => { setIssTitle(''); setIssDesc(''); };

    // Dynamically choose which API endpoint to hit based on the user's role!
    if (isAdmin) {
      createAdminIssMut.mutate(payload, { onSuccess });
    } else if (isKitchen) {
      createKitchenIssMut.mutate(payload, { onSuccess });
    } else {
      createStaffIssMut.mutate(payload, { onSuccess });
    }
  };

  const handleAssign = (issueId: number) => {
    const key = String(issueId);
    const staffId = Number(assignTo[key]);
    if (!staffId) return toast.error('Select a staff member');

    assignIssMut.mutate({ issue_id: issueId, staff_id: staffId }, {
      onSuccess: (res: any) => {
        // Backend returns HTTP 200 with success:false for "Issue not found" / "Staff not found"
        if (res?.success === false) {
          toast.error(res.message || 'Could not assign issue');
          return;
        }
        setAssignTo(prev => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
      },
    });
  };

  // --- Visibility Flags ---
  const showCash = mode === 'counter' || mode === 'admin';
  const showIssuesReport = mode === 'staff' || mode === 'kitchen' || mode === 'counter';
  const showIssuesManage = mode === 'admin' || mode === 'counter';
  const showStockRequestForm = mode === 'kitchen';
  const showStockRequestManage = mode === 'counter' || mode === 'admin';

  const isLoading = isAdmin
    ? (loadingAdminSummary || loadingAdminIssues || loadingAdminStock)
    : isKitchen
      ? loadingKitchenData
      : loadingStaffData;
  const isReportingIssue = createAdminIssMut.isPending || createStaffIssMut.isPending || createKitchenIssMut.isPending;

  if (isLoading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">

      {/* 1. COUNTER SESSION */}
      {showCash && (
        <section className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Banknote className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Counter Cash Session</h3>
            <Badge variant={activeSession ? 'default' : 'outline'}>{activeSession ? 'Open' : 'Closed'}</Badge>
          </div>

          {!activeSession ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
              <div>
                <Label>Opening cash (₹)</Label>
                <Input type="number" value={openAmt} onChange={e => setOpenAmt(e.target.value)} placeholder="e.g. 2000" />
              </div>
              <div className="md:col-span-2">
                <Button onClick={handleOpen} disabled={openMut.isPending} className="w-full md:w-auto">
                  {openMut.isPending ? 'Opening...' : 'Open Counter'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* who opened, when, with how much */}
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <Stat label="Opened by" value={openedBy ?? '-'} />
                <Stat label="Opened at" value={fmtDateTime(openedAt)} />
                <Stat label="Opening cash" value={openingCashValue !== undefined ? rupee(openingCashValue) : '-'} />
                <Stat label="Expected cash" value={expected !== undefined ? rupee(expected) : '-'} />
              </div>

              {/* record cashout */}
              <div className="rounded-xl border border-border/50 p-4 space-y-3">
                <div className="font-medium">Record Cashout (store purchase / expense)</div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <Label>Amount (₹)</Label>
                    <Input type="number" min={0} value={cashout.amount}
                      onChange={e => setCashout(c => ({ ...c, amount: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Category</Label>
                    <Select value={cashout.category} onValueChange={v => setCashout(c => ({ ...c, category: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CASHOUT_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Vendor</Label>
                    <Input placeholder="optional" value={cashout.vendor}
                      onChange={e => setCashout(c => ({ ...c, vendor: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Input placeholder="e.g. Milk supplier weekly" value={cashout.description}
                      onChange={e => setCashout(c => ({ ...c, description: e.target.value }))} />
                  </div>
                </div>
                <Button onClick={handleAddCashout} disabled={addCashoutMut.isPending}>
                  <Plus className="h-4 w-4 mr-1" />{addCashoutMut.isPending ? 'Adding...' : 'Add Cashout'}
                </Button>

                {cashouts.length > 0 && (
                  <div className="divide-y rounded-xl border">
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
              <div className="rounded-xl border border-border/50 p-4 space-y-3">
                <div className="font-medium">Close Counter</div>
                <p className="text-sm text-muted-foreground">
                  Expected in cash drawer:{' '}
                  <span className="font-semibold text-foreground">{expected !== undefined ? rupee(expected) : '-'}</span>
                </p>
                <div className="flex gap-3 items-end">
                  <div className="flex-1">
                    <Label>Counted cash (₹)</Label>
                    <Input type="number" value={closeAmt} onChange={e => setCloseAmt(e.target.value)} />
                  </div>
                  <Button variant="destructive" disabled={closeMut.isPending} onClick={handleClose}>
                    {closeMut.isPending ? 'Closing...' : 'Close Counter'}
                  </Button>
                </div>
                {diff !== null && (
                  <p className={`text-xs font-medium ${diff === 0 ? 'text-emerald-600' : diff < 0 ? 'text-red-600' : 'text-amber-600'}`}>
                    {diff === 0 ? 'Cash matches the expected amount' : diff < 0 ? `Short by ${rupee(Math.abs(diff))}` : `Over by ${rupee(diff)}`}
                  </p>
                )}
              </div>
            </div>
          )}
        </section>
      )}

      {/* 2. STORE ISSUES */}
      {(showIssuesReport || showIssuesManage) && (
        <section className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Store Issues</h3>
            <Badge variant="outline">{issues.filter((i: any) => i.status !== 'resolved' && i.status !== 'closed').length} active</Badge>
          </div>

          {showIssuesReport && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
              <div className="md:col-span-1"><Label>Title</Label><Input value={issTitle} onChange={e => setIssTitle(e.target.value)} /></div>
              <div className="md:col-span-2"><Label>Description</Label><Input value={issDesc} onChange={e => setIssDesc(e.target.value)} /></div>
              <div>
                <Label>Priority</Label>
                <Select value={issPri} onValueChange={setIssPri}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleReportIssue} disabled={isReportingIssue} className="md:col-span-4 md:w-auto"><Plus className="h-4 w-4 mr-1" />Report Issue</Button>
            </div>
          )}

          <div className="space-y-2">
            {issues.length === 0 && <div className="text-sm text-muted-foreground">No issues reported.</div>}
            {issues.map((i: any) => {
              // Admin list returns `id`; kitchen/staff dashboards may return `issue_id`
              const issueId: number = i.id ?? i.issue_id;
              const key = String(issueId);
              return (
                <div key={key} className="rounded-xl border border-border p-3 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{i.title} <Badge variant="secondary">{i.priority}</Badge></div>
                      <div className="text-xs text-muted-foreground">{i.issue_code || i.issue_id} • Reported by {i.reported_by || 'System'}</div>
                      <div className="text-sm mt-1">{i.description}</div>
                      {i.assigned_to && <div className="text-xs mt-1 font-medium text-primary">Assigned to: {i.assigned_to}</div>}
                    </div>
                    <Badge variant={i.status === 'resolved' ? 'outline' : 'default'}>{i.status}</Badge>
                  </div>

                  {showIssuesManage && i.status !== 'resolved' && i.status !== 'closed' && (
                    <div className="flex flex-wrap gap-2 items-end pt-2">
                      {i.status === 'open' && (
                        <>
                          <div>
                            <Label className="text-xs">Assign to</Label>
                            <StaffSelect
                              value={assignTo[key] ?? ''}
                              onChange={v => setAssignTo(prev => ({ ...prev, [key]: v }))}
                            />
                          </div>
                          <Button
                            size="sm"
                            disabled={!assignTo[key] || assignIssMut.isPending}
                            onClick={() => handleAssign(issueId)}
                          >
                            {assignIssMut.isPending ? 'Assigning...' : 'Assign'}
                          </Button>
                        </>
                      )}
                     {(i.status === 'assigned' || i.status === 'in_progress') && (
  <p className="text-xs text-muted-foreground pb-1">
    {i.status === 'assigned' ? 'Waiting for staff to start' : 'Staff is working on it'}
  </p>
)}
{i.status === 'finished' && (
  <Button size="sm" onClick={() => statusIssMut.mutate({ issue_id: issueId, status: 'resolved' })}>
    <Check className="h-4 w-4 mr-1" />Mark Resolved
  </Button>
)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 3. STOCK REQUESTS */}
      {(showStockRequestForm || showStockRequestManage) && (
        <section className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center gap-2">
            <PackagePlus className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Stock Requests</h3>
            <Badge variant="outline">{requests.filter((r: any) => r.status === 'pending').length} pending</Badge>
          </div>

          {showStockRequestForm && <StockRequestForm menuItems={kitchenMenuItems} />}

          <div className="space-y-2">
            {requests.length === 0 && <div className="text-sm text-muted-foreground">No requests found.</div>}
            {requests.map((r: any) => (
              <div key={r.id} className="rounded-xl border border-border p-3 flex flex-wrap justify-between gap-3 items-center">
                <div>
                  <div className="font-medium">{r.item_name}</div>
                  <div className="text-xs text-muted-foreground">Req by {r.requested_by || 'Staff'} on {r.requested_at}</div>
                  <div className="text-sm">Qty: <span className="font-semibold">{r.requested_quantity}</span></div>
                </div>
                <div className="flex gap-2 items-center">
                  <Badge variant={r.status === 'approved' ? 'default' : r.status === 'rejected' ? 'destructive' : 'outline'}>{r.status}</Badge>
                  {showStockRequestManage && r.status === 'pending' && (
                    <>
                      <Button size="sm" onClick={() => { approveStockMut.mutate({ request_id: r.id }, { onSuccess: () => toast.success("Approved") }) }}><Check className="h-4 w-4" /></Button>
                      <Button size="sm" variant="destructive" onClick={() => { rejectStockMut.mutate({ request_id: r.id, reason: 'Declined by admin' }, { onSuccess: () => toast.error("Rejected") }) }}><XIcon className="h-4 w-4" /></Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default OpsPanel;