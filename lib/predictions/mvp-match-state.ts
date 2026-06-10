import type { MatchWithPrediction } from "@/lib/predictions/queries";

export type MvpSnapshot = {
  player_name: string;
  team_name: string;
};

export function mvpSnapshotFromMatch(match: MatchWithPrediction): MvpSnapshot | null {
  const player_name = match.mvpPrediction?.player_name?.trim();
  const team_name = match.mvpPrediction?.team_name?.trim();
  if (!player_name || !team_name) return null;
  return { player_name, team_name };
}

export function mergeMvpIntoMatch(
  match: MatchWithPrediction,
  mvp: MvpSnapshot | null | undefined
): MatchWithPrediction {
  if (!mvp?.player_name?.trim() || !mvp.team_name?.trim()) return match;

  return {
    ...match,
    mvpPrediction: {
      id: match.mvpPrediction?.id ?? "",
      player_name: mvp.player_name,
      team_name: mvp.team_name,
      points_awarded: match.mvpPrediction?.points_awarded ?? null,
      updated_at: match.mvpPrediction?.updated_at ?? new Date().toISOString(),
    },
  };
}

export function mvpOverridesFromMatches(
  matches: MatchWithPrediction[]
): Record<string, MvpSnapshot> {
  const overrides: Record<string, MvpSnapshot> = {};
  for (const match of matches) {
    const snapshot = mvpSnapshotFromMatch(match);
    if (snapshot) overrides[match.id] = snapshot;
  }
  return overrides;
}
