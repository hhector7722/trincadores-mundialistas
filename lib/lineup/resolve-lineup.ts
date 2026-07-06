import { buildFallbackLineup, buildExactHardcodedLineup } from "@/lib/lineup/build-fallback-lineup";
import { HARDCODED_DEFAULT_LINEUPS } from "@/lib/lineup/hardcoded-lineups";
import { shouldFetchConfirmedLineup } from "@/lib/lineup/confirmed-lineup-window";
import { isConfirmedLineupCacheStale } from "@/lib/lineup/lineup-cache-stale";
import {
  findPrimaryMatchIdForTeam,
  isBetterLineupSource,
  loadCachedTeamLineup,
  loadLastKnownFormation,
  upsertTeamLineup,
} from "@/lib/lineup/lineup-queries";
import { apiFootballConfirmedProvider } from "@/lib/lineup/sources/api-football";
import { bsdConfirmedProvider } from "@/lib/lineup/sources/bsd-confirmed";
import { fotmobConfirmedProvider } from "@/lib/lineup/sources/fotmob-confirmed";
import { maybeNotifyConfirmedLineup } from "@/lib/notifications/confirmed-lineup-notifications";
import type { LineupBenchPlayer, LineupResolveContext, LineupSourceKind, ResolvedLineup } from "@/lib/lineup/types";
import { createAdminClient } from "@/lib/scripts/supabase-admin";
import type { SupabaseClient } from "@supabase/supabase-js";

export type LineupSourceResolution = {
  kind: LineupSourceKind;
  dataSourceCode: string | null;
  fromCache: boolean;
};

const CONFIRMED_PROVIDERS = [
  fotmobConfirmedProvider,
  bsdConfirmedProvider,
  apiFootballConfirmedProvider,
];

export async function fetchConfirmedLineup(
  supabase: SupabaseClient,
  context: LineupResolveContext & { matchId: string }
): Promise<ResolvedLineup | null> {
  const params = {
    supabase,
    matchId: context.matchId,
    teamName: context.teamName,
    players: context.players,
  };

  for (const provider of CONFIRMED_PROVIDERS) {
    const lineup = await provider.fetchConfirmedLineup(params);
    if (lineup) return lineup;
  }
  return null;
}


/** Indica qué fuente se usaría sin persistir ni construir el fallback completo. */
async function resolveContextMatchId(
  supabase: SupabaseClient,
  context: LineupResolveContext
): Promise<string | undefined> {
  if (context.matchId) return context.matchId;
  const primary = await findPrimaryMatchIdForTeam(supabase, context.teamName);
  return primary ?? undefined;
}

async function loadMatchMeta(
  supabase: SupabaseClient,
  matchId: string
): Promise<{ kickoff_at: string; status: string | null } | null> {
  const { data } = await supabase
    .from("matches")
    .select("kickoff_at, status")
    .eq("id", matchId)
    .maybeSingle();
  return data;
}

export async function getLineupSource(
  supabase: SupabaseClient,
  context: LineupResolveContext
): Promise<LineupSourceResolution> {
  const matchId = await resolveContextMatchId(supabase, context);
  if (matchId) {
    const cached = await loadCachedTeamLineup(supabase, matchId, context.teamName);
    if (cached?.sourceKind === "confirmed") {
      return {
        kind: "confirmed",
        dataSourceCode: cached.dataSourceCode,
        fromCache: true,
      };
    }

    const confirmed = await fetchConfirmedLineup(supabase, {
      ...context,
      matchId,
    });
    if (confirmed) {
      return {
        kind: "confirmed",
        dataSourceCode: confirmed.dataSourceCode,
        fromCache: false,
      };
    }
  }

  return { kind: "fallback", dataSourceCode: null, fromCache: false };
}

function benchFromResolved(lineup: ResolvedLineup, context: LineupResolveContext): LineupBenchPlayer[] {
  if (lineup.benchCount <= 0) return [];
  const starterNames = new Set(
    lineup.slots.filter((slot) => !slot.isPlaceholder).map((slot) => slot.name.toLowerCase())
  );
  return context.players
    .filter((player) => !starterNames.has(player.player_name.toLowerCase()))
    .map((player) => ({
      key: `${player.player_name}-${player.shirt_number ?? "x"}`,
      name: player.player_name,
      shirtNumber: player.shirt_number,
      position: player.position,
    }));
}



export async function buildFallbackWithKnownFormation(
  supabase: SupabaseClient,
  context: LineupResolveContext
): Promise<ResolvedLineup> {
  const teamKey = context.teamName.toLowerCase().trim();
  const hardcoded = HARDCODED_DEFAULT_LINEUPS[teamKey];

  let resolved: ResolvedLineup;

  if (hardcoded) {
    // Usar la lógica exacta de hardcoded para saltarse la heurística que causa "Por confirmar"
    resolved = buildExactHardcodedLineup(context.players, hardcoded.formation, hardcoded.startingNumbers);
  } else {
    const knownFormation = context.formationOverride ?? undefined;
    resolved = buildFallbackLineup(context.players, { knownFormation });
  }

  // Populate bench correctly since we bypassed the DB persistence step
  resolved.bench = benchPlayersExcludingStarters(resolved, context.players);
  resolved.benchCount = resolved.bench.length;
  
  return resolved;
}

/**
 * Resuelve la alineación con prioridad:
 * 1. confirmed (FotMob → BSD → API-Football),
 * 2. predicted/probable,
 * 3. fallback dorsal+posición.
 */
export async function resolveTeamLineup(
  supabase: SupabaseClient,
  context: LineupResolveContext
): Promise<ResolvedLineup> {
  // Eliminamos completamente todas las consultas a la base de datos (caché, matchId, etc.)
  // y forzamos el uso directo de las alineaciones hardcodeadas para todo.
  return buildFallbackWithKnownFormation(supabase, context);
}

function benchFromSquadExcludingStarters(
  lineup: ResolvedLineup,
  context: LineupResolveContext
): LineupBenchPlayer[] {
  return benchFromResolved(lineup, context);
}

/** Suplentes derivados de plantilla excluyendo titulares (cron/scripts). */
export function benchPlayersExcludingStarters(
  lineup: ResolvedLineup,
  players: LineupResolveContext["players"]
): LineupBenchPlayer[] {
  return benchFromResolved(lineup, { teamName: "", players });
}

function scheduleConfirmedLineupNotification(
  matchId: string,
  homeTeam: string,
  awayTeam: string,
): void {
  void (async () => {
    try {
      const admin = createAdminClient();
      await maybeNotifyConfirmedLineup(admin, {
        id: matchId,
        home_team: homeTeam,
        away_team: awayTeam,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "notify confirmed lineup";
      console.error("[lineup] confirmed notification failed", message);
    }
  })();
}

export async function resolveMatchLineups(
  supabase: SupabaseClient,
  matchId: string,
  homeTeam: string,
  awayTeam: string,
  homePlayers: LineupResolveContext["players"],
  awayPlayers: LineupResolveContext["players"],
  options?: { notifyConfirmedLineup?: boolean }
): Promise<{ home: ResolvedLineup; away: ResolvedLineup }> {
  const [home, away] = await Promise.all([
    resolveTeamLineup(supabase, { matchId, teamName: homeTeam, players: homePlayers }),
    resolveTeamLineup(supabase, { matchId, teamName: awayTeam, players: awayPlayers }),
  ]);

  if (options?.notifyConfirmedLineup === true) {
    scheduleConfirmedLineupNotification(matchId, homeTeam, awayTeam);
  }

  return { home, away };
}
