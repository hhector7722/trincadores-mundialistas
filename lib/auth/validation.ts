export const USERNAME_REGEX = /^[a-z0-9_]{3,20}$/;

export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase();
}

export function validateUsername(username: string): string | null {
  if (!USERNAME_REGEX.test(username)) {
    return "Alias: 3-20 caracteres (letras minusculas, numeros o _).";
  }
  return null;
}
