/** Slug estable para upsert (ASCII, minúsculas, guiones). */
export function toSlug(raw: string): string {
  return raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function teamExternalKey(name: string): string {
  return toSlug(name);
}

export function cityExternalKey(city: string): string {
  return toSlug(city);
}

export function groupStageKey(groupCode: string): string {
  return `group:${groupCode.toUpperCase()}`;
}

export function calendarMatchdayKey(number: number): string {
  return `matchday:${String(number).padStart(2, "0")}`;
}

export function poolMatchdayKey(matchdayKey: string): string {
  return `WC2026:${matchdayKey}`;
}

export function knockoutRoundKey(slug: string): string {
  return slug;
}

export function groupMatchId(groupCode: string, indexInGroup: number): string {
  return `WC2026-G-${groupCode.toUpperCase()}-${indexInGroup}`;
}

export function knockoutMatchId(matchNumber: number): string {
  return `WC2026-M${String(matchNumber).padStart(3, "0")}`;
}

/** Placeholders KO (2A, W74, 3A/B/C/D/F) no son equipos reales. */
export function isPlaceholderTeam(name: string): boolean {
  const t = name.trim();
  if (/^[12]\d*[A-L]$/i.test(t)) return true;
  if (/^3[A-L](\/[A-L])+$/i.test(t)) return true;
  if (/^[WL]\d+$/i.test(t)) return true;
  return false;
}
