"use server";

import { canAccessAiPrediction } from "@/lib/ai-predictions/access";
import { resolvePredictionInsightForMatch } from "@/lib/ai-predictions/generate-for-match";
import { resolvePredictionInsightSource } from "@/lib/ai-predictions/source-config";
import type { PredictionInsight } from "@/lib/ai-predictions/types";
import { createClient } from "@/lib/supabase/server";

export type FetchPredictionInsightResult =
  | { ok: true; insight: PredictionInsight }
  | { ok: false; error: string; unauthorized?: boolean };

async function assertAiPredictionAccess(): Promise<
  { ok: true } | { ok: false; error: string; unauthorized?: boolean }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Sesion no valida.", unauthorized: true };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .maybeSingle();

  if (!canAccessAiPrediction(profile?.username)) {
    return { ok: false, error: "Acceso no autorizado.", unauthorized: true };
  }

  return { ok: true };
}

export async function fetchPredictionInsightAction(
  matchId: string,
): Promise<FetchPredictionInsightResult> {
  const access = await assertAiPredictionAccess();
  if (!access.ok) {
    return access;
  }

  if (!matchId.trim()) {
    return { ok: false, error: "Partido no valido." };
  }

  try {
    const source = resolvePredictionInsightSource();
    const insight = await resolvePredictionInsightForMatch(matchId, { source });
    if (!insight) {
      return {
        ok: false,
        error: "No hay prediccion IA disponible para este partido.",
      };
    }
    return { ok: true, insight };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return {
      ok: false,
      error: `No se pudo cargar la prediccion IA. ${message}`,
    };
  }
}
