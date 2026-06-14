import { shirtPlayerName } from "@/lib/lineup/short-player-name";
import { mvpPlayerNamesMatch } from "@/lib/predictions/mvp-name-match";
import type { MatchPlayerIncident } from "@/lib/live/types";

export type MatchGoalScorer = {
  playerName: string;
  minute: number | null;
};

export type GroupedGoalScorer = {
  playerName: string;
  minutes: number[];
};

const CARD_COMPACT_THRESHOLD = 3;
const CARD_MAX_SCORERS_PER_ROW = 3;

export function goalScorerDisplayName(fullName: string): string {
  return shirtPlayerName(fullName);
}

export function formatGoalScorerLabel(goal: MatchGoalScorer): string {
  return formatGroupedGoalScorerLabel({
    playerName: goal.playerName,
    minutes: goal.minute != null ? [goal.minute] : [],
  });
}

export function groupGoalScorersByPlayer(goals: MatchGoalScorer[]): GroupedGoalScorer[] {
  const order: string[] = [];
  const groups = new Map<string, GroupedGoalScorer>();

  for (const goal of goals) {
    const key = goal.playerName.trim().toLowerCase();
    let group = groups.get(key);
    if (!group) {
      group = { playerName: goal.playerName, minutes: [] };
      groups.set(key, group);
      order.push(key);
    }
    if (goal.minute != null) group.minutes.push(goal.minute);
  }

  return order.map((key) => groups.get(key)!);
}

export function formatGroupedGoalScorerLabel(group: GroupedGoalScorer): string {
  const name = goalScorerDisplayName(group.playerName);
  if (!group.minutes.length) return name;
  return `${name} ${group.minutes.map((minute) => `${minute}'`).join(" ")}`;
}

/** Card/modal partido: una fila por goleador o varios en la misma fila si hay muchos. */
export function buildCardGoalScorerLines(
  goals: MatchGoalScorer[],
  maxPerRow = CARD_MAX_SCORERS_PER_ROW,
): string[] {
  const groups = groupGoalScorersByPlayer(goals);
  if (!groups.length) return [];

  if (groups.length <= CARD_COMPACT_THRESHOLD) {
    return groups.map(formatGroupedGoalScorerLabel);
  }

  const lines: string[] = [];
  for (let index = 0; index < groups.length; index += maxPerRow) {
    const chunk = groups.slice(index, index + maxPerRow);
    lines.push(chunk.map(formatGroupedGoalScorerLabel).join(", "));
  }
  return lines;
}

/** Tablero de pronósticos: un goleador (con todos sus minutos) por fila. */
export function buildBoardGoalScorerLines(goals: MatchGoalScorer[]): string[] {
  return groupGoalScorersByPlayer(goals).map(formatGroupedGoalScorerLabel);
}

export function extractGoalScorersByTeam(
  incidents: MatchPlayerIncident[] | undefined | null,
): { home: MatchGoalScorer[]; away: MatchGoalScorer[] } {
  const home: MatchGoalScorer[] = [];
  const away: MatchGoalScorer[] = [];

  for (const incident of incidents ?? []) {
    if (incident.kind !== "goal") continue;
    const row: MatchGoalScorer = {
      playerName: incident.playerName,
      minute: incident.minute ?? null,
    };
    if (incident.teamSide === "away") away.push(row);
    else home.push(row);
  }

  return { home, away };
}

export function resolveMatchGoalScorers(
  fallbackIncidents: MatchPlayerIncident[] | undefined | null,
  liveIncidents?: MatchPlayerIncident[] | undefined | null,
): { home: MatchGoalScorer[]; away: MatchGoalScorer[] } {
  const incidents = liveIncidents?.length ? liveIncidents : fallbackIncidents;
  return extractGoalScorersByTeam(incidents);
}

/** Goleadores del jugador en el partido (cualquier equipo), para etiqueta MVP del tablero. */
export function findGroupedGoalScorerForPlayer(
  playerName: string,
  incidents: MatchPlayerIncident[] | undefined | null,
): GroupedGoalScorer | null {
  const trimmed = playerName.trim();
  if (!trimmed) return null;

  const { home, away } = extractGoalScorersByTeam(incidents);
  const groups = groupGoalScorersByPlayer([...home, ...away]);
  return groups.find((group) => mvpPlayerNamesMatch(group.playerName, trimmed)) ?? null;
}
