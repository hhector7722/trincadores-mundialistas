import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const hectorId = "29231466-19ad-4d4f-9402-1349a3dbec47";
  const { data: pools } = await supabase.from("pools").select("id").limit(1);
  const poolId = pools?.[0]?.id;

  // Check null points_awarded
  const { data: nullOnes } = await supabase
    .from("predictions")
    .select("match_id, points_awarded, home_goals, away_goals")
    .eq("profile_id", hectorId)
    .eq("pool_id", poolId)
    .is("points_awarded", null);
  console.log("Predictions with points_awarded=null:", nullOnes?.length ?? 0);
  for (const x of nullOnes || []) console.log(`  ${x.match_id} ${x.home_goals}-${x.away_goals}`);

  // Total
  const { data: all } = await supabase
    .from("predictions")
    .select("match_id, points_awarded")
    .eq("profile_id", hectorId)
    .eq("pool_id", poolId);
  console.log("Total predictions:", all?.length ?? 0);
  const nullCount = (all || []).filter(x => x.points_awarded == null).length;
  console.log("With null:", nullCount);

  // Duplicates
  const counts: Record<string, number> = {};
  for (const x of all || []) {
    counts[x.match_id] = (counts[x.match_id] || 0) + 1;
  }
  const dups = Object.entries(counts).filter(([_, c]) => c > 1);
  console.log("Duplicate predictions:", dups.length);
  for (const [mid, cnt] of dups) {
    console.log(`  ${mid}: ${cnt} predictions`);
  }

  // Check what the ranking-final query returns
  const { data: rankingQ } = await supabase
    .from("predictions")
    .select("match_id, points_awarded")
    .eq("profile_id", hectorId)
    .eq("pool_id", poolId)
    .not("points_awarded", "is", null);
  console.log("\nranking-query count (not null):", rankingQ?.length ?? 0);

  // Check with inner join on matches
  const { data: withJoin } = await supabase
    .from("predictions")
    .select("match_id, points_awarded, matches!inner(group_code)")
    .eq("profile_id", hectorId)
    .eq("pool_id", poolId)
    .not("points_awarded", "is", null);
  console.log("With matches!inner and not null:", withJoin?.length ?? 0);
}

main().catch(console.error);
