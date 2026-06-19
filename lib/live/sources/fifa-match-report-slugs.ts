import { openFootballTeamName } from "@/lib/worldcup2026/squad-team-names";

/** Slug primario por equipo para crónicas FIFA.com (inglés). */
const FIFA_ARTICLE_SLUG_OVERRIDES: Record<string, string> = {
  "South Korea": "korea-republic",
  "Czech Republic": "czechia",
  "Bosnia & Herzegovina": "bosnia-and-herzegovina",
  "Ivory Coast": "cote-d-ivoire",
  "DR Congo": "dr-congo",
  "Cape Verde": "cape-verde",
  Iran: "ir-iran",
  Turkey: "turkiye",
  USA: "usa",
};

/** Variantes observadas en fifa.com (p. ej. Bosnia usa slug distinto según rival). */
const FIFA_ARTICLE_SLUG_EXTRA_VARIANTS: Record<string, string[]> = {
  "Bosnia & Herzegovina": ["bosnia-herzegovina"],
};

const FIFA_MATCH_REPORT_SUFFIXES = [
  "-highlights-match-report",
  "-match-report-highlights",
] as const;

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

/** Todas las variantes de slug conocidas para un equipo (primaria primero). */
export function fifaArticleSlugVariantsForTeam(teamName: string): string[] {
  const canonical = openFootballTeamName(teamName);
  const primary = fifaArticleSlugForTeam(teamName);
  const extras = FIFA_ARTICLE_SLUG_EXTRA_VARIANTS[canonical] ?? [];
  return [...new Set([primary, ...extras])];
}

/** Slug `{home}-{away}` sin sufijo de crónica. */
export function buildFifaMatchReportArticleSlug(homeTeam: string, awayTeam: string): string {
  return `${fifaArticleSlugForTeam(homeTeam)}-${fifaArticleSlugForTeam(awayTeam)}`;
}

export const FIFA_WC2026_MATCH_REPORT_ARTICLE_PREFIX =
  "/en/tournaments/mens/worldcup/canadamexicousa2026/articles";

export function buildFifaMatchReportArticlePath(homeTeam: string, awayTeam: string): string {
  return `${FIFA_WC2026_MATCH_REPORT_ARTICLE_PREFIX}/${buildFifaMatchReportArticleSlug(homeTeam, awayTeam)}${FIFA_MATCH_REPORT_SUFFIXES[0]}`;
}

/** Rutas candidatas: variantes de slug por equipo × sufijos FIFA observados. */
export function buildFifaMatchReportArticlePathCandidates(
  homeTeam: string,
  awayTeam: string,
): string[] {
  const homeVariants = fifaArticleSlugVariantsForTeam(homeTeam);
  const awayVariants = fifaArticleSlugVariantsForTeam(awayTeam);
  const primary = buildFifaMatchReportArticlePath(homeTeam, awayTeam);

  const paths = new Set<string>([primary]);

  for (const home of homeVariants) {
    for (const away of awayVariants) {
      for (const suffix of FIFA_MATCH_REPORT_SUFFIXES) {
        paths.add(`${FIFA_WC2026_MATCH_REPORT_ARTICLE_PREFIX}/${home}-${away}${suffix}`);
      }
    }
  }

  return [...paths];
}
