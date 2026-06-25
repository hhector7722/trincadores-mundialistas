import { createAdminClient } from "@/lib/scripts/supabase-admin";
import { syncDynamicProbabilities } from "@/lib/predictions/probabilities/sync";

async function main() {
  console.log("Starting sync...");
  const admin = createAdminClient();
  await syncDynamicProbabilities(admin);
  console.log("Sync completed");

  // Check if golden_glove was updated
  const { data } = await admin
    .from("dynamic_probabilities")
    .select("category, selection_key, probability, algorithm_version")
    .eq("category", "golden_glove")
    .eq("selection_key", "Unai Simon");

  console.log("Unai Simon after sync:", JSON.stringify(data, null, 2));

  // Check all golden glove entries
  const { data: all } = await admin
    .from("dynamic_probabilities")
    .select("category, selection_key, probability, algorithm_version")
    .eq("category", "golden_glove");

  console.log("All golden glove:", JSON.stringify(all, null, 2));
}

main().catch(console.error);
