/**
 * Precalienta alineaciones probables (BSD) en match_team_lineups.
 * Uso: npx tsx --env-file=.env.local scripts/prewarm-lineups.ts
 */
import { prewarmUpcomingLineups } from "@/lib/lineup/prewarm-lineups";
import { createAdminClient } from "@/lib/scripts/supabase-admin";

async function main() {
  const admin = createAdminClient();
  const result = await prewarmUpcomingLineups(admin, Date.now(), {
    notifyConfirmedLineup: false,
  });
  console.log(JSON.stringify(result, null, 2));
  if (result.errors.length > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
