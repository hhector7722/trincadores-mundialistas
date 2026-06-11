"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { savePushSubscriptionAction } from "@/actions/push";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import {
  getExistingPushSubscription,
  isPushSupported,
  serializePushSubscription,
  subscribeToPush,
} from "@/lib/push/client";
import { dismissPushPrompt, isPushPromptDismissed } from "@/lib/push/prompt-storage";
import { cn } from "@/lib/utils";

type PushNotificationPromptProps = {
  vapidPublicKey: string | null;
};

type PromptState = "hidden" | "ask" | "activating" | "denied" | "unsupported";

function isStandalonePwa(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function PushNotificationPrompt({ vapidPublicKey }: PushNotificationPromptProps) {
  const [state, setState] = useState<PromptState>("hidden");

  const syncExistingSubscription = useCallback(async () => {
    if (!vapidPublicKey) return;
    const subscription = await getExistingPushSubscription();
    if (!subscription) return;

    const result = await savePushSubscriptionAction(serializePushSubscription(subscription));
    if (!result.ok) {
      console.error("[push]", result.error);
    }
  }, [vapidPublicKey]);

  useEffect(() => {
    if (!vapidPublicKey) return;

    void (async () => {
      if (!isPushSupported()) {
        const isIos = /iphone|ipad|ipod/i.test(window.navigator.userAgent);
        if (isIos && !isStandalonePwa()) {
          setState("unsupported");
        }
        return;
      }

      if (Notification.permission === "granted") {
        await syncExistingSubscription();
        return;
      }

      if (Notification.permission === "denied") {
        setState("denied");
        return;
      }

      const existing = await getExistingPushSubscription();
      if (existing) {
        await syncExistingSubscription();
        return;
      }

      if (!isPushPromptDismissed()) {
        setState("ask");
      }
    })();
  }, [syncExistingSubscription, vapidPublicKey]);

  async function handleActivate() {
    if (!vapidPublicKey) return;
    setState("activating");

    try {
      const subscription = await subscribeToPush(vapidPublicKey);
      if (!subscription) {
        setState(Notification.permission === "denied" ? "denied" : "hidden");
        return;
      }

      const result = await savePushSubscriptionAction(serializePushSubscription(subscription));
      if (!result.ok) {
        console.error("[push]", result.error);
      }
      setState("hidden");
    } catch (error) {
      console.error(
        "[push]",
        error instanceof Error ? error.message : "No se pudo activar las notificaciones.",
      );
      setState("hidden");
    }
  }

  function handleDismiss() {
    dismissPushPrompt();
    setState("hidden");
  }

  if (state === "hidden") return null;

  const title =
    state === "unsupported"
      ? "Instala la app"
      : state === "denied"
        ? "Notificaciones bloqueadas"
        : "Activa las notificaciones";

  const body =
    state === "unsupported"
      ? "En iPhone, las notificaciones push solo funcionan si añades Trincadores a la pantalla de inicio (Compartir → Añadir a inicio) y vuelves a abrir la app."
      : state === "denied"
        ? "Las notificaciones están bloqueadas en este navegador. Actívalas en los ajustes del sitio para recibir avisos del quiz y los partidos."
        : "Recibe avisos del quiz diario, recordatorios de pronósticos y alineaciones confirmadas, aunque no tengas la app abierta.";

  return (
    <Modal
      open
      onClose={handleDismiss}
      title={title}
      wrapperClassName="w-full max-w-sm"
      ariaLabel={title}
    >
      <div className="flex flex-col gap-4 px-1 pb-1">
        <div className="flex items-start gap-3">
          <span
            className={cn(
              "grid size-11 shrink-0 place-items-center rounded-2xl",
              "bg-[#2F5D6A]/10 text-[#2F5D6A]",
            )}
          >
            <Bell className="size-5" strokeWidth={1.5} aria-hidden />
          </span>
          <p className="text-sm leading-relaxed text-[var(--tm-muted)]">{body}</p>
        </div>

        <div className="flex shrink-0 flex-col gap-2">
          {state === "ask" || state === "activating" ? (
            <Button
              type="button"
              className="w-full"
              disabled={state === "activating"}
              onClick={() => void handleActivate()}
            >
              {state === "activating" ? "Activando…" : "Activar notificaciones"}
            </Button>
          ) : null}
          <Button type="button" variant="ghost" className="w-full" onClick={handleDismiss}>
            {state === "ask" || state === "activating" ? "Ahora no" : "Entendido"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
