import type { MatchWithPrediction } from "@/lib/predictions/queries";

export type BracketRoundKey = "r32" | "r16" | "qf" | "sf" | "final" | "third";

export type BracketTreeSlot = {
  side: "left" | "right" | "center";
  round: BracketRoundKey;
  matchNumber: number;
  column: number;
  rowStart: number;
  rowSpan: number;
  horizontal?: boolean;
};

/** Cuadro simétrico WC2026: bordes → centro (16 filas × 9 columnas). */
export const BRACKET_TREE_LAYOUT: BracketTreeSlot[] = [
  // Izq — dieciseisavos
  { side: "left", round: "r32", matchNumber: 73, column: 0, rowStart: 1, rowSpan: 2 },
  { side: "left", round: "r32", matchNumber: 75, column: 0, rowStart: 3, rowSpan: 2 },
  { side: "left", round: "r32", matchNumber: 74, column: 0, rowStart: 5, rowSpan: 2 },
  { side: "left", round: "r32", matchNumber: 77, column: 0, rowStart: 7, rowSpan: 2 },
  { side: "left", round: "r32", matchNumber: 83, column: 0, rowStart: 9, rowSpan: 2 },
  { side: "left", round: "r32", matchNumber: 84, column: 0, rowStart: 11, rowSpan: 2 },
  { side: "left", round: "r32", matchNumber: 81, column: 0, rowStart: 13, rowSpan: 2 },
  { side: "left", round: "r32", matchNumber: 82, column: 0, rowStart: 15, rowSpan: 2 },
  // Izq — octavos
  { side: "left", round: "r16", matchNumber: 90, column: 1, rowStart: 1, rowSpan: 4 },
  { side: "left", round: "r16", matchNumber: 89, column: 1, rowStart: 5, rowSpan: 4 },
  { side: "left", round: "r16", matchNumber: 93, column: 1, rowStart: 9, rowSpan: 4 },
  { side: "left", round: "r16", matchNumber: 94, column: 1, rowStart: 13, rowSpan: 4 },
  // Izq — cuartos
  { side: "left", round: "qf", matchNumber: 97, column: 2, rowStart: 1, rowSpan: 8 },
  { side: "left", round: "qf", matchNumber: 98, column: 2, rowStart: 9, rowSpan: 8 },
  // Izq — semifinal
  { side: "left", round: "sf", matchNumber: 101, column: 3, rowStart: 1, rowSpan: 16 },
  // Final
  {
    side: "center",
    round: "final",
    matchNumber: 104,
    column: 4,
    rowStart: 1,
    rowSpan: 16,
    horizontal: true,
  },
  // Der — semifinal
  { side: "right", round: "sf", matchNumber: 102, column: 5, rowStart: 1, rowSpan: 16 },
  // Der — cuartos
  { side: "right", round: "qf", matchNumber: 99, column: 6, rowStart: 1, rowSpan: 8 },
  { side: "right", round: "qf", matchNumber: 100, column: 6, rowStart: 9, rowSpan: 8 },
  // Der — octavos
  { side: "right", round: "r16", matchNumber: 91, column: 7, rowStart: 1, rowSpan: 4 },
  { side: "right", round: "r16", matchNumber: 92, column: 7, rowStart: 5, rowSpan: 4 },
  { side: "right", round: "r16", matchNumber: 95, column: 7, rowStart: 9, rowSpan: 4 },
  { side: "right", round: "r16", matchNumber: 96, column: 7, rowStart: 13, rowSpan: 4 },
  // Der — dieciseisavos
  { side: "right", round: "r32", matchNumber: 76, column: 8, rowStart: 1, rowSpan: 2 },
  { side: "right", round: "r32", matchNumber: 78, column: 8, rowStart: 3, rowSpan: 2 },
  { side: "right", round: "r32", matchNumber: 79, column: 8, rowStart: 5, rowSpan: 2 },
  { side: "right", round: "r32", matchNumber: 80, column: 8, rowStart: 7, rowSpan: 2 },
  { side: "right", round: "r32", matchNumber: 85, column: 8, rowStart: 9, rowSpan: 2 },
  { side: "right", round: "r32", matchNumber: 86, column: 8, rowStart: 11, rowSpan: 2 },
  { side: "right", round: "r32", matchNumber: 87, column: 8, rowStart: 13, rowSpan: 2 },
  { side: "right", round: "r32", matchNumber: 88, column: 8, rowStart: 15, rowSpan: 2 },
];

export const BRACKET_THIRD_PLACE: BracketTreeSlot = {
  side: "center",
  round: "third",
  matchNumber: 103,
  column: 4,
  rowStart: 1,
  rowSpan: 1,
  horizontal: true,
};

const MATCH_NUMBER_BY_PAIR: Record<number, { home: string; away: string }> = {
  73: { home: "2A", away: "2B" },
  74: { home: "1E", away: "3A/B/C/D/F" },
  75: { home: "1F", away: "2C" },
  76: { home: "1C", away: "2F" },
  77: { home: "1I", away: "3C/D/F/G/H" },
  78: { home: "2E", away: "2I" },
  79: { home: "1A", away: "3C/E/F/H/I" },
  80: { home: "1L", away: "3E/H/I/J/K" },
  81: { home: "1D", away: "3B/E/F/I/J" },
  82: { home: "1G", away: "3A/E/H/I/J" },
  83: { home: "2K", away: "2L" },
  84: { home: "1H", away: "2J" },
  85: { home: "1B", away: "3E/F/G/I/J" },
  86: { home: "1J", away: "2H" },
  87: { home: "1K", away: "3D/E/I/J/L" },
  88: { home: "2D", away: "2G" },
  89: { home: "W74", away: "W77" },
  90: { home: "W73", away: "W75" },
  91: { home: "W76", away: "W78" },
  92: { home: "W79", away: "W80" },
  93: { home: "W83", away: "W84" },
  94: { home: "W81", away: "W82" },
  95: { home: "W86", away: "W88" },
  96: { home: "W85", away: "W87" },
  97: { home: "W89", away: "W90" },
  98: { home: "W93", away: "W94" },
  99: { home: "W91", away: "W92" },
  100: { home: "W95", away: "W96" },
  101: { home: "W97", away: "W98" },
  102: { home: "W99", away: "W100" },
  103: { home: "L101", away: "L102" },
  104: { home: "W101", away: "W102" },
};

function normalizeTeam(value: string): string {
  return value.trim().toUpperCase();
}

function pairKey(home: string, away: string): string {
  return `${normalizeTeam(home)}|${normalizeTeam(away)}`;
}

function extractMatchNumber(match: MatchWithPrediction): number | null {
  if (match.match_number != null && match.match_number >= 73) {
    return match.match_number;
  }

  const externalId = match.external_match_id;
  if (externalId) {
    const parsed = Number(externalId.replace(/^WC2026-M/i, ""));
    if (Number.isFinite(parsed) && parsed >= 73) return parsed;
  }

  return null;
}

export function buildKnockoutMatchMap(
  matches: MatchWithPrediction[]
): Map<number, MatchWithPrediction> {
  const byNumber = new Map<number, MatchWithPrediction>();
  const byPair = new Map<string, MatchWithPrediction>();

  for (const match of matches) {
    byPair.set(pairKey(match.home_team, match.away_team), match);
    const number = extractMatchNumber(match);
    if (number != null) byNumber.set(number, match);
  }

  for (const [number, pair] of Object.entries(MATCH_NUMBER_BY_PAIR)) {
    const matchNumber = Number(number);
    if (byNumber.has(matchNumber)) continue;

    const direct = byPair.get(pairKey(pair.home, pair.away));
    if (direct) byNumber.set(matchNumber, direct);
  }

  return byNumber;
}

export function resolveBracketMatch(
  matchMap: Map<number, MatchWithPrediction>,
  matchNumber: number
): MatchWithPrediction | null {
  return matchMap.get(matchNumber) ?? null;
}

export function placeholderPairForMatchNumber(matchNumber: number): {
  home: string;
  away: string;
} | null {
  return MATCH_NUMBER_BY_PAIR[matchNumber] ?? null;
}
