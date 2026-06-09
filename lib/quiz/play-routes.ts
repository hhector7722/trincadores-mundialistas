/** Entrada al play con entradilla (vídeo). */
export const QUIZ_PLAY_HREF = "/quiz/play";

/** Reanudar intento en curso sin repetir la entradilla. */
export const QUIZ_PLAY_RESUME_HREF = "/quiz/play?resume=1";

export function isQuizPlayResume(searchParams: { resume?: string }): boolean {
  return searchParams.resume === "1";
}
