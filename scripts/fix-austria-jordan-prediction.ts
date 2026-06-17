import { createAdminClient } from "@/lib/scripts/supabase-admin";

const HOME = "Austria";
const AWAY = "Jordan";
const USERNAME = "hector";
const HOME_GOALS = 1;
const AWAY_GOALS = 0;
const MVP_PLAYER = "Marcel Sabitzer";
const MVP_TEAM = "Austria";
const MVP_SHIRT = 9;

async function upsertPrediction(
  admin: ReturnType<typeof createAdminClient>,
  poolId: string,
  matchId: string,
  profileId: string
) {
  const { data: existing } = await admin
    .from("predictions")
    .select("id")
    .eq("match_id", matchId)
    .eq("profile_id", profileId)
    .eq("pool_id", poolId)
    .maybeSingle();

  const payload = {
    home_goals: HOME_GOALS,
    away_goals: AWAY_GOALS,
    updated_at: new Date().toISOString(),
  };

  if (existing?.id) {
    const { error } = await admin
      .from("predictions")
      .update(payload)
      .eq("id", existing.id);
    if (error) throw new Error(`predictions update: ${error.message}`);
    return;
  }

  const { error } = await admin.from("predictions").insert({
    pool_id: poolId,
    match_id: matchId,
    profile_id: profileId,
    home_goals: HOME_GOALS,
    away_goals: AWAY_GOALS,
  });
  if (error) throw new Error(`predictions insert: ${error.message}`);
}

async function upsertMvpPrediction(
  admin: ReturnType<typeof createAdminClient>,
  poolId: string,
  matchId: string,
  profileId: string
) {
  const { data: existing } = await admin
    .from("match_mvp_predictions")
    .select("id")
    .eq("match_id", matchId)
    .eq("profile_id", profileId)
    .eq("pool_id", poolId)
    .maybeSingle();

  const payload = {
    player_name: MVP_PLAYER,
    team_name: MVP_TEAM,
    shirt_number: MVP_SHIRT,
    updated_at: new Date().toISOString(),
  };

  if (existing?.id) {
    const { error } = await admin
      .from("match_mvp_predictions")
      .update(payload)
      .eq("id", existing.id);
    if (error) throw new Error(`match_mvp_predictions update: ${error.message}`);
    return;
  }

  const { error } = await admin.from("match_mvp_predictions").insert({
    pool_id: poolId,
    match_id: matchId,
    profile_id: profileId,
    ...payload,
  });
  if (error) throw new Error(`match_mvp_predictions insert: ${error.message}`);
}

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

  console.log("Marcador antes:", beforeScore ?? "(sin pronóstico)");
  console.log("MVP antes:", beforeMvp ?? "(sin MVP)");

  await upsertPrediction(admin, pool.id, match.id, profile.id);
  await upsertMvpPrediction(admin, pool.id, match.id, profile.id);

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
