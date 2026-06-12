import { TeamFlagBadge } from "@/components/predictions/TeamFlagBadge";
import { teamAbbr } from "@/lib/teams/display";
import { cn } from "@/lib/utils";

type MatchHighlightScorelineProps = {
  homeTeam: string;
  awayTeam: string;
  homeGoals: number;
  awayGoals: number;
  className?: string;
};

/** Marcador compacto hero: bandera + abbr + gol | gol + abbr + bandera (banderas rectangulares). */
export function MatchHighlightScoreline({
  homeTeam,
  awayTeam,
  homeGoals,
  awayGoals,
  className,
}: MatchHighlightScorelineProps) {
  return (
    <div
      role="text"
      className={cn(
        "m-0 flex min-h-[1.35em] min-w-0 flex-1 items-center gap-[0.3em] overflow-hidden text-[clamp(7px,2cqw,8px)] font-bold uppercase leading-none tracking-wide text-white/85",
        className,
      )}
    >
      <span className="inline-flex min-w-0 items-center gap-[0.2em] self-center">
        <TeamFlagBadge
          name={homeTeam}
          size="text"
          shape="rect"
          loading="eager"
          className="shrink-0 self-center"
        />
        <span className="self-center whitespace-nowrap">{teamAbbr(homeTeam)}</span>
        <span className="self-center tabular-nums whitespace-nowrap">{homeGoals}</span>
      </span>
      <span className="shrink-0 self-center">-</span>
      <span className="inline-flex min-w-0 items-center gap-[0.2em] self-center">
        <span className="self-center tabular-nums whitespace-nowrap">{awayGoals}</span>
        <span className="self-center whitespace-nowrap">{teamAbbr(awayTeam)}</span>
        <TeamFlagBadge
          name={awayTeam}
          size="text"
          shape="rect"
          loading="eager"
          className="shrink-0 self-center"
        />
      </span>
    </div>
  );
}
