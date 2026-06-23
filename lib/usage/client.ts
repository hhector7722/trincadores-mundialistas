import type { UsageClientEventPayload } from "@/lib/usage/types";

export async function sendUsageEvent(payload: UsageClientEventPayload): Promise<void> {
  try {
    await fetch("/api/usage/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...payload,
        metadata: { ...payload.metadata, source: "client" },
      }),
      keepalive: true,
    });
  } catch {
    // No bloquear UX si falla el tracking.
  }
}

export function trackUsageTabSwitch(fromPath: string, toHref: string, tabLabel: string): void {
  void sendUsageEvent({
    eventType: "action",
    path: toHref,
    referrerPath: fromPath || null,
    label: `Pestaña: ${tabLabel}`,
    metadata: {
      action: "tab_switch",
      tabLabel,
      tabHref: toHref,
    },
  });
}

export function trackUsagePageDwell(
  path: string,
  search: string,
  label: string,
  durationMs: number
): void {
  if (durationMs < 1000) return;

  void sendUsageEvent({
    eventType: "action",
    path,
    search: search || null,
    label,
    durationMs,
    metadata: {
      action: "page_dwell",
    },
  });
}

export function trackUsageClientPageView(
  path: string,
  search: string,
  label: string,
  referrerPath: string | null
): void {
  void sendUsageEvent({
    eventType: "page_view",
    path,
    search: search || null,
    label,
    referrerPath,
    metadata: { source: "client" },
  });
}

export function trackUsageModalOpen(
  modalId: string,
  label: string,
  pagePath: string
): void {
  void sendUsageEvent({
    eventType: "action",
    path: pagePath,
    label,
    metadata: {
      action: "modal_open",
      modalId,
      modalLabel: label,
    },
  });
}

export function trackUsageModalDwell(
  modalId: string,
  label: string,
  pagePath: string,
  durationMs: number
): void {
  if (durationMs < 500) return;

  void sendUsageEvent({
    eventType: "action",
    path: pagePath,
    label,
    durationMs,
    metadata: {
      action: "modal_dwell",
      modalId,
      modalLabel: label,
    },
  });
}

export function trackUsageHighlightOpen(
  videoId: string,
  label: string,
  pagePath: string,
  matchId?: string
): void {
  void sendUsageEvent({
    eventType: "action",
    path: pagePath,
    label,
    metadata: {
      action: "highlight_open",
      videoId,
      videoLabel: label,
      matchId,
    },
  });
}

export function trackUsageHighlightWatch(
  videoId: string,
  label: string,
  pagePath: string,
  watchedMs: number,
  videoDurationSec: number,
  matchId?: string
): void {
  if (watchedMs < 1000) return;

  const watchedSec = Math.round(watchedMs / 1000);
  const percentWatched =
    videoDurationSec > 0
      ? Math.min(100, Math.round((watchedSec / videoDurationSec) * 100))
      : undefined;

  void sendUsageEvent({
    eventType: "action",
    path: pagePath,
    label,
    durationMs: watchedMs,
    metadata: {
      action: "highlight_watch",
      videoId,
      videoLabel: label,
      matchId,
      watchedSec,
      videoDurationSec: videoDurationSec > 0 ? Math.round(videoDurationSec) : undefined,
      percentWatched,
    },
  });
}

export function trackUsageQuizBonusToggle(active: boolean, pagePath: string): void {
  void sendUsageEvent({
    eventType: "action",
    path: pagePath,
    label: active ? "Bonus del quiz activado" : "Bonus del quiz desactivado",
    metadata: {
      action: "quiz_bonus_toggle",
      active,
    },
  });
}
