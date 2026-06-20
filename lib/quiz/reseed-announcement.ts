import { normalizeAlias } from "@/lib/text/normalize-alias";

/** Aviso activo tras regenerar el quiz del día por pregunta repetida/inválida. */
export const ACTIVE_QUIZ_RESEED_ANNOUNCEMENT = {
  quizDate: "2026-06-20",
  announcementId: "quiz-reseed-2026-06-20",
  /** true = solo hector ve el modal (preview); false = todos los usuarios. */
  hectorPreviewOnly: true,
} as const;

export function isActiveQuizReseedAnnouncement(quizDate: string): boolean {
  return quizDate === ACTIVE_QUIZ_RESEED_ANNOUNCEMENT.quizDate;
}

export function shouldShowQuizReseedAnnouncement(
  username: string | null | undefined,
  quizDate: string
): boolean {
  if (!isActiveQuizReseedAnnouncement(quizDate)) return false;

  if (ACTIVE_QUIZ_RESEED_ANNOUNCEMENT.hectorPreviewOnly) {
    return normalizeAlias(username ?? "") === "hector";
  }

  return true;
}
