"use server";

import { assertMatchInPool } from "@/lib/predictions/queries";
import { requireActivePoolContext } from "@/lib/pool/require-context";
import { createClient } from "@/lib/supabase/server";

export type NotificationActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

export async function fetchMatchLineupsModalContextAction(
  matchId: string,
): Promise<
  NotificationActionResult<{ id: string; home_team: string; away_team: string }>
> {
  try {
    const ctx = await requireActivePoolContext();
    const inPool = await assertMatchInPool(ctx.activePoolId, matchId);
    if (!inPool) {
      return { ok: false, error: "Partido no encontrado en tu porra." };
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("matches")
      .select("id, home_team, away_team")
      .eq("id", matchId)
      .maybeSingle();

    if (error || !data) {
      return { ok: false, error: error?.message ?? "No se encontró el partido." };
    }

    return {
      ok: true,
      data: {
        id: data.id,
        home_team: data.home_team,
        away_team: data.away_team,
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo abrir el partido.";
    return { ok: false, error: message };
  }
}
