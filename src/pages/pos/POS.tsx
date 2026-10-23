// import { useState, useMemo } from 'react';
// import { ArrowLeft, Search } from 'lucide-react';
// import { useNavigate } from 'react-router-dom';
// import LiveClock from '@/components/LiveClock';
// import { Input } from '@/components/ui/input';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// import { Button } from '@/components/ui/button';
// import { toast } from 'sonner';
// import ReservationsTab from './components/ReservationsTab';
// import type { PayMethod } from '@/AllApis/AllApi';
// import OperationsTab from '@/pages/pos/components/OperationsTab';


// import {
//   useCounterNewOrderDashboard,
//   useCounterCart,
//   useAddToCounterCart,
//   useUpdateCounterCartQuantity,
//   useDeleteCounterCartItem,
//   useClearCounterCart,
//   useCreateCounterOrder,
//   useConfirmCounterOrder,
//   useMarkPaid,
// } from '@/tanstack/alltanstack';
// import { useAuthStore } from '@/lib/auth-store';

// import POSCart from './components/POSCart';
// import CheckoutModal from './components/CheckoutModal';
// import ReceiptModal from './components/ReceiptModal';

// const TAX_RATE = 0.05; // backend tax_percentage = 5

// interface NewOrderTable {
//   table_no: string;
//   status?: string;
// }
// interface NewOrderMenuItem {
//   item_id: number;
//   item_name: string;
//   price: number;
//   stock?: number;
//   type?: string | null;
//   category?: string | null;
//   category_type?: string | null;
//   is_available?: boolean;
// }

// export default function POS() {
//   const navigate = useNavigate();
//   const user = useAuthStore((s) => s.user);

//   const { data: dashboard, isLoading } = useCounterNewOrderDashboard();
//   const tables: NewOrderTable[] = dashboard?.tables ?? [];
//   const menuItems: NewOrderMenuItem[] = dashboard?.menu_items ?? [];

//   const [tableNo, setTableNo] = useState<string | null>(null);
//   const [search, setSearch] = useState('');
//   const [activeCategory, setActiveCategory] = useState('All');

//   const { data: cartData } = useCounterCart(tableNo);
//   const cartItems = cartData?.current_order?.items ?? [];

//   const addToCart = useAddToCounterCart();
//   const updateQty = useUpdateCounterCartQuantity();
//   const deleteItem = useDeleteCounterCartItem();
//   const clearCart = useClearCounterCart();
//   const createOrder = useCreateCounterOrder();
//   const confirmOrder = useConfirmCounterOrder();
//   const markPaid = useMarkPaid();

//   const allCategories = useMemo(() => {
//     const cats = new Set(menuItems.map((i) => i.category).filter(Boolean) as string[]);
//     return ['All', ...Array.from(cats)];
//   }, [menuItems]);

//   const filteredItems = useMemo(() => {
//     let items = activeCategory === 'All' ? menuItems : menuItems.filter((i) => i.category === activeCategory);
//     if (search) items = items.filter((i) => i.item_name?.toLowerCase().includes(search.toLowerCase()));
//     return items;
//   }, [activeCategory, menuItems, search]);

//   // ---- Order confirm -> Payment flow ----
//   const [confirmedOrder, setConfirmedOrder] = useState<{ order_id: string; table_no: string; total_amount: number } | null>(null);
//   const [payMethod, setPayMethod] = useState<PayMethod | null>(null);
//   const [receiptBill, setReceiptBill] = useState<any>(null);

//   const handleAddItem = (item: NewOrderMenuItem) => {
//     if (!tableNo) {
//       toast.error('Select a table first');
//       return;
//     }
//     addToCart.mutate({ table_no: tableNo, item_id: item.item_id, quantity: 1 });
//   };

// const handleCreateOrder = () => {
//   const staffId = Number(user?.id);
//   if (!tableNo || cartItems.length === 0) return;
//   if (!staffId) {
//     toast.error('Staff id not found, please login again');
//     return;
//   }  
//   createOrder.mutate(
//     { table_no: tableNo, staff_id: staffId },
//     {
//       onSuccess: (summary: any) => {
//         // Step 2: actually create the Order + OrderItems
//         confirmOrder.mutate(
//           {
//             table_no: tableNo,
//             items_count: summary.items_count,
//             subtotal: summary.subtotal,
//             tax: summary.tax,
//             grand_total: summary.grand_total,
//           },
//           {
//             onSuccess: (res: any) => {
//               setConfirmedOrder({
//                 order_id: res.order_id,
//                 table_no: tableNo,
//                 total_amount: res.grand_total,
//               });
//             },
//           }
//         );
//       },
//     }
//   );
// };  

//   const handleConfirmPayment = () => {
//     if (!confirmedOrder || !payMethod) return;
//     markPaid.mutate(
//       { order_id: confirmedOrder.order_id, payment_method: payMethod },
//       {
//         onSuccess: (res: any) => {
//           if (res?.success === false) return; // toast already shown by the hook
//           setPayMethod(null);
//           setConfirmedOrder(null);
//           if (res?.bill_details) setReceiptBill(res.bill_details);
//         },
//       }
//     );
//   };

//   if (isLoading) {
//     return <div className="flex h-screen items-center justify-center text-muted-foreground">Loading POS…</div>;
//   }

//   return (
//     <div className="flex h-screen bg-background font-body overflow-hidden">
//       <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
//         <header className="h-16 px-6 border-b border-border flex items-center justify-between bg-card shrink-0">
//           <div className="flex items-center gap-4">
//             <Button variant="ghost" size="icon" onClick={() => navigate('/staff')} className="text-muted-foreground hover:text-foreground">
//               <ArrowLeft className="h-5 w-5" />
//             </Button>
//             <div>
//               <h1 className="font-heading font-bold text-lg">POS</h1>
//               <p className="text-xs text-muted-foreground"><LiveClock /></p>
//             </div>
//           </div>
//           <div className="flex items-center gap-3">
//             <span className="text-sm font-medium text-muted-foreground">Table:</span>
//             <Select value={tableNo ?? ''} onValueChange={setTableNo}>
//               <SelectTrigger className="w-32 h-9 rounded-xl font-bold border-primary text-primary bg-primary/5">
//                 <SelectValue placeholder="Select table" />
//               </SelectTrigger>
//               <SelectContent>
//                 {tables.map((t) => (
//                   <SelectItem key={t.table_no} value={t.table_no}>
//                     {t.table_no} {t.status ? `(${t.status})` : ''}
//                   </SelectItem>
//                 ))}
//               </SelectContent>
//             </Select>
//           </div>
//         </header>

//         <div className="px-6 py-4 border-b border-border bg-muted/10 shrink-0 space-y-4">
//           <div className="relative">
//             <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//             <Input placeholder="Search menu items..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-10 rounded-xl bg-background border-border" />
//           </div>
//           <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
//             {allCategories.map((cat) => (
//               <button
//                 key={cat}
//                 onClick={() => setActiveCategory(cat)}
//                 className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
//                   activeCategory === cat ? 'bg-primary text-primary-foreground cafe-shadow' : 'bg-card border border-border text-muted-foreground hover:text-foreground'
//                 }`}
//               >
//                 {cat}
//               </button>
//             ))}
//           </div>
//         </div>

//         <main className="flex-1 overflow-y-auto p-6 bg-muted/5">
//           <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
//             {filteredItems.map((item) => (
//               <button
//                 key={item.item_id}
//                 disabled={item.is_available === false}
//                 onClick={() => handleAddItem(item)}
//                 className={`text-left flex flex-col p-3 rounded-2xl border transition-all h-32 relative overflow-hidden group ${
//                   item.is_available === false
//                     ? 'bg-muted/50 border-border opacity-50 cursor-not-allowed'
//                     : 'bg-card border-border hover:border-primary/50 cafe-shadow hover:cafe-shadow-lg'
//                 }`}
//               >
//                 <h3 className="font-semibold text-sm leading-tight line-clamp-2">{item.item_name}</h3>
//                 <span className="font-bold text-primary mt-auto">₹{item.price}</span>
//                 {item.stock !== undefined && item.stock !== -1 && (
//                   <span className="text-[10px] text-muted-foreground">{item.stock} left</span>
//                 )}
//               </button>
//             ))}
//           </div>
//           {filteredItems.length === 0 && <div className="flex h-full items-center justify-center text-muted-foreground">No items found.</div>}
//         </main>
//       </div>

//       <POSCart
//         tableNo={tableNo}
//         items={cartItems}
//         taxRate={TAX_RATE}
//         busy={updateQty.isPending || deleteItem.isPending}
//         creating={createOrder.isPending || confirmOrder.isPending}
//         onInc={(itemId) => tableNo && updateQty.mutate({ table_no: tableNo, item_id: itemId, action: 'increment' })}
//         onDec={(itemId) => tableNo && updateQty.mutate({ table_no: tableNo, item_id: itemId, action: 'decrement' })}
//         onRemove={(itemId) => tableNo && deleteItem.mutate({ table_no: tableNo, item_id: itemId })}
//         onClear={() => tableNo && clearCart.mutate({ table_no: tableNo })}
//         onCreateOrder={handleCreateOrder}
//       />

//       {/* Order confirmed -> pick payment method */}
//       {confirmedOrder && !payMethod && (
//         <div className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-40 flex items-center justify-center">
//           <div className="bg-background rounded-2xl border border-border p-6 w-full max-w-sm">
//             <h3 className="font-heading font-bold text-lg mb-1">Order {confirmedOrder.order_id} created</h3>
//             <p className="text-sm text-muted-foreground mb-4">Total: ₹{confirmedOrder.total_amount.toFixed(0)}</p>
//             <div className="grid grid-cols-3 gap-2">
//               {(['cash', 'card', 'upi'] as PayMethod[]).map((m) => (
//                 <Button key={m} variant="outline" className="rounded-xl uppercase" onClick={() => setPayMethod(m)}>
//                   {m}
//                 </Button>
//               ))}
//             </div>
//             <Button variant="ghost" className="w-full mt-3 text-muted-foreground" onClick={() => setConfirmedOrder(null)}>
//               Pay later
//             </Button>
//           </div>
//         </div>
//       )}

//       <CheckoutModal
//         show={!!payMethod}
//         order={confirmedOrder}
//         method={payMethod ?? 'cash'}
//         pending={markPaid.isPending}
//         onClose={() => setPayMethod(null)}
//         onConfirm={handleConfirmPayment}
//       />

//       <ReceiptModal show={!!receiptBill} bill={receiptBill} onClose={() => setReceiptBill(null)} />
//     </div>
//   );
// }