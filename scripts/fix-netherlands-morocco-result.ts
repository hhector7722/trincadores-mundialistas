import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const matchId = "d40b3a61-b7d7-48e1-be99-1cb79db5f492";

  const { error } = await supabase
    .from("match_results")
    .update({
      penalty_home: 0,
      penalty_away: 1
    })
    .eq("match_id", matchId);

  if (error) {
    console.error("Error:", error);
  } else {
    console.log("Updated match result to reflect Away (Morocco) advancing on penalties.");
  }
}

main().catch(console.error);
