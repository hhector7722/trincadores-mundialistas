import { createClient } from "@/lib/supabase/server";

export type ReferenceMatchday = {
  id: string;
  name: string;
  sequence: number;
};

export type LeaderboardRow = {
  position: number;
  profileId: string;
  label: string;
  username: string;
  cumulativePoints: number;
  exactHits: number;
  signHits: number;
  matchPoints: number;
};

export type MemberStanding = {
  position: number;
  profileId: string;
  label: string;
  username: string;
  cumulativePoints: number;
  exactHits: number;
  signHits: number;
  matchPoints: number;
  totalMembers: number;
  ahead: LeaderboardRow | null;
  behind: LeaderboardRow | null;
};

type MemberRow = {
  profileId: string;
  label: string;
  username: string;
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

export async function getReferenceMatchday(
  poolId: string
): Promise<ReferenceMatchday | null> {
  const supabase = await createClient();
  const { data: matchdays } = await supabase
    .from("matchdays")
    .select("id, name, sequence, created_at")
    .eq("pool_id", poolId)
    .order("sequence", { ascending: false })
    .order("created_at", { ascending: false });

  if (!matchdays?.length) return null;

  const top = matchdays[0];
  return {
    id: top.id,
    name: top.name,
    sequence: top.sequence,
  };
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
    .select("id, username, display_name")
    .in("id", profileIds);

  const profileMap = new Map(
    (profiles ?? []).map((p) => [
      p.id,
      {
        label: p.display_name ?? p.username,
        username: p.username,
      },
    ])
  );

  return memberships.map((m) => {
    const p = profileMap.get(m.profile_id);
    return {
      profileId: m.profile_id,
      label: p?.label ?? " ",
      username: p?.username ?? " ",
    };
  });
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

function buildLeaderboardRows(
  members: MemberRow[],
  scores: Map<string, ScoreRow>
): Omit<LeaderboardRow, "position">[] {
  const merged = members.map((m) => {
    const s = scores.get(m.profileId);
    return {
      profileId: m.profileId,
      label: m.label,
      username: m.username,
      cumulativePoints: s?.cumulative_points ?? 0,
      exactHits: s?.exact_hits ?? 0,
      signHits: s?.sign_hits ?? 0,
      matchPoints: s?.match_points ?? 0,
    };
  });

  merged.sort(compareRows);
  return merged;
}

export async function getPoolLeaderboard(poolId: string): Promise<{
  matchday: ReferenceMatchday | null;
  rows: LeaderboardRow[];
}> {
  const matchday = await getReferenceMatchday(poolId);
  const members = await loadMembers(poolId);

  if (!members.length) {
    return { matchday, rows: [] };
  }

  const scores = matchday
    ? await loadScoresForMatchday(poolId, matchday.id)
    : new Map<string, ScoreRow>();

  const sorted = buildLeaderboardRows(members, scores);

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
    cumulativePoints: row.cumulativePoints,
    exactHits: row.exactHits,
    signHits: row.signHits,
    matchPoints: row.matchPoints,
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
    cumulativePoints: row.cumulativePoints,
    exactHits: row.exactHits,
    signHits: row.signHits,
    matchPoints: row.matchPoints,
    totalMembers: rows.length,
    ahead: index > 0 ? rows[index - 1] : null,
    behind: index < rows.length - 1 ? rows[index + 1] : null,
  };
}