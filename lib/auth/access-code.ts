const ACCESS_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const ACCESS_CODE_LENGTH = 12;

export function generateAccessCode(length = ACCESS_CODE_LENGTH): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => ACCESS_CODE_CHARS[b % ACCESS_CODE_CHARS.length]).join("");
}

export function normalizeAccessCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, "");
}

export function validateAccessCode(code: string): string | null {
  const normalized = normalizeAccessCode(code);
  if (normalized.length < ACCESS_CODE_LENGTH) {
    return `Codigo: minimo ${ACCESS_CODE_LENGTH} caracteres.`;
  }
  if (!/^[A-Z0-9]+$/.test(normalized)) {
    return "Codigo: solo letras y numeros.";
  }
  return null;
}
