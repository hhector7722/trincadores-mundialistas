import { WC2026_GROUP_CODES, WC2026_GROUP_SEEDS } from "@/lib/openfootball/wc2026-groups";
import { teamNameEs } from "@/lib/teams/display";

export function getAllWorldCupTeamsAlphabetically(): string[] {
  const teams = new Set<string>();
  for (const code of WC2026_GROUP_CODES) {
    for (const team of WC2026_GROUP_SEEDS[code] ?? []) {
      teams.add(team);
    }
  }
  return [...teams].sort((a, b) =>
    teamNameEs(a).localeCompare(teamNameEs(b), "es", { sensitivity: "base" })
  );
}
