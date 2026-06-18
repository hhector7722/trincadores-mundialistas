export function formatPredictionInsightUpdatedAgo(iso: string): string {
  const updatedAt = new Date(iso);
  if (Number.isNaN(updatedAt.getTime())) {
    return "Actualizado recientemente";
  }

  const diffMs = Date.now() - updatedAt.getTime();
  if (diffMs < 60_000) {
    return "Actualizado hace un momento";
  }

  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 60) {
    return `Actualizado hace ${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `Actualizado hace ${hours} h`;
  }

  const days = Math.floor(hours / 24);
  return `Actualizado hace ${days} d`;
}
