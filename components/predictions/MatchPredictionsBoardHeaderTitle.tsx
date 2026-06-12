import { TeamFlagBadge } from "@/components/predictions/TeamFlagBadge";
import { teamAbbr } from "@/lib/teams/display";
import { cn } from "@/lib/utils";

type MatchPredictionsBoardHeaderTitleProps = {
  homeTeam: string;
  awayTeam: string;
  homeGoals: number | null;
  awayGoals: number | null;
  className?: string;
};

function formatGoal(value: number | null): string {
  if (value === null) return "—";
  return String(value);
}

export function matchPredictionsBoardAriaTitle(
  homeTeam: string,
  awayTeam: string,
  homeGoals: number | null,
  awayGoals: number | null,
): string {
  return `${teamAbbr(homeTeam)} ${formatGoal(homeGoals)} - ${formatGoal(awayGoals)} ${teamAbbr(awayTeam)}`;
}

/** Cabecera del modal: bandera · abrev · goles · goles · abrev · bandera. */
export function MatchPredictionsBoardHeaderTitle({
  homeTeam,
  awayTeam,
  homeGoals,
  awayGoals,
  className,
}: MatchPredictionsBoardHeaderTitleProps) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center justify-center gap-1 normal-case tracking-normal",
        className,
      )}
    >
      <TeamFlagBadge name={homeTeam} size="xxs" loading="eager" />
      <span className="text-xs font-semibold">{teamAbbr(homeTeam)}</span>
      <span className="font-display text-sm font-semibold tabular-nums">{formatGoal(homeGoals)}</span>
      <span className="text-xs text-[var(--tm-muted)]">-</span>
      <span className="font-display text-sm font-semibold tabular-nums">{formatGoal(awayGoals)}</span>
      <span className="text-xs font-semibold">{teamAbbr(awayTeam)}</span>
      <TeamFlagBadge name={awayTeam} size="xxs" loading="eager" />
    </span>
  );
}
