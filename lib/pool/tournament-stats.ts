import type { MatchWithPrediction } from "@/lib/predictions/queries";

export type TournamentScorerRow = {
  player: string;
  goals: number;
};

export type TournamentStatRow = {
  label: string;
  value: number;
};

export type TournamentStatKind =
  | "scorers"
  | "assists"
  | "yellow_cards"
  | "red_cards"
  | "mvp";

export const TOURNAMENT_STAT_TABS: ReadonlyArray<{
  id: TournamentStatKind;
  label: string;
}> = [
  { id: "scorers", label: "Goleadores" },
  { id: "assists", label: "Asistencias" },
  { id: "yellow_cards", label: "Amarillas" },
  { id: "red_cards", label: "Rojas" },
  { id: "mvp", label: "MVP" },
];

const PLACEHOLDER_SCORERS: TournamentScorerRow[] = [
  { player: "C Ronaldo", goals: 973 },
];

export function tournamentHasGoals(matches: MatchWithPrediction[]): boolean {
  return matches.some(
    (match) =>
      match.officialHome != null &&
      match.officialAway != null &&
      match.officialHome + match.officialAway > 0
  );
}

export function getTournamentTopScorers(
  matches: MatchWithPrediction[]
): TournamentScorerRow[] {
  if (!tournamentHasGoals(matches)) {
    return PLACEHOLDER_SCORERS;
  }

  // Sin datos de jugadores todavía: vacío hasta integrar fuente real.
  void matches;
  return [];
}

export function getTournamentStatRows(
  kind: TournamentStatKind,
  matches: MatchWithPrediction[]
): TournamentStatRow[] {
  if (kind === "scorers") {
    return getTournamentTopScorers(matches).map((row) => ({
      label: row.player,
      value: row.goals,
    }));
  }

  void matches;
  return [];
}
