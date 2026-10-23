import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, Clock, CreditCard, Sparkles, Plus, Edit2, Trash2, Save, Check, Image, Upload, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { useCafeStore, type Discount } from '@/lib/cafe-store';
import { toast } from 'sonner';

// Zod & React Hook Form
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { useSettingsDashboard, useMenuDashboard, useUpdateSettings } from '@/tanstack/alltanstack';

// The backend does not store CGST/SGST rates yet, so the form uses these defaults.
const DEFAULT_GST_RATE = 2.5;
const ALL_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// --- Helper to format 24h to 12h AM/PM for backend ---
const formatTimeForBackend = (time24: string) => {
  if (!time24) return "09:00 AM";
  const [h, m] = time24.split(':');
  const hours = parseInt(h, 10);
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;
  return `${hours12.toString().padStart(2, '0')}:${m} ${suffix}`;
};

// --- Helper to format backend "09:00 AM" back to <input type="time"> "09:00" ---
const formatTimeForInput = (time12: string | null | undefined) => {
  if (!time12) return '';
  const match = time12.trim().match(/^(\d{1,2}):(\d{2})\s*([AP]M)$/i);
  if (!match) return '';
  let [, h, m, suffix] = match;
  let hours = parseInt(h, 10);
  if (suffix.toUpperCase() === 'PM' && hours !== 12) hours += 12;
  if (suffix.toUpperCase() === 'AM' && hours === 12) hours = 0;
  return `${hours.toString().padStart(2, '0')}:${m}`;
};

// Backend stores payment_mode as 'all' | 'cash' | 'card' (see settings.py's
// map_default_payment_mode — it conflates payment timing with payment
// method, which is lossy). This is a best-effort reverse mapping so the
// form shows *something* sensible; it is not guaranteed to match what the
// admin originally picked, since the forward mapping already lost that
// information at save time.
const mapBackendPaymentMode = (mode: string | null | undefined): 'prepayment' | 'postpayment' | 'both' => {
  if (mode === 'cash') return 'prepayment';
  if (mode === 'card') return 'postpayment';
  return 'both';
};

// --- Zod Schema ---
const settingsSchema = z.object({
  name: z.string().min(2, "Cafe name required"),
  phone: z.string().min(10, "Valid phone number required"),
  address: z.string().min(5, "Address required"),
  currency: z.string().min(1, "Currency required"),
  gstNumber: z.string().optional(),
  cgstRate: z.number().min(0),
  sgstRate: z.number().min(0),
  openingTime: z.string().regex(/^\d{2}:\d{2}$/, "Required"),
  closingTime: z.string().regex(/^\d{2}:\d{2}$/, "Required"),
  operationalDays: z.array(z.string()).min(1, "Select at least 1 day"),
  paymentMode: z.enum(['prepayment', 'postpayment', 'both']),
  postPaymentDirectToKDS: z.boolean(),
  feedbackEnabled: z.boolean(),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export default function SettingsTab() {
  // Discounts only (no backend support yet)
  const { discounts, addDiscount, updateDiscount, deleteDiscount, toggleDiscount } = useCafeStore();

  // Menu items come from the backend (used for the "Specific Item" discount scope)
  const { data: menuData } = useMenuDashboard();
  const menuItems: any[] = menuData?.menu_details || [];

  // GET /admin/settings/settings/show_settings
  const { data: settingsData } = useSettingsDashboard();
  const updateSettingsMut = useUpdateSettings();

  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const [logoPreview, setLogoPreview] = useState('');
  const [bannerPreview, setBannerPreview] = useState('');

  const [showAddDiscount, setShowAddDiscount] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<string | null>(null);
  const [newDiscount, setNewDiscount] = useState<Omit<Discount, 'id'>>({ name: '', type: 'percentage', value: 10, scope: 'global', active: true });

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      name: '',
      phone: '',
      address: '',
      currency: 'INR',
      gstNumber: '',
      cgstRate: DEFAULT_GST_RATE,
      sgstRate: DEFAULT_GST_RATE,
      openingTime: '09:00',
      closingTime: '22:00',
      operationalDays: ALL_DAYS,
      paymentMode: 'both',
      postPaymentDirectToKDS: false,
      feedbackEnabled: false
    }
  });

  // Fill the form once show_settings data arrives
  useEffect(() => {
    const s = settingsData?.settings;
    if (!s) return;
    reset({
      name: s.restaurant_name ?? '',
      phone: s.phone_number ?? '',
      address: s.address ?? '',
      currency: s.currency ?? 'INR',
      gstNumber: s.gst_number ?? '',
      cgstRate: DEFAULT_GST_RATE,
      sgstRate: DEFAULT_GST_RATE,
      openingTime: formatTimeForInput(s.opening_time) || '09:00',
      closingTime: formatTimeForInput(s.closing_time) || '22:00',
      operationalDays: ALL_DAYS,
      paymentMode: mapBackendPaymentMode(s.payment_mode),
      postPaymentDirectToKDS: Boolean(s.post_payment_order_control),
      feedbackEnabled: Boolean(s.feedback_enabled),
    });
    if (s.brand_logo_url) setLogoPreview(s.brand_logo_url);
    if (s.banner_image_url) setBannerPreview(s.banner_image_url);
  }, [settingsData, reset]);

  const currentDays = watch('operationalDays');
  const currentMode = watch('paymentMode');
  const postPaymentKDS = watch('postPaymentDirectToKDS');
  const fbEnabled = watch('feedbackEnabled');

  const handleFileUpload = (type: 'logo' | 'banner', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      if (type === 'logo') setLogoPreview(reader.result as string);
      else setBannerPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const onSubmit = (data: SettingsFormValues) => {
    // Backend expects an http(s) URL (Pydantic HttpUrl). A locally picked image is only a
    // base64 preview, so until a real image-upload endpoint exists we send a placeholder URL.
    const safeLogo = logoPreview.startsWith('http') ? logoPreview : 'https://placehold.co/150x150/png';
    const safeBanner = bannerPreview.startsWith('http') ? bannerPreview : 'https://placehold.co/800x200/png';

    // 1. Create the operational hours payload once
    const opsHoursPayload = {
      opening_time: formatTimeForBackend(data.openingTime),
      closing_time: formatTimeForBackend(data.closingTime),
      operational_days: data.operationalDays
    };

    // 2. Construct the nested payload the backend requires
    const payload = {
      branding: {
        logo_url: safeLogo,
        banner_url: safeBanner
      },
      business_details: {
        cafe_name: data.name,
        phone: data.phone,
        address: data.address,
        currency: { code: data.currency, symbol: "₹" },
        tax_configuration: {
          gst_number: data.gstNumber || "NA",
          cgst_rate: data.cgstRate,
          sgst_rate: data.sgstRate,
          total_gst_rate: data.cgstRate + data.sgstRate
        },
        // Pydantic strictly requires this key to be present here
        operational_hours: opsHoursPayload
      },
      // The backend SettingsRequest also expects it at the root
      operational_hours: opsHoursPayload,

      payment_modes: {
        available_options: ["pre-payment", "post-payment"],
        default_mode: data.paymentMode,
        description: "Payment config"
      },
      post_payment_order_control: {
        enabled: data.postPaymentDirectToKDS,
        send_to_counter_for_review: !data.postPaymentDirectToKDS
      },
      user_feedback: {
        enabled: data.feedbackEnabled,
        description: "Customer feedback collection"
      },
      offers_and_discounts: {
        offers: discounts.map(d => ({
          offer_id: d.id,
          title: d.name,
          type: d.type,
          value: d.value,
          applicable_on: d.scope,
          is_active: d.active
        }))
      }
    };

    updateSettingsMut.mutate(payload);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-20">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Branding */}
        <div className="rounded-2xl bg-card border border-border cafe-shadow p-4 sm:p-6">
          <h3 className="font-heading font-bold text-foreground mb-4 text-sm sm:text-base">Branding</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <Label className="text-sm">Logo</Label>
              <div className="mt-2 flex flex-col items-center gap-3">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo preview" className="h-24 w-24 object-contain rounded-xl border border-border" />
                ) : (
                  <div className="h-24 w-24 rounded-xl border-2 border-dashed border-border flex items-center justify-center">
                    <Image className="h-8 w-8 text-muted-foreground/30" />
                  </div>
                )}
                <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={e => handleFileUpload('logo', e)} />
                <Button type="button" variant="outline" size="sm" className="rounded-xl" onClick={() => logoInputRef.current?.click()}>
                  <Upload className="h-3 w-3 mr-1" /> Upload Logo
                </Button>
              </div>
            </div>
            <div>
              <Label className="text-sm">Banner</Label>
              <div className="mt-2 flex flex-col items-center gap-3">
                {bannerPreview ? (
                  <img src={bannerPreview} alt="Banner preview" className="w-full h-24 object-cover rounded-xl border border-border" />
                ) : (
                  <div className="w-full h-24 rounded-xl border-2 border-dashed border-border flex items-center justify-center">
                    <Image className="h-8 w-8 text-muted-foreground/30" />
                  </div>
                )}
                <input ref={bannerInputRef} type="file" accept="image/*" className="hidden" onChange={e => handleFileUpload('banner', e)} />
                <Button type="button" variant="outline" size="sm" className="rounded-xl" onClick={() => bannerInputRef.current?.click()}>
                  <Upload className="h-3 w-3 mr-1" /> Upload Banner
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Business Details */}
        <div className="rounded-2xl bg-card border border-border cafe-shadow p-4 sm:p-6 space-y-4">
          <h3 className="font-heading font-bold text-foreground text-sm sm:text-base">Business Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Cafe Name</Label>
              <Input {...register('name')} className="mt-1 rounded-xl" />
              {errors.name && <p className="text-[10px] text-destructive">{errors.name.message}</p>}
            </div>
            <div>
              <Label>Phone</Label>
              <Input {...register('phone')} className="mt-1 rounded-xl" />
              {errors.phone && <p className="text-[10px] text-destructive">{errors.phone.message}</p>}
            </div>
            <div className="sm:col-span-2">
              <Label>Address</Label>
              <Input {...register('address')} className="mt-1 rounded-xl" />
              {errors.address && <p className="text-[10px] text-destructive">{errors.address.message}</p>}
            </div>
            <div>
              <Label>Currency Code</Label>
              <Input {...register('currency')} className="mt-1 rounded-xl" />
              {errors.currency && <p className="text-[10px] text-destructive">{errors.currency.message}</p>}
            </div>
          </div>
        </div>

        {/* Tax Configuration */}
        <div className="rounded-2xl bg-card border border-border cafe-shadow p-4 sm:p-6 space-y-4">
          <h3 className="font-heading font-bold text-foreground text-sm sm:text-base flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" /> Tax Configuration (GST)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label>GST Number</Label>
              <Input {...register('gstNumber')} className="mt-1 rounded-xl" />
            </div>
            <div>
              <Label>CGST Rate (%)</Label>
              <Input type="number" step={0.1} {...register('cgstRate', { valueAsNumber: true })} className="mt-1 rounded-xl" />
              {errors.cgstRate && <p className="text-[10px] text-destructive">{errors.cgstRate.message}</p>}
            </div>
            <div>
              <Label>SGST Rate (%)</Label>
              <Input type="number" step={0.1} {...register('sgstRate', { valueAsNumber: true })} className="mt-1 rounded-xl" />
              {errors.sgstRate && <p className="text-[10px] text-destructive">{errors.sgstRate.message}</p>}
            </div>
          </div>
        </div>

        {/* Operational Hours */}
        <div className="rounded-2xl bg-card border border-border cafe-shadow p-4 sm:p-6 space-y-4">
          <h3 className="font-heading font-bold text-foreground text-sm sm:text-base flex items-center gap-2">
            <Clock className="h-5 w-5 text-info" /> Operational Hours
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Opening Time</Label>
              <Input type="time" {...register('openingTime')} className="mt-1 rounded-xl" />
            </div>
            <div>
              <Label>Closing Time</Label>
              <Input type="time" {...register('closingTime')} className="mt-1 rounded-xl" />
            </div>
          </div>
          <div>
            <Label className="text-sm">Operational Days</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {ALL_DAYS.map(day => (
                <button type="button" key={day} onClick={() => {
                  const days = currentDays || [];
                  setValue('operationalDays', days.includes(day) ? days.filter(d => d !== day) : [...days, day], { shouldValidate: true });
                }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium border-2 transition-all ${
                    (currentDays || []).includes(day) ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground'
                  }`}>
                  {day}
                </button>
              ))}
            </div>
            {errors.operationalDays && <p className="text-[10px] text-destructive mt-1">{errors.operationalDays.message}</p>}
          </div>
        </div>

        {/* Payment Modes */}
        <div className="rounded-2xl bg-card border border-border cafe-shadow p-4 sm:p-6 space-y-4">
          <h3 className="font-heading font-bold text-foreground text-sm sm:text-base flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-accent" /> Default Payment Mode
          </h3>
          <p className="text-xs text-muted-foreground">Select the default payment flow used across panels.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {([
              { id: 'prepayment' as const, label: 'Pre-Payment', desc: 'Pay before ordering', icon: '💳' },
              { id: 'postpayment' as const, label: 'Post-Payment', desc: 'Pay after eating', icon: '🧾' },
              { id: 'both' as const, label: 'Both', desc: 'Customer can choose', icon: '🔄' },
            ]).map(mode => (
              <button type="button" key={mode.id} onClick={() => setValue('paymentMode', mode.id)}
                className={`p-4 rounded-xl border-2 text-left transition-all relative ${currentMode === mode.id ? 'border-primary bg-primary/5 glow-primary' : 'border-border hover:border-primary/30'}`}>
                {currentMode === mode.id && (
                  <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-success flex items-center justify-center">
                    <Check className="h-4 w-4 text-success-foreground" />
                  </div>
                )}
                <span className="text-2xl mb-2 block">{mode.icon}</span>
                <p className="text-sm font-medium">{mode.label}</p>
                <p className="text-[10px] text-muted-foreground">{mode.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Post-Payment Order Control */}
        <div className="rounded-2xl bg-card border border-border cafe-shadow p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-heading font-bold text-foreground text-sm sm:text-base flex items-center gap-2">
                🔀 Post-Payment KDS Routing
              </h3>
              <p className="text-xs text-muted-foreground mt-1">When ON, post-payment orders go directly to Kitchen, bypassing Counter review.</p>
            </div>
            <Switch checked={postPaymentKDS} onCheckedChange={v => setValue('postPaymentDirectToKDS', v)} />
          </div>
        </div>

        {/* User Feedback Toggle */}
        <div className="rounded-2xl bg-card border border-border cafe-shadow p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-heading font-bold text-foreground text-sm sm:text-base flex items-center gap-2">
                ⭐ User Feedback Collection
              </h3>
              <p className="text-xs text-muted-foreground mt-1">When enabled, customers can submit feedback and ratings.</p>
            </div>
            <Switch checked={fbEnabled} onCheckedChange={v => setValue('feedbackEnabled', v)} />
          </div>
        </div>

        {/* Action Button */}
        <Button type="submit" disabled={updateSettingsMut.isPending} className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground w-full sm:w-auto rounded-xl">
          {updateSettingsMut.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Save Configuration
        </Button>
      </form>

      {/* Offers & Discounts (still local: the backend has no discount table/endpoints yet) */}
      <div className="rounded-2xl bg-card border border-border cafe-shadow p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-heading font-bold text-foreground text-sm sm:text-base flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent" /> Offers & Discounts
          </h3>
          <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setShowAddDiscount(true)}>
            <Plus className="h-4 w-4 mr-1" /> Add Discount
          </Button>
        </div>
        {/* NOTE: discounts are currently local-only — the backend accepts
            offers_and_discounts in the save payload but does not persist
            it anywhere (no Discount model/table exists yet). These will
            not survive a different browser/device login until that's built. */}
        <div className="space-y-3">
          {discounts.map(d => (
            <div key={d.id} className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/20">
              <div className="flex items-center gap-3">
                <Switch checked={d.active} onCheckedChange={() => toggleDiscount(d.id)} />
                <div>
                  <p className="text-sm font-medium">{d.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {d.type === 'percentage' ? `${d.value}% off` : `₹${d.value} off`} • {d.scope === 'global' ? 'All items' : `Item: ${menuItems.find(i => String(i.id) === String(d.itemId))?.item_name || d.itemId}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" className="text-primary h-8 w-8" onClick={() => {
                  setEditingDiscount(d.id);
                  setNewDiscount({ name: d.name, type: d.type, value: d.value, scope: d.scope, itemId: d.itemId, active: d.active });
                }}>
                  <Edit2 className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="sm" className="text-destructive h-8 w-8" onClick={() => deleteDiscount(d.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
          {discounts.length === 0 && <p className="text-center text-muted-foreground py-4 text-sm">No discounts configured</p>}
        </div>
      </div>

      {/* --- MODALS --- */}

      {/* Add / Edit Discount Dialog (Combined for simplicity) */}
      <AnimatePresence>
        {(showAddDiscount || editingDiscount) && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => { setShowAddDiscount(false); setEditingDiscount(null); }}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={e => e.stopPropagation()} className="bg-background rounded-2xl border border-border p-6 cafe-shadow-lg w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading font-bold text-lg">{editingDiscount ? 'Edit Discount' : 'Add Discount'}</h3>
                <button onClick={() => { setShowAddDiscount(false); setEditingDiscount(null); }} className="h-8 w-8 rounded-xl bg-muted flex items-center justify-center"><X className="h-4 w-4" /></button>
              </div>
              <div className="space-y-4">
                <div><Label>Discount Name</Label><Input value={newDiscount.name} onChange={e => setNewDiscount({ ...newDiscount, name: e.target.value })} className="mt-1 rounded-xl" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Type</Label>
                    <Select value={newDiscount.type} onValueChange={(v: 'percentage' | 'flat') => setNewDiscount({ ...newDiscount, type: v })}>
                      <SelectTrigger className="mt-1 rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="percentage">Percentage (%)</SelectItem><SelectItem value="flat">Flat (₹)</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div><Label>Value</Label><Input type="number" value={newDiscount.value} onChange={e => setNewDiscount({ ...newDiscount, value: Number(e.target.value) })} className="mt-1 rounded-xl" /></div>
                </div>
                <div>
                  <Label>Scope</Label>
                  <Select value={newDiscount.scope} onValueChange={(v: 'global' | 'item') => setNewDiscount({ ...newDiscount, scope: v })}>
                    <SelectTrigger className="mt-1 rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="global">All Items</SelectItem><SelectItem value="item">Specific Item</SelectItem></SelectContent>
                  </Select>
                </div>
                {newDiscount.scope === 'item' && (
                  <div>
                    <Label>Select Item</Label>
                    <Select value={newDiscount.itemId || ''} onValueChange={v => setNewDiscount({ ...newDiscount, itemId: v })}>
                      <SelectTrigger className="mt-1 rounded-xl"><SelectValue placeholder="Choose item" /></SelectTrigger>
                      <SelectContent>{menuItems.map(i => <SelectItem key={i.id} value={String(i.id)}>{i.item_name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <Button onClick={() => {
                if (!newDiscount.name) return toast.error('Discount name required');
                if (editingDiscount) {
                  updateDiscount(editingDiscount, newDiscount);
                  toast.success('Discount updated! Remember to click Save Configuration.');
                } else {
                  addDiscount(newDiscount);
                  toast.success('Discount added! Remember to click Save Configuration.');
                }
                setNewDiscount({ name: '', type: 'percentage', value: 10, scope: 'global', active: true });
                setEditingDiscount(null);
                setShowAddDiscount(false);
              }} className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground mt-6 w-full rounded-xl">
                {editingDiscount ? <Save className="h-4 w-4 mr-1" /> : <Plus className="h-4 w-4 mr-1" />} {editingDiscount ? 'Save' : 'Add Discount'}
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}