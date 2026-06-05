export const USERNAME_REGEX = /^[a-z0-9_]{3,20}$/;
export const MIN_PASSWORD_LENGTH = 8;

export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase();
}

export function validateUsername(username: string): string | null {
  if (!USERNAME_REGEX.test(username)) {
    return "Usuario: 3-20 caracteres (letras minusculas, numeros o _).";
  }
  return null;
}

export function validatePassword(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Contrasena: minimo ${MIN_PASSWORD_LENGTH} caracteres.`;
  }
  return null;
}

export function validateInviteCode(code: string): string | null {
  const trimmed = code.trim();
  if (trimmed.length < 4) {
    return "Codigo de invitacion invalido.";
  }
  return null;
}
