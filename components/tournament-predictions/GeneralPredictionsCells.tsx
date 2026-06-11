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
    <span className="flex h-full min-w-0 items-center justify-center gap-0.5 px-0.5">
      <TeamFlagBadge name={team} size="xxs" loading="eager" className="shrink-0" />
      <span className="whitespace-nowrap text-[10px] font-medium text-[var(--tm-fg)]">
        {teamAbbr(team)}
      </span>
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
    <span className="flex h-full min-w-0 items-center justify-center gap-0.5 px-0.5 text-[10px] font-medium text-[var(--tm-fg)]">
      <TeamFlagBadge name={teamA} size="xxs" loading="eager" className="shrink-0" />
      <span className="whitespace-nowrap">{teamAbbr(teamA)}</span>
      <span className="text-[var(--tm-muted)]">-</span>
      <span className="whitespace-nowrap">{teamAbbr(teamB)}</span>
      <TeamFlagBadge name={teamB} size="xxs" loading="eager" className="shrink-0" />
    </span>
  );
}

export function PlayerPredictionCell({
  value,
  fontSize,
}: {
  value: string | null;
  fontSize: number;
}) {
  return (
    <span className="flex h-full min-w-0 items-center justify-center px-0.5">
      <span
        className={cn(
          "text-center leading-snug text-[var(--tm-fg)]",
          value ? "break-words" : "text-[10px]"
        )}
        style={value ? { fontSize: `${fontSize}px` } : undefined}
      >
        {value?.trim() ?? "—"}
      </span>
    </span>
  );
}
