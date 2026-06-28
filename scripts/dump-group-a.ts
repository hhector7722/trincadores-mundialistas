import { createAdminClient } from "../lib/supabase/admin";

async function run() {
  const admin = createAdminClient();
  const { data: matches } = await admin
    .from("matches")
    .select("id, home_team, away_team, status")
    .eq("group_code", "A");

  const { data: results } = await admin
    .from("match_results")
    .select("match_id, home_score, away_score")
    .in("match_id", matches!.map((m) => m.id));

  console.log("Matches:", matches);
  console.log("Results:", results);
}

run().catch(console.error);
