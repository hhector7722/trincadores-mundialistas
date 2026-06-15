import { createAdminClient } from "@/lib/scripts/supabase-admin";

const HOME = "Belgium";
const AWAY = "Egypt";
const USERNAME = "hector";
const HOME_GOALS = 2;
const AWAY_GOALS = 0;
const MVP_PLAYER = "Jeremy Doku";
const MVP_TEAM = "Belgium";
const MVP_SHIRT = 11;

async function main() {
  const admin = createAdminClient();

  const { data: match, error: matchError } = await admin
    .from("matches")
    .select("id, home_team, away_team")
    .eq("home_team", HOME)
    .eq("away_team", AWAY)
    .maybeSingle();

  if (matchError || !match) {
    throw new Error(matchError?.message ?? `No se encontró ${HOME} vs ${AWAY}.`);
  }

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("id, username")
    .eq("username", USERNAME)
    .maybeSingle();

  if (profileError || !profile) {
    throw new Error(profileError?.message ?? `Perfil ${USERNAME} no encontrado.`);
  }

  const { data: pool, error: poolError } = await admin.from("pools").select("id").limit(1).maybeSingle();
  if (poolError || !pool) {
    throw new Error(poolError?.message ?? "Pool no encontrado.");
  }

  const { data: beforeScore } = await admin
    .from("predictions")
    .select("home_goals, away_goals")
    .eq("match_id", match.id)
    .eq("profile_id", profile.id)
    .eq("pool_id", pool.id)
    .maybeSingle();

  const { data: beforeMvp } = await admin
    .from("match_mvp_predictions")
    .select("player_name, team_name, shirt_number")
    .eq("match_id", match.id)
    .eq("profile_id", profile.id)
    .eq("pool_id", pool.id)
    .maybeSingle();

  console.log("Marcador antes:", beforeScore);
  console.log("MVP antes:", beforeMvp);

  const { error: scoreError } = await admin
    .from("predictions")
    .update({
      home_goals: HOME_GOALS,
      away_goals: AWAY_GOALS,
      updated_at: new Date().toISOString(),
    })
    .eq("match_id", match.id)
    .eq("profile_id", profile.id)
    .eq("pool_id", pool.id);

  if (scoreError) {
    throw new Error(`predictions: ${scoreError.message}`);
  }

  const { error: mvpError } = await admin
    .from("match_mvp_predictions")
    .update({
      player_name: MVP_PLAYER,
      team_name: MVP_TEAM,
      shirt_number: MVP_SHIRT,
      updated_at: new Date().toISOString(),
    })
    .eq("match_id", match.id)
    .eq("profile_id", profile.id)
    .eq("pool_id", pool.id);

  if (mvpError) {
    throw new Error(`match_mvp_predictions: ${mvpError.message}`);
  }

  const { data: afterScore } = await admin
    .from("predictions")
    .select("home_goals, away_goals")
    .eq("match_id", match.id)
    .eq("profile_id", profile.id)
    .eq("pool_id", pool.id)
    .maybeSingle();

  const { data: afterMvp } = await admin
    .from("match_mvp_predictions")
    .select("player_name, team_name, shirt_number")
    .eq("match_id", match.id)
    .eq("profile_id", profile.id)
    .eq("pool_id", pool.id)
    .maybeSingle();

  console.log("Marcador después:", afterScore);
  console.log("MVP después:", afterMvp);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
