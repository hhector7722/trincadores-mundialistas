/**
 * Vista previa de mapeo BSD sin credenciales Supabase locales.
 * Uso: npx tsx --env-file=.env.local scripts/preview-bsd-fixtures.ts
 */
import { mapFixturesToInternalMatches } from "@/lib/lineup/sources/api-football-match-mapper";
import { fetchWorldCupEventsFromBsd } from "@/lib/lineup/sources/bsd-client";

const MATCHES: Array<{
  id: string;
  home_team: string;
  away_team: string;
  kickoff_at: string;
  external_match_id: string | null;
}> = [];

async function main() {
  if (!process.env.BSD_API_KEY?.trim()) {
    throw new Error("Falta BSD_API_KEY.");
  }

  const [{ events, requests }, matches] = await Promise.all([
    fetchWorldCupEventsFromBsd(),
    fetchMatchesFromSupabaseRest(),
  ]);

  const fixtures = events.map((event) => ({
    fixtureId: event.fixtureId,
    kickoffIso: event.kickoffIso,
    homeName: event.homeName,
    awayName: event.awayName,
    homeTeamId: event.homeTeamId,
    awayTeamId: event.awayTeamId,
  }));

  const { mapped, unmapped } = mapFixturesToInternalMatches(matches, fixtures);

  console.log(
    JSON.stringify(
      {
        requests,
        bsdEvents: fixtures.length,
        internalMatches: matches.length,
        mapped: mapped.length,
        unmapped: unmapped.length,
        sampleMapped: mapped.slice(0, 5).map((row) => ({
          external_match_id: row.match.external_match_id,
          bsd_event_id: row.fixture.fixtureId,
          delta: row.kickoffDeltaMinutes,
        })),
        sampleUnmapped: unmapped.slice(0, 5).map((row) => row.external_match_id),
      },
      null,
      2
    )
  );
}

async function fetchMatchesFromSupabaseRest() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !key) {
    if (MATCHES.length > 0) return MATCHES;
    throw new Error(
      "Sin credenciales Supabase. Configura NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  const response = await fetch(
    `${url}/rest/v1/matches?select=id,home_team,away_team,kickoff_at,external_match_id&order=kickoff_at.asc`,
    {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
    }
  );
  if (!response.ok) {
    throw new Error(`Supabase matches HTTP ${response.status}`);
  }
  const data = (await response.json()) as typeof MATCHES;
  return data;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
