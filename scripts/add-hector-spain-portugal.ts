import { createAdminClient } from "@/lib/scripts/supabase-admin";

const USERNAME = "hector";
const TEAM_1 = "Spain";
const TEAM_2 = "Portugal";
const TEAM_1_GOALS = 2;
const TEAM_2_GOALS = 1;
const MVP_NAME_SEARCH = "%Yamal%";
const MVP_TEAM = "Spain";

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

  // Find match
  const { data: matches, error: matchError } = await admin
    .from("matches")
    .select("id, home_team, away_team")
    .or(`and(home_team.eq.${TEAM_1},away_team.eq.${TEAM_2}),and(home_team.eq.${TEAM_2},away_team.eq.${TEAM_1})`);

  if (matchError || !matches || matches.length === 0) {
    throw new Error(matchError?.message ?? `No se encontró el partido entre ${TEAM_1} y ${TEAM_2}.`);
  }

  const match = matches[0];
  console.log(`Encontrado partido: ${match.home_team} vs ${match.away_team}`);

  const isHomeTeam1 = match.home_team === TEAM_1;
  const homeGoals = isHomeTeam1 ? TEAM_1_GOALS : TEAM_2_GOALS;
  const awayGoals = isHomeTeam1 ? TEAM_2_GOALS : TEAM_1_GOALS;

  // Find MVP player
  const { data: squad } = await admin
    .from("team_squads")
    .select("id")
    .eq("team_name", MVP_TEAM)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!squad) {
    throw new Error(`No se encontró squad de ${MVP_TEAM}`);
  }

  const { data: players } = await admin
    .from("team_squad_players")
    .select("id, player_name, shirt_number")
    .eq("squad_id", squad.id)
    .ilike("player_name", MVP_NAME_SEARCH);

  if (!players || players.length === 0) {
    throw new Error(`No se encontró jugador con nombre ${MVP_NAME_SEARCH} en ${MVP_TEAM}`);
  }

  const mvpPlayer = players[0];
  console.log(`MVP encontrado: ${mvpPlayer.player_name} (#${mvpPlayer.shirt_number})`);

  console.log(`Guardando pronóstico: ${match.home_team} ${homeGoals} - ${awayGoals} ${match.away_team}, MVP: ${mvpPlayer.player_name}`);

  await upsertPrediction(admin, pool.id, match.id, profile.id, homeGoals, awayGoals);
  await upsertMvpPrediction(admin, pool.id, match.id, profile.id, mvpPlayer.player_name, MVP_TEAM, mvpPlayer.shirt_number);

  console.log("Completado.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
