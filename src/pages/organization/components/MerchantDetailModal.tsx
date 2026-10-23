import { useState, useEffect } from 'react';
import axios from 'axios';
import { CalendarPlus, Pause, Play, Loader2, Pencil, X, Check, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuthStore } from '@/lib/auth-store';
import { toast } from 'sonner';
import type { Merchant } from './MerchantsTable';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

// ✅ GET /organization/merchant/{merchant_id} full detail response shape
interface MerchantFullDetail extends Merchant {
  business_type?: string;
  gst_number?: string;
  address?: string;
  country?: string;
  postal_code?: string;
  logo_url?: string;
  timezone?: string;
}

// ✅ PUT /organization/merchant/update/{merchant_id} body — UpdateMerchantSchema
// prakaram anni fields Optional[str] = None
interface UpdateMerchantForm {
  business_name: string;
  business_type: string;
  owner_name: string;
  email: string;
  phone: string;
  gst_number: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  timezone: string;
  onboarding_status: string;
  merchant_status: string;
}

interface MerchantDetailModalProps {
  merchant: Merchant | null;
  onClose: () => void;
  onRefresh: () => void; // extend/suspend/update ayyaka parent list ni refetch cheyamani
}

const toForm = (d: MerchantFullDetail): UpdateMerchantForm => ({
  business_name: d.business_name || '',
  business_type: d.business_type || '',
  owner_name: d.owner_name || '',
  email: d.email || '',
  phone: d.phone || '',
  gst_number: d.gst_number || '',
  address: d.address || '',
  city: d.city || '',
  state: d.state || '',
  country: d.country || '',
  postal_code: d.postal_code || '',
  timezone: d.timezone || '',
  onboarding_status: d.onboarding_status || '',
  merchant_status: d.merchant_status || '',
});

export default function MerchantDetailModal({ merchant, onClose, onRefresh }: MerchantDetailModalProps) {
  const token = useAuthStore((s) => s.token);
  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  const [detail, setDetail] = useState<MerchantFullDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // ✅ NEW: edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<UpdateMerchantForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchDetail = async (merchantId: number) => {
    try {
      setLoadingDetail(true);
      const res = await axios.get(`${API_URL}/organization/merchant/${merchantId}`, authHeaders);
      if (res.data?.success && res.data?.data) {
        setDetail((prev) => ({ ...(prev as MerchantFullDetail), ...res.data.data }));
      }
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to load merchant details');
    } finally {
      setLoadingDetail(false);
    }
  };

  // ✅ Modal open ayyinapudu, list lo lేni full detail fields (gst, address, etc.)
  // backend nunchi fetch chestundi.
  useEffect(() => {
    if (!merchant) {
      setDetail(null);
      setIsEditing(false);
      setEditForm(null);
      return;
    }
    setDetail(merchant); // list data tho immediate render, tarwata detail merge
    setIsEditing(false);
    fetchDetail(merchant.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [merchant?.id]);

  if (!merchant || !detail) return null;

  const updateField = (key: keyof UpdateMerchantForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setEditForm((f) => (f ? { ...f, [key]: e.target.value } : f));

  const startEditing = () => {
    setEditForm(toForm(detail));
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditForm(null);
  };

  // ✅ REAL backend call: PUT /organization/merchant/update/{merchant_id}
  // Body: UpdateMerchantForm (anni fields — backend exclude_unset=True cheyakapoyina
  // pramadam ledu, khali string vachina aa field ni 'unset' ga treat cheyadu, kani
  // exact match ga anipinche padu).
  const handleSaveEdit = async () => {
    if (!editForm) return;
    try {
      setSaving(true);
      const res = await axios.put(
        `${API_URL}/organization/merchant/update/${merchant.id}`,
        editForm,
        authHeaders
      );
      if (!res.data?.success) {
        toast.error(res.data?.message || 'Failed to update merchant');
        return;
      }
      toast.success(`${editForm.business_name || detail.business_name} updated successfully`);
      setIsEditing(false);
      await fetchDetail(merchant.id); // modal lo updated data chupinchadaniki
      onRefresh(); // parent table ni kuda refresh cheyadaniki
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to update merchant');
    } finally {
      setSaving(false);
    }
  };

  // ✅ REAL backend call: DELETE /organization/merchant/delete/{merchant_id}
  // ⚠️ Idi permanent delete — DB nunchi record పూర్తిగా tీసేస్తుంది (soft-delete kadu).
  const handleDelete = async () => {
    const confirmed = window.confirm(
      `${merchant.business_name} ni permanently delete cheyala? Ee action undo cheyalేru.`
    );
    if (!confirmed) return;

    try {
      setDeleting(true);
      const res = await axios.delete(
        `${API_URL}/organization/merchant/delete/${merchant.id}`,
        authHeaders
      );
      if (!res.data?.success) {
        toast.error(res.data?.message || 'Failed to delete merchant');
        return;
      }
      toast.success(`${merchant.business_name} deleted successfully`);
      onRefresh();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to delete merchant');
    } finally {
      setDeleting(false);
    }
  };

  // ✅ REAL backend call: POST /organization/merchant_features/extend-subscription
  const handleExtend = async (extraDays: number) => {
    try {
      await axios.post(
        `${API_URL}/organization/merchant_features/extend-subscription`,
        { merchant_id: merchant.id, extra_days: extraDays },
        authHeaders
      );
      toast.success(`${merchant.business_name} extended by ${extraDays} days`);
      onRefresh();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to extend subscription');
    }
  };

  // ✅ REAL backend call: PUT /organization/merchant/update/{merchant_id} (status toggle)
  const handleSuspend = async () => {
    const newStatus = detail.merchant_status === 'active' ? 'suspended' : 'active';
    try {
      await axios.put(
        `${API_URL}/organization/merchant/update/${merchant.id}`,
        { merchant_status: newStatus },
        authHeaders
      );
      toast.success(`${merchant.business_name} ${newStatus === 'suspended' ? 'suspended' : 'reactivated'}`);
      onRefresh();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to update merchant status');
    }
  };

  return (
    <Dialog open={!!merchant} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-sm font-bold text-primary">
              {detail.business_name.charAt(0)}
            </div>
            {detail.business_name}
            <Badge variant="outline" className="text-[10px] uppercase ml-auto">
              {detail.onboarding_status}
            </Badge>
            {/* ✅ NEW: Edit toggle button */}
            {!isEditing && (
              <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg" onClick={startEditing}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* =================================================
            EDIT MODE — UpdateMerchantSchema fields anni editable
        ================================================= */}
        {isEditing && editForm ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Business Name</Label>
                <Input value={editForm.business_name} onChange={updateField('business_name')} className="rounded-xl mt-1" />
              </div>
              <div>
                <Label className="text-xs">Business Type</Label>
                <Input value={editForm.business_type} onChange={updateField('business_type')} className="rounded-xl mt-1" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Owner Name</Label>
                <Input value={editForm.owner_name} onChange={updateField('owner_name')} className="rounded-xl mt-1" />
              </div>
              <div>
                <Label className="text-xs">Phone</Label>
                <Input value={editForm.phone} onChange={updateField('phone')} className="rounded-xl mt-1" />
              </div>
            </div>

            <div>
              <Label className="text-xs">Email</Label>
              <Input type="email" value={editForm.email} onChange={updateField('email')} className="rounded-xl mt-1" />
            </div>

            <div>
              <Label className="text-xs">GST Number</Label>
              <Input value={editForm.gst_number} onChange={updateField('gst_number')} className="rounded-xl mt-1" />
            </div>

            <div>
              <Label className="text-xs">Address</Label>
              <Input value={editForm.address} onChange={updateField('address')} className="rounded-xl mt-1" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">City</Label>
                <Input value={editForm.city} onChange={updateField('city')} className="rounded-xl mt-1" />
              </div>
              <div>
                <Label className="text-xs">State</Label>
                <Input value={editForm.state} onChange={updateField('state')} className="rounded-xl mt-1" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Country</Label>
                <Input value={editForm.country} onChange={updateField('country')} className="rounded-xl mt-1" />
              </div>
              <div>
                <Label className="text-xs">Postal Code</Label>
                <Input value={editForm.postal_code} onChange={updateField('postal_code')} className="rounded-xl mt-1" />
              </div>
            </div>

            <div>
              <Label className="text-xs">Timezone</Label>
              <Input value={editForm.timezone} onChange={updateField('timezone')} className="rounded-xl mt-1" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Onboarding Status</Label>
                <Select
                  value={editForm.onboarding_status}
                  onValueChange={(v) => setEditForm((f) => (f ? { ...f, onboarding_status: v } : f))}
                >
                  <SelectTrigger className="rounded-xl mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Merchant Status</Label>
                <Select
                  value={editForm.merchant_status}
                  onValueChange={(v) => setEditForm((f) => (f ? { ...f, merchant_status: v } : f))}
                >
                  <SelectTrigger className="rounded-xl mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-1">
              <Button size="sm" variant="outline" className="rounded-xl" onClick={cancelEditing} disabled={saving}>
                <X className="h-4 w-4 mr-1" /> Cancel
              </Button>
              <Button size="sm" className="rounded-xl" onClick={handleSaveEdit} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        ) : (
          // =================================================
          // VIEW MODE — read-only, original layout
          // =================================================
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 rounded-xl bg-muted/40 border border-border">
                <p className="text-[10px] text-muted-foreground uppercase">Owner</p>
                <p className="font-medium">{detail.owner_name}</p>
              </div>
              <div className="p-3 rounded-xl bg-muted/40 border border-border">
                <p className="text-[10px] text-muted-foreground uppercase">Status</p>
                <Badge className={`mt-0.5 text-[10px] ${detail.merchant_status === 'active' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                  {detail.merchant_status}
                </Badge>
              </div>
              <div className="p-3 rounded-xl bg-muted/40 border border-border col-span-2">
                <p className="text-[10px] text-muted-foreground uppercase">Contact</p>
                <p className="text-xs">{detail.email}</p>
                <p className="text-xs">{detail.phone}</p>
              </div>
              <div className="p-3 rounded-xl bg-muted/40 border border-border col-span-2">
                <p className="text-[10px] text-muted-foreground uppercase">Merchant Code</p>
                <p className="text-xs font-mono">{detail.merchant_code}</p>
              </div>

              {loadingDetail ? (
                <div className="p-3 rounded-xl bg-muted/40 border border-border col-span-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" /> Loading more details...
                </div>
              ) : (
                <>
                  {detail.business_type && (
                    <div className="p-3 rounded-xl bg-muted/40 border border-border">
                      <p className="text-[10px] text-muted-foreground uppercase">Business Type</p>
                      <p className="text-xs">{detail.business_type}</p>
                    </div>
                  )}
                  {detail.gst_number && (
                    <div className="p-3 rounded-xl bg-muted/40 border border-border">
                      <p className="text-[10px] text-muted-foreground uppercase">GST Number</p>
                      <p className="text-xs">{detail.gst_number}</p>
                    </div>
                  )}
                  {(detail.address || detail.city || detail.state || detail.country || detail.postal_code) && (
                    <div className="p-3 rounded-xl bg-muted/40 border border-border col-span-2">
                      <p className="text-[10px] text-muted-foreground uppercase">Address</p>
                      <p className="text-xs">
                        {[detail.address, detail.city, detail.state, detail.postal_code, detail.country]
                          .filter(Boolean)
                          .join(', ')}
                      </p>
                    </div>
                  )}
                  {detail.timezone && (
                    <div className="p-3 rounded-xl bg-muted/40 border border-border">
                      <p className="text-[10px] text-muted-foreground uppercase">Timezone</p>
                      <p className="text-xs">{detail.timezone}</p>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" className="rounded-xl" onClick={() => handleExtend(30)}>
                <CalendarPlus className="h-4 w-4 mr-1" /> +30 days
              </Button>
              <Button size="sm" variant="outline" className="rounded-xl" onClick={() => handleExtend(365)}>
                <CalendarPlus className="h-4 w-4 mr-1" /> +1 year
              </Button>
              <Button
                size="sm"
                variant={detail.merchant_status === 'active' ? 'destructive' : 'default'}
                className="rounded-xl ml-auto"
                onClick={handleSuspend}
              >
                {detail.merchant_status === 'active' ? (
                  <><Pause className="h-4 w-4 mr-1" /> Suspend</>
                ) : (
                  <><Play className="h-4 w-4 mr-1" /> Reactivate</>
                )}
              </Button>
              {/* ✅ NEW: permanent delete */}
              <Button
                size="sm"
                variant="destructive"
                className="rounded-xl"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Trash2 className="h-4 w-4 mr-1" />}
                {deleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
