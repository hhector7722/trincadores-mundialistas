import {
  fallbackSlotKeyForRole,
  normalizeFormationTemplate,
} from "@/lib/lineup/formation-templates";
import {
  normalizePositionRole,
  positionLabelEs,
} from "@/lib/lineup/position-map";
import { layoutPredictedStarters } from "@/lib/lineup/predicted-slot-layout";
import { API_FOOTBALL_BASE_URL, API_FOOTBALL_SOURCE_CODE } from "@/lib/lineup/sources/api-football-constants";
import { teamNamesMatch } from "@/lib/lineup/sources/api-football-names";
import type { ConfirmedLineupProvider } from "@/lib/lineup/sources/types";
import type {
  LineupBenchPlayer,
  LineupPlayerInput,
  LineupSlot,
  PositionRole,
  ResolvedLineup,
} from "@/lib/lineup/types";
import type { SupabaseClient } from "@supabase/supabase-js";

const API_BASE = API_FOOTBALL_BASE_URL;
const SOURCE_CODE = API_FOOTBALL_SOURCE_CODE;

type ApiFootballPlayer = {
  id?: number;
  name?: string;
  number?: number | null;
  pos?: string | null;
};

type ApiFootballLineupEntry = {
  player?: ApiFootballPlayer;
  grid?: string | null;
};

type ApiFootballTeamLineup = {
  team?: { name?: string };
  formation?: string | null;
  startXI?: ApiFootballLineupEntry[];
  substitutes?: ApiFootballLineupEntry[];
};

type ApiFootballLineupsResponse = {
  response?: ApiFootballTeamLineup[];
};

import { isApiFootballConfigured } from "@/lib/lineup/sources/api-football-client";

export { isApiFootballConfigured };

function normalizeFormationLabel(raw: string | null | undefined): string {
  const value = (raw ?? "").trim();
  return value.length > 0 ? value : "4-3-3";
}

function toFormationId(label: string) {
  return normalizeFormationTemplate(label);
}

function squadIndex(players: LineupPlayerInput[]): Map<string, LineupPlayerInput> {
  const map = new Map<string, LineupPlayerInput>();
  for (const player of players) {
    const key = player.player_name.trim().toLowerCase();
    map.set(key, player);
    if (player.shirt_number != null) {
      map.set(`#${player.shirt_number}`, player);
    }
  }
  return map;
}

function resolveSquadPlayer(
  entry: ApiFootballLineupEntry,
  index: Map<string, LineupPlayerInput>
): LineupPlayerInput | null {
  const apiPlayer = entry.player;
  if (!apiPlayer?.name) return null;

  const byName = index.get(apiPlayer.name.trim().toLowerCase());
  if (byName) return byName;

  if (apiPlayer.number != null) {
    const byNumber = index.get(`#${apiPlayer.number}`);
    if (byNumber) return byNumber;
  }

  return {
    player_name: apiPlayer.name,
    position: apiPlayer.pos ?? null,
    shirt_number: apiPlayer.number ?? null,
  };
}

function roleFromEntry(
  entry: ApiFootballLineupEntry,
  squadPlayer: LineupPlayerInput | null
): PositionRole {
  const raw = squadPlayer?.position ?? entry.player?.pos ?? null;
  return normalizePositionRole(raw);
}

function buildStarterInputs(
  starters: ApiFootballLineupEntry[],
  squadIndexMap: Map<string, LineupPlayerInput>,
  formationLabel: string
): Array<{
  key: string;
  name: string;
  shirtNumber: number | null;
  positionLabel: string;
  role: PositionRole;
  isPlaceholder: boolean;
  slotKey: string;
}> {
  const templateId = normalizeFormationTemplate(formationLabel);
  const roleCounters: Record<PositionRole, number> = { GK: 0, DF: 0, MF: 0, FW: 0 };

  return starters.slice(0, 11).map((entry, index) => {
    const squadPlayer = resolveSquadPlayer(entry, squadIndexMap);
    const role = roleFromEntry(entry, squadPlayer);
    const roleIndex = roleCounters[role];
    roleCounters[role] += 1;
    const slotKey = fallbackSlotKeyForRole(templateId, role, roleIndex);
    const name = squadPlayer?.player_name ?? entry.player?.name ?? "Por confirmar";
    const shirtNumber = squadPlayer?.shirt_number ?? entry.player?.number ?? null;

    return {
      key: `${name}-${shirtNumber ?? index}`,
      name,
      shirtNumber,
      positionLabel: positionLabelEs(role, squadPlayer?.position ?? entry.player?.pos ?? null),
      role,
      isPlaceholder: !name || name === "Por confirmar",
      slotKey,
    };
  });
}

function buildBench(entries: ApiFootballLineupEntry[], squadIndexMap: Map<string, LineupPlayerInput>): LineupBenchPlayer[] {
  return entries
    .map((entry, index) => {
      const squadPlayer = resolveSquadPlayer(entry, squadIndexMap);
      const name = squadPlayer?.player_name ?? entry.player?.name;
      if (!name) return null;
      return {
        key: `${name}-${squadPlayer?.shirt_number ?? entry.player?.number ?? index}`,
        name,
        shirtNumber: squadPlayer?.shirt_number ?? entry.player?.number ?? null,
        position: squadPlayer?.position ?? entry.player?.pos ?? null,
      };
    })
    .filter((player): player is LineupBenchPlayer => player != null);
}

export function parseApiFootballTeamLineup(
  payload: ApiFootballTeamLineup,
  players: LineupPlayerInput[]
): ResolvedLineup | null {
  const starters = payload.startXI ?? [];
  if (starters.length < 11) return null;

  const formationLabel = normalizeFormationLabel(payload.formation);
  const formation = toFormationId(formationLabel);
  const squadIndexMap = squadIndex(players);

  const starterInputs = buildStarterInputs(starters, squadIndexMap, formationLabel);
  const slots: LineupSlot[] = layoutPredictedStarters(starterInputs, formationLabel);

  const bench = buildBench(payload.substitutes ?? [], squadIndexMap);
  const fetchedAt = new Date().toISOString();

  return {
    formation,
    formationLabel,
    slots,
    bench,
    benchCount: bench.length,
    isProbable: false,
    sourceKind: "confirmed",
    dataSourceCode: SOURCE_CODE,
    fetchedAt,
  };
}

async function getFixtureExternalKey(
  supabase: SupabaseClient,
  matchId: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from("external_id_map")
    .select("external_key")
    .eq("source_code", SOURCE_CODE)
    .eq("entity_type", "match")
    .eq("internal_id", matchId)
    .eq("match_status", "mapped")
    .maybeSingle();

  if (error || !data?.external_key) return null;
  return data.external_key;
}

async function fetchLineupsFromApi(fixtureId: string): Promise<ApiFootballTeamLineup[] | null> {
  const apiKey = process.env.API_FOOTBALL_KEY?.trim();
  if (!apiKey) return null;

  const url = new URL(`${API_BASE}/fixtures/lineups`);
  url.searchParams.set("fixture", fixtureId);

  const response = await fetch(url, {
    headers: {
      "x-apisports-key": apiKey,
    },
    next: { revalidate: 300 },
  });

  if (!response.ok) return null;

  const json = (await response.json()) as ApiFootballLineupsResponse;
  const teams = json.response ?? [];
  return teams.length > 0 ? teams : null;
}

export async function fetchConfirmedLineupFromApiFootball(params: {
  supabase: SupabaseClient;
  matchId: string;
  teamName: string;
  players: LineupPlayerInput[];
}): Promise<ResolvedLineup | null> {
  if (!isApiFootballConfigured()) return null;

  const fixtureId = await getFixtureExternalKey(params.supabase, params.matchId);
  if (!fixtureId) return null;

  const teams = await fetchLineupsFromApi(fixtureId);
  if (!teams) return null;

  const teamPayload = teams.find((entry) =>
    teamNamesMatch(entry.team?.name ?? "", params.teamName)
  );
  if (!teamPayload) return null;

  return parseApiFootballTeamLineup(teamPayload, params.players);
}

export const apiFootballConfirmedProvider: ConfirmedLineupProvider = {
  code: SOURCE_CODE,
  fetchConfirmedLineup: fetchConfirmedLineupFromApiFootball,
};
