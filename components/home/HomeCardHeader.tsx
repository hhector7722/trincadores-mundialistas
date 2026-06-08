import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type HomeCardHeaderProps = {
  title: string;
  action?: ReactNode;
  className?: string;
};

export function HomeCardHeader({ title, action, className }: HomeCardHeaderProps) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-between gap-2 bg-[var(--tm-accent)] px-[clamp(0.5rem,3cqw,0.75rem)] py-1",
        className
      )}
    >
      <p className="truncate text-[9px] font-semibold uppercase tracking-wide text-[var(--tm-primary-fg)]">
        {title}
      </p>
      {action}
    </div>
  );
}
