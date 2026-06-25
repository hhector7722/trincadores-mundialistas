import { getTheOddsApiKey } from '../lib/odds/the-odds-api-client';

async function run() {
  const apiKey = getTheOddsApiKey();
  const markets = ['outrights', 'tournament_winner', 'tournament_top_goalscorer', 'tournament_best_player', 'tournament_best_goalkeeper'];
  
  for (const m of markets) {
    const url = `https://api.the-odds-api.com/v4/sports/soccer_fifa_world_cup/odds?apiKey=${apiKey}&regions=eu,uk&markets=${m}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.message) {
      console.log(`Market ${m}:`, data.message);
    } else if (data.length > 0) {
      console.log(`Market ${m}: works!`);
    } else {
      console.log(`Market ${m}: No data (empty array)`);
    }
  }
}
run();
