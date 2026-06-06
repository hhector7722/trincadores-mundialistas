import { mkdirSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { loadFacts } from "../lib/quiz/facts";
import { generateQuizDay, loadRecentFactIds } from "../lib/quiz/generate-day";

function main() {
  const quizDate = process.env.QUIZ_DATE?.trim();
  if (!quizDate || !/^\d{4}-\d{2}-\d{2}$/.test(quizDate)) {
    throw new Error("Define QUIZ_DATE=YYYY-MM-DD para generar el quiz del dia.");
  }

  const facts = loadFacts();
  const excludeFactIds = loadRecentFactIds(quizDate);
  const day = generateQuizDay({ quizDate, facts, excludeFactIds });

  const outPath = resolve(process.cwd(), `data/quiz/generated/${quizDate}.json`);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(day, null, 2)}\n`, "utf8");

  console.log(`Quiz generado: ${outPath}`);
  console.log(`Hechos: ${day._meta?.fact_ids.join(", ")}`);
  for (const q of day.official.questions) {
    console.log(`  Q${q.sort_order}: ${q.prompt}`);
    console.log(`       fuente: ${q.source_label} (${q.source_url})`);
  }
}

main();
