import { NextResponse } from "next/server";
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
    const result = await sendPredictionReminders(admin);

    return NextResponse.json({
      ok: true,
      ...result,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    console.error("[cron/prediction-reminders]", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
