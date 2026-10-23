import { useState } from 'react';
import axios from 'axios';
import { Store, Loader2, CreditCard, CheckCircle2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';
import type { MerchantRow } from './MerchantsTable';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
// ⚠️ Router prefix mee main.py lo include_router prefix tho match cheyali
export const RESTAURANT_URL = `${API_URL}/organization/restaurant`;

const emptyForm = {
  restaurant_code: '', name: '', restaurant_type: '', phone: '', gst_number: '',
  address: '', city: '', state: '', country: '', logo_url: '', opening_time: '', closing_time: '',
};

interface Props {
  merchant: MerchantRow | null;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function AddRestaurantModal({ merchant, onOpenChange, onSuccess }: Props) {
  const { token } = useAuth();
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  // Subscription complete ayyaaka true avuthundi. Add Restaurant button daaniki depend avuthundi.
  const [subscribed, setSubscribed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  const set = (k: keyof typeof emptyForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((s) => ({ ...s, [k]: e.target.value }));

  const close = () => {
    setForm(emptyForm);
    setSubscribed(false);
    onOpenChange(false);
  };

  // TODO: Subscription backend API ready ayyaaka ikkada call cheyyali.
  // Success vachaaka setSubscribed(true) cheyyandi. Ippudiki API ledu kabatti
  // Add Restaurant disabled ga ne untundi.
  const handleSubscribe = async () => {
    if (!merchant) return;
    try {
      setSubscribing(true);
      // await axios.post(`${API_URL}/organization/subscription/create`, { merchant_code: merchant.merchant_code }, { headers: { Authorization: `Bearer ${token}` } });
      // setSubscribed(true);
      // toast.success('Subscription completed');
      toast.info('Subscription feature is coming soon');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Subscription failed');
    } finally {
      setSubscribing(false);
    }
  };

  const handleSave = async () => {
    if (!merchant) return;
    if (!subscribed) { toast.error('Please complete the subscription first'); return; }
    if (!merchant.merchant_code) { toast.error('Merchant code not found for this merchant'); return; }
    if (!form.name.trim()) { toast.error('Restaurant name is required'); return; }

    // khali fields pampakunda — backend Optional fields ki None veltundi
    const payload = Object.fromEntries(Object.entries(form).filter(([, v]) => v !== ''));
    try {
      setSaving(true);
      await axios.post(
        `${RESTAURANT_URL}/create`,
        { merchant_code: merchant.merchant_code, ...payload },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`${form.name} added to ${merchant.business_name}`);
      onSuccess();
      close();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to add restaurant');
    } finally {
      setSaving(false);
    }
  };

  const field = (label: string, k: keyof typeof emptyForm, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div>
      <Label className="text-xs">{label}</Label>
      <Input value={form[k]} onChange={set(k)} className="rounded-xl mt-1" {...props} />
    </div>
  );

  return (
    <Dialog open={!!merchant} onOpenChange={(o) => !o && close()}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading flex items-center gap-2">
            <Store className="h-4 w-4 text-primary" /> Add restaurant to {merchant?.business_name}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {field('Restaurant Name *', 'name', { placeholder: 'e.g. Mocha Lounge - Banjara Hills' })}
            {field('Restaurant Code', 'restaurant_code', { placeholder: 'e.g. RST_001' })}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {field('Type', 'restaurant_type', { placeholder: 'Cafe, Fine dining' })}
            {field('Phone', 'phone', { placeholder: '+91-...' })}
          </div>
          {field('GST Number', 'gst_number')}
          {field('Address', 'address')}
          <div className="grid grid-cols-3 gap-3">
            {field('City', 'city')}
            {field('State', 'state')}
            {field('Country', 'country')}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {field('Opening Time', 'opening_time', { type: 'time' })}
            {field('Closing Time', 'closing_time', { type: 'time' })}
          </div>
          {field('Logo URL', 'logo_url', { placeholder: 'https://...' })}
        </div>
        <DialogFooter>
          <Button variant="outline" className="rounded-xl" onClick={close} disabled={saving || subscribing}>Cancel</Button>
          <Button
            variant="outline"
            className="rounded-xl"
            onClick={handleSubscribe}
            disabled={saving || subscribing || subscribed}
          >
            {subscribing ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : subscribed ? (
              <CheckCircle2 className="h-4 w-4 mr-1 text-green-600" />
            ) : (
              <CreditCard className="h-4 w-4 mr-1" />
            )}
            {subscribed ? 'Subscribed' : 'Subscription'}
          </Button>
          <Button
            className="rounded-xl"
            onClick={handleSave}
            disabled={saving || subscribing || !subscribed}
            title={!subscribed ? 'Complete the subscription first' : undefined}
          >
            {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
            {saving ? 'Adding...' : 'Add Restaurant'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}