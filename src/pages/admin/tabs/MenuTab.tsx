import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, FolderPlus, Plus, Ban, Edit2, Trash2, X, Save, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

import {
  useMenuDashboard,
  useAddCategory,
  useAddMenuItem,
  useUpdateMenuItem,
  useDeleteMenuItem,
  useCategoryItems,
} from '@/tanstack/alltanstack';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';


const getImageSrc = (imageUrl: string | null | undefined) => {
  if (!imageUrl) return '';
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) return imageUrl;
  return `${API_URL}${imageUrl}`;
};

export default function MenuTab() {
  const [menuSearch, setMenuSearch] = useState('');
  const [menuCategory, setMenuCategory] = useState('all');

  // Fetch data
  const { data: dashboardData, isLoading: isDashboardLoading } = useMenuDashboard();
  const { data: categoryData, isFetching: isCategoryFetching } = useCategoryItems(menuCategory);

  // Mutations
  const addCatMutation = useAddCategory();
  const addItemMutation = useAddMenuItem();
  const updateItemMutation = useUpdateMenuItem();
  const deleteItemMutation = useDeleteMenuItem();

  const allCats = dashboardData?.categories || ['all'];

  // ✅ FIX: backend's get_category_items route returns { category, menu_details },
  // NOT { category, items } — reading `.items` silently returned [] before,
  // so switching the category dropdown away from "all" always showed nothing.
  const rawMenuItems = menuCategory === 'all'
    ? (dashboardData?.menu_details || [])
    : (categoryData?.menu_details || []);

  const isLoading = isDashboardLoading || isCategoryFetching;

  // Modals state
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [showAddItem, setShowAddItem] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);

  // Forms
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newItem, setNewItem] = useState<{ name: string; description: string; price: number; category: string; image: File | null; is_vegitarian: boolean; type: string }>({
    name: '', description: '', price: 0, category: '', image: null, is_vegitarian: false, type: 'food',
  });
  const [editForm, setEditForm] = useState<{ name: string; description: string; price: number; category: string; image: File | null; is_vegitarian: boolean; type: string }>({
    name: '', description: '', price: 0, category: '', image: null, is_vegitarian: false, type: 'food',
  });

  // Filter items
  const filteredMenu = useMemo(() => {
    let result = rawMenuItems;
    if (menuSearch) {
      result = result.filter((i: any) =>
        (i.item_name || '').toLowerCase().includes(menuSearch.toLowerCase())
      );
    }
    return result;
  }, [rawMenuItems, menuCategory, menuSearch]);

  const handleAddItem = () => {
    if (!newItem.name || !newItem.price || !newItem.category || !newItem.image) {
      toast.error('Name, price, category, and image are required');
      return;
    }
    addItemMutation.mutate(newItem, {
      onSuccess: () => {
        setShowAddItem(false);
        setNewItem({ name: '', description: '', price: 0, category: '', image: null, is_vegitarian: false, type: 'food' });
      },
    });
  };

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) { toast.error('Category name required'); return; }
    addCatMutation.mutate({ category_name: newCategoryName.trim(), description: 'New Category' }, {
      onSuccess: () => {
        setShowAddCategory(false);
        setNewCategoryName('');
      },
    });
  };

 const startEditing = (item: any) => {
  setEditingItem(item.id);

  setEditForm({
    name: item.item_name || "",
    description: item.description || "",
    price: Number(item.price) || 0,
    category: item.category_name || "",
    image: null,
    is_vegitarian: item.item_category === "veg",
    type: item.item_type || "food",
  });
};
  const saveEdit = () => {
    if (!editingItem) return;
    if (!editForm.category) {
      toast.error('Please (re)select a category before saving');
      return;
    }
    updateItemMutation.mutate({ item_id: editingItem, ...editForm }, {
      onSuccess: () => setEditingItem(null),
    });
  };

  const handleDeleteItem = (id: number) => {
    deleteItemMutation.mutate(id, {
      onSuccess: () => setShowDeleteConfirm(null),
    });
  };

  return (
    <div className="space-y-4">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none sm:w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search menu..." value={menuSearch} onChange={e => setMenuSearch(e.target.value)} className="pl-9 h-10 rounded-xl" />
          </div>
          <Select value={menuCategory} onValueChange={setMenuCategory}>
            <SelectTrigger className="w-36 h-10 rounded-xl"><SelectValue placeholder="All Categories" /></SelectTrigger>
            <SelectContent>
              {allCats.map((c: string) => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" className="rounded-xl" onClick={() => setShowAddCategory(true)}>
            <FolderPlus className="h-4 w-4 mr-1" /> Add Category
          </Button>
          <Button className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-xl" onClick={() => setShowAddItem(true)}>
            <Plus className="h-4 w-4 mr-1" /> Add Item
          </Button>
        </div>
      </div>

      {/* Menu Grid */}
      {isLoading ? (
        <div className="py-20 flex justify-center text-muted-foreground"><Loader2 className="h-8 w-8 animate-spin" /></div>
      ) : filteredMenu.length === 0 ? (
        <div className="py-20 text-center text-muted-foreground">No menu items found.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredMenu.map((item: any) => (
            <motion.div key={item.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card-3d group">
              <div className="card-3d-inner rounded-2xl bg-card border border-border cafe-shadow overflow-hidden hover:cafe-shadow-lg transition-all">
                <div className="relative">
                  <img src={getImageSrc(item.image_url)} alt={item.item_name} className="w-full h-36 object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/30 to-transparent" />
                  <Badge className={`absolute top-3 right-3 text-[10px] ${item.is_available ? 'bg-success/90 text-success-foreground' : 'bg-destructive/90 text-destructive-foreground'}`}>
                    {item.is_available ? '✓ Available' : <span className="flex items-center gap-1"><Ban className="h-3 w-3" /> Unavailable</span>}
                  </Badge>
                  <div className={`absolute top-3 left-3 h-5 w-5 rounded border-2 flex items-center justify-center ${item.item_category === 'veg' ? 'border-success' : 'border-destructive'}`}>
                    <span className={`h-2.5 w-2.5 rounded-full ${item.item_category === 'veg' ? 'bg-success' : 'bg-destructive'}`} />
                  </div>
                  <span className="absolute bottom-3 left-3 text-xl font-bold text-primary-foreground drop-shadow">₹{item.price}</span>
                </div>
                <div className="p-4">
                  <h4 className="font-heading font-semibold text-sm text-foreground leading-tight truncate">{item.item_name}</h4>
                  <p className="text-xs text-muted-foreground mt-1 truncate">{item.description || 'No description'}</p>
                  <div className="flex gap-2 mt-3 flex-wrap">
                    <Button variant="outline" size="sm" className="flex-1 h-8 text-xs rounded-lg" onClick={() => startEditing(item)}><Edit2 className="h-3 w-3 mr-1" /> Edit</Button>
                    <Button variant="outline" size="sm" className="h-8 w-8 text-destructive rounded-lg" onClick={() => setShowDeleteConfirm(item.id)}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* --- ADD ITEM MODAL --- */}
      <AnimatePresence>
        {showAddItem && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-50" onClick={() => setShowAddItem(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 pointer-events-none">
              <div className="bg-background rounded-2xl border border-border p-5 sm:p-6 cafe-shadow-lg w-full max-w-lg max-h-full overflow-y-auto pointer-events-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-heading font-bold text-lg">Add New Menu Item</h3>
                  <button onClick={() => setShowAddItem(false)} className="h-8 w-8 rounded-xl bg-muted flex items-center justify-center"><X className="h-4 w-4" /></button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><Label>Name</Label><Input value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })} className="mt-1 rounded-xl" /></div>
                  <div><Label>Price (₹)</Label><Input type="number" value={newItem.price || ''} onChange={e => setNewItem({ ...newItem, price: Number(e.target.value) })} className="mt-1 rounded-xl" /></div>
                  <div className="sm:col-span-2"><Label>Description</Label><Textarea value={newItem.description} onChange={e => setNewItem({ ...newItem, description: e.target.value })} className="mt-1 rounded-xl" /></div>

                  <div>
                    <Label>Category</Label>
                    <Select value={newItem.category} onValueChange={v => setNewItem({ ...newItem, category: v })}>
                      <SelectTrigger className="mt-1 rounded-xl"><SelectValue placeholder="Select Category" /></SelectTrigger>
                      <SelectContent>
                        {allCats.filter((c: string) => c !== 'all').map((c: string) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Image Upload</Label>
                    <Input type="file" accept="image/*" className="mt-1 rounded-xl cursor-pointer" onChange={e => setNewItem({ ...newItem, image: e.target.files?.[0] || null })} />
                  </div>

                  <div className="sm:col-span-2">
                    <Label className="mb-2 block">Type</Label>
                    <div className="flex gap-3">
                      {(['food', 'drink'] as const).map(t => (
                        <button key={t} onClick={() => setNewItem({ ...newItem, type: t })}
                          className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 text-sm font-medium transition-all ${newItem.type === t ? 'border-primary bg-primary/5 text-foreground' : 'border-border text-muted-foreground hover:border-primary/30'}`}>
                          {t === 'food' ? '🍽️ Food' : '🥤 Drinks'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 sm:col-span-2 mt-2">
                    <div className="flex items-center gap-2"><Switch checked={newItem.is_vegitarian} onCheckedChange={v => setNewItem({ ...newItem, is_vegitarian: v })} /><Label>Vegetarian</Label></div>
                    <div className="flex items-center gap-2"><Switch checked={!newItem.is_vegitarian} onCheckedChange={v => setNewItem({ ...newItem, is_vegitarian: !v })} /><Label>Non-Veg</Label></div>
                  </div>
                </div>
                <Button onClick={handleAddItem} disabled={addItemMutation.isPending} className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground mt-6 w-full rounded-xl">
                  {addItemMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="h-4 w-4 mr-1" /> Add Item</>}
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* --- EDIT ITEM MODAL --- */}
      <AnimatePresence>
        {editingItem && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-50" onClick={() => setEditingItem(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 pointer-events-none">
              <div className="bg-background rounded-2xl border border-border p-5 sm:p-6 cafe-shadow-lg w-full max-w-lg max-h-full overflow-y-auto pointer-events-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-heading font-bold text-lg">Edit Menu Item</h3>
                  <button onClick={() => setEditingItem(null)} className="h-8 w-8 rounded-xl bg-muted flex items-center justify-center"><X className="h-4 w-4" /></button>
                </div>
                {!editForm.category && (
                  <p className="text-xs text-accent mb-3">⚠️ Category couldn't be auto-detected for this item — please select it again below before saving.</p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><Label>Name</Label><Input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className="mt-1 rounded-xl" /></div>
                  <div><Label>Price (₹)</Label><Input type="number" value={editForm.price} onChange={e => setEditForm({ ...editForm, price: Number(e.target.value) })} className="mt-1 rounded-xl" /></div>
                  <div className="sm:col-span-2"><Label>Description</Label><Textarea value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} className="mt-1 rounded-xl" /></div>
                  <div>
                    <Label>Category</Label>
                    <Select value={editForm.category} onValueChange={v => setEditForm({ ...editForm, category: v })}>
                      <SelectTrigger className="mt-1 rounded-xl"><SelectValue placeholder="Select Category" /></SelectTrigger>
                      <SelectContent>
                        {allCats.filter((c: string) => c !== 'all').map((c: string) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Replace Image</Label>
                    <Input type="file" accept="image/*" className="mt-1 rounded-xl cursor-pointer" onChange={e => setEditForm({ ...editForm, image: e.target.files?.[0] || null })} />
                  </div>
                  <div className="flex items-center gap-4 sm:col-span-2 mt-2">
                    <div className="flex items-center gap-2"><Switch checked={editForm.is_vegitarian} onCheckedChange={v => setEditForm({ ...editForm, is_vegitarian: v })} /><Label>Vegetarian</Label></div>
                    <div className="flex items-center gap-2"><Switch checked={!editForm.is_vegitarian} onCheckedChange={v => setEditForm({ ...editForm, is_vegitarian: !v })} /><Label>Non-Veg</Label></div>
                  </div>
                </div>
                <Button onClick={saveEdit} disabled={updateItemMutation.isPending} className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground mt-6 w-full rounded-xl">
                  {updateItemMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4 mr-1" /> Save Changes</>}
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* --- ADD CATEGORY MODAL --- */}
      <AnimatePresence>
        {showAddCategory && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-50" onClick={() => setShowAddCategory(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 pointer-events-none">
              <div className="bg-background rounded-2xl border border-border p-6 cafe-shadow-lg w-full max-w-sm max-h-full overflow-y-auto pointer-events-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-heading font-bold text-lg">Add Category</h3>
                  <button onClick={() => setShowAddCategory(false)} className="h-8 w-8 rounded-xl bg-muted flex items-center justify-center"><X className="h-4 w-4" /></button>
                </div>
                <div>
                  <Label>Category Name</Label>
                  <Input value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} placeholder="e.g. Smoothies" className="mt-1 rounded-xl" />
                </div>
                <Button onClick={handleAddCategory} disabled={addCatMutation.isPending} className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground mt-4 w-full rounded-xl">
                  {addCatMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="h-4 w-4 mr-1" /> Add Category</>}
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* --- DELETE CONFIRMATION MODAL --- */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-50" onClick={() => setShowDeleteConfirm(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 pointer-events-none">
              <div className="bg-background rounded-2xl border border-border p-6 cafe-shadow-lg text-center w-full max-w-xs max-h-full overflow-y-auto pointer-events-auto">
                <div className="h-14 w-14 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-3"><Trash2 className="h-6 w-6 text-destructive" /></div>
                <h3 className="font-heading font-bold text-lg mb-1">Delete Item?</h3>
                <p className="text-sm text-muted-foreground mb-4">This action cannot be undone.</p>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setShowDeleteConfirm(null)}>Cancel</Button>
                  <Button variant="destructive" disabled={deleteItemMutation.isPending} className="flex-1 rounded-xl" onClick={() => handleDeleteItem(showDeleteConfirm)}>
                    {deleteItemMutation.isPending ? 'Deleting...' : 'Delete'}
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
