import { useEffect, useState } from 'react';
import axios from 'axios';
import { Loader2, Trash2, Mail, Phone, ShieldCheck, UserX } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
// Swagger (/docs) prakaram: GET /organization/admins/{restaurant_id}
// and DELETE /organization/admins/{restaurant_id}/{admin_id}
const ORG_URL = `${API_URL}/organization`;

// Restaurant card nunchi pampalsina minimum data
export interface RestaurantLite {
  id: number; // GET /{restaurant_id}/admins ki vaade DB id (restaurant_code kaadu)
  name: string;
}

// GET    /organization/admins/{restaurant_id}            -> data.admins[]
// DELETE /organization/admins/{restaurant_id}/{admin_id}
interface AdminRow {
  admin_id: number;
  name: string;
  email: string;
  phone?: string | null;
  profile_image?: string | null;
  role?: string | null;
  is_active: boolean;
  is_verified: boolean;
  last_login?: string | null;
  created_at?: string | null;
}

interface Props {
  restaurant: RestaurantLite | null;
  onClose: () => void;
}

const fmtDate = (iso?: string | null) => (iso ? new Date(iso).toLocaleString() : '-');

export default function RestaurantAdminsModal({ restaurant, onClose }: Props) {
  const { token } = useAuth();
  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchAdmins = async (restaurantId: number) => {
    try {
      setLoading(true);
      const res = await axios.get(`${ORG_URL}/admins/${restaurantId}`, authHeaders);
      setAdmins(res.data?.data?.admins ?? []);
    } catch (error: any) {
      setAdmins([]);
      toast.error(error.response?.data?.detail || 'Failed to load restaurant admins');
    } finally {
      setLoading(false);
    }
  };

  // Restaurant card click chesinappudu (restaurant prop marinappudu) admins fetch avthayi
  useEffect(() => {
    if (!restaurant) {
      setAdmins([]);
      return;
    }
    fetchAdmins(restaurant.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurant?.id]);

  const handleDelete = async (admin: AdminRow) => {
    if (!restaurant) return;
    const confirmed = window.confirm(
      `${admin.name} (${admin.email}) ni permanently delete cheyala? Aa admin malli register ayye varaku login cheyaleru. Ee action undo cheyaleru.`
    );
    if (!confirmed) return;

    try {
      setDeletingId(admin.admin_id);
      const res = await axios.delete(
        `${ORG_URL}/admins/${restaurant.id}/${admin.admin_id}`,
        authHeaders
      );
      if (!res.data?.success) {
        toast.error(res.data?.message || 'Failed to delete admin');
        return;
      }
      toast.success(`${admin.name} deleted`);
      await fetchAdmins(restaurant.id);
    } catch (error: any) {
      // 404 (admin/restaurant ledu) leda 409 (related records unnayi) — backend detail chupistham
      toast.error(error.response?.data?.detail || 'Failed to delete admin');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Dialog open={!!restaurant} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-sm font-bold text-primary">
              {restaurant?.name?.charAt(0)}
            </div>
            <span className="truncate">{restaurant?.name}</span>
            <Badge variant="outline" className="text-[10px] ml-auto whitespace-nowrap">
              {admins.length} admin{admins.length !== 1 ? 's' : ''}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading admins...
          </div>
        ) : admins.length === 0 ? (
          <div className="py-10 text-center text-muted-foreground">
            <UserX className="h-10 w-10 mx-auto mb-2 opacity-20" />
            <p className="text-sm">No admin registered for this restaurant</p>
          </div>
        ) : (
          <div className="space-y-3">
            {admins.map((admin) => (
              <div key={admin.admin_id} className="p-3 rounded-xl bg-muted/40 border border-border">
                <div className="flex items-start gap-3">
                  {admin.profile_image ? (
                    <img
                      src={admin.profile_image}
                      alt={admin.name}
                      className="h-10 w-10 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
                      {admin.name?.charAt(0)?.toUpperCase()}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-sm truncate">{admin.name}</p>
                      {admin.role && (
                        <Badge variant="outline" className="text-[10px] uppercase">{admin.role}</Badge>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1 truncate">
                      <Mail className="h-3 w-3 flex-shrink-0" /> {admin.email}
                    </p>
                    {admin.phone && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Phone className="h-3 w-3 flex-shrink-0" /> {admin.phone}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      <Badge
                        className={`text-[10px] ${admin.is_active ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}
                      >
                        {admin.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      {admin.is_verified && (
                        <Badge className="text-[10px] bg-info/10 text-info gap-1">
                          <ShieldCheck className="h-3 w-3" /> Verified
                        </Badge>
                      )}
                    </div>

                    <p className="text-[10px] text-muted-foreground mt-2">
                      Last login: {fmtDate(admin.last_login)} · Joined: {fmtDate(admin.created_at)}
                    </p>
                  </div>

                  <Button
                    size="sm"
                    variant="destructive"
                    className="rounded-xl flex-shrink-0"
                    onClick={() => handleDelete(admin)}
                    disabled={deletingId === admin.admin_id}
                  >
                    {deletingId === admin.admin_id ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4 mr-1" />
                    )}
                    {deletingId === admin.admin_id ? 'Deleting...' : 'Delete'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}