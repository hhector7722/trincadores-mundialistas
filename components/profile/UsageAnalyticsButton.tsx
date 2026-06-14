import Link from "next/link";
import { BarChart3 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function UsageAnalyticsButton() {
  return (
    <Card className="p-2">
      <Link
        href="/uso"
        aria-label="Ver uso de la app"
        className={cn(
          "flex min-h-12 w-full items-center justify-center gap-2 rounded-xl",
          "border border-[var(--tm-border)] bg-[var(--tm-surface)]",
          "text-sm font-medium text-[var(--tm-fg)]",
          "transition-colors hover:border-[var(--tm-primary)]/50 hover:text-[var(--tm-primary)]"
        )}
      >
        <BarChart3 className="size-5 shrink-0" aria-hidden />
        Uso de la app
      </Link>
    </Card>
  );
}
