import { normalizeAlias } from "@/lib/text/normalize-alias";

/** Beta cerrada: solo Hector puede jugar el quiz diario hasta abrirlo al grupo. */
export function canAccessQuizBeta(username: string | null | undefined): boolean {
  return normalizeAlias(username ?? "") === "hector";
}
