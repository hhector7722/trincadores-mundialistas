export const PREDICTION_LOCK_MINUTES = 5;

export function predictionLockDeadlineMs(kickoffAtIso: string): number {
  return new Date(kickoffAtIso).getTime() - PREDICTION_LOCK_MINUTES * 60 * 1000;
}

export function predictionEditDeadlineMs(
  kickoffAtIso: string,
  untilKickoff = false
): number {
  const kickoffMs = new Date(kickoffAtIso).getTime();
  return untilKickoff ? kickoffMs : predictionLockDeadlineMs(kickoffAtIso);
}

export function predictionEditClosedMessage(untilKickoff: boolean): string {
  return untilKickoff
    ? "Prediccion cerrada. El plazo termina al inicio del partido."
    : "Prediccion cerrada. El plazo termina 5 minutos antes del pitido.";
}

export function predictionEditOpenHint(untilKickoff: boolean): string {
  return untilKickoff
    ? "Puedes editar hasta el inicio del partido."
    : "Puedes editar hasta 5 minutos antes del pitido.";
}

export function formatPredictionCountdown(remainingMs: number): string {
  if (remainingMs <= 0) return "0s";

  const totalSeconds = Math.ceil(remainingMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) {
    return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
  }
  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}
