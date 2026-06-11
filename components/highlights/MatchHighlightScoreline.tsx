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
  const homeDisplay = String(homeGoals);
  const awayDisplay = String(awayGoals);

  return (
    <div
      className={cn(
        "flex w-full min-w-0 items-center justify-center gap-1 sm:gap-1.5",
        className,
      )}
    >
      <TeamFlagBadge name={homeTeam} size="xxs" loading="eager" imageWidth={80} />
      <span className="text-[clamp(7px,1.9cqw,9px)] font-bold uppercase tracking-wide text-white/85">
        {teamAbbr(homeTeam)}
      </span>
      <span
        className={cn(
          "font-display text-[clamp(0.75rem,5cqw,0.9375rem)] font-black tabular-nums leading-none text-white",
          scoreClassName,
        )}
      >
        {homeDisplay}
      </span>
      <span className="font-display text-[10px] font-semibold leading-none text-white/50">-</span>
      <span
        className={cn(
          "font-display text-[clamp(0.75rem,5cqw,0.9375rem)] font-black tabular-nums leading-none text-white",
          scoreClassName,
        )}
      >
        {awayDisplay}
      </span>
      <span className="text-[clamp(7px,1.9cqw,9px)] font-bold uppercase tracking-wide text-white/85">
        {teamAbbr(awayTeam)}
      </span>
      <TeamFlagBadge name={awayTeam} size="xxs" loading="eager" imageWidth={80} />
    </div>
  );
}
