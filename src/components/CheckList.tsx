import { CheckItem } from "@/lib/store";

interface Props {
  items: CheckItem[];
  onChange: (items: CheckItem[]) => void;
  showProgress?: boolean;
}

export function CheckList({ items, onChange, showProgress = true }: Props) {
  const done = items.filter((i) => i.checked).length;
  const pct = items.length ? Math.round((done / items.length) * 100) : 0;

  const toggle = (id: string) => {
    onChange(items.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i)));
  };

  return (
    <div className="space-y-2">
      {showProgress && items.length > 0 && (
        <div className="flex items-center gap-3 mb-3">
          <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-xs font-heading text-muted-foreground">
            {done}/{items.length}
          </span>
        </div>
      )}
      {items.map((item) => (
        <label
          key={item.id}
          className="flex items-start gap-3 cursor-pointer group py-1"
        >
          <input
            type="checkbox"
            checked={item.checked}
            onChange={() => toggle(item.id)}
            className="mt-0.5 h-4 w-4 rounded border-border bg-muted accent-primary cursor-pointer"
          />
          <span
            className={`text-sm leading-relaxed transition-all ${
              item.checked
                ? "line-through text-muted-foreground/50"
                : "text-foreground"
            }`}
          >
            {item.text}
          </span>
        </label>
      ))}
    </div>
  );
}
