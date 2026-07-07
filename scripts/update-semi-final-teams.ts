import { createAdminClient } from "@/lib/scripts/supabase-admin";

async function main() {
  const admin = createAdminClient();

  const matchId = "976f262c-5a39-4fb8-a505-e90b6ec00114"; // W93 vs W94 on July 10

  console.log("Updating semi-final match to Spain vs Belgium...");

  const { error } = await admin
    .from("matches")
    .update({
      home_team: "Spain",
      away_team: "Belgium"
    })
    .eq("id", matchId);

  if (error) {
    throw new Error(`Failed to update match: ${error.message}`);
  }

  console.log("Successfully updated match to Spain vs Belgium.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
