import { buildFallbackLineup } from "@/lib/lineup/build-fallback-lineup";
import { shouldFetchConfirmedLineup } from "@/lib/lineup/confirmed-lineup-window";
import { isPredictedLineupCacheStale } from "@/lib/lineup/lineup-cache-stale";
import {
  findPrimaryMatchIdForTeam,
  isBetterLineupSource,
  loadCachedTeamLineup,
  loadLastKnownFormation,
  upsertTeamLineup,
} from "@/lib/lineup/lineup-queries";
import { apiFootballConfirmedProvider } from "@/lib/lineup/sources/api-football";
import { bsdConfirmedProvider } from "@/lib/lineup/sources/bsd-confirmed";
import { bsdPredictedProvider } from "@/lib/lineup/sources/bsd-predicted";
import type { LineupBenchPlayer, LineupResolveContext, LineupSourceKind, ResolvedLineup } from "@/lib/lineup/types";
import type { SupabaseClient } from "@supabase/supabase-js";

export type LineupSourceResolution = {
  kind: LineupSourceKind;
  dataSourceCode: string | null;
  fromCache: boolean;
};

const CONFIRMED_PROVIDERS = [bsdConfirmedProvider, apiFootballConfirmedProvider];
const PREDICTED_PROVIDERS = [bsdPredictedProvider];

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

export async function fetchPredictedLineup(
  supabase: SupabaseClient,
  context: LineupResolveContext & { matchId: string }
): Promise<ResolvedLineup | null> {
  const params = {
    supabase,
    matchId: context.matchId,
    teamName: context.teamName,
    players: context.players,
  };

  for (const provider of PREDICTED_PROVIDERS) {
    const lineup = await provider.fetchPredictedLineup(params);
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

    if (cached?.sourceKind === "predicted") {
      return {
        kind: "predicted",
        dataSourceCode: cached.dataSourceCode,
        fromCache: true,
      };
    }

    const predicted = await fetchPredictedLineup(supabase, {
      ...context,
      matchId,
    });
    if (predicted) {
      return {
        kind: "predicted",
        dataSourceCode: predicted.dataSourceCode,
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

async function buildFallbackWithKnownFormation(
  supabase: SupabaseClient,
  context: LineupResolveContext
): Promise<ResolvedLineup> {
  const knownFormation =
    context.formationOverride ?? (await loadLastKnownFormation(supabase, context.teamName)) ?? undefined;
  return buildFallbackLineup(context.players, { knownFormation });
}

/**
 * Resuelve la alineación con prioridad:
 * 1. confirmed (API-Football u otra fuente enchufada),
 * 2. predicted/probable,
 * 3. fallback dorsal+posición.
 */
export async function resolveTeamLineup(
  supabase: SupabaseClient,
  context: LineupResolveContext
): Promise<ResolvedLineup> {
  const matchId = await resolveContextMatchId(supabase, context);
  if (!matchId) {
    return buildFallbackWithKnownFormation(supabase, context);
  }

  const cached = await loadCachedTeamLineup(supabase, matchId, context.teamName);
  if (cached?.sourceKind === "confirmed") {
    return cached;
  }

  const matchMeta = await loadMatchMeta(supabase, matchId);
  const tryConfirmed = shouldFetchConfirmedLineup(
    matchMeta?.kickoff_at,
    matchMeta?.status
  );

  if (
    cached?.sourceKind === "predicted" &&
    !tryConfirmed &&
    !isPredictedLineupCacheStale(cached)
  ) {
    return cached;
  }

  if (tryConfirmed) {
    const confirmed = await fetchConfirmedLineup(supabase, {
      ...context,
      matchId,
    });
    if (confirmed) {
      await upsertTeamLineup(
        supabase,
        matchId,
        context.teamName,
        confirmed,
        confirmed.bench ?? benchFromSquadExcludingStarters(confirmed, context)
      );
      return confirmed;
    }
  }

  if (cached?.sourceKind === "predicted" && !isPredictedLineupCacheStale(cached)) {
    return cached;
  }

  const predicted = await fetchPredictedLineup(supabase, {
    ...context,
    matchId,
  });
  if (predicted) {
    await upsertTeamLineup(
      supabase,
      matchId,
      context.teamName,
      predicted,
      predicted.bench ?? []
    );
    return predicted;
  }

  const fallback = await buildFallbackWithKnownFormation(supabase, context);
  const shouldPersist =
    !cached ||
    isBetterLineupSource(fallback.sourceKind, cached.sourceKind) ||
    cached.formation !== fallback.formation;
  if (shouldPersist) {
    await upsertTeamLineup(
      supabase,
      matchId,
      context.teamName,
      fallback,
      benchFromSquadExcludingStarters(fallback, context)
    );
  }

  return fallback;
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

export async function resolveMatchLineups(
  supabase: SupabaseClient,
  matchId: string,
  homeTeam: string,
  awayTeam: string,
  homePlayers: LineupResolveContext["players"],
  awayPlayers: LineupResolveContext["players"]
): Promise<{ home: ResolvedLineup; away: ResolvedLineup }> {
  const [home, away] = await Promise.all([
    resolveTeamLineup(supabase, { matchId, teamName: homeTeam, players: homePlayers }),
    resolveTeamLineup(supabase, { matchId, teamName: awayTeam, players: awayPlayers }),
  ]);
  return { home, away };
}
