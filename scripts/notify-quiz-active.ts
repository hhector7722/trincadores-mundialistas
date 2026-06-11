import { broadcastQuizActiveAnnouncement } from "@/lib/notifications/quiz-active-announcement";
import { getSiteUrl } from "@/lib/site-url";
import { createAdminClient } from "@/lib/scripts/supabase-admin";

async function main() {
  const admin = createAdminClient();
  const result = await broadcastQuizActiveAnnouncement(admin, getSiteUrl().origin);

  console.log(
    `[notify-quiz-active] in_app=${result.recipients} duplicadas=${result.skippedDuplicate} push=${result.pushSent} push_sin_suscripcion=${result.pushSkipped} push_fallidas=${result.pushFailed}`,
  );
}

main().catch((error) => {
  console.error("[notify-quiz-active]", error instanceof Error ? error.message : error);
  process.exit(1);
});
