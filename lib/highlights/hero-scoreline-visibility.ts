import { normalizeAlias } from "@/lib/text/normalize-alias";

export const HERO_HIGHLIGHT_SCORELINE_SETTING_KEY = "hero_highlight_scoreline_visible";

export function canControlHighlightScorelineVisibility(
  username: string | null | undefined,
): boolean {
  return normalizeAlias(username ?? "") === "hector";
}

export function readHeroHighlightScorelineVisible(settings: unknown): boolean {
  if (!settings || typeof settings !== "object") return true;
  const value = (settings as Record<string, unknown>)[HERO_HIGHLIGHT_SCORELINE_SETTING_KEY];
  if (typeof value === "boolean") return value;
  return true;
}

export function withHeroHighlightScorelineVisible(
  settings: unknown,
  visible: boolean,
): Record<string, unknown> {
  const base =
    settings && typeof settings === "object" && !Array.isArray(settings)
      ? { ...(settings as Record<string, unknown>) }
      : {};
  return {
    ...base,
    [HERO_HIGHLIGHT_SCORELINE_SETTING_KEY]: visible,
  };
}
