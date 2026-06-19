import { normalizePlayerName } from "@/lib/lineup/player-dedupe";
import { openFootballTeamName } from "@/lib/worldcup2026/squad-team-names";

/** Tokens equivalentes en nombres FIFA vs plantilla/porra (Jr/Junior, etc.). */
function normalizeMvpPlayerToken(name: string): string {
  return normalizePlayerName(name).replace(/\bjr\b/g, "junior");
}

export function mvpPlayerNamesMatch(
  predictedPlayer: string,
  officialPlayer: string,
): boolean {
  const predicted = normalizeMvpPlayerToken(predictedPlayer);
  const official = normalizeMvpPlayerToken(officialPlayer);
  if (!predicted || !official) return false;
  return predicted === official;
}

export function mvpTeamsMatch(predictedTeam: string, officialTeam: string): boolean {
  const predicted = openFootballTeamName(predictedTeam);
  const official = openFootballTeamName(officialTeam);
  return normalizePlayerName(predicted) === normalizePlayerName(official);
}

/** Misma regla que `compute_mvp_points` en SQL (con alias Jr/Junior). */
export function isMvpPredictionCorrect(
  predictedPlayer: string,
  predictedTeam: string,
  officialPlayer: string | null | undefined,
  officialTeam: string | null | undefined,
): boolean {
  if (!officialPlayer?.trim()) return false;
  return (
    mvpPlayerNamesMatch(predictedPlayer, officialPlayer) &&
    mvpTeamsMatch(predictedTeam, officialTeam ?? predictedTeam)
  );
}

/** Elige el nombre ya usado en porra si coincide con el oficial (p. ej. Vinicius Junior vs Vinicius Jr). */
export function resolveStoredOfficialMvpPlayerName(
  officialPlayer: string,
  predictedNames: string[],
): string {
  const hit = predictedNames.find((name) => mvpPlayerNamesMatch(name, officialPlayer));
  return hit?.trim() || officialPlayer.trim();
}
