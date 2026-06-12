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
    <div role="text" className={cn("tm-hero-highlight-scoreline", className)}>
      <span className="tm-hero-highlight-scoreline-group">
        <TeamFlagBadge
          name={homeTeam}
          size="text"
          shape="rect"
          loading="eager"
          className="tm-hero-highlight-flag"
        />
        <span className="whitespace-nowrap">{teamAbbr(homeTeam)}</span>
        <span className="tabular-nums whitespace-nowrap">{homeGoals}</span>
      </span>
      <span className="tm-hero-highlight-scoreline-group shrink-0">-</span>
      <span className="tm-hero-highlight-scoreline-group">
        <span className="tabular-nums whitespace-nowrap">{awayGoals}</span>
        <span className="whitespace-nowrap">{teamAbbr(awayTeam)}</span>
        <TeamFlagBadge
          name={awayTeam}
          size="text"
          shape="rect"
          loading="eager"
          className="tm-hero-highlight-flag"
        />
      </span>
    </div>
  );
}
