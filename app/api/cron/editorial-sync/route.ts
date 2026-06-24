import { NextResponse } from "next/server";
import { getSiteUrl } from "@/lib/site-url";
import { syncAllMatchHighlights } from "@/lib/youtube/sync-highlights";
import { createAdminClient } from "@/lib/scripts/supabase-admin";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // Editorial fetches from RSS and YouTube, can take a while

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET?.trim();

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const admin = createAdminClient();
    const result = await syncAllMatchHighlights(admin, getSiteUrl().origin);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "editorial-sync cron failed";
    console.error("[cron/editorial-sync]", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
