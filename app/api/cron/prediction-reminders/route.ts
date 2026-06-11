import { NextResponse } from "next/server";
import { syncConfirmedLineupNotifications } from "@/lib/notifications/confirmed-lineup-notifications";
import { sendPredictionReminders } from "@/lib/notifications/prediction-reminders";
import { assertCronAuthorized } from "@/lib/quiz/cron";
import { createAdminClient } from "@/lib/scripts/supabase-admin";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  if (!assertCronAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const admin = createAdminClient();
    const [predictionReminders, confirmedLineups] = await Promise.all([
      sendPredictionReminders(admin),
      syncConfirmedLineupNotifications(admin),
    ]);

    return NextResponse.json({
      ok: true,
      predictionReminders,
      confirmedLineups,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    console.error("[cron/prediction-reminders]", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
