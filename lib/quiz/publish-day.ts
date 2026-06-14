import { isQuizPublishHeld } from "@/lib/quiz/date";
import { composeOfficialQuizDay } from "@/lib/quiz/compose-official-day";
import { generateQuizDayFromSources } from "@/lib/quiz/generate-day";
import { loadRecentFactIds } from "@/lib/quiz/generate-day";
import {
  labDailyPackSettingsSummary,
  pregenerateQuizLabDailyPack,
} from "@/lib/quiz/lab/daily-pack.server";
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
  if (isQuizPublishHeld(options.quizDate)) {
    return {
      quizDate: options.quizDate,
      quizId: "",
      scoringMode: "competitive",
      skipped: true,
      factIds: [],
    };
  }

  const shouldPregenerateLab = options.pregenerateLabAssets !== false;
  const labResult = shouldPregenerateLab
    ? await pregenerateQuizLabDailyPack(options.quizDate, {
        force: Boolean(options.allowReseed),
      })
    : null;

  const poolId = options.poolId ?? (await ensureQuizPool(options.admin));

  const existingId = await findQuizForDate(
    options.admin,
    poolId,
    options.quizDate,
    "official"
  );
  if (existingId && !options.allowReseed) {
    return {
      quizDate: options.quizDate,
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
    options.quizDate
  );

  const excludeFactIds = new Set(excludeFromDb);
  if (options.includeFilesystemHistory) {
    for (const id of loadRecentFactIds(options.quizDate)) {
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
    quizDate: options.quizDate,
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
    quizDate: options.quizDate,
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
  });

  const factIds = generated._meta?.fact_ids ?? [];

  return {
    quizDate: options.quizDate,
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
