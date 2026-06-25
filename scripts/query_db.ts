import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://savsnkgpvvmdbaujqqoa.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
  const { data, error } = await supabase
    .from("dynamic_probabilities")
    .select("*");

  if (error) {
    console.error(error);
    return;
  }

  console.log(data);
}

run();
