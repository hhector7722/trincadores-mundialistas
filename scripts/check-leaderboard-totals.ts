import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const poolId = "ad35e04d-a110-4ebf-8086-ea580a32fc15";
  const { data: predictions, error } = await supabase
    .from("predictions")
    .select("profile_id, match_id, points_awarded")
    .eq("pool_id", poolId)
    .in("profile_id", ["29231466-19ad-4d4f-9402-1349a3dbec47", "5013facf-23e7-4a4d-9bfb-c03385101383"])
    .not("points_awarded", "is", null);

  if (error) throw error;
  
  let hectorTotal = 0;
  let daniTotal = 0;

  for (const p of predictions) {
    if (p.profile_id === "29231466-19ad-4d4f-9402-1349a3dbec47") {
      hectorTotal += p.points_awarded;
    } else {
      daniTotal += p.points_awarded;
    }
  }

  console.log({
    Hector: hectorTotal,
    Dani: daniTotal
  });
}

main().catch(console.error);
