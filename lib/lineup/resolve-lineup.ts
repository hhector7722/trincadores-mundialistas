import { buildFallbackLineup } from "@/lib/lineup/build-fallback-lineup";
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
async function buildFallbackWithKnownFormation(
  supabase: SupabaseClient,
  context: LineupResolveContext
): Promise<ResolvedLineup> {
  const teamKey = context.teamName.toLowerCase().trim();
  const hardcoded = HARDCODED_DEFAULT_LINEUPS[teamKey];

  if (hardcoded) {
    const starters = context.players.filter((p) =>
      p.shirt_number !== null && hardcoded.startingNumbers.includes(p.shirt_number)
    );
    const resolved = buildFallbackLineup(starters, { knownFormation: hardcoded.formation });
    resolved.sourceKind = "fallback"; // Or maybe "hardcoded" but fallback is safer for existing types
    return resolved;
  }

  const knownFormation =
    context.formationOverride ?? (await loadLastKnownFormation(supabase, context.teamName)) ?? undefined;
  return buildFallbackLineup(context.players, { knownFormation });
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
  const matchId = await resolveContextMatchId(supabase, context);
  if (!matchId) {
    return buildFallbackWithKnownFormation(supabase, context);
  }

  const matchMeta = await loadMatchMeta(supabase, matchId);
  const tryConfirmed = shouldFetchConfirmedLineup(
    matchMeta?.kickoff_at,
    matchMeta?.status
  );

  const cached = await loadCachedTeamLineup(supabase, matchId, context.teamName);
  const nowMs = Date.now();
  const fetchedMs = cached?.fetchedAt ? Date.parse(cached.fetchedAt) : 0;
  const isRecentlyFetched = Number.isFinite(fetchedMs) && nowMs - fetchedMs < 5 * 60 * 1000;

  // 1. Rate limit global: si se ha hecho fetch hace menos de 5 min, se devuelve la caché
  // independientemente de si es live o scheduled, para no ahogar los servidores.
  if (cached && isRecentlyFetched) {
    return cached;
  }

  // 2. Si la caché no está stale según sus reglas específicas, la devolvemos.
  if (
    cached?.sourceKind === "confirmed" &&
    !isConfirmedLineupCacheStale(cached, matchMeta?.kickoff_at, matchMeta?.status, nowMs)
  ) {
    return cached;
  }

  if (
    cached?.sourceKind === "predicted" &&
    !tryConfirmed &&
    !isPredictedLineupCacheStale(cached)
  ) {
    return cached;
  }

  // 3. Intentamos fetchear confirmada si corresponde
  if (tryConfirmed) {
    const confirmed = await fetchConfirmedLineup(supabase, { ...context, matchId });
    if (confirmed) {
      await upsertTeamLineup(
        supabase, matchId, context.teamName, confirmed,
        confirmed.bench ?? benchFromSquadExcludingStarters(confirmed, context)
      );
      return confirmed;
    }
  }

  // 4. Si TODO ha fallado, verificamos si tenemos CACHÉ (confirmada)
  if (cached && cached.sourceKind === "confirmed") {
    await upsertTeamLineup(supabase, matchId, context.teamName, { ...cached, fetchedAt: new Date().toISOString() }, cached.bench ?? []);
    return cached;
  }

  // 5. Fallback logic: Usamos Alineaciones Hardcodeadas o Fallback genérico
  // ELIMINAMOS por completo fetchPredictedLineup para maximizar el rendimiento.
  const fallback = await buildFallbackWithKnownFormation(supabase, context);
  const shouldPersist =
    !cached ||
    isBetterLineupSource(fallback.sourceKind, cached.sourceKind) ||
    !cached.formationLabel ||
    cached.formation !== fallback.formation;

  if (shouldPersist) {
    await upsertTeamLineup(
      supabase, matchId, context.teamName, fallback,
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
