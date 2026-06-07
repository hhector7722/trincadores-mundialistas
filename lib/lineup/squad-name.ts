import { toSlug } from "@/lib/openfootball/slug";
import { openFootballTeamName } from "@/lib/worldcup2026/squad-team-names";

/** Alias slug → nombre OpenFootball (matches / plantillas 2026). */
const SQUAD_DB_NAME_BY_SLUG: Record<string, string> = {
  usa: "USA",
  "south-korea": "South Korea",
  "czech-republic": "Czech Republic",
  "ivory-coast": "Ivory Coast",
  "dr-congo": "DR Congo",
  "bosnia-and-herzegovina": "Bosnia & Herzegovina",
  "saudi-arabia": "Saudi Arabia",
  "new-zealand": "New Zealand",
  "south-africa": "South Africa",
  "cape-verde": "Cape Verde",
  curacao: "Curaçao",
};

/** Convierte slug de ruta a nombre consultable en team_squads. */
export function squadTeamNameFromSlug(slug: string): string {
  const normalized = slug.trim().toLowerCase();
  if (SQUAD_DB_NAME_BY_SLUG[normalized]) {
    return SQUAD_DB_NAME_BY_SLUG[normalized];
  }
  const titleCased = normalized
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
  return openFootballTeamName(titleCased);
}

export function squadSlugFromTeamName(teamName: string): string {
  return toSlug(teamName);
}
