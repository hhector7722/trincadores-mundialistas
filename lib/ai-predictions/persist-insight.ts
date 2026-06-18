import type { SupabaseClient } from "@supabase/supabase-js";
import {
  fetchAllBsdWorldCupPredictions,
  generateBsdPredictionInsight,
} from "@/lib/ai-predictions/sources/bsd-insight";
import { generateHybridPredictionInsight } from "@/lib/ai-predictions/sources/hybrid-insight";
import { upsertPredictionInsightRow } from "@/lib/ai-predictions/queries";
import type { PredictionInsight, PredictionInsightSource } from "@/lib/ai-predictions/types";
import { isBsdConfigured } from "@/lib/lineup/sources/bsd-client";
import { teamNameEs } from "@/lib/teams/display";

export type MatchForInsight = {
  id: string;
  home_team: string;
  away_team: string;
  kickoff_at: string;
  bsd_event_id: number;
  matchday_name?: string | null;
};

export type MatchInsightContext = MatchForInsight;

export async function resolveBsdEventIdForMatch(
  admin: SupabaseClient,
  matchId: string,
): Promise<number | null> {
  const { data, error } = await admin
    .from("external_id_map")
    .select("external_key")
    .eq("source_code", "bsd")
    .eq("entity_type", "match")
    .eq("internal_id", matchId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data?.external_key) return null;
  const eventId = Number(data.external_key);
  return Number.isFinite(eventId) ? eventId : null;
}

async function loadBsdMatchMap(
  admin: SupabaseClient,
): Promise<Map<number, string>> {
  const { data, error } = await admin
    .from("external_id_map")
    .select("internal_id, external_key")
    .eq("source_code", "bsd")
    .eq("entity_type", "match");

  if (error) throw new Error(error.message);

  const map = new Map<number, string>();
  for (const row of data ?? []) {
    const eventId = Number(row.external_key);
    if (Number.isFinite(eventId)) {
      map.set(eventId, row.internal_id as string);
    }
  }
  return map;
}

async function loadMatchTeams(
  admin: SupabaseClient,
  matchIds: string[],
): Promise<Map<string, { homeTeam: string; awayTeam: string; kickoffAt: string; matchdayName: string | null }>> {
  if (matchIds.length === 0) return new Map();

  const { data, error } = await admin
    .from("matches")
    .select("id, home_team, away_team, kickoff_at, matchdays(name)")
    .in("id", matchIds);

  if (error) throw new Error(error.message);

  return new Map(
    (data ?? []).map((row) => [
      row.id as string,
      {
        homeTeam: row.home_team as string,
        awayTeam: row.away_team as string,
        kickoffAt: row.kickoff_at as string,
        matchdayName: (row.matchdays as { name?: string } | null)?.name ?? null,
      },
    ]),
  );
}

export async function fetchMatchesForInsightGeneration(
  admin: SupabaseClient,
  options: {
    horizonDays: number | null;
    matchId?: string | null;
    force?: boolean;
    source: PredictionInsightSource;
  },
): Promise<MatchForInsight[]> {
  const bsdMap = await loadBsdMatchMap(admin);

  if (options.matchId) {
    const bsdEventId = await resolveBsdEventIdForMatch(admin, options.matchId);
    if (bsdEventId == null) {
      throw new Error(`Partido sin mapeo BSD: ${options.matchId}`);
    }

    const teams = await loadMatchTeams(admin, [options.matchId]);
    const teamRow = teams.get(options.matchId);
    if (!teamRow) throw new Error(`Partido no encontrado: ${options.matchId}`);

    return [
      {
        id: options.matchId,
        home_team: teamRow.homeTeam,
        away_team: teamRow.awayTeam,
        kickoff_at: teamRow.kickoffAt,
        bsd_event_id: bsdEventId,
        matchday_name: teamRow.matchdayName,
      },
    ];
  }

  if (!isBsdConfigured()) {
    throw new Error("BSD_API_KEY no configurada.");
  }

  let predictions = await fetchAllBsdWorldCupPredictions();
  if (options.horizonDays != null) {
    const horizonMs = Date.now() + options.horizonDays * 24 * 60 * 60 * 1000;
    predictions = predictions.filter((item) => {
      const kickoff = item.event?.event_date ? new Date(item.event.event_date).getTime() : NaN;
      return Number.isFinite(kickoff) && kickoff <= horizonMs;
    });
  }

  const matchIds = predictions
    .map((item) => {
      const eventId = item.event?.id;
      if (!eventId) return null;
      return bsdMap.get(eventId) ?? null;
    })
    .filter((id): id is string => Boolean(id));

  const teamsByMatch = await loadMatchTeams(admin, [...new Set(matchIds)]);

  let rows = predictions.flatMap((item) => {
    const eventId = item.event?.id;
    if (!eventId) return [];
    const matchId = bsdMap.get(eventId);
    if (!matchId) return [];
    const teams = teamsByMatch.get(matchId);
    if (!teams) return [];

    return [
      {
        id: matchId,
        home_team: teams.homeTeam,
        away_team: teams.awayTeam,
        kickoff_at: item.event?.event_date ?? teams.kickoffAt,
        bsd_event_id: eventId,
        matchday_name: teams.matchdayName,
      },
    ];
  });

  if (!options.force && rows.length > 0) {
    const { data: existing, error } = await admin
      .from("prediction_insights")
      .select("match_id, source_code")
      .in(
        "match_id",
        rows.map((row) => row.id),
      )
      .eq("source_code", options.source);

    if (error) throw new Error(error.message);
    const existingIds = new Set((existing ?? []).map((row) => row.match_id as string));
    rows = rows.filter((row) => !existingIds.has(row.id));
  }

  return rows;
}

export async function generateAndPersistHybridInsight(
  admin: SupabaseClient,
  match: MatchInsightContext,
): Promise<PredictionInsight> {
  const result = await generateHybridPredictionInsight({
    bsdEventId: match.bsd_event_id,
    homeTeam: match.home_team,
    awayTeam: match.away_team,
    kickoffAt: match.kickoff_at,
    stageLabel: match.matchday_name,
  });

  return upsertPredictionInsightRow(match.id, "hybrid", result.insight, result.updatedAt);
}

export async function generateAndPersistBsdInsight(
  admin: SupabaseClient,
  match: MatchForInsight,
): Promise<PredictionInsight> {
  const result = await generateBsdPredictionInsight({
    bsdEventId: match.bsd_event_id,
    homeTeam: match.home_team,
    awayTeam: match.away_team,
  });

  return upsertPredictionInsightRow(match.id, "bsd", result.insight, result.updatedAt);
}

export function formatMatchLabel(match: MatchForInsight): string {
  return `${teamNameEs(match.home_team)} vs ${teamNameEs(match.away_team)}`;
}
