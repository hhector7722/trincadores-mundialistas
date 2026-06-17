import { isQuizWindowOpen } from "@/lib/quiz/date";
import { QUIZ_PLAY_HREF, QUIZ_PLAY_RESUME_HREF } from "@/lib/quiz/play-routes";
import type { QuizDaySlot, QuizScoringMode } from "@/lib/quiz/types";

export type QuizSlotStatus =
  | "unavailable"
  | "ready"
  | "in_progress"
  | "expired"
  | "completed";

export function getQuizSlotStatus(slot: QuizDaySlot | null): QuizSlotStatus {
  if (!slot) return "unavailable";

  if (!isQuizWindowOpen(slot.quiz)) {
    if (slot.attempt?.status === "submitted") return "completed";
    if (slot.attempt?.status === "in_progress") return "expired";
    return "unavailable";
  }

  if (!slot.attempt) return "ready";

  if (slot.attempt.status === "submitted") return "completed";

  if (slot.attempt.status === "in_progress") {
    if (
      slot.attempt.expires_at &&
      Date.now() >= new Date(slot.attempt.expires_at).getTime()
    ) {
      return "expired";
    }
    return "in_progress";
  }

  if (slot.attempt.status === "expired") return "expired";

  return "ready";
}

export type QuizPlayOptions = {
  resultAttemptId?: string | null;
  practiceReplayAllowed?: boolean;
};

export function getLatestSubmittedAttemptId(slot: QuizDaySlot | null): string | null {
  if (!slot) return null;
  if (slot.countingSubmittedAttemptId) return slot.countingSubmittedAttemptId;
  if (!slot.attempt || slot.attempt.status !== "submitted") return null;
  if (slot.attempt.counts_for_score === false) return null;
  return slot.attempt.id;
}

export function canOpenQuizPlay(
  slot: QuizDaySlot | null,
  scoringMode?: QuizScoringMode,
  options?: Pick<QuizPlayOptions, "practiceReplayAllowed">
): boolean {
  if (!slot) return false;
  const mode = scoringMode ?? slot.quiz.scoring_mode;
  const status = getQuizSlotStatus(slot);

  if (status === "completed") {
    if (options?.practiceReplayAllowed) return true;
    return mode === "training";
  }

  return status === "ready" || status === "in_progress" || status === "expired";
}

export function canReplayQuiz(
  slot: QuizDaySlot | null,
  options?: Pick<QuizPlayOptions, "practiceReplayAllowed">
): boolean {
  if (!slot) return false;
  if (getQuizSlotStatus(slot) !== "completed") return false;
  return canOpenQuizPlay(slot, undefined, options);
}

export type QuizPlayCta = {
  label: string;
  href: string;
  entersPlay: boolean;
};

export function getQuizPlayCta(
  slot: QuizDaySlot | null,
  options?: QuizPlayOptions
): QuizPlayCta | null {
  if (!slot) return null;

  const status = getQuizSlotStatus(slot);
  const canPlay = canOpenQuizPlay(slot, undefined, options);

  if (canPlay) {
    if (status === "in_progress") {
      return {
        label: "Continuar",
        href: QUIZ_PLAY_RESUME_HREF,
        entersPlay: true,
      };
    }
    if (status === "completed") {
      return {
        label: options?.practiceReplayAllowed ? "Probar de nuevo" : "Jugar de nuevo",
        href: QUIZ_PLAY_HREF,
        entersPlay: true,
      };
    }
    if (status === "expired") {
      return {
        label: "Nuevo intento",
        href: QUIZ_PLAY_HREF,
        entersPlay: true,
      };
    }
    return { label: "Jugar", href: QUIZ_PLAY_HREF, entersPlay: true };
  }

  if (status === "completed") {
    const attemptId = options?.resultAttemptId?.trim();
    if (attemptId) {
      return {
        label: "Jugar",
        href: `/quiz/result?attempt=${attemptId}`,
        entersPlay: false,
      };
    }
    return { label: "Ya jugado", href: "/quiz", entersPlay: false };
  }

  return { label: "Ir al quiz", href: "/quiz", entersPlay: false };
}

/** Modal "ya jugado hoy" — competitivo completado sin rejugada. */
export function shouldShowQuizAlreadyPlayedModal(
  slot: QuizDaySlot | null,
  options?: Pick<QuizPlayOptions, "practiceReplayAllowed">
): boolean {
  if (!slot) return false;
  return (
    getQuizSlotStatus(slot) === "completed" &&
    !canOpenQuizPlay(slot, undefined, options)
  );
}

export function formatQuizSlotStatusLabel(status: QuizSlotStatus): string {
  switch (status) {
    case "unavailable":
      return "No disponible";
    case "ready":
      return "Pendiente";
    case "in_progress":
      return "En curso";
    case "expired":
      return "Sesion expirada";
    case "completed":
      return "Completado";
  }
}
