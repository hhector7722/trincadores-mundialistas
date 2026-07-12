import { isPlaceholderTeam } from "@/lib/openfootball/slug";
import type { MatchWithPrediction } from "@/lib/predictions/queries";

type PendingTeamsConfig = {
  homeTeams?: string[];
  awayTeams?: string[];
};

/** Fallback visual cuando el bracket aún no está resuelto en BD. */
const PENDING_TEAMS_BY_DATE: Record<string, PendingTeamsConfig> = {
  "2026-07-14": {
    homeTeams: ["France"],
    awayTeams: ["Spain"],
  },
  "2026-07-15": {
    homeTeams: ["England"],
    awayTeams: ["Argentina"],
  },
};

function datePrefix(iso: string): string {
  return iso.slice(0, 10);
}

export function getPendingTeamsForMatch(
  match: MatchWithPrediction
): PendingTeamsConfig | null {
  const prefix = datePrefix(match.kickoff_at);
  const config = PENDING_TEAMS_BY_DATE[prefix];
  if (!config) return null;

  const hasHomePlaceholder = isPlaceholderTeam(match.home_team);
  const hasAwayPlaceholder = isPlaceholderTeam(match.away_team);

  if (!hasHomePlaceholder && !hasAwayPlaceholder) return null;

  const homeTeams = hasHomePlaceholder ? config.homeTeams : undefined;
  const awayTeams = hasAwayPlaceholder ? config.awayTeams : undefined;

  if (!homeTeams && !awayTeams) return null;

  return { homeTeams, awayTeams };
}
