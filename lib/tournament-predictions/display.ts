import { shirtPlayerName } from "@/lib/lineup/short-player-name";
import { teamAbbr, teamNameEs } from "@/lib/teams/display";
import type { TournamentGeneralPredictions } from "@/lib/tournament-predictions/types";

export function formatChampionDisplay(team: string | null): string | null {
  if (!team) return null;
  return teamNameEs(team);
}

export function formatFinalistsDisplay(
  teamA: string | null,
  teamB: string | null
): string | null {
  if (!teamA || !teamB) return null;
  return `${teamAbbr(teamA)} · ${teamAbbr(teamB)}`;
}

export function formatPlayerDisplay(
  playerName: string | null,
  teamName: string | null
): string | null {
  if (!playerName) return null;
  const player = shirtPlayerName(playerName);
  if (!teamName) return player;
  return `${player} (${teamAbbr(teamName)})`;
}

export function hasFinalists(predictions: TournamentGeneralPredictions): boolean {
  return Boolean(predictions.finalistTeamA && predictions.finalistTeamB);
}
