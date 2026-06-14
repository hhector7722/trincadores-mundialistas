import type { AppUsageMetadata } from "@/lib/usage/types";

const STATIC_ROUTE_LABELS: Record<string, string> = {
  "/": "Inicio",
  "/quiz": "Quiz",
  "/quiz/play": "Jugando quiz",
  "/quiz/result": "Resultado quiz",
  "/quiz/leaderboard": "Ranking quiz",
  "/ranking": "La tabla",
  "/predictions": "Calendario de partidos",
  "/predictions/knockout": "Eliminatorias",
  "/profile": "Mi perfil",
  "/uso": "Uso de la app",
  "/admin": "Admin resultados",
  "/general-predictions": "Pronosticos generales",
  "/laboratorio": "Laboratorio",
  "/activity": "Actividad",
  "/bienvenida": "Bienvenida",
  "/login": "Login",
};

const ACTION_LABELS: Record<string, string> = {
  tab_switch: "Cambio de pestaña",
  page_dwell: "Tiempo en pantalla",
  modal_open: "Modal abierto",
  modal_dwell: "Tiempo en modal",
  prediction_saved: "Pronostico guardado",
  quiz_started: "Quiz iniciado",
  quiz_submitted: "Quiz enviado",
};

export function deriveUsageLabel(
  pathname: string,
  metadata?: AppUsageMetadata | null,
  eventType?: string
): string {
  if (eventType === "action" && metadata?.action) {
    const base = ACTION_LABELS[metadata.action] ?? "Accion";
    if (metadata.action === "prediction_saved" && metadata.homeGoals != null && metadata.awayGoals != null) {
      return `${base}: ${metadata.homeGoals}-${metadata.awayGoals}`;
    }
    if (metadata.action === "quiz_submitted" && metadata.score != null) {
      return `${base} (${metadata.score} pts)`;
    }
    if (metadata.action === "tab_switch" && metadata.tabLabel) {
      return `${base}: ${metadata.tabLabel}`;
    }
    if (metadata.action === "modal_open" && metadata.modalLabel) {
      return String(metadata.modalLabel);
    }
    return base;
  }

  if (STATIC_ROUTE_LABELS[pathname]) {
    return STATIC_ROUTE_LABELS[pathname]!;
  }

  if (/^\/predictions\/[^/]+$/.test(pathname)) {
    return "Detalle de partido";
  }

  if (/^\/profile\/[^/]+$/.test(pathname)) {
    return "Perfil de jugador";
  }

  if (/^\/teams\/[^/]+/.test(pathname)) {
    return "Alineacion de equipo";
  }

  return pathname;
}

export function formatUsagePathLine(
  path: string | null,
  search: string | null,
  label: string | null
): string {
  const route = path ? `${path}${search ?? ""}` : "";
  if (label && route && label !== route) {
    return `${label} · ${route}`;
  }
  return label ?? route ?? " ";
}

export function formatDurationMs(durationMs: number | null | undefined): string {
  if (durationMs == null || durationMs <= 0) return " ";
  const totalSeconds = Math.round(durationMs / 1000);
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
}
