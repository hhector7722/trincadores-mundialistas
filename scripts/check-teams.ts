import { createAdminClient } from "@/lib/scripts/supabase-admin";

async function run() {
  const admin = createAdminClient();
  const { data: teams } = await admin.from("players").select("team_name").limit(50);
  console.log("Teams in players table:", new Set(teams?.map(t => t.team_name)));
}

run().catch(console.error);
