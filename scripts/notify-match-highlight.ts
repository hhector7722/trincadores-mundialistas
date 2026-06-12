import { maybeNotifyMatchHighlight } from "@/lib/notifications/match-highlight-notifications";
import { getSiteUrl } from "@/lib/site-url";
import { createAdminClient } from "@/lib/scripts/supabase-admin";

async function main() {
  const matchId = process.argv[2]?.trim();
  if (!matchId) {
    console.error("Uso: tsx scripts/notify-match-highlight.ts <match-id>");
    process.exit(1);
  }

  const admin = createAdminClient();
  const { data: match, error } = await admin
    .from("matches")
    .select("id, home_team, away_team, highlight_youtube_id")
    .eq("id", matchId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!match) {
    throw new Error(`Partido no encontrado: ${matchId}`);
  }

  if (!match.highlight_youtube_id) {
    throw new Error(`El partido ${matchId} no tiene resumen en video.`);
  }

  const result = await maybeNotifyMatchHighlight(
    admin,
    {
      id: match.id,
      home_team: match.home_team,
      away_team: match.away_team,
    },
    getSiteUrl().origin,
  );

  console.log(
    `[notify-match-highlight] partido=${match.home_team} vs ${match.away_team} in_app=${result.recipients} duplicadas=${result.skippedDuplicate} push=${result.pushSent} push_sin_suscripcion=${result.pushSkipped} push_fallidas=${result.pushFailed}${result.reason ? ` motivo=${result.reason}` : ""}`,
  );
}

main().catch((error) => {
  console.error("[notify-match-highlight]", error instanceof Error ? error.message : error);
  process.exit(1);
});
