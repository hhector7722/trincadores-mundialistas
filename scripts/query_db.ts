import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://savsnkgpvvmdbaujqqoa.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
  const { data, error } = await supabase
    .from("tournament_general_predictions")
    .select("champion_team, finalist_team_a, finalist_team_b, top_scorer_player_name, tournament_mvp_player_name, golden_glove_player_name");

  if (error) {
    console.error(error);
    return;
  }

  const champions = new Set();
  const finalists = new Set();
  const scorers = new Set();
  const mvps = new Set();
  const gloves = new Set();

  data.forEach((row) => {
    if (row.champion_team) champions.add(row.champion_team);
    if (row.finalist_team_a) finalists.add(row.finalist_team_a);
    if (row.finalist_team_b) finalists.add(row.finalist_team_b);
    if (row.top_scorer_player_name) scorers.add(row.top_scorer_player_name);
    if (row.tournament_mvp_player_name) mvps.add(row.tournament_mvp_player_name);
    if (row.golden_glove_player_name) gloves.add(row.golden_glove_player_name);
  });

  console.log(`Users total: ${data.length}`);
  console.log(`Champions unique: ${champions.size}`);
  console.log(`Finalists unique: ${finalists.size}`);
  console.log(`Top Scorers unique: ${scorers.size}`);
  console.log(`MVPs unique: ${mvps.size}`);
  console.log(`Gloves unique: ${gloves.size}`);
  console.log(`Total unique calculations needed: ${champions.size + finalists.size + scorers.size + mvps.size + gloves.size}`);
}

run();
