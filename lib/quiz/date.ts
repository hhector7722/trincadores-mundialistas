const MADRID_TZ = "Europe/Madrid";

/** Fecha civil YYYY-MM-DD en Europe/Madrid (sin parsear ISO date-only nativo). */
export function todayQuizDate(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: MADRID_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}
