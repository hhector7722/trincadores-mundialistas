import type { GeneratedQuizQuestion } from "@/lib/quiz/generate-question";

const OPTION_IDS = new Set(["a", "b", "c", "d"]);
const MIN_LABEL_LEN = 2;
const MIN_PROMPT_LEN = 12;

export type QualityResult = { ok: true } | { ok: false; error: string };

export function validateGeneratedQuestion(question: GeneratedQuizQuestion): QualityResult {
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

  return { ok: true };
}

export function assertGeneratedQuestions(questions: GeneratedQuizQuestion[]): void {
  if (questions.length !== 3) {
    throw new Error("El dia debe tener exactamente 3 preguntas.");
  }
  const factIds = new Set<string>();
  for (const [index, q] of questions.entries()) {
    const result = validateGeneratedQuestion(q);
    if (!result.ok) {
      throw new Error(`Pregunta ${index + 1}: ${result.error}`);
    }
    if (factIds.has(q.fact_id)) {
      throw new Error(`fact_id duplicado en el dia: ${q.fact_id}`);
    }
    factIds.add(q.fact_id);
  }
}
