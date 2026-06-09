export type PlayerIdentity = {
  name: string;
  shirtNumber: number | null;
};

export function normalizePlayerName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function playerIdentityKey(player: PlayerIdentity): string {
  const shirt = player.shirtNumber;
  if (shirt != null && shirt > 0) return `shirt:${shirt}`;
  const name = normalizePlayerName(player.name);
  return name ? `name:${name}` : "";
}

export function dedupePlayersByIdentity<T extends PlayerIdentity>(players: T[]): T[] {
  const seen = new Set<string>();
  const result: T[] = [];

  for (const player of players) {
    const key = playerIdentityKey(player);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(player);
  }

  return result;
}
