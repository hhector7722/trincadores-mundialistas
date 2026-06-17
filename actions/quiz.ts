"use server";

import { revalidatePath } from "next/cache";
import { validateQuizAnswers } from "@/lib/quiz/options";
import {
  enrichQuestionsWithPlayFormats,
  parsePlayFormats,
} from "@/lib/quiz/play-formats";
import {
  getQuizDayHub,
  getQuizResult,
  startQuizPracticeSession,
  startQuizSession,
} from "@/lib/quiz/queries";
import type { QuizDayHub, QuizResultResponse, QuizStartSession } from "@/lib/quiz/types";
import { assertPoolMembership } from "@/lib/pool/active-pool";
import { createClient } from "@/lib/supabase/server";
import { trackUsageAction } from "@/lib/usage/track-action";

export type QuizActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

function mapQuizRpcError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("practice replay already used")) {
    return "Ya usaste el intento de prueba de hoy.";
  }
  if (lower.includes("practice replay not allowed")) {
    return "El intento de prueba no esta disponible.";
  }
  if (lower.includes("quiz already completed")) {
    return "Ya completaste este quiz de hoy.";
  }
  if (lower.includes("quiz attempt expired") || lower.includes("expired")) {
    return "La sesion expiro. Puedes empezar un nuevo intento.";
  }
  if (lower.includes("invalid attempt")) {
    return "Sesion de quiz no valida. Vuelve a empezar.";
  }
  if (lower.includes("not pool member")) {
    return "No perteneces a esta porra.";
  }
  if (lower.includes("not authenticated")) {
    return "Sesion no valida. Vuelve a iniciar sesion.";
  }
  if (lower.includes("quiz not found")) {
    return "Quiz no encontrado.";
  }
  return "No se pudo completar el quiz. Comprueba la conexion e intentalo otra vez.";
}

async function assertQuizInPool(quizId: string, poolId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("quizzes")
    .select("id")
    .eq("id", quizId)
    .eq("pool_id", poolId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return Boolean(data);
}

export async function startQuiz(
  poolId: string,
  quizId: string
): Promise<QuizActionResult<QuizStartSession>> {
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

  const inPool = await assertQuizInPool(quizId, poolId);
  if (!inPool) {
    return { ok: false, error: "Quiz no valido para esta porra." };
  }

  try {
    const hub = await getQuizDayHub(poolId, user.id);
    const attempt = hub.official?.attempt;
    const usePractice =
      hub.official?.quiz.id === quizId &&
      (attempt?.counts_for_score === false ||
        (hub.practiceReplayAllowed && attempt?.status === "submitted"));

    const session = usePractice
      ? await startQuizPracticeSession(quizId)
      : await startQuizSession(quizId);

    const { data: quizRow, error: quizError } = await supabase
      .from("quizzes")
      .select("quiz_date, settings_json")
      .eq("id", quizId)
      .maybeSingle();

    if (quizError) {
      return { ok: false, error: mapQuizRpcError(quizError.message) };
    }

    const playFormats = parsePlayFormats(quizRow?.settings_json);
    const enrichedSession: QuizStartSession = {
      ...session,
      questions: enrichQuestionsWithPlayFormats(session.questions, playFormats),
    };

    void trackUsageAction(user.id, {
      path: "/quiz/play",
      label: "Quiz iniciado",
      metadata: {
        action: "quiz_started",
        quizId,
        quizDay: quizRow?.quiz_date ?? undefined,
      },
    });

    return { ok: true, data: enrichedSession };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error al iniciar el quiz.";
    return { ok: false, error: mapQuizRpcError(msg) };
  }
}

export async function submitQuiz(
  poolId: string,
  attemptId: string,
  answers: Record<string, string>
): Promise<QuizActionResult<QuizResultResponse>> {
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

  const { data: attempt, error: attemptError } = await supabase
    .from("quiz_attempts")
    .select("id, quiz_id, profile_id, status")
    .eq("id", attemptId)
    .eq("profile_id", user.id)
    .maybeSingle();

  if (attemptError) {
    return { ok: false, error: mapQuizRpcError(attemptError.message) };
  }

  if (!attempt || attempt.status !== "in_progress") {
    return { ok: false, error: "Sesion de quiz no valida. Vuelve a empezar." };
  }

  const inPool = await assertQuizInPool(attempt.quiz_id, poolId);
  if (!inPool) {
    return { ok: false, error: "Quiz no valido para esta porra." };
  }

  const { data: questions, error: questionsError } = await supabase
    .from("quiz_questions_public")
    .select("id")
    .eq("quiz_id", attempt.quiz_id);

  if (questionsError) {
    return { ok: false, error: mapQuizRpcError(questionsError.message) };
  }

  const questionIds = (questions ?? []).map((q) => q.id as string);
  const validated = validateQuizAnswers(questionIds, answers);
  if (!validated.ok) {
    return validated;
  }

  const { data: score, error: submitError } = await supabase.rpc("submit_quiz_attempt", {
    p_attempt_id: attemptId,
    p_answers: answers,
  });

  if (submitError) {
    return { ok: false, error: mapQuizRpcError(submitError.message) };
  }

  const result = await getQuizResult(attemptId, user.id);
  if (!result) {
    return {
      ok: false,
      error: "Respuestas enviadas pero no se pudo cargar el resultado. Recarga la pagina.",
    };
  }

  revalidatePath("/quiz");
  revalidatePath("/quiz/play");
  revalidatePath("/quiz/result");
  revalidatePath("/quiz/leaderboard");

  const scoreValue = typeof score === "number" ? score : result.score;

  void trackUsageAction(user.id, {
    path: "/quiz/result",
    label: `Quiz enviado (${scoreValue} pts)`,
    metadata: {
      action: "quiz_submitted",
      quizId: attempt.quiz_id,
      score: scoreValue,
    },
  });

  return {
    ok: true,
    data: {
      ...result,
      score: scoreValue,
    },
  };
}

export async function fetchQuizDayHubAction(
  poolId: string
): Promise<QuizActionResult<QuizDayHub>> {
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
    const hub = await getQuizDayHub(poolId, user.id);
    return { ok: true, data: hub };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "No se pudo cargar el quiz de hoy.";
    return { ok: false, error: msg };
  }
}
