import type { SupabaseClient } from "@supabase/supabase-js";
import { REAL_POOL_SLUG } from "@/lib/auth/participants";
import { isQuizCompetitiveDay, quizDayWindow } from "@/lib/quiz/date";
import { questionsMetaFromDay } from "@/lib/quiz/generated-day";
import {
  scoringFieldsForMode,
  type SeedQuizDayFile,
  type SeedQuizQuestion,
  QUIZ_OFFICIAL_TITLE,
} from "@/lib/quiz/seed-day";
import type { QuizKind, QuizScoringMode } from "@/lib/quiz/types";

export type QuizAdminClient = SupabaseClient;

export async function ensureQuizPool(
  admin: QuizAdminClient,
  poolSlug = process.env.POOL_SLUG?.trim() || REAL_POOL_SLUG
): Promise<string> {
  const { data, error } = await admin.from("pools").select("id").eq("slug", poolSlug).maybeSingle();
  if (error) throw error;
  if (!data?.id) throw new Error(`Pool no encontrado: ${poolSlug}`);
  return data.id as string;
}

export async function isPoolCompetitiveAdmin(
  admin: QuizAdminClient,
  poolId: string
): Promise<boolean> {
  const { data: matchdays, error: mdError } = await admin
    .from("matchdays")
    .select("id")
    .eq("pool_id", poolId);

  if (mdError) throw mdError;
  if (!matchdays?.length) return false;

  const matchdayIds = matchdays.map((m) => m.id as string);

  const { count: activeCount, error: activeError } = await admin
    .from("matches")
    .select("id", { count: "exact", head: true })
    .in("matchday_id", matchdayIds)
    .in("status", ["live", "finished"]);

  if (activeError) throw activeError;
  if ((activeCount ?? 0) > 0) return true;

  const { data: firstMatch, error: firstError } = await admin
    .from("matches")
    .select("kickoff_at")
    .in("matchday_id", matchdayIds)
    .order("kickoff_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (firstError) throw firstError;
  if (!firstMatch?.kickoff_at) return false;

  return Date.now() >= new Date(firstMatch.kickoff_at as string).getTime();
}

export async function findQuizForDate(
  admin: QuizAdminClient,
  poolId: string,
  quizDate: string,
  kind: QuizKind
): Promise<string | undefined> {
  const { data, error } = await admin
    .from("quizzes")
    .select("id")
    .eq("pool_id", poolId)
    .eq("quiz_date", quizDate)
    .eq("kind", kind)
    .maybeSingle();

  if (error) throw error;
  return data?.id as string | undefined;
}

async function replaceQuestions(
  admin: QuizAdminClient,
  quizId: string,
  questions: SeedQuizQuestion[],
  questionPoints: number
): Promise<void> {
  const { data: existing, error: existingError } = await admin
    .from("quiz_questions")
    .select("id")
    .eq("quiz_id", quizId);

  if (existingError) throw existingError;

  const existingIds = (existing ?? []).map((q) => q.id as string);
  if (existingIds.length) {
    const { error: deleteError } = await admin.from("quiz_questions").delete().in("id", existingIds);
    if (deleteError) throw deleteError;
  }

  for (const question of questions) {
    const { data: inserted, error: insertError } = await admin
      .from("quiz_questions")
      .insert({
        quiz_id: quizId,
        sort_order: question.sort_order,
        prompt: question.prompt,
        options: question.options,
        points: questionPoints,
        image_url: question.image_url ?? null,
      })
      .select("id")
      .single();

    if (insertError || !inserted) {
      throw insertError ?? new Error("No se pudo insertar pregunta.");
    }

    const { error: keyError } = await admin.from("quiz_question_keys").insert({
      question_id: inserted.id,
      correct_option_id: question.correct_option_id,
    });

    if (keyError) throw keyError;
  }
}

export async function upsertQuizBundle(args: {
  admin: QuizAdminClient;
  poolId: string;
  quizDate: string;
  kind: QuizKind;
  scoringMode: QuizScoringMode;
  title: string;
  settingsJson: Record<string, unknown>;
  questions: SeedQuizQuestion[];
  allowReseed?: boolean;
}): Promise<string> {
  const scoring = scoringFieldsForMode(args.kind, args.scoringMode);
  const { opensAt, closesAt } = quizDayWindow(args.quizDate);
  const existingId = await findQuizForDate(args.admin, args.poolId, args.quizDate, args.kind);

  if (existingId && !args.allowReseed) {
    return existingId;
  }

  let quizId = existingId;

  if (quizId) {
    const { error: updateError } = await args.admin
      .from("quizzes")
      .update({
        title: args.title,
        scoring_mode: args.scoringMode,
        max_points: scoring.max_points,
        settings_json: args.settingsJson,
        opens_at: opensAt,
        closes_at: closesAt,
      })
      .eq("id", quizId);

    if (updateError) throw updateError;
  } else {
    const { data: created, error: createError } = await args.admin
      .from("quizzes")
      .insert({
        pool_id: args.poolId,
        title: args.title,
        quiz_date: args.quizDate,
        kind: args.kind,
        scoring_mode: args.scoringMode,
        max_points: scoring.max_points,
        settings_json: args.settingsJson,
        opens_at: opensAt,
        closes_at: closesAt,
      })
      .select("id")
      .single();

    if (createError || !created) {
      throw createError ?? new Error(`No se pudo crear quiz ${args.kind}.`);
    }

    quizId = created.id as string;
  }

  await replaceQuestions(args.admin, quizId, args.questions, scoring.question_points);
  return quizId;
}

export async function seedQuizDayToDb(args: {
  admin: QuizAdminClient;
  poolId: string;
  payload: SeedQuizDayFile;
  generated?: boolean;
  allowReseed?: boolean;
  labDailyPackSummary?: Record<string, unknown>;
}): Promise<{ quizId: string; scoringMode: QuizScoringMode; created: boolean }> {
  const officialOrders = args.payload.official.questions.map((q) => q.sort_order).sort((a, b) => a - b);
  if (officialOrders.join(",") !== "1,2,3") {
    throw new Error("official.questions debe usar sort_order 1, 2 y 3.");
  }

  const existingId = await findQuizForDate(
    args.admin,
    args.poolId,
    args.payload.quiz_date,
    "official"
  );
  const matchCompetitive = await isPoolCompetitiveAdmin(args.admin, args.poolId);
  const scoringMode: QuizScoringMode =
    isQuizCompetitiveDay(args.payload.quiz_date) || matchCompetitive
      ? "competitive"
      : "training";

  const quizId = await upsertQuizBundle({
    admin: args.admin,
    poolId: args.poolId,
    quizDate: args.payload.quiz_date,
    kind: "official",
    scoringMode,
    title: args.payload.title ?? QUIZ_OFFICIAL_TITLE,
    settingsJson: {
      generated: args.generated ?? false,
      questions_meta: questionsMetaFromDay(args.payload),
      ...(args.labDailyPackSummary ? { lab_daily_pack: args.labDailyPackSummary } : {}),
    },
    questions: args.payload.official.questions,
    allowReseed: args.allowReseed,
  });

  return {
    quizId,
    scoringMode,
    created: !existingId || Boolean(args.allowReseed),
  };
}
