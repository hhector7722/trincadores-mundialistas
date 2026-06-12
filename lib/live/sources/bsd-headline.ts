/**
 * Titulares cortos de partido vía BSD:
 * 1) Social del evento (`/events/{id}/social/`) — frase del tweet
 * 2) Incidentes + resultado — titular compuesto en español (estilo prensa)
 */

import { shirtPlayerName } from "@/lib/lineup/short-player-name";
import { isBsdConfigured } from "@/lib/lineup/sources/bsd-client";
import { teamNameEs } from "@/lib/teams/display";

const BSD_API_BASE = "https://sports.bzzoiro.com";
const BSD_FETCH_TIMEOUT_MS = 12_000;
const MAX_HEADLINE_LENGTH = 72;

export type BsdHeadlineSource = "bsd_social" | "bsd_incidents";

export type BsdHeadline = {
  text: string;
  source: BsdHeadlineSource;
};

type BsdSocialItem = {
  type?: string;
  text?: string;
  title?: string;
  published_at?: string;
  account?: { verified?: boolean };
};

type BsdSocialResponse = {
  results?: BsdSocialItem[];
};

type BsdIncident = {
  type?: string;
  minute?: number | string | null;
  player?: string;
  player_name?: string;
  is_home?: boolean;
};

type BsdIncidentsResponse = {
  incidents?: BsdIncident[];
};

export type BsdHeadlineContext = {
  homeTeam: string;
  awayTeam: string;
  homeGoals: number;
  awayGoals: number;
};

async function bsdFetch<T>(path: string): Promise<T | null> {
  const apiKey = process.env.BSD_API_KEY?.trim();
  if (!apiKey) return null;

  try {
    const response = await fetch(`${BSD_API_BASE}${path}`, {
      headers: { Authorization: `Token ${apiKey}` },
      signal: AbortSignal.timeout(BSD_FETCH_TIMEOUT_MS),
      cache: "no-store",
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export function truncateHeadline(text: string, maxLength = MAX_HEADLINE_LENGTH): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= maxLength) return clean;
  return `${clean.slice(0, maxLength - 1).trimEnd()}…`;
}

function normalizeSocialText(raw: string): string {
  return raw
    .replace(/https?:\/\/\S+/g, "")
    .replace(/@[\w_]+/g, "")
    .replace(/#\S+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function looksLikeStatLine(text: string): boolean {
  return /\d+\s*[-–]\s*\d+/.test(text) && text.length < 40;
}

function isUsableSocialHeadline(text: string): boolean {
  if (text.length < 16 || text.length > 140) return false;
  if (/^[\W\d]+$/.test(text)) return false;
  if (looksLikeStatLine(text)) return false;
  return true;
}

export function pickHeadlineFromBsdSocial(items: BsdSocialItem[]): string | null {
  const candidates = items
    .filter((item) => item.type === "tweet")
    .map((item) => {
      const raw = item.title?.trim() || item.text?.trim() || "";
      const text = normalizeSocialText(raw);
      return {
        text,
        verified: item.account?.verified === true,
        publishedAt: item.published_at ?? "",
      };
    })
    .filter((item) => isUsableSocialHeadline(item.text));

  if (!candidates.length) return null;

  candidates.sort((a, b) => {
    if (a.verified !== b.verified) return a.verified ? -1 : 1;
    return b.publishedAt.localeCompare(a.publishedAt);
  });

  return truncateHeadline(candidates[0]!.text);
}

function goalScorerName(incident: BsdIncident): string | null {
  const name = incident.player_name?.trim() || incident.player?.trim();
  return name || null;
}

function countGoalsByScorer(incidents: BsdIncident[]): Map<string, number> {
  const counts = new Map<string, number>();

  for (const incident of incidents) {
    if (incident.type !== "goal") continue;
    const raw = goalScorerName(incident);
    if (!raw) continue;
    const label = shirtPlayerName(raw);
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }

  return counts;
}

function topScorer(counts: Map<string, number>): { name: string; goals: number } | null {
  let best: { name: string; goals: number } | null = null;

  for (const [name, goals] of counts) {
    if (!best || goals > best.goals) {
      best = { name, goals };
    }
  }

  return best;
}

export function composeHeadlineFromBsdIncidents(
  incidents: BsdIncident[],
  context: BsdHeadlineContext,
): string | null {
  const { homeTeam, awayTeam, homeGoals, awayGoals } = context;
  const homeEs = teamNameEs(homeTeam);
  const awayEs = teamNameEs(awayTeam);

  if (homeGoals === awayGoals) {
    if (homeGoals === 0) {
      return truncateHeadline(`Tablas en blanco entre ${homeEs} y ${awayEs}`);
    }
    return truncateHeadline(`Empate entre ${homeEs} y ${awayEs}`);
  }

  const homeWin = homeGoals > awayGoals;
  const winnerEs = homeWin ? homeEs : awayEs;
  const loserEs = homeWin ? awayEs : homeEs;
  const margin = Math.abs(homeGoals - awayGoals);
  const goalCounts = countGoalsByScorer(incidents);
  const star = topScorer(goalCounts);
  const scorerCount = goalCounts.size;

  if (star?.goals && star.goals >= 3) {
    return truncateHeadline(`Hat-trick de ${star.name} y victoria de ${winnerEs}`);
  }

  if (star?.goals === 2) {
    return truncateHeadline(`${star.name} firma un doblete y ${winnerEs} gana`);
  }

  if (margin >= 3) {
    return truncateHeadline(`Goleada de ${winnerEs} ante ${loserEs}`);
  }

  if (margin === 1) {
    if (star?.goals === 1 && scorerCount === 1) {
      return truncateHeadline(`${star.name} decide el triunfo ajustado de ${winnerEs}`);
    }
    return truncateHeadline(`${winnerEs} se impone por la mínima ante ${loserEs}`);
  }

  if (star?.goals === 1 && scorerCount === 1) {
    return truncateHeadline(`${star.name} impulsa la victoria de ${winnerEs}`);
  }

  return truncateHeadline(`${winnerEs} se impone con solvencia ante ${loserEs}`);
}

export async function fetchBsdHeadline(
  eventId: number,
  context: BsdHeadlineContext,
): Promise<BsdHeadline | null> {
  if (!isBsdConfigured() || !Number.isFinite(eventId)) return null;

  const [social, incidents] = await Promise.all([
    bsdFetch<BsdSocialResponse>(`/api/v2/events/${eventId}/social/?limit=20`),
    bsdFetch<BsdIncidentsResponse>(`/api/v2/events/${eventId}/incidents/`),
  ]);

  const socialText = pickHeadlineFromBsdSocial(social?.results ?? []);
  if (socialText) {
    return { text: socialText, source: "bsd_social" };
  }

  const incidentText = composeHeadlineFromBsdIncidents(incidents?.incidents ?? [], context);
  if (incidentText) {
    return { text: incidentText, source: "bsd_incidents" };
  }

  return null;
}
