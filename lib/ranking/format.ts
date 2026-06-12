/** ZERO-DISPLAY en metricas agregadas (aciertos, posicion 0). */
export function formatAggregateStat(value: number): string {
  return value === 0 ? " " : String(value);
}

/** Puntos totales: siempre muestra 0 en clasificacion. */
export function formatPoints(value: number): string {
  return String(value);
}
