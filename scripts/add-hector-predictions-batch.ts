import { createAdminClient } from "@/lib/scripts/supabase-admin";

const USERNAME = "hector";

const PREDICTIONS = [
  {
    home: "Croatia",
    away: "Ghana",
    homeGoals: 1,
    awayGoals: 1,
    mvpNameSearch: "%Modric%",
    mvpTeam: "Croatia"
  },
  {
    home: "Panama",
    away: "England",
    homeGoals: 0,
    awayGoals: 2,
    mvpNameSearch: "%Kane%",
    mvpTeam: "England"
  }
];

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

  for (const pred of PREDICTIONS) {
    console.log(`Procesando ${pred.home} vs ${pred.away}...`);
    
    const { data: match, error: matchError } = await admin
      .from("matches")
      .select("id, home_team, away_team")
      .eq("home_team", pred.home)
      .eq("away_team", pred.away)
      .maybeSingle();

    if (matchError || !match) {
      console.error(`No se encontró ${pred.home} vs ${pred.away}. Verifica los nombres.`);
      continue;
    }

    const { data: squad } = await admin
      .from("team_squads")
      .select("id")
      .eq("team_name", pred.mvpTeam)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!squad) {
      console.error(`No se encontró squad de ${pred.mvpTeam}`);
      continue;
    }

    const { data: players } = await admin
      .from("team_squad_players")
      .select("id, player_name, shirt_number")
      .eq("squad_id", squad.id)
      .ilike("player_name", pred.mvpNameSearch);

    if (!players || players.length === 0) {
      console.error(`No se encontró jugador con nombre ${pred.mvpNameSearch} en ${pred.mvpTeam}`);
      continue;
    }

    const mvpPlayer = players[0];
    console.log(`  MVP encontrado: ${mvpPlayer.player_name} (#${mvpPlayer.shirt_number})`);

    await upsertPrediction(admin, pool.id, match.id, profile.id, pred.homeGoals, pred.awayGoals);
    await upsertMvpPrediction(admin, pool.id, match.id, profile.id, mvpPlayer.player_name, pred.mvpTeam, mvpPlayer.shirt_number);
    
    console.log(`  Guardado con éxito!`);
  }

  console.log("Completado.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
