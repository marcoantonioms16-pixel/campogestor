import { cn } from "@/lib/cn";

export function TabsBar<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { id: T; label: string }[];
}) {
  return (
    <div className="flex gap-2 overflow-x-auto px-4 pb-4 md:px-8">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          className={cn(
            "h-9 shrink-0 rounded-full px-3 text-xs font-medium",
            value === o.id ? "bg-primary text-primary-fg" : "bg-elevated text-muted",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
