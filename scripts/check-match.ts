import { getBsdApiKey } from '../lib/lineup/sources/bsd-client';
import { BSD_WC_LEAGUE_ID } from '../lib/lineup/sources/bsd-constants';

async function main() {
  const apiKey = getBsdApiKey();
  let nextUrl = `https://sports.bzzoiro.com/api/v2/events/?league_id=${BSD_WC_LEAGUE_ID}&limit=100`;
  const allEvents = [];
  
  while (nextUrl) {
    const res = await fetch(nextUrl, {
      headers: { Authorization: `Token ${apiKey}` },
    });
    const data = await res.json();
    allEvents.push(...(data.results || []));
    nextUrl = data.next;
  }
  
  const matches = allEvents.filter(e => 
    e.home_team === 'France' || e.away_team === 'France' || 
    e.home_team === 'Iraq' || e.away_team === 'Iraq'
  );
  
  console.log(JSON.stringify(matches.map(m => ({
    id: m.id, home: m.home_team, away: m.away_team, date: m.event_date, status: m.status
  })), null, 2));
}

main().catch(console.error);
