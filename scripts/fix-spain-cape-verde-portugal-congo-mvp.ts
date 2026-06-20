import { correctOfficialMvpForMatch } from "@/lib/live/sync-official-mvp";
import { createAdminClient } from "@/lib/scripts/supabase-admin";

const FIXES = [
  {
    home: "Spain",
    away: "Cape Verde",
    player: "Vozinha",
    team: "Cape Verde",
  },
  {
    home: "Portugal",
    away: "DR Congo",
    player: "Joao Neves",
    team: "Portugal",
  },
] as const;

async function main() {
  const admin = createAdminClient();

  for (const fix of FIXES) {
    const { data: match, error } = await admin
      .from("matches")
      .select(
        "id, home_team, away_team, match_results(home_goals, away_goals, mvp_player_name, mvp_team_name)",
      )
      .eq("home_team", fix.home)
      .eq("away_team", fix.away)
      .maybeSingle();

    if (error || !match) {
      throw new Error(error?.message ?? `No se encontró ${fix.home} vs ${fix.away}.`);
    }

    const results = Array.isArray(match.match_results)
      ? match.match_results[0]
      : match.match_results;

    console.log(`\n${fix.home} vs ${fix.away} — antes:`, {
      matchId: match.id,
      score: results ? `${results.home_goals}-${results.away_goals}` : null,
      mvp: results?.mvp_player_name,
      team: results?.mvp_team_name,
    });

    const outcome = await correctOfficialMvpForMatch(
      admin,
      match.id,
      fix.player,
      fix.team,
    );

    if (!outcome.ok) {
      throw new Error(`${fix.home} vs ${fix.away}: ${outcome.error}`);
    }

    const { data: after } = await admin
      .from("match_results")
      .select("mvp_player_name, mvp_team_name")
      .eq("match_id", match.id)
      .maybeSingle();

    console.log("Después:", after);
    console.log("Pools reconstruidos:", outcome.poolIds);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
