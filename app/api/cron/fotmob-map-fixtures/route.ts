import { syncFotmobFixtures } from "@/lib/fotmob/sync-fotmob-fixtures";
import { assertCronAuthorized } from "@/lib/quiz/cron";
import { createAdminClient } from "@/lib/scripts/supabase-admin";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
/** Hasta 35 fechas × 1 fetch FotMob; ventana amplia para primer mapeo masivo. */
export const maxDuration = 120;

export async function GET(request: Request) {
  if (!assertCronAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const admin = createAdminClient();
    const result = await syncFotmobFixtures(admin, { persist: true });

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "fotmob-map-fixtures cron failed";
    console.error("[cron/fotmob-map-fixtures]", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
