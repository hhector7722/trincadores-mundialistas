import { getTheOddsApiKey } from "../lib/odds/the-odds-api-client";

async function run() {
  const apiKey = getTheOddsApiKey();
  const res = await fetch(`https://api.the-odds-api.com/v4/sports?apiKey=${apiKey}`);
  const data = await res.json();
  const wcSports = data.filter((s: any) => s.key.includes("world_cup"));
  console.log(wcSports);
}

run();
