import { normalizeAlias } from "@/lib/text/normalize-alias";

const AVATAR_BASE_PATH = "/icons/avatar";

/** Ruta pública del avatar preasignado por alias (p. ej. `/icons/avatar/hector.png`). */
export function getPresetAvatarUrl(username: string): string {
  return `${AVATAR_BASE_PATH}/${normalizeAlias(username)}.png`;
}
