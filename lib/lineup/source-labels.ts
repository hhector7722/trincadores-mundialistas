import type { LineupSourceKind } from "@/lib/lineup/types";

const SOURCE_HEADLINE: Record<LineupSourceKind, string> = {
  confirmed: "Alineación confirmada",
  predicted: "Once predicho",
  fallback: "Once probable",
};

const SOURCE_DETAIL: Record<LineupSourceKind, string> = {
  confirmed: "Publicada oficialmente antes del partido.",
  predicted: "Once predicho por BSD (IA + forma reciente + disponibilidad).",
  fallback: "Estimación desde la convocatoria FIFA (dorsal + posición).",
};

export function lineupSourceHeadline(kind: LineupSourceKind): string {
  return SOURCE_HEADLINE[kind];
}

export function lineupSourceDetail(kind: LineupSourceKind): string {
  return SOURCE_DETAIL[kind];
}

export function lineupSourceBadgeClass(kind: LineupSourceKind): string {
  switch (kind) {
    case "confirmed":
      return "border-emerald-500/40 bg-emerald-500/10 text-emerald-200";
    case "predicted":
      return "border-sky-500/40 bg-sky-500/10 text-sky-200";
    default:
      return "border-[var(--tm-border)] bg-black/25 text-[var(--tm-muted)]";
  }
}
