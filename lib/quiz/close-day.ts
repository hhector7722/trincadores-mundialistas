import { addQuizDays, quizDayClosesAt } from "@/lib/quiz/date";
import {
  ensureQuizPool,
  findQuizForDate,
  type QuizAdminClient,
} from "@/lib/quiz/seed-db";
import { generateNextJerseyPickQuestion } from "@/lib/quiz/lab/generate-jersey-pick-question";

export type CloseQuizDayResult = {
  quizDate: string;
  quizId?: string;
  expiredAttempts: number;
  skipped: boolean;
};

export type CloseQuizDayOptions = {
  admin: QuizAdminClient;
  quizDate: string;
  poolId?: string;
};

export async function closeQuizDay(
  options: CloseQuizDayOptions
): Promise<CloseQuizDayResult> {
  const poolId = options.poolId ?? (await ensureQuizPool(options.admin));

  const quizId = await findQuizForDate(
    options.admin,
    poolId,
    options.quizDate,
    "official"
  );

  if (!quizId) {
    return {
      quizDate: options.quizDate,
      expiredAttempts: 0,
      skipped: true,
    };
  }

  const closesAt = quizDayClosesAt(options.quizDate);

  const { error: updateError } = await options.admin
    .from("quizzes")
    .update({ closes_at: closesAt })
    .eq("id", quizId);

  if (updateError) throw updateError;

  const { data: expiredRows, error: expireError } = await options.admin
    .from("quiz_attempts")
    .update({ status: "expired" })
    .eq("quiz_id", quizId)
    .eq("status", "in_progress")
    .select("id");

  if (expireError) throw expireError;

  const { error: quizBonusError } = await options.admin.rpc(
    "recalculate_quiz_final_ranking_scores",
    { p_pool_id: poolId }
  );
  if (quizBonusError) {
    console.error("[closeQuizDay] Fallo al persistir bonus quiz:", quizBonusError.message);
  }

  const nextDate = addQuizDays(options.quizDate, 1);
  generateNextJerseyPickQuestion(nextDate).catch(err => {
    console.error("[closeQuizDay] Fallo asíncrono al generar jersey pick para", nextDate, err);
  });

  return {
    quizDate: options.quizDate,
    quizId,
    expiredAttempts: expiredRows?.length ?? 0,
    skipped: false,
  };
}
