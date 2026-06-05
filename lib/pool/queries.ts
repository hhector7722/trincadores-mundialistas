import { formatKickoff } from "@/lib/pool/format-kickoff";
export { formatKickoff };

import { createClient } from "@/lib/supabase/server";
import type { MatchStatus } from "@/types/database";

export type PoolMatchRow = {
  id: string;
  home_team: string;
  away_team: string;
  kickoff_at: string;
  status: MatchStatus;
  matchday_name: string;
};

export async function getPoolMatches(poolId: string): Promise<PoolMatchRow[]> {
  const supabase = await createClient();
  const { data: matchdays } = await supabase
    .from("matchdays")
    .select("id, name")
    .eq("pool_id", poolId);

  if (!matchdays?.length) return [];

  const dayMap = new Map(matchdays.map((d) => [d.id, d.name]));
  const dayIds = matchdays.map((d) => d.id);

  const { data: matches } = await supabase
    .from("matches")
    .select("id, matchday_id, home_team, away_team, kickoff_at, status, sort_order")
    .in("matchday_id", dayIds)
    .order("kickoff_at", { ascending: true });

  return (matches ?? []).map((m) => ({
    id: m.id,
    home_team: m.home_team,
    away_team: m.away_team,
    kickoff_at: m.kickoff_at,
    status: m.status as MatchStatus,
    matchday_name: dayMap.get(m.matchday_id) ?? "",
  }));
}

