import type { MatchWithPrediction } from "@/lib/predictions/queries";

export type KnockoutResultSnapshot = {
  homeTeam: string;
  awayTeam: string;
  status: string;
  officialHome: number | null;
  officialAway: number | null;
  officialPenaltyHome?: number | null;
  officialPenaltyAway?: number | null;
  officialAdvancingTeam?: "home" | "away" | null;
};

export function resolveKnockoutWinnerSide(
  match: KnockoutResultSnapshot
): "home" | "away" | null {
  if (match.status !== "finished") return null;
  if (match.officialHome == null || match.officialAway == null) return null;

  if (match.officialHome > match.officialAway) return "home";
  if (match.officialAway > match.officialHome) return "away";

  if (
    match.officialPenaltyHome != null &&
    match.officialPenaltyAway != null &&
    match.officialPenaltyHome !== match.officialPenaltyAway
  ) {
    return match.officialPenaltyHome > match.officialPenaltyAway ? "home" : "away";
  }

  if (match.officialAdvancingTeam === "home" || match.officialAdvancingTeam === "away") {
    return match.officialAdvancingTeam;
  }

  return null;
}

export function resolveKnockoutWinnerTeam(
  match: KnockoutResultSnapshot,
  wantWinner: boolean
): string | null {
  const side = resolveKnockoutWinnerSide(match);
  if (!side) return null;
  if (wantWinner) return side === "home" ? match.homeTeam : match.awayTeam;
  return side === "home" ? match.awayTeam : match.homeTeam;
}

function toSnapshot(match: MatchWithPrediction): KnockoutResultSnapshot {
  return {
    homeTeam: match.home_team,
    awayTeam: match.away_team,
    status: match.status,
    officialHome: match.officialHome ?? null,
    officialAway: match.officialAway ?? null,
    officialPenaltyHome: match.officialPenaltyHome ?? null,
    officialPenaltyAway: match.officialPenaltyAway ?? null,
    officialAdvancingTeam: match.officialAdvancingTeam ?? null,
  };
}

export function resolveKnockoutPlaceholderTeam(
  placeholder: string,
  matchByNumber: Map<number, MatchWithPrediction>
): string | null {
  const parsed = placeholder.trim().match(/^([WL])(\d+)$/i);
  if (!parsed) return null;

  const wantWinner = parsed[1].toUpperCase() === "W";
  const sourceMatch = matchByNumber.get(Number(parsed[2]));
  if (!sourceMatch) return null;

  return resolveKnockoutWinnerTeam(toSnapshot(sourceMatch), wantWinner);
}

export function resolveKnockoutTeams(matches: MatchWithPrediction[]): MatchWithPrediction[] {
  const sorted = [...matches].sort((a, b) => (a.match_number || 0) - (b.match_number || 0));
  const matchMap = new Map<number, MatchWithPrediction>();

  for (const match of sorted) {
    const resolveTeam = (raw: string | undefined | null): string => {
      const rawTrimmed = (raw ?? "").trim();
      if (/^[WL]\d+$/i.test(rawTrimmed)) {
        return resolveKnockoutPlaceholderTeam(rawTrimmed, matchMap) ?? rawTrimmed;
      }
      return rawTrimmed;
    };

    const updatedMatch = {
      ...match,
      home_team: resolveTeam(match.home_team) || match.home_team,
      away_team: resolveTeam(match.away_team) || match.away_team,
    };

    if (match.match_number != null) {
      matchMap.set(match.match_number, updatedMatch);
    }
  }

  return matches.map(
    (match) => (match.match_number != null ? matchMap.get(match.match_number) : undefined) ?? match
  );
}

export function snapshotFromDbMatch(
  match: { home_team: string; away_team: string; status: string },
  result: {
    home_goals: number;
    away_goals: number;
    penalty_home?: number | null;
    penalty_away?: number | null;
    advancing_team?: string | null;
  } | null
): KnockoutResultSnapshot {
  return {
    homeTeam: match.home_team,
    awayTeam: match.away_team,
    status: match.status,
    officialHome: result?.home_goals ?? null,
    officialAway: result?.away_goals ?? null,
    officialPenaltyHome: result?.penalty_home ?? null,
    officialPenaltyAway: result?.penalty_away ?? null,
    officialAdvancingTeam: (result?.advancing_team as "home" | "away" | null) ?? null,
  };
}
