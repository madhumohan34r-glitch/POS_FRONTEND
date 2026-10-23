import { Clock, Hash } from 'lucide-react';
import { useRelativeTime } from '@/hooks/use-relative-time';
import { cn } from '@/lib/utils';

interface OrderMetaLineProps {
  orderId: string;
  createdAt: Date | string | number;
  className?: string;
}

/**
 * Small consistent meta strip for order cards: "#ORD-001 · 5 min ago · 14:32".
 */
export function OrderMetaLine({ orderId, createdAt, className }: OrderMetaLineProps) {
  const relative = useRelativeTime(createdAt);
  const d = createdAt instanceof Date ? createdAt : new Date(createdAt);
  const time = isNaN(d.getTime())
    ? ''
    : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className={cn('flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground', className)}>
      <span className="inline-flex items-center gap-1 font-mono font-medium text-foreground/80">
        <Hash className="h-3 w-3" />
        {orderId.replace(/^ORD-?/, '')}
      </span>
      <span className="opacity-50">·</span>
      <span className="inline-flex items-center gap-1">
        <Clock className="h-3 w-3" />
        {relative}
      </span>
      {time && (
        <>
          <span className="opacity-50">·</span>
          <span>{time}</span>
        </>
      )}
    </div>
  );
}
