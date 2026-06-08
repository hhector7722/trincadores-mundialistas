import type { LeaderboardRow } from "@/lib/ranking/queries";

const VISIBLE_ROW_COUNT = 3;

export function pickContextualLeaderboardRows(
  rows: LeaderboardRow[],
  currentProfileId?: string
): LeaderboardRow[] {
  if (rows.length === 0) return [];

  if (!currentProfileId) {
    return rows.slice(0, VISIBLE_ROW_COUNT);
  }

  const userIndex = rows.findIndex((row) => row.profileId === currentProfileId);
  if (userIndex === -1) {
    return rows.slice(0, VISIBLE_ROW_COUNT);
  }

  if (rows.length <= VISIBLE_ROW_COUNT) {
    return rows;
  }

  if (userIndex === 0) {
    return rows.slice(0, VISIBLE_ROW_COUNT);
  }

  if (userIndex === rows.length - 1) {
    return rows.slice(rows.length - VISIBLE_ROW_COUNT);
  }

  return rows.slice(userIndex - 1, userIndex + 2);
}
