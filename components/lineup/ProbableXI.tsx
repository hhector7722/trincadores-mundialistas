import Link from "next/link";
import { LineupFieldGate } from "@/components/lineup/LineupFieldGate";
import { TeamFlagBadge } from "@/components/predictions/TeamFlagBadge";
import { TeamLineupGraphic } from "@/components/lineup/TeamLineupGraphic";
import { LineupSourceBadge } from "@/components/lineup/LineupSourceBadge";
import { FORMATION_IDS } from "@/lib/lineup/formation-coordinates";
import { buildFallbackLineup } from "@/lib/lineup/build-fallback-lineup";
import type { FormationId, ResolvedLineup } from "@/lib/lineup/types";
import type { TeamSquadWithPlayers } from "@/lib/worldcup-data/squad-queries";
import { teamNameEs } from "@/lib/teams/display";
import { cn } from "@/lib/utils";

type ProbableXIProps = {
  squad: TeamSquadWithPlayers | null;
  teamName: string;
  teamSlug?: string;
  lineup?: ResolvedLineup | null;
  year?: number | null;
  formation?: FormationId;
  backHref?: string;
  className?: string;
};

function formationHref(teamSlug: string, formation: FormationId, year?: number | null): string {
  const params = new URLSearchParams();
  if (year) params.set("year", String(year));
  params.set("formation", formation);
  const query = params.toString();
  return `/teams/${teamSlug}/lineup${query ? `?${query}` : ""}`;
}

export function ProbableXI({
  squad,
  teamName,
  teamSlug,
  lineup: resolvedLineup,
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

  const lineup = resolvedLineup ?? buildFallbackLineup(squad.players, formation);
  const activeFormation = formation ?? lineup.formation;
  const showFormationPicker = lineup.sourceKind === "fallback" && teamSlug;

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

      {showFormationPicker ? (
        <div className="shrink-0 border-b border-[var(--tm-border)] px-4 py-3">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--tm-muted)]">
            Formación
          </p>
          <div className="flex flex-wrap gap-2">
            {FORMATION_IDS.map((option) => {
              const selected = activeFormation === option;
              return (
                <Link
                  key={option}
                  href={formationHref(teamSlug, option, labelYear)}
                  className={cn(
                    "inline-flex min-h-12 shrink-0 items-center justify-center rounded-xl border px-3 text-sm font-semibold transition-colors",
                    selected
                      ? "border-[var(--tm-accent)] bg-[rgba(212,255,0,0.12)] text-[var(--tm-fg)]"
                      : "border-[var(--tm-border)] bg-[rgba(111,43,255,0.08)] text-[var(--tm-muted)] hover:text-[var(--tm-fg)]"
                  )}
                  aria-current={selected ? "page" : undefined}
                >
                  {option}
                </Link>
              );
            })}
          </div>
        </div>
      ) : null}

      <LineupFieldGate className="flex min-h-0 flex-1 flex-col">
        {(markFieldReady) => (
          <div className="flex min-h-0 flex-1 flex-col items-center overflow-y-auto px-3 py-4">
            <TeamLineupGraphic
              slots={lineup.slots}
              formationLabel={lineup.formationLabel}
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
