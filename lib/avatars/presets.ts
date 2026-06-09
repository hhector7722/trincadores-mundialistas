import { normalizeAlias } from "@/lib/text/normalize-alias";

const AVATAR_BASE_PATH = "/icons/avatar";

const DEFAULT_BADGE_OBJECT_POSITION = "center 22%";

/** Recorte vertical del círculo en ranking/home por alias (posters con cara más baja). */
const BADGE_OBJECT_POSITION: Record<string, string> = {
  nacho: "center 40%",
  solskjaer: "center 58%",
};

/** Ruta pública del avatar preasignado por alias (p. ej. `/icons/avatar/hector.png`). */
export function getPresetAvatarUrl(username: string): string {
  return `${AVATAR_BASE_PATH}/${normalizeAlias(username)}.png`;
}

function resolveAvatarAlias(usernameOrUrl: string): string {
  const fromPath = usernameOrUrl.match(/\/icons\/avatar\/([^/.]+)\.png$/i);
  return normalizeAlias(fromPath?.[1] ?? usernameOrUrl);
}

/** Posición focal del recorte circular (`object-position`) para variant badge. */
export function getAvatarBadgeObjectPosition(usernameOrUrl: string | null): string {
  if (!usernameOrUrl?.trim()) return DEFAULT_BADGE_OBJECT_POSITION;
  return BADGE_OBJECT_POSITION[resolveAvatarAlias(usernameOrUrl)] ?? DEFAULT_BADGE_OBJECT_POSITION;
}
