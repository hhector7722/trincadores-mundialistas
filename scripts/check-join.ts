import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const hectorId = "29231466-19ad-4d4f-9402-1349a3dbec47";
  const { data: pools } = await supabase.from("pools").select("id").limit(1);
  const poolId = pools?.[0]?.id;

  // All predictions for Hector
  const { data: all } = await supabase
    .from("predictions")
    .select("match_id, points_awarded")
    .eq("profile_id", hectorId)
    .eq("pool_id", poolId)
    .range(0, 9999);
  console.log("Total predictions (no join):", all?.length);

  // With inner join
  const { data: joined } = await supabase
    .from("predictions")
    .select("match_id, points_awarded, matches!inner(group_code)")
    .eq("profile_id", hectorId)
    .eq("pool_id", poolId)
    .range(0, 9999);
  console.log("With matches!inner(group_code):", joined?.length);

  // Which are missing?
  const mids = new Set((all || []).map(x => x.match_id));
  const mids2 = new Set((joined || []).map((x: any) => x.match_id));
  const missing = [...mids].filter(m => !mids2.has(m));
  console.log("Excluded by inner join:", missing.length);
  for (const m of missing) {
    const { data: match } = await supabase.from("matches").select("id, group_code").eq("id", m).single();
    console.log(`  match_id ${m}: match=`, JSON.stringify(match));
    const { data: pred } = await supabase
      .from("predictions")
      .select("home_goals, away_goals, advancing_team, points_awarded")
      .eq("profile_id", hectorId)
      .eq("match_id", m)
      .eq("pool_id", poolId)
      .single();
    console.log(`    prediction=`, JSON.stringify(pred));
  }

  // Also count what each profile has
  const { data: perProfile } = await supabase
    .from("predictions")
    .select("profile_id, points_awarded")
    .eq("pool_id", poolId)
    .range(0, 9999);
  const counts: Record<string, number> = {};
  for (const pp of perProfile || []) {
    counts[pp.profile_id] = (counts[pp.profile_id] || 0) + 1;
  }
  console.log("\nPrediction count per profile:");
  for (const [pid, cnt] of Object.entries(counts)) {
    console.log(`  ${pid.slice(0,8)}: ${cnt}`);
  }
  console.log("Total:", (perProfile || []).length);
}

main().catch(console.error);
