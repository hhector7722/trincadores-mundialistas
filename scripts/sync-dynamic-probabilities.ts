import { createAdminClient } from "@/lib/scripts/supabase-admin";
import { syncDynamicProbabilities } from "@/lib/predictions/probabilities/sync";

async function run() {
  const admin = createAdminClient();
  await syncDynamicProbabilities(admin);
  console.log("[sync-dynamic-probabilities] Done.");
}

run().catch((err) => {
  console.error("Script failed:", err);
  process.exit(1);
});
