/**
 * Refresca alineaciones confirmadas en partidos live/finished del torneo.
 * Uso: npx tsx --env-file=.env.local scripts/backfill-confirmed-lineups.ts
 */
import { resolveMatchLineups } from "@/lib/lineup/resolve-lineup";
import { createAdminClient } from "@/lib/scripts/supabase-admin";
import { getTeamSquadByName } from "@/lib/worldcup-data/squad-queries";

async function main() {
  const admin = createAdminClient();
  const { data: matches, error } = await admin
    .from("matches")
    .select("id, home_team, away_team, kickoff_at, status")
    .in("status", ["live", "finished"])
    .gte("kickoff_at", "2026-06-11T00:00:00.000Z")
    .order("kickoff_at", { ascending: true });

  if (error) throw new Error(error.message);

  const result = {
    matchesScanned: matches?.length ?? 0,
    updated: 0,
    errors: [] as string[],
  };

  for (const match of matches ?? []) {
    try {
      const [homeSquad, awaySquad] = await Promise.all([
        getTeamSquadByName(admin, match.home_team),
        getTeamSquadByName(admin, match.away_team),
      ]);

      await resolveMatchLineups(
        admin,
        match.id,
        match.home_team,
        match.away_team,
        homeSquad?.players ?? [],
        awaySquad?.players ?? [],
        { notifyConfirmedLineup: false }
      );

      result.updated += 1;
      console.log(`OK ${match.status} ${match.home_team} vs ${match.away_team}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      result.errors.push(`${match.id}: ${message}`);
      console.error(`ERR ${match.home_team} vs ${match.away_team}: ${message}`);
    }
  }

  console.log(JSON.stringify(result, null, 2));
  if (result.errors.length > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
