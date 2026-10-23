import { useState } from 'react';
import { Warehouse, Loader2, Plus, Minus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

import { useStockManagement, useUpdateItemQuantity } from '@/tanstack/alltanstack';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

interface StockItem {
  id: number;
  item_name: string;
  image_url: string | null;
  item_quantity: string; // backend stores this as a string column
  price: number;
  item_type: string;
  item_category: string;
  is_available: boolean;
  category_id: number;
  category_name: string | null;
}

const getImageSrc = (imageUrl: string | null | undefined) => {
  if (!imageUrl) return '';
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) return imageUrl;
  return `${API_URL}${imageUrl}`;
};

export default function StockTab() {
  const { data, isLoading, isError } = useStockManagement();
  const updateQtyMutation = useUpdateItemQuantity();

  const items: StockItem[] = data?.data || [];

  // Local input state: how much to ADD (or remove) per item.
  // Backend does current_quantity + request.quantity (clamped at 0).
  const [deltaByItem, setDeltaByItem] = useState<Record<number, string>>({});

  const applyDelta = (itemId: number, delta: number) => {
    if (delta === 0) {
      toast.error('Enter a non-zero quantity first');
      return;
    }
    updateQtyMutation.mutate(
      { item_id: itemId, quantity: delta },
      { onSuccess: () => setDeltaByItem(prev => ({ ...prev, [itemId]: '' })) }
    );
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-heading font-bold flex items-center gap-2">
        <Warehouse className="h-5 w-5 text-primary" /> Stock Management
      </h2>
      <p className="text-xs text-muted-foreground">
        Type a quantity, then use + / − to add or remove stock. Items at 0 are marked out of stock.
      </p>

      {isLoading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : isError ? (
        <p className="text-center text-destructive py-10">Failed to load stock data. Check console / network tab.</p>
      ) : items.length === 0 ? (
        <p className="text-center text-muted-foreground py-10">No menu items found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(item => {
            const qty = Number(item.item_quantity ?? 0);
            const isOut = qty === 0;
            const delta = deltaByItem[item.id] ?? '';

            return (
              <div key={item.id} className={`p-4 rounded-2xl bg-card border-2 cafe-shadow ${isOut ? 'border-destructive/30' : 'border-border'}`}>
                <div className="flex items-center gap-3 mb-3">
                  {item.image_url && (
                    <img src={getImageSrc(item.image_url)} alt={item.item_name} className="h-12 w-12 rounded-xl object-cover" />
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold truncate">{item.item_name}</h4>
                    <p className="text-[10px] text-muted-foreground">{item.category_name ?? '—'}</p>
                  </div>
                  {isOut && <Badge className="bg-destructive/10 text-destructive text-[10px]">Out of Stock</Badge>}
                </div>

                <p className="text-xs text-muted-foreground mb-2">Current quantity: <strong className="text-foreground">{qty}</strong></p>

                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={delta}
                    onChange={e => setDeltaByItem(prev => ({ ...prev, [item.id]: e.target.value }))}
                    placeholder="Quantity"
                    className="h-8 rounded-xl text-sm flex-1"
                  />
                  <Button
                    size="sm" variant="outline" className="h-8 rounded-lg"
                    disabled={updateQtyMutation.isPending}
                    onClick={() => applyDelta(item.id, Math.abs(Number(delta) || 0))}
                    title="Add to stock"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm" variant="outline" className="h-8 rounded-lg"
                    disabled={updateQtyMutation.isPending}
                    onClick={() => applyDelta(item.id, -Math.abs(Number(delta) || 0))}
                    title="Remove from stock"
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}