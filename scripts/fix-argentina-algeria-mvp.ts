import { correctOfficialMvpForMatch } from "@/lib/live/sync-official-mvp";
import { createAdminClient } from "@/lib/scripts/supabase-admin";

const HOME = "Argentina";
const AWAY = "Algeria";
const OFFICIAL_PLAYER = "Lionel Messi";
const OFFICIAL_TEAM = "Argentina";

async function main() {
  const admin = createAdminClient();

  const { data: match, error } = await admin
    .from("matches")
    .select("id, home_team, away_team, match_results(home_goals, away_goals, mvp_player_name, mvp_team_name)")
    .eq("home_team", HOME)
    .eq("away_team", AWAY)
    .maybeSingle();

  if (error || !match) {
    throw new Error(error?.message ?? `No se encontró ${HOME} vs ${AWAY}.`);
  }

  const results = Array.isArray(match.match_results)
    ? match.match_results[0]
    : match.match_results;

  console.log("Antes:", {
    matchId: match.id,
    score: results ? `${results.home_goals}-${results.away_goals}` : null,
    mvp: results?.mvp_player_name,
    team: results?.mvp_team_name,
  });

  const outcome = await correctOfficialMvpForMatch(
    admin,
    match.id,
    OFFICIAL_PLAYER,
    OFFICIAL_TEAM,
  );

  if (!outcome.ok) {
    throw new Error(outcome.error);
  }

  const { data: after } = await admin
    .from("match_results")
    .select("mvp_player_name, mvp_team_name")
    .eq("match_id", match.id)
    .maybeSingle();

  console.log("Después:", after);
  console.log("Pools reconstruidos:", outcome.poolIds);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
