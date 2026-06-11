"use server";

import { createClient } from "@/lib/supabase/server";

export type PushActionResult = { ok: true } | { ok: false; error: string };

type PushSubscriptionPayload = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

export async function savePushSubscriptionAction(
  payload: PushSubscriptionPayload,
): Promise<PushActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Sesión no válida." };
  }

  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      profile_id: user.id,
      endpoint: payload.endpoint,
      p256dh: payload.p256dh,
      auth: payload.auth,
    },
    { onConflict: "endpoint" },
  );

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}
