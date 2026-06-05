import { createClient } from "@/lib/supabase/server";
import type { PoolMemberRole } from "@/types/database";

const ADMIN_ROLES: PoolMemberRole[] = ["owner", "admin"];

export async function isPoolAdmin(poolId: string, profileId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pool_members")
    .select("role")
    .eq("pool_id", poolId)
    .eq("profile_id", profileId)
    .maybeSingle();

  if (error || !data) return false;
  return ADMIN_ROLES.includes(data.role as PoolMemberRole);
}