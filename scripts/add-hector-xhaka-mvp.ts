import { createAdminClient } from "@/lib/scripts/supabase-admin";

async function main() {
  const admin = createAdminClient();

  const HOME = "Switzerland";
  const AWAY = "Canada";
  const USERNAME = "hector";

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

  const { data: switzSquad, error: switzSquadError } = await admin
    .from("team_squads")
    .select("id")
    .eq("team_name", "Switzerland")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!switzSquad) {
      throw new Error("No se encontró squad de Suiza");
  }

  const { data: players, error: playersError } = await admin
    .from("team_squad_players")
    .select("id, player_name, shirt_number")
    .eq("squad_id", switzSquad.id)
    .ilike("player_name", "%Xhaka%");

  if (playersError || !players || players.length === 0) {
      throw new Error("No se encontró a Xhaka en la squad");
  }

  const xhaka = players[0];
  console.log("Encontrado a", xhaka.player_name, "dorsal", xhaka.shirt_number);

  // Intentamos un upsert o insert+update? Mejor revisamos si ya hay prediccion
  const { data: existing } = await admin
    .from("match_mvp_predictions")
    .select("id")
    .eq("match_id", match.id)
    .eq("profile_id", profile.id)
    .eq("pool_id", pool.id)
    .maybeSingle();

  if (existing) {
    console.log("Actualizando...");
    await admin
      .from("match_mvp_predictions")
      .update({
        player_name: xhaka.player_name,
        team_name: "Switzerland",
        shirt_number: xhaka.shirt_number,
        updated_at: new Date().toISOString()
      })
      .eq("id", existing.id);
  } else {
      console.log("Insertando...");
      await admin.from("match_mvp_predictions").insert({
          match_id: match.id,
          profile_id: profile.id,
          pool_id: pool.id,
          player_name: xhaka.player_name,
          team_name: "Switzerland",
          shirt_number: xhaka.shirt_number
      });
  }

  console.log("Completado.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
