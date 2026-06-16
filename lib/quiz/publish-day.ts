import { isQuizPublishHeld, resolveQuizPublishWindow, todayQuizDate } from "@/lib/quiz/date";
import { composeOfficialQuizDay } from "@/lib/quiz/compose-official-day";
import { generateQuizDayFromSources } from "@/lib/quiz/generate-day";
import { loadRecentFactIds } from "@/lib/quiz/generate-day";
import { labDailyPackSettingsSummary } from "@/lib/quiz/lab/daily-pack-types";
import {
  factIdsFromSettings,
  loadRecentFactIdsFromDb,
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

  const shouldPregenerateLab = options.pregenerateLabAssets !== false;
  const labResult = shouldPregenerateLab
    ? process.env.VERCEL === "1"
      ? await (
          await import("@/lib/quiz/lab/daily-pack-light.server")
        ).pregenerateQuizLabDailyPackLight(quizDate, {
          force: Boolean(options.allowReseed),
        })
      : await (
          await import("@/lib/quiz/lab/daily-pack.server")
        ).pregenerateQuizLabDailyPack(quizDate, {
          force: Boolean(options.allowReseed),
        })
    : null;

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
      labDailyPack: labResult?.pack
        ? {
            skipped: labResult.skipped,
            questionCount: labResult.pack.questions.length,
            momentIds: labResult.pack.momentIds,
          }
        : undefined,
    };
  }

  const excludeFromDb = await loadRecentFactIdsFromDb(
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
  }

  const generated = await generateQuizDayFromSources({
    quizDate,
    excludeFactIds,
    questionCount: 1,
  });

  if (!labResult?.pack?.questions?.length || labResult.pack.questions.length < 2) {
    throw new Error(
      "Faltan preguntas de laboratorio (imagen + silueta). Ejecuta pregenerateLabAssets o CONFIRM_RESEED=1."
    );
  }

  const classicQuestion = generated.official.questions[0];
  if (!classicQuestion) {
    throw new Error("No se pudo generar la pregunta test clásica del día.");
  }

  const composed = composeOfficialQuizDay({
    quizDate,
    title: generated.title,
    classicQuestion,
    labQuestions: labResult.pack.questions,
  });

  const { quizId, scoringMode, created } = await seedQuizDayToDb({
    admin: options.admin,
    poolId,
    payload: composed.payload,
    generated: true,
    allowReseed: options.allowReseed,
    labDailyPackSummary: labResult?.pack
      ? labDailyPackSettingsSummary(labResult.pack)
      : undefined,
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
    labDailyPack: labResult?.pack
      ? {
          skipped: labResult.skipped,
          questionCount: labResult.pack.questions.length,
          momentIds: labResult.pack.momentIds,
        }
      : undefined,
  };
}
