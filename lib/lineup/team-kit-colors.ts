import { toSlug } from "@/lib/openfootball/slug";

export type TeamKitColors = {
  /** Color predominante de la camiseta titular. */
  kit: string;
  /** Color del número con contraste legible sobre `kit`. */
  dorsal: string;
  /** Contorno sutil del círculo del dorsal. */
  border: string;
};

/** Color principal de camiseta local aproximado (WC 2026 / convocatoria actual). */
const TEAM_KIT_HEX_BY_SLUG: Record<string, string> = {
  algeria: "#006233",
  argentina: "#6CB4EE",
  australia: "#FFCD00",
  austria: "#ED2939",
  belgium: "#E30613",
  "bosnia-and-herzegovina": "#002395",
  brazil: "#FFE900",
  canada: "#D80621",
  "cape-verde": "#003893",
  colombia: "#FCD116",
  croatia: "#C8102E",
  curacao: "#002B7F",
  "czech-republic": "#D7141A",
  "dr-congo": "#007FFF",
  ecuador: "#FFD100",
  egypt: "#CE1126",
  england: "#FFFFFF",
  france: "#002395",
  germany: "#FFFFFF",
  ghana: "#FDB913",
  haiti: "#00209F",
  iran: "#239F40",
  iraq: "#017B4B",
  "ivory-coast": "#F77F00",
  japan: "#003087",
  jordan: "#CE1126",
  mexico: "#006847",
  morocco: "#C1272D",
  netherlands: "#FF6600",
  "new-zealand": "#FFFFFF",
  norway: "#BA0C2F",
  panama: "#DA121A",
  paraguay: "#0038A8",
  portugal: "#DA020E",
  qatar: "#8A1538",
  "saudi-arabia": "#006C35",
  scotland: "#003876",
  senegal: "#00853F",
  "south-africa": "#008751",
  "south-korea": "#CD2E3A",
  spain: "#C60B1E",
  sweden: "#FECC00",
  switzerland: "#DA291C",
  tunisia: "#E70013",
  turkey: "#E30A17",
  usa: "#002868",
  uruguay: "#5B9BD5",
  uzbekistan: "#0099B5",
};

const DEFAULT_KIT = "#2A1058";

function parseHex(hex: string): { r: number; g: number; b: number } {
  const normalized = hex.replace("#", "");
  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
  };
}

function relativeLuminance(r: number, g: number, b: number): number {
  const channel = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrastingTextColor(bgHex: string): string {
  const { r, g, b } = parseHex(bgHex);
  return relativeLuminance(r, g, b) > 0.45 ? "#111111" : "#FFFFFF";
}

function contrastingBorderColor(bgHex: string): string {
  const { r, g, b } = parseHex(bgHex);
  return relativeLuminance(r, g, b) > 0.45 ? "rgba(0,0,0,0.28)" : "rgba(255,255,255,0.38)";
}

export function getTeamKitHex(teamName: string): string {
  return TEAM_KIT_HEX_BY_SLUG[toSlug(teamName)] ?? DEFAULT_KIT;
}

export function teamKitColorsClash(homeTeam: string, awayTeam: string): boolean {
  return getTeamKitHex(homeTeam).toUpperCase() === getTeamKitHex(awayTeam).toUpperCase();
}

export function getTeamKitColors(teamName: string): TeamKitColors {
  const kit = getTeamKitHex(teamName);
  return {
    kit,
    dorsal: contrastingTextColor(kit),
    border: contrastingBorderColor(kit),
  };
}
