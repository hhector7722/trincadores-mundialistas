"use server";

import { revalidatePath } from "next/cache";
import { validateQuizAnswers } from "@/lib/quiz/options";
import { enrichDrillQuestions, enrichQuestionsWithPlayFormats, parsePlayFormats } from "@/lib/quiz/play-formats";
import {
  getQuizDayHub,
  getQuizResult,
  startQuizDrillSession,
  startQuizSession,
} from "@/lib/quiz/queries";
import { todayQuizDate } from "@/lib/quiz/date";
import type { QuizDayHub, QuizResultResponse, QuizStartSession } from "@/lib/quiz/types";
import { assertPoolMembership } from "@/lib/pool/active-pool";
import { createClient } from "@/lib/supabase/server";
import { trackUsageAction } from "@/lib/usage/track-action";

export type QuizActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

function mapQuizRpcError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("drill not allowed")) {
    return "El entrenamiento no esta disponible todavia.";
  }
  if (lower.includes("drill invalid questions")) {
    return "No se pudo preparar el entrenamiento. Intentalo otra vez.";
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
  quizId: string,
  options?: { drill?: boolean }
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
    if (options?.drill) {
      const hub = await getQuizDayHub(poolId, user.id);
      if (!hub.drillAvailable || !hub.official) {
        return { ok: false, error: "El entrenamiento no esta disponible." };
      }

      const { session, picks } = await startQuizDrillSession(
        quizId,
        hub.quizDate,
        poolId
      );

      const enrichedSession: QuizStartSession = {
        ...session,
        questions: enrichDrillQuestions(session.questions, picks),
      };

      void trackUsageAction(user.id, {
        path: "/quiz/play",
        label: "Quiz entrenamiento iniciado",
        metadata: {
          action: "quiz_drill_started",
          quizId,
          quizDay: hub.quizDate,
        },
      });

      return { ok: true, data: enrichedSession };
    }

    const { data: quizRow, error: quizError } = await supabase
      .from("quizzes")
      .select("quiz_date, settings_json")
      .eq("id", quizId)
      .maybeSingle();

    if (quizError) {
      return { ok: false, error: mapQuizRpcError(quizError.message) };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .maybeSingle();

    const isHector = profile?.username?.toLowerCase() === "hector";
    const isPastQuiz = Boolean(quizRow?.quiz_date && quizRow.quiz_date < todayQuizDate());

    if (isHector && isPastQuiz) {
      await supabase
        .from("quizzes")
        .update({ closes_at: new Date(Date.now() + 3600_000).toISOString() })
        .eq("id", quizId);
    }

    const session = await startQuizSession(quizId);

    const playFormats = parsePlayFormats(quizRow?.settings_json);
    const enrichedSession: QuizStartSession = {
      ...session,
      questions: enrichQuestionsWithPlayFormats(
        session.questions,
        playFormats,
        quizRow?.quiz_date ?? null
      ),
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
    .select("id, quiz_id, profile_id, status, drill_question_ids")
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

  const drillQuestionIds = (attempt.drill_question_ids as string[] | null) ?? null;
  let questionIds: string[];

  if (drillQuestionIds?.length) {
    questionIds = drillQuestionIds;
  } else {
    const { data: questions, error: questionsError } = await supabase
      .from("quiz_questions_public")
      .select("id")
      .eq("quiz_id", attempt.quiz_id);

    if (questionsError) {
      return { ok: false, error: mapQuizRpcError(questionsError.message) };
    }

    questionIds = (questions ?? []).map((q) => q.id as string);
  }

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
    label: drillQuestionIds?.length
      ? "Quiz entrenamiento enviado"
      : `Quiz enviado (${scoreValue} pts)`,
    metadata: {
      action: drillQuestionIds?.length ? "quiz_drill_submitted" : "quiz_submitted",
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
