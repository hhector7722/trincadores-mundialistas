import { createAdminClient } from "@/lib/scripts/supabase-admin";
import { syncAllMatchHighlights } from "@/lib/youtube/sync-highlights";

async function main() {
  const admin = createAdminClient();
  const result = await syncAllMatchHighlights(admin);
  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
