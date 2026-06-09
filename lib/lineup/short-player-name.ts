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

/** Nombre tipo camiseta: apellido, compuesto con partícula o monónimo (sin nombre de pila). */
export function shirtPlayerName(fullName: string): string {
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

/** Alias histórico de `shirtPlayerName`. */
export const shortPlayerName = shirtPlayerName;

function firstNameToken(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? "";
}

/**
 * Etiquetas para una plantilla completa, desambiguando apellidos repetidos
 * (p. ej. Deroy Duarte #14 y Laros Duarte #15 → "D. Duarte" / "L. Duarte").
 */
export function squadDisplayNames(fullNames: string[]): string[] {
  const shorts = fullNames.map(shirtPlayerName);
  const duplicatedShorts = new Set(
    shorts.filter((short, index) => shorts.indexOf(short) !== index)
  );

  return fullNames.map((fullName, index) => {
    const short = shorts[index]!;
    if (!duplicatedShorts.has(short)) return short;

    const peers = fullNames.filter((name) => shirtPlayerName(name) === short);
    const withInitial = peers.map((name) => {
      const first = firstNameToken(name);
      return first ? `${first[0]!.toUpperCase()}. ${short}` : short;
    });

    if (new Set(withInitial).size === withInitial.length) {
      const first = firstNameToken(fullName);
      return first ? `${first[0]!.toUpperCase()}. ${short}` : short;
    }

    const first = firstNameToken(fullName);
    return first ? `${first} ${short}` : short;
  });
}

export function displayNameInSquad(fullName: string, squadFullNames: string[]): string {
  const index = squadFullNames.indexOf(fullName);
  if (index < 0) return shirtPlayerName(fullName);
  return squadDisplayNames(squadFullNames)[index] ?? shirtPlayerName(fullName);
}
