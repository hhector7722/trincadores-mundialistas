import { NOTIFICATION_KIND_QUIZ_ACTIVE } from "@/lib/notifications/kinds";

export const QUIZ_ACTIVE_NOTIFICATION_QUERY = "quiz-active";

export function quizActiveNotificationUrl(origin = ""): string {
  const base = origin || "";
  return `${base}/?${QUIZ_ACTIVE_NOTIFICATION_QUERY}=1`;
}

export function pushUrlForNotificationKind(kind: string | null | undefined): string | null {
  if (kind === NOTIFICATION_KIND_QUIZ_ACTIVE) {
    return quizActiveNotificationUrl();
  }
  return null;
}
