import type { UsageFilterUser } from "@/lib/usage/queries";

const DEFAULT_EXCLUDED_USERNAMES = new Set(["hector"]);

export function isUsageDefaultExcludedUser(
  user: Pick<UsageFilterUser, "username">
): boolean {
  return DEFAULT_EXCLUDED_USERNAMES.has(user.username.trim().toLowerCase());
}

/** Seleccion por defecto del panel: todos los miembros excepto los excluidos. */
export function getDefaultUsageSelectedProfileIds(users: UsageFilterUser[]): string[] {
  return users
    .filter((user) => !isUsageDefaultExcludedUser(user))
    .map((user) => user.profileId);
}

export function usageProfileIdSetsMatch(
  a: Iterable<string>,
  b: Iterable<string>
): boolean {
  const setA = new Set(a);
  const setB = new Set(b);
  if (setA.size !== setB.size) return false;
  for (const id of setA) {
    if (!setB.has(id)) return false;
  }
  return true;
}
