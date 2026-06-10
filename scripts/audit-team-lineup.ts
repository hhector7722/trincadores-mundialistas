/**
 * Audita alineación BSD de una selección: slots crudos, corrección y perfiles faltantes.
 *
 * Uso:
 *   npx tsx --env-file=.env.local scripts/audit-team-lineup.ts Spain
 *   npx tsx --env-file=.env.local scripts/audit-team-lineup.ts Argentina
 *
 * Para corregir errores, añade entradas en data/lineup/wc2026-tactical-profiles.json
 * usando la clave JSON que imprime este script.
 */
import { createClient } from "@supabase/supabase-js";
import { fetchBsdPredictedLineup } from "@/lib/lineup/sources/bsd-client";
import { resolveBsdEventId } from "@/lib/lineup/sources/bsd-event-lookup";
import { parseBsdPredictedTeamLineup } from "@/lib/lineup/sources/bsd-lineup-parse";
import { findPrimaryMatchIdForTeam } from "@/lib/lineup/lineup-queries";
import {
  lookupTacticalProfile,
  refinePredictedSlotKey,
  tacticalProfileKey,
  tacticalSlotLabelEs,
} from "@/lib/lineup/tactical-profile";
import { getTeamSquadByName } from "@/lib/worldcup-data/squad-queries";

const teamArg = process.argv[2]?.trim();
if (!teamArg) {
  console.error("Indica la selección: npx tsx --env-file=.env.local scripts/audit-team-lineup.ts Spain");
  process.exit(1);
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.error("Faltan variables Supabase en .env.local");
    process.exit(1);
  }

  const supabase = createClient(url, key);
  const squad = await getTeamSquadByName(supabase, teamArg);
  if (!squad) {
    console.error(`Sin plantilla WC 2026 para: ${teamArg}`);
    process.exit(1);
  }

  const matchId = await findPrimaryMatchIdForTeam(supabase, squad.team_name);
  if (!matchId) {
    console.error(`Sin partido en calendario para: ${squad.team_name}`);
    process.exit(1);
  }

  const { data: match } = await supabase
    .from("matches")
    .select("home_team, away_team, kickoff_at")
    .eq("id", matchId)
    .maybeSingle();

  if (!match) {
    console.error("Partido no encontrado");
    process.exit(1);
  }

  const eventId = await resolveBsdEventId(
    supabase,
    matchId,
    squad.team_name,
    match.home_team,
    match.away_team,
    match.kickoff_at
  );

  if (!eventId) {
    console.error("Sin mapeo BSD para este partido (external_id_map)");
    process.exit(1);
  }

  const payload = await fetchBsdPredictedLineup(eventId);
  const side =
    payload?.lineups?.home?.team?.toLowerCase().includes(squad.team_name.toLowerCase()) ||
    payload?.lineups?.home?.team?.toLowerCase().includes(teamArg.toLowerCase())
      ? "home"
      : "away";
  const teamPayload = payload?.lineups?.[side];

  if (!teamPayload?.starters?.length) {
    console.error("BSD sin once predicho (¿BSD_API_KEY en .env.local?)");
    process.exit(1);
  }

  const players = squad.players.map((p) => ({
    player_name: p.player_name,
    shirt_number: p.shirt_number,
    position: p.position,
  }));

  console.log(`\n=== ${squad.team_name} · BSD event ${eventId} · ${teamPayload.predicted_formation} ===\n`);

  console.log("BSD crudo → corregido (si hay perfil)");
  for (const starter of teamPayload.starters) {
    const squadPlayer = players.find(
      (p) =>
        p.player_name.toLowerCase() === (starter.name ?? "").toLowerCase() ||
        (starter.jersey_number != null && p.shirt_number === starter.jersey_number)
    );
    const raw = (starter.predicted_slot ?? starter.position ?? "?").toUpperCase();
    const refined = refinePredictedSlotKey(
      squadPlayer?.player_name ?? starter.name ?? "",
      raw,
      squadPlayer?.position ?? starter.position ?? null
    );
    const changed = raw !== refined ? ` → ${refined} (${tacticalSlotLabelEs(refined)})` : "";
    console.log(
      `  #${starter.jersey_number ?? "?"} ${starter.name}`.padEnd(36),
      `${raw}${changed}`
    );
  }

  const parsed = await parseBsdPredictedTeamLineup(teamPayload, players, new Date().toISOString());
  if (parsed) {
    console.log("\nCampo (izquierda → derecha):");
    for (const slot of [...parsed.slots].sort((a, b) => a.x - b.x)) {
      console.log(`  x=${String(slot.x).padStart(4)}  #${slot.shirtNumber ?? "?"} ${slot.name}  [${slot.positionLabel}]`);
    }
  }

  const defenders = squad.players.filter((p) => (p.position ?? "").toUpperCase() === "DF");
  const missing = defenders.filter((p) => !lookupTacticalProfile(p.player_name));

  if (missing.length > 0) {
    console.log("\nDefensas SIN perfil táctico (añade a wc2026-tactical-profiles.json):");
    for (const player of missing) {
      console.log(`  "${tacticalProfileKey(player.player_name)}": "CB",  // ${player.player_name} #${player.shirt_number}`);
    }
  } else {
    console.log("\nTodos los defensas de la plantilla tienen perfil táctico.");
  }

  console.log("\nSlots válidos: GK LB RB CB DM CM LM RM AM LW RW ST CF SS (LWB RWB)\n");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
