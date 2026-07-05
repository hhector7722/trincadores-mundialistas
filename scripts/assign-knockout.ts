import { createAdminClient } from "../lib/supabase/admin";

async function run() {
  const admin = createAdminClient();
  const updates = [
    { match: 74, home: "South Africa", away: "Canada", time: "2026-06-28T19:00:00Z" },
    { match: 76, home: "Brazil", away: "Japan", time: "2026-06-29T17:00:00Z" },
    { match: 73, home: "Germany", away: "Paraguay", time: "2026-06-29T20:30:00Z" },
    { match: 77, home: "Netherlands", away: "Morocco", time: "2026-06-30T01:00:00Z" },
    { match: 78, home: "Ivory Coast", away: "Norway", time: "2026-06-30T17:00:00Z" },
    { match: 75, home: "France", away: "Sweden", time: "2026-06-30T21:00:00Z" },
    { match: 79, home: "Mexico", away: "Ecuador", time: "2026-07-01T01:00:00Z" },
    { match: 80, home: "England", away: "DR Congo", time: "2026-07-01T16:00:00Z" },
    { match: 82, home: "Belgium", away: "Senegal", time: "2026-07-01T20:00:00Z" },
    { match: 81, home: "USA", away: "Bosnia and Herzegovina", time: "2026-07-02T00:00:00Z" },
    { match: 84, home: "Spain", away: "Austria", time: "2026-07-02T19:00:00Z" },
    { match: 83, home: "Portugal", away: "Croatia", time: "2026-07-02T23:00:00Z" },
    { match: 87, home: "Switzerland", away: "Colombia", time: "2026-07-03T03:00:00Z" },
    { match: 86, home: "Australia", away: "Cape Verde", time: "2026-07-03T18:00:00Z" },
    { match: 85, home: "Argentina", away: "Egypt", time: "2026-07-03T22:00:00Z" },
    { match: 88, home: "Algeria", away: "Ghana", time: "2026-07-04T01:30:00Z" },
  ];

  for (const { match, home, away, time } of updates) {
    console.log(`Updating Match ${match} (${home} vs ${away}) to ${time}`);
    const { error } = await admin
      .from("matches")
      .update({ home_team: home, away_team: away, kickoff_at: time })
      .eq("match_number", match);

    if (error) console.error("Error updating match", match, error);
  }

  console.log("Update complete!");
}

run().catch(console.error);
