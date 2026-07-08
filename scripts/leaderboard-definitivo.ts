import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  // 1. Recalcular todo
  const { data: matches } = await supabase.from("match_results").select("match_id");
  console.log(`Recalculando ${matches?.length ?? 0} matches...`);
  for (const m of matches || []) {
    await supabase.rpc("recalculate_match_scores", { p_match_id: m.match_id });
    await supabase.rpc("recalculate_match_mvp_scores", { p_match_id: m.match_id });
  }

  const { data: pools } = await supabase.from("pools").select("id, name").limit(1);
  const pool = pools?.[0];
  if (!pool) return;

  // 2. Traer TODAS las predicciones de score (paginación manual contra límite de 1000)
  let predictions: any[] = [];
  for (let i = 0; i < 20; i++) {
    const from = i * 500, to = from + 499;
    const { data: page } = await supabase
      .from("predictions")
      .select("profile_id, points_awarded, matches!inner(group_code)")
      .eq("pool_id", pool.id)
      .not("points_awarded", "is", null)
      .range(from, to);
    if (!page || page.length === 0) break;
    predictions = predictions.concat(page);
    if (page.length < 500) break;
  }

  // 3. Traer TODAS las predicciones MVP
  let mvps: any[] = [];
  for (let i = 0; i < 20; i++) {
    const from = i * 500, to = from + 499;
    const { data: page } = await supabase
      .from("match_mvp_predictions")
      .select("profile_id, points_awarded")
      .eq("pool_id", pool.id)
      .gt("points_awarded", 0)
      .range(from, to);
    if (!page || page.length === 0) break;
    mvps = mvps.concat(page);
    if (page.length < 500) break;
  }
  const mvpTotal: Record<string, number> = {};
  for (const m of mvps || []) {
    mvpTotal[m.profile_id] = (mvpTotal[m.profile_id] ?? 0) + (m.points_awarded ?? 0);
  }

  // 4. Acumular por perfil
  const leader: Record<string, { exacto: number; signo: number; clasif: number; threept: number; fallo: number; score: number }> = {};

  for (const p of predictions || []) {
    const id = p.profile_id;
    const pts = p.points_awarded ?? 0;
    const isGroup = p.matches?.group_code != null;

    if (!leader[id]) leader[id] = { exacto: 0, signo: 0, clasif: 0, threept: 0, fallo: 0, score: 0 };

    // Clasificar igual que lo hace queries.ts
    if (isGroup) {
      if (pts === 5) { leader[id].exacto++; leader[id].score += 5; }
      else if (pts === 2) { leader[id].signo++; leader[id].score += 2; }
      else leader[id].fallo++;
    } else {
      if (pts === 5) { leader[id].exacto++; leader[id].score += 5; }
      else if (pts === 3) { leader[id].threept++; leader[id].score += 3; }
      else if (pts === 2) { leader[id].clasif++; leader[id].score += 2; }
      else leader[id].fallo++;
    }
  }

  // 5. Traer nombres
  const ids = Object.keys(leader);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, display_name")
    .in("id", ids);

  const names: Record<string, string> = {};
  for (const p of profiles || []) {
    names[p.id] = p.display_name || p.username || p.id.slice(0, 8);
  }

  // 6. Ordenar y mostrar
  const sorted = Object.entries(leader)
    .map(([id, s]) => ({
      id,
      name: names[id] || id.slice(0, 8),
      exacto: s.exacto,
      signo: s.signo,
      clasif: s.clasif,
      threept: s.threept,
      fallo: s.fallo,
      score: s.score,
      mvp: mvpTotal[id] ?? 0,
      total: s.score + (mvpTotal[id] ?? 0),
    }))
    .sort((a, b) => b.total - a.total);

  console.log(`Predictions totales: ${predictions?.length}`);
  const hectorPreds = (predictions || []).filter((p: any) => p.profile_id === "29231466-19ad-4d4f-9402-1349a3dbec47");
  console.log(`Predicciones de Hector: ${hectorPreds.length}`);
  const hectorPts = hectorPreds.reduce((sum: number, p: any) => sum + (p.points_awarded ?? 0), 0);
  console.log(`Puntos de Hector (score): ${hectorPts}`);

  console.log(`\n=== LEADERBOARD ${pool.name} (${sorted.length} miembros) ===\n`);
  console.log(`${"#".padStart(2)} ${"Nombre".padEnd(22)} ${"Exacto".padStart(6)} ${"Signo".padStart(5)} ${"Clasif".padStart(6)} ${"3pts".padStart(4)} ${"Fallo".padStart(5)} │ ${"Score".padStart(5)} ${"MVP".padStart(3)} │ ${"Total".padStart(5)}`);

  for (let i = 0; i < sorted.length; i++) {
    const s = sorted[i];
    console.log(
      `${(i+1).toString().padStart(2)}. ${s.name.padEnd(22)} ` +
      `${s.exacto.toString().padStart(6)} ${s.signo.toString().padStart(5)} ${s.clasif.toString().padStart(6)} ${s.threept.toString().padStart(4)} ${s.fallo.toString().padStart(5)} │ ` +
      `${s.score.toString().padStart(5)} ${s.mvp.toString().padStart(3)} │ ${s.total.toString().padStart(5)}`
    );
  }
}

main().catch(console.error);
