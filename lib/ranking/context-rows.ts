import type { LeaderboardRow } from "@/lib/ranking/queries";

const VISIBLE_ROW_COUNT = 3;

/** Índice de la primera fila visible por defecto (usuario centrado o anclado en extremos). */
export function getContextualLeaderboardStartIndex(
  rows: LeaderboardRow[],
  currentProfileId?: string
): number {
  if (rows.length <= VISIBLE_ROW_COUNT) return 0;
  if (!currentProfileId) return 0;

  const userIndex = rows.findIndex((row) => row.profileId === currentProfileId);
  if (userIndex === -1) return 0;
  if (userIndex === 0) return 0;
  if (userIndex === rows.length - 1) return rows.length - VISIBLE_ROW_COUNT;

  return userIndex - 1;
}

export function pickContextualLeaderboardRows(
  rows: LeaderboardRow[],
  currentProfileId?: string
): LeaderboardRow[] {
  if (rows.length === 0) return [];

  const start = getContextualLeaderboardStartIndex(rows, currentProfileId);
  return rows.slice(start, start + Math.min(VISIBLE_ROW_COUNT, rows.length));
}
