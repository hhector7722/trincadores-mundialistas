import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const hectorId = "29231466-19ad-4d4f-9402-1349a3dbec47";
  const { data: pools } = await supabase.from("pools").select("id").limit(1);
  const poolId = pools?.[0]?.id;

  // Strategy 1: limit 5000 only
  const { data: s1 } = await supabase
    .from("predictions")
    .select("profile_id")
    .eq("pool_id", poolId)
    .limit(5000);
  console.log("limit(5000):", s1?.length);

  // Strategy 2: range only
  const { data: s2 } = await supabase
    .from("predictions")
    .select("profile_id")
    .eq("pool_id", poolId)
    .range(0, 4999);
  console.log("range(0,4999):", s2?.length);

  // Strategy 3: both
  const { data: s3 } = await supabase
    .from("predictions")
    .select("profile_id")
    .eq("pool_id", poolId)
    .limit(5000)
    .range(0, 4999);
  console.log("limit(5000) + range(0,4999):", s3?.length);

  // Strategy 4: paginate manually page by page
  let all: any[] = [];
  for (let i = 0; i < 10; i++) {
    const from = i * 200;
    const to = from + 199;
    const { data: page } = await supabase
      .from("predictions")
      .select("profile_id")
      .eq("pool_id", poolId)
      .range(from, to);
    if (!page || page.length === 0) break;
    all = all.concat(page);
  }
  console.log("Pagination 200/page:", all.length);
  const hc = (all || []).filter((p: any) => p.profile_id === hectorId).length;
  console.log("  Hector in pagination:", hc);
}

main().catch(console.error);
