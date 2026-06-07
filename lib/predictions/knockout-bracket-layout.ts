import type { MatchWithPrediction } from "@/lib/predictions/queries";

export type BracketSide = "left" | "right";

export type BracketRoundKey = "r32" | "r16" | "qf" | "sf";

export type BracketSlot = {
  side: BracketSide | "center";
  round: BracketRoundKey | "final" | "third";
  matchNumber: number;
  rowStart: number;
  rowSpan: number;
  column: number;
};

/** Orden visual del cuadro WC2026 (mitad izq / der) según cup_finals.txt. */
export const BRACKET_MATCH_LAYOUT: BracketSlot[] = [
  // Izquierda — dieciseisavos (8 partidos, 2 filas c/u)
  { side: "left", round: "r32", matchNumber: 73, rowStart: 1, rowSpan: 2, column: 0 },
  { side: "left", round: "r32", matchNumber: 75, rowStart: 3, rowSpan: 2, column: 0 },
  { side: "left", round: "r32", matchNumber: 74, rowStart: 5, rowSpan: 2, column: 0 },
  { side: "left", round: "r32", matchNumber: 77, rowStart: 7, rowSpan: 2, column: 0 },
  { side: "left", round: "r32", matchNumber: 83, rowStart: 9, rowSpan: 2, column: 0 },
  { side: "left", round: "r32", matchNumber: 84, rowStart: 11, rowSpan: 2, column: 0 },
  { side: "left", round: "r32", matchNumber: 81, rowStart: 13, rowSpan: 2, column: 0 },
  { side: "left", round: "r32", matchNumber: 82, rowStart: 15, rowSpan: 2, column: 0 },
  // Izquierda — octavos
  { side: "left", round: "r16", matchNumber: 90, rowStart: 1, rowSpan: 4, column: 1 },
  { side: "left", round: "r16", matchNumber: 89, rowStart: 5, rowSpan: 4, column: 1 },
  { side: "left", round: "r16", matchNumber: 93, rowStart: 9, rowSpan: 4, column: 1 },
  { side: "left", round: "r16", matchNumber: 94, rowStart: 13, rowSpan: 4, column: 1 },
  // Izquierda — cuartos
  { side: "left", round: "qf", matchNumber: 97, rowStart: 1, rowSpan: 8, column: 2 },
  { side: "left", round: "qf", matchNumber: 98, rowStart: 9, rowSpan: 8, column: 2 },
  // Izquierda — semifinal
  { side: "left", round: "sf", matchNumber: 101, rowStart: 1, rowSpan: 16, column: 3 },
  // Final
  { side: "center", round: "final", matchNumber: 104, rowStart: 1, rowSpan: 16, column: 4 },
  // Derecha — semifinal
  { side: "right", round: "sf", matchNumber: 102, rowStart: 1, rowSpan: 16, column: 5 },
  // Derecha — cuartos
  { side: "right", round: "qf", matchNumber: 99, rowStart: 1, rowSpan: 8, column: 6 },
  { side: "right", round: "qf", matchNumber: 100, rowStart: 9, rowSpan: 8, column: 6 },
  // Derecha — octavos
  { side: "right", round: "r16", matchNumber: 91, rowStart: 1, rowSpan: 4, column: 7 },
  { side: "right", round: "r16", matchNumber: 92, rowStart: 5, rowSpan: 4, column: 7 },
  { side: "right", round: "r16", matchNumber: 95, rowStart: 9, rowSpan: 4, column: 7 },
  { side: "right", round: "r16", matchNumber: 96, rowStart: 13, rowSpan: 4, column: 7 },
  // Derecha — dieciseisavos
  { side: "right", round: "r32", matchNumber: 76, rowStart: 1, rowSpan: 2, column: 8 },
  { side: "right", round: "r32", matchNumber: 78, rowStart: 3, rowSpan: 2, column: 8 },
  { side: "right", round: "r32", matchNumber: 79, rowStart: 5, rowSpan: 2, column: 8 },
  { side: "right", round: "r32", matchNumber: 80, rowStart: 7, rowSpan: 2, column: 8 },
  { side: "right", round: "r32", matchNumber: 85, rowStart: 9, rowSpan: 2, column: 8 },
  { side: "right", round: "r32", matchNumber: 86, rowStart: 11, rowSpan: 2, column: 8 },
  { side: "right", round: "r32", matchNumber: 87, rowStart: 13, rowSpan: 2, column: 8 },
  { side: "right", round: "r32", matchNumber: 88, rowStart: 15, rowSpan: 2, column: 8 },
];

export const BRACKET_THIRD_PLACE: BracketSlot = {
  side: "center",
  round: "third",
  matchNumber: 103,
  rowStart: 1,
  rowSpan: 1,
  column: 4,
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
