import { shirtPlayerName } from "@/lib/lineup/short-player-name";
import { teamAbbr, teamNameEs } from "@/lib/teams/display";
import type { TournamentGeneralPredictions } from "@/lib/tournament-predictions/types";

export function formatChampionDisplay(team: string | null): string | null {
  if (!team) return null;
  return teamNameEs(team);
}

export function formatChampionDisplayCompact(team: string | null): string | null {
  if (!team) return null;
  return teamAbbr(team);
}

export function formatFinalistsDisplay(
  teamA: string | null,
  teamB: string | null
): string | null {
  if (!teamA || !teamB) return null;
  return `${teamAbbr(teamA)} · ${teamAbbr(teamB)}`;
}

export function formatFinalistsDisplayFull(
  teamA: string | null,
  teamB: string | null
): string | null {
  if (!teamA || !teamB) return null;
  return `${teamNameEs(teamA)} · ${teamNameEs(teamB)}`;
}

export function formatPlayerDisplay(
  playerName: string | null,
  _teamName?: string | null
): string | null {
  if (!playerName) return null;
  return shirtPlayerName(playerName);
}

export function formatPlayerDisplayFull(playerName: string | null): string | null {
  if (!playerName) return null;
  return playerName.trim();
}

export function hasFinalists(predictions: TournamentGeneralPredictions): boolean {
  return Boolean(predictions.finalistTeamA && predictions.finalistTeamB);
}
