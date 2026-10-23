import { Badge } from '@/components/ui/badge';
import { ArrowRight } from 'lucide-react';

interface Props {
  history?: number[];
  current: number;
}

/** Renders e.g. "1 → 7" if the order originally belonged to a different table. */
export const TableTransferBadge = ({ history, current }: Props) => {
  if (!history || history.length < 2) return null;
  const origin = history[0];
  if (origin === current) return null;
  return (
    <Badge variant="outline" className="gap-1 border-amber-500/40 text-amber-300 bg-amber-500/10">
      <span className="font-bold">{origin}</span>
      <ArrowRight className="h-3 w-3" />
      <span className="font-bold">{current}</span>
    </Badge>
  );
};

export default TableTransferBadge;
