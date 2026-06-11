import { syncLiveMatches } from "@/lib/live/sync-live-matches";
import { createAdminClient } from "@/lib/scripts/supabase-admin";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET?.trim();

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const admin = createAdminClient();
    const result = await syncLiveMatches(admin);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "live-matches cron failed";
    console.error("[cron/live-matches]", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
