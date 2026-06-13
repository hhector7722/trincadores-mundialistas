import { isQuizPublishHeld, isQuizWindowOpen, todayQuizDate } from "@/lib/quiz/date";
import { NOTIFICATION_KIND_QUIZ_DAILY_REMINDER } from "@/lib/notifications/kinds";
import { quizDailyReminderNotificationUrl } from "@/lib/push/urls";
import { sendPushToProfile } from "@/lib/push/send";
import { isVapidConfigured } from "@/lib/push/vapid";
import type { AdminClient } from "@/lib/scripts/supabase-admin";

type OfficialQuizRow = {
  id: string;
  pool_id: string;
  title: string;
  quiz_date: string | null;
  opens_at: string | null;
  closes_at: string | null;
};

export type SendQuizDailyRemindersResult = {
  quizDate: string;
  quizzesChecked: number;
  remindersSent: number;
  skippedComplete: number;
  skippedDuplicate: number;
  skippedClosed: number;
  pushSent: number;
  pushSkipped: number;
  pushFailed: number;
};

export function buildQuizDailyReminderCopy(): { title: string; body: string } {
  return {
    title: "Quiz diario pendiente",
    body: "Tienes hasta las 23:59 para completarlo.",
  };
}

export async function sendQuizDailyReminders(
  admin: AdminClient,
  quizDate = todayQuizDate(),
  now = new Date(),
  siteOrigin?: string,
): Promise<SendQuizDailyRemindersResult> {
  const pushEnabled = isVapidConfigured();
  const pushUrl = quizDailyReminderNotificationUrl(siteOrigin);
  const result: SendQuizDailyRemindersResult = {
    quizDate,
    quizzesChecked: 0,
    remindersSent: 0,
    skippedComplete: 0,
    skippedDuplicate: 0,
    skippedClosed: 0,
    pushSent: 0,
    pushSkipped: 0,
    pushFailed: 0,
  };

  if (isQuizPublishHeld(quizDate)) return result;

  const { data: quizzes, error: quizzesError } = await admin
    .from("quizzes")
    .select("id, pool_id, title, quiz_date, opens_at, closes_at")
    .eq("quiz_date", quizDate)
    .eq("kind", "official");

  if (quizzesError) {
    throw new Error(`quizzes: ${quizzesError.message}`);
  }

  const officialQuizzes = (quizzes ?? []) as OfficialQuizRow[];
  if (!officialQuizzes.length) return result;

  for (const quiz of officialQuizzes) {
    result.quizzesChecked += 1;

    if (!isQuizWindowOpen(quiz, now)) {
      result.skippedClosed += 1;
      continue;
    }

    const [{ data: members, error: membersError }, { data: submitted, error: attemptsError }] =
      await Promise.all([
        admin.from("pool_members").select("profile_id").eq("pool_id", quiz.pool_id),
        admin
          .from("quiz_attempts")
          .select("profile_id")
          .eq("quiz_id", quiz.id)
          .eq("status", "submitted"),
      ]);

    if (membersError) {
      throw new Error(`pool_members: ${membersError.message}`);
    }
    if (attemptsError) {
      throw new Error(`quiz_attempts: ${attemptsError.message}`);
    }

    const completed = new Set((submitted ?? []).map((row) => row.profile_id as string));
    const copy = buildQuizDailyReminderCopy();

    for (const member of members ?? []) {
      const profileId = member.profile_id as string;
      if (completed.has(profileId)) {
        result.skippedComplete += 1;
        continue;
      }

      const { error: insertError } = await admin.from("notifications").insert({
        profile_id: profileId,
        pool_id: quiz.pool_id,
        kind: NOTIFICATION_KIND_QUIZ_DAILY_REMINDER,
        quiz_id: quiz.id,
        title: copy.title,
        body: copy.body,
      });

      if (insertError) {
        if (insertError.code === "23505") {
          result.skippedDuplicate += 1;
          continue;
        }
        throw new Error(`notifications: ${insertError.message}`);
      }

      result.remindersSent += 1;

      if (!pushEnabled) {
        result.pushSkipped += 1;
        continue;
      }

      const pushResult = await sendPushToProfile(admin, profileId, {
        title: copy.title,
        body: copy.body,
        url: pushUrl,
        tag: `${NOTIFICATION_KIND_QUIZ_DAILY_REMINDER}:${quiz.id}`,
      });

      result.pushSent += pushResult.sent;
      result.pushSkipped += pushResult.skipped;
      result.pushFailed += pushResult.failed;
    }
  }

  return result;
}
