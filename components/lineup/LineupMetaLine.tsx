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
    <div className={cn("shrink-0 text-center", className)}>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--tm-fg)]">
        {teamName ? (
          <span className="inline-flex items-center justify-center gap-1">
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
        <p className="mt-0.5 text-[9px] text-[var(--tm-muted)]">Actualizado {updatedLabel}</p>
      ) : null}
    </div>
  );
}
