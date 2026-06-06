import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { REAL_POOL_SLUG } from "../lib/auth/participants";
import {
  questionsMetaFromDay,
  parseGeneratedOrSeedDay,
} from "../lib/quiz/generated-day";
import {
  scoringFieldsForMode,
  type SeedQuizDayFile,
  type SeedQuizQuestion,
  QUIZ_OFFICIAL_TITLE,
} from "../lib/quiz/seed-day";
import type { QuizKind, QuizScoringMode } from "../lib/quiz/types";
import {
  assertQuizSeedAllowed,
  assertServiceEnv,
} from "../lib/scripts/env-guard";

type AdminClient = SupabaseClient;

async function ensurePool(admin: AdminClient): Promise<string> {
  const slug = process.env.POOL_SLUG?.trim() || REAL_POOL_SLUG;
  const { data, error } = await admin.from("pools").select("id").eq("slug", slug).maybeSingle();
  if (error) throw error;
  if (!data?.id) throw new Error(`Pool no encontrado: ${slug}`);
  return data.id as string;
}

async function isPoolCompetitiveAdmin(admin: AdminClient, poolId: string): Promise<boolean> {
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

async function findQuiz(
  admin: AdminClient,
  poolId: string,
  quizDate: string,
  kind: QuizKind
) {
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
  admin: AdminClient,
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
    const { error: deleteError } = await admin
      .from("quiz_questions")
      .delete()
      .in("id", existingIds);
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

async function upsertQuizBundle(args: {
  admin: AdminClient;
  poolId: string;
  quizDate: string;
  kind: QuizKind;
  scoringMode: QuizScoringMode;
  title: string;
  settingsJson: Record<string, unknown>;
  questions: SeedQuizQuestion[];
}): Promise<string> {
  const scoring = scoringFieldsForMode(args.kind, args.scoringMode);
  const existingId = await findQuiz(args.admin, args.poolId, args.quizDate, args.kind);

  if (existingId && process.env.CONFIRM_RESEED !== "1") {
    throw new Error(
      `Ya existe quiz ${args.kind} para ${args.quizDate}. Usa CONFIRM_RESEED=1 para reemplazar preguntas.`
    );
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
      })
      .eq("id", quizId);

    if (updateError) throw updateError;
    console.log(`Quiz ${args.kind} actualizado (${quizId}).`);
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
      })
      .select("id")
      .single();

    if (createError || !created) {
      throw createError ?? new Error(`No se pudo crear quiz ${args.kind}.`);
    }

    quizId = created.id as string;
    console.log(`Quiz ${args.kind} creado (${quizId}).`);
  }

  await replaceQuestions(args.admin, quizId, args.questions, scoring.question_points);
  console.log(
    `  ${args.questions.length} pregunta(s), modo=${args.scoringMode}, max_points=${scoring.max_points}`
  );

  return quizId;
}

async function main() {
  assertServiceEnv();
  assertQuizSeedAllowed();

  const { path: seedPath, payload, generated } = readSeedFile();
  console.log(`Archivo: ${seedPath}`);
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const poolId = await ensurePool(admin);
  const competitive = await isPoolCompetitiveAdmin(admin, poolId);
  const scoringMode: QuizScoringMode = competitive ? "competitive" : "training";

  console.log(`Pool: ${poolId}`);
  console.log(`Fecha: ${payload.quiz_date}`);
  console.log(`Modo detectado: ${scoringMode}`);

  const officialOrders = payload.official.questions.map((q) => q.sort_order).sort((a, b) => a - b);
  if (officialOrders.join(",") !== "1,2,3") {
    throw new Error("official.questions debe usar sort_order 1, 2 y 3.");
  }

  await upsertQuizBundle({
    admin,
    poolId,
    quizDate: payload.quiz_date,
    kind: "official",
    scoringMode,
    title: payload.title ?? QUIZ_OFFICIAL_TITLE,
    settingsJson: {
      generated,
      questions_meta: questionsMetaFromDay(payload),
    },
    questions: payload.official.questions,
  });

  console.log("Seed de quiz completado.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
