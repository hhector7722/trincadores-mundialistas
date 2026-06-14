import { pregenerateQuizLabDailyPack } from "@/lib/quiz/lab/daily-pack.server";

const quizDate = process.argv[2]?.trim();
const force = process.argv.includes("--force");

if (!quizDate || !/^\d{4}-\d{2}-\d{2}$/.test(quizDate)) {
  console.error("Uso: npm run quiz:pregenerate-lab-assets -- YYYY-MM-DD [--force]");
  process.exit(1);
}

const result = await pregenerateQuizLabDailyPack(quizDate, { force });

if (!result.pack) {
  console.error("No se pudo generar el pack diario.");
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      quizDate: result.quizDate,
      skipped: result.skipped,
      questionCount: result.pack.questions.length,
      momentIds: result.pack.momentIds,
      formats: result.pack.questions.map((q) => q.format),
      manifest: `data/quiz/lab-daily/${quizDate}.json`,
    },
    null,
    2
  )
);
