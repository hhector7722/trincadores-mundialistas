"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Bell } from "lucide-react";
import { savePushSubscriptionAction } from "@/actions/push";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import {
  getExistingPushSubscription,
  getPushClientStatus,
  isPushSupported,
  serializePushSubscription,
  subscribeToPush,
  type PushClientStatus,
} from "@/lib/push/client";
import {
  clearPushPromptDismissed,
  dismissPushPrompt,
  isPushPromptDismissed,
} from "@/lib/push/prompt-storage";
import { cn } from "@/lib/utils";

type PushNotificationContextValue = {
  status: PushClientStatus;
  openPushPrompt: () => void;
  isSubscribed: boolean;
};

const PushNotificationContext = createContext<PushNotificationContextValue | null>(null);

export function usePushNotifications(): PushNotificationContextValue {
  const ctx = useContext(PushNotificationContext);
  if (!ctx) {
    throw new Error("usePushNotifications debe usarse dentro de PushNotificationProvider.");
  }
  return ctx;
}

type ModalMode = "ask" | "activating" | "denied" | "unsupported";

type PushNotificationProviderProps = {
  vapidPublicKey: string | null;
  children: ReactNode;
};

function isStandalonePwa(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIosDevice(): boolean {
  if (typeof window === "undefined") return false;
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

async function resolveVapidPublicKey(fallback: string | null): Promise<string | null> {
  if (fallback) return fallback;
  try {
    const response = await fetch("/api/push/vapid-key", { cache: "no-store" });
    if (!response.ok) return null;
    const payload = (await response.json()) as { publicKey?: string | null };
    return payload.publicKey?.trim() || null;
  } catch {
    return null;
  }
}

export function PushNotificationProvider({
  vapidPublicKey,
  children,
}: PushNotificationProviderProps) {
  const [resolvedVapidKey, setResolvedVapidKey] = useState<string | null>(vapidPublicKey);
  const [status, setStatus] = useState<PushClientStatus>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("ask");
  const autoPromptCheckedRef = useRef(false);

  useEffect(() => {
    if (vapidPublicKey) {
      setResolvedVapidKey(vapidPublicKey);
      return;
    }
    void resolveVapidPublicKey(null).then(setResolvedVapidKey);
  }, [vapidPublicKey]);

  const syncExistingSubscription = useCallback(async () => {
    if (!resolvedVapidKey) return false;
    const subscription = await getExistingPushSubscription();
    if (!subscription) return false;

    const result = await savePushSubscriptionAction(serializePushSubscription(subscription));
    if (!result.ok) {
      console.error("[push]", result.error);
      return false;
    }

    setIsSubscribed(true);
    return true;
  }, [resolvedVapidKey]);

  const resolveModalMode = useCallback((): ModalMode | null => {
    if (!resolvedVapidKey) return null;

    if (!isPushSupported()) {
      if (isIosDevice() && !isStandalonePwa()) return "unsupported";
      return null;
    }

    const nextStatus = getPushClientStatus();
    setStatus(nextStatus);

    if (nextStatus === "denied") return "denied";
    if (nextStatus === "unsupported") return "unsupported";
    return "ask";
  }, [resolvedVapidKey]);

  const openPushPromptFromProfile = useCallback(() => {
    clearPushPromptDismissed();
    const mode = resolveModalMode();
    if (!mode) return;
    setModalMode(mode);
    setModalOpen(true);
  }, [resolveModalMode]);

  useEffect(() => {
    if (!resolvedVapidKey || autoPromptCheckedRef.current) return;
    autoPromptCheckedRef.current = true;

    void (async () => {
      if (!isPushSupported()) {
        setStatus("unsupported");
        if (isIosDevice() && !isStandalonePwa() && !isPushPromptDismissed()) {
          setModalMode("unsupported");
          setModalOpen(true);
        }
        return;
      }

      const nextStatus = getPushClientStatus();
      setStatus(nextStatus);

      const subscribed = await syncExistingSubscription();
      if (subscribed) return;

      if (nextStatus === "denied") {
        if (!isPushPromptDismissed()) {
          setModalMode("denied");
          setModalOpen(true);
        }
        return;
      }

      if (!isPushPromptDismissed()) {
        window.setTimeout(() => {
          setModalMode("ask");
          setModalOpen(true);
        }, 600);
      }
    })();
  }, [resolvedVapidKey, syncExistingSubscription]);

  async function handleActivate() {
    if (!resolvedVapidKey) return;
    setModalMode("activating");

    try {
      const subscription = await subscribeToPush(resolvedVapidKey);
      if (!subscription) {
        const nextStatus = getPushClientStatus();
        setStatus(nextStatus);
        setModalMode(nextStatus === "denied" ? "denied" : "ask");
        return;
      }

      const result = await savePushSubscriptionAction(serializePushSubscription(subscription));
      if (!result.ok) {
        console.error("[push]", result.error);
        setModalMode("ask");
        return;
      }

      setIsSubscribed(true);
      setStatus("granted");
      setModalOpen(false);
    } catch (error) {
      console.error(
        "[push]",
        error instanceof Error ? error.message : "No se pudo activar las notificaciones.",
      );
      setModalMode("ask");
    }
  }

  function handleDismiss() {
    dismissPushPrompt();
    setModalOpen(false);
  }

  const contextValue = useMemo(
    () => ({
      status,
      openPushPrompt: openPushPromptFromProfile,
      isSubscribed,
    }),
    [isSubscribed, openPushPromptFromProfile, status],
  );

  const title =
    modalMode === "unsupported"
      ? "Instala la app"
      : modalMode === "denied"
        ? "Notificaciones bloqueadas"
        : "Activa las notificaciones";

  const body =
    modalMode === "unsupported"
      ? "En iPhone, las notificaciones push solo funcionan si añades Trincadores a la pantalla de inicio (Compartir → Añadir a inicio) y vuelves a abrir la app."
      : modalMode === "denied"
        ? "Las notificaciones están bloqueadas en este navegador. Actívalas en los ajustes del sitio para recibir avisos del quiz y los partidos."
        : "Recibe avisos del quiz diario, recordatorios de pronósticos y alineaciones confirmadas, aunque no tengas la app abierta.";

  return (
    <PushNotificationContext.Provider value={contextValue}>
      {children}
      {modalOpen ? (
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
              {modalMode === "ask" || modalMode === "activating" ? (
                <Button
                  type="button"
                  className="w-full"
                  disabled={modalMode === "activating"}
                  onClick={() => void handleActivate()}
                >
                  {modalMode === "activating" ? "Activando…" : "Activar notificaciones"}
                </Button>
              ) : null}
              <Button type="button" variant="ghost" className="w-full" onClick={handleDismiss}>
                {modalMode === "ask" || modalMode === "activating" ? "Ahora no" : "Entendido"}
              </Button>
            </div>
          </div>
        </Modal>
      ) : null}
    </PushNotificationContext.Provider>
  );
}
