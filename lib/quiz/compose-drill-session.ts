import {
  defaultClassicPlayFormats,
  parsePlayFormats,
  type QuizPlayFormatMeta,
  type QuizPlayQuestionFormat,
} from "@/lib/quiz/play-formats";

export type DrillHistoricalQuestion = {
  id: string;
  sort_order: number;
};

export type DrillHistoricalQuiz = {
  id: string;
  quizDate: string;
  settingsJson: unknown;
  questions: DrillHistoricalQuestion[];
};

export type DrillQuestionPick = {
  questionId: string;
  quizId: string;
  quizDate: string;
  displaySortOrder: number;
  format: QuizPlayQuestionFormat;
  revealImageUrl: string | null;
};

export type ComposeDrillSessionArgs = {
  todayQuizId: string;
  todayQuizDate: string;
  historicalQuizzes: DrillHistoricalQuiz[];
  /** Devuelve [0, 1). Por defecto Math.random. */
  rng?: () => number;
};

type DrillCandidate = {
  questionId: string;
  quizId: string;
  quizDate: string;
  sortOrder: number;
  format: QuizPlayQuestionFormat;
  revealImageUrl: string | null;
};

function formatForQuestion(
  formats: QuizPlayFormatMeta[],
  sortOrder: number
): { format: QuizPlayQuestionFormat; revealImageUrl: string | null } {
  const meta = formats.find((f) => f.sort_order === sortOrder);
  if (!meta) {
    return { format: "classic", revealImageUrl: null };
  }
  return {
    format: meta.format,
    revealImageUrl: meta.reveal_image_url ?? null,
  };
}

function buildCandidates(quizzes: DrillHistoricalQuiz[]): DrillCandidate[] {
  const candidates: DrillCandidate[] = [];

  for (const quiz of quizzes) {
    const formats = parsePlayFormats(quiz.settingsJson);
    const effectiveFormats = formats.length
      ? formats
      : defaultClassicPlayFormats(quiz.questions.length);

    for (const question of quiz.questions) {
      const { format, revealImageUrl } = formatForQuestion(
        effectiveFormats,
        question.sort_order
      );
      candidates.push({
        questionId: question.id,
        quizId: quiz.id,
        quizDate: quiz.quizDate,
        sortOrder: question.sort_order,
        format,
        revealImageUrl,
      });
    }
  }

  return candidates;
}

function pickRandom<T>(items: T[], rng: () => number): T | null {
  if (!items.length) return null;
  return items[Math.floor(rng() * items.length)] ?? null;
}

function pickUnique(
  pool: DrillCandidate[],
  usedQuestionIds: Set<string>,
  usedQuizIds: Set<string>,
  preferDistinctQuiz: boolean,
  rng: () => number
): DrillCandidate | null {
  const available = pool.filter(
    (item) =>
      !usedQuestionIds.has(item.questionId) &&
      (!preferDistinctQuiz || !usedQuizIds.has(item.quizId))
  );
  if (available.length) {
    return pickRandom(available, rng);
  }

  const fallback = pool.filter((item) => !usedQuestionIds.has(item.questionId));
  return pickRandom(fallback, rng);
}

/**
 * Mezcla 3 preguntas del histórico publicado (excluye el quiz de hoy).
 * Máximo 1 silueta y máximo 1 imagen; el resto clásicas.
 */
export function composeDrillSessionPicks(
  args: ComposeDrillSessionArgs
): DrillQuestionPick[] {
  const rng = args.rng ?? Math.random;
  const historical = args.historicalQuizzes.filter(
    (quiz) => quiz.quizDate !== args.todayQuizDate && quiz.id !== args.todayQuizId
  );

  if (!historical.length) {
    throw new Error("No hay quizzes historicos para entrenar.");
  }

  const candidates = buildCandidates(historical);
  if (!candidates.length) {
    throw new Error("No hay preguntas historicas para entrenar.");
  }

  const silhouettePool = candidates.filter(
    (item) => item.format === "guess_player_silhouette"
  );
  const imagePool = candidates.filter((item) => item.format === "image_trivia");
  const classicPool = candidates.filter((item) => item.format === "classic");

  const usedQuestionIds = new Set<string>();
  const usedQuizIds = new Set<string>();
  const picks: DrillCandidate[] = [];

  const silhouette = pickUnique(silhouettePool, usedQuestionIds, usedQuizIds, true, rng);
  if (silhouette) {
    picks.push(silhouette);
    usedQuestionIds.add(silhouette.questionId);
    usedQuizIds.add(silhouette.quizId);
  }

  const image = pickUnique(imagePool, usedQuestionIds, usedQuizIds, true, rng);
  if (image) {
    picks.push(image);
    usedQuestionIds.add(image.questionId);
    usedQuizIds.add(image.quizId);
  }

  while (picks.length < 3) {
    const classic = pickUnique(classicPool, usedQuestionIds, usedQuizIds, true, rng);
    if (!classic) {
      const any = pickUnique(candidates, usedQuestionIds, usedQuizIds, false, rng);
      if (!any) break;
      picks.push(any);
      usedQuestionIds.add(any.questionId);
      usedQuizIds.add(any.quizId);
      continue;
    }
    picks.push(classic);
    usedQuestionIds.add(classic.questionId);
    usedQuizIds.add(classic.quizId);
  }

  if (picks.length < 3) {
    throw new Error("No hay suficientes preguntas historicas para entrenar.");
  }

  const ordered = [
    ...picks.filter((item) => item.format === "classic"),
    ...picks.filter((item) => item.format === "image_trivia"),
    ...picks.filter((item) => item.format === "guess_player_silhouette"),
  ].slice(0, 3);

  return ordered.map((item, index) => ({
    questionId: item.questionId,
    quizId: item.quizId,
    quizDate: item.quizDate,
    displaySortOrder: index + 1,
    format: item.format,
    revealImageUrl: item.revealImageUrl,
  }));
}

/** Reconstruye picks al reanudar un intento de entrenar. */
export function buildDrillPicksFromSnapshot(args: {
  questionIds: string[];
  questions: Array<{ id: string; quiz_id: string; sort_order: number }>;
  quizzes: Array<{ id: string; quiz_date: string | null; settings_json: unknown }>;
}): DrillQuestionPick[] {
  const quizById = new Map(args.quizzes.map((quiz) => [quiz.id, quiz]));
  const questionById = new Map(args.questions.map((q) => [q.id, q]));

  return args.questionIds.map((questionId, index) => {
    const question = questionById.get(questionId);
    if (!question) {
      throw new Error("Pregunta de entrenamiento no encontrada.");
    }
    const quiz = quizById.get(question.quiz_id);
    if (!quiz?.quiz_date) {
      throw new Error("Quiz de entrenamiento no encontrado.");
    }

    const formats = parsePlayFormats(quiz.settings_json);
    const effectiveFormats = formats.length
      ? formats
      : defaultClassicPlayFormats(args.questions.filter((q) => q.quiz_id === quiz.id).length);
    const { format, revealImageUrl } = formatForQuestion(
      effectiveFormats,
      question.sort_order
    );

    return {
      questionId,
      quizId: quiz.id,
      quizDate: quiz.quiz_date.slice(0, 10),
      displaySortOrder: index + 1,
      format,
      revealImageUrl,
    };
  });
}
