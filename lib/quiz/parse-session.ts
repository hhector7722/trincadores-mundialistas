import { parseQuizOptions } from "@/lib/quiz/options";
import type {
  QuizKind,
  QuizQuestionPublic,
  QuizScoringMode,
  QuizStartSession,
  QuizSummary,
} from "@/lib/quiz/types";

function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asKind(value: unknown): QuizKind | null {
  return value === "official" || value === "bonus" ? value : null;
}

function asScoringMode(value: unknown): QuizScoringMode | null {
  return value === "training" || value === "competitive" ? value : null;
}

function parseQuestion(raw: unknown): QuizQuestionPublic | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const id = asString(row.id);
  const sortOrder = asNumber(row.sort_order);
  const prompt = asString(row.prompt);
  const points = asNumber(row.points);
  if (!id || sortOrder === null || !prompt || points === null) return null;

  return {
    id,
    sort_order: sortOrder,
    prompt,
    options: parseQuizOptions(row.options),
    points,
    image_url: asString(row.image_url),
  };
}

function parseQuizSummary(raw: unknown): QuizSummary | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const id = asString(row.id);
  const title = asString(row.title);
  const kind = asKind(row.kind);
  const scoringMode = asScoringMode(row.scoring_mode);
  const maxPoints = asNumber(row.max_points);
  if (!id || !title || !kind || !scoringMode || maxPoints === null) return null;

  const quizDate = row.quiz_date;
  const quizDateStr =
    typeof quizDate === "string"
      ? quizDate.slice(0, 10)
      : quizDate === null
        ? null
        : null;

  return {
    id,
    title,
    quiz_date: quizDateStr,
    kind,
    scoring_mode: scoringMode,
    max_points: maxPoints,
  };
}

export function parseQuizStartSession(raw: unknown): QuizStartSession | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;

  const attemptId = asString(row.attempt_id);
  const expiresAt = asString(row.expires_at);
  const resumed = row.resumed === true;
  const quiz = parseQuizSummary(row.quiz);
  if (!attemptId || !expiresAt || !quiz) return null;

  const questionsRaw = Array.isArray(row.questions) ? row.questions : [];
  const questions = questionsRaw
    .map(parseQuestion)
    .filter((q): q is QuizQuestionPublic => q !== null)
    .sort((a, b) => a.sort_order - b.sort_order);

  return {
    attempt_id: attemptId,
    expires_at: expiresAt,
    resumed,
    quiz,
    questions,
  };
}
