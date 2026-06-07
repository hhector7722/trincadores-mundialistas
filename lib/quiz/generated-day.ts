import type { GeneratedQuizQuestion } from "@/lib/quiz/generate-question";
import { parseSeedQuizDayFile, type SeedQuizDayFile, type SeedQuizQuestion } from "@/lib/quiz/seed-day";

export type GeneratedQuizDayFile = {
  quiz_date: string;
  title?: string;
  generated?: boolean;
  official: {
    questions: GeneratedQuizQuestion[];
  };
  _meta?: {
    generated_at: string;
    fact_ids: string[];
    templates: string[];
    facts_source?: string;
    facts_pool_size?: number;
    sources: Array<{
      fact_id: string;
      source_url: string;
      source_label: string;
    }>;
  };
};

export function toSeedQuestion(q: GeneratedQuizQuestion): SeedQuizQuestion {
  return {
    sort_order: q.sort_order,
    prompt: q.prompt,
    image_url: q.image_url,
    options: q.options,
    correct_option_id: q.correct_option_id,
    fact_id: q.fact_id,
    source_url: q.source_url,
    source_label: q.source_label,
    template_id: q.template_id,
    category: q.category,
  };
}

export function generatedDayToSeedFile(day: GeneratedQuizDayFile): SeedQuizDayFile {
  return {
    quiz_date: day.quiz_date,
    title: day.title,
    official: {
      questions: day.official.questions.map(toSeedQuestion),
    },
  };
}

export function parseGeneratedOrSeedDay(raw: unknown): SeedQuizDayFile {
  const row = raw as GeneratedQuizDayFile;
  if (row?.official?.questions?.[0] && "fact_id" in row.official.questions[0]) {
    return generatedDayToSeedFile(row);
  }
  return parseSeedQuizDayFile(raw);
}

export function questionsMetaFromDay(day: GeneratedQuizDayFile | SeedQuizDayFile) {
  const questions = day.official.questions;
  return questions.map((q) => ({
    sort_order: q.sort_order,
    fact_id: "fact_id" in q && q.fact_id ? q.fact_id : null,
    source_url: "source_url" in q && q.source_url ? q.source_url : null,
    source_label: "source_label" in q && q.source_label ? q.source_label : null,
    template_id: "template_id" in q && q.template_id ? q.template_id : null,
    category: "category" in q && q.category ? q.category : null,
  }));
}
