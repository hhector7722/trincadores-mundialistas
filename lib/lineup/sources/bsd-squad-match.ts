import type { LineupPlayerInput } from "@/lib/lineup/types";

function normalizeName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function findSquadPlayer(
  apiName: string,
  shirtNumber: number | null | undefined,
  players: LineupPlayerInput[]
): LineupPlayerInput | null {
  const target = normalizeName(apiName);
  const exact = players.find((player) => normalizeName(player.player_name) === target);
  if (exact) return exact;

  if (shirtNumber != null) {
    const byShirt = players.find((player) => player.shirt_number === shirtNumber);
    if (byShirt) return byShirt;
  }

  const lastToken = target.split(" ").pop();
  if (!lastToken || lastToken.length < 3) return null;

  const candidates = players.filter((player) =>
    normalizeName(player.player_name).includes(lastToken)
  );
  return candidates.length === 1 ? candidates[0]! : null;
}
