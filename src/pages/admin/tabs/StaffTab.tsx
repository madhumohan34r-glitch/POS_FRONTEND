



import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Edit2, Trash2, ShieldPlus, X, Save, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

// Zod & React Hook Form
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

// TanStack Hooks
import {
  useStaffDashboard,
  useAddRole,
  useAddStaff,
  useUpdateStaff,
  useDeleteStaff
} from '@/tanstack/alltanstack';

const allPermissions = [
  'manage_menu', 'manage_staff', 'view_reports', 'manage_tables',
  'manage_settings', 'create_orders', 'process_payments',
  'view_orders', 'update_order_status'
];

// --- Zod Schemas ---
// NOTE: field names here (full_name, phone_number, active_status) are the
// exact backend field names — AllApi.ts's addStaffAPI/updateStaffAPI now
// send this object straight through, no remapping. Keep these names in
// sync with Add_Staff / Update_Staff in staff_schemas.py if you rename
// anything on either side.
const staffSchema = z.object({
  full_name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email format'),
  password: z.string().optional(), // Optional because Edit doesn't need it
  role: z.string().min(1, 'Role is required'),
  shift: z.string().min(1, 'Shift is required'),
  phone_number: z.string().min(10, 'Valid phone number required'),
  active_status: z.boolean()
});

type StaffFormValues = z.infer<typeof staffSchema>;

export default function StaffTab() {
  // Queries & Mutations
  const { data: dashboardData, isLoading } = useStaffDashboard();
  const addRoleMut = useAddRole();
  const addStaffMut = useAddStaff();
  const updateStaffMut = useUpdateStaff();
  const deleteStaffMut = useDeleteStaff();

  // Extract backend data safely
  const staffList = dashboardData?.staff_details || [];
  const rolesList = dashboardData?.roles || [];

  // Local State
  const [staffSearch, setStaffSearch] = useState('');
  const [staffRoleFilter, setStaffRoleFilter] = useState('all');

  // Modals
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState<number | null>(null);
  const [showDeleteStaff, setShowDeleteStaff] = useState<number | null>(null);
  const [showAddRole, setShowAddRole] = useState(false);

  // Role Form State (Simple enough not to need Zod)
  const [newRoleName, setNewRoleName] = useState('');
  const [newRolePermissions, setNewRolePermissions] = useState<string[]>([]);

  // React Hook Form for Staff
  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<StaffFormValues>({
    resolver: zodResolver(staffSchema),
    defaultValues: {
      full_name: '', email: '', password: '', role: '', shift: '', phone_number: '', active_status: true
    }
  });

  const formRole = watch('role');
  const formShift = watch('shift');
  const formActive = watch('active_status');

  // Filter Logic
  const filteredStaff = useMemo(() => {
    let result = staffList;
    if (staffRoleFilter !== 'all') {
      result = result.filter((s: any) => s.role?.toLowerCase() === staffRoleFilter.toLowerCase());
    }
    if (staffSearch) {
      result = result.filter((s: any) => s.staff_name?.toLowerCase().includes(staffSearch.toLowerCase()));
    }
    return result;
  }, [staffList, staffRoleFilter, staffSearch]);

  // --- Handlers ---

  const openAddStaff = () => {
    reset({ full_name: '', email: '', password: '', role: '', shift: '', phone_number: '', active_status: true });
    setEditingStaffId(null);
    setShowAddStaff(true);
  };

  const openEditStaff = (staff: any) => {
    reset({
      full_name: staff.staff_name,
      email: staff.email,
      password: '', // Password not sent on edit per your backend schema
      role: staff.role || '',
      shift: staff.shiftings || '',
      
      phone_number: staff.phone_number || '',
      active_status: staff.active_status === 'active'
    });
    setEditingStaffId(staff.staff_id);
  };

  const onStaffSubmit = (data: StaffFormValues) => {
    if (editingStaffId) {
      // Edit — no password field, matches Update_Staff schema
      const payload = {
        full_name: data.full_name,
        email: data.email,
        role: data.role,
        shift: data.shift,
        phone_number: data.phone_number,
        active_status: data.active_status
      };
      updateStaffMut.mutate({ id: editingStaffId, data: payload as any }, {
        onSuccess: () => { setEditingStaffId(null); reset(); }
      });
    } else {
      // Add — password required
      if (!data.password) {
        toast.error("Password is required for new staff");
        return;
      }
      addStaffMut.mutate(data as any, {
        onSuccess: () => { setShowAddStaff(false); reset(); }
      });
    }
  };

  const confirmDeleteStaff = () => {
    if (showDeleteStaff) {
      deleteStaffMut.mutate(showDeleteStaff, {
        onSuccess: () => setShowDeleteStaff(null)
      });
    }
  };

  const handleAddRole = () => {
    if (!newRoleName.trim()) { toast.error('Role name required'); return; }
    addRoleMut.mutate({ role_name: newRoleName.trim(), permissions: newRolePermissions }, {
      onSuccess: () => {
        setShowAddRole(false);
        setNewRoleName('');
        setNewRolePermissions([]);
      }
    });
  };

  if (isLoading) {
    return <div className="py-20 flex justify-center text-muted-foreground"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Staff Directory Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none sm:w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search staff..." value={staffSearch} onChange={e => setStaffSearch(e.target.value)} className="pl-9 h-10 rounded-xl" />
            </div>
            <Select value={staffRoleFilter} onValueChange={setStaffRoleFilter}>
              <SelectTrigger className="w-36 h-10 rounded-xl"><SelectValue placeholder="All Roles" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {rolesList.map((r: any) => <SelectItem key={r.role_name} value={r.role_name.toLowerCase()}>{r.role_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-xl" onClick={openAddStaff}>
            <Plus className="h-4 w-4 mr-1" /> Add Staff
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStaff.map((s: any, idx: number) => (
            <div key={s.staff_id  || idx} className="p-4 sm:p-5 rounded-2xl bg-card border border-border cafe-shadow hover:cafe-shadow-lg transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-lg">
                    {s.role?.toLowerCase().includes('chef') ? '👨‍🍳' : s.role?.toLowerCase().includes('admin') ? '👔' : '🧑‍💼'}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-semibold text-sm text-foreground truncate">{s.staff_name}</h4>
                    <p className="text-xs text-muted-foreground truncate">{s.email}</p>
                  </div>
                </div>
                <Badge className={`text-[10px] ${s.active_status === 'active' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                  {s.active_status}
                </Badge>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="outline" className="text-xs truncate max-w-[100px]">{s.role || 'No Role'}</Badge>
                <Badge variant="outline" className="text-xs capitalize">{s.shiftings || 'N/A'}</Badge>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 h-8 text-xs rounded-lg" onClick={() => openEditStaff(s)}>
                  <Edit2 className="h-3 w-3 mr-1" /> Edit
                </Button>
                <Button variant="outline" size="sm" className="h-8 text-xs text-destructive rounded-lg" onClick={() => setShowDeleteStaff(s.staff_id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
          {filteredStaff.length === 0 && <div className="col-span-full py-10 text-center text-muted-foreground">No staff members found.</div>}
        </div>
      </div>

      {/* Roles & Permissions Section */}
      <div className="space-y-4 pt-4 border-t border-border">
        <div className="flex items-center justify-between">
          <h3 className="font-heading font-bold text-foreground flex items-center gap-2"><ShieldPlus className="h-5 w-5 text-primary" /> Roles</h3>
          <Button variant="outline" className="rounded-xl" onClick={() => setShowAddRole(true)}>
            <Plus className="h-4 w-4 mr-1" /> Add Role
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {rolesList.map((r: any, idx: number) => (
            <div key={idx} className="p-4 rounded-2xl bg-card border border-border cafe-shadow">
              <h4 className="font-semibold text-sm text-foreground mb-2">{r.role_name}</h4>
              <div className="flex flex-wrap gap-1">
                {r.permissions.map((p: string) => (
                  <Badge key={p} variant="outline" className="text-[10px]">{p.replace(/_/g, ' ')}</Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* --- MODALS --- */}

      {/* Add/Edit Staff Dialog */}
      <AnimatePresence>
        {(showAddStaff || editingStaffId !== null) && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-50" onClick={() => { setShowAddStaff(false); setEditingStaffId(null); }} />

            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 pointer-events-none">

              <div className="bg-background rounded-2xl border border-border p-5 sm:p-6 cafe-shadow-lg w-full max-w-lg max-h-full overflow-y-auto pointer-events-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-heading font-bold text-lg">{editingStaffId ? 'Edit Staff Member' : 'Add New Staff'}</h3>
                  <button onClick={() => { setShowAddStaff(false); setEditingStaffId(null); }} className="h-8 w-8 rounded-xl bg-muted flex items-center justify-center"><X className="h-4 w-4" /></button>
                </div>

                <form onSubmit={handleSubmit(onStaffSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label>Full Name</Label>
                      <Input {...register('full_name')} className="mt-1 rounded-xl" />
                      {errors.full_name && <p className="text-[10px] text-destructive mt-1">{errors.full_name.message}</p>}
                    </div>

                    <div>
                      <Label>Email</Label>
                      <Input type="email" {...register('email')} className="mt-1 rounded-xl" />
                      {errors.email && <p className="text-[10px] text-destructive mt-1">{errors.email.message}</p>}
                    </div>

                    {!editingStaffId && (
                      <div>
                        <Label>Password</Label>
                        <Input type="password" {...register('password')} className="mt-1 rounded-xl" />
                        {errors.password && <p className="text-[10px] text-destructive mt-1">{errors.password.message}</p>}
                      </div>
                    )}

                    <div>
                      <Label>Phone Number</Label>
                      <Input {...register('phone_number')} className="mt-1 rounded-xl" />
                      {errors.phone_number && <p className="text-[10px] text-destructive mt-1">{errors.phone_number.message}</p>}
                    </div>

                    <div>
                      <Label>Role</Label>
                      <Select value={formRole} onValueChange={v => setValue('role', v, { shouldValidate: true })}>
                        <SelectTrigger className="mt-1 rounded-xl"><SelectValue placeholder="Select Role" /></SelectTrigger>
                        <SelectContent>
                          {rolesList.map((r: any) => <SelectItem key={r.role_name} value={r.role_name}>{r.role_name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      {errors.role && <p className="text-[10px] text-destructive mt-1">{errors.role.message}</p>}
                    </div>

                    <div>
                      <Label>Shift</Label>
                      <Select value={formShift} onValueChange={v => setValue('shift', v, { shouldValidate: true })}>
                        <SelectTrigger className="mt-1 rounded-xl"><SelectValue placeholder="Select Shift" /></SelectTrigger>
                        <SelectContent>
                          {['morning', 'afternoon', 'night', 'full day'].map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      {errors.shift && <p className="text-[10px] text-destructive mt-1">{errors.shift.message}</p>}
                    </div>

                    <div className="flex items-center gap-2 pt-6 sm:col-span-2">
                      <Switch checked={formActive} onCheckedChange={v => setValue('active_status', v)} />
                      <Label>Active Staff Member</Label>
                    </div>
                  </div>

                  <Button type="submit" disabled={addStaffMut.isPending || updateStaffMut.isPending} className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground mt-4 w-full rounded-xl">
                    {addStaffMut.isPending || updateStaffMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : editingStaffId ? <><Save className="h-4 w-4 mr-1" /> Save</> : <><Plus className="h-4 w-4 mr-1" /> Add Staff</>}
                  </Button>
                </form>

              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Delete Staff Dialog */}
      <AnimatePresence>
        {showDeleteStaff && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-50" onClick={() => setShowDeleteStaff(null)} />

            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 pointer-events-none">

              <div className="bg-background rounded-2xl border border-border p-6 cafe-shadow-lg text-center w-full max-w-xs max-h-full overflow-y-auto pointer-events-auto">
                <div className="h-14 w-14 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-3"><Trash2 className="h-6 w-6 text-destructive" /></div>
                <h3 className="font-heading font-bold text-lg mb-1">Remove Staff?</h3>
                <p className="text-sm text-muted-foreground mb-4">This will remove them from the system.</p>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setShowDeleteStaff(null)}>Cancel</Button>
                  <Button variant="destructive" disabled={deleteStaffMut.isPending} className="flex-1 rounded-xl" onClick={confirmDeleteStaff}>
                    {deleteStaffMut.isPending ? 'Removing...' : 'Remove'}
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Add Role Dialog */}
      <AnimatePresence>
        {showAddRole && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-50" onClick={() => setShowAddRole(false)} />

            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 pointer-events-none">

              <div className="bg-background rounded-2xl border border-border p-6 cafe-shadow-lg w-full max-w-md max-h-full overflow-y-auto pointer-events-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-heading font-bold text-lg">Add New Role</h3>
                  <button onClick={() => setShowAddRole(false)} className="h-8 w-8 rounded-xl bg-muted flex items-center justify-center"><X className="h-4 w-4" /></button>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label>Role Name</Label>
                    <Input value={newRoleName} onChange={e => setNewRoleName(e.target.value)} placeholder="e.g. Supervisor" className="mt-1 rounded-xl" />
                  </div>
                  <div>
                    <Label className="text-sm">Permissions</Label>
                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {allPermissions.map(p => (
                        <label key={p} className="flex items-center gap-2 text-xs cursor-pointer p-2 rounded-lg hover:bg-muted/50">
                          <input type="checkbox" checked={newRolePermissions.includes(p)} onChange={e => {
                            setNewRolePermissions(e.target.checked ? [...newRolePermissions, p] : newRolePermissions.filter(x => x !== p));
                          }} className="rounded" />
                          {p.replace(/_/g, ' ')}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
                <Button onClick={handleAddRole} disabled={addRoleMut.isPending} className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground mt-4 w-full rounded-xl">
                  {addRoleMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="h-4 w-4 mr-1" /> Add Role</>}
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
