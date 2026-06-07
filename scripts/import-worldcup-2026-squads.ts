/**
 * Import convocatorias WC 2026 → team_squads / team_squad_players
 * Fuente: worldcup2026.squads.csv o FIFA API (--from-api)
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";
import { fetchFifaCalendarTeams, fetchFifaTeamSquad } from "@/lib/worldcup2026/fifa-squads";
import {
  normalizeCsvSquadsToRows,
  normalizeFifaSquadsToRows,
} from "@/lib/worldcup2026/normalize-squads";
import { parseWc2026SquadsCsv } from "@/lib/worldcup2026/parse-squads-csv";
import { openFootballNameFromFifaCode } from "@/lib/worldcup2026/squad-team-names";
import { parseScriptCli, logCliOptions } from "@/lib/scripts/cli";
import { assertImportAllowed } from "@/lib/scripts/env-guard";
import { createAdminClient, upsertChunks } from "@/lib/scripts/supabase-admin";
import { WC2026_FEED_SOURCE } from "@/lib/worldcup-data/types";

const DEFAULT_DIR = resolve(process.cwd(), "data/external/worldcup2026");
const SQUADS_CSV = "worldcup2026.squads.csv";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

function readCsv(dir: string, file: string): string {
  const path = join(dir, file);
  if (!existsSync(path)) throw new Error(`CSV no encontrado: ${path}`);
  return readFileSync(path, "utf8");
}

async function truncateWc2026Squads(admin: ReturnType<typeof createAdminClient>): Promise<void> {
  const { data: squads } = await admin
    .from("team_squads")
    .select("id")
    .eq("source_code", WC2026_FEED_SOURCE);

  const squadIds = (squads ?? []).map((s) => s.id as string);
  if (squadIds.length) {
    const { error } = await admin.from("team_squad_players").delete().in("squad_id", squadIds);
    if (error) throw error;
  }
  const { error: delErr } = await admin.from("team_squads").delete().eq("source_code", WC2026_FEED_SOURCE);
  if (delErr) throw delErr;
}

async function upsertSquads(
  admin: ReturnType<typeof createAdminClient>,
  squads: ReturnType<typeof normalizeCsvSquadsToRows>["squads"],
  players: ReturnType<typeof normalizeCsvSquadsToRows>["players"]
): Promise<void> {
  if (!squads.length) return;

  await upsertChunks(admin, "team_squads", squads, "source_code,external_key");

  const { data: rows, error } = await admin
    .from("team_squads")
    .select("id, external_key")
    .eq("source_code", WC2026_FEED_SOURCE);
  if (error) throw error;

  const idByKey = new Map((rows ?? []).map((r) => [r.external_key as string, r.id as string]));
  const playerRowsRaw = players
    .map((p) => {
      const squadId = idByKey.get(p.squad_external_key);
      if (!squadId) return null;
      return {
        squad_id: squadId,
        external_player_key: p.external_player_key,
        player_name: p.player_name,
        position: p.position,
        shirt_number: p.shirt_number,
        club: p.club,
        status: p.status,
        metadata: p.metadata ?? {},
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  const playerRows = [
    ...new Map(
      playerRowsRaw.map((r) => [`${r.squad_id}:${r.player_name.toLowerCase()}`, r] as const)
    ).values(),
  ];

  await upsertChunks(admin, "team_squad_players", playerRows, "squad_id,player_name");
}

async function loadFromApi(limit: number | null) {
  const teams = await fetchFifaCalendarTeams();
  const selected = limit ? teams.slice(0, limit) : teams;
  const playersByTeamId = new Map<string, Awaited<ReturnType<typeof fetchFifaTeamSquad>>>();

  for (const [i, team] of selected.entries()) {
    const label = openFootballNameFromFifaCode(team.fifaCode) ?? team.fifaCode;
    console.log(`  FIFA squad [${i + 1}/${selected.length}] ${label}`);
    playersByTeamId.set(team.idTeam, await fetchFifaTeamSquad(team.idTeam));
    if (i < selected.length - 1) await delay(400);
  }

  return normalizeFifaSquadsToRows(selected, playersByTeamId);
}

async function main() {
  assertImportAllowed();
  const opts = parseScriptCli(process.argv.slice(2), { sourceDir: DEFAULT_DIR });
  logCliOptions("import-worldcup-2026-squads", opts);

  let squadsData: ReturnType<typeof normalizeCsvSquadsToRows>;

  if (opts.fromApi) {
    console.log("Cargando convocatorias desde FIFA API…");
    squadsData = await loadFromApi(opts.limit);
  } else {
    const sourceDir = opts.sourceDir ?? DEFAULT_DIR;
    const csvPath = join(sourceDir, SQUADS_CSV);
    if (!existsSync(csvPath)) {
      throw new Error(
        `Falta ${SQUADS_CSV}. Ejecuta: npm run db:fetch-wc2026-squads`
      );
    }
    const rows = parseWc2026SquadsCsv(readCsv(sourceDir, SQUADS_CSV));
    squadsData = normalizeCsvSquadsToRows(rows);
  }

  console.log(
    `Parseado: ${squadsData.squads.length} plantillas, ${squadsData.players.length} jugadores (source=${WC2026_FEED_SOURCE}, year=2026)`
  );

  if (opts.dryRun) {
    console.log("Dry-run: no se escribió en Supabase.");
    return;
  }

  const admin = createAdminClient();
  if (opts.truncateFirst) {
    console.log("Truncando plantillas worldcup2026 existentes…");
    await truncateWc2026Squads(admin);
  }

  await upsertSquads(admin, squadsData.squads, squadsData.players);
  console.log("Import plantillas WC 2026 completado.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
