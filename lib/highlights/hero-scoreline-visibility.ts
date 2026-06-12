import { normalizeAlias } from "@/lib/text/normalize-alias";

export const HIGHLIGHT_SCORELINE_VISIBLE_STORAGE_KEY = "tm-highlight-scoreline-visible";

export function canControlHighlightScorelineVisibility(
  username: string | null | undefined,
): boolean {
  return normalizeAlias(username ?? "") === "hector";
}

export function readHighlightScorelineVisible(): boolean {
  if (typeof window === "undefined") return true;
  const raw = window.localStorage.getItem(HIGHLIGHT_SCORELINE_VISIBLE_STORAGE_KEY);
  if (raw === null) return true;
  return raw === "1";
}

export function writeHighlightScorelineVisible(visible: boolean): void {
  window.localStorage.setItem(HIGHLIGHT_SCORELINE_VISIBLE_STORAGE_KEY, visible ? "1" : "0");
}
