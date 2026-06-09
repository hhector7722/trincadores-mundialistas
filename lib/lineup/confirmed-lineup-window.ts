/** BSD/API-Football suelen publicar el XI confirmado ~1 h antes del pitido. */
export const CONFIRMED_LINEUP_WINDOW_MS = 90 * 60 * 1000;

const LIVE_STATUSES = new Set(["live", "inprogress", "finished", "postponed"]);

/** ¿Merece la pena llamar a fuentes confirmadas (BSD/API-Football)? */
export function shouldFetchConfirmedLineup(
  kickoffAt: string | null | undefined,
  status: string | null | undefined,
  nowMs: number = Date.now()
): boolean {
  if (status && LIVE_STATUSES.has(status)) return true;
  if (!kickoffAt) return false;
  const kickoffMs = Date.parse(kickoffAt);
  if (!Number.isFinite(kickoffMs)) return false;
  return kickoffMs - nowMs <= CONFIRMED_LINEUP_WINDOW_MS;
}
