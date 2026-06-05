const MONTHS: Record<string, number> = {
  january: 1,
  jan: 1,
  february: 2,
  feb: 2,
  march: 3,
  mar: 3,
  april: 4,
  apr: 4,
  may: 5,
  june: 6,
  jun: 6,
  july: 7,
  jul: 7,
  august: 8,
  aug: 8,
  september: 9,
  sep: 9,
  october: 10,
  oct: 10,
  november: 11,
  nov: 11,
  december: 12,
  dec: 12,
};

export function parseDateKey(line: string, year = 2026): string | null {
  let text = line.trim();
  if (text.includes("|")) {
    text = (text.split("|").pop() ?? text).trim();
  }
  const m = text.match(
    /^(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)\w*\s+([A-Za-z]+)\s+(\d{1,2})$/i
  );
  if (!m) return null;
  const month = MONTHS[m[1].toLowerCase()];
  const day = Number(m[2]);
  if (!month || !day) return null;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function parseUtcOffset(offset: string): string {
  const m = offset.trim().match(/^UTC([+-])(\d+)$/i);
  if (!m) throw new Error(`Offset UTC invalido: ${offset}`);
  const sign = m[1] === "-" ? "-" : "+";
  const hours = m[2].padStart(2, "0");
  return `${sign}${hours}:00`;
}

/** Construye ISO 8601 con offset fijo (sin conversion IANA). */
export function buildKickoffIso(
  dateKey: string,
  time: string,
  utcOffset: string
): string {
  const [y, mo, d] = dateKey.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  const offset = parseUtcOffset(utcOffset);
  const month = String(mo).padStart(2, "0");
  const day = String(d).padStart(2, "0");
  const hour = String(hh).padStart(2, "0");
  const minute = String(mm).padStart(2, "0");
  return `${y}-${month}-${day}T${hour}:${minute}:00${offset}`;
}
