import {
  NOTIFICATION_KIND_CONFIRMED_LINEUP,
  NOTIFICATION_KIND_PREDICTION_REMINDER,
  NOTIFICATION_KIND_QUIZ_ACTIVE,
  NOTIFICATION_KIND_QUIZ_DAILY_REMINDER,
} from "@/lib/notifications/kinds";

export const QUIZ_ACTIVE_NOTIFICATION_QUERY = "quiz-active";
export const LINEUPS_NOTIFICATION_QUERY = "lineups";

export function quizActiveNotificationUrl(origin = ""): string {
  const base = origin || "";
  return `${base}/?${QUIZ_ACTIVE_NOTIFICATION_QUERY}=1`;
}

export function confirmedLineupNotificationUrl(matchId: string, origin = ""): string {
  const base = origin || "";
  return `${base}/predictions?${LINEUPS_NOTIFICATION_QUERY}=${matchId}`;
}

export function predictionReminderNotificationUrl(matchId: string, origin = ""): string {
  const base = origin || "";
  return `${base}/predictions/${matchId}`;
}

export function quizDailyReminderNotificationUrl(origin = ""): string {
  const base = origin || "";
  return `${base}/quiz`;
}

export function pushUrlForNotificationKind(
  kind: string | null | undefined,
  matchId?: string | null,
): string | null {
  if (kind === NOTIFICATION_KIND_QUIZ_ACTIVE) {
    return quizActiveNotificationUrl();
  }
  if (kind === NOTIFICATION_KIND_QUIZ_DAILY_REMINDER) {
    return quizDailyReminderNotificationUrl();
  }
  if (kind === NOTIFICATION_KIND_CONFIRMED_LINEUP && matchId) {
    return confirmedLineupNotificationUrl(matchId);
  }
  if (kind === NOTIFICATION_KIND_PREDICTION_REMINDER && matchId) {
    return predictionReminderNotificationUrl(matchId);
  }
  return null;
}
