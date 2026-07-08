import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const hectorId = "29231466-19ad-4d4f-9402-1349a3dbec47";

  // Fresh recalc
  const { data: matches } = await supabase.from("match_results").select("match_id");
  console.log(`Recalculando ${matches?.length ?? 0} matches...`);
  for (const m of matches || []) await supabase.rpc("recalculate_match_scores", { p_match_id: m.match_id });

  const { data: pools } = await supabase.from("pools").select("id").limit(1);
  const poolId = pools?.[0]?.id;

  // All predictions with full detail — no order on nested table
  const { data: predictions } = await supabase
    .from("predictions")
    .select(`
      match_id, home_goals, away_goals, advancing_team, points_awarded,
      matches!inner(home_team, away_team, group_code, kickoff_at, status)
    `)
    .eq("profile_id", hectorId)
    .eq("pool_id", poolId);

  // Match results
  const mids = [...new Set((predictions || []).map(p => p.match_id))];
  const { data: results } = await supabase
    .from("match_results")
    .select("match_id, home_goals, away_goals, penalty_home, penalty_away")
    .in("match_id", mids);
  const rm = new Map((results || []).map(r => [r.match_id, r]));

  // Get match details separately for ordering
  const { data: matchDetails } = await supabase
    .from("matches")
    .select("id, home_team, away_team, kickoff_at")
    .in("id", mids);
  const matchKickoff = new Map((matchDetails || []).map(m => [m.id, m.kickoff_at]));

  // MVP predictions — no join, just query
  const { data: mvps } = await supabase
    .from("match_mvp_predictions")
    .select("match_id, player_name, team_name, points_awarded")
    .eq("profile_id", hectorId)
    .eq("pool_id", poolId);
  const mvpMap = new Map((mvps || []).map(m => [m.match_id, m]));

  // Sort predictions by kickoff
  const sorted = (predictions || []).sort((a, b) => {
    const ka = matchKickoff.get(a.match_id) ?? "";
    const kb = matchKickoff.get(b.match_id) ?? "";
    return ka.localeCompare(kb);
  });

  // Also get match team names from match_results matches for MVP display
  const { data: matchTeams } = await supabase.from("matches").select("id, home_team, away_team").in("id", mids);
  const teamNames = new Map((matchTeams || []).map((m: any) => [m.id, { home: m.home_team, away: m.away_team }]));

  console.log("\n=== DETALLE COMPLETO DE HECTOR PARTIDO POR PARTIDO ===\n");

  let totalScore = 0, totalMvp = 0;
  let exact = 0, signo = 0, clasif = 0, tres = 0, fallo = 0;

  for (const p of sorted) {
    const m = p.matches as any;
    const r = rm.get(p.match_id);
    const mvp = mvpMap.get(p.match_id);
    const isKo = m.group_code === null;
    const ko = matchKickoff.get(p.match_id);
    const fecha = ko?.slice(0,10) ?? "?";
    const matchName = `${m.home_team} vs ${m.away_team}`;
    const predStr = `${p.home_goals}-${p.away_goals}${p.advancing_team ? ` adv=${p.advancing_team}` : ""}`;
    const resStr = r ? `${r.home_goals}-${r.away_goals}${r.penalty_home != null ? ` (pen ${r.penalty_home}-${r.penalty_away})` : ""}` : "—";
    const pts = p.points_awarded ?? 0;

    let label: string;
    if (isKo) {
      if (pts === 5) { label = "EXACTO+CLASIF"; exact++; }
      else if (pts === 3) { label = "3PTS"; tres++; }
      else if (pts === 2) { label = "CLASIF"; clasif++; }
      else { label = "FALLO"; fallo++; }
    } else {
      if (pts === 5) { label = "EXACTO"; exact++; }
      else if (pts === 2) { label = "SIGNO"; signo++; }
      else { label = "FALLO"; fallo++; }
    }

    const fase = isKo ? "ELIM" : "GRUP";
    const mvpPts = mvp?.points_awarded ?? 0;
    const mvpStr = mvpPts > 0 ? ` | MVP: ${mvp.player_name} (${mvp.team_name}) → ${mvpPts} pts` : "";

    totalScore += pts;
    totalMvp += mvpPts;

    console.log(`${fecha} [${fase}] ${matchName.padEnd(38)} pred=${predStr.padEnd(18)} res=${resStr.padEnd(20)} → ${label.padEnd(20)} (${pts} pts)${mvpStr}`);
  }

  console.log(`\nTotal predicciones impresas: ${sorted.length}`);

  console.log(`\n=== RESUMEN ===`);
  console.log(`  Score predictions: ${totalScore} pts`);
  console.log(`    ${exact} exacto${exact !== 1 ? "s" : ""} x5 = ${exact * 5}`);
  console.log(`    ${signo} signo x2 = ${signo * 2}`);
  console.log(`    ${clasif} clasif x2 = ${clasif * 2}`);
  console.log(`    ${tres} de 3pts x3 = ${tres * 3}`);
  console.log(`    ${fallo} fallos x0`);
  console.log(`  MVP:              ${totalMvp} pts`);
  console.log(`  TOTAL:            ${totalScore + totalMvp} pts`);
}

main().catch(console.error);
