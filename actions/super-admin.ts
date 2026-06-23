"use server";

import { revalidatePath } from "next/cache";
import { validatePredictionGoals } from "@/lib/predictions/validation";
import { createClient } from "@/lib/supabase/server";

export type AdminActionResult = { ok: true } | { ok: false; error: string };

export async function forceGlobalMatchResult(
  matchId: string,
  homeGoals: number,
  awayGoals: number,
  mvpPlayerName?: string | null,
  mvpTeamName?: string | null
): Promise<AdminActionResult> {
  const validated = validatePredictionGoals(homeGoals, awayGoals);
  if (!validated.ok) {
    return validated;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Sesión no válida." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .single();

  if (profile?.username?.toLowerCase() !== "hector") {
    return { ok: false, error: "Acceso denegado. Se requiere cuenta de administrador global." };
  }

  const { error: resultError } = await supabase.from("match_results").upsert(
    {
      match_id: matchId,
      home_goals: validated.home,
      away_goals: validated.away,
      mvp_player_name: mvpPlayerName?.trim() || null,
      mvp_team_name: mvpTeamName?.trim() || null,
      recorded_by: user.id,
      recorded_at: new Date().toISOString(),
    },
    { onConflict: "match_id" }
  );

  if (resultError) {
    return { ok: false, error: resultError.message || "No se pudo guardar el resultado." };
  }

  const { error: statusError } = await supabase
    .from("matches")
    .update({ status: "finished" })
    .eq("id", matchId);

  if (statusError) {
    return { ok: false, error: statusError.message || "No se pudo marcar el partido como finalizado." };
  }

  // Recalcular el match para TODOS en la DB
  const { error: recalcError } = await supabase.rpc("recalculate_match_scores", {
    p_match_id: matchId,
  });

  if (recalcError) {
    return {
      ok: false,
      error: recalcError.message || "Resultado guardado pero falló el recalculo de puntos del partido.",
    };
  }

  // Ahora debemos recalcular el pool_member_scores de TODOS los pools.
  const { data: pools, error: poolsError } = await supabase.from("pools").select("id");
  if (poolsError) {
    return { ok: false, error: "Fallo al obtener las porras para actualizar el ranking." };
  }

  for (const pool of pools || []) {
    await supabase.rpc("rebuild_pool_member_scores", {
      p_pool_id: pool.id,
    });
    // Ignoramos errores de una porra individual para intentar actualizar las demás
  }

  revalidatePath("/", "layout");
  return { ok: true };
}
