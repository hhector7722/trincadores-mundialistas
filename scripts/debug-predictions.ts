import { createAdminClient } from "@/lib/scripts/supabase-admin";

async function main() {
  const admin = createAdminClient();

  // Check what golden glove predictions exist
  const { data: goldenGlovePicks } = await admin
    .from("tournament_general_predictions")
    .select("golden_glove_player_name, golden_glove_team_name, profile_id")
    .not("golden_glove_player_name", "is", null)
    .limit(10);

  console.log("Golden glove predictions:", JSON.stringify(goldenGlovePicks, null, 2));

  // Check star_player_config for Unai Simon
  const { data: starConfig } = await admin
    .from("star_player_config")
    .select("*")
    .order("player_name");

  console.log("\nStar player configs:", JSON.stringify(starConfig, null, 2));

  // Check dynamic_probabilities for golden_glove
  const { data: dynProbs } = await admin
    .from("dynamic_probabilities")
    .select("*")
    .eq("category", "golden_glove")
    .limit(10);

  console.log("\nGolden glove dynamic probabilities:", JSON.stringify(dynProbs, null, 2));
}

main().catch(console.error);
