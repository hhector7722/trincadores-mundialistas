import type { QuizOption } from "@/lib/quiz/types";

export function parseQuizOptions(raw: unknown): QuizOption[] {
  if (!Array.isArray(raw)) return [];

  const parsed: QuizOption[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const id = typeof row.id === "string" ? row.id.trim() : "";
    const label = typeof row.label === "string" ? row.label.trim() : "";
    if (!id || !label) continue;
    parsed.push({ id, label });
  }
  return parsed;
}

export function validateQuizAnswers(
  questionIds: string[],
  answers: Record<string, string>
): { ok: true } | { ok: false; error: string } {
  if (!questionIds.length) {
    return { ok: false, error: "No hay preguntas para enviar." };
  }

  for (const questionId of questionIds) {
    const optionId = answers[questionId]?.trim();
    if (!optionId) {
      return { ok: false, error: "Faltan respuestas. Completa todas las preguntas." };
    }
  }

  return { ok: true };
}
