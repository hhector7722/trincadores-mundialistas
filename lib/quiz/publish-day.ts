import { isQuizPublishHeld, resolveQuizPublishWindow, todayQuizDate } from "@/lib/quiz/date";
import { composeOfficialQuizDay } from "@/lib/quiz/compose-official-day";
import { generateQuizDayFromSources } from "@/lib/quiz/generate-day";
import { loadRecentFactIds } from "@/lib/quiz/generate-day";
import { pickScoreGapQuestion } from "@/lib/quiz/lab/score-gap-bank";
import type { LabQuestion, LabQuestionJerseyPick, JerseyOption } from "@/lib/quiz/lab/types";
import {
  factIdsFromSettings,
  loadRecentFactIdsFromDb,
  loadRecentMomentIdsFromDb,
  momentIdsFromSettings,
} from "@/lib/quiz/recent-fact-ids";
import {
  ensureQuizPool,
  findQuizForDate,
  seedQuizDayToDb,
  type QuizAdminClient,
} from "@/lib/quiz/seed-db";

export type PublishQuizDayResult = {
  quizDate: string;
  quizId: string;
  scoringMode: "training" | "competitive";
  skipped: boolean;
  factIds: string[];
  labDailyPack?: {
    skipped: boolean;
    questionCount: number;
    momentIds: string[];
  };
};

export type PublishQuizDayOptions = {
  admin: QuizAdminClient;
  quizDate: string;
  poolId?: string;
  allowReseed?: boolean;
  /** En servidor local/scripts: también lee historial de data/quiz/generated */
  includeFilesystemHistory?: boolean;
  /** Hechos a excluir siempre (p. ej. quiz de entreno sustituido manualmente). */
  extraExcludeFactIds?: string[];
  /** Si false, no pregenera assets de imagen del laboratorio (silueta, pelo, ojos, trivia). */
  pregenerateLabAssets?: boolean;
};

export async function publishQuizDay(
  options: PublishQuizDayOptions
): Promise<PublishQuizDayResult> {
  const poolId = options.poolId ?? (await ensureQuizPool(options.admin));
  const existingOnRequestedDate = await findQuizForDate(
    options.admin,
    poolId,
    options.quizDate,
    "official"
  );

  const publishWindow = resolveQuizPublishWindow(
    options.quizDate,
    new Date(),
    Boolean(
      existingOnRequestedDate &&
        options.allowReseed &&
        options.quizDate !== todayQuizDate()
    )
  );
  const quizDate = publishWindow.quizDate;

  if (isQuizPublishHeld(quizDate)) {
    return {
      quizDate,
      quizId: "",
      scoringMode: "competitive",
      skipped: true,
      factIds: [],
    };
  }

  const existingId = await findQuizForDate(
    options.admin,
    poolId,
    quizDate,
    "official"
  );
  if (existingId && !options.allowReseed) {
    return {
      quizDate,
      quizId: existingId,
      scoringMode: "training",
      skipped: true,
      factIds: [],
    };
  }

  const excludeFromDb = await loadRecentFactIdsFromDb(
    options.admin,
    poolId,
    quizDate
  );

  const excludeMomentsFromDb = await loadRecentMomentIdsFromDb(
    options.admin,
    poolId,
    quizDate
  );

  const excludeFactIds = new Set(excludeFromDb);
  if (options.includeFilesystemHistory) {
    for (const id of loadRecentFactIds(quizDate)) {
      excludeFactIds.add(id);
    }
  }

  for (const id of options.extraExcludeFactIds ?? []) {
    if (id.trim()) excludeFactIds.add(id.trim());
  }

  if (existingId && options.allowReseed) {
    const { data: existingQuiz, error: existingError } = await options.admin
      .from("quizzes")
      .select("settings_json")
      .eq("id", existingId)
      .maybeSingle();

    if (existingError) throw existingError;
    for (const id of factIdsFromSettings(existingQuiz?.settings_json)) {
      excludeFactIds.add(id);
    }
    for (const id of momentIdsFromSettings(existingQuiz?.settings_json)) {
      excludeMomentsFromDb.add(id);
    }
  }

  const generated = await generateQuizDayFromSources({
    quizDate,
    excludeFactIds,
    questionCount: 3,
  });

  if (generated.official.questions.length !== 3) {
    throw new Error("No se pudieron generar las 3 preguntas test clásicas del día.");
  }

  const composed = composeOfficialQuizDay({
    quizDate,
    title: generated.title,
    classicQuestions: generated.official.questions,
  });

  const { quizId, scoringMode, created } = await seedQuizDayToDb({
    admin: options.admin,
    poolId,
    payload: composed.payload,
    generated: true,
    allowReseed: options.allowReseed,
    playFormats: composed.playFormats,
    publishWindow,
  });

  const factIds = generated._meta?.fact_ids ?? [];

  return {
    quizDate,
    quizId,
    scoringMode,
    skipped: !created && !options.allowReseed,
    factIds,
  };
}
