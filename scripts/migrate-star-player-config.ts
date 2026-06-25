import { createAdminClient } from "../lib/scripts/supabase-admin";

async function run() {
  const admin = createAdminClient();
  console.log("[migrate] Checking star_player_config table...");

  // Check if table exists by trying to select from it
  const { error: checkError } = await admin
    .from("star_player_config" as any)
    .select("id")
    .limit(1);

  if (!checkError) {
    console.log("[migrate] Table already exists. Done.");
    return;
  }

  if (checkError.code !== "42P01") {
    console.error("[migrate] Unexpected error:", checkError);
    process.exit(1);
  }

  console.log("[migrate] Table does not exist. Creating via Supabase SQL...");
  console.log("[migrate] Please run this SQL in the Supabase Dashboard SQL Editor:");
  console.log(`
-----------------------------------------------
CREATE TABLE IF NOT EXISTS public.star_player_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_name text NOT NULL,
  team_name text,
  top_scorer_prob numeric(5,4),
  mvp_prob numeric(5,4),
  golden_glove_prob numeric(5,4),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT star_player_config_player_name_unique UNIQUE (player_name)
);

ALTER TABLE public.star_player_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "star_player_config_read"
  ON public.star_player_config
  FOR SELECT
  USING (true);
-----------------------------------------------
`);
  process.exit(1);
}

run().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
