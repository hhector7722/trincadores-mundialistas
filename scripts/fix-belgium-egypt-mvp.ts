import { createAdminClient } from "@/lib/scripts/supabase-admin";

const HOME = "Belgium";
const AWAY = "Egypt";
const USERNAME = "hector";
const MVP_PLAYER = "Mostafa Ahmed Shobeir";
const MVP_TEAM = "Egypt";
const MVP_SHIRT = 23;
const SQUAD_NEW = "Mostafa Ahmed Shobeir";

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

  const { data: beforeMvp } = await admin
    .from("match_mvp_predictions")
    .select("player_name, team_name, shirt_number")
    .eq("match_id", match.id)
    .eq("profile_id", profile.id)
    .eq("pool_id", pool.id)
    .maybeSingle();

  console.log("MVP antes:", beforeMvp);

  const { data: egyptSquad, error: egyptSquadError } = await admin
    .from("team_squads")
    .select("id")
    .eq("team_name", MVP_TEAM)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (egyptSquadError) {
    throw new Error(egyptSquadError.message);
  }

  if (egyptSquad?.id) {
    const { data: squadPlayer, error: squadReadError } = await admin
      .from("team_squad_players")
      .select("id, player_name")
      .eq("squad_id", egyptSquad.id)
      .eq("shirt_number", MVP_SHIRT)
      .maybeSingle();

    if (squadReadError) {
      throw new Error(squadReadError.message);
    }

    if (squadPlayer?.id && squadPlayer.player_name !== SQUAD_NEW) {
      const { error: squadUpdateError } = await admin
        .from("team_squad_players")
        .update({ player_name: SQUAD_NEW })
        .eq("id", squadPlayer.id);

      if (squadUpdateError) {
        throw new Error(`team_squad_players: ${squadUpdateError.message}`);
      }
      console.log("Plantilla actualizada:", squadPlayer.player_name, "→", SQUAD_NEW);
    } else {
      console.log("Plantilla:", squadPlayer?.player_name ?? "sin dorsal 23");
    }
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

  const { data: afterMvp } = await admin
    .from("match_mvp_predictions")
    .select("player_name, team_name, shirt_number")
    .eq("match_id", match.id)
    .eq("profile_id", profile.id)
    .eq("pool_id", pool.id)
    .maybeSingle();

  console.log("MVP después:", afterMvp);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
