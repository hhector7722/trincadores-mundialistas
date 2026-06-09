/**
 * Reinicia los pronósticos generales del Mundial de un participante.
 * Uso: npx tsx --env-file=.env.local scripts/reset-tournament-general-predictions.ts <username>
 */
import { createAdminClient } from "../lib/scripts/supabase-admin";

async function main() {
  const username = process.argv[2]?.trim().toLowerCase();
  if (!username) {
    throw new Error(
      "Uso: npx tsx --env-file=.env.local scripts/reset-tournament-general-predictions.ts <username>"
    );
  }

  const admin = createAdminClient();

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("id, username, display_name")
    .eq("username", username)
    .maybeSingle();

  if (profileError) throw profileError;
  if (!profile) {
    throw new Error(`Perfil no encontrado: ${username}`);
  }

  const { data: before } = await admin
    .from("tournament_general_predictions")
    .select(
      "pool_id, champion_team, finalist_team_a, finalist_team_b, top_scorer_player_name, tournament_mvp_player_name, golden_glove_player_name"
    )
    .eq("profile_id", profile.id)
    .maybeSingle();

  const { error: scoresError } = await admin
    .from("tournament_general_prediction_scores")
    .delete()
    .eq("profile_id", profile.id);

  if (scoresError) throw scoresError;

  const { error: predictionsError } = await admin
    .from("tournament_general_predictions")
    .delete()
    .eq("profile_id", profile.id);

  if (predictionsError) throw predictionsError;

  console.log(
    `Pronósticos generales reiniciados: ${profile.display_name} (${profile.username})`
  );
  if (before) {
    console.log("Estado anterior:", before);
  } else {
    console.log("No había fila en tournament_general_predictions.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
