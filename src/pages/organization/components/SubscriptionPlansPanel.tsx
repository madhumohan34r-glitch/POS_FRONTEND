import { useState, useEffect } from 'react';
import axios from 'axios';
import { CreditCard, Plus, Pencil, Loader2, Sparkles, Tags, Trash2, Check, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

// =========================================================
// TYPES — backend `subscription_plans.py` response shapes prakaram
// =========================================================
interface SubscriptionPlan {
  id: number;
  plan_name: string;
  monthly_price: number;
  yearly_price: number;
  description: string | null;
  status: string; // e.g. 'active' | 'inactive'
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
}

// ⚠️ GET /organization/features response lo id, feature_name matrame vastundi
// (feature_key, description, is_active list lo raavu — edit chేsinapudu ivi
// prefill cheయలేము, kotha values ivvali).
interface Feature {
  id: number;
  feature_name: string;
}

const emptyPlanForm = {
  plan_name: '',
  monthly_price: '',
  yearly_price: '',
  description: '',
  status: 'active',
};

const emptyFeatureForm = {
  feature_key: '',
  feature_name: '',
  description: '',
  is_active: true,
};

interface SubscriptionPlansPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SubscriptionPlansPanel({ open, onOpenChange }: SubscriptionPlansPanelProps) {
const { token } = useAuth();
  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [loadingFeatures, setLoadingFeatures] = useState(false);

  // ---- Plan create/edit form state ----
  const [planFormOpen, setPlanFormOpen] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<number | null>(null);
  const [planForm, setPlanForm] = useState(emptyPlanForm);
  const [savingPlan, setSavingPlan] = useState(false);

  // ---- Feature create/edit form state ----
  const [featureFormOpen, setFeatureFormOpen] = useState(false);
  const [editingFeatureId, setEditingFeatureId] = useState<number | null>(null);
  const [featureForm, setFeatureForm] = useState(emptyFeatureForm);
  const [savingFeature, setSavingFeature] = useState(false);

  // ---- Assign-features-to-plan state ----
  const [assignPlanId, setAssignPlanId] = useState<number | null>(null);
  const [selectedFeatureNames, setSelectedFeatureNames] = useState<string[]>([]);
  const [assigning, setAssigning] = useState(false);

  // ---- Manage a specific feature on the plan (toggle enable/disable, remove) ----
  const [manageFeatureName, setManageFeatureName] = useState<string>('');
  const [updatingFeatureStatus, setUpdatingFeatureStatus] = useState(false);
  const [removingFeature, setRemovingFeature] = useState(false);

  // =========================================================
  // FETCHERS
  // =========================================================
  const fetchPlans = async () => {
    try {
      setLoadingPlans(true);
      const res = await axios.get(`${API_URL}/organization/subscription-plans/list`, authHeaders);
      if (res.data?.success) setPlans(res.data.data ?? []);
      else toast.error(res.data?.message || 'Failed to load subscription plans');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to load subscription plans');
    } finally {
      setLoadingPlans(false);
    }
  };

  const fetchFeatures = async () => {
    try {
      setLoadingFeatures(true);
      // ⚠️ Ee endpoint response shape { features: [...] } — {success, data} kadu
      const res = await axios.get(`${API_URL}/organization/features`, authHeaders);
      setFeatures(res.data?.features ?? []);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to load features');
    } finally {
      setLoadingFeatures(false);
    }
  };

  useEffect(() => {
    if (open && token) {
      fetchPlans();
      fetchFeatures();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, token]);

  // =========================================================

  // =========================================================
  const startCreatePlan = () => {
    setEditingPlanId(null);
    setPlanForm(emptyPlanForm);
    setPlanFormOpen(true);
  };

  const startEditPlan = (p: SubscriptionPlan) => {
    setEditingPlanId(p.id);
    setPlanForm({
      plan_name: p.plan_name,
      monthly_price: String(p.monthly_price),
      yearly_price: String(p.yearly_price),
      description: p.description || '',
      status: p.status,
    });
    setPlanFormOpen(true);
  };

  const handleSavePlan = async () => {
    if (!planForm.plan_name || !planForm.monthly_price || !planForm.yearly_price) {
      toast.error('Plan name, monthly price and yearly price are required');
      return;
    }
    const payload = {
      plan_name: planForm.plan_name,
      monthly_price: Number(planForm.monthly_price),
      yearly_price: Number(planForm.yearly_price),
      description: planForm.description,
      status: planForm.status,
    };

    try {
      setSavingPlan(true);
      const res = editingPlanId
        ? await axios.put(`${API_URL}/organization/subscription_plans/update/${editingPlanId}`, payload, authHeaders)
        : await axios.post(`${API_URL}/organization/subscription-plans/create`, payload, authHeaders);

      if (!res.data?.success) {
        toast.error(res.data?.message || 'Failed to save plan');
        return;
      }
      toast.success(editingPlanId ? 'Plan updated successfully' : 'Plan created successfully');
      setPlanFormOpen(false);
      fetchPlans();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to save plan');
    } finally {
      setSavingPlan(false);
    }
  };

  // =========================================================
  // FEATURE: CREATE / UPDATE / DELETE
  // ✅ POST   /organization/features/create
  // ✅ PUT    /organization/features/update/{feature_id}
  // ✅ DELETE /organization/features/delete/{feature_id}
  // ⚠️ Edit chేsinapudu feature_key/description/is_active original values
  // teliyavu (list endpoint ivvadu) — kotha ga type cheyali, లేదా అలాగే
  // ఖాళీగా వదిలితే backend ki khaali/default values veltayi.
  // =========================================================
  const startCreateFeature = () => {
    setEditingFeatureId(null);
    setFeatureForm(emptyFeatureForm);
    setFeatureFormOpen(true);
  };

  const startEditFeature = (f: Feature) => {
    setEditingFeatureId(f.id);
    setFeatureForm({ ...emptyFeatureForm, feature_name: f.feature_name });
    setFeatureFormOpen(true);
  };

  const handleSaveFeature = async () => {
    if (!featureForm.feature_key || !featureForm.feature_name) {
      toast.error('Feature key and feature name are required');
      return;
    }
    try {
      setSavingFeature(true);
      const res = editingFeatureId
        ? await axios.put(`${API_URL}/organization/features/update/${editingFeatureId}`, featureForm, authHeaders)
        : await axios.post(`${API_URL}/organization/features/create`, featureForm, authHeaders);

      if (!res.data?.success) {
        toast.error(res.data?.message || 'Failed to save feature');
        return;
      }
      toast.success(editingFeatureId ? 'Feature updated successfully' : 'Feature created successfully');
      setFeatureFormOpen(false);
      fetchFeatures();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to save feature');
    } finally {
      setSavingFeature(false);
    }
  };

  const handleDeleteFeature = async (f: Feature) => {
    if (!window.confirm(`"${f.feature_name}" feature ni delete cheyala?`)) return;
    try {
      const res = await axios.delete(`${API_URL}/organization/features/delete/${f.id}`, authHeaders);
      if (!res.data?.success) {
        toast.error(res.data?.message || 'Failed to delete feature');
        return;
      }
      toast.success('Feature deleted successfully');
      fetchFeatures();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to delete feature');
    }
  };

  // =========================================================
  // ASSIGN FEATURES TO PLAN
  // ✅ POST /organization/subscription-plans/assign-features  body: {plan_id, feature_names}
  // ⚠️ Ee plan ki eppatike em features assign ayyayo chూపించే GET endpoint backend
  // lo ledu — so "already assigned" state track cheyalేకapోతున్నాం. Checkbox
  // anni ee session lo select chేసినవి matrame track chేస్తుంది.
  // =========================================================
  const openAssignFeatures = (planId: number) => {
    setAssignPlanId(planId);
    setSelectedFeatureNames([]);
    setManageFeatureName('');
  };

  const toggleFeatureSelection = (name: string) => {
    setSelectedFeatureNames((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  const handleAssignFeatures = async () => {
    if (!assignPlanId || selectedFeatureNames.length === 0) {
      toast.error('Select at least one feature to assign');
      return;
    }
    try {
      setAssigning(true);
      const res = await axios.post(
        `${API_URL}/organization/subscription-plans/assign-features`,
        { plan_id: assignPlanId, feature_names: selectedFeatureNames },
        authHeaders
      );
      if (!res.data?.success) {
        toast.error(res.data?.message || 'Failed to assign features');
        return;
      }
      toast.success(`Assigned: ${res.data.assigned_features?.join(', ') || 'done'}`);
      setAssignPlanId(null);
      setSelectedFeatureNames([]);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to assign features');
    } finally {
      setAssigning(false);
    }
  };

  // =========================================================
  // TOGGLE FEATURE STATUS ON PLAN (enable/disable)
  // ✅ PUT /organization/subscription-plans/update-feature
  //    body: UpdatePlanFeatureSchema { plan_id, feature_name, is_enabled }
  // ⚠️ Ee action work avvalante, feature ee plan ki already assign ayyi
  // undali (backend "Feature not assigned to this plan" ani check chestundi).
  // =========================================================
  const handleUpdateFeatureStatus = async (isEnabled: boolean) => {
    if (!assignPlanId || !manageFeatureName) {
      toast.error('Select a feature first');
      return;
    }
    try {
      setUpdatingFeatureStatus(true);
      const res = await axios.put(
        `${API_URL}/organization/subscription-plans/update-feature`,
        { plan_id: assignPlanId, feature_name: manageFeatureName, is_enabled: isEnabled },
        authHeaders
      );
      if (!res.data?.success) {
        toast.error(res.data?.message || 'Failed to update feature status');
        return;
      }
      toast.success(`"${manageFeatureName}" ${isEnabled ? 'enabled' : 'disabled'} on this plan`);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to update feature status');
    } finally {
      setUpdatingFeatureStatus(false);
    }
  };

  // =========================================================
  // REMOVE FEATURE FROM PLAN (delete mapping)
  // ✅ DELETE /organization/subscription-plans/delete-feature
  //    body: DeletePlanFeatureSchema { plan_id, feature_name }
  // ⚠️ axios.delete తో body pంపాలంటే { data: {...} } wrapper కావాలి.
  // =========================================================
  const handleRemoveFeatureFromPlan = async () => {
    if (!assignPlanId || !manageFeatureName) {
      toast.error('Select a feature first');
      return;
    }
    if (!window.confirm(`"${manageFeatureName}" ni ee plan nunchi remove cheyala?`)) return;
    try {
      setRemovingFeature(true);
      const res = await axios.delete(
        `${API_URL}/organization/subscription-plans/delete-feature`,
        { ...authHeaders, data: { plan_id: assignPlanId, feature_name: manageFeatureName } }
      );
      if (!res.data?.success) {
        toast.error(res.data?.message || 'Failed to remove feature');
        return;
      }
      toast.success(`"${manageFeatureName}" removed from plan`);
      setManageFeatureName('');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to remove feature');
    } finally {
      setRemovingFeature(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" /> Subscription Plans & Features
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="plans">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="plans">Plans</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
          </TabsList>

          {/* =========================================================
              PLANS TAB
          ========================================================= */}
          <TabsContent value="plans" className="space-y-3 mt-4">
            {!planFormOpen && (
              <Button size="sm" className="rounded-xl" onClick={startCreatePlan}>
                <Plus className="h-4 w-4 mr-1" /> New Plan
              </Button>
            )}

            {planFormOpen && (
              <div className="p-4 rounded-xl border border-border bg-muted/30 space-y-3">
                <p className="text-sm font-medium">{editingPlanId ? 'Edit Plan' : 'Create New Plan'}</p>
                <div>
                  <Label className="text-xs">Plan Name *</Label>
                  <Input
                    value={planForm.plan_name}
                    onChange={(e) => setPlanForm((s) => ({ ...s, plan_name: e.target.value }))}
                    className="rounded-xl mt-1"
                    placeholder="e.g. Pro"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Monthly Price *</Label>
                    <Input
                      type="number"
                      value={planForm.monthly_price}
                      onChange={(e) => setPlanForm((s) => ({ ...s, monthly_price: e.target.value }))}
                      className="rounded-xl mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Yearly Price *</Label>
                    <Input
                      type="number"
                      value={planForm.yearly_price}
                      onChange={(e) => setPlanForm((s) => ({ ...s, yearly_price: e.target.value }))}
                      className="rounded-xl mt-1"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Description</Label>
                  <Textarea
                    value={planForm.description}
                    onChange={(e) => setPlanForm((s) => ({ ...s, description: e.target.value }))}
                    className="rounded-xl mt-1"
                    rows={2}
                  />
                </div>
                <div>
                  <Label className="text-xs">Status</Label>
                  <Select value={planForm.status} onValueChange={(v) => setPlanForm((s) => ({ ...s, status: v }))}>
                    <SelectTrigger className="rounded-xl mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button size="sm" variant="outline" className="rounded-xl" onClick={() => setPlanFormOpen(false)} disabled={savingPlan}>
                    <X className="h-4 w-4 mr-1" /> Cancel
                  </Button>
                  <Button size="sm" className="rounded-xl" onClick={handleSavePlan} disabled={savingPlan}>
                    {savingPlan ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}
                    {editingPlanId ? 'Save Changes' : 'Create Plan'}
                  </Button>
                </div>
              </div>
            )}

            {loadingPlans ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground p-4">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading plans...
              </div>
            ) : plans.length === 0 ? (
              <p className="text-sm text-muted-foreground p-4 text-center">No subscription plans yet.</p>
            ) : (
              <div className="space-y-2">
                {plans.map((p) => (
                  <div key={p.id} className="rounded-xl border border-border overflow-hidden">
                    <div className="p-3 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-sm">{p.plan_name}</p>
                          <Badge className={`text-[10px] ${p.status === 'active' ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>
                            {p.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          ₹{p.monthly_price}/mo · ₹{p.yearly_price}/yr
                        </p>
                        {p.description && <p className="text-xs text-muted-foreground mt-1">{p.description}</p>}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button
                          size="icon"
                          variant={assignPlanId === p.id ? 'secondary' : 'ghost'}
                          className="h-8 w-8 rounded-lg"
                          onClick={() => (assignPlanId === p.id ? setAssignPlanId(null) : openAssignFeatures(p.id))}
                        >
                          <Sparkles className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg" onClick={() => startEditPlan(p)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* ✅ FIXED: ee panel ippudu AA SPECIFIC plan card lopalే inline
                        ga expand avutundi — plans list kinda veru ga kadu. */}
                    {assignPlanId === p.id && (
                      <div className="p-4 border-t border-border bg-primary/5 space-y-3">
                        <p className="text-sm font-medium flex items-center gap-1.5">
                          <Sparkles className="h-4 w-4 text-primary" />
                          Assign features to "{p.plan_name}"
                        </p>
                        {/* ⚠️ Ee list already-assigned features ni highlight cheyadu — backend
                            lo per-plan assigned-features GET endpoint ledu kabatti. */}
                        <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                          {features.map((f) => (
                            <label key={f.id} className="flex items-center gap-2 text-xs cursor-pointer">
                              <Checkbox
                                checked={selectedFeatureNames.includes(f.feature_name)}
                                onCheckedChange={() => toggleFeatureSelection(f.feature_name)}
                              />
                              {f.feature_name}
                            </label>
                          ))}
                        </div>
                        <Button size="sm" className="rounded-xl" onClick={handleAssignFeatures} disabled={assigning}>
                          {assigning ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}
                          Assign Selected
                        </Button>

                        {/* =========================================================
                            MANAGE A SPECIFIC FEATURE ON THIS PLAN — enable/disable
                            or remove. Ee feature ee plan ki already assign ayyi
                            unte matrame pని chēస్తుంది (backend "not assigned" ani
                            check chestundi).
                        ========================================================= */}
                        <div className="pt-3 border-t border-border/60 space-y-2">
                          <p className="text-xs font-medium text-muted-foreground">Toggle or remove a feature on this plan</p>
                          <Select value={manageFeatureName} onValueChange={setManageFeatureName}>
                            <SelectTrigger className="rounded-xl h-9"><SelectValue placeholder="Select a feature" /></SelectTrigger>
                            <SelectContent>
                              {features.map((f) => (
                                <SelectItem key={f.id} value={f.feature_name}>{f.feature_name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-xl"
                              onClick={() => handleUpdateFeatureStatus(true)}
                              disabled={updatingFeatureStatus || !manageFeatureName}
                            >
                              {updatingFeatureStatus ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}
                              Enable
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-xl"
                              onClick={() => handleUpdateFeatureStatus(false)}
                              disabled={updatingFeatureStatus || !manageFeatureName}
                            >
                              <X className="h-4 w-4 mr-1" /> Disable
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="rounded-xl ml-auto"
                              onClick={handleRemoveFeatureFromPlan}
                              disabled={removingFeature || !manageFeatureName}
                            >
                              {removingFeature ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Trash2 className="h-4 w-4 mr-1" />}
                              Remove
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* =========================================================
              FEATURES TAB
          ========================================================= */}
          <TabsContent value="features" className="space-y-3 mt-4">
            {!featureFormOpen && (
              <Button size="sm" className="rounded-xl" onClick={startCreateFeature}>
                <Plus className="h-4 w-4 mr-1" /> New Feature
              </Button>
            )}

            {featureFormOpen && (
              <div className="p-4 rounded-xl border border-border bg-muted/30 space-y-3">
                <p className="text-sm font-medium">{editingFeatureId ? 'Edit Feature' : 'Create New Feature'}</p>
                {editingFeatureId && (
                  <p className="text-[11px] text-muted-foreground">
                    ⚠️ Original feature_key/description ee list nunchi teliyavu — anni fields kotha ga fill cheయండి.
                  </p>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Feature Key *</Label>
                    <Input
                      value={featureForm.feature_key}
                      onChange={(e) => setFeatureForm((s) => ({ ...s, feature_key: e.target.value }))}
                      placeholder="e.g. qr_ordering"
                      className="rounded-xl mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Feature Name *</Label>
                    <Input
                      value={featureForm.feature_name}
                      onChange={(e) => setFeatureForm((s) => ({ ...s, feature_name: e.target.value }))}
                      placeholder="e.g. QR Ordering"
                      className="rounded-xl mt-1"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Description</Label>
                  <Textarea
                    value={featureForm.description}
                    onChange={(e) => setFeatureForm((s) => ({ ...s, description: e.target.value }))}
                    className="rounded-xl mt-1"
                    rows={2}
                  />
                </div>
                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <Checkbox
                    checked={featureForm.is_active}
                    onCheckedChange={(v) => setFeatureForm((s) => ({ ...s, is_active: !!v }))}
                  />
                  Active
                </label>
                <div className="flex justify-end gap-2">
                  <Button size="sm" variant="outline" className="rounded-xl" onClick={() => setFeatureFormOpen(false)} disabled={savingFeature}>
                    <X className="h-4 w-4 mr-1" /> Cancel
                  </Button>
                  <Button size="sm" className="rounded-xl" onClick={handleSaveFeature} disabled={savingFeature}>
                    {savingFeature ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}
                    {editingFeatureId ? 'Save Changes' : 'Create Feature'}
                  </Button>
                </div>
              </div>
            )}

            {loadingFeatures ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground p-4">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading features...
              </div>
            ) : features.length === 0 ? (
              <p className="text-sm text-muted-foreground p-4 text-center">No features yet.</p>
            ) : (
              <div className="space-y-1.5">
                {features.map((f) => (
                  <div key={f.id} className="p-2.5 rounded-xl border border-border flex items-center justify-between">
                    <span className="text-sm flex items-center gap-2"><Tags className="h-3.5 w-3.5 text-muted-foreground" /> {f.feature_name}</span>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg" onClick={() => startEditFeature(f)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg text-destructive" onClick={() => handleDeleteFeature(f)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
