/** Horizonte de partidos a precalentar desde el cron. */
export const PREWARM_HORIZON_MS = 48 * 60 * 60 * 1000;

/** Re-fetch de once probable BSD si la caché es más antigua. */
export const PREWARM_PREDICTED_TTL_MS = 6 * 60 * 60 * 1000;

export function isPrewarmCacheFresh(
  fetchedAt: string | null | undefined,
  nowMs: number = Date.now()
): boolean {
  if (!fetchedAt) return false;
  const fetchedMs = Date.parse(fetchedAt);
  if (!Number.isFinite(fetchedMs)) return false;
  return nowMs - fetchedMs < PREWARM_PREDICTED_TTL_MS;
}

export type PrewarmTeamOutcome =
  | { status: "skipped"; reason: "confirmed_cached" | "predicted_fresh" | "no_squad" | "bsd_unconfigured" }
  | { status: "updated"; sourceKind: "confirmed" | "predicted" | "fallback" }
  | { status: "unchanged"; reason: "no_external_data" };

export type PrewarmLineupsResult = {
  horizonHours: number;
  matchesScanned: number;
  teamsProcessed: number;
  updated: number;
  skipped: number;
  unchanged: number;
  errors: string[];
  details: Array<{
    matchId: string;
    teamName: string;
    outcome: PrewarmTeamOutcome;
  }>;
};
