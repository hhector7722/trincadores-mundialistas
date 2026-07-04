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
  "south-africa": "#FECC00",
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

let dbKitHexBySlug: Record<string, string> | null = null;

const MANUAL_DORSAL_COLORS: Record<string, string> = {
  norway: "#FFFFFF",
  france: "#FFFFFF",
  mexico: "#FFFFFF",
  morocco: "#FFFFFF",
  switzerland: "#FFFFFF",
  canada: "#FFFFFF",
  egypt: "#FFFFFF",
  spain: "#FFCD00", // amarillo
  brazil: "#008000", // verde
  argentina: "#000000", // negro
  colombia: "#0000FF", // azul
  paraguay: "#0000FF", // azul
  england: "#FF0000", // rojo
  belgium: "#FFCD00", // amarillo
  usa: "#000000", // negro
  portugal: "#FFFFFF", // blanco
};

/** Sincroniza colores de camiseta cargados desde `teams.primary_kit_hex`. */
export function setTeamKitHexFromDb(map: Record<string, string>) {
  dbKitHexBySlug = map;
}

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
  const slug = toSlug(teamName);
  return dbKitHexBySlug?.[slug] ?? TEAM_KIT_HEX_BY_SLUG[slug] ?? DEFAULT_KIT;
}

/** Delta E por debajo de este umbral = camisetas confundibles en el campo MVP. */
const KIT_CLASH_DELTA_E_THRESHOLD = 18;

function rgbToXyz(r: number, g: number, b: number): [number, number, number] {
  const linear = (c: number) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  const rs = linear(r);
  const gs = linear(g);
  const bs = linear(b);
  return [
    (rs * 0.4124564 + gs * 0.3575761 + bs * 0.1804375) * 100,
    (rs * 0.2126729 + gs * 0.7151522 + bs * 0.072175) * 100,
    (rs * 0.0193339 + gs * 0.119192 + bs * 0.9503041) * 100,
  ];
}

function xyzToLab(x: number, y: number, z: number): [number, number, number] {
  const f = (t: number) => (t > 0.008856 ? t ** (1 / 3) : 7.787 * t + 16 / 116);
  const fx = f(x / 95.047);
  const fy = f(y / 100);
  const fz = f(z / 108.883);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

function hexToLab(hex: string): [number, number, number] {
  const { r, g, b } = parseHex(hex);
  return xyzToLab(...rgbToXyz(r, g, b));
}

function kitColorDeltaE(hex1: string, hex2: string): number {
  const [l1, a1, b1] = hexToLab(hex1);
  const [l2, a2, b2] = hexToLab(hex2);
  return Math.sqrt((l1 - l2) ** 2 + (a1 - a2) ** 2 + (b1 - b2) ** 2);
}

export function teamKitColorsClash(homeTeam: string, awayTeam: string): boolean {
  const home = getTeamKitHex(homeTeam);
  const away = getTeamKitHex(awayTeam);
  if (home.toUpperCase() === away.toUpperCase()) return true;
  return kitColorDeltaE(home, away) < KIT_CLASH_DELTA_E_THRESHOLD;
}

export function getTeamKitColors(teamName: string): TeamKitColors {
  const slug = toSlug(teamName);
  const kit = getTeamKitHex(teamName);
  return {
    kit,
    dorsal: MANUAL_DORSAL_COLORS[slug] ?? contrastingTextColor(kit),
    border: contrastingBorderColor(kit),
  };
}
