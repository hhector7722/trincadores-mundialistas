import { quizDayClosesAt, quizDayOpensAt, todayQuizDate } from "@/lib/quiz/date";
import {
  ensureQuizPool,
  findQuizForDate,
  type QuizAdminClient,
} from "@/lib/quiz/seed-db";

/** Falta el quiz oficial de hoy y ya pasó la medianoche (ventana abierta). */
export async function needsQuizCatchUpPublish(
  admin: QuizAdminClient,
  now = new Date()
): Promise<boolean> {
  const quizDate = todayQuizDate(now);
  const poolId = await ensureQuizPool(admin);

  const existingId = await findQuizForDate(admin, poolId, quizDate, "official");
  if (existingId) return false;

  const opensMs = new Date(quizDayOpensAt(quizDate)).getTime();
  const closesMs = new Date(quizDayClosesAt(quizDate)).getTime();
  const instant = now.getTime();

  return instant >= opensMs && instant <= closesMs;
}
