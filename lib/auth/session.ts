import { cookies } from "next/headers";

export const ACTIVE_POOL_COOKIE = "tm_active_pool_id";

export type PoolMembershipResolution =
  | { status: "none" }
  | { status: "single"; poolId: string }
  | { status: "multiple"; poolIds: string[] };

export async function getActivePoolIdFromCookie(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(ACTIVE_POOL_COOKIE)?.value;
}

export async function setActivePoolCookie(poolId: string): Promise<void> {
  const store = await cookies();
  store.set(ACTIVE_POOL_COOKIE, poolId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function clearActivePoolCookie(): Promise<void> {
  const store = await cookies();
  store.delete(ACTIVE_POOL_COOKIE);
}

export function resolvePoolMemberships(
  rows: { pool_id: string }[] | null | undefined
): PoolMembershipResolution {
  const list = rows ?? [];
  if (list.length === 0) return { status: "none" };
  if (list.length === 1) return { status: "single", poolId: list[0].pool_id };
  return {
    status: "multiple",
    poolIds: list.map((r) => r.pool_id),
  };
}
