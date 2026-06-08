import type { MatchWithPrediction } from "@/lib/predictions/queries";

export type BracketRoundKey = "r32" | "r16" | "qf" | "sf" | "final";

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
