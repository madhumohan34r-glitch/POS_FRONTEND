import { useState } from 'react';
import axios from 'axios';
import { Plus, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';


interface AddMerchantModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (businessName: string) => void;
}

const emptyForm = {
  merchant_code: '',
  business_name: '',
  business_type: '',
  owner_name: '',
  email: '',
  phone: '',
  gst_number: '',
  address: '',
  city: '',
  state: '',
  country: '',
  postal_code: '',
  timezone: '',
};

export default function AddMerchantModal({ open, onOpenChange, onSuccess }: AddMerchantModalProps) {
 const { token } = useAuth();
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const update = (key: keyof typeof emptyForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((s) => ({ ...s, [key]: e.target.value }));

  const handleAdd = async () => {
    // ✅ FIXED: schema (CreateMerchantSchema) prakaram matrame `merchant_code` and
    // `business_name` required (str, Optional kadu) — migilinavi anni Optional[str]=None.
    // Ee kinda undedi (owner_name, email required ani) tappu — fix chేశాను.
    if (!form.merchant_code || !form.business_name) {
      toast.error('Merchant code and business name are required');
      return;
    }

    try {
      setSubmitting(true);
      const res = await axios.post(
        `${API_URL}/organization/merchant/create`,
        form,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!res.data?.success) {
        toast.error(res.data?.message || 'Failed to create merchant');
        return;
      }

      toast.success(`${form.business_name} onboarded successfully`);
      onSuccess(form.business_name);
      setForm(emptyForm);
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to create merchant');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading flex items-center gap-2">
            <Plus className="h-4 w-4 text-primary" /> Onboard New Merchant
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Merchant Code *</Label>
              <Input
                value={form.merchant_code}
                onChange={update('merchant_code')}
                placeholder="e.g. REST_1003"
                className="rounded-xl mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Business Type</Label>
              <Input
                value={form.business_type}
                onChange={update('business_type')}
                placeholder="e.g. Cafe, Restaurant"
                className="rounded-xl mt-1"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs">Business Name *</Label>
            <Input
              value={form.business_name}
              onChange={update('business_name')}
              placeholder="e.g. Mocha Lounge"
              className="rounded-xl mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Owner Name</Label>
              <Input
                value={form.owner_name}
                onChange={update('owner_name')}
                placeholder="Full name"
                className="rounded-xl mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Phone</Label>
              <Input
                value={form.phone}
                onChange={update('phone')}
                placeholder="+91-..."
                className="rounded-xl mt-1"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs">Email</Label>
            <Input
              type="email"
              value={form.email}
              onChange={update('email')}
              placeholder="owner@business.com"
              className="rounded-xl mt-1"
            />
          </div>

          <div>
            <Label className="text-xs">GST Number</Label>
            <Input
              value={form.gst_number}
              onChange={update('gst_number')}
              placeholder="GSTIN"
              className="rounded-xl mt-1"
            />
          </div>

          <div>
            <Label className="text-xs">Address</Label>
            <Input
              value={form.address}
              onChange={update('address')}
              placeholder="Street, area"
              className="rounded-xl mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">City</Label>
              <Input value={form.city} onChange={update('city')} className="rounded-xl mt-1" />
            </div>
            <div>
              <Label className="text-xs">State</Label>
              <Input value={form.state} onChange={update('state')} className="rounded-xl mt-1" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Country</Label>
              <Input value={form.country} onChange={update('country')} className="rounded-xl mt-1" />
            </div>
            <div>
              <Label className="text-xs">Postal Code</Label>
              <Input value={form.postal_code} onChange={update('postal_code')} className="rounded-xl mt-1" />
            </div>
          </div>

          <div>
            <Label className="text-xs">Timezone</Label>
            <Input
              value={form.timezone}
              onChange={update('timezone')}
              placeholder="e.g. Asia/Kolkata"
              className="rounded-xl mt-1"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl" disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleAdd} className="rounded-xl" disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
            {submitting ? 'Onboarding...' : 'Onboard Merchant'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
