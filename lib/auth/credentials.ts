const DEFAULT_AUTH_DOMAIN = "auth.trincadores.local";

export function getAuthInternalDomain(): string {
  return process.env.AUTH_INTERNAL_DOMAIN?.trim() || DEFAULT_AUTH_DOMAIN;
}

/** Unico punto de mapeo username -> credencial Supabase Auth. */
export function toAuthEmail(username: string): string {
  const normalized = username.trim().toLowerCase();
  return `${normalized}@${getAuthInternalDomain()}`;
}

export function fromAuthEmail(email: string): string | null {
  const domain = getAuthInternalDomain().toLowerCase();
  const lower = email.trim().toLowerCase();
  const suffix = `@${domain}`;
  if (!lower.endsWith(suffix)) return null;
  const local = lower.slice(0, -suffix.length);
  return local.length > 0 ? local : null;
}
