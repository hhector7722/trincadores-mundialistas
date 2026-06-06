import { buildDistractorLabels, buildMcqOptions } from "@/lib/quiz/distractors";
import type { QuizFact } from "@/lib/quiz/facts";
import { renderQuestionFromFact } from "@/lib/quiz/question-templates";
import { mulberry32 } from "@/lib/quiz/rng";

export type GeneratedQuizQuestion = {
  sort_order: number;
  prompt: string;
  image_url: string | null;
  options: { id: string; label: string }[];
  correct_option_id: string;
  fact_id: string;
  source_url: string;
  source_label: string;
  template_id: string;
  category: string;
};

export function generateQuestionFromFact(args: {
  fact: QuizFact;
  allFacts: QuizFact[];
  sortOrder: number;
  seed: number;
}): GeneratedQuizQuestion {
  const rendered = renderQuestionFromFact(args.fact);
  if (!rendered) {
    throw new Error(`No se pudo renderizar plantilla para fact ${args.fact.id}.`);
  }

  const rng = mulberry32(args.seed ^ args.sortOrder);
  const distractors = buildDistractorLabels(
    args.fact,
    rendered.correctLabel,
    args.allFacts,
    rng,
    3
  );

  if (distractors.length < 3) {
    throw new Error(`Distractores insuficientes para fact ${args.fact.id}.`);
  }

  const mcq = buildMcqOptions(rendered.correctLabel, distractors, rng);

  return {
    sort_order: args.sortOrder,
    prompt: rendered.prompt,
    image_url: args.fact.image_url ?? null,
    options: mcq.options,
    correct_option_id: mcq.correct_option_id,
    fact_id: args.fact.id,
    source_url: args.fact.source_url,
    source_label: args.fact.source_label,
    template_id: rendered.template_id,
    category: args.fact.category,
  };
}
