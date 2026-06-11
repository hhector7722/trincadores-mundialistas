import { NextResponse } from "next/server";
import { sendQuizDailyReminders } from "@/lib/notifications/quiz-daily-reminder";
import {
  assertCronAuthorized,
  formatMadridClock,
  isQuizDailyReminderWindow,
  quizDateForCron,
} from "@/lib/quiz/cron";
import { createAdminClient } from "@/lib/scripts/supabase-admin";
import { getSiteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  if (!assertCronAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const force = url.searchParams.get("force") === "1";

  if (!force && !isQuizDailyReminderWindow()) {
    return NextResponse.json({
      skipped: true,
      reason: "Fuera de ventana (20:00 Europe/Madrid)",
      madridClock: formatMadridClock(),
    });
  }

  const quizDate = quizDateForCron();

  try {
    const admin = createAdminClient();
    const result = await sendQuizDailyReminders(admin, quizDate, new Date(), getSiteUrl().origin);

    return NextResponse.json({
      ok: true,
      ...result,
      madridClock: formatMadridClock(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    console.error("[cron/quiz-daily-reminder]", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
