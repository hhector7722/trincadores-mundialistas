import { createAdminClient } from "@/lib/scripts/supabase-admin";

const USERNAME = "hector";
const HOME = "England";
const AWAY = "Argentina";
const HOME_GOALS = 2;
const AWAY_GOALS = 1;
const MVP_NAME = "Jude Bellingham";
const MVP_TEAM = "England";
const MVP_SHIRT = 10;

async function upsertPrediction(
  admin: ReturnType<typeof createAdminClient>,
  poolId: string,
  matchId: string,
  profileId: string,
  homeGoals: number,
  awayGoals: number
) {
  const { data: existing } = await admin
    .from("predictions")
    .select("id")
    .eq("match_id", matchId)
    .eq("profile_id", profileId)
    .eq("pool_id", poolId)
    .maybeSingle();

  const payload = {
    home_goals: homeGoals,
    away_goals: awayGoals,
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
    home_goals: homeGoals,
    away_goals: awayGoals,
  });
  if (error) throw new Error(`predictions insert: ${error.message}`);
}

async function upsertMvpPrediction(
  admin: ReturnType<typeof createAdminClient>,
  poolId: string,
  matchId: string,
  profileId: string,
  playerName: string,
  teamName: string,
  shirtNumber: number
) {
  const { data: existing } = await admin
    .from("match_mvp_predictions")
    .select("id")
    .eq("match_id", matchId)
    .eq("profile_id", profileId)
    .eq("pool_id", poolId)
    .maybeSingle();

  const payload = {
    player_name: playerName,
    team_name: teamName,
    shirt_number: shirtNumber,
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

  const { data: match, error: matchError } = await admin
    .from("matches")
    .select("id, home_team, away_team")
    .or(`and(home_team.eq.${HOME},away_team.eq.${AWAY}),and(home_team.eq.${AWAY},away_team.eq.${HOME})`)
    .maybeSingle();

  if (matchError || !match) {
    throw new Error(matchError?.message ?? `No se encontró ${HOME} vs ${AWAY}.`);
  }

  console.log(`Partido encontrado: ${match.home_team} vs ${match.away_team}`);

  const isHome = match.home_team === HOME;
  const homeGoals = isHome ? HOME_GOALS : AWAY_GOALS;
  const awayGoals = isHome ? AWAY_GOALS : HOME_GOALS;

  console.log(
    `Guardando pronóstico: ${match.home_team} ${homeGoals} - ${awayGoals} ${match.away_team}, MVP: ${MVP_NAME}`
  );
  await upsertPrediction(admin, pool.id, match.id, profile.id, homeGoals, awayGoals);
  await upsertMvpPrediction(admin, pool.id, match.id, profile.id, MVP_NAME, MVP_TEAM, MVP_SHIRT);
  console.log("Completado.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
