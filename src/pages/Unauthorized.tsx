import { Link } from 'react-router-dom';
import { ShieldX, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/lib/auth-store';

const Unauthorized = () => {
  const { user } = useAuthStore();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 font-body">
      <div className="text-center max-w-sm">
        <div className="h-16 w-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-4">
          <ShieldX className="h-8 w-8 text-destructive" />
        </div>
        <h1 className="text-2xl font-heading font-bold text-foreground mb-2">Access Denied</h1>
        <p className="text-muted-foreground mb-6">
          Your role <span className="font-semibold text-foreground">({user?.role})</span> does not have permission to view this page.
        </p>
        <Button asChild>
          <Link to="/login"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Login</Link>
        </Button>
      </div>
    </div>
  );
};

export default Unauthorized;
