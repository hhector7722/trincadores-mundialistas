import { cityExternalKey } from "./slug";
import type { ParsedStadium } from "./types";

function parseCoords(raw: string): { lat: number | null; lng: number | null } {
  const cleaned = raw.replace(/[""]/g, '"').trim();
  const dms = cleaned.match(
    /(\d+)°(\d+)'(\d+)"([NS])\s+(\d+)°(\d+)'(\d+)"([EW])/i
  );
  if (dms) {
    const lat =
      (Number(dms[1]) + Number(dms[2]) / 60 + Number(dms[3]) / 3600) *
      (dms[4].toUpperCase() === "S" ? -1 : 1);
    const lng =
      (Number(dms[5]) + Number(dms[6]) / 60 + Number(dms[7]) / 3600) *
      (dms[8].toUpperCase() === "W" ? -1 : 1);
    return { lat, lng };
  }

  const dec = cleaned.match(/(-?\d+(?:\.\d+)?)°?\s*([NS])?\s+(-?\d+(?:\.\d+)?)°?\s*([EW])?/i);
  if (dec) {
    let lat = Number(dec[1]);
    let lng = Number(dec[3]);
    if (dec[2]?.toUpperCase() === "S") lat *= -1;
    if (dec[4]?.toUpperCase() === "W") lng *= -1;
    return { lat, lng };
  }

  return { lat: null, lng: null };
}

export function parseStadiumsCsv(content: string): ParsedStadium[] {
  const rows: ParsedStadium[] = [];

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    if (trimmed.toLowerCase().startsWith("city,")) continue;

    const parts = trimmed.split(",").map((p) => p.trim());
    if (parts.length < 5) continue;

    const [city, timezone, cc, name, capacityRaw, , , coordsRaw] = parts;
    const { lat, lng } = coordsRaw ? parseCoords(coordsRaw) : { lat: null, lng: null };
    const capacity = Number(capacityRaw);
    rows.push({
      externalKey: cityExternalKey(city),
      city,
      countryCode: cc.toLowerCase(),
      stadiumName: name,
      timezoneOffset: timezone,
      capacity: Number.isFinite(capacity) ? capacity : null,
      latitude: lat,
      longitude: lng,
    });
  }

  return rows;
}
