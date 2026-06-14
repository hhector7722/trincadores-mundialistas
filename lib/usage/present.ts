import { deriveUsageLabel, formatDurationMs } from "@/lib/usage/labels";
import { resolveUsageEventLabel, type UsageContextMaps } from "@/lib/usage/resolve-context";
import type { AppUsageEventType } from "@/lib/usage/types";

export type UsageEventRowForPresent = {
  id: string;
  event_type: AppUsageEventType;
  path: string | null;
  search: string | null;
  label: string | null;
  duration_ms: number | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

const NOISE_PATH_PREFIXES = ["/fonts/", "/images/", "/_next/", "/app-icon", "/icon", "/sw.js"];

export function isNoiseUsagePath(path: string | null): boolean {
  if (!path) return false;
  return NOISE_PATH_PREFIXES.some((prefix) => path.startsWith(prefix));
}

function resolvePlaceName(
  path: string | null,
  label: string | null,
  metadata: Record<string, unknown> | null,
  eventType: AppUsageEventType,
  maps: UsageContextMaps
): string {
  const resolved = resolveUsageEventLabel(path, label, metadata, maps);
  if (resolved.trim() && resolved !== path) return resolved;
  if (path) {
    const derived = deriveUsageLabel(path, metadata as never, eventType);
    if (derived !== path) return derived;
  }
  return resolved.trim() || " ";
}

export function formatUsageActivityTitle(
  row: UsageEventRowForPresent,
  maps: UsageContextMaps
): string {
  const meta = row.metadata ?? {};
  const action = typeof meta.action === "string" ? meta.action : null;
  const place = resolvePlaceName(row.path, row.label, meta, row.event_type, maps);

  if (row.event_type === "login") return "Inicio de sesion";
  if (row.event_type === "session") return "Abrio la app";

  if (row.event_type === "action") {
    if (action === "page_dwell") {
      const duration = formatDurationMs(row.duration_ms);
      return duration.trim() ? `${duration} en ${place}` : `Tiempo en ${place}`;
    }
    if (action === "tab_switch") {
      const tabLabel = typeof meta.tabLabel === "string" ? meta.tabLabel : place;
      return `Pestaña ${tabLabel}`;
    }
    if (action === "modal_open") {
      const modalLabel = typeof meta.modalLabel === "string" ? meta.modalLabel : place;
      return `Abrio ${modalLabel}`;
    }
    if (action === "modal_dwell") {
      const modalLabel = typeof meta.modalLabel === "string" ? meta.modalLabel : place;
      const duration = formatDurationMs(row.duration_ms);
      return duration.trim() ? `${duration} en ${modalLabel}` : `Tiempo en ${modalLabel}`;
    }
    if (action === "prediction_saved") return place;
    if (action === "quiz_started") return "Empezo un quiz";
    if (action === "quiz_submitted") return place;
    return place;
  }

  return `Vio ${place}`;
}

function isDuplicateEvent(
  candidate: UsageEventRowForPresent,
  included: UsageEventRowForPresent[]
): boolean {
  const candidateTs = new Date(candidate.created_at).getTime();

  for (const prev of included) {
    const prevTs = new Date(prev.created_at).getTime();
    const delta = Math.abs(prevTs - candidateTs);

    if (
      prev.path === candidate.path &&
      prev.event_type === candidate.event_type &&
      delta < 3000
    ) {
      return true;
    }

    if (
      candidate.event_type === "page_view" &&
      prev.event_type === "action" &&
      prev.metadata?.action === "tab_switch" &&
      delta < 5000
    ) {
      const tabHref = (prev.metadata?.tabHref as string | undefined) ?? prev.path;
      if (tabHref === candidate.path) return true;
    }
  }

  return false;
}

/** Lista legible: sin ruido tecnico ni duplicados de navegacion rapida. */
export function buildUsageRecentFeed(
  rows: UsageEventRowForPresent[],
  maps: UsageContextMaps,
  limit = 80
): Array<{ id: string; title: string; timeLabel: string; createdAt: string }> {
  const included: UsageEventRowForPresent[] = [];
  const feed: Array<{ id: string; title: string; timeLabel: string; createdAt: string }> = [];

  for (const row of rows) {
    if (isNoiseUsagePath(row.path)) continue;
    if (isDuplicateEvent(row, included)) continue;

    included.push(row);
    feed.push({
      id: row.id,
      title: formatUsageActivityTitle(row, maps),
      timeLabel: "",
      createdAt: row.created_at,
    });

    if (feed.length >= limit) break;
  }

  return feed;
}
