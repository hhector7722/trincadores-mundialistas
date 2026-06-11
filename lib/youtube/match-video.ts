import { toSlug } from "@/lib/openfootball/slug";
import { teamAbbr } from "@/lib/teams/display";
import type { YoutubeHighlightMatchCandidate } from "@/lib/youtube/types";

const HIGHLIGHT_TITLE_KEYWORDS = [
  "extended highlights",
  "match highlights",
  "highlights",
] as const;

const EXCLUDED_TITLE_KEYWORDS = [
  "full match",
  "press conference",
  "draw",
  "trophy tour",
  "behind the scenes",
  "podcast",
  "interview",
] as const;

export function isFifaHighlightTitle(title: string): boolean {
  const lower = title.toLowerCase();
  if (!lower.includes("world cup") && !lower.includes("fifa")) return false;
  if (EXCLUDED_TITLE_KEYWORDS.some((word) => lower.includes(word))) return false;
  return HIGHLIGHT_TITLE_KEYWORDS.some((word) => lower.includes(word));
}

export function parseTeamsFromHighlightTitle(title: string): { home: string; away: string } | null {
  const head = title.split("|")[0]?.trim() ?? title.trim();
  const match = head.match(/^(.+?)\s+v\s+(.+)$/i);
  if (!match) return null;

  const home = match[1]?.trim() ?? "";
  const away = match[2]?.trim() ?? "";
  if (!home || !away) return null;

  return { home, away };
}

function normalizeLabel(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export type TeamAliasIndex = Map<string, string>;

/** Índice etiqueta → nombre OpenFootball (`matches.home_team`). */
export function buildTeamAliasIndex(teamNames: string[]): TeamAliasIndex {
  const index = new Map<string, string>();

  for (const name of teamNames) {
    const trimmed = name.trim();
    if (!trimmed) continue;

    const slug = toSlug(trimmed);
    index.set(normalizeLabel(trimmed), trimmed);
    index.set(normalizeLabel(slug.replace(/-/g, " ")), trimmed);
    index.set(normalizeLabel(teamAbbr(trimmed)), trimmed);

    if (slug === "usa") {
      index.set("united states", trimmed);
      index.set("u.s.a.", trimmed);
    }
    if (slug === "south-korea") {
      index.set("korea republic", trimmed);
      index.set("republic of korea", trimmed);
    }
    if (slug === "ivory-coast") {
      index.set("cote d'ivoire", trimmed);
      index.set("côte d'ivoire", trimmed);
    }
    if (slug === "dr-congo") {
      index.set("congo dr", trimmed);
    }
  }

  return index;
}

export function resolveTeamLabel(label: string, index: TeamAliasIndex): string | null {
  const direct = index.get(normalizeLabel(label));
  if (direct) return direct;

  const withoutSuffix = label.replace(/\s+(fc|national team)$/i, "").trim();
  return index.get(normalizeLabel(withoutSuffix)) ?? null;
}

const MATCH_WINDOW_BEFORE_MS = 6 * 60 * 60 * 1000;
const MATCH_WINDOW_AFTER_MS = 72 * 60 * 60 * 1000;

export function pickMatchForHighlightVideo(
  homeLabel: string,
  awayLabel: string,
  publishedAt: string,
  candidates: YoutubeHighlightMatchCandidate[],
  index: TeamAliasIndex,
): YoutubeHighlightMatchCandidate | null {
  const homeTeam = resolveTeamLabel(homeLabel, index);
  const awayTeam = resolveTeamLabel(awayLabel, index);
  if (!homeTeam || !awayTeam) return null;

  const publishedMs = new Date(publishedAt).getTime();
  if (!Number.isFinite(publishedMs)) return null;

  const hits = candidates.filter((candidate) => {
    const direct =
      candidate.homeTeam === homeTeam && candidate.awayTeam === awayTeam;
    const swapped =
      candidate.homeTeam === awayTeam && candidate.awayTeam === homeTeam;
    if (!direct && !swapped) return false;

    const kickoffMs = new Date(candidate.kickoffAt).getTime();
    if (!Number.isFinite(kickoffMs)) return false;

    const delta = publishedMs - kickoffMs;
    return delta >= -MATCH_WINDOW_BEFORE_MS && delta <= MATCH_WINDOW_AFTER_MS;
  });

  if (!hits.length) return null;
  if (hits.length === 1) return hits[0]!;

  return hits.sort((a, b) => {
    const aDelta = Math.abs(publishedMs - new Date(a.kickoffAt).getTime());
    const bDelta = Math.abs(publishedMs - new Date(b.kickoffAt).getTime());
    return aDelta - bDelta;
  })[0]!;
}
