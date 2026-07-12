"use server";

import { revalidatePath } from "next/cache";
import { generateAccessCode } from "@/lib/auth/access-code";
import { isPoolAdmin, isPoolOwner } from "@/lib/pool/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertMatchInPool } from "@/lib/predictions/queries";
import { validatePredictionGoals } from "@/lib/predictions/validation";
import { syncKnockoutBracket } from "@/lib/predictions/sync-knockout";
import { createClient } from "@/lib/supabase/server";

export type AdminActionResult = { ok: true } | { ok: false; error: string };

export async function submitMatchResult(
  poolId: string,
  matchId: string,
  homeGoals: number,
  awayGoals: number,
  mvpPlayerName?: string | null,
  mvpTeamName?: string | null,
  penaltyHome?: number | null,
  penaltyAway?: number | null,
  advancingTeam?: "home" | "away" | null
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
      penalty_home: penaltyHome ?? null,
      penalty_away: penaltyAway ?? null,
      advancing_team: advancingTeam ?? null,
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
    .update({
      status: "finished",
      scoring_status: "completed",
      scoring_completed_at: new Date().toISOString(),
    })
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

  const { error: quizBonusError } = await supabase.rpc("recalculate_quiz_final_ranking_scores", {
    p_pool_id: poolId,
  });

  if (quizBonusError) {
    return {
      ok: false,
      error:
        quizBonusError.message ||
        "Ranking actualizado, pero fallo el bonus final del quiz.",
    };
  }

  try {
    await syncKnockoutBracket();
  } catch (syncError) {
    console.error("[submitMatchResult] syncKnockoutBracket:", syncError);
  }

  revalidatePath("/admin");
  revalidatePath("/predictions");
  revalidatePath(`/predictions/${matchId}`);
  revalidatePath("/");
  revalidatePath("/ranking");
  revalidatePath("/quiz");
  revalidatePath("/quiz/leaderboard");
  return { ok: true };
}

export async function setMatchLive(
  poolId: string,
  matchId: string
): Promise<AdminActionResult> {
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

  const { error } = await supabase
    .from("matches")
    .update({ status: "live" })
    .eq("id", matchId)
    .in("status", ["pending", "scheduled"]);

  if (error) {
    return { ok: false, error: error.message || "No se pudo marcar el partido como en juego." };
  }

  revalidatePath("/admin");
  revalidatePath("/predictions");
  revalidatePath(`/predictions/${matchId}`);
  revalidatePath("/");
  return { ok: true };
}

export async function checkIsHector(): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase.from("profiles").select("username").eq("id", user.id).single();
  const username = data?.username?.toLowerCase();
  return username === "hector" || username === "hhector7722";
}

export type TournamentOfficialAwardsPayload = {
  championTeam?: string | null;
  finalistTeamA?: string | null;
  finalistTeamB?: string | null;
  topScorerPlayerName?: string | null;
  topScorerTeamName?: string | null;
  tournamentMvpPlayerName?: string | null;
  tournamentMvpTeamName?: string | null;
  goldenGlovePlayerName?: string | null;
  goldenGloveTeamName?: string | null;
};

export async function submitTournamentOfficialAwards(
  poolId: string,
  awards: TournamentOfficialAwardsPayload
): Promise<AdminActionResult> {
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

  const { error } = await supabase.rpc("upsert_tournament_official_awards", {
    p_pool_id: poolId,
    p_champion_team: awards.championTeam ?? null,
    p_finalist_team_a: awards.finalistTeamA ?? null,
    p_finalist_team_b: awards.finalistTeamB ?? null,
    p_top_scorer_player_name: awards.topScorerPlayerName ?? null,
    p_top_scorer_team_name: awards.topScorerTeamName ?? null,
    p_tournament_mvp_player_name: awards.tournamentMvpPlayerName ?? null,
    p_tournament_mvp_team_name: awards.tournamentMvpTeamName ?? null,
    p_golden_glove_player_name: awards.goldenGlovePlayerName ?? null,
    p_golden_glove_team_name: awards.goldenGloveTeamName ?? null,
  });

  if (error) {
    return {
      ok: false,
      error: error.message || "No se pudieron guardar los galardones oficiales.",
    };
  }

  revalidatePath("/admin");
  revalidatePath("/ranking");
  revalidatePath("/");
  return { ok: true };
}

export async function regenerateAccessCode(
  poolId: string,
  targetUsername: string
): Promise<AdminActionResult & { code?: string }> {
  const username = targetUsername.trim().toLowerCase();
  if (!username) {
    return { ok: false, error: "Alias invalido." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Sesion no valida." };
  }

  const owner = await isPoolOwner(poolId, user.id);
  if (!owner) {
    return { ok: false, error: "Solo el owner puede regenerar codigos." };
  }

  const { data: targetProfile, error: profileError } = await supabase
    .from("profiles")
    .select("id, username")
    .eq("username", username)
    .maybeSingle();

  if (profileError || !targetProfile) {
    return { ok: false, error: "Participante no encontrado." };
  }

  const { data: membership, error: memberError } = await supabase
    .from("pool_members")
    .select("profile_id")
    .eq("pool_id", poolId)
    .eq("profile_id", targetProfile.id)
    .maybeSingle();

  if (memberError || !membership) {
    return { ok: false, error: "Ese participante no pertenece a esta porra." };
  }

  const newCode = generateAccessCode();
  const admin = createAdminClient();

  const { error: updateError } = await admin.auth.admin.updateUserById(targetProfile.id, {
    password: newCode,
  });

  if (updateError) {
    return { ok: false, error: "No se pudo actualizar el codigo." };
  }

  await admin.auth.admin.signOut(targetProfile.id, "global");

  const rotatedAt = new Date().toISOString();
  const { error: rotatedError } = await admin
    .from("profiles")
    .update({ access_code_rotated_at: rotatedAt })
    .eq("id", targetProfile.id);

  if (rotatedError) {
    console.error("[regenerateAccessCode] rotated_at failed:", rotatedError.message);
  }

  const { error: auditError } = await admin.from("admin_audit_log").insert({
    pool_id: poolId,
    actor_id: user.id,
    action: "access_code_regenerated",
    details: { target_profile_id: targetProfile.id, target_username: username },
  });

  if (auditError) {
    console.error("[regenerateAccessCode] audit failed:", auditError.message);
  }

  return { ok: true, code: newCode };
}