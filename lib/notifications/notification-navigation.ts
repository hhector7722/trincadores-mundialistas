import { NOTIFICATION_KIND_CONFIRMED_LINEUP, NOTIFICATION_KIND_MATCH_HIGHLIGHT } from "@/lib/notifications/kinds";
import type { NotificationRow } from "@/lib/notifications/types";
import { HIGHLIGHT_NOTIFICATION_QUERY } from "@/lib/push/urls";

export const LINEUPS_NOTIFICATION_QUERY = "lineups";

export function notificationNavigationPath(row: NotificationRow): string | null {
  if (!row.match_id) return null;

  if (row.kind === NOTIFICATION_KIND_CONFIRMED_LINEUP) {
    return `/predictions?${LINEUPS_NOTIFICATION_QUERY}=${row.match_id}`;
  }

  if (row.kind === NOTIFICATION_KIND_MATCH_HIGHLIGHT) {
    return `/predictions?${HIGHLIGHT_NOTIFICATION_QUERY}=${row.match_id}`;
  }

  return `/predictions/${row.match_id}`;
}
