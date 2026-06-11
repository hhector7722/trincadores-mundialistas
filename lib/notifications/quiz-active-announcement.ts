import "@/lib/push/server-only";
import { NOTIFICATION_KIND_QUIZ_ACTIVE } from "@/lib/notifications/kinds";
import { buildQuizActiveAnnouncementCopy } from "@/lib/notifications/quiz-active-copy";
import { quizActiveNotificationUrl } from "@/lib/push/urls";
import { sendPushToProfile } from "@/lib/push/send";
import { isVapidConfigured } from "@/lib/push/vapid";
import type { AdminClient } from "@/lib/scripts/supabase-admin";

export type BroadcastQuizActiveAnnouncementResult = {
  recipients: number;
  skippedDuplicate: number;
  pushSent: number;
  pushSkipped: number;
  pushFailed: number;
};

export async function broadcastQuizActiveAnnouncement(
  admin: AdminClient,
  siteOrigin?: string,
): Promise<BroadcastQuizActiveAnnouncementResult> {
  const copy = buildQuizActiveAnnouncementCopy();
  const pushUrl = quizActiveNotificationUrl(siteOrigin);
  const pushEnabled = isVapidConfigured();
  const result: BroadcastQuizActiveAnnouncementResult = {
    recipients: 0,
    skippedDuplicate: 0,
    pushSent: 0,
    pushSkipped: 0,
    pushFailed: 0,
  };

  const { data: members, error: membersError } = await admin
    .from("pool_members")
    .select("profile_id, pool_id");

  if (membersError) {
    throw new Error(`pool_members: ${membersError.message}`);
  }

  for (const member of members ?? []) {
    const profileId = member.profile_id as string;

    const { error: insertError } = await admin.from("notifications").insert({
      profile_id: profileId,
      pool_id: member.pool_id as string,
      kind: NOTIFICATION_KIND_QUIZ_ACTIVE,
      title: copy.title,
      body: copy.body,
    });

    if (insertError) {
      if (insertError.code === "23505") {
        result.skippedDuplicate += 1;
      } else {
        throw new Error(`notifications: ${insertError.message}`);
      }
    } else {
      result.recipients += 1;
    }

    if (!pushEnabled) {
      result.pushSkipped += 1;
      continue;
    }

    const pushResult = await sendPushToProfile(admin, profileId, {
      title: copy.title,
      body: copy.body,
      url: pushUrl,
      tag: NOTIFICATION_KIND_QUIZ_ACTIVE,
    });

    result.pushSent += pushResult.sent;
    result.pushSkipped += pushResult.skipped;
    result.pushFailed += pushResult.failed;
  }

  return result;
}
