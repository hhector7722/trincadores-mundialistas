import { mkdirSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { generateQuizDayFromSources, loadRecentFactIds } from "../lib/quiz/generate-day";

async function main() {
  const quizDate = process.env.QUIZ_DATE?.trim();
  if (!quizDate || !/^\d{4}-\d{2}-\d{2}$/.test(quizDate)) {
    throw new Error("Define QUIZ_DATE=YYYY-MM-DD para generar el quiz del dia.");
  }

  const excludeFactIds = loadRecentFactIds(quizDate);
  const day = await generateQuizDayFromSources({ quizDate, excludeFactIds });

  const outPath = resolve(process.cwd(), `data/quiz/generated/${quizDate}.json`);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(day, null, 2)}\n`, "utf8");

  console.log(`Quiz generado: ${outPath}`);
  console.log(
    `Fuente hechos: ${day._meta?.facts_source} (pool=${day._meta?.facts_pool_size})`
  );
  console.log(`Hechos: ${day._meta?.fact_ids.join(", ")}`);
  for (const q of day.official.questions) {
    console.log(`  Q${q.sort_order}: ${q.prompt}`);
    console.log(`       fuente: ${q.source_label} (${q.source_url})`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
