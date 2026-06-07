/**
 * Import histórico Fjelstul → wc_historic_* + team_squads
 * Atribución: CC-BY-SA 4.0 — Joshua C. Fjelstul, Ph.D.
 * https://github.com/jfjelstul/worldcup
 *
 * Filtro intencional: solo torneos masculinos (ver isMenTournament en normalize.ts).
 * Los Mundiales femeninos del dataset se omiten por completo en esta fase.
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";
import { downloadFjelstulCsv } from "@/lib/fjelstul-worldcup/download";
import {
  normalizeAwardWinners,
  normalizeGoals,
  normalizeMatches,
  normalizeSquads,
  normalizeStandings,
  normalizeStadiums,
  normalizeTeams,
  normalizeTournaments,
  onlyMenTournaments,
  menTournamentExternalIds,
  filterByMenTournaments,
} from "@/lib/fjelstul-worldcup/normalize";
import { parseScriptCli, logCliOptions } from "@/lib/scripts/cli";
import { assertImportAllowed } from "@/lib/scripts/env-guard";
import { createAdminClient, upsertChunks } from "@/lib/scripts/supabase-admin";

const DEFAULT_DIR = resolve(process.cwd(), "data/external/fjelstul-worldcup");

const WC_HISTORIC_TABLES = [
  "wc_historic_goals",
  "wc_historic_award_winners",
  "wc_historic_tournament_standings",
  "wc_historic_matches",
  "wc_historic_stadiums",
  "wc_historic_teams",
  "wc_historic_tournaments",
] as const;

function readCsv(dir: string, file: string): string {
  const path = join(dir, file);
  if (!existsSync(path)) throw new Error(`CSV no encontrado: ${path}`);
  return readFileSync(path, "utf8");
}

async function truncateHistoric(admin: ReturnType<typeof createAdminClient>): Promise<void> {
  const { data: fjSquads } = await admin.from("team_squads").select("id").eq("source_code", "fjelstul");
  const squadIds = (fjSquads ?? []).map((s) => s.id as string);
  if (squadIds.length) {
    const { error } = await admin.from("team_squad_players").delete().in("squad_id", squadIds);
    if (error) throw error;
  }
  await admin.from("team_squads").delete().eq("source_code", "fjelstul");

  for (const table of WC_HISTORIC_TABLES) {
    const { error } = await admin.from(table).delete().gte("created_at", "1970-01-01T00:00:00Z");
    if (error) throw new Error(`${table} truncate: ${error.message}`);
  }
}

async function upsertSquads(
  admin: ReturnType<typeof createAdminClient>,
  squads: ReturnType<typeof normalizeSquads>["squads"],
  players: ReturnType<typeof normalizeSquads>["players"]
): Promise<void> {
  if (!squads.length) return;
  await upsertChunks(admin, "team_squads", squads, "source_code,external_key");

  const { data: rows, error } = await admin
    .from("team_squads")
    .select("id, external_key")
    .eq("source_code", "fjelstul");
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

async function main() {
  assertImportAllowed();
  const opts = parseScriptCli(process.argv.slice(2), { sourceDir: DEFAULT_DIR });
  logCliOptions("import-worldcup-historic", opts);

  let sourceDir = opts.sourceDir ?? DEFAULT_DIR;
  if (opts.download) {
    await downloadFjelstulCsv(sourceDir);
  }

  const allTournaments = normalizeTournaments(readCsv(sourceDir, "tournaments.csv"));
  const tournaments = onlyMenTournaments(allTournaments);
  const menIds = menTournamentExternalIds(tournaments);
  const womenSkipped = allTournaments.length - tournaments.length;

  const teams = normalizeTeams(readCsv(sourceDir, "teams.csv"));
  const stadiums = normalizeStadiums(readCsv(sourceDir, "stadiums.csv"));
  const matches = filterByMenTournaments(normalizeMatches(readCsv(sourceDir, "matches.csv")), menIds);
  const goals = filterByMenTournaments(normalizeGoals(readCsv(sourceDir, "goals.csv")), menIds);
  const awards = filterByMenTournaments(
    normalizeAwardWinners(readCsv(sourceDir, "award_winners.csv")),
    menIds
  );
  const standings = filterByMenTournaments(
    normalizeStandings(readCsv(sourceDir, "tournament_standings.csv")),
    menIds
  );

  let squadsData = { squads: [] as ReturnType<typeof normalizeSquads>["squads"], players: [] as ReturnType<typeof normalizeSquads>["players"] };
  try {
    const rawSquads = normalizeSquads(readCsv(sourceDir, "squads.csv"));
    squadsData = {
      squads: rawSquads.squads.filter(
        (s) => s.tournament_external_id && menIds.has(s.tournament_external_id)
      ),
      players: rawSquads.players.filter((p) => {
        const tid = p.metadata?.tournament_id;
        return typeof tid === "string" && menIds.has(tid);
      }),
    };
  } catch {
    console.warn("squads.csv no disponible; plantillas históricas omitidas.");
  }

  console.log(
    `Parseado (solo masculino): ${tournaments.length} torneos (${womenSkipped} femeninos excluidos), ${teams.length} equipos, ${matches.length} partidos, ${goals.length} goles, ${squadsData.squads.length} plantillas`
  );

  if (opts.dryRun) {
    console.log("Dry-run: no se escribió en Supabase.");
    return;
  }

  const admin = createAdminClient();
  if (opts.truncateFirst) {
    console.log("Truncando tablas wc_historic_* y plantillas fjelstul...");
    await truncateHistoric(admin);
  }

  await upsertChunks(admin, "wc_historic_tournaments", tournaments, "external_id");
  await upsertChunks(admin, "wc_historic_teams", teams, "external_id");
  await upsertChunks(admin, "wc_historic_stadiums", stadiums, "external_id");
  await upsertChunks(admin, "wc_historic_matches", matches, "external_id");
  await upsertChunks(admin, "wc_historic_goals", goals, "external_id");
  await upsertChunks(admin, "wc_historic_award_winners", awards, "external_key");
  await upsertChunks(admin, "wc_historic_tournament_standings", standings, "external_key");
  await upsertSquads(admin, squadsData.squads, squadsData.players);

  console.log("Import histórico Fjelstul completado.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
