import { fetchWorldCupOutrights } from "@/lib/odds/the-odds-api-client";

async function main() {
  const odds = await fetchWorldCupOutrights();
  if (!odds || odds.length === 0) {
    console.log("No odds data");
    return;
  }

  const bookie = odds[0].bookmakers[0];
  if (!bookie) {
    console.log("No bookmaker");
    return;
  }

  const market = bookie.markets.find((m) => m.key === "outrights");
  if (!market) {
    console.log("No outrights market");
    return;
  }

  console.log("Bookmaker:", bookie.title);
  console.log("Outcomes (first 20):");
  for (const o of market.outcomes.slice(0, 20)) {
    console.log(`  ${o.name}: ${o.price}`);
  }

  // Check for Spain specifically
  const spain = market.outcomes.find((o) => o.name.toLowerCase().includes("spain"));
  console.log("\nSpain odds:", spain ? `${spain.name}: ${spain.price}` : "NOT FOUND");

  // Check if team names match what's in predictions
  const teams = ["Spain", "Argentina", "Brazil", "France", "England", "Germany", "Portugal", "Belgium"];
  for (const team of teams) {
    const match = market.outcomes.find((o) => o.name.toLowerCase() === team.toLowerCase());
    console.log(`${team}:`, match ? `FOUND (${match.price})` : "NOT FOUND");
  }
}

main().catch(console.error);
