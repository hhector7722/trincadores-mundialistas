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

export type QuizPlayAccessOptions = {
  isOwner?: boolean;
};

export function getLatestSubmittedAttemptId(slot: QuizDaySlot | null): string | null {
  if (!slot?.attempt || slot.attempt.status !== "submitted") return null;
  return slot.attempt.id;
}

export function canOpenQuizPlay(
  slot: QuizDaySlot | null,
  scoringMode?: QuizScoringMode,
  options?: QuizPlayAccessOptions
): boolean {
  if (!slot) return false;
  const mode = scoringMode ?? slot.quiz.scoring_mode;
  const status = getQuizSlotStatus(slot);
  const isOwner = options?.isOwner === true;

  if (status === "completed") {
    if (mode === "training") return true;
    if (isOwner) return true;
    return false;
  }

  return status === "ready" || status === "in_progress" || status === "expired";
}

export function canReplayQuiz(
  slot: QuizDaySlot | null,
  options?: QuizPlayAccessOptions
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
  options?: QuizPlayAccessOptions & { resultAttemptId?: string | null }
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
        label: "Jugar de nuevo",
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
        label: "Ver resultado",
        href: `/quiz/result?attempt=${attemptId}`,
        entersPlay: false,
      };
    }
    return { label: "Ya jugado", href: "/quiz", entersPlay: false };
  }

  return { label: "Ir al quiz", href: "/quiz", entersPlay: false };
}

/** Modal "ya jugado hoy" — competitivo completado sin rejugada (p. ej. no owner). */
export function shouldShowQuizAlreadyPlayedModal(
  slot: QuizDaySlot | null,
  options?: QuizPlayAccessOptions
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
