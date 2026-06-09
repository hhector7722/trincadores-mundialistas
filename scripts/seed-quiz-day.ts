import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { REAL_POOL_SLUG } from "../lib/auth/participants";
import { questionsMetaFromDay, parseGeneratedOrSeedDay } from "../lib/quiz/generated-day";
import { type SeedQuizDayFile } from "../lib/quiz/seed-day";
import { ensureQuizPool, findQuizForDate, seedQuizDayToDb } from "../lib/quiz/seed-db";
import {
  assertQuizSeedAllowed,
  assertServiceEnv,
} from "../lib/scripts/env-guard";
import { createAdminClient } from "../lib/scripts/supabase-admin";

function resolveSeedPath(): string {
  const quizDate = process.env.QUIZ_DATE?.trim();
  const explicitFile = process.env.QUIZ_DAY_FILE?.trim();
  if (explicitFile) return resolve(process.cwd(), explicitFile);

  if (quizDate) {
    const generated = resolve(process.cwd(), `data/quiz/generated/${quizDate}.json`);
    if (existsSync(generated)) return generated;
    const manual = resolve(process.cwd(), `data/quiz/${quizDate}.json`);
    if (existsSync(manual)) return manual;
  }

  const fallback = resolve(process.cwd(), "data/quiz/example-day.json");
  if (!existsSync(fallback)) {
    throw new Error(
      "No hay archivo de quiz. Genera uno con: QUIZ_DATE=YYYY-MM-DD npm run quiz:generate-day"
    );
  }
  return fallback;
}

function readSeedFile(): { path: string; payload: SeedQuizDayFile; generated: boolean } {
  const quizDate = process.env.QUIZ_DATE?.trim();
  const path = resolveSeedPath();

  const raw = JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>;
  if (raw.bonus) {
    console.warn("[seed-quiz-day] bonus deprecado — se ignora en el seed.");
  }

  const parsed = parseGeneratedOrSeedDay(raw);
  const generated = raw.generated === true;

  if (quizDate && parsed.quiz_date !== quizDate) {
    throw new Error(`QUIZ_DATE=${quizDate} no coincide con quiz_date del JSON (${parsed.quiz_date}).`);
  }

  return { path, payload: parsed, generated };
}

async function main() {
  assertServiceEnv();
  assertQuizSeedAllowed();

  const { path: seedPath, payload, generated } = readSeedFile();
  console.log(`Archivo: ${seedPath}`);

  const admin = createAdminClient();
  const poolSlug = process.env.POOL_SLUG?.trim() || REAL_POOL_SLUG;
  const poolId = await ensureQuizPool(admin, poolSlug);
  const allowReseed = process.env.CONFIRM_RESEED === "1";

  if (!allowReseed) {
    const existing = await findQuizForDate(admin, poolId, payload.quiz_date, "official");
    if (existing) {
      throw new Error(
        `Ya existe quiz official para ${payload.quiz_date}. Usa CONFIRM_RESEED=1 para reemplazar preguntas.`
      );
    }
  }

  console.log(`Pool: ${poolId}`);
  console.log(`Fecha: ${payload.quiz_date}`);

  const { quizId, scoringMode } = await seedQuizDayToDb({
    admin,
    poolId,
    payload,
    generated,
    allowReseed,
  });

  console.log(`Quiz official publicado (${quizId}), modo=${scoringMode}`);
  console.log(`Meta: ${JSON.stringify(questionsMetaFromDay(payload).map((m) => m.fact_id))}`);
  console.log("Seed de quiz completado.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
