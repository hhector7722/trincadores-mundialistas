import Link from "next/link";
import { LineupFieldGate } from "@/components/lineup/LineupFieldGate";
import { TeamFlagBadge } from "@/components/predictions/TeamFlagBadge";
import { TeamLineupGraphic } from "@/components/lineup/TeamLineupGraphic";
import { LineupSourceBadge } from "@/components/lineup/LineupSourceBadge";
import { buildFallbackLineup } from "@/lib/lineup/build-fallback-lineup";
import type { FormationId } from "@/lib/lineup/types";
import type { TeamSquadWithPlayers } from "@/lib/worldcup-data/squad-queries";
import { teamNameEs } from "@/lib/teams/display";
import { cn } from "@/lib/utils";

type ProbableXIProps = {
  squad: TeamSquadWithPlayers | null;
  teamName: string;
  year?: number | null;
  formation?: FormationId;
  backHref?: string;
  className?: string;
};

export function ProbableXI({
  squad,
  teamName,
  year,
  formation,
  backHref = "/predictions",
  className,
}: ProbableXIProps) {
  const displayName = teamNameEs(teamName);
  const abbr = squad?.team_code ?? teamName.slice(0, 3).toUpperCase();
  const labelYear = year ?? squad?.year;

  if (!squad || squad.players.length === 0) {
    return (
      <div className={cn("flex flex-1 flex-col px-4 py-6", className)}>
        <header className="mb-6 shrink-0">
          {backHref ? (
            <Link href={backHref} className="text-sm font-medium text-[var(--tm-primary)]">
              Volver
            </Link>
          ) : null}
          <div className="mt-4 flex items-center gap-3">
            <TeamFlagBadge name={teamName} size="md" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[var(--tm-accent)]">
                Once probable
              </p>
              <h1 className="font-display text-xl font-bold text-[var(--tm-fg)]">{displayName}</h1>
            </div>
          </div>
        </header>
        <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--tm-border)] bg-[rgba(111,43,255,0.08)] p-8 text-center">
          <p className="text-sm text-[var(--tm-muted)]">
            No hay plantilla disponible para esta selección.
          </p>
          <p className="mt-2 text-xs text-[var(--tm-muted)]">
            Prueba con otra selección o año (ej. /teams/spain/lineup?year=2022).
          </p>
        </div>
      </div>
    );
  }

  const lineup = buildFallbackLineup(squad.players, formation);

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col", className)}>
      <header className="shrink-0 border-b border-[var(--tm-border)] px-4 py-3">
        {backHref ? (
          <Link href={backHref} className="text-sm font-medium text-[var(--tm-primary)]">
            Volver
          </Link>
        ) : null}
        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <TeamFlagBadge name={teamName} size="md" />
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--tm-accent)]">
                Once probable
              </p>
              <h1 className="truncate font-display text-lg font-bold text-[var(--tm-fg)] sm:text-xl">
                {displayName}
              </h1>
              <p className="text-xs text-[var(--tm-muted)]">
                {abbr}
                {labelYear ? ` · Mundial ${labelYear}` : ""}
              </p>
            </div>
          </div>
          <LineupSourceBadge
            sourceKind={lineup.sourceKind}
            formationLabel={lineup.formationLabel}
            fetchedAt={lineup.fetchedAt}
            compact
          />
        </div>
      </header>

      <LineupFieldGate className="flex min-h-0 flex-1 flex-col">
        {(markFieldReady) => (
          <div className="flex min-h-0 flex-1 flex-col items-center overflow-y-auto px-3 py-4">
            <TeamLineupGraphic
              slots={lineup.slots}
              formation={lineup.formation}
              teamName={teamName}
              onFieldReady={markFieldReady}
            />
            <div className="mt-4 max-w-lg px-2">
              <LineupSourceBadge
                sourceKind={lineup.sourceKind}
                formationLabel={lineup.formationLabel}
                fetchedAt={lineup.fetchedAt}
              />
              {lineup.benchCount > 0 ? (
                <p className="mt-2 text-center text-[11px] text-[var(--tm-muted)]">
                  {lineup.benchCount} jugadores en plantilla.
                </p>
              ) : null}
            </div>
          </div>
        )}
      </LineupFieldGate>
    </div>
  );
}
