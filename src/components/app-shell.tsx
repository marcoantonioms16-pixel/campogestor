import type { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  MoreHorizontal,
  Tractor,
  Users,
  Warehouse,
} from "lucide-react";
import { useEffect } from "react";
import { Toaster } from "sonner";
import { cn } from "@/lib/cn";
import { useFarmStore } from "@/lib/store";

const NAV = [
  { to: "/", label: "Hoje", icon: LayoutDashboard },
  { to: "/frota", label: "Frota", icon: Tractor },
  { to: "/estoque", label: "Estoque", icon: Warehouse },
  { to: "/pessoas", label: "Pessoas", icon: Users },
  { to: "/mais", label: "Mais", icon: MoreHorizontal },
] as const;

const MAIS_PATHS = ["/mais", "/compras", "/campo", "/documentos"];

function isActive(pathname: string, to: string) {
  if (to === "/") return pathname === "/";
  if (to === "/mais") return MAIS_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
  return pathname === to || pathname.startsWith(to + "/");
}

function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true" fill="none">
      <rect x="2" y="2" width="13" height="13" rx="3" className="fill-primary" />
      <rect x="17" y="2" width="13" height="13" rx="3" className="fill-elevated stroke-border" strokeWidth="1" />
      <rect x="2" y="17" width="13" height="13" rx="3" className="fill-elevated stroke-border" strokeWidth="1" />
      <rect x="17" y="17" width="13" height="13" rx="3" className="fill-primary/50" />
    </svg>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const hydrated = useFarmStore((s) => s.hydrated);
  const setHydrated = useFarmStore((s) => s.setHydrated);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      await Promise.resolve(useFarmStore.persist.rehydrate());
      if (!cancelled) setHydrated();
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [setHydrated]);

  if (!hydrated) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-bg text-fg">
        <LogoMark className="size-10" />
        <p className="font-display text-2xl font-medium tracking-tight">CampoGestor</p>
        <p className="text-sm text-muted">Fazenda Santa Rita</p>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-bg text-fg">
      <Toaster
        theme="dark"
        position="top-center"
        toastOptions={{ className: "!bg-elevated !text-fg !border-border" }}
      />
      <div className="mx-auto flex min-h-dvh max-w-6xl">
        <aside className="sticky top-0 hidden h-dvh w-56 shrink-0 flex-col border-r border-border px-3 py-6 md:flex">
          <div className="mb-8 flex items-center gap-2 px-2">
            <LogoMark className="size-7" />
            <span className="font-display text-lg font-medium tracking-tight">CampoGestor</span>
          </div>
          <nav className="flex flex-1 flex-col gap-1">
            {NAV.map((item) => {
              const active = isActive(pathname, item.to);
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex h-11 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors duration-150",
                    active ? "bg-elevated text-fg" : "text-muted hover:bg-elevated hover:text-fg",
                  )}
                >
                  <Icon className="size-4" strokeWidth={1.75} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <main className="app-main flex-1">{children}</main>
        </div>
      </div>

      <nav className="app-nav fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 backdrop-blur-sm md:hidden">
        <ul className="mx-auto grid max-w-lg grid-cols-5">
          {NAV.map((item) => {
            const active = isActive(pathname, item.to);
            const Icon = item.icon;
            return (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className={cn(
                    "flex h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium",
                    active ? "text-primary" : "text-muted",
                  )}
                >
                  <Icon className="size-5" strokeWidth={active ? 2.2 : 1.75} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

export function PageHeader({
  kicker,
  title,
  action,
}: {
  kicker?: string;
  title: string;
  action?: ReactNode;
}) {
  return (
    <header className="flex items-start justify-between gap-3 px-4 pb-4 pt-6 md:px-8">
      <div className="min-w-0">
        {kicker ? (
          <p className="text-xs font-medium uppercase tracking-widest text-muted">{kicker}</p>
        ) : null}
        <h1 className="font-display text-3xl font-medium tracking-tight text-fg">{title}</h1>
      </div>
      {action}
    </header>
  );
}
