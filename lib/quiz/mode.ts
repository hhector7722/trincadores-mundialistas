import { isQuizCompetitiveDay, todayQuizDate } from "@/lib/quiz/date";
import { createClient } from "@/lib/supabase/server";

/**
 * Competitivo desde el 11-jun-2026 (quiz oficial) o si ya empezó el torneo en el pool.
 */
export async function isPoolCompetitive(poolId: string): Promise<boolean> {
  if (isQuizCompetitiveDay(todayQuizDate())) {
    return true;
  }
  const supabase = await createClient();

  const { data: matchdays, error: mdError } = await supabase
    .from("matchdays")
    .select("id")
    .eq("pool_id", poolId);

  if (mdError) throw new Error(mdError.message);
  if (!matchdays?.length) return false;

  const matchdayIds = matchdays.map((m) => m.id);

  const { count: activeCount, error: activeError } = await supabase
    .from("matches")
    .select("id", { count: "exact", head: true })
    .in("matchday_id", matchdayIds)
    .in("status", ["live", "finished"]);

  if (activeError) throw new Error(activeError.message);
  if ((activeCount ?? 0) > 0) return true;

  const { data: nextMatch, error: nextError } = await supabase
    .from("matches")
    .select("kickoff_at")
    .in("matchday_id", matchdayIds)
    .order("kickoff_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (nextError) throw new Error(nextError.message);
  if (!nextMatch?.kickoff_at) return false;

  return Date.now() >= new Date(nextMatch.kickoff_at).getTime();
}
