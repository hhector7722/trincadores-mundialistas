import { createAdminClient } from "@/lib/scripts/supabase-admin";

async function run() {
  const admin = createAdminClient();
  const { data: squads } = await admin.from("team_squads").select("id, team_name").in("team_name", ["Switzerland", "Colombia", "Morocco", "France", "Belgium"]);
  console.log("Squads:", squads);

  if (squads && squads.length > 0) {
    for (const sq of squads) {
      const { data: players } = await admin.from("team_squad_players").select("player_name, shirt_number").eq("squad_id", sq.id);
      console.log(`Players for ${sq.team_name}:`, players?.map(p => `${p.shirt_number}: ${p.player_name}`));
    }
  }
}

run().catch(console.error);
