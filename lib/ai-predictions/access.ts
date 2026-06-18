import { normalizeAlias } from "@/lib/text/normalize-alias";

export function canAccessAiPrediction(username: string | null | undefined): boolean {
  return normalizeAlias(username ?? "") === "hector";
}
