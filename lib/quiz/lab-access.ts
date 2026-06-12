import { normalizeAlias } from "@/lib/text/normalize-alias";

export function canAccessQuizLab(username: string | null | undefined): boolean {
  return normalizeAlias(username ?? "") === "hector";
}

export function isQuizLabPath(pathname: string): boolean {
  return pathname === "/laboratorio" || pathname.startsWith("/laboratorio/");
}
