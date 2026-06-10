"use server";

import { revalidatePath } from "next/cache";
import { assertPoolMembership } from "@/lib/pool/active-pool";
import {
  assertMatchInPool,
  fetchMatchEditableFromDb,
} from "@/lib/predictions/queries";
import { getMvpPredictionForMatch } from "@/lib/predictions/mvp-queries";
import { createClient } from "@/lib/supabase/server";

export type MvpPredictionActionResult =
  | { ok: true; playerName: string; teamName: string; updatedAt: string }
  | { ok: false; error: string };

function mapMvpDbError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("permission") || lower.includes("policy") || lower.includes("42501")) {
    return "Predicción cerrada. Ya no puedes editar el MVP de este partido.";
  }
  return "No se pudo guardar el MVP. Comprueba la conexión e inténtalo otra vez.";
}

export async function fetchSavedMvpPrediction(poolId: string, matchId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const member = await assertPoolMembership(user.id, poolId);
  if (!member) return null;

  return getMvpPredictionForMatch(poolId, user.id, matchId);
}

/** Nombre guardado en `match_mvp_predictions.player_name` para el usuario actual. */
export async function fetchSavedMvpPlayerName(
  poolId: string,
  matchId: string
): Promise<string | null> {
  const saved = await fetchSavedMvpPrediction(poolId, matchId);
  const name = saved?.player_name?.trim();
  return name || null;
}

export async function saveMvpPrediction(
  poolId: string,
  matchId: string,
  playerName: string,
  teamName: string
): Promise<MvpPredictionActionResult> {
  const trimmedPlayer = playerName.trim();
  const trimmedTeam = teamName.trim();
  if (!trimmedPlayer || !trimmedTeam) {
    return { ok: false, error: "Selecciona un jugador válido." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Sesión no válida. Vuelve a iniciar sesión." };
  }

  const member = await assertPoolMembership(user.id, poolId);
  if (!member) {
    return { ok: false, error: "No perteneces a esta porra." };
  }

  const inPool = await assertMatchInPool(poolId, matchId);
  if (!inPool) {
    return { ok: false, error: "Partido no encontrado en esta porra." };
  }

  const editable = await fetchMatchEditableFromDb(matchId);
  if (!editable) {
    return {
      ok: false,
      error: "Predicción cerrada. El plazo terminó 5 minutos antes del pitido.",
    };
  }

  const { data: existing, error: readError } = await supabase
    .from("match_mvp_predictions")
    .select("id")
    .eq("pool_id", poolId)
    .eq("match_id", matchId)
    .eq("profile_id", user.id)
    .maybeSingle();

  if (readError) {
    return { ok: false, error: mapMvpDbError(readError.message) };
  }

  const payload = {
    player_name: trimmedPlayer,
    team_name: trimmedTeam,
    updated_at: new Date().toISOString(),
  };

  if (existing?.id) {
    const { error: updateError } = await supabase
      .from("match_mvp_predictions")
      .update(payload)
      .eq("id", existing.id)
      .eq("profile_id", user.id);

    if (updateError) {
      return { ok: false, error: mapMvpDbError(updateError.message) };
    }
  } else {
    const { error: insertError } = await supabase.from("match_mvp_predictions").insert({
      pool_id: poolId,
      match_id: matchId,
      profile_id: user.id,
      ...payload,
    });

    if (insertError) {
      return { ok: false, error: mapMvpDbError(insertError.message) };
    }
  }

  const { data: saved, error: savedError } = await supabase
    .from("match_mvp_predictions")
    .select("player_name, team_name, updated_at")
    .eq("pool_id", poolId)
    .eq("match_id", matchId)
    .eq("profile_id", user.id)
    .single();

  if (savedError || !saved) {
    return { ok: false, error: "Guardado pero no se pudo leer el MVP. Recarga la página." };
  }

  revalidatePath("/predictions");
  revalidatePath(`/predictions/${matchId}`);
  revalidatePath("/");
  return {
    ok: true,
    playerName: saved.player_name,
    teamName: saved.team_name,
    updatedAt: saved.updated_at,
  };
}
