import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const env = fs.readFileSync(".env.local", "utf8");
const SUPABASE_SERVICE_ROLE_KEY = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)?.[1];


const SUPABASE_URL = "https://savsnkgpvvmdbaujqqoa.supabase.co";
const SUPABASE_KEY = SUPABASE_SERVICE_ROLE_KEY || "";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
  const { data, error } = await supabase
    .from("match_results")
    .update({ penalty_home: 4, penalty_away: 3 })
    .eq("match_id", "704d9d32-1f9e-41a2-ad65-c1a356687216");

  if (error) {
    console.error(error);
    return;
  }

  console.log(data);
}

run();
