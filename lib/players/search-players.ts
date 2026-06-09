import { isGoalkeeperPosition } from "@/lib/lineup/position-map";
import { normalizeText } from "@/lib/text/normalize-alias";
import { teamNameEs } from "@/lib/teams/display";

export type SearchablePlayer = {
  playerName: string;
  teamName: string;
  position: string | null;
  shirtNumber: number | null;
};

export type ScoredPlayer = SearchablePlayer & { score: number };

export type PlayerSearchOptions = {
  filter?: (position: string | null) => boolean;
  limit?: number;
};

function tokenize(value: string): string[] {
  return normalizeText(value)
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);
}

function scorePlayer(
  player: SearchablePlayer,
  normalizedQuery: string,
  queryTokens: string[]
): number {
  if (!normalizedQuery) return 0;

  const normalizedName = normalizeText(player.playerName);
  const normalizedTeam = normalizeText(teamNameEs(player.teamName));
  const nameTokens = tokenize(player.playerName);

  if (normalizedName === normalizedQuery) return 1000;
  if (normalizedName.startsWith(normalizedQuery)) return 850;
  if (nameTokens.some((token) => token.startsWith(normalizedQuery))) return 780;

  const allTokensAtWordStart = queryTokens.every((queryToken) =>
    nameTokens.some((nameToken) => nameToken.startsWith(queryToken))
  );
  if (allTokensAtWordStart && queryTokens.length > 0) return 700;

  if (normalizedName.includes(normalizedQuery)) return 520;

  let partialTokenScore = 0;
  for (const queryToken of queryTokens) {
    if (nameTokens.some((nameToken) => nameToken.includes(queryToken))) {
      partialTokenScore += 180;
    }
  }
  if (partialTokenScore > 0) return partialTokenScore;

  if (normalizedTeam.includes(normalizedQuery)) return 120;

  return 0;
}

export function searchPlayers(
  players: SearchablePlayer[],
  query: string,
  options?: PlayerSearchOptions
): ScoredPlayer[] {
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery) return [];

  const queryTokens = tokenize(query);
  const limit = options?.limit ?? 20;
  const filter = options?.filter;

  const scored: ScoredPlayer[] = [];

  for (const player of players) {
    if (filter && !filter(player.position)) continue;

    const score = scorePlayer(player, normalizedQuery, queryTokens);
    if (score <= 0) continue;

    scored.push({ ...player, score });
  }

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.playerName.localeCompare(b.playerName, "es");
  });

  return scored.slice(0, limit);
}

export function goalkeeperFilter(position: string | null): boolean {
  return isGoalkeeperPosition(position);
}
