import { useNavigate, Link } from 'react-router-dom';
import { LogOut, User, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/lib/auth-store';

interface UserHeaderProps {
  title: string;
  subtitle?: string;
  backTo?: string;
  children?: React.ReactNode;
}

const roleLabels: Record<string, string> = {
  admin: 'Manager',
  cashier: 'Counter Staff',
  kitchen: 'Kitchen Staff',
  customer: 'Customer',
};

const roleColors: Record<string, string> = {
  admin: 'bg-chart-1/10 text-chart-1 border-chart-1/30',
  cashier: 'bg-chart-2/10 text-chart-2 border-chart-2/30',
  kitchen: 'bg-chart-3/10 text-chart-3 border-chart-3/30',
  customer: 'bg-chart-4/10 text-chart-4 border-chart-4/30',
};

const UserHeader = ({ title, subtitle, backTo = '/', children }: UserHeaderProps) => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="p-4 border-b border-border bg-card flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Link to={backTo} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-heading font-bold text-foreground">{title}</h1>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      <div className="flex items-center gap-3">
        {children}
        {isAuthenticated && user && (
          <div className="flex items-center gap-3 ml-2 pl-3 border-l border-border">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-foreground leading-tight">{user.name}</p>
                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${roleColors[user.role] || ''}`}>
                  {roleLabels[user.role] || user.role}
                </Badge>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout} className="text-muted-foreground hover:text-destructive">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </header>
  );
};

export default UserHeader;
