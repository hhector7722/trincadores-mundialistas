/**
 * Seed de preview: resumen FIFA de prueba en el partido de hoy (MEX–RSA)
 * con otro vídeo del canal (@fifa). Solo visible para usuario `hector` (preview-access).
 *
 * Uso: npm run db:seed-highlight-preview
 */
import { createAdminClient } from "@/lib/scripts/supabase-admin";

const MATCH_ID = "5c9b61db-ff12-4739-a2a5-e3e3951cf410";
const HECTOR_PROFILE_ID = "29231466-19ad-4d4f-9402-1349a3dbec47";
/** HIGHLIGHTS: Iraq vs Bolivia | FIFA World Cup Play-off Tournament Final (@fifa) */
const PREVIEW_VIDEO_ID = "6YTxxwzCEp4";

async function main() {
  const admin = createAdminClient();

  const { error: matchError } = await admin
    .from("matches")
    .update({
      highlight_youtube_id: PREVIEW_VIDEO_ID,
      highlight_published_at: new Date().toISOString(),
      status: "finished",
    })
    .eq("id", MATCH_ID);

  if (matchError) throw new Error(matchError.message);

  const { error: resultError } = await admin.from("match_results").upsert(
    {
      match_id: MATCH_ID,
      home_goals: 2,
      away_goals: 1,
      recorded_by: HECTOR_PROFILE_ID,
      recorded_at: new Date().toISOString(),
    },
    { onConflict: "match_id" },
  );

  if (resultError) throw new Error(resultError.message);

  const { error: mapError } = await admin.from("external_id_map").upsert(
    {
      source_code: "youtube_fifa",
      external_key: PREVIEW_VIDEO_ID,
      entity_type: "match",
      internal_table: "matches",
      internal_id: MATCH_ID,
      metadata: {
        title: "HIGHLIGHTS: Iraq vs Bolivia | FIFA World Cup Play-off Tournament Final",
        preview_seed: true,
        preview_for: "hector",
      },
      match_status: "mapped",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "source_code,external_key" },
  );

  if (mapError) throw new Error(mapError.message);

  console.log(
    JSON.stringify(
      {
        ok: true,
        matchId: MATCH_ID,
        videoId: PREVIEW_VIDEO_ID,
        previewUser: "hector",
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
