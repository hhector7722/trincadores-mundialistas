import { Triangle } from "lucide-react";
import type { PositionTrend } from "@/lib/ranking/queries";
import { cn } from "@/lib/utils";

export function PositionTrendIndicator({ trend }: { trend: PositionTrend }) {
  if (!trend) {
    return <span className="w-3 shrink-0" aria-hidden="true" />;
  }

  return (
    <span
      className="flex w-3 shrink-0 items-center justify-center"
      aria-label={trend === "up" ? "Ha subido de posicion" : "Ha bajado de posicion"}
    >
      <Triangle
        className={cn(
          "h-2 w-2 fill-current",
          trend === "up" ? "text-[var(--tm-positive)]" : "rotate-180 text-[var(--tm-danger)]"
        )}
        strokeWidth={0}
      />
    </span>
  );
}
