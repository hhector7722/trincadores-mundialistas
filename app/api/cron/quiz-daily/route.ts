import { NextResponse } from "next/server";
import { closeQuizDay } from "@/lib/quiz/close-day";
import {
  assertCronAuthorized,
  formatMadridClock,
  isQuizCloseWindow,
  isQuizOpenWindow,
  quizDateForCron,
} from "@/lib/quiz/cron";
import { publishQuizDay } from "@/lib/quiz/publish-day";
import { createAdminClient } from "@/lib/scripts/supabase-admin";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request: Request) {
  if (!assertCronAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const force = url.searchParams.get("force");
  const forceOpen = force === "1" || force === "open";
  const forceClose = force === "close";

  const shouldOpen = forceOpen || (!forceClose && isQuizOpenWindow());
  const shouldClose = forceClose || (!forceOpen && isQuizCloseWindow());

  if (!shouldOpen && !shouldClose) {
    return NextResponse.json({
      skipped: true,
      reason: "Fuera de ventana (00:00 abrir, 23:59 cerrar Europe/Madrid)",
      madridClock: formatMadridClock(),
    });
  }

  const quizDate = quizDateForCron();

  try {
    const admin = createAdminClient();

    if (shouldClose) {
      const result = await closeQuizDay({ admin, quizDate });

      return NextResponse.json({
        ok: true,
        action: "close",
        quizDate: result.quizDate,
        quizId: result.quizId,
        expiredAttempts: result.expiredAttempts,
        skipped: result.skipped,
      });
    }

    const result = await publishQuizDay({
      admin,
      quizDate,
      allowReseed: false,
    });

    return NextResponse.json({
      ok: true,
      action: "open",
      quizDate: result.quizDate,
      quizId: result.quizId,
      scoringMode: result.scoringMode,
      skipped: result.skipped,
      factIds: result.factIds,
      labDailyPack: result.labDailyPack,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    console.error("[cron/quiz-daily]", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
