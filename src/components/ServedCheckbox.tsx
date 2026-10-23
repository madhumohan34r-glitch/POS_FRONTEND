import { useRef, useState } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Props {
  served: boolean;
  onToggle: () => void;
  label?: string;
  /** Long press in ms required to UN-mark a served item (default 700) */
  undoHoldMs?: number;
}

/**
 * Distinct served checkbox.
 * - Tap when not served -> immediately marks served.
 * - When served, plain tap is ignored; user must long-press (hold ~700ms) to undo,
 *   preventing accidental un-marking.
 */
export const ServedCheckbox = ({ served, onToggle, label = 'Mark served', undoHoldMs = 700 }: Props) => {
  const timer = useRef<number | null>(null);
  const triggered = useRef(false);
  const [holding, setHolding] = useState(false);

  const start = () => {
    if (!served) return;
    triggered.current = false;
    setHolding(true);
    timer.current = window.setTimeout(() => {
      triggered.current = true;
      setHolding(false);
      onToggle();
      toast.message('Item marked as not served');
    }, undoHoldMs);
  };
  const cancel = () => {
    if (timer.current) { window.clearTimeout(timer.current); timer.current = null; }
    setHolding(false);
  };
  const handleClick = () => {
    if (triggered.current) { triggered.current = false; return; }
    if (!served) onToggle();
    else toast.message('Hold to undo (long-press)', { duration: 1500 });
  };

  return (
    <button
      type="button"
      aria-pressed={served}
      aria-label={served ? 'Served — long press to undo' : label}
      onClick={handleClick}
      onMouseDown={start}
      onMouseUp={cancel}
      onMouseLeave={cancel}
      onTouchStart={start}
      onTouchEnd={cancel}
      className={cn(
        'inline-flex items-center gap-2 rounded-lg border-2 px-3 py-2 text-sm font-medium transition-all select-none',
        served
          ? 'border-emerald-500/70 bg-emerald-500/15 text-emerald-400 shadow-[0_0_0_3px_hsl(var(--background))_inset]'
          : 'border-border/70 bg-card hover:border-primary/60 hover:bg-primary/5',
        holding && 'scale-95 opacity-75',
      )}
    >
      <span className={cn(
        'inline-flex h-5 w-5 items-center justify-center rounded-md border-2 transition-colors',
        served ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-border bg-background',
      )}>
        {served && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
      </span>
      <span>{served ? 'Served' : label}</span>
      {served && <span className="text-[10px] uppercase tracking-wide text-emerald-300/70">hold to undo</span>}
    </button>
  );
};

export default ServedCheckbox;
