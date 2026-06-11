"use client";

import { useEffect, useRef } from "react";
import { savePushSubscriptionAction } from "@/actions/push";
import {
  getExistingPushSubscription,
  isPushSupported,
  serializePushSubscription,
  subscribeToPush,
} from "@/lib/push/client";

type PushSubscriptionRegistrarProps = {
  vapidPublicKey: string | null;
};

export function PushSubscriptionRegistrar({ vapidPublicKey }: PushSubscriptionRegistrarProps) {
  const startedRef = useRef(false);

  useEffect(() => {
    if (!vapidPublicKey || startedRef.current || !isPushSupported()) return;
    startedRef.current = true;

    void (async () => {
      try {
        const existing = await getExistingPushSubscription();
        const subscription = existing ?? (await subscribeToPush(vapidPublicKey));
        if (!subscription) return;

        const payload = serializePushSubscription(subscription);
        const result = await savePushSubscriptionAction(payload);
        if (!result.ok) {
          console.error("[push]", result.error);
        }
      } catch (error) {
        console.error(
          "[push]",
          error instanceof Error ? error.message : "No se pudo registrar la suscripción push.",
        );
      }
    })();
  }, [vapidPublicKey]);

  return null;
}
