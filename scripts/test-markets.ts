import { getTheOddsApiKey } from '../lib/odds/the-odds-api-client';

async function run() {
  const url = `https://api.the-odds-api.com/v4/sports/soccer_fifa_world_cup/odds?apiKey=${getTheOddsApiKey()}&regions=eu,uk&markets=outrights`;
  console.log("Fetching outrights...");
  const res = await fetch(url);
  const data = await res.json();
  
  if (data.length > 0) {
    const event = data[0];
    const bookie = event.bookmakers[0];
    console.log("Available markets for outrights event:", bookie?.markets.map((m: any) => m.key));
  } else {
    console.log("No outrights data", data);
  }
}
run();
