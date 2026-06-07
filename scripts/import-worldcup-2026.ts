/**
 * Integración worldcup2026: sólo external_id_map + match_live_state.
 * OpenFootball permanece como catálogo canónico de porra.
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";
import { parseScriptCli, logCliOptions } from "@/lib/scripts/cli";
import { assertImportAllowed } from "@/lib/scripts/env-guard";
import { createAdminClient, upsertChunks } from "@/lib/scripts/supabase-admin";
import {
  buildTeamLookup,
  mapGamesToOpenFootball,
  mapStadiumsToHostCities,
} from "@/lib/worldcup2026/match-mapper";
import {
  parseWc2026GamesCsv,
  parseWc2026GroupsCsv,
  parseWc2026StadiaCsv,
  parseWc2026TeamsCsv,
  wc2026ExternalKey,
} from "@/lib/worldcup2026/parse-csv";
import { WC2026_FEED_SOURCE } from "@/lib/worldcup-data/types";
import type {
  ExternalIdMapRow,
  MatchLiveStateRow,
  OpenFootballHostCityRef,
  OpenFootballMatchRef,
  OpenFootballTeamRef,
} from "@/lib/worldcup-data/types";

const DEFAULT_DIR = resolve(process.cwd(), "data/external/worldcup2026");

function readCsv(dir: string, file: string): string {
  const path = join(dir, file);
  if (!existsSync(path)) throw new Error(`CSV no encontrado: ${path}`);
  return readFileSync(path, "utf8");
}

async function loadOpenFootballRefs(admin: ReturnType<typeof createAdminClient>) {
  const [teamsRes, citiesRes, matchesRes] = await Promise.all([
    admin.from("teams").select("id, external_key, name, fifa_name"),
    admin.from("host_cities").select("id, external_key, city, stadium_name"),
    admin
      .from("matches")
      .select("id, external_match_id, home_team, away_team, kickoff_at, group_code, match_number")
      .not("external_match_id", "is", null),
  ]);

  if (teamsRes.error) throw teamsRes.error;
  if (citiesRes.error) throw citiesRes.error;
  if (matchesRes.error) throw matchesRes.error;

  return {
    teams: (teamsRes.data ?? []) as OpenFootballTeamRef[],
    hostCities: (citiesRes.data ?? []) as OpenFootballHostCityRef[],
    matches: (matchesRes.data ?? []) as OpenFootballMatchRef[],
  };
}

async function main() {
  assertImportAllowed();
  const opts = parseScriptCli(process.argv.slice(2), { sourceDir: DEFAULT_DIR });
  logCliOptions("import-worldcup-2026", opts);

  const sourceDir = opts.sourceDir ?? DEFAULT_DIR;
  const wc26Teams = parseWc2026TeamsCsv(readCsv(sourceDir, "worldcup2026.teams.csv"));
  const wc26Stadia = parseWc2026StadiaCsv(readCsv(sourceDir, "worldcup2026.stadia.csv"));
  const wc26Games = parseWc2026GamesCsv(readCsv(sourceDir, "worldcup2026.games.csv"));
  const wc26Groups = parseWc2026GroupsCsv(readCsv(sourceDir, "worldcup2026.groups.csv"));

  const admin = createAdminClient();
  const of = await loadOpenFootballRefs(admin);
  const teamLookup = buildTeamLookup(wc26Teams, of.teams);
  const stadiumMaps = mapStadiumsToHostCities(wc26Stadia, of.hostCities);
  const gameMaps = mapGamesToOpenFootball(wc26Games, wc26Teams, of.matches, teamLookup);

  const idMaps: ExternalIdMapRow[] = [];

  for (const t of wc26Teams) {
    const ofTeam = teamLookup.get(t.sourceId);
    if (!ofTeam) continue;
    idMaps.push({
      source_code: WC2026_FEED_SOURCE,
      external_key: wc2026ExternalKey("team", t.sourceId),
      entity_type: "team",
      internal_table: "teams",
      internal_id: ofTeam.id,
      metadata: { fifa_code: t.fifaCode, name_en: t.nameEn },
      match_status: "mapped",
    });
  }

  for (const s of stadiumMaps) {
    if (!s.hostCityId) continue;
    idMaps.push({
      source_code: WC2026_FEED_SOURCE,
      external_key: wc2026ExternalKey("stadium", s.sourceId),
      entity_type: "stadium",
      internal_table: "host_cities",
      internal_id: s.hostCityId,
      match_status: "mapped",
    });
  }

  for (const g of wc26Groups) {
    idMaps.push({
      source_code: WC2026_FEED_SOURCE,
      external_key: wc2026ExternalKey("group", g.groupCode),
      entity_type: "group",
      internal_table: "metadata",
      internal_id: undefined,
      metadata: { team_ids: g.teamSourceIds },
      match_status: "pending",
    });
  }

  const liveStates: MatchLiveStateRow[] = [];

  for (const m of gameMaps) {
    const extKey = wc2026ExternalKey("game", m.game.sourceId);
    if (m.status === "mapped" && m.matchId) {
      idMaps.push({
        source_code: WC2026_FEED_SOURCE,
        external_key: extKey,
        entity_type: "match",
        internal_table: "matches",
        internal_id: m.matchId,
        metadata: { group: m.game.groupCode, matchday: m.game.matchday },
        match_status: "mapped",
      });
      liveStates.push({
        match_id: m.matchId,
        source_code: WC2026_FEED_SOURCE,
        source_external_key: extKey,
        home_score: m.game.homeScore,
        away_score: m.game.awayScore,
        time_elapsed: m.game.timeElapsed,
        finished: m.game.finished,
      });
    } else {
      idMaps.push({
        source_code: WC2026_FEED_SOURCE,
        external_key: extKey,
        entity_type: "match",
        internal_table: "matches",
        metadata: { reason: m.reason, group: m.game.groupCode },
        match_status: "pending",
      });
    }
  }

  const mapped = gameMaps.filter((g) => g.status === "mapped").length;
  const pending = gameMaps.filter((g) => g.status === "pending").length;

  console.log(
    `worldcup2026: ${wc26Teams.length} equipos, ${wc26Games.length} partidos → ${mapped} mapeados, ${pending} pending`
  );
  if (pending > 0) {
    const sample = gameMaps.filter((g) => g.status === "pending").slice(0, 5);
    for (const p of sample) {
      console.log(`  pending game ${p.game.sourceId}: ${p.reason}`);
    }
  }

  if (opts.dryRun) {
    console.log("Dry-run: no se escribió en Supabase.");
    return;
  }

  const rowsForDb = idMaps.map((r) => ({
    source_code: r.source_code,
    external_key: r.external_key,
    entity_type: r.entity_type,
    internal_table: r.internal_table,
    internal_id: r.internal_id ?? null,
    metadata: r.metadata ?? {},
    match_status: r.match_status ?? "mapped",
    updated_at: new Date().toISOString(),
  }));

  await upsertChunks(admin, "external_id_map", rowsForDb, "source_code,external_key");

  if (liveStates.length) {
    await upsertChunks(admin, "match_live_state", liveStates, "match_id");
  }

  console.log(`Import feed completado: ${rowsForDb.length} mapeos, ${liveStates.length} live states.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
