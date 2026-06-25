import { createAdminClient } from "@/lib/scripts/supabase-admin";
import { WC2026_SQUAD_YEAR } from "@/lib/worldcup2026/normalize-squads";
import { WC2026_FEED_SOURCE } from "@/lib/worldcup-data/types";

async function main() {
  const admin = createAdminClient();

  const { data: squads } = await admin
    .from("team_squads")
    .select("id, team_name")
    .eq("year", WC2026_SQUAD_YEAR)
    .eq("source_code", WC2026_FEED_SOURCE);

  const squadIds = (squads ?? []).map((s) => s.id);

  // Test with range pagination
  const { data: p1 } = await admin
    .from("team_squad_players")
    .select("squad_id, player_name, position, shirt_number")
    .in("squad_id", squadIds)
    .order("player_name", { ascending: true })
    .range(0, 999);

  const { data: p2 } = await admin
    .from("team_squad_players")
    .select("squad_id, player_name, position, shirt_number")
    .in("squad_id", squadIds)
    .order("player_name", { ascending: true })
    .range(1000, 1999);

  console.log("Page 1 (0-999):", p1?.length ?? 0);
  console.log("Page 2 (1000-1999):", p2?.length ?? 0);
  console.log("Total:", (p1?.length ?? 0) + (p2?.length ?? 0));
}

main().catch(console.error);
