import webpush from "web-push";
import { assertVapidConfigured } from "@/lib/push/vapid";
import type { AdminClient } from "@/lib/scripts/supabase-admin";

export type PushPayload = {
  title: string;
  body: string;
  url: string;
  tag?: string;
  image?: string;
};

export type SendPushResult = {
  sent: number;
  failed: number;
  removed: number;
  skipped: number;
};

let vapidReady = false;

function ensureVapid() {
  if (vapidReady) return;
  const { publicKey, privateKey, subject } = assertVapidConfigured();
  webpush.setVapidDetails(subject, publicKey, privateKey);
  vapidReady = true;
}

export async function sendPushToProfile(
  admin: AdminClient,
  profileId: string,
  payload: PushPayload,
): Promise<SendPushResult> {
  const result: SendPushResult = { sent: 0, failed: 0, removed: 0, skipped: 0 };

  const { data: subscriptions, error } = await admin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("profile_id", profileId);

  if (error) {
    throw new Error(`push_subscriptions: ${error.message}`);
  }

  if (!subscriptions?.length) {
    result.skipped += 1;
    return result;
  }

  ensureVapid();

  const body = JSON.stringify({
    title: payload.title,
    body: payload.body,
    image: payload.image ?? null,
    data: { url: payload.url, tag: payload.tag ?? null },
  });

  for (const row of subscriptions) {
    try {
      await webpush.sendNotification(
        {
          endpoint: row.endpoint,
          keys: {
            p256dh: row.p256dh,
            auth: row.auth,
          },
        },
        body,
      );
      result.sent += 1;
    } catch (err) {
      const status = (err as { statusCode?: number }).statusCode;
      if (status === 404 || status === 410) {
        await admin.from("push_subscriptions").delete().eq("id", row.id);
        result.removed += 1;
        continue;
      }
      result.failed += 1;
    }
  }

  return result;
}
