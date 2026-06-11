const MADRID_TZ = "Europe/Madrid";

/** Primer dia con puntuacion oficial del quiz diario (fecha civil Madrid). */
export const QUIZ_COMPETITIVE_START_DATE = "2026-06-11";

export function isQuizCompetitiveDay(quizDate: string): boolean {
  return quizDate >= QUIZ_COMPETITIVE_START_DATE;
}

/** Fecha civil YYYY-MM-DD en Europe/Madrid (sin parsear ISO date-only nativo). */
export function todayQuizDate(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: MADRID_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export type MadridLocalParts = {
  date: string;
  hour: number;
  minute: number;
  second: number;
};

export function madridLocalParts(now = new Date()): MadridLocalParts {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: MADRID_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: false,
  }).formatToParts(now);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number.parseInt(parts.find((p) => p.type === type)?.value ?? "0", 10);

  const year = get("year");
  const month = String(get("month")).padStart(2, "0");
  const day = String(get("day")).padStart(2, "0");

  return {
    date: `${year}-${month}-${day}`,
    hour: get("hour"),
    minute: get("minute"),
    second: get("second"),
  };
}

function madridWallClockToUtc(
  quizDate: string,
  hour: number,
  minute: number,
  second: number
): Date {
  const [year, month, day] = quizDate.split("-").map(Number);
  const targetSeconds = hour * 3600 + minute * 60 + second;

  const formatDateKey = (instant: Date) =>
    new Intl.DateTimeFormat("en-CA", {
      timeZone: MADRID_TZ,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(instant);

  const formatSeconds = (instant: Date) => {
    const timeParts = new Intl.DateTimeFormat("en-GB", {
      timeZone: MADRID_TZ,
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      hour12: false,
    }).formatToParts(instant);

    const get = (type: Intl.DateTimeFormatPartTypes) =>
      Number.parseInt(timeParts.find((p) => p.type === type)?.value ?? "0", 10);

    return get("hour") * 3600 + get("minute") * 60 + get("second");
  };

  let lo = Date.UTC(year, month - 1, day - 1);
  let hi = Date.UTC(year, month - 1, day + 2);

  while (lo + 1000 < hi) {
    const mid = Math.floor((lo + hi) / 2);
    const instant = new Date(mid);
    const dateKey = formatDateKey(instant);
    const seconds = formatSeconds(instant);

    if (dateKey < quizDate || (dateKey === quizDate && seconds < targetSeconds)) {
      lo = mid;
    } else {
      hi = mid;
    }
  }

  return new Date(hi);
}

/** Inicio del dia civil del quiz (00:00:00 Europe/Madrid) en UTC ISO. */
export function quizDayOpensAt(quizDate: string): string {
  return madridWallClockToUtc(quizDate, 0, 0, 0).toISOString();
}

/** Fin del dia civil del quiz (23:59:59 Europe/Madrid) en UTC ISO. */
export function quizDayClosesAt(quizDate: string): string {
  return madridWallClockToUtc(quizDate, 23, 59, 59).toISOString();
}

export function quizDayWindow(quizDate: string): { opensAt: string; closesAt: string } {
  return {
    opensAt: quizDayOpensAt(quizDate),
    closesAt: quizDayClosesAt(quizDate),
  };
}

export type QuizWindowLike = {
  quiz_date: string | null;
  opens_at: string | null;
  closes_at: string | null;
};

export function resolveQuizWindow(quiz: QuizWindowLike): {
  opensAt: string | null;
  closesAt: string | null;
} {
  return {
    opensAt: quiz.opens_at ?? (quiz.quiz_date ? quizDayOpensAt(quiz.quiz_date) : null),
    closesAt: quiz.closes_at ?? (quiz.quiz_date ? quizDayClosesAt(quiz.quiz_date) : null),
  };
}

export function isQuizWindowOpen(quiz: QuizWindowLike, now = new Date()): boolean {
  const { opensAt, closesAt } = resolveQuizWindow(quiz);
  const instant = now.getTime();

  if (opensAt && instant < new Date(opensAt).getTime()) {
    return false;
  }
  if (closesAt && instant > new Date(closesAt).getTime()) {
    return false;
  }

  return Boolean(opensAt || closesAt || quiz.quiz_date);
}
