/** ZERO-DISPLAY en metricas agregadas (puntos, aciertos, posicion 0). */
export function formatAggregateStat(value: number): string {
  return value === 0 ? " " : String(value);
}