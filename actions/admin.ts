"use server";

import { revalidatePath } from "next/cache";
import { isPoolAdmin } from "@/lib/pool/admin";
import { assertMatchInPool } from "@/lib/predictions/queries";
import { validatePredictionGoals } from "@/lib/predictions/validation";
import { createClient } from "@/lib/supabase/server";

export type AdminActionResult = { ok: true } | { ok: false; error: string };

export async function submitMatchResult(
  poolId: string,
  matchId: string,
  homeGoals: number,
  awayGoals: number
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
    return { ok: false, error: "Sesion no valida." };
  }

  const admin = await isPoolAdmin(poolId, user.id);
  if (!admin) {
    return { ok: false, error: "No tienes permisos de administrador en esta porra." };
  }

  const inPool = await assertMatchInPool(poolId, matchId);
  if (!inPool) {
    return { ok: false, error: "Partido no valido para esta porra." };
  }

  const { error: resultError } = await supabase.from("match_results").upsert(
    {
      match_id: matchId,
      home_goals: validated.home,
      away_goals: validated.away,
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

  const { error: recalcError } = await supabase.rpc("recalculate_match_scores", {
    p_match_id: matchId,
  });

  if (recalcError) {
    return {
      ok: false,
      error: recalcError.message || "Resultado guardado pero fallo el recalculo de puntos.",
    };
  }

  const { error: rebuildError } = await supabase.rpc("rebuild_pool_member_scores", {
    p_pool_id: poolId,
  });

  if (rebuildError) {
    return {
      ok: false,
      error: rebuildError.message || "Puntos del partido ok, pero fallo la actualizacion del ranking.",
    };
  }

  revalidatePath("/admin");
  revalidatePath("/predictions");
  revalidatePath(`/predictions/${matchId}`);
  revalidatePath("/");
  return { ok: true };
}