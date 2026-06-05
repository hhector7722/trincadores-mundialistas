import { buildKickoffIso, parseDateKey } from "./kickoff";
import {
  calendarMatchdayKey,
  isPlaceholderTeam,
  knockoutMatchId,
  teamExternalKey,
} from "./slug";
import type { ParsedMatch, ParsedStage, ParseCupFinalsResult } from "./types";

const KNOCKOUT_SECTIONS: Array<{
  pattern: RegExp;
  slug: string;
  name: string;
  sequence: number;
}> = [
  { pattern: /^▪\s*Round of 32/i, slug: "round-of-32", name: "Round of 32", sequence: 18 },
  { pattern: /^▪\s*Round of 16/i, slug: "round-of-16", name: "Round of 16", sequence: 19 },
  { pattern: /^▪\s*Quarter-final/i, slug: "quarter-final", name: "Quarter-final", sequence: 20 },
  { pattern: /^▪\s*Semi-final/i, slug: "semi-final", name: "Semi-final", sequence: 21 },
  {
    pattern: /^▪\s*Match for third place/i,
    slug: "third-place",
    name: "Match for third place",
    sequence: 22,
  },
  { pattern: /^▪\s*Final\s*$/i, slug: "final", name: "Final", sequence: 23 },
];

function parseKnockoutLine(
  line: string,
  ctx: { roundSlug: string; dateKey: string; sortOrder: number }
): ParsedMatch | null {
  const m = line.match(
    /^\s*\((\d+)\)\s+(\d{2}:\d{2})\s+(UTC[+-]\d+)\s+(.+?)\s+v\s+(.+?)\s+@\s+(.+?)\s*$/i
  );
  if (!m) return null;

  const homeName = m[4].trim();
  const awayName = m[5].trim();
  const matchNumber = Number(m[1]);

  return {
    externalMatchId: knockoutMatchId(matchNumber),
    matchNumber,
    groupCode: null,
    stageExternalKey: ctx.roundSlug,
    matchdayExternalKey: ctx.roundSlug,
    homeTeam: homeName,
    awayTeam: awayName,
    homeTeamKey: isPlaceholderTeam(homeName) ? null : teamExternalKey(homeName),
    awayTeamKey: isPlaceholderTeam(awayName) ? null : teamExternalKey(awayName),
    kickoffIso: buildKickoffIso(ctx.dateKey, m[2], m[3]),
    venueCity: m[6].trim(),
    homeGoals: null,
    awayGoals: null,
    sortOrder: ctx.sortOrder,
  };
}

export function parseCupFinalsTxt(content: string, year = 2026): ParseCupFinalsResult {
  const stages: ParsedStage[] = KNOCKOUT_SECTIONS.map((s) => ({
    externalKey: s.slug,
    stageType: "knockout",
    name: s.name,
    sequence: s.sequence,
    groupCode: null,
  }));

  const knockoutMatches: ParsedMatch[] = [];
  let currentRoundSlug: string | null = null;
  let currentDateKey: string | null = null;
  let sortInRound = 0;
  let globalSort = 1000;

  for (const rawLine of content.split(/\r?\n/)) {
    const trimmed = rawLine.trim();
    if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("=")) continue;
    if (trimmed.startsWith("##")) continue;

    const section = KNOCKOUT_SECTIONS.find((s) => s.pattern.test(trimmed));
    if (section) {
      currentRoundSlug = section.slug;
      sortInRound = 0;
      continue;
    }

    const dateKey = parseDateKey(trimmed, year);
    if (dateKey) {
      currentDateKey = dateKey;
      continue;
    }

    if (!currentRoundSlug || !currentDateKey) continue;

    const match = parseKnockoutLine(rawLine, {
      roundSlug: currentRoundSlug,
      dateKey: currentDateKey,
      sortOrder: ++sortInRound,
    });
    if (!match) continue;
    match.sortOrder = ++globalSort;
    knockoutMatches.push(match);
  }

  return { stages, knockoutMatches };
}
