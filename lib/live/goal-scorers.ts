import { shirtPlayerName } from "@/lib/lineup/short-player-name";
import type { MatchPlayerIncident } from "@/lib/live/types";

export type MatchGoalScorer = {
  playerName: string;
  minute: number | null;
};

export function goalScorerDisplayName(fullName: string): string {
  return shirtPlayerName(fullName);
}

export function formatGoalScorerLabel(goal: MatchGoalScorer): string {
  const name = goalScorerDisplayName(goal.playerName);
  if (goal.minute != null) return `${name} ${goal.minute}'`;
  return name;
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
