import type { QuizKind, QuizScoringMode } from "@/lib/quiz/types";

export const QUIZ_OFFICIAL_TITLE = "¿Quién sabe más de Mundiales?";

export type SeedQuizOption = {
  id: string;
  label: string;
};

export type SeedQuizQuestion = {
  sort_order: number;
  prompt: string;
  image_url?: string | null;
  options: SeedQuizOption[];
  correct_option_id: string;
};

export type SeedBonusBlock = {
  author_display_name?: string;
  question: SeedQuizQuestion;
};

export type SeedQuizDayFile = {
  quiz_date: string;
  title?: string;
  official: {
    questions: SeedQuizQuestion[];
  };
  bonus?: SeedBonusBlock | null;
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const OPTION_IDS = new Set(["a", "b", "c", "d"]);

export function parseSeedQuizDayFile(raw: unknown): SeedQuizDayFile {
  if (!raw || typeof raw !== "object") {
    throw new Error("JSON invalido: se esperaba un objeto.");
  }

  const row = raw as Record<string, unknown>;
  const quizDate = typeof row.quiz_date === "string" ? row.quiz_date.trim() : "";
  if (!DATE_RE.test(quizDate)) {
    throw new Error("quiz_date invalido. Usa formato YYYY-MM-DD.");
  }

  const official = row.official;
  if (!official || typeof official !== "object") {
    throw new Error("Falta bloque official con questions.");
  }

  const questions = (official as Record<string, unknown>).questions;
  if (!Array.isArray(questions) || questions.length !== 3) {
    throw new Error("official.questions debe tener exactamente 3 preguntas.");
  }

  const parsedOfficial = questions.map((q, index) => validateQuestion(q, `official.questions[${index}]`));

  let bonus: SeedBonusBlock | null = null;
  if (row.bonus !== undefined && row.bonus !== null) {
    if (typeof row.bonus !== "object") {
      throw new Error("bonus invalido.");
    }
    const bonusRow = row.bonus as Record<string, unknown>;
    if (!bonusRow.question) {
      throw new Error("bonus.question es obligatorio si hay bonus.");
    }
    bonus = {
      author_display_name:
        typeof bonusRow.author_display_name === "string"
          ? bonusRow.author_display_name.trim()
          : undefined,
      question: validateQuestion(bonusRow.question, "bonus.question"),
    };
    if (bonus.question.sort_order !== 1) {
      throw new Error("bonus.question.sort_order debe ser 1.");
    }
  }

  const title =
    typeof row.title === "string" && row.title.trim()
      ? row.title.trim()
      : QUIZ_OFFICIAL_TITLE;

  return {
    quiz_date: quizDate,
    title,
    official: { questions: parsedOfficial },
    bonus,
  };
}

function validateQuestion(raw: unknown, label: string): SeedQuizQuestion {
  if (!raw || typeof raw !== "object") {
    throw new Error(`${label}: pregunta invalida.`);
  }

  const row = raw as Record<string, unknown>;
  const sortOrder = row.sort_order;
  const prompt = typeof row.prompt === "string" ? row.prompt.trim() : "";
  const correctOptionId =
    typeof row.correct_option_id === "string" ? row.correct_option_id.trim() : "";

  if (typeof sortOrder !== "number" || !Number.isInteger(sortOrder) || sortOrder < 1) {
    throw new Error(`${label}: sort_order invalido.`);
  }
  if (!prompt) {
    throw new Error(`${label}: prompt vacio.`);
  }

  if (!Array.isArray(row.options) || row.options.length !== 4) {
    throw new Error(`${label}: options debe tener 4 respuestas.`);
  }

  const options: SeedQuizOption[] = [];
  const seen = new Set<string>();
  for (const [index, item] of row.options.entries()) {
    if (!item || typeof item !== "object") {
      throw new Error(`${label}.options[${index}] invalido.`);
    }
    const opt = item as Record<string, unknown>;
    const id = typeof opt.id === "string" ? opt.id.trim().toLowerCase() : "";
    const optionLabel = typeof opt.label === "string" ? opt.label.trim() : "";
    if (!OPTION_IDS.has(id)) {
      throw new Error(`${label}.options[${index}]: id debe ser a, b, c o d.`);
    }
    if (!optionLabel) {
      throw new Error(`${label}.options[${index}]: label vacio.`);
    }
    if (seen.has(id)) {
      throw new Error(`${label}: ids de opciones duplicados.`);
    }
    seen.add(id);
    options.push({ id, label: optionLabel });
  }

  if (!OPTION_IDS.has(correctOptionId)) {
    throw new Error(`${label}: correct_option_id invalido.`);
  }
  if (!options.some((o) => o.id === correctOptionId)) {
    throw new Error(`${label}: correct_option_id no existe en options.`);
  }

  const imageUrl =
    row.image_url === null || row.image_url === undefined
      ? null
      : typeof row.image_url === "string"
        ? row.image_url.trim() || null
        : null;

  return {
    sort_order: sortOrder,
    prompt,
    image_url: imageUrl,
    options,
    correct_option_id: correctOptionId,
  };
}

export function scoringFieldsForMode(
  kind: QuizKind,
  scoringMode: QuizScoringMode
): { max_points: number; question_points: number } {
  if (kind === "bonus" || scoringMode === "training") {
    return { max_points: 0, question_points: 0 };
  }
  return { max_points: 3, question_points: 1 };
}
