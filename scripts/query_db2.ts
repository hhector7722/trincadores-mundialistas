import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const { data: matches } = await supabase
    .from("matches")
    .select("id, home_team, away_team, status");

  const matching = matches?.filter(m => 
    (m.home_team?.toLowerCase().includes("netherland") || m.home_team?.toLowerCase().includes("países")) ||
    (m.away_team?.toLowerCase().includes("netherland") || m.away_team?.toLowerCase().includes("países"))
  );

  console.log("Matches:", matching);

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name");
  
  console.log("Profiles:");
  profiles?.forEach(p => {
    if (['Hector', 'Paco', 'Oro', 'Dani', 'Dani L', 'DaniL', 'Pado'].some(name => p.display_name?.includes(name))) {
      console.log(p.display_name, p.id);
    }
  });
}
main();
