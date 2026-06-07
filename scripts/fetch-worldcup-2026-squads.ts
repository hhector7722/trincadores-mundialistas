/**
 * Descarga convocatorias oficiales FIFA → worldcup2026.squads.csv
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve, join, dirname } from "node:path";
import { fetchFifaCalendarTeams, fetchFifaTeamSquad } from "@/lib/worldcup2026/fifa-squads";
import {
  normalizeFifaSquadsToRows,
  type Wc2026SquadCsvRow,
} from "@/lib/worldcup2026/normalize-squads";
import { openFootballNameFromFifaCode } from "@/lib/worldcup2026/squad-team-names";
import { parseScriptCli, logCliOptions } from "@/lib/scripts/cli";
import { serializeWc2026SquadsCsv } from "@/lib/worldcup2026/parse-squads-csv";

const DEFAULT_OUT = resolve(process.cwd(), "data/external/worldcup2026/worldcup2026.squads.csv");

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const opts = parseScriptCli(process.argv.slice(2));
  logCliOptions("fetch-worldcup-2026-squads", opts);

  console.log("Obteniendo equipos del calendario FIFA…");
  const teams = await fetchFifaCalendarTeams();
  const limited = opts.limit ? teams.slice(0, opts.limit) : teams;
  console.log(`Equipos: ${limited.length}/${teams.length}`);

  const playersByTeamId = new Map<string, Awaited<ReturnType<typeof fetchFifaTeamSquad>>>();
  for (const [i, team] of limited.entries()) {
    const label = openFootballNameFromFifaCode(team.fifaCode) ?? team.fifaCode;
    process.stdout.write(`  [${i + 1}/${limited.length}] ${label}…`);
    const players = await fetchFifaTeamSquad(team.idTeam);
    playersByTeamId.set(team.idTeam, players);
    console.log(` ${players.length} jugadores`);
    if (i < limited.length - 1) await delay(400);
  }

  const { squads, players } = normalizeFifaSquadsToRows(limited, playersByTeamId);
  console.log(`Normalizado: ${squads.length} plantillas, ${players.length} jugadores`);

  const csvRows: Wc2026SquadCsvRow[] = players.map((p) => {
    const squad = squads.find((s) => s.external_key === p.squad_external_key);
    return {
      team_name: squad?.team_name ?? "",
      team_code: squad?.team_code ?? null,
      player_name: p.player_name,
      shirt_number: p.shirt_number,
      position: p.position,
      club: p.club,
      fifa_player_id: p.external_player_key,
    };
  });

  const outPath = opts.sourceDir
    ? join(opts.sourceDir, "worldcup2026.squads.csv")
    : DEFAULT_OUT;

  if (opts.dryRun) {
    console.log("Dry-run: no se escribió CSV.");
    return;
  }

  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, serializeWc2026SquadsCsv(csvRows), "utf8");
  console.log(`CSV escrito: ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
