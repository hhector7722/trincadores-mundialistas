const MADRID_TZ = "Europe/Madrid";

/** Primer dia con puntuacion oficial del quiz diario (fecha civil Madrid). */
export const QUIZ_COMPETITIVE_START_DATE = "2026-06-11";

/** A partir de esta fecha civil, la pregunta 1 (test clasico) va sin imagen. */
export const QUIZ_CLASSIC_NO_IMAGE_FROM_DATE = "2026-06-18";

export function classicQuizQuestionShowsImage(quizDate: string): boolean {
  return quizDate < QUIZ_CLASSIC_NO_IMAGE_FROM_DATE;
}

/** Fechas civiles Madrid sin publicacion automatica (cron 00:00) ni acceso en app. */
export const QUIZ_PUBLISH_HOLD_DATES = [] as const;

export const QUIZ_COMING_SOON_MESSAGE = "Próximamente";

export function isQuizPublishHeld(quizDate: string): boolean {
  return (QUIZ_PUBLISH_HOLD_DATES as readonly string[]).includes(quizDate);
}

/** Margen tras medianoche para el cron de apertura (00:00 Europe/Madrid). */
export const QUIZ_CRON_OPEN_GRACE_MS = 5 * 60 * 1000;

export function addQuizDays(quizDate: string, delta: number): string {
  const [y, m, d] = quizDate.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + delta);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

/**
 * Ventana efectiva al publicar: si se publica manualmente después de la medianoche
 * del día solicitado, aplaza a la medianoche del día siguiente (solo cron 00:00).
 */
export function resolveQuizPublishWindow(
  quizDate: string,
  now = new Date(),
  /** Solo al reemplazar un quiz ya publicado fuera del cron de medianoche. */
  deferIfPastOpen = true
): { quizDate: string; opensAt: string; closesAt: string } {
  const dayWindow = quizDayWindow(quizDate);
  const opensMs = new Date(dayWindow.opensAt).getTime();

  if (deferIfPastOpen && now.getTime() > opensMs + QUIZ_CRON_OPEN_GRACE_MS) {
    const deferredDate = addQuizDays(quizDate, 1);
    const deferredWindow = quizDayWindow(deferredDate);
    return {
      quizDate: deferredDate,
      opensAt: deferredWindow.opensAt,
      closesAt: deferredWindow.closesAt,
    };
  }

  return {
    quizDate,
    opensAt: dayWindow.opensAt,
    closesAt: dayWindow.closesAt,
  };
}

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

export const GLOBAL_QUIZ_PAUSE = true;

export function isQuizWindowOpen(quiz: QuizWindowLike, now = new Date()): boolean {
  if (GLOBAL_QUIZ_PAUSE) return false;

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
