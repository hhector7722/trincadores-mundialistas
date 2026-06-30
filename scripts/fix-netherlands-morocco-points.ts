import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const MATCH_ID = "d40b3a61-b7d7-48e1-be99-1cb79db5f492"; // Netherlands vs Morocco

const FIXES = [
  { profile_id: "008b41b1-c13b-49be-8e6e-9da649698851", points: 2, name: "Oro" },
  { profile_id: "5013facf-23e7-4a4d-9bfb-c03385101383", points: 5, name: "Dani" },
  { profile_id: "29231466-19ad-4d4f-9402-1349a3dbec47", points: 5, name: "Hector" },
  { profile_id: "65c80116-559f-4cb8-9a09-39091738297b", points: 2, name: "Paco" },
];

async function main() {
  for (const fix of FIXES) {
    const { error } = await supabase
      .from("predictions")
      .update({ points_awarded: fix.points, updated_at: new Date().toISOString() })
      .eq("match_id", MATCH_ID)
      .eq("profile_id", fix.profile_id);

    if (error) {
      console.error(`Error updating ${fix.name}:`, error.message);
    } else {
      console.log(`Successfully updated ${fix.name} to ${fix.points} points.`);
    }
  }

  // Also call evaluate to trigger recalculations if there is any trigger or anything, 
  // though just updating points_awarded is what other fix scripts do.
  console.log("Done.");
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
