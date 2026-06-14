/**
 * Probe parser FotMob vs API real.
 * Uso: npx tsx --env-file=.env.local scripts/probe-fotmob-lineup-parse.ts [fotmobMatchId] [teamName]
 */
import { parseFotmobConfirmedTeamLineup } from "@/lib/lineup/sources/fotmob-lineup-parse";
import { createClient } from "@supabase/supabase-js";
import { getTeamSquadByName } from "@/lib/worldcup-data/squad-queries";

async function main() {
  const fotmobMatchId = process.argv[2] ?? "4667777";
  const teamName = process.argv[3] ?? "Germany";

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase env");

  const supabase = createClient(url, key);
  const res = await fetch(`https://www.fotmob.com/api/data/matchDetails?matchId=${fotmobMatchId}`, {
    headers: { "user-agent": "TrincadoresMundialistas/1.0" },
  });
  const payload = await res.json();
  const home = payload.content?.lineup?.homeTeam;
  const away = payload.content?.lineup?.awayTeam;
  const teamPayload =
    home?.name?.toLowerCase().includes(teamName.toLowerCase()) ? home : away;

  if (!teamPayload) {
    console.log("No team payload", { home: home?.name, away: away?.name });
    return;
  }

  console.log("API formation", teamPayload.formation);
  for (const s of teamPayload.starters ?? []) {
    console.log(
      "API",
      s.shirtNumber,
      s.name,
      "posId",
      s.positionId,
      "v",
      JSON.stringify(s.verticalLayout),
      "h",
      JSON.stringify(s.horizontalLayout)
    );
  }

  const squad = await getTeamSquadByName(supabase, teamName);
  const players = squad?.players ?? [];
  const { loadOfficialSquadFromClient } = await import("@/lib/lineup/lineup-queries");
  const officialSquad = await loadOfficialSquadFromClient(supabase, teamName);
  const parsed = parseFotmobConfirmedTeamLineup(
    teamPayload,
    players,
    new Date().toISOString(),
    officialSquad
  );

  console.log("\nPARSED", parsed?.formationLabel, parsed?.sourceKind);
  if (!parsed) return;

  for (const slot of [...parsed.slots].sort((a, b) => a.y - b.y || a.x - b.x)) {
    console.log("PARSED", slot.shirtNumber, slot.name, slot.slotKey, `x=${slot.x}`, `y=${slot.y}`);
  }
}

main().catch(console.error);
