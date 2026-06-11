/** Preview cerrado: resúmenes FIFA visibles solo para estos usuarios hasta validar UX. */
export const HIGHLIGHTS_PREVIEW_USERNAMES = new Set(["hector"]);

export function canViewMatchHighlights(username: string | null | undefined): boolean {
  if (!username) return false;
  return HIGHLIGHTS_PREVIEW_USERNAMES.has(username.trim().toLowerCase());
}
