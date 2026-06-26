import { createClient } from "@/lib/supabase/server";
import type { AlternativeSource, MatchHighlightView } from "@/lib/highlights/types";
import type { HighlightSourceCode } from "@/lib/youtube/highlight-priority";

type HighlightRow = {
  id: string;
  home_team: string;
  away_team: string;
  highlight_youtube_id: string;
  highlight_published_at: string;
  highlight_source: HighlightSourceCode;  highlight_headline: string | null;
  match_results: { home_goals: number; away_goals: number } | { home_goals: number; away_goals: number }[] | null;
  match_live_state: { home_score: number; away_score: number } | { home_score: number; away_score: number }[] | null;
};

type ExternalIdMapRow = {
  external_key: string;
  source_code: HighlightSourceCode;
  metadata: { published_at: string } | null;
};

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function rowToHighlightView(
  row: HighlightRow,
  alternatives: AlternativeSource[],
): MatchHighlightView | null {
  const result = firstRelation(row.match_results);
  const live = firstRelation(row.match_live_state);

  const homeGoals = result?.home_goals ?? live?.home_score ?? null;
  const awayGoals = result?.away_goals ?? live?.away_score ?? null;

  if (homeGoals == null || awayGoals == null) return null;

  return {
    matchId: row.id,
    homeTeam: row.home_team,
    awayTeam: row.away_team,
    homeGoals,
    awayGoals,
    youtubeVideoId: row.highlight_youtube_id,
    publishedAt: row.highlight_published_at,
    source: row.highlight_source,
    headline: row.highlight_headline?.trim() || null,
    alternativeSources: alternatives,
  };
}

async function getMatchdayIdsForPool(poolId: string): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("matchdays")
    .select("id")
    .eq("pool_id", poolId);

  return (data ?? []).map((row) => row.id);
}

/** Todos los partidos finalizados de la porra con vídeo (cronológico, más antiguo primero). */
export async function getMatchHighlightsForPool(poolId: string): Promise<MatchHighlightView[]> {
  const dayIds = await getMatchdayIdsForPool(poolId);
  if (!dayIds.length) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("matches")
    .select(
      `
      id,
      home_team,
      away_team,
      highlight_youtube_id,
      highlight_published_at,
      highlight_source,
      highlight_headline,
      match_results ( home_goals, away_goals ),
      match_live_state ( home_score, away_score )
    `,
    )
    .in("matchday_id", dayIds)
    .eq("status", "finished")
    .not("highlight_youtube_id", "is", null)
    .order("kickoff_at", { ascending: true });

  if (error || !data?.length) return [];

  const rows = data as unknown as HighlightRow[];
  const matchIds = rows.map((r) => r.id);

  const { data: externalRefs } = await supabase
    .from("external_id_map")
    .select("external_key, source_code, metadata, internal_id")
    .in("internal_id", matchIds)
    .eq("internal_table", "matches")
    .in("source_code", ["youtube_fifa", "youtube_replay", "youtube_rtve_teledeporte", "youtube_dazn_es"]);

  const alternativesByMatch = new Map<string, AlternativeSource[]>();
  for (const ref of (externalRefs ?? []) as (ExternalIdMapRow & { internal_id: string })[]) {
    if (!ref.metadata?.published_at) continue;
    const list = alternativesByMatch.get(ref.internal_id);
    const alt: AlternativeSource = {
      videoId: ref.external_key,
      source: ref.source_code,
      publishedAt: ref.metadata.published_at,
    };
    if (list) {
      list.push(alt);
    } else {
      alternativesByMatch.set(ref.internal_id, [alt]);
    }
  }

  return rows
    .map((row) => {
      const alternatives = alternativesByMatch.get(row.id) ?? [];
      const filtered = alternatives.filter((a) => a.videoId !== row.highlight_youtube_id);
      return rowToHighlightView(row, filtered);
    })
    .filter((highlight): highlight is MatchHighlightView => highlight != null);
}

/** Último partido finalizado de la porra con resumen (para hero home y otros usos). */
export async function getLatestMatchHighlightForPool(
  poolId: string,
): Promise<MatchHighlightView | null> {
  const highlights = await getMatchHighlightsForPool(poolId);
  return highlights.at(-1) ?? null;
}
