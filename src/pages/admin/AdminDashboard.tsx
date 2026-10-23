import { useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, UtensilsCrossed, ClipboardList, Users, CreditCard, QrCode, Settings,
  Bell, LogOut, X, Menu as MenuIcon, CalendarDays, MessageSquare, Warehouse, BookOpen, Wrench, Sparkles
} from 'lucide-react';
import LiveClock from '@/components/LiveClock';
import { useAuth } from '@/lib/auth-context';
import {
  useSettingsDashboard,
  useAdminNotifications,
  useMarkNotificationRead,
} from '@/tanstack/alltanstack';

// Static labels (admin panel is English only; i18n zustand store removed)
const tabs = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'orders', label: 'Orders', icon: ClipboardList },
  { id: 'menu', label: 'Menu Items', icon: UtensilsCrossed },
  { id: 'stock', label: 'Stock', icon: Warehouse },
  { id: 'staff', label: 'Staff', icon: Users },
  { id: 'staffmgmt', label: 'Staff Mgmt', icon: CalendarDays },
  { id: 'feedback', label: 'Feedback', icon: MessageSquare },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'tables', label: 'Tables & QR', icon: QrCode },
  { id: 'reservations', label: 'Reservations', icon: BookOpen },
  { id: 'ops', label: 'Operations', icon: Wrench },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // ---- API data (no zustand) ----
  const { data: settingsData } = useSettingsDashboard();
  const { data: notifications = [], isLoading: notifLoading } = useAdminNotifications();
  const markReadMut = useMarkNotificationRead(); // hook already toasts errors

  const s: any = settingsData?.settings ?? settingsData ?? {};
  const cafeName: string = s.restaurant_name ?? s.cafe_name ?? s.name ?? 'CaféFlow';
  const cafeLogo: string | undefined = s.logo_url ?? s.logo ?? undefined;

  const activeTab = location.pathname.split('/').pop() || 'dashboard';
  const unreadCount = notifications.filter(n => !n.read).length;

  const markRead = (id: number, alreadyRead: boolean) => {
    if (alreadyRead) return;
    markReadMut.mutate({ notification_id: id });
  };

  // Backend has only a single-notification read endpoint, so call it per unread id
  const markAllRead = async () => {
    const unread = notifications.filter(n => !n.read);
    await Promise.allSettled(unread.map(n => markReadMut.mutateAsync({ notification_id: n.id })));
  };

  const today = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  const handleTabClick = (tabId: string) => {
    navigate(`/admin/${tabId}`);
    setSidebarOpen(false);
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  const notifIcon = (type: string) => {
    switch (type) {
      case 'order': return <ClipboardList className="h-4 w-4 text-primary" />;
      case 'payment': return <CreditCard className="h-4 w-4 text-success" />;
      case 'staff': return <Users className="h-4 w-4 text-info" />;
      default: return <Bell className="h-4 w-4 text-accent" />;
    }
  };

  return (
    <div className="min-h-screen bg-background font-body flex">
      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`fixed lg:sticky top-0 left-0 h-screen w-60 bg-sidebar border-r border-sidebar-border flex flex-col flex-shrink-0 z-50 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>

        {/* Sidebar Header (Logo) */}
        <div className="p-4 sm:p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {cafeLogo ? (
              <img src={cafeLogo} alt="Logo" className="h-9 w-9 rounded-xl object-contain" />
            ) : (
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-primary-foreground" />
              </div>
            )}
            <div>
              <h1 className="text-lg font-heading font-bold text-sidebar-foreground">{cafeName}</h1>
              <p className="text-[11px] text-sidebar-foreground/50">Admin Panel</p>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-sidebar-foreground/60"><X className="h-5 w-5" /></button>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => handleTabClick(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab.id ? 'bg-sidebar-accent text-sidebar-primary glow-primary' : 'text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
              }`}>
              <tab.icon className="h-4 w-4" />{tab.label}
            </button>
          ))}
        </nav>

        {/* Sidebar Footer (User Info & Logout) */}
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="h-8 w-8 rounded-lg bg-sidebar-accent flex items-center justify-center">
              <Users className="h-4 w-4 text-sidebar-foreground/60" />
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-sidebar-foreground truncate">{user?.name || 'Admin User'}</p>
              <p className="text-[10px] text-sidebar-foreground/50 truncate">{user?.email || 'admin@cafe.com'}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-sidebar-foreground/50 hover:text-sidebar-foreground rounded-xl hover:bg-sidebar-accent/30 transition-all">
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto min-w-0">

        {/* Main Header */}
        <header className="px-4 sm:px-8 py-4 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
              <MenuIcon className="h-5 w-5 text-muted-foreground" />
            </button>
            <div>
              <h2 className="text-lg sm:text-2xl font-heading font-bold text-foreground">{tabs.find(t => t.id === activeTab)?.label}</h2>
              <p className="text-xs text-muted-foreground mt-0.5 hidden sm:block">{today} • <LiveClock /></p>
            </div>
          </div>
          <div className="flex items-center gap-3 relative">
            <button onClick={() => setShowNotifications(!showNotifications)}
              className="relative h-10 w-10 rounded-xl bg-muted flex items-center justify-center hover:bg-secondary transition-colors">
              <Bell className="h-5 w-5 text-muted-foreground" />
              {unreadCount > 0 && <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold">{unreadCount}</span>}
            </button>

            <AnimatePresence>
              {showNotifications && (
                <>
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 top-12 w-80 sm:w-96 bg-card border border-border rounded-2xl cafe-shadow-lg z-50 overflow-hidden">
                    <div className="p-4 border-b border-border flex items-center justify-between">
                      <h3 className="font-heading font-bold text-sm">Notifications</h3>
                      {unreadCount > 0 && (
                        <button onClick={markAllRead} className="text-xs text-primary hover:underline">Mark all read</button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto divide-y divide-border">
                      {notifLoading ? (
                        <div className="p-8 text-center text-muted-foreground text-sm">Loading...</div>
                      ) : notifications.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground text-sm">
                          <Bell className="h-8 w-8 mx-auto mb-2 opacity-20" />
                          No notifications
                        </div>
                      ) : notifications.map(n => (
                        <button key={n.id} onClick={() => markRead(n.id, n.read)}
                          className={`w-full text-left p-3 hover:bg-muted/50 transition-colors flex gap-3 ${!n.read ? 'bg-primary/5' : ''}`}>
                          <div className="flex-shrink-0 mt-0.5">{notifIcon(n.type)}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className={`text-sm font-medium ${!n.read ? 'text-foreground' : 'text-muted-foreground'}`}>{n.title}</span>
                              {!n.read && <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">{n.message}</p>
                            <p className="text-[10px] text-muted-foreground/60 mt-1">{n.time}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </header>

        {/* Tab Content Window */}
        <div className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}