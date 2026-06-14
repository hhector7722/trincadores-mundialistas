import Link from "next/link";
import { BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
};

export function UsageAnalyticsButton({ className }: Props) {
  return (
    <Link
      href="/uso"
      aria-label="Ver uso de la app"
      className={cn(
        "flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl",
        "border border-[var(--tm-border)] bg-[var(--tm-surface)]/60",
        "text-sm font-medium text-[var(--tm-fg)]",
        "transition-colors hover:border-[var(--tm-primary)]/50 hover:text-[var(--tm-primary)]",
        className
      )}
    >
      <BarChart3 className="size-4 shrink-0" aria-hidden />
      Uso de la app
    </Link>
  );
}
