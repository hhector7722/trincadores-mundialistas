import { isProfileOnboardingComplete } from "@/lib/auth/onboarding-device";
import { MATCH_SCORE_POINTS } from "@/lib/predictions/scoring";
import { computeReliabilityPct } from "@/lib/ranking/reliability";
import { loadQuizFinalRankingBonusesByProfile } from "@/lib/quiz/score-queries";
import { loadTournamentGeneralScoresByProfile } from "@/lib/tournament-predictions/score-queries";
import { createClient } from "@/lib/supabase/server";

export type ReferenceMatch = {
  id: string;
  homeTeam: string;
  awayTeam: string;
  kickoffAt: string;
  matchdayId: string;
};

/** @deprecated Usar ReferenceMatch. Se mantiene para compatibilidad interna. */
export type ReferenceMatchday = {
  id: string;
  name: string;
  sequence: number;
};

export type PositionTrend = "up" | "down" | null;

export type LeaderboardRow = {
  position: number;
  positionTrend: PositionTrend;
  profileId: string;
  label: string;
  username: string;
  avatarUrl: string | null;
  cumulativePoints: number;
  exactHits: number;
  signHits: number;
  matchPoints: number;
  generalPoints: number;
  quizPoints: number;
  hasQuizParticipated: boolean;
  quizFinalBonus: number;
  reliabilityPct: number | null;
};

export type MemberStanding = {
  position: number;
  profileId: string;
  label: string;
  username: string;
  avatarUrl: string | null;
  cumulativePoints: number;
  exactHits: number;
  signHits: number;
  matchPoints: number;
  generalPoints: number;
  totalMembers: number;
  ahead: LeaderboardRow | null;
  behind: LeaderboardRow | null;
};

type MemberRow = {
  profileId: string;
  label: string;
  username: string;
  avatarUrl: string | null;
};

type MatchStatsRow = {
  profile_id: string;
  match_points: number;
  exact_hits: number;
  sign_hits: number;
};

type ScoreRow = MatchStatsRow & {
  cumulative_points: number;
};

function sortKey(row: {
  label: string;
  cumulativePoints: number;
  exactHits: number;
}): [number, number, string] {
  return [-row.cumulativePoints, -row.exactHits, row.label.toLowerCase()];
}

function compareRows(
  a: { label: string; cumulativePoints: number; exactHits: number },
  b: { label: string; cumulativePoints: number; exactHits: number }
): number {
  const ka = sortKey(a);
  const kb = sortKey(b);
  if (ka[0] !== kb[0]) return ka[0] - kb[0];
  if (ka[1] !== kb[1]) return ka[1] - kb[1];
  return ka[2].localeCompare(kb[2], "es");
}

export type RankingSortSnapshot = {
  cumulativePoints: number;
  exactHits: number;
};

/** Misma regla de orden que `getPoolLeaderboard` (pts → exactos → nombre). */
export function compareLeaderboardRows(
  a: { label: string; cumulativePoints: number; exactHits: number },
  b: { label: string; cumulativePoints: number; exactHits: number }
): number {
  return compareRows(a, b);
}

/** Clasificación acumulada hasta el pitido indicado (incluye general + bonus quiz final). */
export async function loadRankingSnapshotThroughKickoff(
  poolId: string,
  throughKickoffAt: string
): Promise<Map<string, RankingSortSnapshot>> {
  const [members, matchIds, generalScoreRows, quizFinalBonus] = await Promise.all([
    loadMembers(poolId),
    getFinishedMatchIdsThroughKickoff(poolId, throughKickoffAt),
    loadTournamentGeneralScoresByProfile(poolId),
    loadQuizFinalRankingBonusesByProfile(poolId),
  ]);

  const matchStats = await loadMatchStatsForMatchIds(poolId, matchIds);
  const scores = toScoreRowMap(matchStats);
  const generalPoints = new Map(
    [...generalScoreRows.entries()].map(([profileId, row]) => [profileId, row.totalPoints])
  );

  const snapshot = new Map<string, RankingSortSnapshot>();
  for (const member of members) {
    const scoreRow = scores.get(member.profileId);
    const general = generalPoints.get(member.profileId) ?? 0;
    const quizBonus = quizFinalBonus.get(member.profileId) ?? 0;
    const matchCumulative = scoreRow?.cumulative_points ?? 0;
    snapshot.set(member.profileId, {
      cumulativePoints: matchCumulative + general + quizBonus,
      exactHits: scoreRow?.exact_hits ?? 0,
    });
  }

  return snapshot;
}

function mapReferenceMatch(row: {
  id: string;
  home_team: string;
  away_team: string;
  kickoff_at: string;
  matchday_id: string;
}): ReferenceMatch {
  return {
    id: row.id,
    homeTeam: row.home_team,
    awayTeam: row.away_team,
    kickoffAt: row.kickoff_at,
    matchdayId: row.matchday_id,
  };
}

async function getFinishedMatchPair(poolId: string): Promise<{
  current: ReferenceMatch | null;
  previous: ReferenceMatch | null;
}> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("matches")
    .select("id, home_team, away_team, kickoff_at, matchday_id, matchdays!inner(pool_id)")
    .eq("status", "finished")
    .eq("matchdays.pool_id", poolId)
    .order("kickoff_at", { ascending: false })
    .limit(2);

  if (error) throw new Error(error.message);

  const matches = (data ?? []).map((row) =>
    mapReferenceMatch({
      id: row.id,
      home_team: row.home_team,
      away_team: row.away_team,
      kickoff_at: row.kickoff_at,
      matchday_id: row.matchday_id,
    })
  );

  return {
    current: matches[0] ?? null,
    previous: matches[1] ?? null,
  };
}

async function getFinishedMatchIdsThroughKickoff(
  poolId: string,
  throughKickoffAt: string | null
): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("matches")
    .select("id, kickoff_at, matchdays!inner(pool_id)")
    .eq("status", "finished")
    .eq("matchdays.pool_id", poolId)
    .order("kickoff_at", { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? [])
    .filter((row) => !throughKickoffAt || row.kickoff_at <= throughKickoffAt)
    .map((row) => row.id as string);
}

function ingestMatchPoints(
  stats: Map<string, MatchStatsRow>,
  profileId: string,
  points: number
) {
  const current = stats.get(profileId) ?? {
    profile_id: profileId,
    match_points: 0,
    exact_hits: 0,
    sign_hits: 0,
  };
  current.match_points += points;
  if (points === MATCH_SCORE_POINTS.exact) current.exact_hits += 1;
  if (points === MATCH_SCORE_POINTS.sign) current.sign_hits += 1;
  stats.set(profileId, current);
}

async function loadMatchStatsForMatchIds(
  poolId: string,
  matchIds: string[]
): Promise<Map<string, MatchStatsRow>> {
  if (!matchIds.length) return new Map();

  const supabase = await createClient();
  const [{ data: predictions, error: predictionError }, { data: mvps, error: mvpError }] =
    await Promise.all([
      supabase
        .from("predictions")
        .select("profile_id, points_awarded")
        .eq("pool_id", poolId)
        .in("match_id", matchIds)
        .not("points_awarded", "is", null),
      supabase
        .from("match_mvp_predictions")
        .select("profile_id, points_awarded")
        .eq("pool_id", poolId)
        .in("match_id", matchIds)
        .not("points_awarded", "is", null),
    ]);

  if (predictionError) throw new Error(predictionError.message);
  if (mvpError) throw new Error(mvpError.message);

  const stats = new Map<string, MatchStatsRow>();
  for (const row of predictions ?? []) {
    ingestMatchPoints(stats, row.profile_id, row.points_awarded ?? 0);
  }
  for (const row of mvps ?? []) {
    ingestMatchPoints(stats, row.profile_id, row.points_awarded ?? 0);
  }

  return stats;
}

function toScoreRowMap(stats: Map<string, MatchStatsRow>): Map<string, ScoreRow> {
  return new Map(
    [...stats.entries()].map(([profileId, row]) => [
      profileId,
      {
        ...row,
        cumulative_points: row.match_points,
      },
    ])
  );
}

export async function getReferenceMatch(poolId: string): Promise<ReferenceMatch | null> {
  const { current } = await getFinishedMatchPair(poolId);
  return current;
}

export async function getReferenceMatchday(
  poolId: string
): Promise<ReferenceMatchday | null> {
  const referenceMatch = await getReferenceMatch(poolId);
  if (!referenceMatch) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("matchdays")
    .select("id, name, sequence")
    .eq("id", referenceMatch.matchdayId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  return {
    id: data.id,
    name: data.name,
    sequence: data.sequence,
  };
}

export async function getReferenceMatchdayId(
  poolId: string
): Promise<string | null> {
  const ref = await getReferenceMatchday(poolId);
  return ref?.id ?? null;
}

export type PoolRankingMember = {
  profileId: string;
  label: string;
  username: string;
  avatarUrl: string | null;
};

async function loadMembers(poolId: string): Promise<MemberRow[]> {
  const supabase = await createClient();
  const { data: memberships } = await supabase
    .from("pool_members")
    .select("profile_id")
    .eq("pool_id", poolId);

  if (!memberships?.length) return [];

  const profileIds = memberships.map((m) => m.profile_id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url, onboarding_completed_at")
    .in("id", profileIds);

  const profileMap = new Map(
    (profiles ?? [])
      .filter((p) => isProfileOnboardingComplete(p))
      .map((p) => [
        p.id,
        {
          label: p.display_name ?? p.username,
          username: p.username,
          avatarUrl: p.avatar_url,
        },
      ])
  );

  return memberships
    .map((m) => {
      const p = profileMap.get(m.profile_id);
      if (!p) return null;
      return {
        profileId: m.profile_id,
        label: p.label,
        username: p.username,
        avatarUrl: p.avatarUrl,
      };
    })
    .filter((row): row is MemberRow => row !== null);
}

export async function loadPoolRankingMembers(poolId: string): Promise<PoolRankingMember[]> {
  return loadMembers(poolId);
}

export type RankingEvolutionStanding = {
  profileId: string;
  position: number;
  cumulativePoints: number;
};

/** Posiciones globales a partir de snapshots (misma regla que la tabla). */
export function buildPositionsFromSnapshots(
  members: Array<{ profileId: string; label: string }>,
  snapshots: Map<string, RankingSortSnapshot>
): RankingEvolutionStanding[] {
  const merged = members.map((m) => {
    const snap = snapshots.get(m.profileId);
    return {
      profileId: m.profileId,
      label: m.label,
      cumulativePoints: snap?.cumulativePoints ?? 0,
      exactHits: snap?.exactHits ?? 0,
    };
  });

  merged.sort(compareRows);
  return merged.map((row, index) => ({
    profileId: row.profileId,
    position: index + 1,
    cumulativePoints: row.cumulativePoints,
  }));
}

async function loadResolvedPredictionStats(
  poolId: string
): Promise<Map<string, { resolvedCount: number; totalPoints: number }>> {
  const supabase = await createClient();
  const { data: predictions } = await supabase
    .from("predictions")
    .select("profile_id, points_awarded")
    .eq("pool_id", poolId)
    .not("points_awarded", "is", null);

  const stats = new Map<string, { resolvedCount: number; totalPoints: number }>();

  for (const prediction of predictions ?? []) {
    const current = stats.get(prediction.profile_id) ?? {
      resolvedCount: 0,
      totalPoints: 0,
    };
    current.resolvedCount += 1;
    current.totalPoints += prediction.points_awarded ?? 0;
    stats.set(prediction.profile_id, current);
  }

  return stats;
}

type QuizProfileStats = {
  points: number;
  hasParticipated: boolean;
};

async function loadQuizStatsByProfile(
  poolId: string
): Promise<Map<string, QuizProfileStats>> {
  const supabase = await createClient();
  const { data: quizzes, error: quizError } = await supabase
    .from("quizzes")
    .select("id")
    .eq("pool_id", poolId)
    .eq("kind", "official")
    .eq("scoring_mode", "competitive");

  if (quizError) throw new Error(quizError.message);
  if (!quizzes?.length) return new Map();

  const quizIds = quizzes.map((q) => q.id as string);
  const { data: scores, error: scoreError } = await supabase
    .from("quiz_leaderboard")
    .select("profile_id, best_score")
    .in("quiz_id", quizIds);

  if (scoreError) throw new Error(scoreError.message);

  const stats = new Map<string, QuizProfileStats>();
  for (const row of scores ?? []) {
    const profileId = row.profile_id as string;
    const current = stats.get(profileId) ?? { points: 0, hasParticipated: false };
    current.points += (row.best_score as number) ?? 0;
    current.hasParticipated = true;
    stats.set(profileId, current);
  }

  return stats;
}

function buildPositionMap(
  members: MemberRow[],
  scores: Map<string, ScoreRow>,
  generalPoints: Map<string, number>,
  quizFinalBonus: Map<string, number>
): Map<string, number> {
  const merged = members.map((m) => {
    const s = scores.get(m.profileId);
    const general = generalPoints.get(m.profileId) ?? 0;
    const quizBonus = quizFinalBonus.get(m.profileId) ?? 0;
    const matchCumulative = s?.cumulative_points ?? 0;
    return {
      profileId: m.profileId,
      label: m.label,
      cumulativePoints: matchCumulative + general + quizBonus,
      exactHits: s?.exact_hits ?? 0,
    };
  });

  merged.sort((a, b) =>
    compareRows(
      {
        label: a.label,
        cumulativePoints: a.cumulativePoints,
        exactHits: a.exactHits,
      },
      {
        label: b.label,
        cumulativePoints: b.cumulativePoints,
        exactHits: b.exactHits,
      }
    )
  );

  return new Map(merged.map((row, index) => [row.profileId, index + 1]));
}

function computePositionTrend(
  currentPosition: number,
  previousPosition: number | undefined
): PositionTrend {
  if (previousPosition === undefined) return null;
  if (currentPosition < previousPosition) return "up";
  if (currentPosition > previousPosition) return "down";
  return null;
}

function buildLeaderboardRows(
  members: MemberRow[],
  scores: Map<string, ScoreRow>,
  lastMatchScores: Map<string, MatchStatsRow>,
  reliability: Map<string, { resolvedCount: number; totalPoints: number }>,
  generalPoints: Map<string, number>,
  quizStats: Map<string, QuizProfileStats>,
  quizFinalBonus: Map<string, number>,
  previousPositions: Map<string, number> | null
): Omit<LeaderboardRow, "position">[] {
  const merged = members.map((m) => {
    const s = scores.get(m.profileId);
    const lastMatch = lastMatchScores.get(m.profileId);
    const rel = reliability.get(m.profileId);
    const general = generalPoints.get(m.profileId) ?? 0;
    const matchCumulative = s?.cumulative_points ?? 0;
    const quizBonus = quizFinalBonus.get(m.profileId) ?? 0;
    const quiz = quizStats.get(m.profileId);
    return {
      profileId: m.profileId,
      label: m.label,
      username: m.username,
      avatarUrl: m.avatarUrl,
      cumulativePoints: matchCumulative + general + quizBonus,
      exactHits: s?.exact_hits ?? 0,
      signHits: s?.sign_hits ?? 0,
      matchPoints: lastMatch?.match_points ?? 0,
      generalPoints: general,
      quizPoints: quiz?.points ?? 0,
      hasQuizParticipated: quiz?.hasParticipated ?? false,
      quizFinalBonus: quizBonus,
      reliabilityPct: computeReliabilityPct(
        rel?.resolvedCount ?? 0,
        rel?.totalPoints ?? 0
      ),
    };
  });

  merged.sort(compareRows);
  return merged.map((row, index) => {
    const position = index + 1;
    return {
      ...row,
      positionTrend: computePositionTrend(
        position,
        previousPositions?.get(row.profileId)
      ),
    };
  });
}

export async function getPoolLeaderboard(poolId: string): Promise<{
  referenceMatch: ReferenceMatch | null;
  previousReferenceMatch: ReferenceMatch | null;
  rows: LeaderboardRow[];
}> {
  const { current: referenceMatch, previous: previousReferenceMatch } =
    await getFinishedMatchPair(poolId);
  const members = await loadMembers(poolId);

  if (!members.length) {
    return { referenceMatch, previousReferenceMatch, rows: [] };
  }

  const [
    currentMatchIds,
    previousMatchIds,
    lastMatchStats,
    reliability,
    generalScoreRows,
    quizStats,
    quizFinalBonus,
  ] = await Promise.all([
    getFinishedMatchIdsThroughKickoff(poolId, referenceMatch?.kickoffAt ?? null),
    previousReferenceMatch
      ? getFinishedMatchIdsThroughKickoff(poolId, previousReferenceMatch.kickoffAt)
      : Promise.resolve([]),
    referenceMatch
      ? loadMatchStatsForMatchIds(poolId, [referenceMatch.id])
      : Promise.resolve(new Map<string, MatchStatsRow>()),
    loadResolvedPredictionStats(poolId),
    loadTournamentGeneralScoresByProfile(poolId),
    loadQuizStatsByProfile(poolId),
    loadQuizFinalRankingBonusesByProfile(poolId),
  ]);

  const [currentMatchStats, previousMatchStats] = await Promise.all([
    loadMatchStatsForMatchIds(poolId, currentMatchIds),
    loadMatchStatsForMatchIds(poolId, previousMatchIds),
  ]);

  const scores = toScoreRowMap(currentMatchStats);
  const previousScores = toScoreRowMap(previousMatchStats);

  const generalPoints = new Map(
    [...generalScoreRows.entries()].map(([profileId, row]) => [profileId, row.totalPoints])
  );

  const previousPositions = previousReferenceMatch
    ? buildPositionMap(members, previousScores, generalPoints, quizFinalBonus)
    : null;
  const sorted = buildLeaderboardRows(
    members,
    scores,
    lastMatchStats,
    reliability,
    generalPoints,
    quizStats,
    quizFinalBonus,
    previousPositions
  );

  return {
    referenceMatch,
    previousReferenceMatch,
    rows: sorted.map((row, index) => ({
      ...row,
      position: index + 1,
    })),
  };
}

export async function getMemberStanding(
  poolId: string,
  profileId: string
): Promise<MemberStanding | null> {
  const { rows } = await getPoolLeaderboard(poolId);
  if (!rows.length) return null;

  const index = rows.findIndex((r) => r.profileId === profileId);
  if (index < 0) return null;

  const row = rows[index];
  return {
    position: row.position,
    profileId: row.profileId,
    label: row.label,
    username: row.username,
    avatarUrl: row.avatarUrl,
    cumulativePoints: row.cumulativePoints,
    exactHits: row.exactHits,
    signHits: row.signHits,
    matchPoints: row.matchPoints,
    generalPoints: row.generalPoints,
    totalMembers: rows.length,
    ahead: index > 0 ? rows[index - 1] : null,
    behind: index < rows.length - 1 ? rows[index + 1] : null,
  };
}

export function memberStandingFromLeaderboard(
  rows: LeaderboardRow[],
  profileId: string
): MemberStanding | null {
  const index = rows.findIndex((r) => r.profileId === profileId);
  if (index < 0) return null;
  const row = rows[index];
  return {
    position: row.position,
    profileId: row.profileId,
    label: row.label,
    username: row.username,
    avatarUrl: row.avatarUrl,
    cumulativePoints: row.cumulativePoints,
    exactHits: row.exactHits,
    signHits: row.signHits,
    matchPoints: row.matchPoints,
    generalPoints: row.generalPoints,
    totalMembers: rows.length,
    ahead: index > 0 ? rows[index - 1] : null,
    behind: index < rows.length - 1 ? rows[index + 1] : null,
  };
}
