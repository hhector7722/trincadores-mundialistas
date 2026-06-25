import { createAdminClient } from "@/lib/scripts/supabase-admin";

async function main() {
  const admin = createAdminClient();

  const TEAM_1 = "South Africa";
  const TEAM_2 = "South Korea";
  const USERNAME = "hector";

  const { data: matches, error: matchError } = await admin
    .from("matches")
    .select("id, home_team, away_team")
    .or(`and(home_team.eq."${TEAM_1}",away_team.eq."${TEAM_2}"),and(home_team.eq."${TEAM_2}",away_team.eq."${TEAM_1}")`)
    .limit(1);

  if (matchError || !matches || matches.length === 0) {
    throw new Error(matchError?.message ?? `No se encontró ${TEAM_1} vs ${TEAM_2}.`);
  }

  const match = matches[0];

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

  const { data: koreaSquad, error: koreaSquadError } = await admin
    .from("team_squads")
    .select("id")
    .eq("team_name", "South Korea")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!koreaSquad) {
      throw new Error("No se encontró squad de South Korea");
  }

  const { data: players, error: playersError } = await admin
    .from("team_squad_players")
    .select("id, player_name, shirt_number")
    .eq("squad_id", koreaSquad.id)
    .ilike("player_name", "%Kang-in%");

  if (playersError || !players || players.length === 0) {
      // Intentamos con solo Kang
      const { data: fallbackPlayers } = await admin
        .from("team_squad_players")
        .select("id, player_name, shirt_number")
        .eq("squad_id", koreaSquad.id)
        .ilike("player_name", "%Kang%in%");
      
      if (!fallbackPlayers || fallbackPlayers.length === 0) {
        throw new Error("No se encontró a Lee Kang-in en la squad");
      }
      players.push(...fallbackPlayers);
  }

  const kangIn = players[0];
  console.log("Encontrado a", kangIn.player_name, "dorsal", kangIn.shirt_number);

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
        player_name: kangIn.player_name,
        team_name: "South Korea",
        shirt_number: kangIn.shirt_number,
        updated_at: new Date().toISOString()
      })
      .eq("id", existing.id);
  } else {
      console.log("Insertando...");
      await admin.from("match_mvp_predictions").insert({
          match_id: match.id,
          profile_id: profile.id,
          pool_id: pool.id,
          player_name: kangIn.player_name,
          team_name: "South Korea",
          shirt_number: kangIn.shirt_number
      });
  }

  console.log("Completado.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
