import Link from "next/link";
import { BenchPlayersStrip } from "@/components/lineup/BenchPlayersStrip";
import { LineupFieldGate } from "@/components/lineup/LineupFieldGate";
import { LineupMetaLine } from "@/components/lineup/LineupMetaLine";
import { TeamFlagBadge } from "@/components/predictions/TeamFlagBadge";
import { TeamLineupGraphic } from "@/components/lineup/TeamLineupGraphic";
import { FORMATION_IDS } from "@/lib/lineup/formation-coordinates";
import { resolveBenchPlayers } from "@/lib/lineup/bench-from-lineup";
import { buildFallbackLineup } from "@/lib/lineup/build-fallback-lineup";
import { resolveVisualLineupSlots } from "@/lib/lineup/visual-lineup-slots";
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
  const labelYear = year ?? squad?.year;

  if (!squad || squad.players.length === 0) {
    return (
      <div className={cn("flex flex-1 flex-col px-4 py-6", className)}>
        <header className="mb-4 flex min-h-10 shrink-0 items-center gap-2">
          {backHref ? (
            <Link href={backHref} className="shrink-0 text-sm font-medium text-[var(--tm-primary)]">
              ←
            </Link>
          ) : null}
          <TeamFlagBadge name={teamName} size="xs" />
          <h1 className="truncate font-display text-sm font-bold text-[var(--tm-fg)]">{displayName}</h1>
        </header>
        <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--tm-border)] bg-[rgba(111,43,255,0.08)] p-8 text-center">
          <p className="text-sm text-[var(--tm-muted)]">
            No hay plantilla disponible para esta selección.
          </p>
        </div>
      </div>
    );
  }

  const lineup =
    resolvedLineup ?? buildFallbackLineup(squad.players, { knownFormation: formation });
  const formationSlots = resolveVisualLineupSlots(lineup);
  const activeFormation = formation ?? lineup.formation;
  const showFormationPicker = lineup.sourceKind === "fallback" && teamSlug;
  const bench = resolveBenchPlayers(squad, lineup);

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col", className)}>
      <header className="flex min-h-10 shrink-0 items-center gap-2 border-b border-[var(--tm-border)] px-3 py-1.5">
        {backHref ? (
          <Link
            href={backHref}
            className="flex min-h-10 min-w-10 shrink-0 items-center justify-center text-sm font-medium text-[var(--tm-primary)]"
            aria-label="Volver"
          >
            ←
          </Link>
        ) : null}
        <TeamFlagBadge name={teamName} size="xs" />
        <h1 className="min-w-0 flex-1 truncate font-display text-sm font-bold text-[var(--tm-fg)]">
          {displayName}
        </h1>
      </header>

      {showFormationPicker ? (
        <div className="shrink-0 border-b border-[var(--tm-border)] px-3 py-1.5">
          <div className="flex gap-1.5 overflow-x-auto overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {FORMATION_IDS.map((option) => {
              const selected = activeFormation === option;
              return (
                <Link
                  key={option}
                  href={formationHref(teamSlug, option, labelYear)}
                  className={cn(
                    "inline-flex min-h-10 shrink-0 items-center justify-center rounded-lg border px-2.5 text-xs font-semibold transition-colors",
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
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-2 py-1">
            <div className="flex min-h-[14rem] flex-1 items-center justify-center py-0.5">
              <TeamLineupGraphic
                slots={formationSlots}
                teamName={teamName}
                onFieldReady={markFieldReady}
                benchAbove={
                  bench.length > 0 ? (
                    <BenchPlayersStrip
                      teamName={teamName}
                      players={bench}
                      density="inline"
                      showTeamHeader={false}
                      position="none"
                      onPlayerClick={() => {}}
                    />
                  ) : null
                }
              />
            </div>

            <LineupMetaLine
              className="mt-1"
              teamName={teamName}
              sourceKind={lineup.sourceKind}
              formationLabel={lineup.formationLabel}
              fetchedAt={lineup.fetchedAt}
            />
          </div>
        )}
      </LineupFieldGate>
    </div>
  );
}
