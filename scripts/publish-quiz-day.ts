import { todayQuizDate } from "../lib/quiz/date";
import { publishQuizDay } from "../lib/quiz/publish-day";
import { assertServiceEnv } from "../lib/scripts/env-guard";
import { createAdminClient } from "../lib/scripts/supabase-admin";

async function main() {
  assertServiceEnv();
  const quizDate = process.env.QUIZ_DATE?.trim() || todayQuizDate();
  const allowReseed = process.env.CONFIRM_RESEED === "1";
  const extraExcludeFactIds =
    process.env.EXCLUDE_FACT_IDS?.split(",")
      .map((id) => id.trim())
      .filter(Boolean) ?? [];

  const admin = createAdminClient();
  const result = await publishQuizDay({
    admin,
    quizDate,
    allowReseed,
    includeFilesystemHistory: true,
    extraExcludeFactIds,
  });

  if (result.skipped) {
    console.log(`Quiz ya publicado para ${quizDate} (${result.quizId}). Usa CONFIRM_RESEED=1 para regenerar.`);
    return;
  }

  console.log(`Quiz publicado: ${quizDate}`);
  console.log(`  id: ${result.quizId}`);
  console.log(`  modo: ${result.scoringMode}`);
  console.log(`  hechos: ${result.factIds.join(", ")}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
