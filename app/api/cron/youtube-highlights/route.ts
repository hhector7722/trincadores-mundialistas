import { NextResponse } from "next/server";
import { assertCronAuthorized } from "@/lib/quiz/cron";
import { createAdminClient } from "@/lib/scripts/supabase-admin";
import { syncYoutubeFifaHighlights } from "@/lib/youtube/sync-highlights";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  if (!assertCronAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const admin = createAdminClient();
    const result = await syncYoutubeFifaHighlights(admin);

    return NextResponse.json({
      ok: true,
      ...result,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    console.error("[cron/youtube-highlights]", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
