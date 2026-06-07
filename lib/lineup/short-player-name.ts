const NAME_PARTICLES = new Set([
  "de",
  "da",
  "di",
  "do",
  "dos",
  "das",
  "del",
  "della",
  "van",
  "von",
  "der",
  "den",
  "le",
  "la",
  "las",
  "los",
  "el",
  "san",
  "saint",
  "st",
  "mc",
  "mac",
]);

/** Nombre corto para listados compactos (apellido o monónimo). */
export function shortPlayerName(fullName: string): string {
  const trimmed = fullName.trim();
  if (!trimmed) return trimmed;

  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return parts[0]!;

  const last = parts[parts.length - 1]!;
  const secondLast = parts[parts.length - 2]!;

  if (NAME_PARTICLES.has(secondLast.toLowerCase())) {
    return `${secondLast} ${last}`;
  }

  return last;
}
