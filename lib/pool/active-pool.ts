import { getActivePoolIdFromCookie, setActivePoolCookie } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export type UserPool = {
  id: string;
  name: string;
  slug: string;
};

export type AppShellContext = {
  profileLabel: string;
  pools: UserPool[];
  activePoolId: string;
  activePoolName: string;
  activePoolSlug: string;
};

export async function loadAppShellContext(userId: string): Promise<AppShellContext | null> {
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, display_name")
    .eq("id", userId)
    .single();

  const { data: memberships, error: memError } = await supabase
    .from("pool_members")
    .select("pool_id")
    .eq("profile_id", userId);

  if (memError || !memberships?.length) return null;

  const poolIds = memberships.map((m) => m.pool_id);
  const { data: pools, error: poolError } = await supabase
    .from("pools")
    .select("id, name, slug")
    .in("id", poolIds);

  if (poolError || !pools?.length) return null;

  const cookiePoolId = await getActivePoolIdFromCookie();
  const validCookie = cookiePoolId && pools.some((p) => p.id === cookiePoolId);
  const activePoolId = validCookie ? cookiePoolId! : pools[0].id;

  if (cookiePoolId !== activePoolId) {
    await setActivePoolCookie(activePoolId);
  }

  const activePool = pools.find((p) => p.id === activePoolId) ?? pools[0];
  const profileLabel = profile?.display_name ?? profile?.username ?? "Jugador";

  return {
    profileLabel,
    pools: pools.map((p) => ({ id: p.id, name: p.name, slug: p.slug })),
    activePoolId: activePool.id,
    activePoolName: activePool.name,
    activePoolSlug: activePool.slug,
  };
}

export async function assertPoolMembership(userId: string, poolId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("pool_members")
    .select("pool_id")
    .eq("profile_id", userId)
    .eq("pool_id", poolId)
    .maybeSingle();
  return !!data;
}
