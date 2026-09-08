import { Drawer as Vaul } from "vaul";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Drawer({
  open,
  onOpenChange,
  title,
  children,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  children: ReactNode;
}) {
  return (
    <Vaul.Root open={open} onOpenChange={onOpenChange}>
      <Vaul.Portal>
        <Vaul.Overlay className="fixed inset-0 z-50 bg-overlay" />
        <Vaul.Content
          className={cn(
            "fixed inset-x-0 bottom-0 z-50 mx-auto max-h-[92dvh] w-full max-w-lg",
            "rounded-t-2xl border border-border bg-surface outline-none",
          )}
        >
          <div className="mx-auto mt-3 h-1 w-12 rounded-full bg-border" />
          <Vaul.Title className="px-5 pt-4 font-display text-xl font-medium tracking-tight text-fg">
            {title}
          </Vaul.Title>
          <div className="max-h-[80dvh] overflow-y-auto px-5 pb-8 pt-4">{children}</div>
        </Vaul.Content>
      </Vaul.Portal>
    </Vaul.Root>
  );
}
