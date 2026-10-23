import { useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { Check, AlertCircle } from 'lucide-react';

type T = { id: number; msg: string; type: 'success' | 'error' };

let toasts: T[] = [];
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());

/** Global toast: works from anywhere and survives component remounts. */
export const notify = (msg: string, type: 'success' | 'error' = 'success') => {
  const id = Date.now() + Math.random();
  toasts = [...toasts, { id, msg, type }];
  emit();
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    emit();
  }, 3000);
};

/** Mount ONCE in App.tsx: <ToastHost /> */
export function ToastHost() {
  const list = useSyncExternalStore(
    (cb) => { subs.add(cb); return () => { subs.delete(cb); }; },
    () => toasts,
  );
  return createPortal(
    <div className="pointer-events-none fixed left-1/2 top-4 z-[100] flex -translate-x-1/2 flex-col gap-2">
      {list.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm shadow-lg"
        >
          {t.type === 'success'
            ? <Check className="h-4 w-4 text-success" />
            : <AlertCircle className="h-4 w-4 text-destructive" />}
          <span>{t.msg}</span>
        </div>
      ))}
    </div>,
    document.body,
  );
}