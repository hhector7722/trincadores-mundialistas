import { TeamFlagBadge } from "@/components/predictions/TeamFlagBadge";
import { teamAbbr } from "@/lib/teams/display";
import { cn } from "@/lib/utils";

function EmptyCell() {
  return (
    <span className="flex h-full min-w-0 items-center justify-center px-0.5 text-center text-[10px] text-[var(--tm-fg)]">
      —
    </span>
  );
}

export function ChampionPredictionCell({ team }: { team: string | null }) {
  if (!team) return <EmptyCell />;

  return (
    <span className="inline-flex h-full min-w-0 items-center justify-center gap-0.5 px-0.5 text-[10px] font-medium leading-none">
      <TeamFlagBadge name={team} size="text" loading="eager" className="shrink-0" />
      <span className="whitespace-nowrap text-[var(--tm-fg)]">{teamAbbr(team)}</span>
    </span>
  );
}

export function FinalistsPredictionCell({
  teamA,
  teamB,
}: {
  teamA: string | null;
  teamB: string | null;
}) {
  if (!teamA || !teamB) return <EmptyCell />;

  return (
    <span className="flex h-full min-w-0 items-center justify-center gap-0.5 px-0.5 text-[10px] font-medium text-[var(--tm-accent)]">
      <span className="whitespace-nowrap">{teamAbbr(teamA)}</span>
      <span className="text-[var(--tm-accent-muted)]">-</span>
      <span className="whitespace-nowrap">{teamAbbr(teamB)}</span>
    </span>
  );
}

export function PlayerPredictionCell({
  value,
  fontSize,
  accent = false,
}: {
  value: string | null;
  fontSize: number;
  accent?: boolean;
}) {
  return (
    <span className="flex h-full min-w-0 items-center justify-center px-0.5">
      <span
        className={cn(
          "text-center font-medium leading-snug",
          accent ? "text-[var(--tm-accent)]" : "text-[var(--tm-fg)]",
          value ? "whitespace-nowrap" : "text-[10px]"
        )}
        style={value ? { fontSize: `${fontSize}px` } : undefined}
      >
        {value?.trim() ?? "—"}
      </span>
    </span>
  );
}
