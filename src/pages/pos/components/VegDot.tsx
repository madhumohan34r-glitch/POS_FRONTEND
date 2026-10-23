// Shows nothing when the backend did not send `type`, so it is safe to use everywhere.
export default function VegDot({ type }: { type?: string | null }) {
  if (!type) return null;
  const veg = type === 'veg';
  return (
    <span
      title={veg ? 'Veg' : 'Non-veg'}
      className={`h-4 w-4 rounded-[4px] border-2 flex items-center justify-center flex-shrink-0 ${veg ? 'border-success' : 'border-destructive'}`}
    >
      <span className={`h-2 w-2 rounded-full ${veg ? 'bg-success' : 'bg-destructive'}`} />
    </span>
  );
}