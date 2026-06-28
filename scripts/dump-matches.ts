import { createAdminClient } from "../lib/supabase/admin";

async function run() {
  const admin = createAdminClient();
  const { data: matches } = await admin
    .from("matches")
    .select("id, match_number, home_team, away_team, status")
    .gte("match_number", 73)
    .order("match_number", { ascending: true });

  console.log(matches);
}

run().catch(console.error);
