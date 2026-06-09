import { NextResponse } from "next/server";
import {
  assertCronAuthorized,
  isQuizCronWindow,
  quizDateForCron,
} from "@/lib/quiz/cron";
import { publishQuizDay } from "@/lib/quiz/publish-day";
import { createAdminClient } from "@/lib/scripts/supabase-admin";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  if (!assertCronAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const force = new URL(request.url).searchParams.get("force") === "1";

  if (!force && !isQuizCronWindow()) {
    return NextResponse.json({
      skipped: true,
      reason: "Fuera de ventana (5:00 Europe/Madrid)",
      madridHour: new Intl.DateTimeFormat("en-GB", {
        timeZone: "Europe/Madrid",
        hour: "numeric",
        minute: "numeric",
        hour12: false,
      }).format(new Date()),
    });
  }

  const quizDate = quizDateForCron();

  try {
    const admin = createAdminClient();
    const result = await publishQuizDay({
      admin,
      quizDate,
      allowReseed: false,
    });

    return NextResponse.json({
      ok: true,
      quizDate: result.quizDate,
      quizId: result.quizId,
      scoringMode: result.scoringMode,
      skipped: result.skipped,
      factIds: result.factIds,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    console.error("[cron/quiz-daily]", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
