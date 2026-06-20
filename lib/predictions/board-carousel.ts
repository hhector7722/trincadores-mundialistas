import type { MatchWithPrediction } from "@/lib/predictions/queries";

export type MatchPredictionsBoardCarouselMatch = {
  id: string;
  homeTeam: string;
  awayTeam: string;
  status: "live" | "finished";
};

export function buildBoardCarouselMatches(
  matches: Pick<MatchWithPrediction, "id" | "status" | "kickoff_at" | "home_team" | "away_team">[],
): MatchPredictionsBoardCarouselMatch[] {
  return matches
    .filter((match) => match.status === "finished" || match.status === "live")
    .sort(
      (a, b) => new Date(a.kickoff_at).getTime() - new Date(b.kickoff_at).getTime(),
    )
    .map((match) => ({
      id: match.id,
      homeTeam: match.home_team,
      awayTeam: match.away_team,
      status: match.status as "live" | "finished",
    }));
}

/** @deprecated Usar `buildBoardCarouselMatches`. */
export const buildFinishedMatchesForBoardCarousel = buildBoardCarouselMatches;
