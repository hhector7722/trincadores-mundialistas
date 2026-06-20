import { normalizeAlias } from "@/lib/text/normalize-alias";

/** Aviso activo tras regenerar el quiz del día por pregunta repetida/inválida. */
export const ACTIVE_QUIZ_RESEED_ANNOUNCEMENT = {
  quizDate: "2026-06-20",
  announcementId: "quiz-reseed-2026-06-20",
  /** Si tiene elementos, solo esos aliases ven el modal; vacío = todos los usuarios. */
  previewUsernames: ["hector", "gabri", "dani"] as const,
} as const;

export function isActiveQuizReseedAnnouncement(quizDate: string): boolean {
  return quizDate === ACTIVE_QUIZ_RESEED_ANNOUNCEMENT.quizDate;
}

export function shouldShowQuizReseedAnnouncement(
  username: string | null | undefined,
  quizDate: string
): boolean {
  if (!isActiveQuizReseedAnnouncement(quizDate)) return false;

  const previewUsernames = ACTIVE_QUIZ_RESEED_ANNOUNCEMENT.previewUsernames;
  if (previewUsernames.length > 0) {
    const alias = normalizeAlias(username ?? "");
    return previewUsernames.some((name) => normalizeAlias(name) === alias);
  }

  return true;
}
