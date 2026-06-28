import { fetchFotmobLiveBundle } from "./lib/live/sources/fotmob-live";
import { syncLiveMatches } from "./lib/live/sync-live-matches";
import { createAdminClient } from "./lib/scripts/supabase-admin";

async function run() {
  console.log("Running syncLiveMatches...");
  try {
    const admin = createAdminClient();
    const res = await syncLiveMatches(admin, Date.now());
    console.log("Sync Results:", res);
    
    if (res.errors && res.errors.length > 0) {
      console.error("Errors encountered:", res.errors);
    }
  } catch(e) {
    console.error("Fatal Sync Error:", e);
  }
}

run();
