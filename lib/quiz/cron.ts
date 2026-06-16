import { madridLocalParts, todayQuizDate } from "@/lib/quiz/date";

const MADRID_TZ = "Europe/Madrid";

export type QuizCronAction = "open" | "close";

export function madridHour(now = new Date()): number {
  return madridLocalParts(now).hour;
}

export function madridMinute(now = new Date()): number {
  return madridLocalParts(now).minute;
}

/** Minutos tras 00:00 Madrid en los que el cron puede abrir el día (latencia Vercel). */
export const QUIZ_CRON_OPEN_GRACE_MINUTES = 59;

/** 00:00–00:58 Europe/Madrid — publicar y abrir el quiz del dia en curso. */
export function isQuizOpenWindow(now = new Date()): boolean {
  const { hour, minute } = madridLocalParts(now);
  return hour === 0 && minute < QUIZ_CRON_OPEN_GRACE_MINUTES;
}

/** 23:58–23:59 Europe/Madrid — cerrar el quiz del dia en curso. */
export function isQuizCloseWindow(now = new Date()): boolean {
  const { hour, minute } = madridLocalParts(now);
  return hour === 23 && minute >= 58;
}

/** 20:00 Europe/Madrid — recordatorio a quien no haya completado el quiz del día. */
export function isQuizDailyReminderWindow(now = new Date()): boolean {
  const { hour, minute } = madridLocalParts(now);
  return hour === 20 && minute === 0;
}

export function quizCronAction(now = new Date()): QuizCronAction | null {
  if (isQuizOpenWindow(now)) return "open";
  if (isQuizCloseWindow(now)) return "close";
  return null;
}

export function quizDateForCron(now = new Date()): string {
  return todayQuizDate(now);
}

export function assertCronAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth === `Bearer ${secret}`) return true;
  }
  // Fallback: invocaciones nativas de Vercel Cron (x-vercel-cron: 1).
  if (process.env.VERCEL === "1" && request.headers.get("x-vercel-cron") === "1") {
    return true;
  }
  return false;
}

export function formatMadridClock(now = new Date()): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: MADRID_TZ,
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).format(now);
}
