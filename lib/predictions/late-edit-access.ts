import { normalizeAlias } from "@/lib/text/normalize-alias";

/** Hector puede guardar pronósticos hasta el pitido (resto: T-5 min). */
export function canEditPredictionsUntilKickoff(
  username: string | null | undefined
): boolean {
  return normalizeAlias(username ?? "") === "hector";
}
