/** Entrada al play con entradilla (vídeo) tras confirmar en modal. */
export const QUIZ_PLAY_HREF = "/quiz/play?start=1";

/** Reanudar intento en curso sin repetir la entradilla. */
export const QUIZ_PLAY_RESUME_HREF = "/quiz/play?resume=1&start=1";

/** Entrada al play en modo entrenar (preguntas mezcladas del histórico). */
export const QUIZ_DRILL_PLAY_HREF = "/quiz/play?start=1&drill=1";

/** Reanudar entrenamiento en curso. */
export const QUIZ_DRILL_PLAY_RESUME_HREF = "/quiz/play?resume=1&start=1&drill=1";

export const QUIZ_PLAY_DRILL_QUERY = "drill";

export function isQuizPlayDrill(searchParams: { drill?: string }): boolean {
  return searchParams.drill === "1";
}

export function isQuizPlayResume(searchParams: { resume?: string }): boolean {
  return searchParams.resume === "1";
}

export function isQuizPlayStartAuthorized(searchParams: { start?: string }): boolean {
  return searchParams.start === "1";
}
