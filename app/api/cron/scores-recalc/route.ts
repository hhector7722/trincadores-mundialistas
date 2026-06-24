import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/scripts/supabase-admin";
import { syncScoresRecalc } from "@/lib/live/sync-scores-recalc";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // Recalculation can be heavy, allow up to 5 minutes

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET?.trim();

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const admin = createAdminClient();
    const result = await syncScoresRecalc(admin, Date.now());
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "scores-recalc cron failed";
    console.error("[cron/scores-recalc]", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
