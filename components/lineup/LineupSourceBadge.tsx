import {
  lineupSourceBadgeClass,
  lineupSourceDetail,
  lineupSourceHeadline,
} from "@/lib/lineup/source-labels";
import type { LineupSourceKind } from "@/lib/lineup/types";
import { cn } from "@/lib/utils";

type LineupSourceBadgeProps = {
  sourceKind: LineupSourceKind;
  formationLabel: string;
  fetchedAt?: string | null;
  className?: string;
  compact?: boolean;
};

function formatFetchedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("es-ES", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function LineupSourceBadge({
  sourceKind,
  formationLabel,
  fetchedAt,
  className,
  compact = false,
}: LineupSourceBadgeProps) {
  const updatedLabel = fetchedAt ? formatFetchedAt(fetchedAt) : null;

  if (compact) {
    return (
      <div
        className={cn(
          "shrink-0 rounded-lg border px-2 py-1 text-center",
          lineupSourceBadgeClass(sourceKind),
          className
        )}
      >
        <p className="text-[9px] font-semibold uppercase tracking-wider opacity-80">
          {lineupSourceHeadline(sourceKind)}
        </p>
        <p className="font-display text-sm font-bold">{formationLabel}</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-1", className)}>
      <div
        className={cn(
          "inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide",
          lineupSourceBadgeClass(sourceKind)
        )}
      >
        <span>{lineupSourceHeadline(sourceKind)}</span>
        <span className="opacity-70">·</span>
        <span>{formationLabel}</span>
      </div>
      <p className="text-[10px] text-[var(--tm-muted)]">
        {lineupSourceDetail(sourceKind)}
        {updatedLabel ? ` Actualizado ${updatedLabel}.` : ""}
      </p>
    </div>
  );
}
