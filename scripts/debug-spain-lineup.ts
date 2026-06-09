/**
 * Debug BSD alineación España.
 * Uso: npx tsx --env-file=.env.local scripts/debug-spain-lineup.ts
 */
import { fetchBsdPredictedLineup } from "@/lib/lineup/sources/bsd-client";
import { separateOverlappingSlots } from "@/lib/lineup/field-layout";
import { parseBsdPredictedTeamLineup } from "@/lib/lineup/sources/bsd-lineup-parse";
import { createClient } from "@supabase/supabase-js";
import { getTeamSquadByName } from "@/lib/worldcup-data/squad-queries";

async function main() {
  const payload = await fetchBsdPredictedLineup(8299);
  const team = payload?.lineups?.home;
  if (!team) {
    console.log("Sin datos BSD", payload);
    return;
  }

  console.log("FORMATION", team.predicted_formation);
  console.log("RAW_STARTERS");
  for (const s of team.starters ?? []) {
    console.log(s.jersey_number, s.name, s.predicted_slot, s.position);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.log("Sin Supabase env para parsear");
    return;
  }

  const supabase = createClient(url, key);
  const squad = await getTeamSquadByName(supabase, "Spain");
  if (!squad) return;

  const parsed = parseBsdPredictedTeamLineup(
    team,
    squad.players.map((p) => ({
      player_name: p.player_name,
      shirt_number: p.shirt_number,
      position: p.position,
    })),
    new Date().toISOString()
  );

  if (!parsed) return;
  const visual = separateOverlappingSlots(parsed.slots);
  console.log("PARSED (y asc = ataque arriba)");
  for (const slot of [...visual].sort((a, b) => a.y - b.y || a.x - b.x)) {
    console.log(`x=${slot.x} y=${slot.y}`, slot.shirtNumber, slot.name, slot.positionLabel);
  }
}

main().catch(console.error);
