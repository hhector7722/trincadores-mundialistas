import { buildKickoffIso, parseDateKey } from "./kickoff";
import {
  calendarMatchdayKey,
  groupMatchId,
  groupStageKey,
  isPlaceholderTeam,
  teamExternalKey,
} from "./slug";
import type {
  ParsedCalendarMatchday,
  ParsedMatch,
  ParsedStage,
  ParsedTeam,
  ParseFootballTxtResult,
} from "./types";

const GROUP_LINE = /^Group\s+([A-L])\s*\|\s*(.+)$/i;
const MATCHDAY_LINE = /^▪\s*Matchday\s+(\d+)\s*\|/i;
const GROUP_SECTION = /^▪\s*Group\s+([A-L])\s*$/i;
const FIFA_NOTE = /^##\s+(.+?)\s*=>\s*(.+)$/i;

type ScoreParse = { homeGoals: number | null; awayGoals: number | null };

function parseScore(tail: string): ScoreParse {
  const m = tail.match(/(\d+)-(\d+)/);
  if (!m) return { homeGoals: null, awayGoals: null };
  return { homeGoals: Number(m[1]), awayGoals: Number(m[2]) };
}

function parseGroupMatchLine(
  line: string,
  ctx: {
    groupCode: string;
    dateKey: string;
    matchdayNumber: number;
    sortOrderInGroup: number;
  }
): ParsedMatch | null {
  const m = line.match(
    /^\s*(\d{2}:\d{2})\s+(UTC[+-]\d+)\s+(.+?)\s+v\s+(.+?)\s+@\s+(.+?)\s*$/i
  );
  if (!m) return null;

  const homeRaw = m[3].trim();
  const awayRaw = m[4].trim();
  const score = parseScore(`${homeRaw} ${awayRaw}`);
  const homeName = homeRaw.replace(/\s+\d+-\d+.*$/, "").trim();
  const awayName = awayRaw.replace(/\s+\d+-\d+.*$/, "").trim();

  const homeKey = isPlaceholderTeam(homeName) ? null : teamExternalKey(homeName);
  const awayKey = isPlaceholderTeam(awayName) ? null : teamExternalKey(awayName);

  return {
    externalMatchId: groupMatchId(ctx.groupCode, ctx.sortOrderInGroup),
    matchNumber: null,
    groupCode: ctx.groupCode,
    stageExternalKey: groupStageKey(ctx.groupCode),
    matchdayExternalKey: calendarMatchdayKey(ctx.matchdayNumber),
    homeTeam: homeName,
    awayTeam: awayName,
    homeTeamKey: homeKey,
    awayTeamKey: awayKey,
    kickoffIso: buildKickoffIso(ctx.dateKey, m[1], m[2]),
    venueCity: m[5].trim(),
    homeGoals: score.homeGoals,
    awayGoals: score.awayGoals,
    sortOrder: ctx.sortOrderInGroup,
  };
}

export function parseCupTxt(content: string, year = 2026): ParseFootballTxtResult {
  const teams: ParsedTeam[] = [];
  const stages: ParsedStage[] = [];
  const calendarMatchdays: ParsedCalendarMatchday[] = [];
  const groupMatches: ParsedMatch[] = [];
  const fifaNameNotes: Record<string, string> = {};
  const dateToMatchday = new Map<string, number>();

  let competitionName = "World Cup 2026";
  let competitionYear = year;
  let currentGroup: string | null = null;
  let currentDateKey: string | null = null;
  let groupMatchCounter = 0;

  const header = content.match(/^=\s*(.+?)\s*=/m);
  if (header) {
    competitionName = header[1].replace(/#.*$/, "").trim();
    const y = competitionName.match(/\b(20\d{2})\b/);
    if (y) competitionYear = Number(y[1]);
  }

  for (const rawLine of content.split(/\r?\n/)) {
    const trimmed = rawLine.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const fifa = trimmed.match(FIFA_NOTE);
    if (fifa) {
      fifaNameNotes[fifa[1].trim()] = fifa[2].trim();
      continue;
    }

    const groupDef = trimmed.match(GROUP_LINE);
    if (groupDef) {
      const groupCode = groupDef[1].toUpperCase();
      const names = groupDef[2].trim().split(/\s{2,}|\t+/).filter(Boolean);
      for (const name of names) {
        teams.push({
          externalKey: teamExternalKey(name),
          name,
          fifaName: fifaNameNotes[name] ?? null,
          groupCode,
        });
      }
      if (!stages.some((s) => s.externalKey === groupStageKey(groupCode))) {
        stages.push({
          externalKey: groupStageKey(groupCode),
          stageType: "group",
          name: `Group ${groupCode}`,
          sequence: groupCode.charCodeAt(0) - 64,
          groupCode,
        });
      }
      continue;
    }

    const md = trimmed.match(MATCHDAY_LINE);
    if (md) {
      const number = Number(md[1]);
      const dateKey = parseDateKey(trimmed, competitionYear);
      if (dateKey) dateToMatchday.set(dateKey, number);
      calendarMatchdays.push({
        number,
        label: `Matchday ${number}`,
        dateKey: dateKey ?? "",
      });
      if (!stages.some((s) => s.externalKey === calendarMatchdayKey(number))) {
        stages.push({
          externalKey: calendarMatchdayKey(number),
          stageType: "matchday",
          name: `Matchday ${number}`,
          sequence: number,
          groupCode: null,
        });
      }
      continue;
    }

    const groupSection = trimmed.match(GROUP_SECTION);
    if (groupSection) {
      currentGroup = groupSection[1].toUpperCase();
      groupMatchCounter = 0;
      continue;
    }

    const dateKey = parseDateKey(trimmed, competitionYear);
    if (dateKey) {
      currentDateKey = dateKey;
      continue;
    }

    if (!currentGroup || !currentDateKey) continue;

    const matchdayNumber = dateToMatchday.get(currentDateKey);
    if (!matchdayNumber) {
      throw new Error(`Fecha sin matchday calendario: ${currentDateKey}`);
    }

    const match = parseGroupMatchLine(rawLine, {
      groupCode: currentGroup,
      dateKey: currentDateKey,
      matchdayNumber,
      sortOrderInGroup: ++groupMatchCounter,
    });
    if (match) groupMatches.push(match);
  }

  for (const team of teams) {
    if (!team.fifaName && fifaNameNotes[team.name]) {
      team.fifaName = fifaNameNotes[team.name];
    }
  }

  return {
    competitionName,
    competitionYear,
    teams,
    stages,
    calendarMatchdays,
    groupMatches,
    fifaNameNotes,
  };
}
