import type { QuizDaySlot, QuizScoringMode } from "@/lib/quiz/types";

export type QuizSlotStatus =
  | "unavailable"
  | "ready"
  | "in_progress"
  | "expired"
  | "completed";

export function getQuizSlotStatus(slot: QuizDaySlot | null): QuizSlotStatus {
  if (!slot) return "unavailable";
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
  if (slot.quiz.scoring_mode === "training") return true;
  return options?.isOwner === true;
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
