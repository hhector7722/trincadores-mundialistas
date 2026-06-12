import { fetchBsdHeadline, type BsdHeadlineContext, type BsdHeadlineSource } from "@/lib/live/sources/bsd-headline";
import type { AdminClient } from "@/lib/scripts/supabase-admin";

type MatchHeadlineRow = {
  id: string;
  home_team: string;
  away_team: string;
  highlight_headline: string | null;
  highlight_headline_source: BsdHeadlineSource | null;
  match_results: { home_goals: number; away_goals: number } | { home_goals: number; away_goals: number }[] | null;
  match_live_state: { home_score: number; away_score: number } | { home_score: number; away_score: number }[] | null;
};

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

async function loadBsdEventId(admin: AdminClient, matchId: string): Promise<number | null> {
  const { data, error } = await admin
    .from("external_id_map")
    .select("external_key")
    .eq("source_code", "bsd")
    .eq("entity_type", "match")
    .eq("internal_id", matchId)
    .eq("match_status", "mapped")
    .maybeSingle();

  if (error || !data?.external_key) return null;

  const parsed = Number(data.external_key);
  return Number.isFinite(parsed) ? parsed : null;
}

function shouldReplaceHeadline(
  existingSource: BsdHeadlineSource | null,
  incomingSource: BsdHeadlineSource,
): boolean {
  if (!existingSource) return true;
  if (existingSource === "bsd_incidents") return true;
  if (existingSource === "bsd_social" && incomingSource === "bsd_social") return false;
  if (existingSource === "bsd_social" && incomingSource === "bsd_incidents") return false;
  return incomingSource === "bsd_social";
}

export async function syncBsdHeadlineForMatch(
  admin: AdminClient,
  matchId: string,
  options?: { force?: boolean },
): Promise<boolean> {
  const { data, error } = await admin
    .from("matches")
    .select(
      `
      id,
      home_team,
      away_team,
      highlight_headline,
      highlight_headline_source,
      match_results ( home_goals, away_goals ),
      match_live_state ( home_score, away_score )
    `,
    )
    .eq("id", matchId)
    .maybeSingle();

  if (error || !data) return false;

  const row = data as MatchHeadlineRow;
  const existingSource = (row.highlight_headline_source as BsdHeadlineSource | null) ?? null;

  if (row.highlight_headline && existingSource === "bsd_social" && !options?.force) {
    return false;
  }

  const result = firstRelation(row.match_results);
  const live = firstRelation(row.match_live_state);
  const homeGoals = result?.home_goals ?? live?.home_score ?? null;
  const awayGoals = result?.away_goals ?? live?.away_score ?? null;

  if (homeGoals == null || awayGoals == null) return false;

  const eventId = await loadBsdEventId(admin, matchId);
  if (!eventId) return false;

  const context: BsdHeadlineContext = {
    homeTeam: row.home_team,
    awayTeam: row.away_team,
    homeGoals,
    awayGoals,
  };

  const headline = await fetchBsdHeadline(eventId, context);
  if (!headline) return false;

  if (
    row.highlight_headline &&
    !options?.force &&
    !shouldReplaceHeadline(existingSource, headline.source)
  ) {
    return false;
  }

  const { error: updateError } = await admin
    .from("matches")
    .update({
      highlight_headline: headline.text,
      highlight_headline_source: headline.source,
    })
    .eq("id", matchId);

  return !updateError;
}
