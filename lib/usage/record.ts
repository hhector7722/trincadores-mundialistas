import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export type AppUsageEventType = "login" | "session" | "page_view";

export async function recordAppUsageEventWithClient(
  supabase: SupabaseClient,
  profileId: string,
  eventType: AppUsageEventType,
  path?: string | null
): Promise<void> {
  const { error } = await supabase.from("app_usage_events").insert({
    profile_id: profileId,
    event_type: eventType,
    path: path ?? null,
  });

  if (error) {
    console.error("[usage] record failed:", error.message);
  }
}

export async function recordAppUsageEvent(
  profileId: string,
  eventType: AppUsageEventType,
  path?: string | null
): Promise<void> {
  const supabase = await createClient();
  await recordAppUsageEventWithClient(supabase, profileId, eventType, path);
}
