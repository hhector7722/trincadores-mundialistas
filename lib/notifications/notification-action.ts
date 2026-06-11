import {
  NOTIFICATION_KIND_QUIZ_ACTIVE,
  NOTIFICATION_KIND_QUIZ_DAILY_REMINDER,
} from "@/lib/notifications/kinds";
import { notificationNavigationPath } from "@/lib/notifications/notification-navigation";
import type { NotificationRow } from "@/lib/notifications/types";

export type NotificationAction =
  | { type: "navigate"; path: string }
  | { type: "quiz-active-modal" };

export function resolveNotificationAction(row: NotificationRow): NotificationAction | null {
  if (row.kind === NOTIFICATION_KIND_QUIZ_ACTIVE) {
    return { type: "quiz-active-modal" };
  }

  if (row.kind === NOTIFICATION_KIND_QUIZ_DAILY_REMINDER) {
    return { type: "navigate", path: "/quiz" };
  }

  const path = notificationNavigationPath(row);
  if (!path) return null;
  return { type: "navigate", path };
}
