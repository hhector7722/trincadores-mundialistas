import { createClient } from "@/lib/supabase/server";

export type GeneralPredictionProbabilityRow = {
  id: string;
  categoryLabel: string;
  selectionName: string | null;
  probability: number | null; // 0 to 1
};

export async function getMyGeneralPredictionsWithProbabilities(
  poolId: string,
  profileId: string
): Promise<GeneralPredictionProbabilityRow[]> {
  const supabase = await createClient();

  const { data: prediction } = await supabase
    .from("tournament_general_predictions")
    .select("*")
    .eq("pool_id", poolId)
    .eq("profile_id", profileId)
    .maybeSingle();

  if (!prediction) {
    return [];
  }

  // Obtenemos todas las probabilidades cacheadas
  const { data: probs } = await supabase
    .from("dynamic_probabilities")
    .select("category, selection_key, probability");

  const probMap = new Map<string, number>();
  if (probs) {
    for (const p of probs) {
      // category_selectionKey -> probability
      probMap.set(`${p.category}_${p.selection_key}`, p.probability);
    }
  }

  const rows: GeneralPredictionProbabilityRow[] = [];

  const addRow = (categoryId: string, label: string, selection: string | null) => {
    if (!selection) return;
    const prob = probMap.get(`${categoryId}_${selection}`) ?? null;
    rows.push({
      id: categoryId,
      categoryLabel: label,
      selectionName: selection,
      probability: prob,
    });
  };

  addRow("champion", "Campeón", prediction.champion_team);
  addRow("final", "Finalista A", prediction.finalist_team_a);
  addRow("final", "Finalista B", prediction.finalist_team_b);
  addRow("top_scorer", "Máx. Goleador", prediction.top_scorer_player_name);
  addRow("mvp", "MVP", prediction.tournament_mvp_player_name);
  addRow("golden_glove", "Mejor Portero", prediction.golden_glove_player_name);

  return rows;
}
