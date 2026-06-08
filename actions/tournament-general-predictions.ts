"use server";

import { revalidatePath } from "next/cache";
import { assertPoolMembership } from "@/lib/pool/active-pool";
import { createClient } from "@/lib/supabase/server";

export type TournamentGeneralActionResult = { ok: true } | { ok: false; error: string };

function mapDbError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("permission") || lower.includes("policy") || lower.includes("42501")) {
    return "Pronósticos generales cerrados. Ya empezó el Mundial.";
  }
  return "No se pudo guardar. Comprueba la conexión e inténtalo otra vez.";
}

async function assertEditable(poolId: string, profileId: string): Promise<TournamentGeneralActionResult | null> {
  const member = await assertPoolMembership(profileId, poolId);
  if (!member) {
    return { ok: false, error: "No perteneces a esta porra." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("tournament_general_predictions_edit_allowed", {
    p_pool_id: poolId,
  });

  if (error || data !== true) {
    return { ok: false, error: "Pronósticos generales cerrados. Ya empezó el Mundial." };
  }

  return null;
}

async function upsertRow(
  poolId: string,
  profileId: string,
  patch: Record<string, string | null>
): Promise<TournamentGeneralActionResult> {
  const blocked = await assertEditable(poolId, profileId);
  if (blocked) return blocked;

  const supabase = await createClient();
  const now = new Date().toISOString();

  const { data: existing } = await supabase
    .from("tournament_general_predictions")
    .select("pool_id")
    .eq("pool_id", poolId)
    .eq("profile_id", profileId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("tournament_general_predictions")
      .update({ ...patch, updated_at: now })
      .eq("pool_id", poolId)
      .eq("profile_id", profileId);

    if (error) return { ok: false, error: mapDbError(error.message) };
  } else {
    const { error } = await supabase.from("tournament_general_predictions").insert({
      pool_id: poolId,
      profile_id: profileId,
      ...patch,
      updated_at: now,
    });

    if (error) return { ok: false, error: mapDbError(error.message) };
  }

  revalidatePath("/");
  return { ok: true };
}

export async function saveTournamentChampion(
  poolId: string,
  teamName: string
): Promise<TournamentGeneralActionResult> {
  const trimmed = teamName.trim();
  if (!trimmed) return { ok: false, error: "Selecciona una selección válida." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sesión no válida." };

  return upsertRow(poolId, user.id, { champion_team: trimmed });
}

export async function saveTournamentFinalists(
  poolId: string,
  teamA: string,
  teamB: string
): Promise<TournamentGeneralActionResult> {
  const a = teamA.trim();
  const b = teamB.trim();
  if (!a || !b) return { ok: false, error: "Selecciona dos selecciones válidas." };
  if (a === b) return { ok: false, error: "Los dos finalistas deben ser distintos." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sesión no válida." };

  return upsertRow(poolId, user.id, {
    finalist_team_a: a,
    finalist_team_b: b,
  });
}

export async function saveTournamentTopScorer(
  poolId: string,
  playerName: string,
  teamName: string
): Promise<TournamentGeneralActionResult> {
  const player = playerName.trim();
  const team = teamName.trim();
  if (!player || !team) return { ok: false, error: "Selecciona un jugador válido." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sesión no válida." };

  return upsertRow(poolId, user.id, {
    top_scorer_player_name: player,
    top_scorer_team_name: team,
  });
}

export async function saveTournamentMvp(
  poolId: string,
  playerName: string,
  teamName: string
): Promise<TournamentGeneralActionResult> {
  const player = playerName.trim();
  const team = teamName.trim();
  if (!player || !team) return { ok: false, error: "Selecciona un jugador válido." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sesión no válida." };

  return upsertRow(poolId, user.id, {
    tournament_mvp_player_name: player,
    tournament_mvp_team_name: team,
  });
}

export async function saveTournamentGoldenGlove(
  poolId: string,
  playerName: string,
  teamName: string
): Promise<TournamentGeneralActionResult> {
  const player = playerName.trim();
  const team = teamName.trim();
  if (!player || !team) return { ok: false, error: "Selecciona un portero válido." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sesión no válida." };

  return upsertRow(poolId, user.id, {
    golden_glove_player_name: player,
    golden_glove_team_name: team,
  });
}
