import { TeamFlagBadge } from "@/components/predictions/TeamFlagBadge";
import { lineupSourceHeadline } from "@/lib/lineup/source-labels";
import type { LineupSourceKind } from "@/lib/lineup/types";
import { teamNameEs } from "@/lib/teams/display";
import { cn } from "@/lib/utils";

type LineupMetaLineProps = {
  sourceKind: LineupSourceKind;
  formationLabel: string;
  fetchedAt?: string | null;
  teamName?: string;
  className?: string;
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

/** Información compacta bajo el campo: fuente · formación (+ actualización). */
export function LineupMetaLine({
  sourceKind,
  formationLabel,
  fetchedAt,
  teamName,
  className,
}: LineupMetaLineProps) {
  const updatedLabel = fetchedAt ? formatFetchedAt(fetchedAt) : null;

  return (
    <div
      className={cn(
        "shrink-0 space-y-0.5 border-t border-[var(--tm-border)]/60 px-2 py-2 text-center",
        className
      )}
    >
      <p className="min-h-[14px] text-[10px] font-semibold uppercase leading-snug tracking-wide text-[var(--tm-fg)]">
        {teamName ? (
          <span className="inline-flex flex-wrap items-center justify-center gap-1">
            <TeamFlagBadge name={teamName} size="xs" />
            <span>{teamNameEs(teamName)}</span>
            <span className="text-[var(--tm-muted)]">·</span>
          </span>
        ) : null}
        <span>
          {lineupSourceHeadline(sourceKind)} · {formationLabel}
        </span>
      </p>
      {updatedLabel ? (
        <p className="min-h-[12px] text-[9px] leading-snug text-[var(--tm-muted)]">
          Actualizado {updatedLabel}
        </p>
      ) : (
        <p className="min-h-[12px]" aria-hidden="true" />
      )}
    </div>
  );
}
