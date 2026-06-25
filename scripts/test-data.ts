import { createAdminClient } from "@/lib/scripts/supabase-admin";

async function run() {
  const admin = createAdminClient();
  const { data } = await admin.from("tournament_general_predictions").select("*").limit(1);
  console.log(JSON.stringify(data, null, 2));
}

run();
