// import { useState, useMemo, useRef } from 'react';
// import LiveClock from '@/components/LiveClock';
// import { useNavigate } from 'react-router-dom';
// import { motion, AnimatePresence } from 'framer-motion';
// import {
//   LayoutDashboard, UtensilsCrossed, ClipboardList, Users, CreditCard, QrCode, Settings,
//   DollarSign, ShoppingBag, Clock, TrendingUp, Edit2, Trash2, Plus, Eye, Ban,
//   X, Save, Check, CheckCircle2, LogOut, Bell, Search, ArrowUp, ArrowDown,
//   Download, FileText, ChefHat, Printer, Calendar, Filter, Sparkles, BarChart3, PieChart as PieChartIcon, Menu as MenuIcon,
//   Upload, Image, FolderPlus, ShieldPlus, CalendarDays, Users2, MessageSquare, Star,
//   Package, Globe, Building2, ArrowRightLeft, BookOpen, Languages, Warehouse, CheckSquare, Wrench
// } from 'lucide-react';
// import { QRCodeSVG } from 'qrcode.react';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Badge } from '@/components/ui/badge';
// import { Label } from '@/components/ui/label';
// import { Textarea } from '@/components/ui/textarea';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// import { Switch } from '@/components/ui/switch';
// import { Checkbox } from '@/components/ui/checkbox';
// import { categories as defaultCategories } from '@/lib/menu-data';
// import { useOrderStore } from '@/lib/order-store';
// import { useAuthStore } from '@/lib/auth-store';
// import { useCafeStore, type Discount } from '@/lib/cafe-store';
// import { useStockStore } from '@/lib/stock-store';
// import { useReservationStore, type Reservation, type BookingType } from '@/lib/reservation-store';
// import { useOrgStore, daysUntilExpiry } from '@/lib/org-store';
// import { useI18nStore, type Language } from '@/lib/i18n-store';
// import { toast } from 'sonner';
// import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from 'recharts';
// import OpsPanel from '@/pages/admin/tabs/OpsPanel';
// //hii
// type Tab = 'dashboard' | 'orders' | 'menu' | 'staff' | 'payments' | 'tables' | 'settings' | 'staffmgmt' | 'feedback' | 'stock' | 'reservations' | 'organization' | 'translations' | 'ops';

// interface StaffMember {
//   id: string; name: string; role: string; shift: string; status: 'active' | 'inactive';
//   email: string; phone: string;
// }

// interface CustomRole {
//   id: string; name: string; permissions: string[];
// }

// interface TableData {
//   number: number; name: string; capacity: number; status: 'vacant' | 'occupied' | 'reserved';
// }

// interface Notification {
//   id: string; title: string; message: string; time: string; read: boolean; type: 'order' | 'payment' | 'staff' | 'system';
// }

// const defaultStaff: StaffMember[] = [
//   { id: '1', name: 'Priya Sharma', role: 'Counter', shift: 'Morning', email: 'priya@cafe.com', phone: '+91-9876543210', status: 'active' },
//   { id: '2', name: 'Rahul Kumar', role: 'Kitchen', shift: 'Morning', email: 'rahul@cafe.com', phone: '+91-9876543211', status: 'active' },
//   { id: '3', name: 'Anjali Verma', role: 'Admin', shift: 'Full Day', email: 'anjali@cafe.com', phone: '+91-9876543212', status: 'active' },
//   { id: '4', name: 'Vikram Singh', role: 'Kitchen', shift: 'Evening', email: 'vikram@cafe.com', phone: '+91-9876543213', status: 'inactive' },
//   { id: '5', name: 'Sneha Patel', role: 'Counter', shift: 'Evening', email: 'sneha@cafe.com', phone: '+91-9876543214', status: 'active' },
//   { id: '6', name: 'Arjun Reddy', role: 'Counter', shift: 'Morning', email: 'arjun@cafe.com', phone: '+91-9876543215', status: 'active' },
// ];

// const defaultNotifications: Notification[] = [
//   { id: '1', title: 'New Order', message: 'Order #ORD-1042 placed for Table 5', time: '2 min ago', read: false, type: 'order' },
//   { id: '2', title: 'Payment Received', message: '₹1,250 received via UPI for Order #ORD-1041', time: '8 min ago', read: false, type: 'payment' },
//   { id: '3', title: 'Staff Login', message: 'Rahul Kumar clocked in for Morning shift', time: '15 min ago', read: false, type: 'staff' },
//   { id: '4', title: 'Low Stock Alert', message: 'Chocolate Brownie is running low', time: '30 min ago', read: true, type: 'system' },
//   { id: '5', title: 'Order Ready', message: 'Order #ORD-1039 is ready to serve at Table 3', time: '45 min ago', read: true, type: 'order' },
//   { id: '6', title: 'New Order', message: 'Order #ORD-1038 placed for Table 8', time: '1h ago', read: true, type: 'order' },
// ];

// const defaultRoles: CustomRole[] = [
//   { id: '1', name: 'Admin', permissions: ['manage_menu', 'manage_staff', 'view_reports', 'manage_tables', 'manage_settings'] },
//   { id: '2', name: 'Counter', permissions: ['create_orders', 'process_payments', 'view_orders'] },
//   { id: '3', name: 'Kitchen', permissions: ['view_orders', 'update_order_status'] },
//   { id: '4', name: 'Waiter', permissions: ['create_orders', 'view_orders'] },
// ];

// const CHART_COLORS = ['hsl(262, 80%, 55%)', 'hsl(152, 60%, 40%)', 'hsl(210, 80%, 55%)', 'hsl(38, 92%, 50%)', 'hsl(0, 72%, 51%)'];

// const AdminDashboard = () => {
//   const [activeTab, setActiveTab] = useState<Tab>('dashboard');
//   const [sidebarOpen, setSidebarOpen] = useState(false);
//   const [showNotifications, setShowNotifications] = useState(false);
//   const [notifications, setNotifications] = useState<Notification[]>(defaultNotifications);
//   const { orders, menuItems, addMenuItem, updateMenuItem, deleteMenuItem, toggleItemAvailability, toggleTodaysSpecial, bulkAddMenuItems, updateOrderStatus, getOccupiedTables, getAllCategories, addCustomCategory, transferTable, toggleItemServed } = useOrderStore();
//   const { user, logout } = useAuthStore();
//   const { settings, updateSettings, discounts, addDiscount, updateDiscount, deleteDiscount, toggleDiscount, feedbacks, leaveRequests, addLeaveRequest, updateLeaveStatus } = useCafeStore();
//   const { stock, setStock, getStock } = useStockStore();
//   const { reservations, config: resConfig, addReservation, updateReservationStatus, updateConfig: updateResConfig } = useReservationStore();
//   const { merchants } = useOrgStore();
//   const { translations, setTranslation, adminLanguage, setAdminLanguage, supportedLanguages, t } = useI18nStore();
//   const tt = (key: string) => t(key, 'admin');
//   const navigate = useNavigate();
//   const logoInputRef = useRef<HTMLInputElement>(null);
//   const bannerInputRef = useRef<HTMLInputElement>(null);
//   const bulkUploadRef = useRef<HTMLInputElement>(null);

//   // Menu state
//   const [editingItem, setEditingItem] = useState<string | null>(null);
//   const [showAddItem, setShowAddItem] = useState(false);
//   const [showAddCategory, setShowAddCategory] = useState(false);
//   const [newCategoryName, setNewCategoryName] = useState('');
//   const [customCategories_unused] = useState<string[]>([]); // kept for compatibility
//   const [newItem, setNewItem] = useState({ name: '', description: '', price: 0, category: 'Starters', image: '', vegetarian: false, popular: false, type: 'food' as 'food' | 'drink' });
//   const [editForm, setEditForm] = useState({ name: '', description: '', price: 0, category: '', image: '' });
//   const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
//   const [menuSearch, setMenuSearch] = useState('');
//   const [menuCategory, setMenuCategory] = useState('All');
//   const [showBulkUpload, setShowBulkUpload] = useState(false);
//   const [bulkPreview, setBulkPreview] = useState<{ valid: Omit<import('@/lib/menu-data').MenuItem, 'id'>[]; errors: { row: number; field: string; message: string }[] } | null>(null);
//   const [bulkFileName, setBulkFileName] = useState('');

//   // Orders state
//   const [orderFilter, setOrderFilter] = useState('all');
//   const [orderSearch, setOrderSearch] = useState('');
//   const [orderSort, setOrderSort] = useState<'asc' | 'desc'>('desc');
//   const [orderDateRange, setOrderDateRange] = useState('today');
//   const [viewingOrder, setViewingOrder] = useState<string | null>(null);

//   // Staff state
//   const [staff, setStaff] = useState<StaffMember[]>(defaultStaff);
//   const [showAddStaff, setShowAddStaff] = useState(false);
//   const [editingStaff, setEditingStaff] = useState<string | null>(null);
//   const [staffForm, setStaffForm] = useState({ name: '', role: 'Counter', shift: 'Morning', email: '', phone: '', status: 'active' as 'active' | 'inactive' });
//   const [showDeleteStaff, setShowDeleteStaff] = useState<string | null>(null);
//   const [staffSearch, setStaffSearch] = useState('');
//   const [staffRoleFilter, setStaffRoleFilter] = useState('all');
//   const [roles, setRoles] = useState<CustomRole[]>(defaultRoles);
//   const [showAddRole, setShowAddRole] = useState(false);
//   const [newRoleName, setNewRoleName] = useState('');
//   const [newRolePermissions, setNewRolePermissions] = useState<string[]>([]);

//   // Payments state
//   const [paymentDateFilter, setPaymentDateFilter] = useState('all');
//   const [paymentFromDate, setPaymentFromDate] = useState('');
//   const [paymentToDate, setPaymentToDate] = useState('');
//   // Per-chart filters for payments
//   const [payRevenueTrendFilter, setPayRevenueTrendFilter] = useState('6months');
//   const [payDistributionFilter, setPayDistributionFilter] = useState('all');

//   // Tables state
//   const [tablesData, setTablesData] = useState<TableData[]>(
//     Array.from({ length: 12 }, (_, i) => ({ number: i + 1, name: `Table ${i + 1}`, capacity: [2, 4, 4, 6, 2, 4, 8, 4, 2, 6, 4, 8][i], status: 'vacant' as const }))
//   );
//   const [showAddTable, setShowAddTable] = useState(false);
//   const [editingTable, setEditingTable] = useState<number | null>(null);
//   const [tableForm, setTableForm] = useState({ name: '', capacity: 4 });
//   const [viewingTableOrders, setViewingTableOrders] = useState<number | null>(null);

//   // Settings state
//   const [settingsForm, setSettingsForm] = useState({ ...settings, paymentMode: settings.paymentMode || 'both', operationalDays: settings.operationalDays || ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'], cgstRate: settings.cgstRate || 2.5, sgstRate: settings.sgstRate || 2.5, postPaymentDirectToKDS: settings.postPaymentDirectToKDS ?? false, feedbackEnabled: settings.feedbackEnabled ?? false });
//   const [logoPreview, setLogoPreview] = useState(settings.logo);
//   const [bannerPreview, setBannerPreview] = useState(settings.banner);
//   const [viewingQR, setViewingQR] = useState<number | null>(null);
//   const [staffMgmtSearch, setStaffMgmtSearch] = useState('');
//   const [staffMgmtDate, setStaffMgmtDate] = useState('');
//   const [staffMgmtMonthFilter, setStaffMgmtMonthFilter] = useState('');
//   const [showAddDiscount, setShowAddDiscount] = useState(false);
//   const [editingDiscount, setEditingDiscount] = useState<string | null>(null);
//   const [newDiscount, setNewDiscount] = useState<Omit<Discount, 'id'>>({ name: '', type: 'percentage', value: 10, scope: 'global', active: true });

//   // Dashboard per-chart filter states
//   const [dashWeeklySalesFilter, setDashWeeklySalesFilter] = useState('7days');
//   const [dashTopItemsFilter, setDashTopItemsFilter] = useState('all');
//   const [dashRecentOrdersFilter, setDashRecentOrdersFilter] = useState('all');
//   const [dashRevenueFilter, setDashRevenueFilter] = useState('today');
//   const [dashOrdersFilter, setDashOrdersFilter] = useState('today');

//   const allCats = getAllCategories();

//   const unreadCount = notifications.filter(n => !n.read).length;
//   const markAllRead = () => setNotifications(notifications.map(n => ({ ...n, read: true })));
//   const markRead = (id: string) => setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
//   const clearNotifications = () => setNotifications([]);

//   const notifIcon = (type: string) => {
//     switch (type) {
//       case 'order': return <ShoppingBag className="h-4 w-4 text-primary" />;
//       case 'payment': return <CreditCard className="h-4 w-4 text-success" />;
//       case 'staff': return <Users className="h-4 w-4 text-info" />;
//       default: return <Bell className="h-4 w-4 text-accent" />;
//     }
//   };

//   const totalRevenue = orders.reduce((s, o) => s + o.grandTotal, 0);
//   const totalOrders = orders.length;
//   const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
//   const activeStaffCount = staff.filter(s => s.status === 'active').length;
//   const pendingPayments = orders.filter(o => o.status !== 'paid').length;
//   const occupiedTables = getOccupiedTables();

//   const today = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

//   const salesData = [
//     { day: 'Mon', sales: 3500, orders: 28 }, { day: 'Tue', sales: 4200, orders: 34 }, { day: 'Wed', sales: 4800, orders: 39 },
//     { day: 'Thu', sales: 5500, orders: 42 }, { day: 'Fri', sales: 9800, orders: 67 }, { day: 'Sat', sales: 13000, orders: 89 }, { day: 'Sun', sales: 10500, orders: 72 },
//   ];

//   const topItems = useMemo(() => {
//     const itemCounts: Record<string, number> = {};
//     orders.forEach(o => o.items.forEach(i => { itemCounts[i.name] = (itemCounts[i.name] || 0) + i.quantity; }));
//     const sorted = Object.entries(itemCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
//     const total = sorted.reduce((s, [, c]) => s + c, 0);
//     return sorted.map(([name, count]) => ({ name, value: count, pct: total > 0 ? Math.round((count / total) * 100) : 0 }));
//   }, [orders]);

//   const revenueTrends = [
//     { month: 'Jan', revenue: 45000 }, { month: 'Feb', revenue: 52000 }, { month: 'Mar', revenue: 48000 },
//     { month: 'Apr', revenue: 61000 }, { month: 'May', revenue: 55000 }, { month: 'Jun', revenue: 67000 },
//   ];

//   const filteredOrders = useMemo(() => {
//     let result = orders;
//     if (orderFilter !== 'all') result = result.filter(o => o.status === orderFilter);
//     if (orderSearch) result = result.filter(o =>
//       o.id.toLowerCase().includes(orderSearch.toLowerCase()) ||
//       o.items.some(i => i.name.toLowerCase().includes(orderSearch.toLowerCase()))
//     );
//     result = [...result].sort((a, b) => orderSort === 'desc'
//       ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
//       : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
//     );
//     return result;
//   }, [orders, orderFilter, orderSearch, orderSort]);

//   const filteredMenu = useMemo(() => {
//     let result = menuItems;
//     if (menuCategory !== 'All') result = result.filter(i => i.category === menuCategory);
//     if (menuSearch) result = result.filter(i => i.name.toLowerCase().includes(menuSearch.toLowerCase()));
//     return result;
//   }, [menuItems, menuCategory, menuSearch]);

//   const filteredStaff = useMemo(() => {
//     let result = staff;
//     if (staffRoleFilter !== 'all') result = result.filter(s => s.role.toLowerCase() === staffRoleFilter);
//     if (staffSearch) result = result.filter(s => s.name.toLowerCase().includes(staffSearch.toLowerCase()));
//     return result;
//   }, [staff, staffRoleFilter, staffSearch]);

//   const filteredPayments = useMemo(() => {
//     let result = orders;
//     const now = new Date();
//     const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
//     if (paymentDateFilter === 'today') {
//       const todayStart = startOfDay(now);
//       result = result.filter(o => new Date(o.createdAt) >= todayStart);
//     } else if (paymentDateFilter === 'yesterday') {
//       const yesterdayStart = startOfDay(new Date(now.getTime() - 86400000));
//       const todayStart = startOfDay(now);
//       result = result.filter(o => { const d = new Date(o.createdAt); return d >= yesterdayStart && d < todayStart; });
//     } else if (paymentDateFilter === 'lastweek') {
//       const weekAgo = new Date(now.getTime() - 7 * 86400000);
//       result = result.filter(o => new Date(o.createdAt) >= weekAgo);
//     } else if (paymentDateFilter === 'lastmonth') {
//       const monthAgo = new Date(now.getTime() - 30 * 86400000);
//       result = result.filter(o => new Date(o.createdAt) >= monthAgo);
//     } else if (paymentDateFilter === 'custom' && paymentFromDate && paymentToDate) {
//       const from = new Date(paymentFromDate);
//       const to = new Date(paymentToDate + 'T23:59:59');
//       result = result.filter(o => { const d = new Date(o.createdAt); return d >= from && d <= to; });
//     }
//     return result;
//   }, [orders, paymentDateFilter, paymentFromDate, paymentToDate]);

//   const payFilteredRevenue = filteredPayments.reduce((s, o) => s + o.grandTotal, 0);
//   const payFilteredUpi = filteredPayments.filter(o => o.paymentMethod === 'upi').reduce((s, o) => s + o.grandTotal, 0);
//   const payFilteredCash = filteredPayments.filter(o => o.paymentMethod === 'cash').reduce((s, o) => s + o.grandTotal, 0);
//   const payFilteredCard = filteredPayments.filter(o => o.paymentMethod === 'card').reduce((s, o) => s + o.grandTotal, 0);

//   const statusColor = (s: string) => {
//     switch (s) {
//       case 'pending': return 'bg-accent/10 text-accent';
//       case 'preparing': return 'bg-info/10 text-info';
//       case 'ready': return 'bg-success/10 text-success';
//       case 'served': return 'bg-muted text-muted-foreground';
//       case 'paid': return 'bg-primary/10 text-primary';
//       default: return 'bg-secondary text-secondary-foreground';
//     }
//   };

//   const getTimeAgo = (date: Date) => {
//     const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
//     if (mins < 1) return 'Just now';
//     if (mins < 60) return `${mins}m ago`;
//     return `${Math.floor(mins / 60)}h ago`;
//   };

//   const exportData = (format: 'csv' | 'pdf' | 'excel') => {
//     if (format === 'csv') {
//       const header = 'Order ID,Table,Items,Total,Status,Time\n';
//       const rows = filteredOrders.map(o =>
//         `${o.id},T-${String(o.tableNumber).padStart(2, '0')},"${o.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}",₹${o.grandTotal.toFixed(0)},${o.status},${new Date(o.createdAt).toLocaleString()}`
//       ).join('\n');
//       const blob = new Blob([header + rows], { type: 'text/csv' });
//       const url = URL.createObjectURL(blob);
//       const a = document.createElement('a'); a.href = url; a.download = `orders-${Date.now()}.csv`; a.click();
//       URL.revokeObjectURL(url);
//       toast.success('CSV exported!');
//     } else if (format === 'excel') {
//       const header = 'Order ID\tTable\tItems\tTotal\tStatus\tTime\n';
//       const rows = filteredOrders.map(o =>
//         `${o.id}\tT-${String(o.tableNumber).padStart(2, '0')}\t${o.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}\t₹${o.grandTotal.toFixed(0)}\t${o.status}\t${new Date(o.createdAt).toLocaleString()}`
//       ).join('\n');
//       const blob = new Blob([header + rows], { type: 'application/vnd.ms-excel' });
//       const url = URL.createObjectURL(blob);
//       const a = document.createElement('a'); a.href = url; a.download = `orders-${Date.now()}.xls`; a.click();
//       URL.revokeObjectURL(url);
//       toast.success('Excel exported!');
//     } else {
//       toast.success('PDF export initiated — check downloads');
//     }
//   };

//   const handleAddItem = () => {
//     if (!newItem.name || !newItem.price) { toast.error('Name and price required'); return; }
//     addMenuItem({ ...newItem, available: true });
//     setNewItem({ name: '', description: '', price: 0, category: 'Starters', image: '', vegetarian: false, popular: false, type: 'food' });
//     setShowAddItem(false);
//     toast.success('Menu item added!');
//   };

//   const handleAddCategory = () => {
//     if (!newCategoryName.trim()) { toast.error('Category name required'); return; }
//     if (allCats.includes(newCategoryName.trim())) { toast.error('Category already exists'); return; }
//     addCustomCategory(newCategoryName.trim());
//     setNewCategoryName('');
//     setShowAddCategory(false);
//     toast.success('Category added!');
//   };

//   const handleBulkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (!file) return;
//     setBulkFileName(file.name);
//     const reader = new FileReader();
//     reader.onload = (ev) => {
//       const text = ev.target?.result as string;
//       const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
//       if (lines.length < 2) { toast.error('File must have header + data rows'); return; }
//       const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
//       const nameIdx = headers.findIndex(h => h === 'name');
//       const priceIdx = headers.findIndex(h => h === 'price');
//       const catIdx = headers.findIndex(h => h === 'category');
//       const descIdx = headers.findIndex(h => h === 'description' || h === 'desc');
//       const imageIdx = headers.findIndex(h => h === 'image' || h === 'image_url');
//       const vegIdx = headers.findIndex(h => h === 'vegetarian' || h === 'veg');
//       const typeIdx = headers.findIndex(h => h === 'type');
//       const validItems: Omit<import('@/lib/menu-data').MenuItem, 'id'>[] = [];
//       const errors: { row: number; field: string; message: string }[] = [];
//       for (let i = 1; i < lines.length; i++) {
//         const cols = lines[i].split(',').map(c => c.trim().replace(/^['"]|['"]$/g, ''));
//         const name = nameIdx >= 0 ? cols[nameIdx] : '';
//         const price = priceIdx >= 0 ? parseFloat(cols[priceIdx]) : NaN;
//         const category = catIdx >= 0 ? cols[catIdx] : 'Starters';
//         const description = descIdx >= 0 ? cols[descIdx] || '' : '';
//         const image = imageIdx >= 0 ? cols[imageIdx] || '' : '';
//         const vegetarian = vegIdx >= 0 ? ['true', 'yes', '1', 'veg'].includes(cols[vegIdx]?.toLowerCase()) : false;
//         const type = typeIdx >= 0 && ['food', 'drink'].includes(cols[typeIdx]?.toLowerCase()) ? cols[typeIdx].toLowerCase() as 'food' | 'drink' : 'food';
//         if (!name) errors.push({ row: i + 1, field: 'name', message: 'Name is empty' });
//         if (isNaN(price) || price <= 0) errors.push({ row: i + 1, field: 'price', message: `Invalid price: "${cols[priceIdx]}"` });
//         if (category && !allCats.includes(category) && category !== 'All') errors.push({ row: i + 1, field: 'category', message: `Unknown category: "${category}"` });
//         const duplicate = menuItems.find(m => m.name.toLowerCase() === name.toLowerCase());
//         if (duplicate) errors.push({ row: i + 1, field: 'name', message: `Duplicate: "${name}" already exists` });
//         if (name && !isNaN(price) && price > 0) {
//           validItems.push({ name, price, category: category || 'Starters', description, image, available: true, vegetarian, type });
//         }
//       }
//       setBulkPreview({ valid: validItems, errors });
//       setShowBulkUpload(true);
//     };
//     reader.readAsText(file);
//     e.target.value = '';
//   };

//   const confirmBulkUpload = () => {
//     if (!bulkPreview || bulkPreview.valid.length === 0) return;
//     bulkAddMenuItems(bulkPreview.valid);
//     toast.success(`${bulkPreview.valid.length} items added successfully!`);
//     setShowBulkUpload(false);
//     setBulkPreview(null);
//   };

//   const startEditing = (item: typeof menuItems[0]) => {
//     setEditingItem(item.id);
//     setEditForm({ name: item.name, description: item.description, price: item.price, category: item.category, image: item.image });
//   };

//   const saveEdit = (id: string) => { updateMenuItem(id, editForm); setEditingItem(null); toast.success('Item updated!'); };
//   const handleDeleteItem = (id: string) => { deleteMenuItem(id); setShowDeleteConfirm(null); toast.success('Item deleted'); };

//   const handleAddStaff = () => {
//     if (!staffForm.name || !staffForm.email) { toast.error('Name and email required'); return; }
//     setStaff([...staff, { ...staffForm, id: String(Date.now()) }]);
//     setStaffForm({ name: '', role: 'Counter', shift: 'Morning', email: '', phone: '', status: 'active' });
//     setShowAddStaff(false);
//     toast.success('Staff member added!');
//   };
//   const saveStaffEdit = (id: string) => { setStaff(staff.map(s => s.id === id ? { ...s, ...staffForm } : s)); setEditingStaff(null); toast.success('Staff updated!'); };
//   const confirmDeleteStaff = (id: string) => { setStaff(staff.filter(s => s.id !== id)); setShowDeleteStaff(null); toast.success('Staff removed'); };

//   const handleAddRole = () => {
//     if (!newRoleName.trim()) { toast.error('Role name required'); return; }
//     setRoles([...roles, { id: String(Date.now()), name: newRoleName.trim(), permissions: newRolePermissions }]);
//     setNewRoleName('');
//     setNewRolePermissions([]);
//     setShowAddRole(false);
//     toast.success('Role added!');
//   };

//   const handleAddTable = () => {
//     const nextNum = tablesData.length + 1;
//     setTablesData([...tablesData, { number: nextNum, name: tableForm.name || `Table ${nextNum}`, capacity: tableForm.capacity, status: 'vacant' }]);
//     setTableForm({ name: '', capacity: 4 });
//     setShowAddTable(false);
//     toast.success(`Table ${nextNum} added!`);
//   };

//   const handleEditTable = (num: number) => {
//     setTablesData(tablesData.map(t => t.number === num ? { ...t, name: tableForm.name || t.name, capacity: tableForm.capacity } : t));
//     setEditingTable(null);
//     toast.success('Table updated!');
//   };

//   const handleFileUpload = (type: 'logo' | 'banner', e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (!file) return;
//     const reader = new FileReader();
//     reader.onloadend = () => {
//       const url = reader.result as string;
//       if (type === 'logo') { setLogoPreview(url); setSettingsForm({ ...settingsForm, logo: url }); }
//       else { setBannerPreview(url); setSettingsForm({ ...settingsForm, banner: url }); }
//     };
//     reader.readAsDataURL(file);
//   };

//   const handleSaveSettings = () => { updateSettings(settingsForm); toast.success('Settings saved!'); };
//   const handleLogout = () => { logout(); navigate('/login'); };
//   const baseUrl = window.location.origin;
//   const detailOrder = viewingOrder ? orders.find(o => o.id === viewingOrder) : null;

//   const [feedbackSearch, setFeedbackSearch] = useState('');
//   const [feedbackRatingFilter, setFeedbackRatingFilter] = useState('all');

//   const filteredFeedbacks = useMemo(() => {
//     let result = [...feedbacks];
//     if (feedbackRatingFilter !== 'all') result = result.filter(f => f.rating === Number(feedbackRatingFilter));
//     if (feedbackSearch) result = result.filter(f => f.message.toLowerCase().includes(feedbackSearch.toLowerCase()));
//     return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
//   }, [feedbacks, feedbackRatingFilter, feedbackSearch]);

//   // Stock management state
//   const [stockItemId, setStockItemId] = useState('');
//   const [stockQty, setStockQty] = useState(0);
//   // Reservation state
//   const [newRes, setNewRes] = useState<{ type: BookingType; date: string; time: string; duration: number; headcount: number; tableNumber: number; customerName: string; customerPhone: string; description: string; specialRequirements: string }>({ type: 'table', date: '', time: '', duration: 2, headcount: 2, tableNumber: 1, customerName: '', customerPhone: '', description: '', specialRequirements: '' });
//   const [showAddRes, setShowAddRes] = useState(false);
//   // Transfer table state
//   const [transferOrderId, setTransferOrderId] = useState('');
//   const [transferNewTable, setTransferNewTable] = useState(1);
//   const [showTransferDialog, setShowTransferDialog] = useState(false);
//   // Translation state
//   const [transItemId, setTransItemId] = useState('');
//   const [transLang, setTransLang] = useState<Language>('hi');
//   const [transName, setTransName] = useState('');
//   const [transDesc, setTransDesc] = useState('');

//   const tabs = [
//     { id: 'dashboard' as Tab, label: tt('dashboard'), icon: LayoutDashboard },
//     { id: 'orders' as Tab, label: tt('orders'), icon: ClipboardList },
//     { id: 'menu' as Tab, label: tt('menu_items'), icon: UtensilsCrossed },
//     { id: 'stock' as Tab, label: tt('stock'), icon: Warehouse },
//     { id: 'staff' as Tab, label: tt('staff'), icon: Users },
//     { id: 'staffmgmt' as Tab, label: 'Staff Mgmt', icon: CalendarDays },
//     { id: 'feedback' as Tab, label: tt('feedback'), icon: MessageSquare },
//     { id: 'payments' as Tab, label: tt('payments'), icon: CreditCard },
//     { id: 'tables' as Tab, label: tt('tables_qr'), icon: QrCode },
//     { id: 'reservations' as Tab, label: tt('reservations'), icon: BookOpen },
//     { id: 'ops' as Tab, label: 'Operations', icon: Wrench },
//     { id: 'settings' as Tab, label: tt('settings'), icon: Settings },
//   ];

//   const switchTab = (tab: Tab) => { setActiveTab(tab); setSidebarOpen(false); };

//   const allPermissions = ['manage_menu', 'manage_staff', 'view_reports', 'manage_tables', 'manage_settings', 'create_orders', 'process_payments', 'view_orders', 'update_order_status'];

//   const ChartFilterPills = ({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { id: string; label: string }[] }) => (
//     <div className="flex gap-1 flex-wrap">
//       {options.map(o => (
//         <button key={o.id} onClick={() => onChange(o.id)}
//           className={`px-2 py-1 rounded-lg text-[10px] font-medium transition-all ${value === o.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}>
//           {o.label}
//         </button>
//       ))}
//     </div>
//   );

//   const timeFilterOptions = [
//     { id: 'today', label: 'Today' },
//     { id: '7days', label: '7 Days' },
//     { id: 'month', label: 'Month' },
//     { id: 'year', label: 'Year' },
//   ];

//   return (
//     <div className="min-h-screen bg-background font-body flex">
//       {/* Mobile sidebar overlay */}
//       <AnimatePresence>
//         {sidebarOpen && (
//           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
//             className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
//         )}
//       </AnimatePresence>

//       {/* Sidebar */}
//       <aside className={`fixed lg:sticky top-0 left-0 h-screen w-60 bg-sidebar border-r border-sidebar-border flex flex-col flex-shrink-0 z-50 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
//         <div className="p-4 sm:p-6 flex items-center justify-between">
//           <div className="flex items-center gap-3">
//             {settings.logo ? (
//               <img src={settings.logo} alt="Logo" className="h-9 w-9 rounded-xl object-contain" />
//             ) : (
//               <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
//                 <Sparkles className="h-4 w-4 text-primary-foreground" />
//               </div>
//             )}
//             <div>
//               <h1 className="text-lg font-heading font-bold text-sidebar-foreground">{settings.name}</h1>
//               <p className="text-[11px] text-sidebar-foreground/50">Admin Panel</p>
//             </div>
//           </div>
//           <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-sidebar-foreground/60"><X className="h-5 w-5" /></button>
//         </div>
//         <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
//           {tabs.map(tab => (
//             <button key={tab.id} onClick={() => switchTab(tab.id)}
//               className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
//                 activeTab === tab.id
//                   ? 'bg-sidebar-accent text-sidebar-primary glow-primary'
//                   : 'text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
//               }`}>
//               <tab.icon className="h-4 w-4" />{tab.label}
//             </button>
//           ))}
//         </nav>
//         <div className="p-4 border-t border-sidebar-border">
//           <div className="flex items-center gap-3 mb-3 px-2">
//             <div className="h-8 w-8 rounded-lg bg-sidebar-accent flex items-center justify-center"><Users className="h-4 w-4 text-sidebar-foreground/60" /></div>
//             <div><p className="text-xs font-medium text-sidebar-foreground">{user?.name}</p><p className="text-[10px] text-sidebar-foreground/40">Admin</p></div>
//           </div>
//           <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-sidebar-foreground/50 hover:text-sidebar-foreground rounded-xl hover:bg-sidebar-accent/30 transition-all">
//             <LogOut className="h-4 w-4" /> Logout
//           </button>
//         </div>
//       </aside>

//       {/* Main Content */}
//       <main className="flex-1 overflow-y-auto min-w-0">
//         <header className="px-4 sm:px-8 py-4 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between sticky top-0 z-10">
//           <div className="flex items-center gap-3">
//             <button onClick={() => setSidebarOpen(true)} className="lg:hidden h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
//               <MenuIcon className="h-5 w-5 text-muted-foreground" />
//             </button>
//             <div>
//               <h2 className="text-lg sm:text-2xl font-heading font-bold text-foreground">{tabs.find(t => t.id === activeTab)?.label}</h2>
//               <p className="text-xs text-muted-foreground mt-0.5 hidden sm:block">{today} • <LiveClock /></p>
//             </div>
//           </div>
//           <div className="flex items-center gap-3 relative">
//             <button onClick={() => setShowNotifications(!showNotifications)}
//               className="relative h-10 w-10 rounded-xl bg-muted flex items-center justify-center hover:bg-secondary transition-colors">
//               <Bell className="h-5 w-5 text-muted-foreground" />
//               {unreadCount > 0 && <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold">{unreadCount}</span>}
//             </button>

//             <AnimatePresence>
//               {showNotifications && (
//                 <>
//                   <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
//                     className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
//                   <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
//                     className="absolute right-0 top-12 w-80 sm:w-96 bg-card border border-border rounded-2xl cafe-shadow-lg z-50 overflow-hidden">
//                     <div className="p-4 border-b border-border flex items-center justify-between">
//                       <h3 className="font-heading font-bold text-sm">Notifications</h3>
//                       <div className="flex gap-2">
//                         {unreadCount > 0 && <button onClick={markAllRead} className="text-xs text-primary hover:underline">Mark all read</button>}
//                         <button onClick={clearNotifications} className="text-xs text-muted-foreground hover:text-foreground">Clear all</button>
//                       </div>
//                     </div>
//                     <div className="max-h-80 overflow-y-auto divide-y divide-border">
//                       {notifications.length === 0 ? (
//                         <div className="p-8 text-center text-muted-foreground text-sm">
//                           <Bell className="h-8 w-8 mx-auto mb-2 opacity-20" />
//                           No notifications
//                         </div>
//                       ) : notifications.map(n => (
//                         <button key={n.id} onClick={() => markRead(n.id)}
//                           className={`w-full text-left p-3 hover:bg-muted/50 transition-colors flex gap-3 ${!n.read ? 'bg-primary/5' : ''}`}>
//                           <div className="flex-shrink-0 mt-0.5">{notifIcon(n.type)}</div>
//                           <div className="flex-1 min-w-0">
//                             <div className="flex items-center justify-between gap-2">
//                               <span className={`text-sm font-medium ${!n.read ? 'text-foreground' : 'text-muted-foreground'}`}>{n.title}</span>
//                               {!n.read && <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />}
//                             </div>
//                             <p className="text-xs text-muted-foreground mt-0.5 truncate">{n.message}</p>
//                             <p className="text-[10px] text-muted-foreground/60 mt-1">{n.time}</p>
//                           </div>
//                         </button>
//                       ))}
//                     </div>
//                   </motion.div>
//                 </>
//               )}
//             </AnimatePresence>
//           </div>
//         </header>

//         <div className="p-4 sm:p-6 lg:p-8">
//           {/* ===== DASHBOARD ===== */}
//           {activeTab === 'dashboard' && (
//             <div className="space-y-6">
//               {/* Stats cards with individual filters */}
//               <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
//                 {[
//                   { label: "Today's Revenue", value: `₹${totalRevenue.toLocaleString()}`, sub: '↑ 12.5% vs yesterday', icon: DollarSign, gradient: 'from-primary to-primary/60', filterValue: dashRevenueFilter, setFilter: setDashRevenueFilter },
//                   { label: 'Total Orders', value: String(totalOrders), sub: `${pendingPayments} pending`, icon: ShoppingBag, gradient: 'from-accent to-accent/60', filterValue: dashOrdersFilter, setFilter: setDashOrdersFilter },
//                   { label: 'Active Staff', value: String(activeStaffCount), sub: `${staff.length} total members`, icon: Users, gradient: 'from-success to-success/60' },
//                   { label: 'Avg Order', value: `₹${avgOrderValue.toFixed(0)}`, sub: '↑ 8% this week', icon: TrendingUp, gradient: 'from-info to-info/60' },
//                 ].map((stat, i) => (
//                   <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
//                     className="p-4 sm:p-5 rounded-2xl bg-card border border-border cafe-shadow hover:cafe-shadow-lg transition-all">
//                     <div className="flex justify-between items-start">
//                       <div>
//                         <p className="text-xs sm:text-sm text-muted-foreground">{stat.label}</p>
//                         <p className="text-xl sm:text-3xl font-heading font-bold text-foreground mt-1">{stat.value}</p>
//                         <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 hidden sm:block">{stat.sub}</p>
//                       </div>
//                       <div className={`h-9 w-9 sm:h-11 sm:w-11 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center`}>
//                         <stat.icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary-foreground" />
//                       </div>
//                     </div>
//                     {'setFilter' in stat && stat.setFilter && (
//                       <div className="mt-2">
//                         <ChartFilterPills value={stat.filterValue!} onChange={stat.setFilter} options={timeFilterOptions} />
//                       </div>
//                     )}
//                   </motion.div>
//                 ))}
//               </div>

//               <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
//                 <div className="lg:col-span-3 rounded-2xl bg-card border border-border cafe-shadow p-4 sm:p-6">
//                   <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
//                     <h3 className="font-heading font-bold text-foreground flex items-center gap-2 text-sm sm:text-base"><BarChart3 className="h-5 w-5 text-primary" /> Weekly Sales</h3>
//                     <ChartFilterPills value={dashWeeklySalesFilter} onChange={setDashWeeklySalesFilter} options={timeFilterOptions} />
//                   </div>
//                   <ResponsiveContainer width="100%" height={250}>
//                     <AreaChart data={salesData}>
//                       <defs><linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="hsl(262, 80%, 55%)" stopOpacity={0.3} /><stop offset="100%" stopColor="hsl(262, 80%, 55%)" stopOpacity={0} /></linearGradient></defs>
//                       <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 90%)" />
//                       <XAxis dataKey="day" tick={{ fontSize: 12 }} />
//                       <YAxis tick={{ fontSize: 12 }} />
//                       <Tooltip />
//                       <Area type="monotone" dataKey="sales" stroke="hsl(262, 80%, 55%)" fill="url(#salesGrad)" strokeWidth={2} />
//                     </AreaChart>
//                   </ResponsiveContainer>
//                 </div>
//                 <div className="lg:col-span-2 rounded-2xl bg-card border border-border cafe-shadow p-4 sm:p-6">
//                   <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
//                     <h3 className="font-heading font-bold text-foreground flex items-center gap-2 text-sm sm:text-base"><PieChartIcon className="h-5 w-5 text-accent" /> Top Items</h3>
//                     <ChartFilterPills value={dashTopItemsFilter} onChange={setDashTopItemsFilter} options={timeFilterOptions} />
//                   </div>
//                   {topItems.length > 0 ? (
//                     <>
//                       <ResponsiveContainer width="100%" height={180}>
//                         <PieChart><Pie data={topItems} cx="50%" cy="50%" outerRadius={75} innerRadius={40} dataKey="value" paddingAngle={3}>
//                           {topItems.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
//                         </Pie></PieChart>
//                       </ResponsiveContainer>
//                       <div className="space-y-1.5 mt-3">{topItems.map((item, i) => (
//                         <div key={item.name} className="flex items-center gap-2 text-xs"><span className="h-2.5 w-2.5 rounded-full" style={{ background: CHART_COLORS[i] }} /><span className="flex-1 text-muted-foreground truncate">{item.name}</span><span className="font-bold">{item.pct}%</span></div>
//                       ))}</div>
//                     </>
//                   ) : <p className="text-center text-muted-foreground py-12">No data yet</p>}
//                 </div>
//               </div>

//               {/* Recent Orders with filter */}
//               <div className="rounded-2xl bg-card border border-border cafe-shadow">
//                 <div className="p-4 sm:p-5 border-b border-border flex flex-wrap items-center justify-between gap-2">
//                   <h3 className="font-heading font-bold text-foreground text-sm sm:text-base">Recent Orders</h3>
//                   <div className="flex items-center gap-2">
//                     <ChartFilterPills value={dashRecentOrdersFilter} onChange={setDashRecentOrdersFilter} options={[{ id: 'all', label: 'All' }, ...timeFilterOptions]} />
//                     <Button variant="outline" size="sm" className="rounded-xl text-xs h-8" onClick={() => setActiveTab('orders')}>View All</Button>
//                   </div>
//                 </div>
//                 <div className="overflow-x-auto">
//                   <table className="w-full min-w-[600px]">
//                     <thead><tr className="border-b border-border text-left">
//                       {['Order ID', 'Table', 'Items', 'Total', 'Status', 'Time'].map(h => <th key={h} className="p-3 sm:p-4 text-xs font-semibold text-muted-foreground">{h}</th>)}
//                     </tr></thead>
//                     <tbody className="divide-y divide-border">
//                       {filteredOrders.slice(0, 5).map(o => (
//                         <tr key={o.id} className="hover:bg-muted/30 cursor-pointer transition-colors" onClick={() => setViewingOrder(o.id)}>
//                           <td className="p-3 sm:p-4 font-mono text-sm font-bold">{o.id}</td>
//                           <td className="p-3 sm:p-4 text-sm"><Badge variant="outline">T-{String(o.tableNumber).padStart(2, '0')}</Badge></td>
//                           <td className="p-3 sm:p-4 text-sm text-muted-foreground truncate max-w-[200px]">{o.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}</td>
//                           <td className="p-3 sm:p-4 text-sm font-bold">₹{o.grandTotal.toFixed(0)}</td>
//                           <td className="p-3 sm:p-4"><span className={`px-2.5 py-1 rounded-lg text-xs font-medium capitalize ${statusColor(o.status)}`}>{o.status}</span></td>
//                           <td className="p-3 sm:p-4 text-sm text-muted-foreground">{getTimeAgo(o.createdAt)}</td>
//                         </tr>
//                       ))}
//                     </tbody>
//                   </table>
//                 </div>
//               </div>
//             </div>
//           )}

//           {/* ===== ORDERS ===== */}
//           {activeTab === 'orders' && (
//             <div className="space-y-4">
//               <div className="rounded-2xl bg-card border border-border cafe-shadow p-4 sm:p-6">
//                 <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
//                   <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
//                     <div className="relative flex-1 sm:flex-none sm:w-48">
//                       <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//                       <Input placeholder="Search orders..." value={orderSearch} onChange={e => setOrderSearch(e.target.value)} className="pl-9 h-10 rounded-xl" />
//                     </div>
//                     <Select value={orderFilter} onValueChange={setOrderFilter}>
//                       <SelectTrigger className="w-28 sm:w-36 h-10 rounded-xl"><Filter className="h-3 w-3 mr-1" /><SelectValue /></SelectTrigger>
//                       <SelectContent>{['all', 'pending', 'preparing', 'ready', 'served', 'paid'].map(f => <SelectItem key={f} value={f} className="capitalize">{f}</SelectItem>)}</SelectContent>
//                     </Select>
//                     <Select value={orderDateRange} onValueChange={setOrderDateRange}>
//                       <SelectTrigger className="w-32 sm:w-40 h-10 rounded-xl"><Calendar className="h-3 w-3 mr-1" /><SelectValue /></SelectTrigger>
//                       <SelectContent>
//                         <SelectItem value="today">Today</SelectItem>
//                         <SelectItem value="7days">Last 7 Days</SelectItem>
//                         <SelectItem value="week">This Week</SelectItem>
//                         <SelectItem value="month">This Month</SelectItem>
//                         <SelectItem value="year">This Year</SelectItem>
//                       </SelectContent>
//                     </Select>
//                     <Button variant="outline" size="sm" className="h-10 rounded-xl" onClick={() => setOrderSort(s => s === 'desc' ? 'asc' : 'desc')}>
//                       {orderSort === 'desc' ? <ArrowDown className="h-3 w-3 mr-1" /> : <ArrowUp className="h-3 w-3 mr-1" />}
//                       <span className="hidden sm:inline">{orderSort === 'desc' ? 'Newest' : 'Oldest'}</span>
//                     </Button>
//                   </div>
//                   <div className="flex gap-2 flex-wrap">
//                     {(['pdf', 'csv', 'excel'] as const).map(fmt => (
//                       <Button key={fmt} variant="outline" size="sm" className="h-10 rounded-xl" onClick={() => exportData(fmt)}>
//                         <Download className="h-3 w-3 mr-1" /> {fmt.toUpperCase()}
//                       </Button>
//                     ))}
//                   </div>
//                 </div>
//                 <div className="overflow-x-auto">
//                   <table className="w-full min-w-[700px]">
//                     <thead><tr className="border-b border-border text-left">
//                       {['Order ID', 'Table', 'Items', 'Total', 'Payment', 'Status', 'Time'].map(h => <th key={h} className="p-3 text-xs font-semibold text-muted-foreground">{h}</th>)}
//                     </tr></thead>
//                     <tbody className="divide-y divide-border">
//                       {filteredOrders.map(o => (
//                         <tr key={o.id} className="hover:bg-muted/30 cursor-pointer transition-colors" onClick={() => setViewingOrder(o.id)}>
//                           <td className="p-3 font-mono text-sm font-bold">{o.id}</td>
//                           <td className="p-3 text-sm"><Badge variant="outline">T-{String(o.tableNumber).padStart(2, '0')}</Badge></td>
//                           <td className="p-3 text-sm text-muted-foreground truncate max-w-[200px]">{o.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}</td>
//                           <td className="p-3 text-sm font-bold">₹{o.grandTotal.toFixed(0)}</td>
//                           <td className="p-3"><Badge variant="outline" className="text-[10px] uppercase">{o.paymentMethod}</Badge></td>
//                           <td className="p-3"><span className={`px-2.5 py-1 rounded-lg text-xs font-medium capitalize ${statusColor(o.status)}`}>{o.status}</span></td>
//                           <td className="p-3 text-sm text-muted-foreground">{getTimeAgo(o.createdAt)}</td>
//                         </tr>
//                       ))}
//                     </tbody>
//                   </table>
//                 </div>
//                 {filteredOrders.length === 0 && <p className="p-8 text-center text-muted-foreground">No orders found</p>}
//                 <div className="flex items-center justify-between pt-4 border-t border-border mt-4">
//                   <span className="text-xs text-muted-foreground">{filteredOrders.length} orders</span>
//                   <span className="text-xs text-muted-foreground">Total: ₹{filteredOrders.reduce((s, o) => s + o.grandTotal, 0).toLocaleString()}</span>
//                 </div>
//               </div>
//             </div>
//           )}

//           {/* ===== MENU MANAGEMENT ===== */}
//           {activeTab === 'menu' && (
//             <div className="space-y-4">
//               <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
//                 <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
//                   <div className="relative flex-1 sm:flex-none sm:w-48">
//                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//                     <Input placeholder="Search menu..." value={menuSearch} onChange={e => setMenuSearch(e.target.value)} className="pl-9 h-10 rounded-xl" />
//                   </div>
//                   <Select value={menuCategory} onValueChange={setMenuCategory}>
//                     <SelectTrigger className="w-36 h-10 rounded-xl"><SelectValue /></SelectTrigger>
//                     <SelectContent>{allCats.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
//                   </Select>
//                 </div>
//                 <div className="flex gap-2 flex-wrap">
//                   <input ref={bulkUploadRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleBulkUpload} />
//                   <Button variant="outline" className="rounded-xl" onClick={() => bulkUploadRef.current?.click()}>
//                     <Upload className="h-4 w-4 mr-1" /> Bulk Upload CSV
//                   </Button>
//                   <Button variant="outline" className="rounded-xl" onClick={() => setShowAddCategory(true)}>
//                     <FolderPlus className="h-4 w-4 mr-1" /> Add Category
//                   </Button>
//                   <Button className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-xl" onClick={() => setShowAddItem(true)}>
//                     <Plus className="h-4 w-4 mr-1" /> Add Item
//                   </Button>
//                 </div>
//               </div>

//               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
//                 {filteredMenu.map(item => (
//                   <motion.div key={item.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
//                     className="card-3d group">
//                     <div className="card-3d-inner rounded-2xl bg-card border border-border cafe-shadow overflow-hidden hover:cafe-shadow-lg transition-all">
//                       <div className="relative">
//                         <img src={item.image} alt={item.name} className="w-full h-36 object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
//                         <div className="absolute inset-0 bg-gradient-to-t from-foreground/30 to-transparent" />
//                         <Badge className={`absolute top-3 right-3 text-[10px] ${item.available ? 'bg-success/90 text-success-foreground' : 'bg-destructive/90 text-destructive-foreground'}`}>
//                           {item.available ? '✓ Available' : <span className="flex items-center gap-1"><Ban className="h-3 w-3" /> Out of Stock</span>}
//                         </Badge>
//                         {/* Veg / Non-veg icon */}
//                         <div className={`absolute top-3 left-3 h-5 w-5 rounded border-2 flex items-center justify-center ${item.vegetarian ? 'border-success' : 'border-destructive'}`}>
//                           <span className={`h-2.5 w-2.5 rounded-full ${item.vegetarian ? 'bg-success' : 'bg-destructive'}`} />
//                         </div>
//                         <span className="absolute bottom-3 left-3 text-xl font-bold text-primary-foreground drop-shadow">₹{item.price}</span>
//                       </div>
//                       <div className="p-4">
//                         <div className="flex items-center justify-between mb-1">
//                           <h4 className="font-heading font-semibold text-sm text-foreground leading-tight">{item.name}</h4>
//                           {item.todaysSpecial && <Badge className="bg-accent/10 text-accent text-[9px]">⭐ Special</Badge>}
//                         </div>
//                         <p className="text-xs text-muted-foreground mt-1">{item.category}</p>
//                         <div className="flex gap-1.5 mt-3 flex-wrap">
//                           <Button variant="outline" size="sm" className="flex-1 h-8 text-xs rounded-lg" onClick={() => startEditing(item)}><Edit2 className="h-3 w-3 mr-1" /> Edit</Button>
//                           <Button variant="outline" size="sm" className="h-8 w-8 rounded-lg" title="Today's Special" onClick={() => toggleTodaysSpecial(item.id)}>
//                             <Sparkles className={`h-3 w-3 ${item.todaysSpecial ? 'text-accent' : 'text-muted-foreground'}`} />
//                           </Button>
//                           <Button variant="outline" size="sm" className="h-8 w-8 rounded-lg" onClick={() => toggleItemAvailability(item.id)}>
//                             {item.available ? <Ban className="h-3 w-3 text-destructive" /> : <Eye className="h-3 w-3 text-success" />}
//                           </Button>
//                           <Button variant="outline" size="sm" className="h-8 w-8 text-destructive rounded-lg" onClick={() => setShowDeleteConfirm(item.id)}><Trash2 className="h-3 w-3" /></Button>
//                         </div>
//                       </div>
//                     </div>
//                   </motion.div>
//                 ))}
//               </div>
//             </div>
//           )}

//           {/* ===== STAFF & ROLES ===== */}
//           {activeTab === 'staff' && (
//             <div className="space-y-6">
//               <div className="space-y-4">
//                 <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
//                   <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
//                     <div className="relative flex-1 sm:flex-none sm:w-48">
//                       <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//                       <Input placeholder="Search staff..." value={staffSearch} onChange={e => setStaffSearch(e.target.value)} className="pl-9 h-10 rounded-xl" />
//                     </div>
//                     <Select value={staffRoleFilter} onValueChange={setStaffRoleFilter}>
//                       <SelectTrigger className="w-36 h-10 rounded-xl"><SelectValue placeholder="Role" /></SelectTrigger>
//                       <SelectContent>
//                         <SelectItem value="all">All Roles</SelectItem>
//                         {roles.map(r => <SelectItem key={r.id} value={r.name.toLowerCase()}>{r.name}</SelectItem>)}
//                       </SelectContent>
//                     </Select>
//                   </div>
//                   <Button className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-xl"
//                     onClick={() => { setShowAddStaff(true); setStaffForm({ name: '', role: 'Counter', shift: 'Morning', email: '', phone: '', status: 'active' }); }}>
//                     <Plus className="h-4 w-4 mr-1" /> Add Staff
//                   </Button>
//                 </div>

//                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
//                   {filteredStaff.map(s => (
//                     <div key={s.id} className="p-4 sm:p-5 rounded-2xl bg-card border border-border cafe-shadow hover:cafe-shadow-lg transition-all">
//                       <div className="flex items-start justify-between mb-3">
//                         <div className="flex items-center gap-3">
//                           <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-lg">
//                             {s.role === 'Kitchen' ? '👨‍🍳' : s.role === 'Admin' ? '👔' : '🧑‍💼'}
//                           </div>
//                           <div>
//                             <h4 className="font-semibold text-sm text-foreground">{s.name}</h4>
//                             <p className="text-xs text-muted-foreground">{s.email}</p>
//                           </div>
//                         </div>
//                         <Badge className={`text-[10px] ${s.status === 'active' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
//                           {s.status}
//                         </Badge>
//                       </div>
//                       <div className="flex items-center gap-2 mb-3">
//                         <Badge variant="outline" className="text-xs">{s.role}</Badge>
//                         <Badge variant="outline" className="text-xs">{s.shift}</Badge>
//                       </div>
//                       <div className="flex gap-2">
//                         <Button variant="outline" size="sm" className="flex-1 h-8 text-xs rounded-lg" onClick={() => {
//                           setEditingStaff(s.id); setStaffForm({ name: s.name, role: s.role, shift: s.shift, email: s.email, phone: s.phone, status: s.status });
//                         }}><Edit2 className="h-3 w-3 mr-1" /> Edit</Button>
//                         <Button variant="outline" size="sm" className="h-8 text-xs text-destructive rounded-lg" onClick={() => setShowDeleteStaff(s.id)}>
//                           <Trash2 className="h-3 w-3" />
//                         </Button>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               </div>

//               <div className="space-y-4">
//                 <div className="flex items-center justify-between">
//                   <h3 className="font-heading font-bold text-foreground flex items-center gap-2"><ShieldPlus className="h-5 w-5 text-primary" /> Roles</h3>
//                   <Button variant="outline" className="rounded-xl" onClick={() => setShowAddRole(true)}>
//                     <Plus className="h-4 w-4 mr-1" /> Add Role
//                   </Button>
//                 </div>
//                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
//                   {roles.map(r => (
//                     <div key={r.id} className="p-4 rounded-2xl bg-card border border-border cafe-shadow">
//                       <h4 className="font-semibold text-sm text-foreground mb-2">{r.name}</h4>
//                       <div className="flex flex-wrap gap-1">
//                         {r.permissions.map(p => (
//                           <Badge key={p} variant="outline" className="text-[10px]">{p.replace(/_/g, ' ')}</Badge>
//                         ))}
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             </div>
//           )}

//           {/* ===== STAFF MANAGEMENT ===== */}
//           {activeTab === 'staffmgmt' && (
//             <div className="space-y-6">
//               <h2 className="text-lg font-heading font-bold flex items-center gap-2"><CalendarDays className="h-5 w-5 text-primary" /> Staff Attendance & Leave Management</h2>

//               {/* Attendance Overview with Filters */}
//               <div className="rounded-2xl bg-card border border-border cafe-shadow p-4 sm:p-6">
//                 <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
//                   <h3 className="font-heading font-bold">Staff Attendance</h3>
//                   <div className="flex flex-wrap items-center gap-2">
//                     <div className="relative">
//                       <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
//                       <Input placeholder="Search staff..." value={staffMgmtSearch} onChange={e => setStaffMgmtSearch(e.target.value)} className="pl-8 h-8 w-[160px] rounded-xl text-xs" />
//                     </div>
//                     <Select value={staffMgmtMonthFilter || 'all'} onValueChange={v => setStaffMgmtMonthFilter(v === 'all' ? '' : v)}>
//                       <SelectTrigger className="h-8 w-[140px] rounded-xl text-xs"><Calendar className="h-3 w-3 mr-1" /><SelectValue placeholder="All Months" /></SelectTrigger>
//                       <SelectContent>
//                         <SelectItem value="all">All Months</SelectItem>
//                         {['January','February','March','April','May','June','July','August','September','October','November','December'].map((m, i) => (
//                           <SelectItem key={m} value={String(i + 1).padStart(2, '0')}>{m}</SelectItem>
//                         ))}
//                       </SelectContent>
//                     </Select>
//                     <Input type="date" value={staffMgmtDate} onChange={e => setStaffMgmtDate(e.target.value)} className="h-8 w-[140px] rounded-xl text-xs" />
//                     {(staffMgmtDate || staffMgmtMonthFilter) && <button onClick={() => { setStaffMgmtDate(''); setStaffMgmtMonthFilter(''); }} className="text-[10px] text-primary hover:underline">Clear</button>}
//                   </div>
//                 </div>
//                 <div className="overflow-x-auto">
//                   <table className="w-full min-w-[500px]">
//                     <thead>
//                       <tr className="border-b border-border text-left">
//                         {['Staff Name', 'Role', 'Shift', 'Clock In', 'Clock Out', 'Status'].map(h => (
//                           <th key={h} className="p-3 text-xs font-semibold text-muted-foreground">{h}</th>
//                         ))}
//                       </tr>
//                     </thead>
//                     <tbody className="divide-y divide-border">
//                       {staff.filter(s => s.status === 'active').filter(s => !staffMgmtSearch || s.name.toLowerCase().includes(staffMgmtSearch.toLowerCase())).map(s => (
//                         <tr key={s.id} className="hover:bg-muted/30">
//                           <td className="p-3 text-sm font-medium">{s.name}</td>
//                           <td className="p-3"><Badge variant="outline" className="text-xs">{s.role}</Badge></td>
//                           <td className="p-3 text-sm text-muted-foreground">{s.shift}</td>
//                           <td className="p-3 text-sm text-muted-foreground">09:00 AM</td>
//                           <td className="p-3 text-sm text-muted-foreground">{s.shift === 'Morning' ? '02:00 PM' : s.shift === 'Evening' ? '10:00 PM' : '06:00 PM'}</td>
//                           <td className="p-3"><Badge className="bg-success/10 text-success text-[10px]">Present</Badge></td>
//                         </tr>
//                       ))}
//                     </tbody>
//                   </table>
//                 </div>
//               </div>

//               {/* Pending Leave Requests */}
//               <div className="rounded-2xl bg-card border border-border cafe-shadow p-4 sm:p-6">
//                 <h3 className="font-heading font-bold mb-4">Pending Leave Requests</h3>
//                 <div className="space-y-3">
//                   {leaveRequests.filter(r => r.status === 'pending').length === 0 ? (
//                     <p className="text-center text-muted-foreground py-4 text-sm">No pending requests</p>
//                   ) : leaveRequests.filter(r => r.status === 'pending').map(req => (
//                     <div key={req.id} className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/20">
//                       <div>
//                         <p className="text-sm font-medium">{req.staff}</p>
//                         <p className="text-xs text-muted-foreground">{req.type} Leave • {req.fromDate} → {req.toDate}</p>
//                         <p className="text-[10px] text-muted-foreground mt-1">Reason: {req.reason}</p>
//                       </div>
//                       <div className="flex items-center gap-2">
//                         <Badge className="text-[10px] bg-accent/10 text-accent">Pending</Badge>
//                         <div className="flex gap-1">
//                           <Button size="sm" className="h-7 px-2 rounded-lg bg-success/90 text-success-foreground text-[10px]" onClick={() => { updateLeaveStatus(req.id, 'approved'); toast.success(`Leave approved for ${req.staff}`); }}>Approve</Button>
//                           <Button size="sm" variant="outline" className="h-7 px-2 rounded-lg text-destructive text-[10px]" onClick={() => { updateLeaveStatus(req.id, 'rejected'); toast.success(`Leave rejected for ${req.staff}`); }}>Reject</Button>
//                         </div>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               </div>

//               {/* Approved Requests */}
//               {leaveRequests.filter(r => r.status === 'approved').length > 0 && (
//                 <div className="rounded-2xl bg-card border border-border cafe-shadow p-4 sm:p-6">
//                   <h3 className="font-heading font-bold mb-4 text-success">✅ Approved Requests</h3>
//                   <div className="space-y-3">
//                     {leaveRequests.filter(r => r.status === 'approved').map(req => (
//                       <div key={req.id} className="flex items-center justify-between p-4 rounded-xl border border-success/20 bg-success/5">
//                         <div>
//                           <p className="text-sm font-medium">{req.staff}</p>
//                           <p className="text-xs text-muted-foreground">{req.type} Leave • {req.fromDate} → {req.toDate}</p>
//                           <p className="text-[10px] text-muted-foreground mt-1">Reason: {req.reason}</p>
//                         </div>
//                         <Badge className="text-[10px] bg-success/10 text-success">Approved</Badge>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               )}

//               {/* Rejected Requests */}
//               {leaveRequests.filter(r => r.status === 'rejected').length > 0 && (
//                 <div className="rounded-2xl bg-card border border-border cafe-shadow p-4 sm:p-6">
//                   <h3 className="font-heading font-bold mb-4 text-destructive">❌ Rejected Requests</h3>
//                   <div className="space-y-3">
//                     {leaveRequests.filter(r => r.status === 'rejected').map(req => (
//                       <div key={req.id} className="flex items-center justify-between p-4 rounded-xl border border-destructive/20 bg-destructive/5">
//                         <div>
//                           <p className="text-sm font-medium">{req.staff}</p>
//                           <p className="text-xs text-muted-foreground">{req.type} Leave • {req.fromDate} → {req.toDate}</p>
//                           <p className="text-[10px] text-muted-foreground mt-1">Reason: {req.reason}</p>
//                         </div>
//                         <Badge className="text-[10px] bg-destructive/10 text-destructive">Rejected</Badge>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               )}
//             </div>
//           )}

//           {/* ===== PAYMENTS & REPORTS ===== */}
//           {activeTab === 'payments' && (
//             <div className="space-y-6">
//               <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
//                 {[
//                   { label: 'Total Revenue', value: `₹${payFilteredRevenue.toLocaleString()}`, icon: '💰' },
//                   { label: 'UPI Payments', value: `₹${payFilteredUpi.toLocaleString()}`, icon: '📱' },
//                   { label: 'Cash Payments', value: `₹${payFilteredCash.toLocaleString()}`, icon: '💵' },
//                   { label: 'Card Payments', value: `₹${payFilteredCard.toLocaleString()}`, icon: '💳' },
//                 ].map(p => (
//                   <div key={p.label} className="p-4 sm:p-5 rounded-2xl bg-card border border-border cafe-shadow">
//                     <div className="flex justify-between items-start">
//                       <div><p className="text-xs sm:text-sm text-muted-foreground">{p.label}</p><p className="text-lg sm:text-2xl font-heading font-bold text-foreground mt-1">{p.value}</p></div>
//                       <span className="text-xl sm:text-2xl">{p.icon}</span>
//                     </div>
//                   </div>
//                 ))}
//               </div>

//               <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//                 <div className="rounded-2xl bg-card border border-border cafe-shadow p-4 sm:p-6">
//                   <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
//                     <h3 className="font-heading font-bold text-foreground text-sm sm:text-base">Revenue Trends</h3>
//                     <ChartFilterPills value={payRevenueTrendFilter} onChange={setPayRevenueTrendFilter} options={[
//                       { id: '3months', label: '3M' }, { id: '6months', label: '6M' }, { id: 'year', label: '1Y' },
//                     ]} />
//                   </div>
//                   <ResponsiveContainer width="100%" height={250}>
//                     <LineChart data={revenueTrends}>
//                       <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 90%)" />
//                       <XAxis dataKey="month" tick={{ fontSize: 12 }} /><YAxis tick={{ fontSize: 12 }} /><Tooltip />
//                       <Line type="monotone" dataKey="revenue" stroke="hsl(262, 80%, 55%)" strokeWidth={2} dot={{ fill: 'hsl(262, 80%, 55%)' }} />
//                     </LineChart>
//                   </ResponsiveContainer>
//                 </div>
//                 <div className="rounded-2xl bg-card border border-border cafe-shadow p-4 sm:p-6">
//                   <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
//                     <h3 className="font-heading font-bold text-foreground text-sm sm:text-base">Payment Distribution</h3>
//                     <ChartFilterPills value={payDistributionFilter} onChange={setPayDistributionFilter} options={[
//                       { id: 'all', label: 'All' }, { id: 'today', label: 'Today' }, { id: '7days', label: '7D' }, { id: 'month', label: 'Month' },
//                     ]} />
//                   </div>
//                   <ResponsiveContainer width="100%" height={200}>
//                     <PieChart><Pie data={[
//                       { name: 'UPI', value: payFilteredUpi || 1 }, { name: 'Cash', value: payFilteredCash || 1 }, { name: 'Card', value: payFilteredCard || 1 },
//                     ]} cx="50%" cy="50%" outerRadius={80} innerRadius={45} dataKey="value" paddingAngle={3}>
//                       {[0, 1, 2].map(i => <Cell key={i} fill={CHART_COLORS[i]} />)}
//                     </Pie><Tooltip /></PieChart>
//                   </ResponsiveContainer>
//                   <div className="flex justify-center gap-6 mt-3">
//                     {[{ label: 'UPI', c: CHART_COLORS[0] }, { label: 'Cash', c: CHART_COLORS[1] }, { label: 'Card', c: CHART_COLORS[2] }].map(l => (
//                       <div key={l.label} className="flex items-center gap-2 text-xs"><span className="h-3 w-3 rounded-full" style={{ background: l.c }} />{l.label}</div>
//                     ))}
//                   </div>
//                 </div>
//               </div>

//               <div className="rounded-2xl bg-card border border-border cafe-shadow p-4 sm:p-6">
//                 <h3 className="font-heading font-bold text-foreground mb-4 text-sm sm:text-base">Summary</h3>
//                 <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
//                   {[{ label: 'Total Revenue', value: `₹${payFilteredRevenue.toLocaleString()}` }, { label: 'Total Orders', value: String(filteredPayments.length) }, { label: 'Avg Order Value', value: `₹${filteredPayments.length > 0 ? (payFilteredRevenue / filteredPayments.length).toFixed(0) : 0}` }, { label: 'Transactions', value: String(filteredPayments.length) }].map(m => (
//                     <div key={m.label} className="text-center p-3 sm:p-4 rounded-xl bg-muted/30">
//                       <p className="text-xs sm:text-sm text-muted-foreground">{m.label}</p>
//                       <p className="text-lg sm:text-2xl font-heading font-bold text-foreground mt-1">{m.value}</p>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             </div>
//           )}

//           {/* ===== TABLES & QR CODES ===== */}
//           {activeTab === 'tables' && (
//             <div className="space-y-6">
//               <div className="flex flex-wrap items-center justify-between gap-3">
//                 <div className="flex items-center gap-4 flex-wrap">
//                   <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-success" /><span className="text-xs text-muted-foreground">Available</span></div>
//                   <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-destructive" /><span className="text-xs text-muted-foreground">Occupied</span></div>
//                   <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-accent" /><span className="text-xs text-muted-foreground">Reserved</span></div>
//                 </div>
//                 <Button className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-xl" onClick={() => { setTableForm({ name: '', capacity: 4 }); setShowAddTable(true); }}>
//                   <Plus className="h-4 w-4 mr-1" /> Add Table
//                 </Button>
//               </div>

//               {/* Universal QR — external pickup & reservations */}
//               <div className="rounded-2xl border-2 border-accent/40 bg-gradient-to-br from-accent/5 to-primary/5 p-5 cafe-shadow">
//                 <div className="flex flex-wrap items-center gap-5">
//                   <div className="p-3 bg-background rounded-xl border border-border">
//                     <QRCodeSVG value={`${baseUrl}/menu?mode=pickup`} size={120} level="H" />
//                   </div>
//                   <div className="flex-1 min-w-[220px]">
//                     <h3 className="font-heading font-bold text-lg">Universal QR — Pickup & Reservations</h3>
//                     <p className="text-xs text-muted-foreground mt-1">
//                       Print and place outside the café. Customers can place <strong>prepaid pickup orders</strong> or book reservations without entering the store.
//                       Cash-on-delivery is disabled for these orders.
//                     </p>
//                     <p className="text-[11px] font-mono text-muted-foreground mt-2 break-all">{baseUrl}/menu?mode=pickup</p>
//                   </div>
//                   <div className="flex flex-col gap-2">
//                     <Button variant="outline" size="sm" className="rounded-xl" onClick={() => window.open(`${baseUrl}/menu?mode=pickup`, '_blank')}>
//                       <Eye className="h-3.5 w-3.5 mr-1" /> Preview
//                     </Button>
//                     <Button variant="outline" size="sm" className="rounded-xl" onClick={() => { navigator.clipboard.writeText(`${baseUrl}/menu?mode=pickup`); toast.success('Link copied'); }}>
//                       Copy Link
//                     </Button>
//                   </div>
//                 </div>
//               </div>
//               <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
//                 {tablesData.map(table => {
//                   const isOccupied = occupiedTables.includes(table.number);
//                   const tableOrders = orders.filter(o => o.tableNumber === table.number && !['paid', 'served'].includes(o.status));
//                   return (
//                     <div key={table.number} className={`p-4 sm:p-5 rounded-2xl bg-card border-2 cafe-shadow hover:cafe-shadow-lg transition-all ${isOccupied ? 'border-destructive/30' : 'border-success/30'}`}>
//                       <div className="flex items-center justify-between mb-2">
//                         <h4 className="font-heading font-bold text-xl sm:text-2xl">{table.name}</h4>
//                         <Badge className={`text-[10px] ${isOccupied ? 'bg-destructive/10 text-destructive' : 'bg-success/10 text-success'}`}>{isOccupied ? 'Occupied' : 'Available'}</Badge>
//                       </div>
//                       <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Users2 className="h-3 w-3" /> Capacity: <strong>{table.capacity}</strong></div>
//                       <p className="text-xs text-muted-foreground mb-1">Orders: <strong>{tableOrders.length}</strong></p>
//                       <p className="text-xs text-muted-foreground mb-3 font-mono">QR{String(table.number).padStart(3, '0')}</p>
//                       <div className="flex gap-2">
//                         <Button variant="outline" size="sm" className="flex-1 rounded-xl text-xs" onClick={() => setViewingQR(table.number)}>
//                           <QrCode className="h-3 w-3 mr-1" /> QR
//                         </Button>
//                         <Button variant="outline" size="sm" className="rounded-xl text-xs" onClick={() => { setEditingTable(table.number); setTableForm({ name: table.name, capacity: table.capacity }); }}>
//                           <Edit2 className="h-3 w-3" />
//                         </Button>
//                         {tableOrders.length > 0 && (
//                           <Button variant="outline" size="sm" className="rounded-xl text-xs" onClick={() => setViewingTableOrders(table.number)}>
//                             <ClipboardList className="h-3 w-3" />
//                           </Button>
//                         )}
//                       </div>
//                     </div>
//                   );
//                 })}
//               </div>
//             </div>
//           )}

//           {/* ===== CUSTOMER FEEDBACK ===== */}
//           {activeTab === 'feedback' && (
//             <div className="space-y-6">
//               <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
//                 <div>
//                   <h3 className="text-lg font-heading font-bold text-foreground flex items-center gap-2">
//                     <MessageSquare className="h-5 w-5 text-primary" /> Customer Feedback
//                   </h3>
//                   <p className="text-xs text-muted-foreground mt-1">{feedbacks.length} total submissions</p>
//                 </div>
//                 <div className="flex flex-wrap items-center gap-2">
//                   <div className="relative">
//                     <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
//                     <Input placeholder="Search feedback..." value={feedbackSearch} onChange={e => setFeedbackSearch(e.target.value)}
//                       className="pl-8 h-8 w-[180px] rounded-xl text-xs" />
//                   </div>
//                   <Select value={feedbackRatingFilter} onValueChange={setFeedbackRatingFilter}>
//                     <SelectTrigger className="h-8 w-[130px] rounded-xl text-xs"><SelectValue placeholder="Filter rating" /></SelectTrigger>
//                     <SelectContent>
//                       <SelectItem value="all">All Ratings</SelectItem>
//                       <SelectItem value="5">⭐⭐⭐⭐⭐ (5)</SelectItem>
//                       <SelectItem value="4">⭐⭐⭐⭐ (4)</SelectItem>
//                       <SelectItem value="3">⭐⭐⭐ (3)</SelectItem>
//                       <SelectItem value="2">⭐⭐ (2)</SelectItem>
//                       <SelectItem value="1">⭐ (1)</SelectItem>
//                     </SelectContent>
//                   </Select>
//                 </div>
//               </div>

//               {/* Summary Cards */}
//               <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
//                 {[
//                   { label: 'Total Reviews', value: feedbacks.length, icon: MessageSquare, color: 'from-primary/20 to-primary/5', iconColor: 'text-primary' },
//                   { label: 'Avg Rating', value: feedbacks.length > 0 ? (feedbacks.reduce((s, f) => s + f.rating, 0) / feedbacks.length).toFixed(1) : '0', icon: Star, color: 'from-accent/20 to-accent/5', iconColor: 'text-accent' },
//                   { label: '5-Star Reviews', value: feedbacks.filter(f => f.rating === 5).length, icon: Star, color: 'from-success/20 to-success/5', iconColor: 'text-success' },
//                   { label: 'Low Ratings (≤2)', value: feedbacks.filter(f => f.rating <= 2).length, icon: Star, color: 'from-destructive/20 to-destructive/5', iconColor: 'text-destructive' },
//                 ].map(stat => (
//                   <div key={stat.label} className={`p-4 rounded-2xl bg-gradient-to-br ${stat.color} border border-border cafe-shadow`}>
//                     <div className="flex items-center gap-2 mb-2">
//                       <stat.icon className={`h-4 w-4 ${stat.iconColor}`} />
//                       <span className="text-[11px] text-muted-foreground font-medium">{stat.label}</span>
//                     </div>
//                     <p className="text-2xl font-heading font-bold text-foreground">{stat.value}</p>
//                   </div>
//                 ))}
//               </div>

//               {/* Feedback Table */}
//               <div className="rounded-2xl bg-card border border-border cafe-shadow overflow-hidden">
//                 {filteredFeedbacks.length === 0 ? (
//                   <div className="text-center py-12 text-muted-foreground">
//                     <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-20" />
//                     <p>No feedback found</p>
//                   </div>
//                 ) : (
//                   <div className="overflow-x-auto">
//                     <table className="w-full min-w-[700px]">
//                       <thead>
//                         <tr className="border-b border-border bg-muted/30">
//                           {['Rating', 'Comment', 'Order / Item', 'Table', 'Date & Time'].map(h => (
//                             <th key={h} className="p-3 sm:p-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider text-left">{h}</th>
//                           ))}
//                         </tr>
//                       </thead>
//                       <tbody className="divide-y divide-border">
//                         {filteredFeedbacks.map(f => (
//                           <tr key={f.id} className="hover:bg-muted/20 transition-colors">
//                             <td className="p-3 sm:p-4">
//                               <div className="flex items-center gap-0.5">
//                                 {Array.from({ length: 5 }).map((_, i) => (
//                                   <Star key={i} className={`h-4 w-4 ${i < f.rating ? 'text-accent fill-accent' : 'text-muted-foreground/30'}`} />
//                                 ))}
//                               </div>
//                               <span className="text-[10px] text-muted-foreground mt-0.5 block">
//                                 {['', 'Bad', 'Average', 'Good', 'Very Good', 'Excellent'][f.rating]}
//                               </span>
//                             </td>
//                             <td className="p-3 sm:p-4 text-sm text-foreground max-w-[300px]">{f.message || <span className="text-muted-foreground italic">No comment</span>}</td>
//                             <td className="p-3 sm:p-4">
//                               {f.orderId ? (
//                                 <div>
//                                   <Badge variant="outline" className="text-[10px] font-mono">{f.orderId}</Badge>
//                                   {f.itemName && <p className="text-[10px] text-muted-foreground mt-0.5">{f.itemName}</p>}
//                                 </div>
//                               ) : <span className="text-muted-foreground text-xs italic">General</span>}
//                             </td>
//                             <td className="p-3 sm:p-4"><Badge variant="outline" className="text-xs">Table {f.tableNumber}</Badge></td>
//                             <td className="p-3 sm:p-4 text-xs text-muted-foreground">{new Date(f.createdAt).toLocaleString()}</td>
//                           </tr>
//                         ))}
//                       </tbody>
//                     </table>
//                   </div>
//                 )}
//               </div>
//             </div>
//           )}

//           {/* Organization moved to its own role-based dashboard at /organization */}

//           {/* ===== STOCK MANAGEMENT ===== */}
//           {activeTab === 'stock' && (
//             <div className="space-y-6">
//               <h2 className="text-lg font-heading font-bold flex items-center gap-2"><Warehouse className="h-5 w-5 text-primary" /> Stock Management</h2>
//               <p className="text-xs text-muted-foreground">Set daily stock quantities. Items reaching 0 are marked Out of Stock across POS & Customer Menu.</p>
//               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
//                 {menuItems.map(item => {
//                   const qty = getStock(item.id);
//                   const isOut = qty === 0;
//                   return (
//                     <div key={item.id} className={`p-4 rounded-2xl bg-card border-2 cafe-shadow ${isOut ? 'border-destructive/30' : 'border-border'}`}>
//                       <div className="flex items-center gap-3 mb-3">
//                         <img src={item.image} alt={item.name} className="h-12 w-12 rounded-xl object-cover" />
//                         <div className="flex-1 min-w-0"><h4 className="text-sm font-semibold truncate">{item.name}</h4><p className="text-[10px] text-muted-foreground">{item.category}</p></div>
//                         {isOut && <Badge className="bg-destructive/10 text-destructive text-[10px]">Out of Stock</Badge>}
//                       </div>
//                       <div className="flex items-center gap-2">
//                         <Label className="text-xs">Qty:</Label>
//                         <Input type="number" value={qty === -1 ? '' : qty} placeholder="Unlimited"
//                           onChange={e => setStock(item.id, e.target.value === '' ? -1 : Number(e.target.value), user?.name || 'admin')}
//                           className="h-8 rounded-xl text-sm flex-1" min={0} />
//                         <Button size="sm" variant="outline" className="h-8 rounded-lg text-[10px]" onClick={() => setStock(item.id, -1, user?.name || 'admin')}>∞</Button>
//                       </div>
//                       {qty !== -1 && <p className="text-[10px] text-muted-foreground mt-1">Current: {qty} units</p>}
//                     </div>
//                   );
//                 })}
//               </div>
//             </div>
//           )}

//           {/* ===== RESERVATIONS ===== */}
//           {activeTab === 'reservations' && (
//             <div className="space-y-6">
//               <div className="flex items-center justify-between flex-wrap gap-3">
//                 <h2 className="text-lg font-heading font-bold flex items-center gap-2"><BookOpen className="h-5 w-5 text-primary" /> Reservation Engine</h2>
//                 <Button className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-xl" onClick={() => setShowAddRes(true)}><Plus className="h-4 w-4 mr-1" /> New Reservation</Button>
//               </div>
//               {/* Config */}
//               <div className="rounded-2xl bg-card border border-border cafe-shadow p-4 space-y-3">
//                 <h3 className="font-heading font-bold text-sm">Booking Configuration</h3>
//                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
//                   {[
//                     { key: 'tableBookingEnabled' as const, label: 'Table Reservations', icon: '🪑' },
//                     { key: 'eventBookingEnabled' as const, label: 'Event Slots', icon: '🎉' },
//                     { key: 'venueBookingEnabled' as const, label: 'Full Venue', icon: '🏛️' },
//                   ].map(m => (
//                     <div key={m.key} className="flex items-center justify-between p-3 rounded-xl border border-border">
//                       <span className="text-sm">{m.icon} {m.label}</span>
//                       <Switch checked={resConfig[m.key]} onCheckedChange={v => updateResConfig({ [m.key]: v })} />
//                     </div>
//                   ))}
//                 </div>
//               </div>
//               {/* Reservations List */}
//               <div className="rounded-2xl bg-card border border-border cafe-shadow overflow-hidden">
//                 <div className="p-4 border-b border-border"><h3 className="font-heading font-bold">All Reservations</h3></div>
//                 <div className="overflow-x-auto">
//                   <table className="w-full min-w-[700px]">
//                     <thead><tr className="border-b border-border text-left">
//                       {['ID', 'Type', 'Customer', 'Date', 'Time', 'Duration', 'Guests', 'Table', 'Status', 'Actions'].map(h => <th key={h} className="p-3 text-xs font-semibold text-muted-foreground">{h}</th>)}
//                     </tr></thead>
//                     <tbody className="divide-y divide-border">
//                       {reservations.map(r => (
//                         <tr key={r.id} className="hover:bg-muted/30">
//                           <td className="p-3 font-mono text-sm">{r.id}</td>
//                           <td className="p-3"><Badge variant="outline" className="text-[10px] capitalize">{r.type}</Badge></td>
//                           <td className="p-3 text-sm">{r.customerName}</td>
//                           <td className="p-3 text-sm">{r.date}</td>
//                           <td className="p-3 text-sm">{r.time}</td>
//                           <td className="p-3 text-sm">{r.duration}h</td>
//                           <td className="p-3 text-sm">{r.headcount}</td>
//                           <td className="p-3 text-sm">{r.tableNumber || '-'}</td>
//                           <td className="p-3"><Badge className={`text-[10px] ${r.status === 'confirmed' ? 'bg-success/10 text-success' : r.status === 'cancelled' ? 'bg-destructive/10 text-destructive' : 'bg-accent/10 text-accent'}`}>{r.status}</Badge></td>
//                           <td className="p-3">
//                             <div className="flex gap-1">
//                               {r.status === 'pending' && <Button size="sm" className="h-6 px-2 rounded-lg bg-success/90 text-success-foreground text-[10px]" onClick={() => { updateReservationStatus(r.id, 'confirmed'); toast.success('Confirmed!'); }}>Confirm</Button>}
//                               {r.status !== 'cancelled' && <Button size="sm" variant="outline" className="h-6 px-2 rounded-lg text-destructive text-[10px]" onClick={() => { updateReservationStatus(r.id, 'cancelled'); toast.success('Cancelled'); }}>Cancel</Button>}
//                             </div>
//                           </td>
//                         </tr>
//                       ))}
//                     </tbody>
//                   </table>
//                 </div>
//               </div>
//             </div>
//           )}

//           {/* ===== NEW RESERVATION DIALOG (Admin) ===== */}
//           <AnimatePresence>
//             {showAddRes && (
//               <>
//                 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
//                   className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-50" onClick={() => setShowAddRes(false)} />
//                 <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
//                   className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg bg-card rounded-2xl border border-border cafe-shadow-lg p-6 max-h-[90vh] overflow-y-auto m-4">
//                   <div className="flex items-center justify-between mb-4">
//                     <h3 className="text-lg font-heading font-bold flex items-center gap-2"><BookOpen className="h-5 w-5 text-primary" /> New Reservation</h3>
//                     <button onClick={() => setShowAddRes(false)} className="h-8 w-8 rounded-xl bg-muted flex items-center justify-center"><X className="h-4 w-4" /></button>
//                   </div>
//                   <div className="space-y-3">
//                     <div>
//                       <Label className="text-xs">Booking Type</Label>
//                       <Select value={newRes.type} onValueChange={v => setNewRes({ ...newRes, type: v as BookingType })}>
//                         <SelectTrigger className="rounded-xl mt-1"><SelectValue /></SelectTrigger>
//                         <SelectContent>
//                           {resConfig.tableBookingEnabled && <SelectItem value="table">🪑 Table</SelectItem>}
//                           {resConfig.eventBookingEnabled && <SelectItem value="event">🎉 Event Slot</SelectItem>}
//                           {resConfig.venueBookingEnabled && <SelectItem value="venue">🏛️ Full Venue</SelectItem>}
//                         </SelectContent>
//                       </Select>
//                     </div>
//                     <div className="grid grid-cols-2 gap-3">
//                       <div><Label className="text-xs">Customer Name</Label><Input value={newRes.customerName} onChange={e => setNewRes({ ...newRes, customerName: e.target.value })} placeholder="Full name" className="mt-1 rounded-xl" /></div>
//                       <div><Label className="text-xs">Phone</Label><Input value={newRes.customerPhone} onChange={e => setNewRes({ ...newRes, customerPhone: e.target.value })} placeholder="+91-..." className="mt-1 rounded-xl" /></div>
//                     </div>
//                     <div className="grid grid-cols-2 gap-3">
//                       <div><Label className="text-xs">Date</Label><Input type="date" value={newRes.date} onChange={e => setNewRes({ ...newRes, date: e.target.value })} className="mt-1 rounded-xl" /></div>
//                       <div><Label className="text-xs">Time</Label><Input type="time" value={newRes.time} onChange={e => setNewRes({ ...newRes, time: e.target.value })} className="mt-1 rounded-xl" /></div>
//                     </div>
//                     <div className="grid grid-cols-3 gap-3">
//                       <div><Label className="text-xs">Duration (h)</Label><Input type="number" min={1} max={8} value={newRes.duration} onChange={e => setNewRes({ ...newRes, duration: Number(e.target.value) })} className="mt-1 rounded-xl" /></div>
//                       <div><Label className="text-xs">Headcount</Label><Input type="number" min={1} value={newRes.headcount} onChange={e => setNewRes({ ...newRes, headcount: Number(e.target.value) })} className="mt-1 rounded-xl" /></div>
//                       {newRes.type === 'table' && (
//                         <div><Label className="text-xs">Table #</Label><Input type="number" min={1} max={12} value={newRes.tableNumber} onChange={e => setNewRes({ ...newRes, tableNumber: Number(e.target.value) })} className="mt-1 rounded-xl" /></div>
//                       )}
//                     </div>
//                     <div>
//                       <Label className="text-xs">Description / Purpose <span className="text-destructive">*</span></Label>
//                       <Input value={newRes.description} onChange={e => setNewRes({ ...newRes, description: e.target.value })} placeholder='e.g. "Wedding photography", "Painting workshop"' className="mt-1 rounded-xl" />
//                     </div>
//                     <div>
//                       <Label className="text-xs">Special Notes <span className="text-muted-foreground">(optional)</span></Label>
//                       <Input value={newRes.specialRequirements} onChange={e => setNewRes({ ...newRes, specialRequirements: e.target.value })} placeholder="e.g. Birthday cake setup, projector" className="mt-1 rounded-xl" />
//                     </div>
//                     <div className="flex gap-2 pt-2">
//                       <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setShowAddRes(false)}>Cancel</Button>
//                       <Button className="flex-1 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-xl"
//                         onClick={() => {
//                           if (!newRes.customerName || !newRes.date || !newRes.time) { toast.error('Name, date and time required'); return; }
//                           if (!newRes.description.trim()) { toast.error('Description / purpose is required'); return; }
//                           const result = addReservation({
//                             type: newRes.type, date: newRes.date, time: newRes.time, duration: newRes.duration,
//                             headcount: newRes.headcount, customerName: newRes.customerName, customerPhone: newRes.customerPhone,
//                             description: newRes.description, specialRequirements: newRes.specialRequirements,
//                             ...(newRes.type === 'table' ? { tableNumber: newRes.tableNumber } : {})
//                           });
//                           if (result.success) {
//                             toast.success(result.message);
//                             setShowAddRes(false);
//                             setNewRes({ type: 'table', date: '', time: '', duration: 2, headcount: 2, tableNumber: 1, customerName: '', customerPhone: '', description: '', specialRequirements: '' });
//                           } else {
//                             toast.error(result.message);
//                           }
//                         }}>
//                         <CheckCircle2 className="h-4 w-4 mr-1" /> Confirm Booking
//                       </Button>
//                     </div>
//                   </div>
//                 </motion.div>
//               </>
//             )}
//           </AnimatePresence>

//           {/* Translations tab removed — admin is English only */}

//           {/* ===== OPERATIONS (cash session, cashouts, issues, stock requests) ===== */}
//           {activeTab === 'ops' && (
//             <div className="max-w-5xl mx-auto">
//               <OpsPanel mode="admin" />
//             </div>
//           )}

//           {/* ===== SETTINGS ===== */}
//           {activeTab === 'settings' && (
//             <div className="space-y-6 max-w-3xl mx-auto">

//               {/* Branding */}
//               <div className="rounded-2xl bg-card border border-border cafe-shadow p-4 sm:p-6">
//                 <h3 className="font-heading font-bold text-foreground mb-4 text-sm sm:text-base">Branding</h3>
//                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
//                   <div>
//                     <Label className="text-sm">Logo</Label>
//                     <div className="mt-2 flex flex-col items-center gap-3">
//                       {logoPreview ? (
//                         <img src={logoPreview} alt="Logo preview" className="h-24 w-24 object-contain rounded-xl border border-border" />
//                       ) : (
//                         <div className="h-24 w-24 rounded-xl border-2 border-dashed border-border flex items-center justify-center">
//                           <Image className="h-8 w-8 text-muted-foreground/30" />
//                         </div>
//                       )}
//                       <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={e => handleFileUpload('logo', e)} />
//                       <Button variant="outline" size="sm" className="rounded-xl" onClick={() => logoInputRef.current?.click()}>
//                         <Upload className="h-3 w-3 mr-1" /> Upload Logo
//                       </Button>
//                     </div>
//                   </div>
//                   <div>
//                     <Label className="text-sm">Banner</Label>
//                     <div className="mt-2 flex flex-col items-center gap-3">
//                       {bannerPreview ? (
//                         <img src={bannerPreview} alt="Banner preview" className="w-full h-24 object-cover rounded-xl border border-border" />
//                       ) : (
//                         <div className="w-full h-24 rounded-xl border-2 border-dashed border-border flex items-center justify-center">
//                           <Image className="h-8 w-8 text-muted-foreground/30" />
//                         </div>
//                       )}
//                       <input ref={bannerInputRef} type="file" accept="image/*" className="hidden" onChange={e => handleFileUpload('banner', e)} />
//                       <Button variant="outline" size="sm" className="rounded-xl" onClick={() => bannerInputRef.current?.click()}>
//                         <Upload className="h-3 w-3 mr-1" /> Upload Banner
//                       </Button>
//                     </div>
//                   </div>
//                 </div>
//               </div>

//               {/* Business Details */}
//               <div className="rounded-2xl bg-card border border-border cafe-shadow p-4 sm:p-6 space-y-4">
//                 <h3 className="font-heading font-bold text-foreground text-sm sm:text-base">Business Details</h3>
//                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                   <div><Label>Cafe Name</Label><Input value={settingsForm.name} onChange={e => setSettingsForm({ ...settingsForm, name: e.target.value })} className="mt-1 rounded-xl" /></div>
//                   <div><Label>Phone</Label><Input value={settingsForm.phone} onChange={e => setSettingsForm({ ...settingsForm, phone: e.target.value })} className="mt-1 rounded-xl" /></div>
//                   <div className="sm:col-span-2"><Label>Address</Label><Input value={settingsForm.address} onChange={e => setSettingsForm({ ...settingsForm, address: e.target.value })} className="mt-1 rounded-xl" /></div>
//                   <div><Label>Currency</Label><Input value={settingsForm.currency} onChange={e => setSettingsForm({ ...settingsForm, currency: e.target.value })} className="mt-1 rounded-xl" /></div>
//                 </div>
//               </div>

//               {/* Tax Configuration */}
//               <div className="rounded-2xl bg-card border border-border cafe-shadow p-4 sm:p-6 space-y-4">
//                 <h3 className="font-heading font-bold text-foreground text-sm sm:text-base flex items-center gap-2">
//                   <DollarSign className="h-5 w-5 text-primary" /> Tax Configuration (GST)
//                 </h3>
//                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
//                   <div><Label>GST Number</Label><Input value={settingsForm.gstNumber} onChange={e => setSettingsForm({ ...settingsForm, gstNumber: e.target.value })} className="mt-1 rounded-xl" /></div>
//                   <div><Label>CGST Rate (%)</Label><Input type="number" value={settingsForm.cgstRate} onChange={e => { const v = Number(e.target.value); setSettingsForm({ ...settingsForm, cgstRate: v, gstRate: v + settingsForm.sgstRate }); }} className="mt-1 rounded-xl" step={0.5} /></div>
//                   <div><Label>SGST Rate (%)</Label><Input type="number" value={settingsForm.sgstRate} onChange={e => { const v = Number(e.target.value); setSettingsForm({ ...settingsForm, sgstRate: v, gstRate: settingsForm.cgstRate + v }); }} className="mt-1 rounded-xl" step={0.5} /></div>
//                 </div>
//                 <p className="text-xs text-muted-foreground">Total GST: <strong>{settingsForm.cgstRate + settingsForm.sgstRate}%</strong> (CGST {settingsForm.cgstRate}% + SGST {settingsForm.sgstRate}%)</p>
//               </div>

//               {/* Operational Hours */}
//               <div className="rounded-2xl bg-card border border-border cafe-shadow p-4 sm:p-6 space-y-4">
//                 <h3 className="font-heading font-bold text-foreground text-sm sm:text-base flex items-center gap-2">
//                   <Clock className="h-5 w-5 text-info" /> Operational Hours
//                 </h3>
//                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                   <div><Label>Opening Time</Label><Input type="time" value={settingsForm.openingTime} onChange={e => setSettingsForm({ ...settingsForm, openingTime: e.target.value })} className="mt-1 rounded-xl" /></div>
//                   <div><Label>Closing Time</Label><Input type="time" value={settingsForm.closingTime} onChange={e => setSettingsForm({ ...settingsForm, closingTime: e.target.value })} className="mt-1 rounded-xl" /></div>
//                 </div>
//                 <div>
//                   <Label className="text-sm">Operational Days</Label>
//                   <div className="flex flex-wrap gap-2 mt-2">
//                     {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
//                       <button key={day} onClick={() => {
//                         const days = settingsForm.operationalDays || [];
//                         setSettingsForm({ ...settingsForm, operationalDays: days.includes(day) ? days.filter(d => d !== day) : [...days, day] });
//                       }}
//                         className={`px-3 py-1.5 rounded-xl text-xs font-medium border-2 transition-all ${
//                           (settingsForm.operationalDays || []).includes(day) ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground'
//                         }`}>
//                         {day}
//                       </button>
//                     ))}
//                   </div>
//                 </div>
//               </div>

//               {/* Payment Modes */}
//               <div className="rounded-2xl bg-card border border-border cafe-shadow p-4 sm:p-6 space-y-4">
//                 <h3 className="font-heading font-bold text-foreground text-sm sm:text-base flex items-center gap-2">
//                   <CreditCard className="h-5 w-5 text-accent" /> Payment Modes
//                 </h3>
//                 <p className="text-xs text-muted-foreground">Select which payment flow is available across Customer and Counter panels.</p>
//                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
//                   {([
//                     { id: 'prepayment' as const, label: 'Pre-Payment', desc: 'Pay before ordering', icon: '💳' },
//                     { id: 'postpayment' as const, label: 'Post-Payment', desc: 'Pay after eating', icon: '🧾' },
//                     { id: 'both' as const, label: 'Both', desc: 'Customer can choose', icon: '🔄' },
//                   ]).map(mode => (
//                     <button key={mode.id} onClick={() => setSettingsForm({ ...settingsForm, paymentMode: mode.id })}
//                       className={`p-4 rounded-xl border-2 text-left transition-all relative ${settingsForm.paymentMode === mode.id ? 'border-primary bg-primary/5 glow-primary' : 'border-border hover:border-primary/30'}`}>
//                       {settingsForm.paymentMode === mode.id && (
//                         <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-success flex items-center justify-center">
//                           <Check className="h-4 w-4 text-success-foreground" />
//                         </div>
//                       )}
//                       <span className="text-2xl mb-2 block">{mode.icon}</span>
//                       <p className="text-sm font-medium">{mode.label}</p>
//                       <p className="text-[10px] text-muted-foreground">{mode.desc}</p>
//                     </button>
//                   ))}
//                 </div>
//               </div>

//               {/* Post-Payment Order Control */}
//               <div className="rounded-2xl bg-card border border-border cafe-shadow p-4 sm:p-6 space-y-4">
//                 <div className="flex items-center justify-between">
//                   <div>
//                     <h3 className="font-heading font-bold text-foreground text-sm sm:text-base flex items-center gap-2">
//                       🔀 Post-Payment Order Control
//                     </h3>
//                     <p className="text-xs text-muted-foreground mt-1">When ON, post-payment orders go directly to Kitchen (KDS), bypassing Counter review. Does not affect prepaid/online orders.</p>
//                   </div>
//                   <Switch checked={settingsForm.postPaymentDirectToKDS} onCheckedChange={v => setSettingsForm({ ...settingsForm, postPaymentDirectToKDS: v })} />
//                 </div>
//                 <div className={`px-3 py-2 rounded-xl text-xs ${settingsForm.postPaymentDirectToKDS ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>
//                   {settingsForm.postPaymentDirectToKDS ? '✅ Post-payment food orders route directly to Kitchen' : '⏸️ Post-payment food orders go to Counter first for review'}
//                 </div>
//               </div>

//               {/* User Feedback Toggle */}
//               <div className="rounded-2xl bg-card border border-border cafe-shadow p-4 sm:p-6 space-y-4">
//                 <div className="flex items-center justify-between">
//                   <div>
//                     <h3 className="font-heading font-bold text-foreground text-sm sm:text-base flex items-center gap-2">
//                       ⭐ User Feedback Textbox
//                     </h3>
//                     <p className="text-xs text-muted-foreground mt-1">When enabled, customers can submit feedback and star ratings from the Customer Panel.</p>
//                   </div>
//                   <Switch checked={settingsForm.feedbackEnabled} onCheckedChange={v => setSettingsForm({ ...settingsForm, feedbackEnabled: v })} />
//                 </div>
//               </div>

//               {/* Offers & Discounts */}
//               <div className="rounded-2xl bg-card border border-border cafe-shadow p-4 sm:p-6 space-y-4">
//                 <div className="flex items-center justify-between">
//                   <h3 className="font-heading font-bold text-foreground text-sm sm:text-base flex items-center gap-2">
//                     <Sparkles className="h-5 w-5 text-accent" /> Offers & Discounts
//                   </h3>
//                   <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setShowAddDiscount(true)}>
//                     <Plus className="h-4 w-4 mr-1" /> Add Discount
//                   </Button>
//                 </div>
//                 <div className="space-y-3">
//                   {discounts.map(d => (
//                     <div key={d.id} className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/20">
//                       <div className="flex items-center gap-3">
//                         <Switch checked={d.active} onCheckedChange={() => toggleDiscount(d.id)} />
//                         <div>
//                           <p className="text-sm font-medium">{d.name}</p>
//                           <p className="text-[10px] text-muted-foreground">
//                             {d.type === 'percentage' ? `${d.value}% off` : `₹${d.value} off`} • {d.scope === 'global' ? 'All items' : `Item: ${menuItems.find(i => i.id === d.itemId)?.name || d.itemId}`}
//                           </p>
//                         </div>
//                       </div>
//                       <div className="flex items-center gap-1">
//                         <Button variant="ghost" size="sm" className="text-primary h-8 w-8" onClick={() => {
//                           setEditingDiscount(d.id);
//                           setNewDiscount({ name: d.name, type: d.type, value: d.value, scope: d.scope, itemId: d.itemId, active: d.active });
//                         }}>
//                           <Edit2 className="h-3 w-3" />
//                         </Button>
//                         <Button variant="ghost" size="sm" className="text-destructive h-8 w-8" onClick={() => deleteDiscount(d.id)}>
//                           <Trash2 className="h-3 w-3" />
//                         </Button>
//                       </div>
//                     </div>
//                   ))}
//                   {discounts.length === 0 && <p className="text-center text-muted-foreground py-4 text-sm">No discounts configured</p>}
//                 </div>
//               </div>

//               <Button onClick={handleSaveSettings} className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground w-full sm:w-auto rounded-xl"><Save className="h-4 w-4 mr-1" /> Save All Settings</Button>
//             </div>
//           )}
//         </div>
//       </main>

//       {/* ===== DIALOGS (all centered) ===== */}

//       {/* QR Code Dialog */}
//       <AnimatePresence>
//         {viewingQR !== null && (
//           <>
//             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-50" onClick={() => setViewingQR(null)} />
//             <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
//               className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm z-50 m-4 sm:m-0">
//               <div className="bg-background rounded-2xl border border-border p-6 cafe-shadow-lg text-center">
//                 <h3 className="font-heading font-bold text-lg mb-4">Table {viewingQR} — QR Code</h3>
//                 <div className="p-6 bg-card rounded-2xl border border-border inline-block">
//                   <QRCodeSVG value={`${baseUrl}/menu?table=${viewingQR}`} size={200} level="H" />
//                 </div>
//                 <p className="text-xs text-muted-foreground mt-3 break-all">{baseUrl}/menu?table={viewingQR}</p>
//                 <div className="flex gap-2 mt-4">
//                   <Button variant="outline" className="flex-1 rounded-xl text-xs sm:text-sm" onClick={() => window.print()}><Printer className="h-4 w-4 mr-1" /> Print</Button>
//                   <Button className="flex-1 rounded-xl text-xs sm:text-sm" onClick={() => setViewingQR(null)}>Close</Button>
//                 </div>
//               </div>
//             </motion.div>
//           </>
//         )}
//       </AnimatePresence>

//       {/* Order Detail Dialog — Only Mark Served when ready */}
//       <AnimatePresence>
//         {detailOrder && (
//           <>
//             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-50" onClick={() => setViewingOrder(null)} />
//             <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
//               className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-50 m-4 sm:m-0">
//               <div className="bg-background rounded-2xl border border-border p-5 sm:p-6 cafe-shadow-lg max-h-[90vh] overflow-y-auto">
//                 <div className="flex items-center justify-between mb-4">
//                   <h3 className="font-heading font-bold text-lg">Order {detailOrder.id}</h3>
//                   <button onClick={() => setViewingOrder(null)} className="h-8 w-8 rounded-xl bg-muted flex items-center justify-center"><X className="h-4 w-4" /></button>
//                 </div>
//                 <div className="space-y-3">
//                   <div className="flex items-center gap-3 flex-wrap">
//                     <Badge variant="outline">Table {detailOrder.tableNumber}</Badge>
//                     <span className={`px-2.5 py-1 rounded-lg text-xs font-medium capitalize ${statusColor(detailOrder.status)}`}>{detailOrder.status}</span>
//                     <Badge variant="outline" className="text-[10px] uppercase">{detailOrder.paymentMethod}</Badge>
//                     <span className="text-xs text-muted-foreground ml-auto">{new Date(detailOrder.createdAt).toLocaleString()}</span>
//                   </div>
//                   <div className="bg-card rounded-xl p-4 border border-border space-y-2">
//                     {detailOrder.items.map(item => (
//                       <div key={item.id} className="flex justify-between text-sm"><span>{item.quantity}x {item.name}</span><span className="font-bold">₹{item.price * item.quantity}</span></div>
//                     ))}
//                     <hr className="border-border" />
//                     <div className="flex justify-between text-sm"><span>Subtotal</span><span>₹{detailOrder.total.toFixed(0)}</span></div>
//                     <div className="flex justify-between text-sm"><span>CGST (2.5%)</span><span>₹{(detailOrder.tax / 2).toFixed(0)}</span></div>
//                     <div className="flex justify-between text-sm"><span>SGST (2.5%)</span><span>₹{(detailOrder.tax / 2).toFixed(0)}</span></div>
//                     <div className="flex justify-between font-bold text-base"><span>Total</span><span>₹{detailOrder.grandTotal.toFixed(0)}</span></div>
//                   </div>
//                   {detailOrder.status === 'ready' && (
//                     <Button size="sm" className="w-full bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-xl" onClick={() => { updateOrderStatus(detailOrder.id, 'served'); setViewingOrder(null); toast.success('Marked as served'); }}>
//                       <Check className="h-4 w-4 mr-1" /> Mark Served
//                     </Button>
//                   )}
//                 </div>
//               </div>
//             </motion.div>
//           </>
//         )}
//       </AnimatePresence>

//       {/* Add Menu Item Dialog */}
//       <AnimatePresence>
//         {showAddItem && (
//           <>
//             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-50" onClick={() => setShowAddItem(false)} />
//             <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
//               className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg z-50 m-4 sm:m-0">
//               <div className="bg-background rounded-2xl border border-border p-5 sm:p-6 cafe-shadow-lg max-h-[90vh] overflow-y-auto">
//                 <div className="flex items-center justify-between mb-4">
//                   <h3 className="font-heading font-bold text-lg">Add New Menu Item</h3>
//                   <button onClick={() => setShowAddItem(false)} className="h-8 w-8 rounded-xl bg-muted flex items-center justify-center"><X className="h-4 w-4" /></button>
//                 </div>
//                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                   <div><Label>Name</Label><Input value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })} placeholder="Item name" className="mt-1 rounded-xl" /></div>
//                   <div><Label>Price (₹)</Label><Input type="number" value={newItem.price || ''} onChange={e => setNewItem({ ...newItem, price: Number(e.target.value) })} placeholder="0" className="mt-1 rounded-xl" /></div>
//                   <div className="sm:col-span-2"><Label>Description</Label><Textarea value={newItem.description} onChange={e => setNewItem({ ...newItem, description: e.target.value })} placeholder="Description" className="mt-1 rounded-xl" /></div>
//                   <div><Label>Category</Label><Select value={newItem.category} onValueChange={v => setNewItem({ ...newItem, category: v })}><SelectTrigger className="mt-1 rounded-xl"><SelectValue /></SelectTrigger><SelectContent>{allCats.filter(c => c !== 'All').map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
//                   <div><Label>Image URL</Label><Input value={newItem.image} onChange={e => setNewItem({ ...newItem, image: e.target.value })} placeholder="https://..." className="mt-1 rounded-xl" /></div>
//                   {/* Type: Food / Drinks */}
//                   <div className="sm:col-span-2">
//                     <Label className="mb-2 block">Type</Label>
//                     <div className="flex gap-3">
//                       {(['food', 'drink'] as const).map(t => (
//                         <button key={t} onClick={() => setNewItem({ ...newItem, type: t })}
//                           className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 text-sm font-medium transition-all ${newItem.type === t ? 'border-primary bg-primary/5 text-foreground' : 'border-border text-muted-foreground hover:border-primary/30'}`}>
//                           {t === 'food' ? '🍽️ Food' : '🥤 Drinks'}
//                         </button>
//                       ))}
//                     </div>
//                   </div>
//                   <div className="flex items-center gap-4 sm:col-span-2">
//                     <div className="flex items-center gap-2"><Switch checked={newItem.vegetarian} onCheckedChange={v => setNewItem({ ...newItem, vegetarian: v })} /><Label>Vegetarian</Label></div>
//                     <div className="flex items-center gap-2"><Switch checked={!newItem.vegetarian} onCheckedChange={v => setNewItem({ ...newItem, vegetarian: !v })} /><Label>Non-Veg</Label></div>
//                   </div>
//                 </div>
//                 <Button onClick={handleAddItem} className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground mt-4 w-full rounded-xl"><Plus className="h-4 w-4 mr-1" /> Add Item</Button>
//               </div>
//             </motion.div>
//           </>
//         )}
//       </AnimatePresence>

//       {/* Edit Menu Item Dialog */}
//       <AnimatePresence>
//         {editingItem && (
//           <>
//             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-50" onClick={() => setEditingItem(null)} />
//             <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
//               className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg z-50 m-4 sm:m-0">
//               <div className="bg-background rounded-2xl border border-border p-5 sm:p-6 cafe-shadow-lg max-h-[90vh] overflow-y-auto">
//                 <div className="flex items-center justify-between mb-4">
//                   <h3 className="font-heading font-bold text-lg">Edit Menu Item</h3>
//                   <button onClick={() => setEditingItem(null)} className="h-8 w-8 rounded-xl bg-muted flex items-center justify-center"><X className="h-4 w-4" /></button>
//                 </div>
//                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                   <div><Label>Name</Label><Input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className="mt-1 rounded-xl" /></div>
//                   <div><Label>Price (₹)</Label><Input type="number" value={editForm.price} onChange={e => setEditForm({ ...editForm, price: Number(e.target.value) })} className="mt-1 rounded-xl" /></div>
//                   <div className="sm:col-span-2"><Label>Description</Label><Textarea value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} className="mt-1 rounded-xl" /></div>
//                   <div><Label>Category</Label><Select value={editForm.category} onValueChange={v => setEditForm({ ...editForm, category: v })}><SelectTrigger className="mt-1 rounded-xl"><SelectValue /></SelectTrigger><SelectContent>{allCats.filter(c => c !== 'All').map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
//                   <div><Label>Image URL</Label><Input value={editForm.image} onChange={e => setEditForm({ ...editForm, image: e.target.value })} className="mt-1 rounded-xl" /></div>
//                 </div>
//                 <Button onClick={() => saveEdit(editingItem)} className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground mt-4 w-full rounded-xl"><Save className="h-4 w-4 mr-1" /> Save Changes</Button>
//               </div>
//             </motion.div>
//           </>
//         )}
//       </AnimatePresence>

//       {/* Delete Menu Item Dialog */}
//       <AnimatePresence>
//         {showDeleteConfirm && (
//           <>
//             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-50" onClick={() => setShowDeleteConfirm(null)} />
//             <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
//               className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xs z-50 m-4 sm:m-0">
//               <div className="bg-background rounded-2xl border border-border p-6 cafe-shadow-lg text-center">
//                 <div className="h-14 w-14 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-3"><Trash2 className="h-6 w-6 text-destructive" /></div>
//                 <h3 className="font-heading font-bold text-lg mb-1">Delete Item?</h3>
//                 <p className="text-sm text-muted-foreground mb-4">This action cannot be undone.</p>
//                 <div className="flex gap-2">
//                   <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setShowDeleteConfirm(null)}>Cancel</Button>
//                   <Button variant="destructive" className="flex-1 rounded-xl" onClick={() => handleDeleteItem(showDeleteConfirm)}>Delete</Button>
//                 </div>
//               </div>
//             </motion.div>
//           </>
//         )}
//       </AnimatePresence>

//       {/* Add Category Dialog */}
//       <AnimatePresence>
//         {showAddCategory && (
//           <>
//             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-50" onClick={() => setShowAddCategory(false)} />
//             <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
//               className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm z-50 m-4 sm:m-0">
//               <div className="bg-background rounded-2xl border border-border p-6 cafe-shadow-lg">
//                 <div className="flex items-center justify-between mb-4">
//                   <h3 className="font-heading font-bold text-lg">Add Category</h3>
//                   <button onClick={() => setShowAddCategory(false)} className="h-8 w-8 rounded-xl bg-muted flex items-center justify-center"><X className="h-4 w-4" /></button>
//                 </div>
//                 <div>
//                   <Label>Category Name</Label>
//                   <Input value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} placeholder="e.g. Smoothies" className="mt-1 rounded-xl" />
//                 </div>
//                 <Button onClick={handleAddCategory} className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground mt-4 w-full rounded-xl"><Plus className="h-4 w-4 mr-1" /> Add Category</Button>
//               </div>
//             </motion.div>
//           </>
//         )}
//       </AnimatePresence>

//       {/* Add/Edit Staff Dialog */}
//       <AnimatePresence>
//         {(showAddStaff || editingStaff) && (
//           <>
//             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-50" onClick={() => { setShowAddStaff(false); setEditingStaff(null); }} />
//             <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
//               className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg z-50 m-4 sm:m-0">
//               <div className="bg-background rounded-2xl border border-border p-5 sm:p-6 cafe-shadow-lg max-h-[90vh] overflow-y-auto">
//                 <div className="flex items-center justify-between mb-4">
//                   <h3 className="font-heading font-bold text-lg">{editingStaff ? 'Edit Staff Member' : 'Add New Staff'}</h3>
//                   <button onClick={() => { setShowAddStaff(false); setEditingStaff(null); }} className="h-8 w-8 rounded-xl bg-muted flex items-center justify-center"><X className="h-4 w-4" /></button>
//                 </div>
//                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                   <div><Label>Full Name</Label><Input value={staffForm.name} onChange={e => setStaffForm({ ...staffForm, name: e.target.value })} className="mt-1 rounded-xl" /></div>
//                   <div><Label>Role</Label><Select value={staffForm.role} onValueChange={v => setStaffForm({ ...staffForm, role: v })}><SelectTrigger className="mt-1 rounded-xl"><SelectValue /></SelectTrigger><SelectContent>{roles.map(r => <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>)}</SelectContent></Select></div>
//                   <div><Label>Shift</Label><Select value={staffForm.shift} onValueChange={v => setStaffForm({ ...staffForm, shift: v })}><SelectTrigger className="mt-1 rounded-xl"><SelectValue /></SelectTrigger><SelectContent>{['Morning', 'Evening', 'Full Day'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
//                   <div><Label>Email</Label><Input type="email" value={staffForm.email} onChange={e => setStaffForm({ ...staffForm, email: e.target.value })} className="mt-1 rounded-xl" /></div>
//                   <div><Label>Phone</Label><Input value={staffForm.phone} onChange={e => setStaffForm({ ...staffForm, phone: e.target.value })} className="mt-1 rounded-xl" /></div>
//                   <div className="flex items-center gap-2 pt-6"><Switch checked={staffForm.status === 'active'} onCheckedChange={v => setStaffForm({ ...staffForm, status: v ? 'active' : 'inactive' })} /><Label>Active</Label></div>
//                 </div>
//                 <Button onClick={() => editingStaff ? saveStaffEdit(editingStaff) : handleAddStaff()} className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground mt-4 w-full rounded-xl">
//                   {editingStaff ? <><Save className="h-4 w-4 mr-1" /> Save</> : <><Plus className="h-4 w-4 mr-1" /> Add Staff</>}
//                 </Button>
//               </div>
//             </motion.div>
//           </>
//         )}
//       </AnimatePresence>

//       {/* Delete Staff Dialog */}
//       <AnimatePresence>
//         {showDeleteStaff && (
//           <>
//             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-50" onClick={() => setShowDeleteStaff(null)} />
//             <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
//               className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xs z-50 m-4 sm:m-0">
//               <div className="bg-background rounded-2xl border border-border p-6 cafe-shadow-lg text-center">
//                 <div className="h-14 w-14 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-3"><Trash2 className="h-6 w-6 text-destructive" /></div>
//                 <h3 className="font-heading font-bold text-lg mb-1">Remove Staff?</h3>
//                 <p className="text-sm text-muted-foreground mb-4">This will remove them from the system.</p>
//                 <div className="flex gap-2">
//                   <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setShowDeleteStaff(null)}>Cancel</Button>
//                   <Button variant="destructive" className="flex-1 rounded-xl" onClick={() => confirmDeleteStaff(showDeleteStaff)}>Remove</Button>
//                 </div>
//               </div>
//             </motion.div>
//           </>
//         )}
//       </AnimatePresence>

//       {/* Add Role Dialog */}
//       <AnimatePresence>
//         {showAddRole && (
//           <>
//             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-50" onClick={() => setShowAddRole(false)} />
//             <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
//               className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-50 m-4 sm:m-0">
//               <div className="bg-background rounded-2xl border border-border p-6 cafe-shadow-lg">
//                 <div className="flex items-center justify-between mb-4">
//                   <h3 className="font-heading font-bold text-lg">Add New Role</h3>
//                   <button onClick={() => setShowAddRole(false)} className="h-8 w-8 rounded-xl bg-muted flex items-center justify-center"><X className="h-4 w-4" /></button>
//                 </div>
//                 <div className="space-y-4">
//                   <div>
//                     <Label>Role Name</Label>
//                     <Input value={newRoleName} onChange={e => setNewRoleName(e.target.value)} placeholder="e.g. Supervisor" className="mt-1 rounded-xl" />
//                   </div>
//                   <div>
//                     <Label className="text-sm">Permissions</Label>
//                     <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
//                       {allPermissions.map(p => (
//                         <label key={p} className="flex items-center gap-2 text-xs cursor-pointer p-2 rounded-lg hover:bg-muted/50">
//                           <input type="checkbox" checked={newRolePermissions.includes(p)} onChange={e => {
//                             setNewRolePermissions(e.target.checked ? [...newRolePermissions, p] : newRolePermissions.filter(x => x !== p));
//                           }} className="rounded" />
//                           {p.replace(/_/g, ' ')}
//                         </label>
//                       ))}
//                     </div>
//                   </div>
//                 </div>
//                 <Button onClick={handleAddRole} className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground mt-4 w-full rounded-xl"><Plus className="h-4 w-4 mr-1" /> Add Role</Button>
//               </div>
//             </motion.div>
//           </>
//         )}
//       </AnimatePresence>

//       {/* Add Table Dialog */}
//       <AnimatePresence>
//         {showAddTable && (
//           <>
//             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-50" onClick={() => setShowAddTable(false)} />
//             <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
//               className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm z-50 m-4 sm:m-0">
//               <div className="bg-background rounded-2xl border border-border p-6 cafe-shadow-lg">
//                 <div className="flex items-center justify-between mb-4">
//                   <h3 className="font-heading font-bold text-lg">Add New Table</h3>
//                   <button onClick={() => setShowAddTable(false)} className="h-8 w-8 rounded-xl bg-muted flex items-center justify-center"><X className="h-4 w-4" /></button>
//                 </div>
//                 <div className="space-y-4">
//                   <div><Label>Table Name</Label><Input value={tableForm.name} onChange={e => setTableForm({ ...tableForm, name: e.target.value })} placeholder="e.g. Patio 1" className="mt-1 rounded-xl" /></div>
//                   <div><Label>Seating Capacity</Label><Input type="number" value={tableForm.capacity} onChange={e => setTableForm({ ...tableForm, capacity: Number(e.target.value) })} className="mt-1 rounded-xl" min={1} max={20} /></div>
//                 </div>
//                 <Button onClick={handleAddTable} className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground mt-4 w-full rounded-xl"><Plus className="h-4 w-4 mr-1" /> Add Table</Button>
//               </div>
//             </motion.div>
//           </>
//         )}
//       </AnimatePresence>

//       {/* Edit Table Dialog */}
//       <AnimatePresence>
//         {editingTable !== null && (
//           <>
//             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-50" onClick={() => setEditingTable(null)} />
//             <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
//               className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm z-50 m-4 sm:m-0">
//               <div className="bg-background rounded-2xl border border-border p-6 cafe-shadow-lg">
//                 <div className="flex items-center justify-between mb-4">
//                   <h3 className="font-heading font-bold text-lg">Edit Table {editingTable}</h3>
//                   <button onClick={() => setEditingTable(null)} className="h-8 w-8 rounded-xl bg-muted flex items-center justify-center"><X className="h-4 w-4" /></button>
//                 </div>
//                 <div className="space-y-4">
//                   <div><Label>Table Name</Label><Input value={tableForm.name} onChange={e => setTableForm({ ...tableForm, name: e.target.value })} className="mt-1 rounded-xl" /></div>
//                   <div><Label>Seating Capacity</Label><Input type="number" value={tableForm.capacity} onChange={e => setTableForm({ ...tableForm, capacity: Number(e.target.value) })} className="mt-1 rounded-xl" min={1} max={20} /></div>
//                 </div>
//                 <Button onClick={() => handleEditTable(editingTable)} className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground mt-4 w-full rounded-xl"><Save className="h-4 w-4 mr-1" /> Save</Button>
//               </div>
//             </motion.div>
//           </>
//         )}
//       </AnimatePresence>

//       {/* Table Orders Dialog */}
//       <AnimatePresence>
//         {viewingTableOrders !== null && (
//           <>
//             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-50" onClick={() => setViewingTableOrders(null)} />
//             <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
//               className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-50 m-4 sm:m-0">
//               <div className="bg-background rounded-2xl border border-border p-5 sm:p-6 cafe-shadow-lg max-h-[90vh] overflow-y-auto">
//                 <div className="flex items-center justify-between mb-4">
//                   <h3 className="font-heading font-bold text-lg">Table {viewingTableOrders} Orders</h3>
//                   <button onClick={() => setViewingTableOrders(null)} className="h-8 w-8 rounded-xl bg-muted flex items-center justify-center"><X className="h-4 w-4" /></button>
//                 </div>
//                 <div className="space-y-3">
//                   {orders.filter(o => o.tableNumber === viewingTableOrders && !['paid', 'served'].includes(o.status)).map(o => (
//                     <div key={o.id} className="p-4 rounded-xl bg-card border border-border">
//                       <div className="flex items-center justify-between mb-2">
//                         <span className="font-mono font-bold text-sm">{o.id}</span>
//                         <span className={`px-2 py-0.5 rounded-lg text-xs capitalize ${statusColor(o.status)}`}>{o.status}</span>
//                       </div>
//                       {o.items.map(item => (
//                         <div key={item.id} className="flex justify-between text-xs text-muted-foreground"><span>{item.quantity}x {item.name}</span><span>₹{item.price * item.quantity}</span></div>
//                       ))}
//                       <div className="flex justify-between font-bold text-sm mt-2 pt-2 border-t border-border"><span>Total</span><span>₹{o.grandTotal.toFixed(0)}</span></div>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             </motion.div>
//           </>
//         )}
//       </AnimatePresence>
//       {/* Add Discount Dialog */}
//       <AnimatePresence>
//         {showAddDiscount && (
//           <>
//             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-50" onClick={() => setShowAddDiscount(false)} />
//             <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
//               className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-50 m-4 sm:m-0">
//               <div className="bg-background rounded-2xl border border-border p-6 cafe-shadow-lg">
//                 <div className="flex items-center justify-between mb-4">
//                   <h3 className="font-heading font-bold text-lg">Add Discount</h3>
//                   <button onClick={() => setShowAddDiscount(false)} className="h-8 w-8 rounded-xl bg-muted flex items-center justify-center"><X className="h-4 w-4" /></button>
//                 </div>
//                 <div className="space-y-4">
//                   <div><Label>Discount Name</Label><Input value={newDiscount.name} onChange={e => setNewDiscount({ ...newDiscount, name: e.target.value })} placeholder="e.g. Happy Hour 20%" className="mt-1 rounded-xl" /></div>
//                   <div className="grid grid-cols-2 gap-4">
//                     <div>
//                       <Label>Type</Label>
//                       <Select value={newDiscount.type} onValueChange={(v: 'percentage' | 'flat') => setNewDiscount({ ...newDiscount, type: v })}>
//                         <SelectTrigger className="mt-1 rounded-xl"><SelectValue /></SelectTrigger>
//                         <SelectContent><SelectItem value="percentage">Percentage (%)</SelectItem><SelectItem value="flat">Flat (₹)</SelectItem></SelectContent>
//                       </Select>
//                     </div>
//                     <div><Label>Value</Label><Input type="number" value={newDiscount.value} onChange={e => setNewDiscount({ ...newDiscount, value: Number(e.target.value) })} className="mt-1 rounded-xl" /></div>
//                   </div>
//                   <div>
//                     <Label>Scope</Label>
//                     <Select value={newDiscount.scope} onValueChange={(v: 'global' | 'item') => setNewDiscount({ ...newDiscount, scope: v })}>
//                       <SelectTrigger className="mt-1 rounded-xl"><SelectValue /></SelectTrigger>
//                       <SelectContent><SelectItem value="global">All Items</SelectItem><SelectItem value="item">Specific Item</SelectItem></SelectContent>
//                     </Select>
//                   </div>
//                   {newDiscount.scope === 'item' && (
//                     <div>
//                       <Label>Select Item</Label>
//                       <Select value={newDiscount.itemId || ''} onValueChange={v => setNewDiscount({ ...newDiscount, itemId: v })}>
//                         <SelectTrigger className="mt-1 rounded-xl"><SelectValue placeholder="Choose item" /></SelectTrigger>
//                         <SelectContent>{menuItems.map(i => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}</SelectContent>
//                       </Select>
//                     </div>
//                   )}
//                 </div>
//                 <Button onClick={() => {
//                   if (!newDiscount.name) { toast.error('Discount name required'); return; }
//                   addDiscount(newDiscount);
//                   setNewDiscount({ name: '', type: 'percentage', value: 10, scope: 'global', active: true });
//                   setShowAddDiscount(false);
//                   toast.success('Discount added!');
//                 }} className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground mt-4 w-full rounded-xl">
//                   <Plus className="h-4 w-4 mr-1" /> Add Discount
//                 </Button>
//               </div>
//             </motion.div>
//           </>
//         )}
//       </AnimatePresence>

//       {/* Edit Discount Dialog */}
//       <AnimatePresence>
//         {editingDiscount && (
//           <>
//             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-50" onClick={() => setEditingDiscount(null)} />
//             <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
//               className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-50 m-4 sm:m-0">
//               <div className="bg-background rounded-2xl border border-border p-6 cafe-shadow-lg">
//                 <div className="flex items-center justify-between mb-4">
//                   <h3 className="font-heading font-bold text-lg">Edit Discount</h3>
//                   <button onClick={() => setEditingDiscount(null)} className="h-8 w-8 rounded-xl bg-muted flex items-center justify-center"><X className="h-4 w-4" /></button>
//                 </div>
//                 <div className="space-y-4">
//                   <div><Label>Discount Name</Label><Input value={newDiscount.name} onChange={e => setNewDiscount({ ...newDiscount, name: e.target.value })} className="mt-1 rounded-xl" /></div>
//                   <div className="grid grid-cols-2 gap-4">
//                     <div>
//                       <Label>Type</Label>
//                       <Select value={newDiscount.type} onValueChange={(v: 'percentage' | 'flat') => setNewDiscount({ ...newDiscount, type: v })}>
//                         <SelectTrigger className="mt-1 rounded-xl"><SelectValue /></SelectTrigger>
//                         <SelectContent><SelectItem value="percentage">Percentage (%)</SelectItem><SelectItem value="flat">Flat (₹)</SelectItem></SelectContent>
//                       </Select>
//                     </div>
//                     <div><Label>Value</Label><Input type="number" value={newDiscount.value} onChange={e => setNewDiscount({ ...newDiscount, value: Number(e.target.value) })} className="mt-1 rounded-xl" /></div>
//                   </div>
//                   <div>
//                     <Label>Scope</Label>
//                     <Select value={newDiscount.scope} onValueChange={(v: 'global' | 'item') => setNewDiscount({ ...newDiscount, scope: v })}>
//                       <SelectTrigger className="mt-1 rounded-xl"><SelectValue /></SelectTrigger>
//                       <SelectContent><SelectItem value="global">All Items</SelectItem><SelectItem value="item">Specific Item</SelectItem></SelectContent>
//                     </Select>
//                   </div>
//                   {newDiscount.scope === 'item' && (
//                     <div>
//                       <Label>Select Item</Label>
//                       <Select value={newDiscount.itemId || ''} onValueChange={v => setNewDiscount({ ...newDiscount, itemId: v })}>
//                         <SelectTrigger className="mt-1 rounded-xl"><SelectValue placeholder="Choose item" /></SelectTrigger>
//                         <SelectContent>{menuItems.map(i => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}</SelectContent>
//                       </Select>
//                     </div>
//                   )}
//                 </div>
//                 <Button onClick={() => {
//                   if (!newDiscount.name) { toast.error('Discount name required'); return; }
//                   updateDiscount(editingDiscount, newDiscount);
//                   setNewDiscount({ name: '', type: 'percentage', value: 10, scope: 'global', active: true });
//                   setEditingDiscount(null);
//                   toast.success('Discount updated!');
//                 }} className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground mt-4 w-full rounded-xl">
//                   <Save className="h-4 w-4 mr-1" /> Save Changes
//                 </Button>
//               </div>
//             </motion.div>
//           </>
//         )}
//       </AnimatePresence>

//       {/* Bulk Upload Preview Dialog */}
//       <AnimatePresence>
//         {showBulkUpload && bulkPreview && (
//           <>
//             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-50" onClick={() => setShowBulkUpload(false)} />
//             <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
//               className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl z-50 m-4 sm:m-0">
//               <div className="bg-background rounded-2xl border border-border p-5 sm:p-6 cafe-shadow-lg max-h-[85vh] overflow-y-auto">
//                 <div className="flex items-center justify-between mb-4">
//                   <div>
//                     <h3 className="font-heading font-bold text-lg">Bulk Upload Preview</h3>
//                     <p className="text-xs text-muted-foreground">File: {bulkFileName}</p>
//                   </div>
//                   <button onClick={() => setShowBulkUpload(false)} className="h-8 w-8 rounded-xl bg-muted flex items-center justify-center"><X className="h-4 w-4" /></button>
//                 </div>

//                 <div className="grid grid-cols-2 gap-3 mb-4">
//                   <div className="p-3 rounded-xl bg-success/10 border border-success/20 text-center">
//                     <p className="text-2xl font-bold text-success">{bulkPreview.valid.length}</p>
//                     <p className="text-[10px] text-success">Valid items ready</p>
//                   </div>
//                   <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-center">
//                     <p className="text-2xl font-bold text-destructive">{bulkPreview.errors.length}</p>
//                     <p className="text-[10px] text-destructive">Errors found</p>
//                   </div>
//                 </div>

//                 {bulkPreview.errors.length > 0 && (
//                   <div className="mb-4 p-3 rounded-xl bg-destructive/5 border border-destructive/20 max-h-40 overflow-y-auto">
//                     <h4 className="text-xs font-bold text-destructive mb-2">⚠️ Validation Errors</h4>
//                     {bulkPreview.errors.map((err, i) => (
//                       <p key={i} className="text-[11px] text-destructive/80">Row {err.row}: [{err.field}] {err.message}</p>
//                     ))}
//                   </div>
//                 )}

//                 {bulkPreview.valid.length > 0 && (
//                   <div className="mb-4 max-h-60 overflow-y-auto">
//                     <h4 className="text-xs font-bold text-foreground mb-2">✅ Items to Add ({bulkPreview.valid.length})</h4>
//                     <table className="w-full text-xs">
//                       <thead><tr className="border-b border-border text-left">
//                         <th className="p-2 text-muted-foreground">Name</th>
//                         <th className="p-2 text-muted-foreground">Price</th>
//                         <th className="p-2 text-muted-foreground">Category</th>
//                         <th className="p-2 text-muted-foreground">Type</th>
//                       </tr></thead>
//                       <tbody className="divide-y divide-border">
//                         {bulkPreview.valid.slice(0, 50).map((item, i) => (
//                           <tr key={i} className="hover:bg-muted/20">
//                             <td className="p-2 font-medium">{item.name}</td>
//                             <td className="p-2">₹{item.price}</td>
//                             <td className="p-2 text-muted-foreground">{item.category}</td>
//                             <td className="p-2 text-muted-foreground">{item.vegetarian ? '🟢 Veg' : '🔴 Non-Veg'} • {item.type}</td>
//                           </tr>
//                         ))}
//                         {bulkPreview.valid.length > 50 && <tr><td colSpan={4} className="p-2 text-center text-muted-foreground">...and {bulkPreview.valid.length - 50} more</td></tr>}
//                       </tbody>
//                     </table>
//                   </div>
//                 )}

//                 <div className="flex gap-2">
//                   <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setShowBulkUpload(false)}>Cancel</Button>
//                   <Button disabled={bulkPreview.valid.length === 0} className="flex-1 bg-gradient-to-r from-success to-success/80 text-success-foreground rounded-xl" onClick={confirmBulkUpload}>
//                     <Check className="h-4 w-4 mr-1" /> Confirm Upload ({bulkPreview.valid.length} items)
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

// export default AdminDashboard;
