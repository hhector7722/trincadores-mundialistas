import { isMvpPredictionCorrect } from "@/lib/predictions/prediction-outcome";
import { createAdminClient } from "@/lib/scripts/supabase-admin";

const MATCH_ID = "86aed0cd-a69f-450a-b672-697f5cf1e478";

async function main() {
  const admin = createAdminClient();

  const { data: result } = await admin
    .from("match_results")
    .select("home_goals, away_goals, mvp_player_name, mvp_team_name")
    .eq("match_id", MATCH_ID)
    .maybeSingle();

  const { data: preds, error } = await admin
    .from("match_mvp_predictions")
    .select("pool_id, profile_id, player_name, team_name, shirt_number, points_awarded, profiles(display_name, username)")
    .eq("match_id", MATCH_ID)
    .order("points_awarded", { ascending: false });

  if (error) throw error;

  console.log("Resultado oficial:", result);
  console.log("Total predicciones MVP:", preds?.length ?? 0);

  const rows = (preds ?? []).map((p) => {
    const profile = Array.isArray(p.profiles) ? p.profiles[0] : p.profiles;
    const expected = isMvpPredictionCorrect(
      p.player_name,
      p.team_name,
      result?.mvp_player_name,
      result?.mvp_team_name,
    )
      ? 1
      : 0;
    const ok = p.points_awarded === expected;
    return {
      alias: profile?.display_name ?? profile?.username ?? p.profile_id,
      player: p.player_name,
      team: p.team_name,
      dorsal: p.shirt_number,
      points: p.points_awarded,
      expected,
      ok,
    };
  });

  console.log(JSON.stringify(rows, null, 2));

  const wrong = rows.filter((r) => !r.ok);
  const hits = rows.filter((r) => r.expected === 1);
  console.log("Aciertos esperados:", hits.length);
  console.log("Filas con puntuacion incorrecta:", wrong.length);
  if (wrong.length) console.log("Incorrectas:", wrong);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
