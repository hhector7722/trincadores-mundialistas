import { createClient } from "@/lib/supabase/server";
import { getTeamSquadByName } from "@/lib/worldcup-data/squad-queries";
import { createAdminClient } from "@/lib/scripts/supabase-admin";
import { buildFallbackWithKnownFormation } from "@/lib/lineup/resolve-lineup";

async function run() {
  const admin = createAdminClient();
  const squad = await getTeamSquadByName(admin, "Switzerland");
  
  if (!squad) {
    console.log("No squad");
    return;
  }
  
  const lineup = await buildFallbackWithKnownFormation(admin, {
    teamName: "Switzerland",
    players: squad.players
  });
  
  console.log("Switzerland Starters:");
  lineup.slots.filter(s => !s.isPlaceholder).forEach(s => {
    console.log(s.shirtNumber, s.name, s.role);
  });
}

run().catch(console.error);
