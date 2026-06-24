import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/scripts/supabase-admin";
import { syncBackfill } from "@/lib/live/sync-backfill";

export const dynamic = "force-dynamic";
export const maxDuration = 120; // 2 minutes

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET?.trim();

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const admin = createAdminClient();
    const result = await syncBackfill(admin);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "backfill-incidents cron failed";
    console.error("[cron/backfill-incidents]", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
