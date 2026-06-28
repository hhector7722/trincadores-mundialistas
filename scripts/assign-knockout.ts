import { createAdminClient } from "../lib/supabase/admin";

async function run() {
  const admin = createAdminClient();
  const updates = [
    { match: 73, home: "Germany", away: "Paraguay" },
    { match: 75, home: "France", away: "Sweden" },
    { match: 74, home: "South Africa", away: "Canada" },
    { match: 77, home: "Netherlands", away: "Morocco" },
    { match: 83, home: "Portugal", away: "Croatia" },
    { match: 84, home: "Spain", away: "Austria" },
    { match: 81, home: "USA", away: "Bosnia and Herzegovina" },
    { match: 82, home: "Belgium", away: "Senegal" },

    { match: 76, home: "Brazil", away: "Japan" },
    { match: 78, home: "Ivory Coast", away: "Norway" },
    { match: 79, home: "Mexico", away: "Ecuador" },
    { match: 80, home: "England", away: "DR Congo" },
    { match: 85, home: "Argentina", away: "Cape Verde" },
    { match: 86, home: "Australia", away: "Egypt" },
    { match: 87, home: "Switzerland", away: "Algeria" },
    { match: 88, home: "Colombia", away: "Ghana" }
  ];

  for (const { match, home, away } of updates) {
    console.log(`Updating Match ${match} to ${home} vs ${away}`);
    const { error } = await admin
      .from("matches")
      .update({ home_team: home, away_team: away })
      .eq("match_number", match);

    if (error) console.error("Error updating match", match, error);
  }

  console.log("Update complete!");
}

run().catch(console.error);
