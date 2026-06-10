import type { MatchWithPrediction } from "@/lib/predictions/queries";

export type MvpSnapshot = {
  player_name: string;
  team_name: string;
};

export function mvpPlayerNameFromMatch(match: MatchWithPrediction): string | null {
  const player_name = match.mvpPrediction?.player_name?.trim();
  return player_name || null;
}

export function mvpSnapshotFromMatch(match: MatchWithPrediction): MvpSnapshot | null {
  const player_name = mvpPlayerNameFromMatch(match);
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

/** Partido de lista + MVP del `match` activo (p. ej. tras guardar en `match_mvp_predictions`). */
export function preferMatchMvpData(
  listed: MatchWithPrediction,
  preferred: MatchWithPrediction
): MatchWithPrediction {
  if (listed.id !== preferred.id) return listed;
  const snapshot = mvpSnapshotFromMatch(preferred);
  return snapshot ? mergeMvpIntoMatch(listed, snapshot) : listed;
}

export function patchMatchMvpPrediction(
  match: MatchWithPrediction,
  playerName: string,
  teamName: string
): MatchWithPrediction {
  return mergeMvpIntoMatch(match, {
    player_name: playerName,
    team_name: teamName,
  });
}

export function mvpOverridesFromMatchListAndActive(
  matches: MatchWithPrediction[],
  active: MatchWithPrediction
): Record<string, MvpSnapshot> {
  const overrides = mvpOverridesFromMatches(matches);
  const activeSnapshot = mvpSnapshotFromMatch(active);
  if (activeSnapshot) overrides[active.id] = activeSnapshot;
  return overrides;
}
