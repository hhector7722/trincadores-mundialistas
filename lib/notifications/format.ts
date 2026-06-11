/** Evita parse ISO directo (timezone shift). */
function parseNotificationDate(iso: string): Date | null {
  const raw = iso.replace("T", " ").replace("Z", "").trim();
  const [datePart, timePart] = raw.split(" ");
  if (!datePart || !timePart) return null;
  const [y, m, d] = datePart.split("-").map(Number);
  const [hh, mm] = timePart.split(":").map(Number);
  if ([y, m, d, hh, mm].some((n) => Number.isNaN(n))) return null;
  return new Date(y, m - 1, d, hh, mm);
}

export function formatNotificationDateTimeLine(iso: string): string {
  const dt = parseNotificationDate(iso);
  if (!dt) return "";
  const date = dt.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const time = dt.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  return `${date}  ${time}`;
}
