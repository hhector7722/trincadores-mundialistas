import { normalizeUsername } from "@/lib/auth/validation";

const AVATAR_BASE_PATH = "/icons/avatar";

/** Ruta pública del avatar preasignado por alias (p. ej. `/icons/avatar/hector.png`). */
export function getPresetAvatarUrl(username: string): string {
  return `${AVATAR_BASE_PATH}/${normalizeUsername(username)}.png`;
}
