
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, QrCode, Edit2, Users2, X, Save, Loader2, Printer } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

// Zod & React Hook Form
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { useTables, useAddTable, useUpdateTable } from '@/tanstack/alltanstack';

// --- Zod Schema ---
const tableSchema = z.object({
  name: z.string().min(1, "Table name is required").max(30, "Name is too long"),
  capacity: z.number({ invalid_type_error: "Must be a number" }).min(1, "Capacity must be at least 1").max(50, "Capacity limit exceeded"),
});

type TableFormValues = z.infer<typeof tableSchema>;

export default function TablesTab() {
  const { data, isLoading } = useTables();
  const addTableMut = useAddTable();
  const updateTableMut = useUpdateTable();
  
  const baseUrl = window.location.origin;

  // Modals state
  const [showAddTable, setShowAddTable] = useState(false);
  const [editingTable, setEditingTable] = useState<number | null>(null);
  const [viewingQR, setViewingQR] = useState<number | null>(null);

  const tables = data?.data || [];

  // React Hook Form
  const { register, handleSubmit, reset, setError, formState: { errors } } = useForm<TableFormValues>({
    resolver: zodResolver(tableSchema),
    defaultValues: { name: '', capacity: 4 }
  });

  // --- Handlers ---
  const openAddModal = () => {
    reset({ name: '', capacity: 4 });
    setEditingTable(null);
    setShowAddTable(true);
  };

  const openEditModal = (table: any) => {
    reset({ name: table.table_name, capacity: table.capacity });
    setEditingTable(table.table_id);
  };

  const onSubmit = (formData: TableFormValues) => {
    // 1. Uniqueness Validation (Frontend check)
    // Check if the name already exists. If editing, ignore the currently edited table's own name.
    const isDuplicate = tables.some((t: any) => 
      t.table_name.toLowerCase().trim() === formData.name.toLowerCase().trim() && 
      t.table_id !== editingTable
    );

    if (isDuplicate) {
      setError('name', { type: 'manual', message: 'A table with this name already exists' });
      return;
    }

    // 2. Submit Data
    if (editingTable !== null) {
      updateTableMut.mutate({ 
        id: editingTable, 
        data: { table_name: formData.name.trim(), capacity: formData.capacity } 
      }, { 
        onSuccess: () => {
          setEditingTable(null);
          reset();
        }
      });
    } else {
      addTableMut.mutate({ 
        table_name: formData.name.trim(), 
        capacity: formData.capacity 
      }, { 
        onSuccess: () => {
          setShowAddTable(false);
          reset();
        }
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <Badge className="bg-success/10 text-success">Available</Badge>
          <Badge className="bg-destructive/10 text-destructive">Occupied</Badge>
        </div>
        <Button onClick={openAddModal} className="rounded-xl">
          <Plus className="h-4 w-4 mr-1" /> Add Table
        </Button>
      </div>

      {/* Tables Grid */}
      {isLoading ? (
        <div className="flex justify-center p-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {tables.map((table: any) => (
            <div key={table.table_id} className={`p-5 rounded-2xl border-2 bg-card cafe-shadow ${table.status?.toLowerCase() === 'occupied' ? 'border-destructive/30' : 'border-success/30'}`}>
              <div className="flex justify-between items-start mb-4">
                <h4 className="font-bold text-xl">{table.table_name}</h4>
                <Badge variant="outline">{table.status}</Badge>
              </div>
              
              <div className="space-y-1 mb-4">
                <p className="text-xs text-muted-foreground flex items-center gap-2"><Users2 className="h-3 w-3"/> Capacity: <strong>{table.capacity}</strong></p>
                <p className="text-xs text-muted-foreground flex items-center gap-2">🛒 Active Orders: <strong>{table.active_orders}</strong></p>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 rounded-xl" onClick={() => setViewingQR(table.table_id)}>
                  <QrCode className="h-4 w-4 mr-1" /> QR
                </Button>
                <Button variant="outline" size="sm" className="rounded-xl" onClick={() => openEditModal(table)}>
                  <Edit2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          {tables.length === 0 && <div className="col-span-full py-10 text-center text-muted-foreground">No tables found.</div>}
        </div>
      )}

      {/* --- MODALS --- */}

      {/* Add / Edit Table Modal (Combined for cleaner logic) */}
      <AnimatePresence>
        {(showAddTable || editingTable !== null) && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => { setShowAddTable(false); setEditingTable(null); }}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-background p-6 rounded-2xl w-full max-w-sm cafe-shadow-lg" onClick={e => e.stopPropagation()}>
              
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg">{editingTable ? 'Edit Table' : 'Add Table'}</h3>
                <button onClick={() => { setShowAddTable(false); setEditingTable(null); }} className="h-8 w-8 rounded-xl bg-muted flex items-center justify-center"><X className="h-4 w-4" /></button>
              </div>
              
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <Label>Table Name</Label>
                  <Input {...register('name')} placeholder="e.g. Patio 1" className="mt-1" />
                  {errors.name && <p className="text-[10px] text-destructive mt-1">{errors.name.message}</p>}
                </div>
                
                <div>
                  <Label>Capacity (People)</Label>
                  {/* valueAsNumber ensures Zod reads it as an int, not a string */}
                  <Input type="number" {...register('capacity', { valueAsNumber: true })} min={1} className="mt-1" />
                  {errors.capacity && <p className="text-[10px] text-destructive mt-1">{errors.capacity.message}</p>}
                </div>
                
                <Button type="submit" className="w-full mt-2" disabled={addTableMut.isPending || updateTableMut.isPending}>
                  {addTableMut.isPending || updateTableMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : editingTable ? <><Save className="h-4 w-4 mr-1"/> Save Changes</> : 'Add Table'}
                </Button>
              </form>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* View QR Code Modal */}
      <AnimatePresence>
        {viewingQR !== null && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setViewingQR(null)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-background p-6 rounded-2xl w-full max-w-sm cafe-shadow-lg text-center" onClick={e => e.stopPropagation()}>
              <h3 className="font-bold text-lg mb-4">Table {viewingQR} QR Code</h3>
              
              <div className="p-4 bg-white rounded-xl border border-border inline-block mb-4">
                <QRCodeSVG value={`${baseUrl}/orders?table=${viewingQR}`} size={200} level="H" />
              </div>
              
              <p className="text-xs text-muted-foreground break-all mb-6">Table {viewingQR}</p>
              
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 rounded-xl" onClick={() => window.print()}>
                  <Printer className="h-4 w-4 mr-1" /> Print
                </Button>
                <Button className="flex-1 rounded-xl" onClick={() => setViewingQR(null)}>Close</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}