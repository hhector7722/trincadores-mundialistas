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

  const labQuestions: LabQuestion[] = [];

  const { data: jerseyPick, error: jerseyPickError } = await options.admin
    .from("quiz_jersey_pick_bank")
    .select("*")
    .eq("target_date", quizDate)
    .eq("status", "ready")
    .maybeSingle();

  if (jerseyPickError) throw jerseyPickError;

  const scoreGap1 = pickScoreGapQuestion([]);
  if (!scoreGap1) throw new Error("No hay preguntas score_gap disponibles para Q2.");
  labQuestions.push(scoreGap1);

  if (jerseyPick) {
    const correctOption = jerseyPick.correct_option;
    const distractors = jerseyPick.distractor_options;
    const jerseyOptions: JerseyOption[] = [
      { id: "a", ...correctOption, isCorrect: true },
      { id: "b", ...distractors[0] },
      { id: "c", ...distractors[1] },
      { id: "d", ...distractors[2] },
    ].sort(() => Math.random() - 0.5); // Shuffle

    // Fix IDs after shuffle to be a, b, c, d
    const letters = ["a", "b", "c", "d"];
    const finalJerseyOptions = jerseyOptions.map((opt, i) => ({ ...opt, id: letters[i] }));
    const correctId = finalJerseyOptions.find(opt => opt.isCorrect)!.id;

    const jerseyQuestion: LabQuestionJerseyPick = {
      id: jerseyPick.id,
      format: "jersey_pick",
      prompt: jerseyPick.prompt,
      options: finalJerseyOptions.map(opt => ({ id: opt.id, label: opt.team })),
      correctOptionId: correctId,
      timerSeconds: 15,
      jerseyOptions: finalJerseyOptions,
    };
    labQuestions.push(jerseyQuestion);

    await options.admin
      .from("quiz_jersey_pick_bank")
      .update({ status: "used" })
      .eq("id", jerseyPick.id);
  } else {
    console.warn(`[publishQuizDay] Fallback: No hay jersey_pick ready para ${quizDate}. Usando score_gap extra.`);
    const scoreGap2 = pickScoreGapQuestion([scoreGap1.id]);
    if (!scoreGap2) throw new Error("No hay suficientes preguntas score_gap para fallback.");
    labQuestions.push(scoreGap2);
  }

  const generated = await generateQuizDayFromSources({
    quizDate,
    excludeFactIds,
    questionCount: 1,
  });

  if (labQuestions.length < 2) {
    throw new Error("Faltan preguntas de laboratorio (Q2 y Q3).");
  }

  const classicQuestion = generated.official.questions[0];
  if (!classicQuestion) {
    throw new Error("No se pudo generar la pregunta test clásica del día.");
  }

  const composed = composeOfficialQuizDay({
    quizDate,
    title: generated.title,
    classicQuestion,
    labQuestions,
  });

  const { quizId, scoringMode, created } = await seedQuizDayToDb({
    admin: options.admin,
    poolId,
    payload: composed.payload,
    generated: true,
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
