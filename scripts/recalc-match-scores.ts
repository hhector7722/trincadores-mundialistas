import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const matchId = "d40b3a61-b7d7-48e1-be99-1cb79db5f492";

  const { error: recalcError } = await supabase.rpc("recalculate_match_scores", {
    p_match_id: matchId,
  });

  if (recalcError) {
    console.error("Error recalculating:", recalcError);
  } else {
    console.log("Recalculated match scores successfully.");
  }
}

main().catch(console.error);
