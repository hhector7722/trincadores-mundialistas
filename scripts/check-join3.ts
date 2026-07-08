import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const hectorId = "29231466-19ad-4d4f-9402-1349a3dbec47";
  const { data: pools } = await supabase.from("pools").select("id").limit(1);
  const poolId = pools?.[0]?.id;

  // Hector alone, no join
  const { data: h1 } = await supabase
    .from("predictions")
    .select("match_id, points_awarded")
    .eq("profile_id", hectorId)
    .eq("pool_id", poolId);
  console.log("Hector alone, no join:", h1?.length);

  // All profiles, no join
  const { data: a1 } = await supabase
    .from("predictions")
    .select("profile_id")
    .eq("pool_id", poolId);
  console.log("All profiles, no join:", a1?.length);
  const hc1 = (a1 || []).filter((p: any) => p.profile_id === hectorId).length;
  console.log("  Hector in all:", hc1);

  // All profiles, with join on matches(id)
  const { data: a2 } = await supabase
    .from("predictions")
    .select("profile_id, matches!inner(id)")
    .eq("pool_id", poolId);
  console.log("\nAll profiles, join matches(id):", a2?.length);
  const hc2 = (a2 || []).filter((p: any) => p.profile_id === hectorId).length;
  console.log("  Hector in all:", hc2);

  // All profiles, with join on matches(group_code)
  const { data: a3 } = await supabase
    .from("predictions")
    .select("profile_id, matches!inner(group_code)")
    .eq("pool_id", poolId);
  console.log("\nAll profiles, join matches(group_code):", a3?.length);
  const hc3 = (a3 || []).filter((p: any) => p.profile_id === hectorId).length;
  console.log("  Hector in all:", hc3);

  // Total prediction count in DB for pool
  const { count } = await supabase
    .from("predictions")
    .select("*", { count: "exact", head: true })
    .eq("pool_id", poolId);
  console.log("\nTotal predictions in DB for pool:", count);
}

main().catch(console.error);
