import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const hectorId = "29231466-19ad-4d4f-9402-1349a3dbec47";
  const { data: pools } = await supabase.from("pools").select("id").limit(1);
  const poolId = pools?.[0]?.id;
  if (!poolId) return;

  // MVP hits
  const { data: mvps } = await supabase
    .from("match_mvp_predictions")
    .select("match_id, player_name, team_name, points_awarded")
    .eq("profile_id", hectorId)
    .eq("pool_id", poolId)
    .gt("points_awarded", 0);

  console.log("MVP hits > 0:", mvps?.length ?? 0);

  // Also count total
  const { data: all } = await supabase
    .from("match_mvp_predictions")
    .select("match_id, points_awarded")
    .eq("profile_id", hectorId)
    .eq("pool_id", poolId);

  console.log("Total MVP predictions:", all?.length ?? 0);
  const counted = (all || []).reduce((acc, m) => acc + (m.points_awarded ?? 0), 0);
  console.log("Suma points_awarded:", counted);

  // Recalcular MVP scores
  console.log("\nRecalculando MVP...");
  const { data: matches } = await supabase.from("match_results").select("match_id, home_goals, away_goals, mvp_player_name, mvp_team_name");
  for (const m of matches || []) {
    await supabase.rpc("recalculate_match_mvp_scores", { p_match_id: m.match_id });
  }

  // Check again
  const { data: mvps2 } = await supabase
    .from("match_mvp_predictions")
    .select("match_id, player_name, team_name, points_awarded")
    .eq("profile_id", hectorId)
    .eq("pool_id", poolId)
    .gt("points_awarded", 0);

  console.log("MVP hits after recalc:", mvps2?.length ?? 0);
  
  const { data: all2 } = await supabase
    .from("match_mvp_predictions")
    .select("match_id, points_awarded")
    .eq("profile_id", hectorId)
    .eq("pool_id", poolId);

  const counted2 = (all2 || []).reduce((acc, m) => acc + (m.points_awarded ?? 0), 0);
  console.log("Suma points_awarded after recalc:", counted2);
}

main().catch(console.error);
