import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const matchId = "d40b3a61-b7d7-48e1-be99-1cb79db5f492";

  console.log("Updating match_results with MVP...");
  const { error: updateError } = await supabase
    .from("match_results")
    .update({ mvp_player_name: "Diop", mvp_team_name: "Morocco" })
    .eq("match_id", matchId);

  if (updateError) throw updateError;

  console.log("Recalculating match scores...");
  const { error: rpcError } = await supabase.rpc("recalculate_match_scores", {
    p_match_id: matchId,
  });

  if (rpcError) throw rpcError;

  const poolId = "ad35e04d-a110-4ebf-8086-ea580a32fc15";
  console.log("Rebuilding pool member scores...");
  const { error: rebuildError } = await supabase.rpc("rebuild_pool_member_scores", {
    p_pool_id: poolId,
  });

  if (rebuildError) throw rebuildError;

  console.log("Done!");
}

main().catch(console.error);
