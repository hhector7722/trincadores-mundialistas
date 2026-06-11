"use server";

import { revalidatePath } from "next/cache";
import { assertPoolMembership } from "@/lib/pool/active-pool";
import {
  assertMatchInPool,
  fetchMatchEditableFromDb,
  getMatchPredictionsBoard,
  type MatchPredictionsBoard,
} from "@/lib/predictions/queries";
import { validatePredictionGoals } from "@/lib/predictions/validation";
import { createClient } from "@/lib/supabase/server";

export type PredictionActionResult =
  | { ok: true; home: number; away: number; updatedAt: string }
  | { ok: false; error: string };

export type MatchPredictionsBoardActionResult =
  | { ok: true; board: MatchPredictionsBoard }
  | { ok: false; error: string };

function mapPredictionDbError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("permission") || lower.includes("policy") || lower.includes("42501")) {
    return "Prediccion cerrada. Ya no puedes editar este partido.";
  }
  if (lower.includes("duplicate") || lower.includes("unique")) {
    return "Ya existe una prediccion para este partido. Recarga e intentalo de nuevo.";
  }
  return "No se pudo guardar la prediccion. Comprueba la conexion e intentalo otra vez.";
}

export async function fetchMatchPredictionsBoardAction(
  poolId: string,
  matchId: string
): Promise<MatchPredictionsBoardActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Sesion no valida. Vuelve a iniciar sesion." };
  }

  const member = await assertPoolMembership(user.id, poolId);
  if (!member) {
    return { ok: false, error: "No perteneces a esta porra." };
  }

  const inPool = await assertMatchInPool(poolId, matchId);
  if (!inPool) {
    return { ok: false, error: "Partido no encontrado en esta porra." };
  }

  try {
    const board = await getMatchPredictionsBoard(poolId, matchId, user.id);
    if (!board) {
      return {
        ok: false,
        error: "Los pronosticos de rivales aun no estan visibles para este partido.",
      };
    }
    return { ok: true, board };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return {
      ok: false,
      error: `No se pudieron cargar los pronosticos. ${message}`,
    };
  }
}

export async function savePrediction(
  poolId: string,
  matchId: string,
  homeGoals: number,
  awayGoals: number
): Promise<PredictionActionResult> {
  const validated = validatePredictionGoals(homeGoals, awayGoals);
  if (!validated.ok) {
    return validated;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Sesion no valida. Vuelve a iniciar sesion." };
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
    return { ok: false, error: "Prediccion cerrada. El plazo termino 5 minutos antes del pitido." };
  }

  const { data: existing, error: readError } = await supabase
    .from("predictions")
    .select("id")
    .eq("pool_id", poolId)
    .eq("match_id", matchId)
    .eq("profile_id", user.id)
    .maybeSingle();

  if (readError) {
    return { ok: false, error: mapPredictionDbError(readError.message) };
  }

  if (existing?.id) {
    const { error: updateError } = await supabase
      .from("predictions")
      .update({
        home_goals: validated.home,
        away_goals: validated.away,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .eq("profile_id", user.id);

    if (updateError) {
      return { ok: false, error: mapPredictionDbError(updateError.message) };
    }
  } else {
    const { error: insertError } = await supabase.from("predictions").insert({
      pool_id: poolId,
      match_id: matchId,
      profile_id: user.id,
      home_goals: validated.home,
      away_goals: validated.away,
    });

    if (insertError) {
      if (insertError.code === "23505") {
        const { error: retryError } = await supabase
          .from("predictions")
          .update({
            home_goals: validated.home,
            away_goals: validated.away,
            updated_at: new Date().toISOString(),
          })
          .eq("pool_id", poolId)
          .eq("match_id", matchId)
          .eq("profile_id", user.id);

        if (retryError) {
          return { ok: false, error: mapPredictionDbError(retryError.message) };
        }
      } else {
        return { ok: false, error: mapPredictionDbError(insertError.message) };
      }
    }
  }

  const { data: saved, error: savedError } = await supabase
    .from("predictions")
    .select("home_goals, away_goals, updated_at")
    .eq("pool_id", poolId)
    .eq("match_id", matchId)
    .eq("profile_id", user.id)
    .single();

  if (savedError || !saved) {
    return { ok: false, error: "Guardado pero no se pudo leer la prediccion. Recarga la pagina." };
  }

  revalidatePath("/predictions");
  revalidatePath(`/predictions/${matchId}`);
  revalidatePath("/");
  return {
    ok: true,
    home: saved.home_goals,
    away: saved.away_goals,
    updatedAt: saved.updated_at,
  };
}