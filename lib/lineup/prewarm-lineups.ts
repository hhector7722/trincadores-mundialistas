import { buildFallbackLineup } from "@/lib/lineup/build-fallback-lineup";
import { shouldFetchConfirmedLineup } from "@/lib/lineup/confirmed-lineup-window";
import {
  loadCachedTeamLineup,
  loadLastKnownFormation,
  upsertTeamLineup,
} from "@/lib/lineup/lineup-queries";
import { isPredictedLineupCacheStale } from "@/lib/lineup/lineup-cache-stale";
import {
  isPrewarmCacheFresh,
  PREWARM_HORIZON_MS,
  type PrewarmLineupsResult,
  type PrewarmTeamOutcome,
} from "@/lib/lineup/prewarm-types";
import {
  benchPlayersExcludingStarters,
  fetchConfirmedLineup,
  fetchPredictedLineup,
} from "@/lib/lineup/resolve-lineup";
import { isBsdConfigured } from "@/lib/lineup/sources/bsd-client";
import type { LineupPlayerInput } from "@/lib/lineup/types";
import { maybeNotifyConfirmedLineup } from "@/lib/notifications/confirmed-lineup-notifications";
import { getTeamSquadByName } from "@/lib/worldcup-data/squad-queries";
import type { SupabaseClient } from "@supabase/supabase-js";

type UpcomingMatch = {
  id: string;
  home_team: string;
  away_team: string;
  kickoff_at: string;
  status: string | null;
};

async function loadUpcomingMatches(
  supabase: SupabaseClient,
  nowMs: number
): Promise<UpcomingMatch[]> {
  const fromIso = new Date(nowMs).toISOString();
  const toIso = new Date(nowMs + PREWARM_HORIZON_MS).toISOString();

  const { data, error } = await supabase
    .from("matches")
    .select("id, home_team, away_team, kickoff_at, status")
    .eq("status", "scheduled")
    .gte("kickoff_at", fromIso)
    .lte("kickoff_at", toIso)
    .order("kickoff_at", { ascending: true });

  if (error) throw new Error(`matches: ${error.message}`);
  return data ?? [];
}

async function prewarmTeamLineup(
  supabase: SupabaseClient,
  match: UpcomingMatch,
  teamName: string,
  players: LineupPlayerInput[]
): Promise<PrewarmTeamOutcome> {
  if (!isBsdConfigured()) {
    return { status: "skipped", reason: "bsd_unconfigured" };
  }

  const context = {
    matchId: match.id,
    teamName,
    players,
  };

  const cached = await loadCachedTeamLineup(supabase, match.id, teamName);
  if (cached?.sourceKind === "confirmed") {
    return { status: "skipped", reason: "confirmed_cached" };
  }

  const tryConfirmed = shouldFetchConfirmedLineup(match.kickoff_at, match.status);
  if (tryConfirmed) {
    const confirmed = await fetchConfirmedLineup(supabase, context);
    if (confirmed) {
      await upsertTeamLineup(
        supabase,
        match.id,
        teamName,
        confirmed,
        confirmed.bench ?? benchPlayersExcludingStarters(confirmed, players)
      );
      return { status: "updated", sourceKind: "confirmed" };
    }
  }

  if (
    cached?.sourceKind === "predicted" &&
    isPrewarmCacheFresh(cached.fetchedAt) &&
    !isPredictedLineupCacheStale(cached)
  ) {
    return { status: "skipped", reason: "predicted_fresh" };
  }

  const predicted = await fetchPredictedLineup(supabase, context);
  if (predicted) {
    await upsertTeamLineup(supabase, match.id, teamName, predicted, predicted.bench ?? []);
    return { status: "updated", sourceKind: "predicted" };
  }

  if (cached) {
    return { status: "unchanged", reason: "no_external_data" };
  }

  const knownFormation = await loadLastKnownFormation(supabase, teamName);
  const fallback = buildFallbackLineup(players, { knownFormation: knownFormation ?? undefined });
  await upsertTeamLineup(
    supabase,
    match.id,
    teamName,
    fallback,
    benchPlayersExcludingStarters(fallback, players)
  );
  return { status: "updated", sourceKind: "fallback" };
}

export async function prewarmUpcomingLineups(
  supabase: SupabaseClient,
  nowMs: number = Date.now()
): Promise<PrewarmLineupsResult> {
  const matches = await loadUpcomingMatches(supabase, nowMs);
  const result: PrewarmLineupsResult = {
    horizonHours: PREWARM_HORIZON_MS / (60 * 60 * 1000),
    matchesScanned: matches.length,
    teamsProcessed: 0,
    updated: 0,
    skipped: 0,
    unchanged: 0,
    errors: [],
    details: [],
  };

  for (const match of matches) {
    const teams = [
      { teamName: match.home_team, side: "home" as const },
      { teamName: match.away_team, side: "away" as const },
    ];

    for (const { teamName } of teams) {
      result.teamsProcessed += 1;

      try {
        const squad = await getTeamSquadByName(supabase, teamName);
        if (!squad?.players.length) {
          const outcome: PrewarmTeamOutcome = { status: "skipped", reason: "no_squad" };
          result.skipped += 1;
          result.details.push({ matchId: match.id, teamName, outcome });
          continue;
        }

        const outcome = await prewarmTeamLineup(supabase, match, teamName, squad.players);
        result.details.push({ matchId: match.id, teamName, outcome });

        if (outcome.status === "updated") result.updated += 1;
        else if (outcome.status === "skipped") result.skipped += 1;
        else result.unchanged += 1;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Error desconocido en precalentamiento";
        result.errors.push(`${match.id}/${teamName}: ${message}`);
      }
    }

    try {
      await maybeNotifyConfirmedLineup(supabase, {
        id: match.id,
        home_team: match.home_team,
        away_team: match.away_team,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Error al notificar alineaciones confirmadas";
      result.errors.push(`${match.id}/notify: ${message}`);
    }
  }

  return result;
}
