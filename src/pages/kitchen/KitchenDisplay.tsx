// import { useState, useEffect, useMemo, Component, type ReactNode } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { motion, AnimatePresence } from 'framer-motion';
// import { Clock, CheckCircle2, ChefHat, Timer, LogOut, AlertTriangle, Flame, Utensils, X } from 'lucide-react';
// import { Button } from '@/components/ui/button';
// import { Badge } from '@/components/ui/badge';
// import { Textarea } from '@/components/ui/textarea';
// import { Label } from '@/components/ui/label';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// import { useAuth } from '@/lib/auth-context'; // zustand removed: auth now comes from AuthContext
// import { toast } from 'sonner';
// import OpsPanel from '@/pages/admin/tabs/OpsPanel';
// import {
//   useKitchenPastOrders,
//   useStartCooking,
//   useMarkReady,
//   useReportKitchenIssue,
//   useResumeOrder,
//   useGoBackOrder,
//   useBackToPreparing,
//   useKitchenActiveOrders, // <-- POST /kitchen/kitchen_dashboard/dashboard_filter as a useQuery
// } from '@/tanstack/alltanstack';

// type DietFilter = 'all' | 'veg' | 'nonveg';
// type TypeFilter = 'all' | 'food' | 'drink';
// type StatusFilter = 'all' | 'pending' | 'preparing' | 'ready' | 'issue';

// // ---- Order shape used by the UI below ----
// interface OrderItem {
//   id: string | number;
//   name: string;
//   quantity: number;
//   notes?: string;
//   vegetarian?: boolean;
//   type?: 'food' | 'drink';
// }

// interface Order {
//   id: string;
//   tableNumber: number | string;
//   status: 'pending' | 'preparing' | 'ready' | 'issue' | 'served' | 'paid';
//   items: OrderItem[];
//   minutesAgo: number;
//   grandTotal: number;
//   issueNote?: string;
//   createdAt: string | Date; // kept for Past Orders (different endpoint/shape)
// }

// /**
//  * Maps a raw order from POST /kitchen_dashboard/dashboard_filter into the
//  * shape this component's UI expects.
//  *
//  * Backend order shape (see dashboard_filter route):
//  *   { order_id, table_no, items: [{item_name, quantity, type, category_type,
//  *     special_instruction}], time_elapsed: "5 mins ago", status, has_issue,
//  *     issue_details?, message? }
//  *
//  * - "type" on an item is the veg/nonveg category (MenuItems.item_category)
//  * - "category_type" on an item is food/drink (MenuItems.item_type)
//  * - backend order.status values are "todo" | "preparing" | "ready"
//  *   (has_issue is a separate boolean, not a status value)
//  */
// function normalizeFilteredOrder(raw: any): Order {
//   const minutesMatch = /(\d+)/.exec(raw.time_elapsed ?? '');
//   const minutesAgo = minutesMatch ? parseInt(minutesMatch[1], 10) : 0;

//   const rawStatus: string = raw.status ?? 'todo';
//   const uiStatus: Order['status'] = raw.has_issue
//     ? 'issue'
//     : rawStatus === 'todo'
//       ? 'pending'
//       : (rawStatus as Order['status']);

//   return {
//     id: String(raw.order_id),
//     tableNumber: raw.table_no ?? '-',
//     status: uiStatus,
//     items: (raw.items ?? []).map((i: any, idx: number) => ({
//       id: `${raw.order_id}-${idx}`,
//       name: i.item_name,
//       quantity: i.quantity,
//       notes: i.special_instruction,
//       vegetarian: i.type === 'veg',
//       type: i.category_type === 'drink' ? 'drink' : 'food',
//     })),
//     minutesAgo,
//     grandTotal: 0, // not returned by this endpoint
//     issueNote: raw.issue_details,
//     createdAt: new Date(Date.now() - minutesAgo * 60000),
//   };
// }

// /** Past orders still come from the separate useKitchenPastOrders() endpoint,
//  * whose shape is unchanged, so it keeps the original normalizer. */
// function normalizePastOrder(raw: any): Order {
//   const rawItems: any[] = Array.isArray(raw.items)
//     ? raw.items
//     : raw.items && typeof raw.items === 'object'
//       ? Object.values(raw.items)
//       : [];

//   const createdAt = raw.createdAt ?? raw.created_at ?? raw.order_time ?? new Date().toISOString();

//   return {
//     id: String(raw.id ?? raw.order_id ?? raw._id),
//     tableNumber: raw.tableNumber ?? raw.table_number ?? raw.table_no ?? raw.table ?? '-',
//     status: raw.status,
//     items: rawItems.map((i: any) => ({
//       id: i.id ?? i.item_id ?? i.name,
//       name: i.name ?? i.item_name,
//       quantity: i.quantity ?? i.qty ?? 1,
//       notes: i.notes ?? i.note,
//       vegetarian: i.vegetarian ?? i.is_vegitarian ?? i.is_vegetarian,
//       type: i.type,
//     })),
//     minutesAgo: Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000),
//     grandTotal: Number(raw.grandTotal ?? raw.grand_total ?? raw.total ?? 0) || 0,
//     issueNote: raw.issueNote ?? raw.issue_note,
//     createdAt,
//   };
// }

// function extractPastOrdersArray(payload: any): any[] {
//   if (!payload) return [];
//   if (Array.isArray(payload)) return payload;
//   if (Array.isArray(payload.orders)) return payload.orders;
//   if (Array.isArray(payload.data)) return payload.data;
//   return [];
// }

// // Catches render crashes (e.g. a field that isn't the type we expected from
// // the backend) and shows a readable error instead of a blank white screen.
// // Check the browser console for the full stack trace when this shows up.
// class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
//   constructor(props: { children: ReactNode }) {
//     super(props);
//     this.state = { error: null };
//   }
//   static getDerivedStateFromError(error: Error) {
//     return { error };
//   }
//   componentDidCatch(error: Error, info: any) {
//     console.error('Kitchen page crashed:', error, info);
//   }
//   render() {
//     if (this.state.error) {
//       return (
//         <div className="p-6 m-4 rounded-2xl border-2 border-destructive/50 bg-destructive/5 text-destructive">
//           <p className="font-bold mb-1">Something crashed while rendering this view.</p>
//           <p className="text-sm font-mono">{this.state.error.message}</p>
//           <p className="text-xs mt-2 text-muted-foreground">Check the browser console for the full stack trace.</p>
//         </div>
//       );
//     }
//     return this.props.children;
//   }
// }

// // UI filter values -> backend `filters` dict values
// function toBackendStatus(s: StatusFilter): string {
//   if (s === 'pending') return 'todo';
//   return s; // 'all' | 'preparing' | 'ready' | 'issue' match backend as-is
// }
// function toBackendType(d: DietFilter): string {
//   if (d === 'nonveg') return 'non_veg'; // DB enum item_category_enum uses "non_veg", not "nonveg"
//   return d; // 'all' | 'veg'
// }
// function toBackendCategory(t: TypeFilter): string {
//   if (t === 'drink') return 'drinks'; // backend comment: "frontend sends drinks", converts to "drink" itself
//   return t; // 'all' | 'food'
// }

// type ViewType = 'active' | 'past' | 'ops';

// // useState that survives a page refresh (saved in localStorage).
// // `allowed` guards against stale/invalid saved values.
// function usePersistedState<T extends string>(key: string, initial: T, allowed: readonly T[]) {
//   const [value, setValue] = useState<T>(() => {
//     try {
//       const saved = localStorage.getItem(key) as T | null;
//       return saved && allowed.includes(saved) ? saved : initial;
//     } catch {
//       return initial;
//     }
//   });

//   useEffect(() => {
//     try {
//       localStorage.setItem(key, value);
//     } catch {
//       /* storage unavailable, ignore */
//     }
//   }, [key, value]);

//   return [value, setValue] as const;
// }

// const Kitchen = () => {
//   const { logout } = useAuth();
//   const navigate = useNavigate();

//   const [view, setView] = usePersistedState<ViewType>('kitchen:view', 'active', ['active', 'past', 'ops']);
//   const [filter, setFilter] = usePersistedState<StatusFilter>('kitchen:status', 'all', ['all', 'pending', 'preparing', 'ready', 'issue']);
//   const [dietFilter, setDietFilter] = usePersistedState<DietFilter>('kitchen:diet', 'all', ['all', 'veg', 'nonveg']);
//   const [typeFilter, setTypeFilter] = usePersistedState<TypeFilter>('kitchen:type', 'all', ['all', 'food', 'drink']);

//   // ---- Active dashboard: filters are part of the queryKey, so changing a
//   // filter automatically triggers a new request. Polling is handled by
//   // refetchInterval inside the hook. No manual refresh needed.
//   const {
//     data: activeData,
//     isLoading: activeLoading,
//     refetch,
//   } = useKitchenActiveOrders(
//     {
//       status: toBackendStatus(filter),
//       type: toBackendType(dietFilter),
//       category: toBackendCategory(typeFilter),
//     },
//     view === 'active'
//   );

//   const activeOrders: Order[] = useMemo(
//     () => (Array.isArray(activeData?.orders) ? activeData.orders : []).map(normalizeFilteredOrder),
//     [activeData]
//   );

//   // Called after every mutation success so the board updates immediately
//   const refetchActive = () => {
//     void refetch();
//   };

//   const { data: pastData, isLoading: pastLoading } = useKitchenPastOrders(view === 'past');

//   const startCooking = useStartCooking();
//   const markReady = useMarkReady();
//   const reportIssue = useReportKitchenIssue();
//   const resumeOrder = useResumeOrder();
//   const goBack = useGoBackOrder();
//   const backToPreparing = useBackToPreparing();

//   const pastOrders: Order[] = useMemo(
//     () => extractPastOrdersArray(pastData).map(normalizePastOrder),
//     [pastData]
//   );

//   const [currentTime, setCurrentTime] = useState(new Date());
//   const [pastDateFilter, setPastDateFilter] = useState('all');
//   const [pastTimeFilter, setPastTimeFilter] = useState('all');
//   const [pastYearFilter, setPastYearFilter] = useState('all');
//   const [showIssueModal, setShowIssueModal] = useState<string | null>(null);
//   const [issueNote, setIssueNote] = useState('');

//   useEffect(() => {
//     const interval = setInterval(() => setCurrentTime(new Date()), 1000);
//     return () => clearInterval(interval);
//   }, []);

//   // The filter API already applied status/diet/category filters server-side,
//   // so we just bucket the (already-filtered) results by status for the columns.
//   const kitchenOrders = activeOrders.filter(o => o.items.some(i => i.type !== 'drink'));
//   const pendingOrders = kitchenOrders.filter(o => o.status === 'pending');
//   const preparingOrders = kitchenOrders.filter(o => o.status === 'preparing');
//   const readyOrders = kitchenOrders.filter(o => o.status === 'ready');
//   const issueOrdersList = kitchenOrders.filter(o => o.status === 'issue');
//   const allActive = [...pendingOrders, ...preparingOrders, ...readyOrders, ...issueOrdersList];

//   // Date/time filtered past orders (separate endpoint/shape)
//   const availableYears = useMemo(() => [...new Set(pastOrders.map(o => new Date(o.createdAt).getFullYear().toString()))].sort().reverse(), [pastOrders]);
//   const availableDates = useMemo(() => [...new Set(pastOrders.map(o => new Date(o.createdAt).toLocaleDateString()))].sort().reverse(), [pastOrders]);

//   const filteredPastOrders = useMemo(() => {
//     let list = pastOrders;
//     if (dietFilter !== 'all') list = list.filter(o => o.items.some(i => dietFilter === 'veg' ? i.vegetarian : !i.vegetarian));
//     if (typeFilter !== 'all') list = list.filter(o => o.items.some(i => i.type === typeFilter));
//     if (pastYearFilter !== 'all') list = list.filter(o => new Date(o.createdAt).getFullYear().toString() === pastYearFilter);
//     if (pastDateFilter !== 'all') list = list.filter(o => new Date(o.createdAt).toLocaleDateString() === pastDateFilter);
//     if (pastTimeFilter !== 'all') {
//       list = list.filter(o => {
//         const h = new Date(o.createdAt).getHours();
//         if (pastTimeFilter === 'morning') return h >= 6 && h < 12;
//         if (pastTimeFilter === 'afternoon') return h >= 12 && h < 17;
//         if (pastTimeFilter === 'evening') return h >= 17 && h < 21;
//         if (pastTimeFilter === 'night') return h >= 21 || h < 6;
//         return true;
//       });
//     }
//     return list;
//   }, [pastOrders, dietFilter, typeFilter, pastYearFilter, pastDateFilter, pastTimeFilter]);

//   // ---- action handlers hit the real backend, then refetch the board ----
//   const handleStatusChange = (orderId: string, newStatus: 'preparing' | 'ready' | 'issue') => {
//     if (newStatus === 'issue') {
//       setShowIssueModal(orderId);
//       setIssueNote('');
//       return;
//     }
//     if (newStatus === 'preparing') {
//       startCooking.mutate({ order_id: orderId }, { onSuccess: refetchActive });
//     } else if (newStatus === 'ready') {
//       markReady.mutate({ order_id: orderId }, { onSuccess: refetchActive });
//     }
//   };

//   const handleSubmitIssue = () => {
//     if (!showIssueModal) return;
//     if (!issueNote.trim()) { toast.error('Please describe the issue'); return; }
//     reportIssue.mutate(
//       { order_id: showIssueModal, issue_details: issueNote },
//       {
//         onSuccess: () => {
//           refetchActive();
//           setShowIssueModal(null);
//           setIssueNote('');
//         },
//       }
//     );
//   };

//   const handleLogout = () => { logout(); navigate('/login'); };

//   const VegIcon = ({ veg }: { veg?: boolean }) => (
//     <div className={`h-4 w-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${veg ? 'border-success' : 'border-destructive'}`}>
//       <span className={`h-2 w-2 rounded-full ${veg ? 'bg-success' : 'bg-destructive'}`} />
//     </div>
//   );

//   const DietFilterPills = () => (
//     <div className="flex gap-2 flex-wrap">
//       <div className="flex gap-1 bg-muted rounded-xl p-1">
//         {([{ id: 'all' as DietFilter, label: 'All' }, { id: 'veg' as DietFilter, label: '🟢 Veg' }, { id: 'nonveg' as DietFilter, label: '🔴 Non-Veg' }]).map(f => (
//           <button key={f.id} onClick={() => setDietFilter(f.id)}
//             className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${dietFilter === f.id ? 'bg-card text-foreground cafe-shadow' : 'text-muted-foreground'}`}>
//             {f.label}
//           </button>
//         ))}
//       </div>
//       <div className="flex gap-1 bg-muted rounded-xl p-1">
//         {([{ id: 'all' as TypeFilter, label: 'All' }, { id: 'food' as TypeFilter, label: '🍽️ Food' }, { id: 'drink' as TypeFilter, label: '🥤 Drinks' }]).map(f => (
//           <button key={f.id} onClick={() => setTypeFilter(f.id)}
//             className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${typeFilter === f.id ? 'bg-card text-foreground cafe-shadow' : 'text-muted-foreground'}`}>
//             {f.label}
//           </button>
//         ))}
//       </div>
//     </div>
//   );

//   // Only blocks on the very first load. Filter changes keep the previous data
//   // visible (keepPreviousData), so the board never flashes to a loading screen.
//   if (activeLoading && view === 'active') {
//     return (
//       <div className="min-h-screen flex items-center justify-center text-muted-foreground">
//         Loading kitchen orders...
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-background font-body flex flex-col">
//       {/* Header */}
//       <header className="sticky top-0 z-40 px-4 sm:px-6 py-3 sm:py-4 border-b border-border bg-card/95 backdrop-blur-sm flex flex-wrap items-center justify-between gap-3">
//         <div className="flex items-center gap-3 sm:gap-4">
//           <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-gradient-to-br from-success to-success/60 flex items-center justify-center">
//             <ChefHat className="h-5 w-5 sm:h-6 sm:w-6 text-success-foreground" />
//           </div>
//           <div>
//             <h1 className="text-base sm:text-xl font-heading font-bold text-foreground">Kitchen Dashboard</h1>
//             <p className="text-[10px] sm:text-xs text-muted-foreground">CaféFlow • Live Orders</p>
//           </div>
//         </div>
//         <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
//           {/* Active / Past / Ops toggle */}
//           <div className="flex gap-1 bg-muted rounded-xl p-1">
//             <button onClick={() => { setView('active'); setFilter('all'); }}
//               className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${view === 'active' ? 'bg-card text-foreground cafe-shadow' : 'text-muted-foreground'}`}>
//               Active
//             </button>
//             <button onClick={() => setView('past')}
//               className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${view === 'past' ? 'bg-card text-foreground cafe-shadow' : 'text-muted-foreground'}`}>
//               Past Orders
//             </button>
//             <button onClick={() => setView('ops')}
//               className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${view === 'ops' ? 'bg-card text-foreground cafe-shadow' : 'text-muted-foreground'}`}>
//               Ops
//             </button>
//           </div>
//           {/* Veg/Non-veg + Food/Drinks filter -> only relevant for the Active board */}
//           {view === 'active' && <DietFilterPills />}
//           {view === 'active' && (
//             <div className="flex gap-1 bg-muted rounded-xl p-1 overflow-x-auto">
//               {[
//                 { id: 'all' as const, label: 'All', count: allActive.length },
//                 { id: 'pending' as const, label: 'To Do', count: pendingOrders.length },
//                 { id: 'preparing' as const, label: 'Preparing', count: preparingOrders.length },
//                 { id: 'ready' as const, label: 'Ready for Service', count: readyOrders.length },
//                 { id: 'issue' as const, label: 'Issue', count: issueOrdersList.length },
//               ].map(f => (
//                 <button key={f.id} onClick={() => setFilter(f.id as StatusFilter)}
//                   className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${filter === f.id ? 'bg-card text-foreground cafe-shadow' : 'text-muted-foreground hover:text-foreground'}`}>
//                   {f.label} <span className="ml-1 opacity-60">{f.count}</span>
//                 </button>
//               ))}
//             </div>
//           )}
//           <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground bg-muted px-3 py-2 rounded-xl">
//             <Clock className="h-4 w-4" /> {currentTime.toLocaleTimeString()}
//           </div>
//           <Button variant="outline" size="sm" onClick={handleLogout} className="rounded-xl"><LogOut className="h-4 w-4 sm:mr-1" /> <span className="hidden sm:inline">Logout</span></Button>
//         </div>
//       </header>

//       {/* Summary Strip - only meaningful for the Active board */}
//       {view === 'active' && (
//         <div className="px-4 sm:px-6 py-2 sm:py-3 border-b border-border bg-muted/30 flex items-center gap-4 sm:gap-6 overflow-x-auto">
//           <div className="flex items-center gap-2 whitespace-nowrap"><span className="h-3 w-3 rounded-full bg-accent animate-pulse" /><span className="text-xs sm:text-sm font-medium">{pendingOrders.length} To Do</span></div>
//           <div className="flex items-center gap-2 whitespace-nowrap"><span className="h-3 w-3 rounded-full bg-info" /><span className="text-xs sm:text-sm font-medium">{preparingOrders.length} Preparing</span></div>
//           <div className="flex items-center gap-2 whitespace-nowrap"><span className="h-3 w-3 rounded-full bg-success" /><span className="text-xs sm:text-sm font-medium">{readyOrders.length} Ready for Service</span></div>
//           <div className="flex items-center gap-2 whitespace-nowrap"><span className="h-3 w-3 rounded-full bg-destructive" /><span className="text-xs sm:text-sm font-medium">{issueOrdersList.length} Issues</span></div>
//           <span className="text-xs text-muted-foreground ml-auto whitespace-nowrap">Total today: {activeOrders.length} orders</span>
//         </div>
//       )}

//       {/* Content */}
//       <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
//         <ErrorBoundary>
//         {view === 'ops' ? (
//           <div className="max-w-5xl mx-auto"><OpsPanel mode="kitchen" /></div>
//         ) : view === 'active' ? (
//           <>
//             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//               {/* To-Do Column */}
//               <div className="space-y-3">
//                 <div className="flex items-center gap-2 px-1 pb-2 border-b border-border">
//                   <span className="h-3 w-3 rounded-full bg-accent animate-pulse" />
//                   <h3 className="font-heading font-bold text-sm">To Do</h3>
//                   <Badge variant="outline" className="ml-auto text-[10px]">{pendingOrders.length}</Badge>
//                 </div>
//                 {pendingOrders.length === 0 ? (
//                   <div className="text-center py-8 text-muted-foreground/50 text-xs">No orders</div>
//                 ) : pendingOrders.map(order => {
//                   const mins = order.minutesAgo;
//                   const isUrgent = mins > 15;
//                   return (
//                     <motion.div key={order.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
//                       className={`rounded-2xl border-2 border-accent/50 bg-accent/5 bg-card overflow-hidden cafe-shadow ${isUrgent ? 'ring-2 ring-destructive/50' : ''}`}>
//                       <div className="p-4 sm:p-5">
//                         <div className="flex items-center justify-between mb-3">
//                           <div><h3 className="font-heading font-bold text-lg">Table #{order.tableNumber}</h3><p className="text-[10px] text-muted-foreground font-mono">{order.id}</p></div>
//                           <Badge className="bg-accent/10 text-accent gap-1 text-[10px]">To Do</Badge>
//                         </div>
//                         <div className={`flex items-center gap-2 text-xs mb-4 px-2 py-1.5 rounded-lg ${isUrgent ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground'}`}>
//                           <Timer className="h-3 w-3" /><span className="font-medium">{mins} min{mins !== 1 ? 's' : ''} ago</span>{isUrgent && <span className="ml-auto font-bold">⚠️ URGENT</span>}
//                         </div>
//                         <div className="space-y-2 mb-5">
//                           {order.items.filter(i => i.type !== 'drink').map(item => (
//                             <div key={item.id} className="flex items-start gap-2 p-2 rounded-lg bg-background/50">
//                               <VegIcon veg={item.vegetarian} />
//                               <div className="flex-1 min-w-0"><div className="flex items-center justify-between"><span className="text-xs font-medium text-foreground">{item.name}</span><Badge variant="outline" className="text-[10px] ml-2">×{item.quantity}</Badge></div>{item.notes && <p className="text-[10px] text-accent italic mt-0.5">📝 {item.notes}</p>}</div>
//                             </div>
//                           ))}
//                         </div>
//                         <div className="flex gap-2">
//                           <Button className="flex-1 rounded-xl bg-gradient-to-r from-accent to-accent/80 text-accent-foreground" disabled={startCooking.isPending} onClick={() => handleStatusChange(order.id, 'preparing')}>Start Cooking</Button>
//                           <Button variant="outline" size="sm" className="rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10" onClick={() => handleStatusChange(order.id, 'issue')}><AlertTriangle className="h-3 w-3 mr-1" /> Issue</Button>
//                         </div>
//                       </div>
//                     </motion.div>
//                   );
//                 })}
//               </div>

//               {/* Preparing Column */}
//               <div className="space-y-3">
//                 <div className="flex items-center gap-2 px-1 pb-2 border-b border-border">
//                   <span className="h-3 w-3 rounded-full bg-info" />
//                   <h3 className="font-heading font-bold text-sm">Preparing</h3>
//                   <Badge variant="outline" className="ml-auto text-[10px]">{preparingOrders.length + issueOrdersList.length}</Badge>
//                 </div>
//                 {[...preparingOrders, ...issueOrdersList].length === 0 ? (
//                   <div className="text-center py-8 text-muted-foreground/50 text-xs">No orders</div>
//                 ) : [...preparingOrders, ...issueOrdersList].map(order => {
//                   const mins = order.minutesAgo;
//                   const isIssue = order.status === 'issue';
//                   return (
//                     <motion.div key={order.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
//                       className={`rounded-2xl border-2 ${isIssue ? 'border-destructive/50 bg-destructive/5' : 'border-info/50 bg-info/5'} bg-card overflow-hidden cafe-shadow`}>
//                       <div className="p-4 sm:p-5">
//                         <div className="flex items-center justify-between mb-3">
//                           <div><h3 className="font-heading font-bold text-lg">Table #{order.tableNumber}</h3><p className="text-[10px] text-muted-foreground font-mono">{order.id}</p></div>
//                           <Badge className={`gap-1 text-[10px] ${isIssue ? 'bg-destructive/10 text-destructive' : 'bg-info/10 text-info'}`}>{isIssue ? '⚠️ Issue' : 'Preparing'}</Badge>
//                         </div>
//                         <div className="flex items-center gap-2 text-xs mb-4 px-2 py-1.5 rounded-lg bg-muted text-muted-foreground">
//                           <Timer className="h-3 w-3" /><span className="font-medium">{mins} min{mins !== 1 ? 's' : ''} ago</span>
//                         </div>
//                         <div className="space-y-2 mb-5">
//                           {order.items.filter(i => i.type !== 'drink').map(item => (
//                             <div key={item.id} className="flex items-start gap-2 p-2 rounded-lg bg-background/50">
//                               <VegIcon veg={item.vegetarian} />
//                               <div className="flex-1 min-w-0"><div className="flex items-center justify-between"><span className="text-xs font-medium text-foreground">{item.name}</span><Badge variant="outline" className="text-[10px] ml-2">×{item.quantity}</Badge></div></div>
//                             </div>
//                           ))}
//                         </div>
//                         {isIssue && order.issueNote && (
//                           <div className="mb-3 p-2 rounded-lg bg-destructive/10 border border-destructive/20">
//                             <p className="text-[10px] font-medium text-destructive">⚠️ Issue: {order.issueNote}</p>
//                           </div>
//                         )}
//                         <div className="flex gap-2">
//                           {isIssue ? (
//                             <Button className="flex-1 rounded-xl bg-gradient-to-r from-accent to-accent/80 text-accent-foreground" disabled={resumeOrder.isPending} onClick={() => resumeOrder.mutate({ order_id: order.id }, { onSuccess: refetchActive })}><Flame className="h-3 w-3 mr-1" /> Resume Cooking</Button>
//                           ) : (
//                             <>
//                               <Button className="flex-1 rounded-xl bg-gradient-to-r from-success to-success/80 text-success-foreground" disabled={markReady.isPending} onClick={() => handleStatusChange(order.id, 'ready')}>Mark Ready</Button>
//                               <Button variant="outline" size="sm" className="rounded-xl border-accent/30 text-accent hover:bg-accent/10" disabled={goBack.isPending} onClick={() => goBack.mutate({ order_id: order.id }, { onSuccess: refetchActive })}>Go Back</Button>
//                               <Button variant="outline" size="sm" className="rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10" onClick={() => handleStatusChange(order.id, 'issue')}><AlertTriangle className="h-3 w-3 mr-1" /> Issue</Button>
//                             </>
//                           )}
//                         </div>
//                       </div>
//                     </motion.div>
//                   );
//                 })}
//               </div>

//               {/* Ready for Service Column */}
//               <div className="space-y-3">
//                 <div className="flex items-center gap-2 px-1 pb-2 border-b border-border">
//                   <span className="h-3 w-3 rounded-full bg-success" />
//                   <h3 className="font-heading font-bold text-sm">Ready for Service</h3>
//                   <Badge variant="outline" className="ml-auto text-[10px]">{readyOrders.length}</Badge>
//                 </div>
//                 {readyOrders.length === 0 ? (
//                   <div className="text-center py-8 text-muted-foreground/50 text-xs">No orders</div>
//                 ) : readyOrders.map(order => (
//                   <motion.div key={order.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
//                     className="rounded-2xl border-2 border-success/50 bg-success/5 bg-card overflow-hidden cafe-shadow">
//                     <div className="p-4 sm:p-5">
//                       <div className="flex items-center justify-between mb-3">
//                         <div><h3 className="font-heading font-bold text-lg">Table #{order.tableNumber}</h3><p className="text-[10px] text-muted-foreground font-mono">{order.id}</p></div>
//                         <Badge className="bg-success/10 text-success gap-1 text-[10px]"><CheckCircle2 className="h-3 w-3" /> Ready</Badge>
//                       </div>
//                       <div className="space-y-2">
//                         {order.items.filter(i => i.type !== 'drink').map(item => (
//                           <div key={item.id} className="flex items-start gap-2 p-2 rounded-lg bg-background/50">
//                             <VegIcon veg={item.vegetarian} />
//                             <div className="flex-1 min-w-0"><div className="flex items-center justify-between"><span className="text-xs font-medium text-foreground">{item.name}</span><Badge variant="outline" className="text-[10px] ml-2">×{item.quantity}</Badge></div></div>
//                           </div>
//                         ))}
//                       </div>
//                       <div className="flex gap-2 mt-3">
//                         <Button variant="outline" size="sm" className="flex-1 rounded-xl border-info/30 text-info hover:bg-info/10" disabled={backToPreparing.isPending} onClick={() => backToPreparing.mutate({ order_id: order.id }, { onSuccess: refetchActive })}>
//                           <Flame className="h-3 w-3 mr-1" /> Back to Preparing
//                         </Button>
//                       </div>
//                       <p className="text-xs text-success font-medium mt-2 text-center">✅ Waiting for counter to serve</p>
//                     </div>
//                   </motion.div>
//                 ))}
//               </div>
//             </div>
//           </>
//         ) : (
//           /* Past Orders Table */
//           <div className="rounded-2xl bg-card border border-border cafe-shadow overflow-hidden">
//             <div className="p-4 sm:p-5 border-b border-border">
//               <div className="flex flex-wrap items-center justify-between gap-3">
//                 <div>
//                   <h3 className="font-heading font-bold text-foreground">Past Orders</h3>
//                   <p className="text-xs text-muted-foreground mt-1">{pastLoading ? 'Loading...' : `${filteredPastOrders.length} completed orders`}</p>
//                 </div>
//                 <div className="flex flex-wrap items-center gap-2">
//                   <Select value={pastTimeFilter} onValueChange={setPastTimeFilter}>
//                     <SelectTrigger className="w-[130px] h-8 rounded-xl text-xs"><SelectValue placeholder="Time" /></SelectTrigger>
//                     <SelectContent>
//                       <SelectItem value="all">All Times</SelectItem>
//                       <SelectItem value="morning">Morning (6-12)</SelectItem>
//                       <SelectItem value="afternoon">Afternoon (12-5)</SelectItem>
//                       <SelectItem value="evening">Evening (5-9)</SelectItem>
//                       <SelectItem value="night">Night (9-6)</SelectItem>
//                     </SelectContent>
//                   </Select>
//                   <Select value={pastDateFilter} onValueChange={setPastDateFilter}>
//                     <SelectTrigger className="w-[140px] h-8 rounded-xl text-xs"><SelectValue placeholder="Date" /></SelectTrigger>
//                     <SelectContent>
//                       <SelectItem value="all">All Dates</SelectItem>
//                       {availableDates.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
//                     </SelectContent>
//                   </Select>
//                   <Select value={pastYearFilter} onValueChange={setPastYearFilter}>
//                     <SelectTrigger className="w-[100px] h-8 rounded-xl text-xs"><SelectValue placeholder="Year" /></SelectTrigger>
//                     <SelectContent>
//                       <SelectItem value="all">All Years</SelectItem>
//                       {availableYears.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
//                     </SelectContent>
//                   </Select>
//                 </div>
//               </div>
//             </div>
//             {filteredPastOrders.length === 0 ? (
//               <div className="text-center py-12 text-muted-foreground"><Utensils className="h-10 w-10 mx-auto mb-2 opacity-20" /><p>No past orders</p></div>
//             ) : (
//               <div className="overflow-x-auto">
//                 <table className="w-full min-w-[600px]">
//                   <thead>
//                     <tr className="border-b border-border text-left">
//                       {['Order ID', 'Table', 'Items', 'Diet', 'Total', 'Status', 'Time'].map(h => (
//                         <th key={h} className="p-3 sm:p-4 text-xs font-semibold text-muted-foreground">{h}</th>
//                       ))}
//                     </tr>
//                   </thead>
//                   <tbody className="divide-y divide-border">
//                     {filteredPastOrders.map(o => (
//                       <tr key={o.id} className="hover:bg-muted/30 transition-colors">
//                         <td className="p-3 sm:p-4 font-mono text-sm font-bold">{o.id}</td>
//                         <td className="p-3 sm:p-4 text-sm"><Badge variant="outline">T-{String(o.tableNumber).padStart(2, '0')}</Badge></td>
//                         <td className="p-3 sm:p-4 text-sm text-muted-foreground truncate max-w-[200px]">{o.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}</td>
//                         <td className="p-3 sm:p-4">
//                           <div className="flex gap-1">
//                             {o.items.some(i => i.vegetarian) && <span className="text-xs">🟢</span>}
//                             {o.items.some(i => !i.vegetarian) && <span className="text-xs">🔴</span>}
//                           </div>
//                         </td>
//                         <td className="p-3 sm:p-4 text-sm font-bold">₹{(Number(o.grandTotal) || 0).toFixed(0)}</td>
//                         <td className="p-3 sm:p-4"><span className={`px-2.5 py-1 rounded-lg text-xs font-medium capitalize ${o.status === 'served' ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'}`}>{o.status}</span></td>
//                         <td className="p-3 sm:p-4 text-sm text-muted-foreground">{new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>
//             )}
//           </div>
//         )}
//         </ErrorBoundary>
//       </main>

//       {/* Issue Modal */}
//       <AnimatePresence>
//         {showIssueModal && (
//           <>
//             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-50" onClick={() => setShowIssueModal(null)} />
//             <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
//               className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-50 m-4 sm:m-0">
//               <div className="bg-background rounded-2xl border border-border p-6 cafe-shadow-lg">
//                 <div className="flex items-center justify-between mb-4">
//                   <h3 className="font-heading font-bold text-lg flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-destructive" /> Report Issue</h3>
//                   <button onClick={() => setShowIssueModal(null)} className="h-8 w-8 rounded-xl bg-muted flex items-center justify-center"><X className="h-4 w-4" /></button>
//                 </div>
//                 <p className="text-sm text-muted-foreground mb-3">Order: <span className="font-mono font-bold">{showIssueModal}</span></p>
//                 <div className="space-y-3">
//                   <div>
//                     <Label className="text-sm">Issue Details</Label>
//                     <Textarea
//                       value={issueNote}
//                       onChange={e => setIssueNote(e.target.value)}
//                       placeholder="Describe the issue (e.g., ingredient missing, equipment problem...)"
//                       className="mt-1 rounded-xl"
//                       rows={3}
//                     />
//                   </div>
//                 </div>
//                 <div className="flex gap-2 mt-4">
//                   <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setShowIssueModal(null)}>Cancel</Button>
//                   <Button className="flex-1 rounded-xl bg-destructive text-destructive-foreground" disabled={reportIssue.isPending} onClick={handleSubmitIssue}>
//                     <AlertTriangle className="h-4 w-4 mr-1" /> Submit Issue
//                   </Button>
//                 </div>
//               </div>
//             </motion.div>
//           </>
//         )}
//       </AnimatePresence>
//     </div>
//   );
// };

// export default Kitchen;