import { fetchFotmobLiveBundle } from "./lib/live/sources/fotmob-live";
import { syncLiveMatches } from "./lib/live/sync-live-matches";
import { createAdminClient } from "./lib/scripts/supabase-admin";

async function run() {
  console.log("Fetching bundle for 4653705...");
  const bundle = await fetchFotmobLiveBundle(4653705);
  console.log(JSON.stringify(bundle, null, 2));

  console.log("Running syncLiveMatches...");
  try {
    const admin = createAdminClient();
    const res = await syncLiveMatches(admin, Date.now());
    console.log("Sync Results:", res);
  } catch(e) {
    console.error("Sync Error:", e);
  }
}

run();
