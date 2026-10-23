
export interface FilterOption {
  id: string;
  label: string;
}

interface ChartFilterPillsProps {
  value: string;
  onChange: (v: string) => void;
  options: FilterOption[];
}

export const timeFilterOptions: FilterOption[] = [
  { id: 'today', label: 'Today' },
  { id: '7days', label: '7 Days' },
  { id: 'month', label: 'Month' },
  { id: 'year', label: 'Year' },
];

export const ChartFilterPills = ({ value, onChange, options }: ChartFilterPillsProps) => (
  <div className="flex gap-1 flex-wrap">
    {options.map(o => (
      <button
        key={o.id}
        onClick={() => onChange(o.id)}
        className={`px-2 py-1 rounded-lg text-[10px] font-medium transition-all ${
          value === o.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
        }`}
      >
        {o.label}
      </button>
    ))}
  </div>
);

export default ChartFilterPills ;
