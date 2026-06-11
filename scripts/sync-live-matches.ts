import { syncLiveMatches } from "@/lib/live/sync-live-matches";
import { createAdminClient } from "@/lib/scripts/supabase-admin";
import { syncAllMatchHighlights } from "@/lib/youtube/sync-highlights";

async function main() {
  const admin = createAdminClient();

  const live = await syncLiveMatches(admin);

  let highlights: Awaited<ReturnType<typeof syncAllMatchHighlights>> | null = null;
  let highlightsError: string | null = null;
  try {
    highlights = await syncAllMatchHighlights(admin);
  } catch (error) {
    highlightsError = error instanceof Error ? error.message : "youtube sync failed";
  }

  console.log(JSON.stringify({ live, highlights, highlightsError }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
