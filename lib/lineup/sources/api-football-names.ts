/** Alias OpenFootball / app → nombres habituales en API-Football. */
const TEAM_ALIASES: Record<string, string[]> = {
  usa: ["united states", "united states of america"],
  "south korea": ["korea republic", "republic of korea", "korea"],
  "bosnia & herzegovina": ["bosnia herzegovina", "bosnia-herzegovina"],
  "dr congo": ["congo dr", "congo democratic republic", "democratic republic of the congo"],
  curacao: ["curaçao", "curacao"],
  "cape verde": ["cabo verde"],
  turkey: ["turkiye", "türkiye"],
  "czech republic": ["czechia"],
  "ivory coast": ["cote divoire", "côte d'ivoire"],
  "north macedonia": ["macedonia"],
};

export function normalizeTeamName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function aliasKeysFor(name: string): string[] {
  const normalized = normalizeTeamName(name);
  const aliases = TEAM_ALIASES[normalized] ?? [];
  return [normalized, ...aliases.map(normalizeTeamName)];
}

export function teamNamesMatch(apiName: string, expectedTeam: string): boolean {
  const apiKeys = aliasKeysFor(apiName);
  const expectedKeys = aliasKeysFor(expectedTeam);

  for (const api of apiKeys) {
    for (const expected of expectedKeys) {
      if (api === expected || api.includes(expected) || expected.includes(api)) {
        return true;
      }
    }
  }
  return false;
}
