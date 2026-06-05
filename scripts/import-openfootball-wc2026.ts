import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { REAL_POOL_SLUG } from "../lib/auth/participants";
import { parseCupFinalsTxt } from "../lib/openfootball/parse-cup-finals";
import { parseCupTxt } from "../lib/openfootball/parse-football-txt";
import { parseStadiumsCsv } from "../lib/openfootball/parse-stadiums-csv";
import { cityExternalKey, poolMatchdayKey } from "../lib/openfootball/slug";
import type { ParsedMatch, ParsedStage } from "../lib/openfootball/types";
import {
  COMPETITION_CODE,
  COMPETITION_YEAR,
  SOURCE_PATH,
} from "../lib/openfootball/types";
import {
  assertImportAllowed,
  assertServiceEnv,
} from "../lib/scripts/env-guard";

const DEFAULT_DIR = "data/openfootball/worldcup/2026--usa";

type IdMap = Map<string, string>;

function readLocal(path: string): string {
  if (!existsSync(path)) {
    throw new Error(`Archivo no encontrado: ${path}`);
  }
  return readFileSync(path, "utf8");
}

function mergeStages(a: ParsedStage[], b: ParsedStage[]): ParsedStage[] {
  const map = new Map<string, ParsedStage>();
  for (const s of [...a, ...b]) map.set(s.externalKey, s);
  return [...map.values()].sort((x, y) => x.sequence - y.sequence);
}

async function upsertCompetition(admin: ReturnType<typeof createClient>) {
  const { data, error } = await admin
    .from("competitions")
    .upsert(
      {
        code: COMPETITION_CODE,
        name: "World Cup 2026",
        year: COMPETITION_YEAR,
        source_path: SOURCE_PATH,
      },
      { onConflict: "code" }
    )
    .select("id")
    .single();
  if (error || !data) throw error ?? new Error("No se pudo upsert competitions");
  return data.id as string;
}

async function upsertCatalog<T extends Record<string, unknown>>(
  admin: ReturnType<typeof createClient>,
  table: string,
  rows: T[],
  onConflict: string
): Promise<void> {
  if (!rows.length) return;
  const chunkSize = 100;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { error } = await admin.from(table).upsert(chunk, { onConflict });
    if (error) throw new Error(`${table}: ${error.message}`);
  }
}

async function loadIdMap(
  admin: ReturnType<typeof createClient>,
  table: string,
  keyCol: string
): Promise<IdMap> {
  const { data, error } = await admin.from(table).select(`id, ${keyCol}`);
  if (error) throw error;
  const map: IdMap = new Map();
  for (const row of data ?? []) {
    map.set(String((row as Record<string, string>)[keyCol]), String((row as { id: string }).id));
  }
  return map;
}

function resolveCityId(venue: string, cities: IdMap): { id: string | null; stadiumName: string | null } {
  const key = cityExternalKey(venue);
  if (cities.has(key)) return { id: cities.get(key)!, stadiumName: null };
  if (cities.has(venue)) return { id: cities.get(venue)!, stadiumName: null };
  for (const [k, id] of cities) {
    if (k.includes(key) || key.includes(k)) return { id, stadiumName: null };
  }
  return { id: null, stadiumName: null };
}

async function ensurePool(admin: ReturnType<typeof createClient>): Promise<string> {
  const slug = process.env.POOL_SLUG?.trim() || REAL_POOL_SLUG;
  const { data, error } = await admin.from("pools").select("id").eq("slug", slug).maybeSingle();
  if (error) throw error;
  if (!data) throw new Error(`Pool no encontrado: ${slug}`);
  return data.id as string;
}

async function countPoolMatches(
  admin: ReturnType<typeof createClient>,
  poolId: string
): Promise<number> {
  const { data: matchdays, error: mdErr } = await admin
    .from("matchdays")
    .select("id")
    .eq("pool_id", poolId);
  if (mdErr) throw mdErr;
  const ids = (matchdays ?? []).map((m) => m.id);
  if (!ids.length) return 0;
  const { count, error } = await admin
    .from("matches")
    .select("id", { count: "exact", head: true })
    .in("matchday_id", ids);
  if (error) throw error;
  return count ?? 0;
}

async function upsertOperationalMatchdays(
  admin: ReturnType<typeof createClient>,
  poolId: string,
  competitionId: string,
  stages: ParsedStage[],
  stageIds: IdMap
): Promise<IdMap> {
  const operationalKeys = stages.filter(
    (s) => s.stageType === "matchday" || s.stageType === "knockout"
  );

  for (const s of operationalKeys) {
    const row = {
      pool_id: poolId,
      competition_id: competitionId,
      tournament_stage_id: stageIds.get(s.externalKey) ?? null,
      external_key: poolMatchdayKey(s.externalKey),
      name: s.name,
      sequence: s.sequence,
    };

    const { data: existing, error: findErr } = await admin
      .from("matchdays")
      .select("id")
      .eq("pool_id", poolId)
      .eq("external_key", row.external_key)
      .maybeSingle();
    if (findErr) throw findErr;

    if (existing?.id) {
      const { error: updErr } = await admin.from("matchdays").update(row).eq("id", existing.id);
      if (updErr) throw updErr;
    } else {
      const { error: insErr } = await admin.from("matchdays").insert(row);
      if (insErr) throw insErr;
    }
  }

  const { data, error } = await admin
    .from("matchdays")
    .select("id, external_key")
    .eq("pool_id", poolId)
    .not("external_key", "is", null);
  if (error) throw error;

  const map: IdMap = new Map();
  for (const row of data ?? []) {
    map.set(String(row.external_key), String(row.id));
  }
  return map;
}

async function upsertMatches(
  admin: ReturnType<typeof createClient>,
  args: {
    competitionId: string;
    poolMatchdayIds: IdMap;
    stageIds: IdMap;
    teamIds: IdMap;
    cityRows: Array<{ id: string; city: string; stadium_name: string }>;
    matches: ParsedMatch[];
  }
): Promise<{ inserted: number; withResults: number }> {
  const cityByKey = new Map(args.cityRows.map((c) => [cityExternalKey(c.city), c]));
  let withResults = 0;

  for (const m of args.matches) {
    const mdPoolKey = poolMatchdayKey(m.matchdayExternalKey);
    const matchdayId = args.poolMatchdayIds.get(mdPoolKey);
    if (!matchdayId) {
      throw new Error(`Matchday operativo no encontrado: ${mdPoolKey}`);
    }

    const cityKey = cityExternalKey(m.venueCity);
    const cityRow = cityByKey.get(cityKey);
    const hostCityId = cityRow?.id ?? null;
    const stadiumName = cityRow?.stadium_name ?? null;

    const status =
      m.homeGoals !== null && m.awayGoals !== null ? "finished" : "scheduled";

    const row = {
      external_match_id: m.externalMatchId,
      matchday_id: matchdayId,
      competition_id: args.competitionId,
      tournament_stage_id: args.stageIds.get(m.stageExternalKey) ?? null,
      host_city_id: hostCityId,
      home_team_id: m.homeTeamKey ? (args.teamIds.get(m.homeTeamKey) ?? null) : null,
      away_team_id: m.awayTeamKey ? (args.teamIds.get(m.awayTeamKey) ?? null) : null,
      home_team: m.homeTeam,
      away_team: m.awayTeam,
      kickoff_at: m.kickoffIso,
      status,
      sort_order: m.sortOrder,
      stadium_name: stadiumName,
      group_code: m.groupCode,
      match_number: m.matchNumber,
    };

    const { data: existing, error: findErr } = await admin
      .from("matches")
      .select("id")
      .eq("external_match_id", m.externalMatchId)
      .maybeSingle();
    if (findErr) throw findErr;

    let matchId: string;
    if (existing?.id) {
      const { data: updated, error: updErr } = await admin
        .from("matches")
        .update(row)
        .eq("id", existing.id)
        .select("id")
        .single();
      if (updErr || !updated) throw updErr ?? new Error("Update match failed");
      matchId = updated.id as string;
    } else {
      const { data: inserted, error: insErr } = await admin
        .from("matches")
        .insert(row)
        .select("id")
        .single();
      if (insErr || !inserted) throw insErr ?? new Error("Insert match failed");
      matchId = inserted.id as string;
    }

    if (m.homeGoals !== null && m.awayGoals !== null) {
      withResults += 1;
      const { error: resErr } = await admin.from("match_results").upsert(
        {
          match_id: matchId,
          home_goals: m.homeGoals,
          away_goals: m.awayGoals,
        },
        { onConflict: "match_id" }
      );
      if (resErr) throw resErr;
    }
  }

  return { inserted: args.matches.length, withResults };
}

async function main() {
  assertServiceEnv();
  assertImportAllowed();

  const baseDir = resolve(process.cwd(), process.env.OPENFOOTBALL_DIR?.trim() || DEFAULT_DIR);
  const cupTxt = readLocal(resolve(baseDir, "cup.txt"));
  const cupFinalsTxt = readLocal(resolve(baseDir, "cup_finals.txt"));
  const stadiumsCsv = readLocal(resolve(baseDir, "cup_stadiums.csv"));

  const cup = parseCupTxt(cupTxt, COMPETITION_YEAR);
  const finals = parseCupFinalsTxt(cupFinalsTxt, COMPETITION_YEAR);
  const stadiums = parseStadiumsCsv(stadiumsCsv);
  const allStages = mergeStages(cup.stages, finals.stages);
  const allMatches = [...cup.groupMatches, ...finals.knockoutMatches];

  console.log(`Parse OK: ${cup.teams.length} equipos, ${stadiums.length} sedes`);
  console.log(`Partidos: ${cup.groupMatches.length} grupos + ${finals.knockoutMatches.length} KO = ${allMatches.length}`);

  if (allMatches.length !== 104) {
    throw new Error(`Se esperaban 104 partidos, parseados: ${allMatches.length}`);
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const poolId = await ensurePool(admin);
  const existingMatches = await countPoolMatches(admin, poolId);
  if (existingMatches > 0 && process.env.CONFIRM_REIMPORT !== "1") {
    throw new Error(
      `Pool ya tiene ${existingMatches} partidos. Usa CONFIRM_REIMPORT=1 para reimportar.`
    );
  }

  const competitionId = await upsertCompetition(admin);

  await upsertCatalog(
    admin,
    "host_cities",
    stadiums.map((s) => ({
      external_key: s.externalKey,
      city: s.city,
      country_code: s.countryCode,
      stadium_name: s.stadiumName,
      timezone_offset: s.timezoneOffset,
      capacity: s.capacity,
      latitude: s.latitude,
      longitude: s.longitude,
    })),
    "external_key"
  );

  const uniqueTeams = new Map<string, (typeof cup.teams)[0]>();
  for (const t of cup.teams) uniqueTeams.set(t.externalKey, t);

  await upsertCatalog(
    admin,
    "teams",
    [...uniqueTeams.values()].map((t) => ({
      external_key: t.externalKey,
      name: t.name,
      fifa_name: t.fifaName,
    })),
    "external_key"
  );

  await upsertCatalog(
    admin,
    "tournament_stages",
    allStages.map((s) => ({
      competition_id: competitionId,
      external_key: s.externalKey,
      stage_type: s.stageType,
      name: s.name,
      sequence: s.sequence,
      group_code: s.groupCode,
    })),
    "external_key"
  );

  const stageIds = await loadIdMap(admin, "tournament_stages", "external_key");
  const teamIds = await loadIdMap(admin, "teams", "external_key");
  const poolMatchdayIds = await upsertOperationalMatchdays(
    admin,
    poolId,
    competitionId,
    allStages,
    stageIds
  );

  const { data: cityRows, error: cityErr } = await admin
    .from("host_cities")
    .select("id, city, stadium_name");
  if (cityErr) throw cityErr;

  const { inserted, withResults } = await upsertMatches(admin, {
    competitionId,
    poolMatchdayIds,
    stageIds,
    teamIds,
    cityRows: cityRows ?? [],
    matches: allMatches,
  });

  console.log(`Import completado: ${inserted} partidos, ${withResults} con resultado.`);
  console.log(`Matchdays operativos: ${poolMatchdayIds.size}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
