import { createAdminClient } from "../lib/supabase/admin";
import { placeholderPairForMatchNumber } from "../lib/predictions/knockout-bracket-layout";

async function run() {
  const admin = createAdminClient();

  for (let i = 73; i <= 104; i++) {
    const placeholders = placeholderPairForMatchNumber(i);
    if (!placeholders) continue;

    console.log(`Reverting Match ${i} to ${placeholders.home} vs ${placeholders.away}`);
    const { error } = await admin
      .from("matches")
      .update({ home_team: placeholders.home, away_team: placeholders.away })
      .eq("match_number", i);

    if (error) console.error("Error updating match", i, error);
  }

  console.log("Revert complete!");
}

run().catch(console.error);
