import { TeamFlagBadge } from "@/components/predictions/TeamFlagBadge";
import { teamAbbr } from "@/lib/teams/display";
import { cn } from "@/lib/utils";

type MatchHighlightScorelineProps = {
  homeTeam: string;
  awayTeam: string;
  homeGoals: number;
  awayGoals: number;
  className?: string;
  scoreClassName?: string;
};

export function MatchHighlightScoreline({
  homeTeam,
  awayTeam,
  homeGoals,
  awayGoals,
  className,
  scoreClassName,
}: MatchHighlightScorelineProps) {
  const homeDisplay = homeGoals === 0 ? " " : String(homeGoals);
  const awayDisplay = awayGoals === 0 ? " " : String(awayGoals);

  return (
    <div
      className={cn(
        "flex w-full min-w-0 items-center justify-center gap-1.5 sm:gap-2",
        className,
      )}
    >
      <TeamFlagBadge name={homeTeam} size="xs" loading="eager" imageWidth={160} />
      <span className="text-[clamp(9px,2.4cqw,11px)] font-bold uppercase tracking-wide text-white/85">
        {teamAbbr(homeTeam)}
      </span>
      <span
        className={cn(
          "font-display text-[clamp(1.125rem,8cqw,1.5rem)] font-black tabular-nums text-white",
          scoreClassName,
        )}
      >
        {homeDisplay}
      </span>
      <span className="font-display text-sm font-semibold text-white/50">-</span>
      <span
        className={cn(
          "font-display text-[clamp(1.125rem,8cqw,1.5rem)] font-black tabular-nums text-white",
          scoreClassName,
        )}
      >
        {awayDisplay}
      </span>
      <span className="text-[clamp(9px,2.4cqw,11px)] font-bold uppercase tracking-wide text-white/85">
        {teamAbbr(awayTeam)}
      </span>
      <TeamFlagBadge name={awayTeam} size="xs" loading="eager" imageWidth={160} />
    </div>
  );
}
