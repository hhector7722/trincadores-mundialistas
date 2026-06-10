/**
 * Diagnóstico: tiempos de alineación y escritura en match_team_lineups.
 * Uso: npx tsx --env-file=.env.local scripts/bench-lineup-cache.ts Spain
 */
import { createClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/scripts/supabase-admin";
import { resolveTeamLineup } from "@/lib/lineup/resolve-lineup";
import { loadCachedTeamLineup } from "@/lib/lineup/lineup-queries";
import { getTeamSquadByName } from "@/lib/worldcup-data/squad-queries";
import { fetchBsdPredictedLineup, isBsdConfigured } from "@/lib/lineup/sources/bsd-client";

const team = process.argv[2]?.trim() ?? "Spain";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const authClient = createClient(url, anon);
  const admin = createAdminClient();

  console.log("BSD configured:", isBsdConfigured());

  const { count } = await admin
    .from("match_team_lineups")
    .select("*", { count: "exact", head: true });
  console.log("match_team_lineups rows (admin):", count ?? 0);

  const squad = await getTeamSquadByName(admin, team);
  if (!squad) {
    console.error("Sin plantilla para", team);
    process.exit(1);
  }

  const { data: match } = await admin
    .from("matches")
    .select("id, home_team, away_team, kickoff_at")
    .or(`home_team.eq.${team},away_team.eq.${team}`)
    .eq("status", "scheduled")
    .order("kickoff_at")
    .limit(1)
    .maybeSingle();

  if (!match) {
    console.error("Sin partido scheduled para", team);
    process.exit(1);
  }

  console.log("Match:", match.id, match.home_team, "vs", match.away_team);

  const bsdT0 = Date.now();
  const { data: map } = await admin
    .from("external_id_map")
    .select("external_key")
    .eq("source_code", "bsd")
    .eq("internal_id", match.id)
    .maybeSingle();
  const eventId = map?.external_key ? Number(map.external_key) : null;
  if (eventId) {
    const payload = await fetchBsdPredictedLineup(eventId);
    console.log("BSD predicted ms:", Date.now() - bsdT0, "hasLineups:", Boolean(payload?.lineups));
  } else {
    console.log("Sin mapeo BSD para partido");
  }

  const resolveT0 = Date.now();
  const lineup = await resolveTeamLineup(admin, {
    matchId: match.id,
    teamName: team,
    players: squad.players,
  });
  console.log("resolveTeamLineup (admin) ms:", Date.now() - resolveT0, lineup.sourceKind);

  const cachedAdmin = await loadCachedTeamLineup(admin, match.id, team);
  console.log("cache after admin resolve:", cachedAdmin ? cachedAdmin.sourceKind : "MISSING");

  const resolveAuthT0 = Date.now();
  await resolveTeamLineup(authClient, {
    matchId: match.id,
    teamName: team,
    players: squad.players,
  });
  console.log("resolveTeamLineup (anon) ms:", Date.now() - resolveAuthT0);

  const cachedAuth = await loadCachedTeamLineup(authClient, match.id, team);
  console.log("cache visible to anon:", cachedAuth ? cachedAuth.sourceKind : "MISSING");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
