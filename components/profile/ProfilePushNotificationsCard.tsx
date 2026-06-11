"use client";

import { Bell, BellOff, BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { usePushNotifications } from "@/components/push/PushNotificationProvider";
import { cn } from "@/lib/utils";

export function ProfilePushNotificationsCard() {
  const { status, openPushPrompt, isSubscribed } = usePushNotifications();

  const title = isSubscribed
    ? "Notificaciones activadas"
    : status === "denied"
      ? "Notificaciones bloqueadas"
      : status === "unsupported"
        ? "Instala la app para avisos"
        : "Activar notificaciones";

  const description = isSubscribed
    ? "Recibirás avisos del quiz, pronósticos y alineaciones en este dispositivo."
    : status === "denied"
      ? "El navegador tiene bloqueadas las notificaciones de este sitio. Actívalas en ajustes y pulsa reactivar."
      : status === "unsupported"
        ? "En iPhone necesitas añadir Trincadores a la pantalla de inicio para recibir push."
        : "Recibe avisos aunque no tengas la app abierta.";

  const Icon = isSubscribed ? BellRing : status === "denied" ? BellOff : Bell;

  return (
    <Card className="space-y-3 p-4">
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "grid size-11 shrink-0 place-items-center rounded-2xl",
            isSubscribed ? "bg-[#2F5D6A]/15 text-[#2F5D6A]" : "bg-black/[0.04] text-[#2F5D6A]/70",
          )}
        >
          <Icon className="size-5" strokeWidth={1.5} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[var(--tm-fg)]">{title}</p>
          <p className="mt-1 text-sm leading-relaxed text-[var(--tm-muted)]">{description}</p>
        </div>
      </div>

      {!isSubscribed ? (
        <Button type="button" className="w-full" onClick={openPushPrompt}>
          {status === "denied" ? "Reactivar notificaciones" : "Activar notificaciones"}
        </Button>
      ) : null}
    </Card>
  );
}
