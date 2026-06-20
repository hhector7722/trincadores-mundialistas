/**
 * Titulares cortos de partido vía BSD:
 * 1) Social del evento (`/events/{id}/social/`) — frase editorial del tweet
 * 2) Incidentes (`/events/{id}/incidents/`) — frase corta sin marcador ni minutos
 */

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
  assist?: string;
  assist_player?: string;
  assist_name?: string;
  related_player?: string;
};

type BsdIncidentsResponse = {
  incidents?: BsdIncident[];
};

export type BsdHeadlineContext = {
  homeTeam: string;
  awayTeam: string;
  homeGoals: number;
  awayGoals: number;
  /** Semilla estable para elegir plantilla (p. ej. UUID del partido). */
  seed?: string;
};

type ParsedGoal = {
  scorer: string;
  assist: string | null;
  isHome: boolean;
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

/** Rechaza titulares con marcador, minuto o formato deportivo tipo «Gol 59' · KOR 2-1». */
export function isScoreStyleHeadline(text: string): boolean {
  const t = text.trim();
  if (!t) return false;
  if (/\d+\s*[-–]\s*\d+/.test(t)) return true;
  if (/\d+'/.test(t)) return true;
  if (/·/.test(t) && /\d/.test(t)) return true;
  if (/\b(gana|empate|vence)\b/i.test(t) && /\d+\s*[-–]\s*\d+/.test(t)) return true;
  return false;
}

function isUsableSocialHeadline(text: string): boolean {
  if (text.length < 12 || text.length > 140) return false;
  if (/^[\W\d]+$/.test(text)) return false;
  if (isScoreStyleHeadline(text)) return false;
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

function goalAssistName(incident: BsdIncident): string | null {
  const name =
    incident.assist_name?.trim() ||
    incident.assist_player?.trim() ||
    incident.assist?.trim() ||
    incident.related_player?.trim();
  return name || null;
}

function parseGoalIncidents(incidents: BsdIncident[]): ParsedGoal[] {
  return incidents
    .filter((incident) => incident.type === "goal")
    .map((incident) => {
      const scorer = goalScorerName(incident);
      if (!scorer) return null;
      return {
        scorer,
        assist: goalAssistName(incident),
        isHome: incident.is_home !== false,
      };
    })
    .filter((goal): goal is ParsedGoal => goal != null);
}

function headlineSeed(context: BsdHeadlineContext): string {
  return (
    context.seed ??
    `${context.homeTeam}:${context.awayTeam}:${context.homeGoals}:${context.awayGoals}`
  );
}

/** Elige una plantilla de forma estable para el mismo partido. */
export function pickHeadlineVariant(seed: string, variants: readonly string[]): string {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }
  return variants[hash % variants.length]!;
}

function countGoalsByScorer(goals: ParsedGoal[], winnerIsHome: boolean): Map<string, number> {
  const counts = new Map<string, number>();
  for (const goal of goals) {
    if (goal.isHome !== winnerIsHome) continue;
    counts.set(goal.scorer, (counts.get(goal.scorer) ?? 0) + 1);
  }
  return counts;
}

function composeDrawHeadline(homeEs: string, awayEs: string, seed: string, scoreless: boolean): string {
  if (scoreless) {
    return pickHeadlineVariant(`${seed}:draw-0`, [
      `Porterías a cero entre ${homeEs} y ${awayEs}`,
      `Sin goles en el duelo entre ${homeEs} y ${awayEs}`,
      `Tablas en blanco para ${homeEs} y ${awayEs}`,
    ]);
  }

  return pickHeadlineVariant(`${seed}:draw`, [
    `Empate entre ${homeEs} y ${awayEs}`,
    `Reparto de puntos entre ${homeEs} y ${awayEs}`,
    `${homeEs} y ${awayEs} firmaron las tablas`,
    `Puntos para ambos entre ${homeEs} y ${awayEs}`,
  ]);
}

function composeWinHeadline(
  goals: ParsedGoal[],
  winnerEs: string,
  loserEs: string,
  winnerIsHome: boolean,
  goalDiff: number,
  loserGoals: number,
  seed: string,
): string {
  const winnerGoals = goals.filter((goal) => goal.isHome === winnerIsHome);
  const scorerCounts = countGoalsByScorer(goals, winnerIsHome);
  const topScorer = [...scorerCounts.entries()].sort((a, b) => b[1] - a[1])[0];
  const lastGoal = goals.at(-1);
  const lastScorer = lastGoal?.scorer ?? null;
  const lastAssist =
    lastGoal && lastGoal.isHome === winnerIsHome ? lastGoal.assist : null;
  const distinctWinnerScorers = scorerCounts.size;

  if (topScorer && topScorer[1] >= 3) {
    return pickHeadlineVariant(`${seed}:hattrick`, [
      `${topScorer[0]} firma un hat-trick y ${winnerEs} gana`,
      `Hat-trick de ${topScorer[0]} para el triunfo de ${winnerEs}`,
      `${topScorer[0]} con tres goles y victoria de ${winnerEs}`,
    ]);
  }

  if (topScorer && topScorer[1] >= 2) {
    return pickHeadlineVariant(`${seed}:brace`, [
      `Doblete de ${topScorer[0]} y victoria de ${winnerEs}`,
      `${topScorer[0]} anota dos veces y ${winnerEs} suma`,
      `${topScorer[0]} con doblete para el triunfo de ${winnerEs}`,
    ]);
  }

  if (lastScorer && lastAssist && lastGoal?.isHome === winnerIsHome) {
    return pickHeadlineVariant(`${seed}:assist`, [
      `Asistencia de ${lastAssist} y gol de ${lastScorer} para ${winnerEs}`,
      `${lastScorer}, con pase de ${lastAssist}, decide para ${winnerEs}`,
      `Gol de ${lastScorer} tras asistencia de ${lastAssist} y triunfo de ${winnerEs}`,
    ]);
  }

  if (goalDiff >= 3) {
    return pickHeadlineVariant(`${seed}:blowout`, [
      `${winnerEs} golea a ${loserEs}`,
      `${winnerEs} arrasa ante ${loserEs}`,
      `Contundente victoria de ${winnerEs} ante ${loserEs}`,
    ]);
  }

  if (loserGoals === 0) {
    return pickHeadlineVariant(`${seed}:clean-sheet`, [
      `${winnerEs} deja la portería a cero ante ${loserEs}`,
      `Victoria sin encajar de ${winnerEs} ante ${loserEs}`,
      `${winnerEs} cierra el partido sin recibir goles`,
    ]);
  }

  if (goalDiff === 1 && lastScorer && lastGoal?.isHome === winnerIsHome) {
    return pickHeadlineVariant(`${seed}:narrow`, [
      `Victoria ajustada de ${winnerEs}: gol de ${lastScorer}`,
      `${lastScorer} desnivela y ${winnerEs} gana por la mínima`,
      `Triunfo mínimo de ${winnerEs} con gol de ${lastScorer}`,
    ]);
  }

  if (distinctWinnerScorers >= 2 && winnerGoals.length >= 2) {
    return pickHeadlineVariant(`${seed}:multi-scorer`, [
      `Goles repartidos y triunfo de ${winnerEs}`,
      `${winnerEs} gana con varios goleadores`,
      `Varios autores del gol y victoria de ${winnerEs}`,
    ]);
  }

  if (lastScorer && lastGoal?.isHome === winnerIsHome) {
    return pickHeadlineVariant(`${seed}:scorer`, [
      `${lastScorer} decide la victoria de ${winnerEs}`,
      `Gol de ${lastScorer} y triunfo de ${winnerEs}`,
      `${lastScorer} sentencia el triunfo de ${winnerEs}`,
    ]);
  }

  return pickHeadlineVariant(`${seed}:generic`, [
    `${winnerEs} se impone ante ${loserEs}`,
    `${winnerEs} vence a ${loserEs}`,
    `Triunfo de ${winnerEs} ante ${loserEs}`,
  ]);
}

export function composeHeadlineFromBsdIncidents(
  incidents: BsdIncident[],
  context: BsdHeadlineContext,
): string | null {
  const { homeTeam, awayTeam, homeGoals, awayGoals } = context;
  const homeEs = teamNameEs(homeTeam);
  const awayEs = teamNameEs(awayTeam);
  const seed = headlineSeed(context);
  const goals = parseGoalIncidents(incidents);

  if (homeGoals === awayGoals) {
    return truncateHeadline(composeDrawHeadline(homeEs, awayEs, seed, homeGoals === 0));
  }

  const homeWins = homeGoals > awayGoals;
  const winnerEs = homeWins ? homeEs : awayEs;
  const loserEs = homeWins ? awayEs : homeEs;
  const goalDiff = Math.abs(homeGoals - awayGoals);
  const loserGoals = homeWins ? awayGoals : homeGoals;

  return truncateHeadline(
    composeWinHeadline(goals, winnerEs, loserEs, homeWins, goalDiff, loserGoals, seed),
  );
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
