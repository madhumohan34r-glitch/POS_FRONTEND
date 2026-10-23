import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  compact?: boolean;
}

/**
 * Consistent, on-brand empty state used across POS, KDS, Staff, Admin, Customer panels.
 */
export function EmptyState({ icon: Icon, title, description, action, className, compact }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center rounded-xl border border-dashed border-border/60 bg-muted/20 backdrop-blur-sm',
        compact ? 'p-6 gap-2' : 'p-10 gap-3',
        className,
      )}
    >
      {Icon && (
        <div className={cn(
          'rounded-full bg-primary/10 text-primary flex items-center justify-center',
          compact ? 'h-10 w-10' : 'h-14 w-14',
        )}>
          <Icon className={compact ? 'h-5 w-5' : 'h-7 w-7'} />
        </div>
      )}
      <h3 className={cn('font-semibold text-foreground', compact ? 'text-sm' : 'text-base')}>{title}</h3>
      {description && (
        <p className={cn('text-muted-foreground max-w-sm', compact ? 'text-xs' : 'text-sm')}>
          {description}
        </p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
