import { toSlug } from "@/lib/openfootball/slug";

/** Códigos flagcdn (ISO-3166 o subdivisiones UK) por slug de equipo OpenFootball. */
const FLAG_CODE_BY_TEAM_SLUG: Record<string, string> = {
  algeria: "dz",
  argentina: "ar",
  australia: "au",
  austria: "at",
  belgium: "be",
  "bosnia-and-herzegovina": "ba",
  brazil: "br",
  canada: "ca",
  "cape-verde": "cv",
  colombia: "co",
  croatia: "hr",
  curacao: "cw",
  "czech-republic": "cz",
  "dr-congo": "cd",
  ecuador: "ec",
  egypt: "eg",
  england: "gb-eng",
  france: "fr",
  germany: "de",
  ghana: "gh",
  haiti: "ht",
  iran: "ir",
  iraq: "iq",
  "ivory-coast": "ci",
  japan: "jp",
  jordan: "jo",
  mexico: "mx",
  morocco: "ma",
  netherlands: "nl",
  "new-zealand": "nz",
  norway: "no",
  panama: "pa",
  paraguay: "py",
  portugal: "pt",
  qatar: "qa",
  "saudi-arabia": "sa",
  scotland: "gb-sct",
  senegal: "sn",
  "south-africa": "za",
  "south-korea": "kr",
  spain: "es",
  sweden: "se",
  switzerland: "ch",
  tunisia: "tn",
  turkey: "tr",
  usa: "us",
  uruguay: "uy",
  uzbekistan: "uz",
};

export function teamFlagCode(teamName: string): string | null {
  return FLAG_CODE_BY_TEAM_SLUG[toSlug(teamName)] ?? null;
}

/** Anchos soportados por flagcdn.com (otros devuelven 404). */
const FLAGCDN_WIDTHS = [20, 40, 80, 160, 320, 640] as const;

/** Ajusta al ancho flagcdn más cercano para evitar URLs rotas (p. ej. w240 → w320). */
export function nearestFlagcdnWidth(requested: number): number {
  return FLAGCDN_WIDTHS.reduce((best, candidate) =>
    Math.abs(candidate - requested) < Math.abs(best - requested) ? candidate : best
  );
}

export function teamFlagUrl(flagCode: string, width = 80): string {
  const w = nearestFlagcdnWidth(width);
  return `https://flagcdn.com/w${w}/${flagCode}.png`;
}
