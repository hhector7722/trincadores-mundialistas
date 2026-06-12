/** ZERO-DISPLAY en metricas agregadas (aciertos, posicion 0). */
export function formatAggregateStat(value: number): string {
  return value === 0 ? " " : String(value);
}

/** Puntos totales: siempre muestra 0 en clasificacion. */
export function formatPoints(value: number): string {
  return String(value);
}

export function formatReferenceMatchDate(kickoffAt: string): string {
  const d = new Date(kickoffAt);
  return d.toLocaleString("es-ES", {
    day: "numeric",
    month: "short",
  });
}

export function formatReferenceMatchLabel(homeTeam: string, awayTeam: string): string {
  return `${homeTeam} — ${awayTeam}`;
}
