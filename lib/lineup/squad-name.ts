import { toSlug } from "@/lib/openfootball/slug";

/** Alias slug → nombre en DB Fjelstul (inglés FIFA). */
const SQUAD_DB_NAME_BY_SLUG: Record<string, string> = {
  usa: "United States",
  "south-korea": "Korea Republic",
  "czech-republic": "Czech Republic",
  "ivory-coast": "Ivory Coast",
  "dr-congo": "DR Congo",
  "bosnia-and-herzegovina": "Bosnia and Herzegovina",
  "saudi-arabia": "Saudi Arabia",
  "new-zealand": "New Zealand",
  "south-africa": "South Africa",
  "cape-verde": "Cape Verde",
};

/** Convierte slug de ruta a nombre consultable en team_squads. */
export function squadTeamNameFromSlug(slug: string): string {
  const normalized = slug.trim().toLowerCase();
  if (SQUAD_DB_NAME_BY_SLUG[normalized]) {
    return SQUAD_DB_NAME_BY_SLUG[normalized];
  }
  return normalized
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function squadSlugFromTeamName(teamName: string): string {
  return toSlug(teamName);
}
