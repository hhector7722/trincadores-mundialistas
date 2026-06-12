import { createAdminClient } from "@/lib/scripts/supabase-admin";

const MATCH_ID = "5c9b61db-ff12-4739-a2a5-e3e3951cf410";

async function probeBsd(eventId: number, apiKey: string) {
  const base = "https://sports.bzzoiro.com";
  const paths = [
    `/api/v2/events/${eventId}/`,
    `/api/v2/events/${eventId}/incidents/`,
    `/api/v2/events/${eventId}/lineups/`,
    `/api/v2/events/${eventId}/stats/`,
  ];

  for (const path of paths) {
    const response = await fetch(`${base}${path}`, {
      headers: { Authorization: `Token ${apiKey}` },
    });
    const json = await response.json();
    console.log("\nBSD", path, response.status);
    console.log(JSON.stringify(json, null, 2).slice(0, 4000));
  }
}

async function probeApiFootball(fixtureId: string, apiKey: string) {
  const base = "https://v3.football.api-sports.io";
  const paths = [
    `/fixtures?id=${fixtureId}`,
    `/fixtures/players?fixture=${fixtureId}`,
    `/fixtures/events?fixture=${fixtureId}`,
  ];

  for (const path of paths) {
    const response = await fetch(`${base}${path}`, {
      headers: { "x-apisports-key": apiKey },
    });
    const json = await response.json();
    console.log("\nAPI-Football", path, response.status);
    console.log(JSON.stringify(json, null, 2).slice(0, 4000));
  }
}

async function main() {
  const admin = createAdminClient();
  const bsdKey = process.env.BSD_API_KEY?.trim();
  const afKey = process.env.API_FOOTBALL_KEY?.trim();

  const { data: maps } = await admin
    .from("external_id_map")
    .select("source_code, external_key")
    .eq("internal_id", MATCH_ID)
    .in("source_code", ["bsd", "api_football"]);

  console.log("maps", maps);

  if (bsdKey) {
    const bsdId = Number(maps?.find((m) => m.source_code === "bsd")?.external_key);
    if (Number.isFinite(bsdId)) await probeBsd(bsdId, bsdKey);
  }

  if (afKey) {
    const afId = maps?.find((m) => m.source_code === "api_football")?.external_key;
    if (afId) await probeApiFootball(afId, afKey);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
