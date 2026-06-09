/** Variantes de alias que deben resolver al mismo identificador canonico. */
const ALIAS_CANONICAL: Record<string, string> = {
  solskjaer: "solskjaer",
  solskaer: "solskjaer",
};

/**
 * Normaliza texto para comparacion flexible:
 * trim, minusculas, sin diacriticos.
 */
export function normalizeText(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/æ/g, "ae")
    .replace(/œ/g, "oe")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/**
 * Normaliza un alias de usuario para comparacion y resolucion de assets.
 * Tras normalizeText aplica equivalencias explicitas (p. ej. Solskjær / Solskjaer / Solskaer → solskjaer).
 */
export function normalizeAlias(value: string): string {
  const base = normalizeText(value);
  return ALIAS_CANONICAL[base] ?? base;
}
