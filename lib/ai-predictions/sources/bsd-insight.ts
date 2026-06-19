import {
  fetchBsdPredictedLineup,
  getBsdApiKey,
  isBsdConfigured,
  type BsdPredictedPlayer,
} from "@/lib/lineup/sources/bsd-client";
import {
  BSD_API_BASE_URL,
  BSD_WC_LEAGUE_ID,
  BSD_WC_SEASON_ID,
} from "@/lib/lineup/sources/bsd-constants";
import type { GeneratedPredictionInsight } from "@/lib/ai-predictions/types";
import { resolveBsdDisplayScore } from "@/lib/ai-predictions/sources/bsd-display-score";
import { teamNameEs } from "@/lib/teams/display";

type BsdPredictionMarket = {
  prob_home?: number;
  prob_draw?: number;
  prob_away?: number;
  predicted?: string;
  home?: number;
  away?: number;
  prob_yes?: number;
  most_likely?: string;
};

type BsdPredictionPayload = {
  id?: number;
  created_at?: string;
  event?: {
    id?: number;
    home_team?: string;
    away_team?: string;
    event_date?: string;
  };
  markets?: {
    match_result?: BsdPredictionMarket;
    expected_goals?: BsdPredictionMarket;
    over_under?: BsdPredictionMarket;
    btts?: BsdPredictionMarket;
    score?: BsdPredictionMarket;
  };
  model?: {
    confidence?: number;
    version?: string;
  };
};

type BsdPredictionsListPayload = {
  count?: number;
  results?: BsdPredictionPayload[];
};

async function bsdFetch<T>(path: string): Promise<T | null> {
  const apiKey = getBsdApiKey();
  if (!apiKey) return null;

  const url = path.startsWith("http") ? path : `${BSD_API_BASE_URL}${path}`;
  const response = await fetch(url, {
    headers: { Authorization: `Token ${apiKey}` },
  });

  if (!response.ok) return null;
  return (await response.json()) as T;
}

function roundProb(value: unknown): number {
  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(num)) return 0;
  return Math.max(0, Math.min(100, Math.round(num)));
}

function mapConfidence(favoriteProb: number, modelConfidence: number | null): string {
  const signal = Math.max(favoriteProb, (modelConfidence ?? 0) * 100);
  if (signal >= 55) return "Alta";
  if (signal >= 45) return "Media";
  return "Baja";
}

function formatMainPrediction(
  homeEs: string,
  awayEs: string,
  score: string,
): string {
  const [homeGoals, awayGoals] = score.split("-").map((part) => part.trim());
  if (!homeGoals || !awayGoals) return `${homeEs} vs ${awayEs}`;
  return `${homeEs} ${homeGoals}-${awayGoals} ${awayEs}`;
}

function deriveAlternatives(
  mostLikely: string,
  xgHome: number,
  xgAway: number,
): string[] {
  const candidates = new Set<string>();
  const fromXg = `${Math.max(0, Math.round(xgHome))}-${Math.max(0, Math.round(xgAway))}`;
  candidates.add(fromXg);

  const [home, away] = mostLikely.split("-").map((part) => Number(part.trim()));
  if (Number.isFinite(home) && Number.isFinite(away)) {
    candidates.add(`${home}-${away + 1}`);
    candidates.add(`${home + 1}-${away}`);
    candidates.add(`${home}-${Math.max(0, away - 1)}`);
  }

  candidates.delete(mostLikely);
  return [...candidates].slice(0, 2);
}

function buildAnalysis(input: {
  homeEs: string;
  awayEs: string;
  probHome: number;
  probDraw: number;
  probAway: number;
  xgHome: number;
  xgAway: number;
  btts: number;
  mostLikely: string;
  favorite: string | null;
}): string {
  const favoriteLabel =
    input.favorite === "H"
      ? input.homeEs
      : input.favorite === "A"
        ? input.awayEs
        : "el empate";
  const favoriteProb =
    input.favorite === "H"
      ? input.probHome
      : input.favorite === "A"
        ? input.probAway
        : input.probDraw;

  const tempo =
    input.xgHome + input.xgAway >= 2.6
      ? "un partido con llegadas en ambas áreas"
      : input.xgHome + input.xgAway <= 1.8
        ? "un choque más táctico y cerrado"
        : "un duelo equilibrado en fase final";

  return [
    `Modelo CatBoost BSD v5 inclina el partido hacia ${favoriteLabel} (${favoriteProb}%).`,
    `xG esperado: ${input.homeEs} ${input.xgHome.toFixed(2)} – ${input.xgAway.toFixed(2)} ${input.awayEs}. Marcador más probable: ${input.mostLikely}.`,
    `Probabilidad BTTS ${input.btts}%. El perfil del encuentro apunta a ${tempo}.`,
    `Distribución 1X2: ${input.homeEs} ${input.probHome}% · Empate ${input.probDraw}% · ${input.awayEs} ${input.probAway}%.`,
  ].join("\n");
}

async function resolveMvpPlayerName(eventId: number): Promise<string> {
  const payload = await fetchBsdPredictedLineup(eventId);
  const sides = [payload?.lineups?.home, payload?.lineups?.away];

  let best: BsdPredictedPlayer | null = null;
  let fallback: BsdPredictedPlayer | null = null;
  for (const side of sides) {
    for (const player of side?.starters ?? []) {
      if (!player?.name?.trim()) continue;
      const score = typeof player.ai_score === "number" ? player.ai_score : 0;
      if (!fallback || score > (fallback.ai_score ?? 0)) {
        fallback = player;
      }
      if (player.position === "G" || player.predicted_slot === "GK") continue;
      if (!best || score > (best.ai_score ?? 0)) {
        best = player;
      }
    }
  }

  const picked = best ?? fallback;
  return picked?.name?.trim() || picked?.short_name?.trim() || " ";
}

export function mapBsdPredictionToInsight(
  payload: BsdPredictionPayload,
  homeTeam: string,
  awayTeam: string,
  mvpPlayerName: string,
): GeneratedPredictionInsight {
  const homeEs = teamNameEs(homeTeam);
  const awayEs = teamNameEs(awayTeam);
  const matchResult = payload.markets?.match_result ?? {};
  const expectedGoals = payload.markets?.expected_goals ?? {};
  const btts = payload.markets?.btts ?? {};
  const score = payload.markets?.score ?? {};

  const probHome = roundProb(matchResult.prob_home);
  const probDraw = roundProb(matchResult.prob_draw);
  const probAway = roundProb(matchResult.prob_away);
  const xgHome = typeof expectedGoals.home === "number" ? expectedGoals.home : 0;
  const xgAway = typeof expectedGoals.away === "number" ? expectedGoals.away : 0;
  const bttsProb = roundProb(btts.prob_yes);
  const mostLikely = resolveBsdDisplayScore({
    predicted: matchResult.predicted ?? null,
    probHome,
    probDraw,
    probAway,
    mostLikely: score.most_likely ?? null,
    xgHome,
    xgAway,
  });
  const favoriteProb = Math.max(probHome, probDraw, probAway);
  const confidence = mapConfidence(favoriteProb, payload.model?.confidence ?? null);

  return {
    mainPrediction: formatMainPrediction(homeEs, awayEs, mostLikely),
    confidence,
    mvpPlayerName: mvpPlayerName.trim() || " ",
    homeWinProb: probHome,
    drawProb: probDraw,
    awayWinProb: probAway,
    analysis: buildAnalysis({
      homeEs,
      awayEs,
      probHome,
      probDraw,
      probAway,
      xgHome,
      xgAway,
      btts: bttsProb,
      mostLikely,
      favorite: matchResult.predicted ?? null,
    }),
    alternatives: deriveAlternatives(mostLikely, xgHome, xgAway),
  };
}

export async function fetchBsdPredictionForEvent(
  eventId: number,
): Promise<BsdPredictionPayload | null> {
  return bsdFetch<BsdPredictionPayload>(`/api/v2/events/${eventId}/prediction/`);
}

export async function fetchAllBsdWorldCupPredictions(): Promise<BsdPredictionPayload[]> {
  const items: BsdPredictionPayload[] = [];
  let offset = 0;
  const limit = 200;

  while (true) {
    const payload = await bsdFetch<BsdPredictionsListPayload>(
      `/api/v2/predictions/?league_id=${BSD_WC_LEAGUE_ID}&season_id=${BSD_WC_SEASON_ID}&status=upcoming&limit=${limit}&offset=${offset}`,
    );
    const batch = payload?.results ?? [];
    items.push(...batch);
    if (batch.length < limit) break;
    offset += limit;
  }

  return items;
}

export async function generateBsdPredictionInsight(input: {
  bsdEventId: number;
  homeTeam: string;
  awayTeam: string;
}): Promise<{ insight: GeneratedPredictionInsight; updatedAt: string }> {
  if (!isBsdConfigured()) {
    throw new Error("BSD_API_KEY no configurada.");
  }

  const [prediction, mvpPlayerName] = await Promise.all([
    fetchBsdPredictionForEvent(input.bsdEventId),
    resolveMvpPlayerName(input.bsdEventId),
  ]);

  if (!prediction?.markets?.match_result) {
    throw new Error("BSD no tiene predicción ML para este evento.");
  }

  return {
    insight: mapBsdPredictionToInsight(
      prediction,
      input.homeTeam,
      input.awayTeam,
      mvpPlayerName,
    ),
    updatedAt: prediction.created_at ?? new Date().toISOString(),
  };
}

export type { BsdPredictionPayload };
