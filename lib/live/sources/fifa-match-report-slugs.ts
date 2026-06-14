import { openFootballTeamName } from "@/lib/worldcup2026/squad-team-names";

/** Slugs usados en fifa.com/.../articles/{home}-{away}-highlights-match-report */
const FIFA_ARTICLE_SLUG_OVERRIDES: Record<string, string> = {
  "South Korea": "korea-republic",
  "Czech Republic": "czechia",
  "Bosnia & Herzegovina": "bosnia-and-herzegovina",
  "Ivory Coast": "cote-divoire",
  "DR Congo": "dr-congo",
  "Cape Verde": "cape-verde",
  "Iran": "ir-iran",
  Turkey: "turkiye",
  USA: "usa",
};

function defaultTeamSlug(name: string): string {
  return openFootballTeamName(name)
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Slug de equipo para la URL de crónica FIFA.com (inglés). */
export function fifaArticleSlugForTeam(teamName: string): string {
  const canonical = openFootballTeamName(teamName);
  return FIFA_ARTICLE_SLUG_OVERRIDES[canonical] ?? defaultTeamSlug(canonical);
}

/** Slug `{home}-{away}` sin sufijo `-highlights-match-report`. */
export function buildFifaMatchReportArticleSlug(homeTeam: string, awayTeam: string): string {
  return `${fifaArticleSlugForTeam(homeTeam)}-${fifaArticleSlugForTeam(awayTeam)}`;
}

export const FIFA_WC2026_MATCH_REPORT_ARTICLE_PREFIX =
  "/en/tournaments/mens/worldcup/canadamexicousa2026/articles";

export function buildFifaMatchReportArticlePath(homeTeam: string, awayTeam: string): string {
  return `${FIFA_WC2026_MATCH_REPORT_ARTICLE_PREFIX}/${buildFifaMatchReportArticleSlug(homeTeam, awayTeam)}-highlights-match-report`;
}
