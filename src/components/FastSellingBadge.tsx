import { Badge } from '@/components/ui/badge';
import { Flame } from 'lucide-react';
import { useStockStore } from '@/lib/stock-store';

interface Props {
  itemId: string;
  /** Threshold below which the item is considered fast-selling (default 5) */
  threshold?: number;
}

/** Shows "Fast Selling — N left" when limited stock remains. Hidden if unlimited or out-of-stock. */
export const FastSellingBadge = ({ itemId, threshold = 5 }: Props) => {
  const { getStock } = useStockStore();
  const qty = getStock(itemId);
  if (qty === -1) return null; // unlimited
  if (qty <= 0) return null;   // out-of-stock handled elsewhere
  if (qty > threshold) return null;
  return (
    <Badge className="gap-1 bg-orange-500/90 text-white border-transparent">
      <Flame className="h-3 w-3" />
      Fast Selling — {qty} left
    </Badge>
  );
};

export default FastSellingBadge;
