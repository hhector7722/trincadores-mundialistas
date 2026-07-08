import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const hectorId = "29231466-19ad-4d4f-9402-1349a3dbec47";
  const { data: pools } = await supabase.from("pools").select("id").limit(1);
  const poolId = pools?.[0]?.id;

  // Without range — Hector only
  const { data: noRange } = await supabase
    .from("predictions")
    .select("match_id, points_awarded, matches!inner(group_code)")
    .eq("profile_id", hectorId)
    .eq("pool_id", poolId);
  console.log("No range, Hector only:", noRange?.length);

  // With range — Hector only
  const { data: withRange } = await supabase
    .from("predictions")
    .select("match_id, points_awarded, matches!inner(group_code)")
    .eq("profile_id", hectorId)
    .eq("pool_id", poolId)
    .range(0, 9999);
  console.log("With range 0-9999, Hector only:", withRange?.length);

  // All profiles, no range
  const { data: allNoRange } = await supabase
    .from("predictions")
    .select("profile_id, points_awarded, matches!inner(group_code)")
    .eq("pool_id", poolId);
  console.log("No range, all profiles:", allNoRange?.length);

  // All profiles, with range
  const { data: allRange } = await supabase
    .from("predictions")
    .select("profile_id, points_awarded, matches!inner(group_code)")
    .eq("pool_id", poolId)
    .range(0, 9999);
  console.log("With range 0-9999, all profiles:", allRange?.length);

  // Check Hector's count in allRange
  const hectorInRange = (allRange || []).filter((p: any) => p.profile_id === hectorId).length;
  console.log("Hector count in allRange:", hectorInRange);
  
  const hectorInNoRange = (allNoRange || []).filter((p: any) => p.profile_id === hectorId).length;
  console.log("Hector count in allNoRange:", hectorInNoRange);
}

main().catch(console.error);
