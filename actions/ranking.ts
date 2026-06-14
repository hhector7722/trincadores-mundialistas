"use server";

import { assertPoolMembership } from "@/lib/pool/active-pool";
import {
  getPoolRankingEvolution,
  type RankingEvolutionData,
} from "@/lib/ranking/evolution";
import { createClient } from "@/lib/supabase/server";

export type RankingEvolutionActionResult =
  | { ok: true; data: RankingEvolutionData }
  | { ok: false; error: string };

export async function fetchRankingEvolutionAction(
  poolId: string
): Promise<RankingEvolutionActionResult> {
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

  try {
    const data = await getPoolRankingEvolution(poolId);
    return { ok: true, data };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return {
      ok: false,
      error: `No se pudo cargar la evolucion. ${message}`,
    };
  }
}
