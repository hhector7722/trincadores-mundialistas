import type { QuizFact } from "@/lib/quiz/facts";

export type QuestionTemplateResult = {
  prompt: string;
  correctLabel: string;
  template_id: string;
};

type TemplateFn = (fact: QuizFact) => QuestionTemplateResult | null;

const TEMPLATES: Record<string, TemplateFn> = {
  first_winner: (fact) => {
    if (!fact.year) return null;
    return {
      template_id: "first_winner",
      prompt: `¿Qué selección ganó el Mundial de ${fact.year}?`,
      correctLabel: fact.value,
    };
  },
  host_country: (fact) => {
    if (!fact.year) return null;
    return {
      template_id: "host_country",
      prompt: `¿En qué país se disputó el Mundial ${fact.year}?`,
      correctLabel: fact.value,
    };
  },
  top_scorer: (fact) => ({
    template_id: "top_scorer",
    prompt: "¿Quién es el máximo goleador histórico en la historia de los Mundiales?",
    correctLabel: fact.value,
  }),
  titles_count: (fact) => ({
    template_id: "titles_count",
    prompt: `¿Cuántas veces ha ganado el Mundial ${fact.subject}?`,
    correctLabel: `${fact.value} títulos`,
  }),
  record_value: (fact) => ({
    template_id: "record_value",
    prompt: `¿Cuál es el récord de ${fact.subject} en Mundiales?`,
    correctLabel: fact.value,
  }),
  curiosity: (fact) => ({
    template_id: "curiosity",
    prompt: fact.subject,
    correctLabel: fact.value,
  }),
};

export function renderQuestionFromFact(fact: QuizFact): QuestionTemplateResult | null {
  const fn = TEMPLATES[fact.fact_type];
  if (!fn) return null;
  const result = fn(fact);
  if (!result?.prompt.trim() || !result.correctLabel.trim()) return null;
  return result;
}
