import { createClient } from "@/lib/supabase/server";
import type { MatchHighlightView } from "@/lib/highlights/types";

type HighlightRow = {
  id: string;
  home_team: string;
  away_team: string;
  highlight_youtube_id: string;
  highlight_published_at: string;
  match_results: { home_goals: number; away_goals: number } | { home_goals: number; away_goals: number }[] | null;
  match_live_state: { home_score: number; away_score: number } | { home_score: number; away_score: number }[] | null;
};

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function rowToHighlightView(row: HighlightRow): MatchHighlightView | null {
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

/** Último partido finalizado de la porra con resumen FIFA (para hero home). */
export async function getLatestMatchHighlightForPool(
  poolId: string,
): Promise<MatchHighlightView | null> {
  const dayIds = await getMatchdayIdsForPool(poolId);
  if (!dayIds.length) return null;

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
      match_results ( home_goals, away_goals ),
      match_live_state ( home_score, away_score )
    `,
    )
    .in("matchday_id", dayIds)
    .eq("status", "finished")
    .not("highlight_youtube_id", "is", null)
    .order("highlight_published_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data?.highlight_youtube_id || !data.highlight_published_at) return null;

  return rowToHighlightView(data as HighlightRow);
}
