import { readdirSync, readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import type { QuizFact } from "@/lib/quiz/facts";
import { generateQuestionFromFact } from "@/lib/quiz/generate-question";
import { assertGeneratedQuestions } from "@/lib/quiz/quality";
import { mulberry32, seedFromQuizDate, shuffleWithRng } from "@/lib/quiz/rng";
import type { GeneratedQuizDayFile } from "@/lib/quiz/generated-day";
import { QUIZ_OFFICIAL_TITLE } from "@/lib/quiz/seed-day";
import {
  loadQuizFactsWithFallback,
  type LoadQuizFactsDeps,
  type QuizFactsLoadResult,
} from "@/lib/quiz/worldcup-facts-source";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const GENERATED_DIR = resolve(process.cwd(), "data/quiz/generated");
const HISTORY_DAYS = 14;

function parseDateParts(quizDate: string): { y: number; m: number; d: number } {
  const [y, m, d] = quizDate.split("-").map(Number);
  return { y, m, d };
}

function addDays(quizDate: string, delta: number): string {
  const { y, m, d } = parseDateParts(quizDate);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + delta);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

export function loadRecentFactIds(quizDate: string, historyDays = HISTORY_DAYS): Set<string> {
  const used = new Set<string>();
  if (!existsSync(GENERATED_DIR)) return used;

  for (let offset = 1; offset <= historyDays; offset++) {
    const date = addDays(quizDate, -offset);
    const path = resolve(GENERATED_DIR, `${date}.json`);
    if (!existsSync(path)) continue;
    try {
      const raw = JSON.parse(readFileSync(path, "utf8")) as {
        official?: { questions?: { fact_id?: string }[] };
        _meta?: { fact_ids?: string[] };
      };
      for (const id of raw._meta?.fact_ids ?? []) {
        if (typeof id === "string") used.add(id);
      }
      for (const q of raw.official?.questions ?? []) {
        if (typeof q.fact_id === "string") used.add(q.fact_id);
      }
    } catch {
      // ignorar archivos corruptos en historial
    }
  }

  return used;
}

export function selectFactsForDay(args: {
  quizDate: string;
  facts: QuizFact[];
  excludeFactIds?: Set<string>;
  count?: number;
}): QuizFact[] {
  const quizDate = args.quizDate.trim();
  if (!DATE_RE.test(quizDate)) {
    throw new Error("quiz_date invalido. Usa YYYY-MM-DD.");
  }

  const count = args.count ?? 3;
  const exclude = args.excludeFactIds ?? new Set<string>();
  const rng = mulberry32(seedFromQuizDate(quizDate));

  const difficultyRank = { hard: 0, medium: 1, easy: 2 } as const;

  const eligible = shuffleWithRng(
    args.facts
      .filter((f) => !exclude.has(f.id))
      .sort(
        (a, b) =>
          difficultyRank[a.difficulty] - difficultyRank[b.difficulty] ||
          a.id.localeCompare(b.id)
      ),
    rng
  );

  const picked: QuizFact[] = [];
  const usedCategories = new Set<string>();

  for (const fact of eligible) {
    if (picked.length >= count) break;
    if (usedCategories.has(fact.category) && picked.length < count - 1) {
      continue;
    }
    picked.push(fact);
    usedCategories.add(fact.category);
  }

  if (picked.length < count) {
    for (const fact of eligible) {
      if (picked.length >= count) break;
      if (picked.some((p) => p.id === fact.id)) continue;
      picked.push(fact);
    }
  }

  if (picked.length < count) {
    throw new Error(`Solo se pudieron seleccionar ${picked.length} hechos (se necesitan ${count}).`);
  }

  return picked.slice(0, count);
}

export function generateQuizDay(args: {
  quizDate: string;
  facts: QuizFact[];
  excludeFactIds?: Set<string>;
  title?: string;
  /** Hechos para la pregunta test clásica (por defecto 3; el quiz oficial usa 1). */
  questionCount?: number;
}): GeneratedQuizDayFile {
  const baseSeed = seedFromQuizDate(args.quizDate);
  const selected = selectFactsForDay({
    quizDate: args.quizDate,
    facts: args.facts,
    excludeFactIds: args.excludeFactIds,
    count: args.questionCount,
  });

  const questions = selected.map((fact, index) =>
    generateQuestionFromFact({
      fact,
      allFacts: args.facts,
      sortOrder: index + 1,
      seed: baseSeed,
    })
  );

  const factsById = new Map(args.facts.map((f) => [f.id, f]));
  assertGeneratedQuestions(questions, factsById, {
    expectedCount: args.questionCount ?? 3,
  });

  return {
    quiz_date: args.quizDate,
    title: args.title ?? QUIZ_OFFICIAL_TITLE,
    generated: true,
    official: { questions },
    _meta: {
      generated_at: new Date().toISOString(),
      fact_ids: questions.map((q) => q.fact_id),
      templates: questions.map((q) => q.template_id),
      sources: questions.map((q) => ({
        fact_id: q.fact_id,
        source_url: q.source_url,
        source_label: q.source_label,
      })),
    },
  };
}

export function attachFactsSourceMeta(
  day: GeneratedQuizDayFile,
  loadResult: QuizFactsLoadResult
): GeneratedQuizDayFile {
  return {
    ...day,
    _meta: {
      ...day._meta,
      generated_at: day._meta?.generated_at ?? new Date().toISOString(),
      fact_ids: day._meta?.fact_ids ?? [],
      templates: day._meta?.templates ?? [],
      sources: day._meta?.sources ?? [],
      facts_source: loadResult.source,
      facts_pool_size: loadResult.facts.length,
    },
  };
}

/** Genera el quiz del día leyendo hechos desde DB (fallback JSON estático). */
export async function generateQuizDayFromSources(args: {
  quizDate: string;
  excludeFactIds?: Set<string>;
  title?: string;
  factsDeps?: LoadQuizFactsDeps;
  questionCount?: number;
}): Promise<GeneratedQuizDayFile> {
  const loadResult = await loadQuizFactsWithFallback(args.factsDeps);
  const day = generateQuizDay({
    quizDate: args.quizDate,
    facts: loadResult.facts,
    excludeFactIds: args.excludeFactIds,
    title: args.title,
    questionCount: args.questionCount,
  });
  return attachFactsSourceMeta(day, loadResult);
}

export function listGeneratedDates(): string[] {
  if (!existsSync(GENERATED_DIR)) return [];
  return readdirSync(GENERATED_DIR)
    .filter((name) => DATE_RE.test(name.replace(/\.json$/, "")))
    .map((name) => name.replace(/\.json$/, ""))
    .sort();
}
