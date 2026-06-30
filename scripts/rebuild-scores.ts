import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const { data: pools, error: poolError } = await supabase
    .from("pools")
    .select("id");

  if (poolError) {
    throw new Error(poolError.message);
  }

  for (const pool of pools || []) {
    console.log(`Rebuilding scores for pool ${pool.id}...`);
    const { error } = await supabase.rpc("rebuild_pool_member_scores", {
      p_pool_id: pool.id
    });
    if (error) {
      console.error(`Error rebuilding pool ${pool.id}:`, error.message);
    } else {
      console.log(`Successfully rebuilt pool ${pool.id}.`);
    }
  }
}

main().catch(console.error);
