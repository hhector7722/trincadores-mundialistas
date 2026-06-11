import {
  getOptionSemanticType,
  type OptionSemanticType,
} from "@/lib/quiz/distractors";
import type { QuizFact } from "@/lib/quiz/facts";
import type { GeneratedQuizQuestion } from "@/lib/quiz/generate-question";

const OPTION_IDS = new Set(["a", "b", "c", "d"]);
const MIN_LABEL_LEN = 2;
const MIN_PROMPT_LEN = 12;

export type QualityResult = { ok: true } | { ok: false; error: string };

function labelMatchesSemanticType(label: string, semanticType: OptionSemanticType): boolean {
  const trimmed = label.trim();
  switch (semanticType) {
    case "title_count":
      return /^\d+\s+títulos$/i.test(trimmed);
    case "year":
      return /^(19|20)\d{2}$/.test(trimmed);
    case "mundial_edition":
      return /^Mundial (19|20)\d{2}$/i.test(trimmed);
    case "goal_stat":
      return trimmed.includes("segundos") || trimmed.includes("gol");
    case "record_stat":
      return /\d/.test(trimmed) || /mundial/i.test(trimmed) || /finales|goles|selecciones/i.test(trimmed);
    case "country":
      return (
        !/^\d+\s+títulos$/i.test(trimmed) &&
        !/^(19|20)\d{2}$/.test(trimmed) &&
        !trimmed.includes("segundos")
      );
    case "player":
      return (
        !/^\d+\s+títulos$/i.test(trimmed) &&
        !/^(19|20)\d{2}$/.test(trimmed) &&
        !trimmed.toLowerCase().startsWith("mundial ")
      );
    default:
      return true;
  }
}

export function validateSemanticCoherence(
  question: GeneratedQuizQuestion,
  fact?: QuizFact
): QualityResult {
  const semanticType = fact
    ? getOptionSemanticType(fact)
    : inferSemanticTypeFromQuestion(question);

  for (const opt of question.options) {
    if (!labelMatchesSemanticType(opt.label, semanticType)) {
      return {
        ok: false,
        error: `opcion "${opt.label}" no coincide con tipo semantico ${semanticType}.`,
      };
    }
  }

  return { ok: true };
}

function inferSemanticTypeFromQuestion(question: GeneratedQuizQuestion): OptionSemanticType {
  if (question.template_id === "titles_count") return "title_count";
  if (question.template_id === "first_winner" || question.template_id === "host_country") {
    return "country";
  }
  if (question.template_id === "top_scorer") return "player";
  if (question.category === "players") return "player";
  return "record_stat";
}

export function validateGeneratedQuestion(
  question: GeneratedQuizQuestion,
  fact?: QuizFact
): QualityResult {
  const prompt = question.prompt.trim();
  if (prompt.length < MIN_PROMPT_LEN) {
    return { ok: false, error: "prompt demasiado corto." };
  }

  if (!question.fact_id.trim()) {
    return { ok: false, error: "fact_id vacio." };
  }
  if (!question.source_url.startsWith("https://")) {
    return { ok: false, error: "source_url invalida." };
  }
  if (!question.source_label.trim()) {
    return { ok: false, error: "source_label vacio." };
  }

  if (question.options.length !== 4) {
    return { ok: false, error: "debe haber 4 opciones." };
  }

  const labels = new Set<string>();
  for (const opt of question.options) {
    if (!OPTION_IDS.has(opt.id)) {
      return { ok: false, error: `option id invalido: ${opt.id}` };
    }
    const label = opt.label.trim();
    if (label.length < MIN_LABEL_LEN) {
      return { ok: false, error: "option label demasiado corto." };
    }
    const key = label.toLowerCase();
    if (labels.has(key)) {
      return { ok: false, error: "opciones duplicadas." };
    }
    labels.add(key);
  }

  const correct = question.options.find((o) => o.id === question.correct_option_id);
  if (!correct) {
    return { ok: false, error: "correct_option_id no encontrado." };
  }

  const semantic = validateSemanticCoherence(question, fact);
  if (!semantic.ok) return semantic;

  return { ok: true };
}

export function assertGeneratedQuestions(
  questions: GeneratedQuizQuestion[],
  factsById?: Map<string, QuizFact>
): void {
  if (questions.length !== 3) {
    throw new Error("El dia debe tener exactamente 3 preguntas.");
  }
  const factIds = new Set<string>();
  const prompts = new Set<string>();
  for (const [index, q] of questions.entries()) {
    const fact = factsById?.get(q.fact_id);
    const result = validateGeneratedQuestion(q, fact);
    if (!result.ok) {
      throw new Error(`Pregunta ${index + 1}: ${result.error}`);
    }
    if (factIds.has(q.fact_id)) {
      throw new Error(`fact_id duplicado en el dia: ${q.fact_id}`);
    }
    factIds.add(q.fact_id);

    const promptKey = q.prompt.trim().toLowerCase();
    if (prompts.has(promptKey)) {
      throw new Error(`prompt duplicado en el dia: ${q.prompt}`);
    }
    prompts.add(promptKey);
  }
}
