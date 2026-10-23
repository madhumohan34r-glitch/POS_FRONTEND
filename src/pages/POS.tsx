import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Coffee, CreditCard, BookOpen, Wrench, LogOut } from 'lucide-react';
import LiveClock from '@/components/LiveClock';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/lib/auth-store';
import ActiveOrdersTab from './pos/components/ActiveOrdersTab';
import NewOrderTab from './pos/components/NewOrderTab';
import ReservationsTab from './pos/components/ReservationsTab';
import OperationsTab from '@/pages/pos/components/OperationsTab';


type PosTab = 'orders' | 'neworder' | 'payments' | 'reservations' | 'ops';

const tabs = [
  { id: 'orders' as PosTab, label: 'Active Orders', icon: ClipboardList },
  { id: 'neworder' as PosTab, label: 'New Order', icon: Coffee },
  { id: 'payments' as PosTab, label: 'Payments', icon: CreditCard },
  { id: 'reservations' as PosTab, label: 'Reservations', icon: BookOpen },
  { id: 'ops' as PosTab, label: 'Operations', icon: Wrench },
];

export default function POS() {
  const [activeTab, setActiveTab] = useState<PosTab>('orders'); 
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  return (
    <div className="h-screen flex flex-col bg-background font-body">
      <header className="px-4 sm:px-6 py-3 border-b border-border bg-card flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-accent to-accent/60 flex items-center justify-center">
            <Coffee className="h-5 w-5 text-accent-foreground" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-lg font-heading font-bold">CaféFlow</h1>
            <p className="text-[11px] text-muted-foreground">Counter POS • <LiveClock /></p>
          </div>
        </div>

        <nav className="flex gap-1 bg-muted rounded-xl p-1 overflow-x-auto">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === t.id ? 'bg-card text-foreground cafe-shadow' : 'text-muted-foreground hover:text-foreground'
              }`}>
              <t.icon className="h-4 w-4" /> <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium">{user?.name || 'Staff'}</p>
            <p className="text-[11px] text-muted-foreground">Counter</p>
          </div>
          <Button variant="outline" size="sm" className="rounded-xl" onClick={() => { logout(); navigate('/login'); }}>
            <LogOut className="h-4 w-4 sm:mr-1" /> <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        {activeTab === 'orders' && <div className="p-4 sm:p-6"><ActiveOrdersTab /></div>}
        {activeTab === 'neworder' && <NewOrderTab />}
        {activeTab === 'reservations' && <ReservationsTab />}
        {activeTab === 'ops' && <OperationsTab />} 
        {['payments'].includes(activeTab) && (
          <div className="py-20 text-center text-muted-foreground">Coming next</div>
        )}
      </div>
    </div>
  );
}
