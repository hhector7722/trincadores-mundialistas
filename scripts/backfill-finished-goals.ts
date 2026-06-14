import { extractGoalScorersByTeam } from "@/lib/live/goal-scorers";
import { fetchBsdLiveBundle } from "@/lib/live/sources/bsd-live";
import type { MatchLivePayload, MatchPlayerIncident } from "@/lib/live/types";
import { createAdminClient } from "@/lib/scripts/supabase-admin";
import { BSD_SOURCE_CODE } from "@/lib/lineup/sources/bsd-constants";
import { titleCasePlayerName } from "@/lib/worldcup2026/fifa-squads";

type FinishedMatchRow = {
  id: string;
  home_team: string;
  away_team: string;
  external_key: string;
  home_goals: number;
  away_goals: number;
  live_payload: MatchLivePayload | null;
};

function payloadGoalStats(incidents: MatchPlayerIncident[] | undefined, homeGoals: number, awayGoals: number) {
  const { home, away } = extractGoalScorersByTeam(incidents);
  const minutesCount = [...home, ...away].filter((goal) => goal.minute != null).length;
  return {
    homeCount: home.length,
    awayCount: away.length,
    minutesCount,
    matchesScore: home.length === homeGoals && away.length === awayGoals,
  };
}

function shouldReplaceIncidents(
  current: MatchPlayerIncident[] | undefined,
  next: MatchPlayerIncident[],
  homeGoals: number,
  awayGoals: number,
): boolean {
  const oldStats = payloadGoalStats(current, homeGoals, awayGoals);
  const newStats = payloadGoalStats(next, homeGoals, awayGoals);

  if (!newStats.homeCount && !newStats.awayCount) return false;
  if (!oldStats.homeCount && !oldStats.awayCount) return true;
  if (newStats.matchesScore && !oldStats.matchesScore) return true;
  if (newStats.matchesScore && newStats.minutesCount > oldStats.minutesCount) return true;
  return false;
}

function normalizeIncidents(incidents: MatchPlayerIncident[]): MatchPlayerIncident[] {
  return incidents.map((row) => ({
    ...row,
    playerName: titleCasePlayerName(row.playerName),
  }));
}

function incidentsChanged(a: MatchPlayerIncident[], b: MatchPlayerIncident[]): boolean {
  return JSON.stringify(a) !== JSON.stringify(b);
}

async function loadFinishedMatches() {
  const admin = createAdminClient();
  const { data: matches, error } = await admin
    .from("matches")
    .select("id, home_team, away_team, kickoff_at, match_results(home_goals, away_goals), match_live_state(live_payload)")
    .eq("status", "finished")
    .order("kickoff_at", { ascending: true });

  if (error) throw new Error(error.message);
  if (!matches?.length) return [];

  const matchIds = matches.map((row) => row.id as string);
  const { data: maps, error: mapError } = await admin
    .from("external_id_map")
    .select("internal_id, external_key")
    .eq("source_code", BSD_SOURCE_CODE)
    .eq("entity_type", "match")
    .in("internal_id", matchIds);

  if (mapError) throw new Error(mapError.message);

  const externalByMatch = new Map((maps ?? []).map((row) => [row.internal_id as string, row.external_key as string]));
  const rows: FinishedMatchRow[] = [];

  for (const row of matches) {
    const externalKey = externalByMatch.get(row.id as string);
    const result = (row as { match_results: { home_goals: number; away_goals: number } | null }).match_results;
    const liveState = (row as { match_live_state: { live_payload: MatchLivePayload | null } | { live_payload: MatchLivePayload | null }[] | null })
      .match_live_state;
    const payload = Array.isArray(liveState) ? liveState[0]?.live_payload : liveState?.live_payload;
    if (!externalKey || !result) continue;

    rows.push({
      id: row.id as string,
      home_team: row.home_team as string,
      away_team: row.away_team as string,
      external_key: externalKey,
      home_goals: result.home_goals,
      away_goals: result.away_goals,
      live_payload: payload ?? null,
    });
  }

  return rows;
}

async function main() {
  const admin = createAdminClient();
  const matches = await loadFinishedMatches();
  const report: Array<Record<string, unknown>> = [];

  for (const match of matches) {
    const eventId = Number(match.external_key);
    if (!Number.isFinite(eventId)) continue;

    const currentIncidents = match.live_payload?.playerIncidents ?? [];
    const bundle = await fetchBsdLiveBundle(eventId, match.home_team, match.away_team);
    const fetchedIncidents = normalizeIncidents(bundle.payload.playerIncidents ?? []);
    const replace = shouldReplaceIncidents(
      currentIncidents,
      fetchedIncidents,
      match.home_goals,
      match.away_goals,
    );

    const baseIncidents = replace ? fetchedIncidents : normalizeIncidents(currentIncidents);
    const changed = replace || incidentsChanged(currentIncidents, baseIncidents);

    const before = extractGoalScorersByTeam(currentIncidents);
    const after = extractGoalScorersByTeam(baseIncidents);

    let status: "updated" | "kept" | "skipped" = "skipped";
    if (changed) {
      const nextPayload: MatchLivePayload = {
        ...(match.live_payload ?? {}),
        playerIncidents: baseIncidents,
      };
      const { error } = await admin
        .from("match_live_state")
        .update({ live_payload: nextPayload })
        .eq("match_id", match.id);
      if (error) throw new Error(`${match.id}: ${error.message}`);
      status = replace ? "updated" : "kept";
    } else if (currentIncidents.length) {
      status = "kept";
    }

    report.push({
      match: `${match.home_team} vs ${match.away_team}`,
      status,
      score: `${match.home_goals}-${match.away_goals}`,
      beforeHome: before.home.map((g) => `${g.playerName}${g.minute != null ? ` ${g.minute}'` : ""}`),
      beforeAway: before.away.map((g) => `${g.playerName}${g.minute != null ? ` ${g.minute}'` : ""}`),
      afterHome: after.home.map((g) => `${g.playerName}${g.minute != null ? ` ${g.minute}'` : ""}`),
      afterAway: after.away.map((g) => `${g.playerName}${g.minute != null ? ` ${g.minute}'` : ""}`),
    });
  }

  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
