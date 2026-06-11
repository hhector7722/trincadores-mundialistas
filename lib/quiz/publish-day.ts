import { generatedDayToSeedFile } from "@/lib/quiz/generated-day";
import { generateQuizDayFromSources } from "@/lib/quiz/generate-day";
import { loadRecentFactIds } from "@/lib/quiz/generate-day";
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
};

export async function publishQuizDay(
  options: PublishQuizDayOptions
): Promise<PublishQuizDayResult> {
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
  });

  const payload = generatedDayToSeedFile(generated);
  const { quizId, scoringMode, created } = await seedQuizDayToDb({
    admin: options.admin,
    poolId,
    payload,
    generated: true,
    allowReseed: options.allowReseed,
  });

  const factIds = generated._meta?.fact_ids ?? [];

  return {
    quizDate: options.quizDate,
    quizId,
    scoringMode,
    skipped: !created && !options.allowReseed,
    factIds,
  };
}
