import { computeReliabilityPct } from "@/lib/ranking/reliability";
import { loadTournamentGeneralScoresByProfile } from "@/lib/tournament-predictions/score-queries";
import { createClient } from "@/lib/supabase/server";

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

type ScoreRow = {
  profile_id: string;
  match_points: number;
  exact_hits: number;
  sign_hits: number;
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

function toReferenceMatchday(
  row: { id: string; name: string; sequence: number } | undefined
): ReferenceMatchday | null {
  if (!row) return null;
  return { id: row.id, name: row.name, sequence: row.sequence };
}

async function getMatchdayPair(poolId: string): Promise<{
  current: ReferenceMatchday | null;
  previous: ReferenceMatchday | null;
}> {
  const supabase = await createClient();
  const { data: matchdays } = await supabase
    .from("matchdays")
    .select("id, name, sequence, created_at")
    .eq("pool_id", poolId)
    .order("sequence", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(2);

  return {
    current: toReferenceMatchday(matchdays?.[0]),
    previous: toReferenceMatchday(matchdays?.[1]),
  };
}

export async function getReferenceMatchday(
  poolId: string
): Promise<ReferenceMatchday | null> {
  const { current } = await getMatchdayPair(poolId);
  return current;
}

export async function getReferenceMatchdayId(
  poolId: string
): Promise<string | null> {
  const ref = await getReferenceMatchday(poolId);
  return ref?.id ?? null;
}

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
    .select("id, username, display_name, avatar_url")
    .in("id", profileIds);

  const profileMap = new Map(
    (profiles ?? []).map((p) => [
      p.id,
      {
        label: p.display_name ?? p.username,
        username: p.username,
        avatarUrl: p.avatar_url,
      },
    ])
  );

  return memberships.map((m) => {
    const p = profileMap.get(m.profile_id);
    return {
      profileId: m.profile_id,
      label: p?.label ?? " ",
      username: p?.username ?? " ",
      avatarUrl: p?.avatarUrl ?? null,
    };
  });
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

async function loadQuizPointsByProfile(poolId: string): Promise<Map<string, number>> {
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

  const totals = new Map<string, number>();
  for (const row of scores ?? []) {
    const profileId = row.profile_id as string;
    totals.set(profileId, (totals.get(profileId) ?? 0) + ((row.best_score as number) ?? 0));
  }

  return totals;
}

async function loadScoresForMatchday(
  poolId: string,
  matchdayId: string
): Promise<Map<string, ScoreRow>> {
  const supabase = await createClient();
  const { data: scores } = await supabase
    .from("pool_member_scores")
    .select("profile_id, match_points, exact_hits, sign_hits, cumulative_points")
    .eq("pool_id", poolId)
    .eq("matchday_id", matchdayId);

  return new Map(
    (scores ?? []).map((s) => [
      s.profile_id,
      {
        profile_id: s.profile_id,
        match_points: s.match_points ?? 0,
        exact_hits: s.exact_hits ?? 0,
        sign_hits: s.sign_hits ?? 0,
        cumulative_points: s.cumulative_points ?? 0,
      },
    ])
  );
}

function buildPositionMap(
  members: MemberRow[],
  scores: Map<string, ScoreRow>
): Map<string, number> {
  const merged = members.map((m) => {
    const s = scores.get(m.profileId);
    return {
      profileId: m.profileId,
      label: m.label,
      cumulativePoints: s?.cumulative_points ?? 0,
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
  reliability: Map<string, { resolvedCount: number; totalPoints: number }>,
  generalPoints: Map<string, number>,
  quizPoints: Map<string, number>,
  previousPositions: Map<string, number> | null
): Omit<LeaderboardRow, "position">[] {
  const merged = members.map((m) => {
    const s = scores.get(m.profileId);
    const rel = reliability.get(m.profileId);
    const general = generalPoints.get(m.profileId) ?? 0;
    const matchCumulative = s?.cumulative_points ?? 0;
    return {
      profileId: m.profileId,
      label: m.label,
      username: m.username,
      avatarUrl: m.avatarUrl,
      cumulativePoints: matchCumulative + general,
      exactHits: s?.exact_hits ?? 0,
      signHits: s?.sign_hits ?? 0,
      matchPoints: s?.match_points ?? 0,
      generalPoints: general,
      quizPoints: quizPoints.get(m.profileId) ?? 0,
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
  matchday: ReferenceMatchday | null;
  rows: LeaderboardRow[];
}> {
  const { current: matchday, previous } = await getMatchdayPair(poolId);
  const members = await loadMembers(poolId);

  if (!members.length) {
    return { matchday, rows: [] };
  }

  const [scores, previousScores, reliability, generalScoreRows, quizPoints] = await Promise.all([
    matchday ? loadScoresForMatchday(poolId, matchday.id) : Promise.resolve(new Map<string, ScoreRow>()),
    previous ? loadScoresForMatchday(poolId, previous.id) : Promise.resolve(new Map<string, ScoreRow>()),
    loadResolvedPredictionStats(poolId),
    loadTournamentGeneralScoresByProfile(poolId),
    loadQuizPointsByProfile(poolId),
  ]);

  const generalPoints = new Map(
    [...generalScoreRows.entries()].map(([profileId, row]) => [profileId, row.totalPoints])
  );

  const previousPositions = previous ? buildPositionMap(members, previousScores) : null;
  const sorted = buildLeaderboardRows(
    members,
    scores,
    reliability,
    generalPoints,
    quizPoints,
    previousPositions
  );

  return {
    matchday,
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