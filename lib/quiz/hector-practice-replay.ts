import { normalizeAlias } from "@/lib/text/normalize-alias";
import type { QuizAttemptRow } from "@/lib/quiz/types";

/** Único día con intento extra de prueba (sin puntuar) para hector. */
export const HECTOR_PRACTICE_REPLAY_DATE = "2026-06-17";

export function isHectorAlias(username: string | null | undefined): boolean {
  return normalizeAlias(username ?? "") === "hector";
}

export function canHectorPracticeReplay(
  username: string | null | undefined,
  quizDate: string,
  attempts: QuizAttemptRow[],
  quizId: string
): boolean {
  if (!isHectorAlias(username)) return false;
  if (quizDate !== HECTOR_PRACTICE_REPLAY_DATE) return false;

  const forQuiz = attempts.filter((a) => a.quiz_id === quizId);
  const hasCountingSubmitted = forQuiz.some(
    (a) => a.status === "submitted" && a.counts_for_score !== false
  );
  return hasCountingSubmitted;
}
