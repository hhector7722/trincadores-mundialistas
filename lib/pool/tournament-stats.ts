import type { MatchPlayerIncident } from "@/lib/live/types";
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
  { id: "scorers", label: "Goles" },
  { id: "assists", label: "Asistencias" },
  { id: "yellow_cards", label: "Amarillas" },
  { id: "red_cards", label: "Rojas" },
  { id: "mvp", label: "MVP" },
];

const KIND_BY_STAT: Record<Exclude<TournamentStatKind, "mvp">, MatchPlayerIncident["kind"]> = {
  scorers: "goal",
  assists: "assist",
  yellow_cards: "yellow_card",
  red_cards: "red_card",
};

function aggregateIncidents(
  matches: MatchWithPrediction[],
  kind: MatchPlayerIncident["kind"],
): TournamentStatRow[] {
  const totals = new Map<string, number>();

  for (const match of matches) {
    for (const incident of match.playerIncidents ?? []) {
      if (incident.kind !== kind) continue;
      totals.set(incident.playerName, (totals.get(incident.playerName) ?? 0) + 1);
    }
  }

  return [...totals.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((left, right) => right.value - left.value || left.label.localeCompare(right.label, "es"));
}

function aggregateMvps(matches: MatchWithPrediction[]): TournamentStatRow[] {
  const totals = new Map<string, number>();

  for (const match of matches) {
    const player = match.officialMvpPlayerName?.trim();
    if (!player) continue;
    totals.set(player, (totals.get(player) ?? 0) + 1);
  }

  return [...totals.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((left, right) => right.value - left.value || left.label.localeCompare(right.label, "es"));
}

export function tournamentHasGoals(matches: MatchWithPrediction[]): boolean {
  return matches.some(
    (match) =>
      match.officialHome != null &&
      match.officialAway != null &&
      match.officialHome + match.officialAway > 0
  );
}

export function getTournamentTopScorers(matches: MatchWithPrediction[]): TournamentScorerRow[] {
  return aggregateIncidents(matches, "goal").map((row) => ({
    player: row.label,
    goals: row.value,
  }));
}

export function getTournamentStatRows(
  kind: TournamentStatKind,
  matches: MatchWithPrediction[]
): TournamentStatRow[] {
  if (kind === "mvp") {
    return aggregateMvps(matches);
  }

  return aggregateIncidents(matches, KIND_BY_STAT[kind]);
}
