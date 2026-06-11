import { NOTIFICATION_KIND_CONFIRMED_LINEUP } from "@/lib/notifications/kinds";
import type { NotificationRow } from "@/lib/notifications/types";

export const LINEUPS_NOTIFICATION_QUERY = "lineups";

export function notificationNavigationPath(row: NotificationRow): string | null {
  if (!row.match_id) return null;

  if (row.kind === NOTIFICATION_KIND_CONFIRMED_LINEUP) {
    return `/predictions?${LINEUPS_NOTIFICATION_QUERY}=${row.match_id}`;
  }

  return `/predictions/${row.match_id}`;
}
