import { fetchFotmobMatchDetailsRaw } from "../lib/live/sources/fotmob-live";

import fs from "fs";

async function run() {
  const res = await fetch("https://www.fotmob.com/api/leagues?id=50");
  const data = await res.json();
  const matches = data.matches.allMatches;
  for (const m of matches) {
    if (m.status?.reason?.short === "Pen") {
      console.log("Found penalty match:", m.id, m.home.name, m.away.name);
      const details = await fetchFotmobMatchDetailsRaw(m.id);
      console.log(JSON.stringify(details?.header?.status, null, 2));
      break;
    }
  }
}

run();
