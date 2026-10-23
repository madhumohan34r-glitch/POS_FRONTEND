

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuthStore } from '@/lib/auth-store';
import { useOrderStore } from '@/lib/order-store';
import { toast } from 'sonner';
import { Banknote, Wrench, PackagePlus, Plus, Check, X as XIcon, Loader2 } from 'lucide-react';

// Import our hooks
import { 
  useOpsDashboard, useOpenCounter, useCloseCounter, 
  useStoreIssues, useCreateIssue, useAssignIssue, useUpdateIssueStatus,
  useStockRequests, useCreateStockRequest, useActionStockRequest, 
  useStaffOpsDashboard,
  useReportStoreIssueMutation,          // Staff Issue Mutation
  useReportKitchenStoreIssueMutation,   // Kitchen Issue Mutation
  useSendKitchenStockRequestMutation,   // Kitchen Stock Request Mutation (correct one - do NOT duplicate this)
  useKitchenOpsDashboard                // Kitchen-specific ops dashboard data
} from '@/tanstack/alltanstack';

type Mode = 'counter' | 'kitchen' | 'staff' | 'admin';

interface Props { mode: Mode; }

export const OpsPanel = ({ mode }: Props) => {
  const { user } = useAuthStore();
  const { menuItems } = useOrderStore(); 

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
  const createStockMut = useCreateStockRequest();                     // Admin version -> /admin/operations/stock-requests/create
  const createKitchenStockMut = useSendKitchenStockRequestMutation(); // Kitchen version -> /kitchen/ops_dashboard/send_stock_request
  const approveStockMut = useActionStockRequest('approve');
  const rejectStockMut = useActionStockRequest('reject');

  // --- Extracts & Data Mapping ---
  const activeSession = isAdmin ? adminSummary?.data?.counter_session?.status === 'open' : false;
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

  // --- Local States ---
  const [openAmt, setOpenAmt] = useState('');
  const [closeAmt, setCloseAmt] = useState('');

  const [issTitle, setIssTitle] = useState('');
  const [issDesc, setIssDesc] = useState('');
  const [issPri, setIssPri] = useState('medium');
  const [assignId, setAssignId] = useState<Record<string, string>>({});

  const [srItem, setSrItem] = useState('');
  const [srQty, setSrQty] = useState('');
  const [srReason, setSrReason] = useState('');

  // --- Handlers ---
  const handleOpen = () => {
    const n = parseFloat(openAmt);
    if (!Number.isFinite(n) || n < 0) return toast.error('Enter a valid amount.');
    openMut.mutate({ opening_cash: n }, { onSuccess: () => setOpenAmt('') });
  };

  const handleClose = () => {
    const n = parseFloat(closeAmt);
    if (!Number.isFinite(n) || n < 0) return toast.error('Enter counted cash.');
    closeMut.mutate({ closing_cash: n }, { onSuccess: () => setCloseAmt('') });
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

  const handleStockReq = () => {
    const item = menuItems.find(m => m.id === srItem);
    if (!item) return toast.error('Pick a menu item');
    const qty = parseInt(srQty, 10);
    if (!Number.isFinite(qty)) return toast.error('Enter quantity');

    const onSuccess = () => { setSrReason(''); setSrQty(''); };

    if (isAdmin) {
      // Admin endpoint (/admin/operations/stock-requests/create) still expects item_id/present_quantity
      const adminPayload = { item_id: parseInt(item.id), present_quantity: qty, reason: srReason };
      createStockMut.mutate(adminPayload, { onSuccess });
    } else {
      // Kitchen endpoint expects SendStockRequestSchema: menu_item (name), new_available_qty, reason
      const kitchenPayload = { menu_item: item.name, new_available_qty: qty, reason: srReason };
      createKitchenStockMut.mutate(kitchenPayload, { onSuccess });
    }
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
  const isSendingStockReq = createStockMut.isPending || createKitchenStockMut.isPending;

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
            <div className="rounded-xl border border-border/50 p-4 space-y-3">
              <div className="font-medium">Close Counter</div>
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <Label>Counted cash (₹)</Label>
                  <Input type="number" value={closeAmt} onChange={e => setCloseAmt(e.target.value)} />
                </div>
                <Button variant="destructive" disabled={closeMut.isPending} onClick={handleClose}>
                  {closeMut.isPending ? 'Closing...' : 'Close Counter'}
                </Button>
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
            <Badge variant="outline">{issues.filter((i:any) => i.status !== 'resolved' && i.status !== 'closed').length} active</Badge>
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
            {issues.map((i: any) => (
              <div key={i.issue_id || i.id} className="rounded-xl border border-border p-3 space-y-2">
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
                          <Label className="text-xs">Assign to (Staff ID)</Label>
                          <Input type="number" className="h-8 w-32" value={assignId[i.issue_id || i.id] ?? ''} onChange={e => setAssignId({ ...assignId, [i.issue_id || i.id]: e.target.value })} placeholder="e.g. 1" />
                        </div>
                        <Button size="sm" onClick={() => {
                          const sid = parseInt(assignId[i.issue_id || i.id]);
                          if (!sid) return toast.error('Enter numeric Staff ID');
                          assignIssMut.mutate({ issue_id: i.id || i.issue_id, staff_id: sid });
                        }}>Assign</Button>
                      </>
                    )}
                    {i.status === 'assigned' && <Button size="sm" variant="outline" onClick={() => statusIssMut.mutate({ issue_id: i.id || i.issue_id, status: 'in_progress' })}>Start Work</Button>}
                    {(i.status === 'assigned' || i.status === 'in_progress') && (
                      <Button size="sm" onClick={() => statusIssMut.mutate({ issue_id: i.id || i.issue_id, status: 'resolved' })}><Check className="h-4 w-4 mr-1" />Mark Resolved</Button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 3. STOCK REQUESTS */}
      {(showStockRequestForm || showStockRequestManage) && (
        <section className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center gap-2">
            <PackagePlus className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Stock Requests</h3>
            <Badge variant="outline">{requests.filter((r:any) => r.status === 'pending').length} pending</Badge>
          </div>

          {showStockRequestForm && (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
              <div className="md:col-span-2">
                <Label>Menu Item</Label>
                <Select value={srItem} onValueChange={setSrItem}>
                  <SelectTrigger><SelectValue placeholder="Select Item"/></SelectTrigger>
                  <SelectContent>
                    {menuItems.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Qty</Label><Input type="number" value={srQty} onChange={e => setSrQty(e.target.value)} /></div>
              <div className="md:col-span-2"><Label>Reason</Label><Input value={srReason} onChange={e => setSrReason(e.target.value)} /></div>
              <Button onClick={handleStockReq} disabled={isSendingStockReq} className="md:col-span-5 md:w-auto"><Plus className="h-4 w-4 mr-1" />Send Request</Button>
            </div>
          )}

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

