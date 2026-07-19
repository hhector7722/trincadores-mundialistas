import type { MatchWithPrediction } from "@/lib/predictions/queries";

/** Partido de la final WC2026 (M104 / jornada final), o el más tardío como fallback. */
export function selectFinalMatch(
  matches: MatchWithPrediction[]
): MatchWithPrediction | null {
  if (!matches.length) return null;

  const byNumber = matches.find((match) => match.match_number === 104);
  if (byNumber) return byNumber;

  const byKey = matches.find(
    (match) => match.matchday_external_key === "WC2026:final"
  );
  if (byKey) return byKey;

  return [...matches].sort(
    (a, b) =>
      new Date(b.kickoff_at).getTime() - new Date(a.kickoff_at).getTime()
  )[0];
}

/** Fecha y hora del kickoff para la home final (Europe/Madrid). */
export function formatFinalKickoffParts(iso: string): {
  dateLine: string;
  timeLine: string;
} {
  const d = new Date(iso);
  const dateLine = d.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Madrid",
  });
  // Capitalizar primer carácter (es-ES suele devolver "domingo...")
  const dateLineCap =
    dateLine.length > 0
      ? dateLine.charAt(0).toUpperCase() + dateLine.slice(1)
      : dateLine;
  const time = d.toLocaleString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Europe/Madrid",
  });
  return {
    dateLine: dateLineCap,
    timeLine: `${time} horas`,
  };
}
