"use server";

import { loadMatchLiveSnapshot } from "@/lib/live/queries";
import type { MatchLiveSnapshot } from "@/lib/live/types";
import { createClient } from "@/lib/supabase/server";

export type LiveMatchActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

export async function fetchMatchLiveSnapshotAction(
  matchId: string,
): Promise<LiveMatchActionResult<MatchLiveSnapshot | null>> {
  try {
    const supabase = await createClient();
    const snapshot = await loadMatchLiveSnapshot(supabase, matchId);
    return { ok: true, data: snapshot };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No se pudo cargar el marcador en directo.";
    return { ok: false, error: message };
  }
}
