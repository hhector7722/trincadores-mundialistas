import { NextResponse } from "next/server";
import { prewarmUpcomingLineups } from "@/lib/lineup/prewarm-lineups";
import { assertCronAuthorized } from "@/lib/quiz/cron";
import { createAdminClient } from "@/lib/scripts/supabase-admin";

export const dynamic = "force-dynamic";
/** BSD confirmado: cada 5 min en ventana T-90; probables/fallback en horizonte 48 h. */
export const maxDuration = 120;

export async function GET(request: Request) {
  if (!assertCronAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const admin = createAdminClient();
    const result = await prewarmUpcomingLineups(admin, Date.now(), {
      notifyConfirmedLineup: false,
    });

    return NextResponse.json({
      ok: true,
      ...result,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    console.error("[cron/lineup-prewarm]", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
