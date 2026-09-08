import { cn } from "@/lib/cn";

export function Progress({
  value,
  className,
  tone = "primary",
}: {
  value: number;
  className?: string;
  tone?: "primary" | "ok" | "warn" | "danger";
}) {
  const pct = Math.max(0, Math.min(100, value));
  const bar = {
    primary: "bg-primary",
    ok: "bg-ok",
    warn: "bg-warn",
    danger: "bg-danger",
  }[tone];
  return (
    <div className={cn("h-1.5 overflow-hidden rounded-full bg-elevated", className)}>
      <div className={cn("h-full rounded-full", bar)} style={{ width: `${pct}%` }} />
    </div>
  );
}
