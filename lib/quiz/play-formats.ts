import type { QuizQuestionPlay } from "@/lib/quiz/types";
import { classicQuizQuestionShowsImage } from "@/lib/quiz/date";

export type QuizPlayQuestionFormat =
  | "classic"
  | "image_trivia"
  | "guess_player_silhouette"
  | "score_gap"
  | "jersey_pick";

export type QuizPlayFormatMeta = {
  sort_order: number;
  format: QuizPlayQuestionFormat;
  reveal_image_url?: string | null;
  jerseyOptions?: Array<{
    id: string;
    team: string;
    year: number;
    kit: "home" | "away";
    imageKey: string;
    isCorrect?: boolean;
  }>;
};

const OPTION_IDS = ["a", "b", "c", "d"] as const;

export function parsePlayFormats(settings: unknown): QuizPlayFormatMeta[] {
  if (!settings || typeof settings !== "object") return [];
  const row = settings as Record<string, unknown>;
  const raw = row.play_formats;
  if (!Array.isArray(raw)) return [];

  const parsed: QuizPlayFormatMeta[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const entry = item as Record<string, unknown>;
    const sortOrder = entry.sort_order;
    const format = entry.format;
    if (typeof sortOrder !== "number" || !Number.isInteger(sortOrder)) continue;
    if (
      format !== "classic" &&
      format !== "image_trivia" &&
      format !== "guess_player_silhouette" &&
      format !== "score_gap" &&
      format !== "jersey_pick"
    ) {
      continue;
    }
    const reveal =
      typeof entry.reveal_image_url === "string" ? entry.reveal_image_url.trim() || null : null;
      
    const jerseyOptionsRaw = entry.jerseyOptions;
    const jerseyOptions = Array.isArray(jerseyOptionsRaw) ? jerseyOptionsRaw as any : undefined;

    parsed.push({
      sort_order: sortOrder,
      format,
      reveal_image_url: reveal,
      jerseyOptions,
    });
  }

  return parsed.sort((a, b) => a.sort_order - b.sort_order);
}

export function enrichQuestionsWithPlayFormats(
  questions: QuizQuestionPlay[],
  formats: QuizPlayFormatMeta[],
  quizDate?: string | null
): QuizQuestionPlay[] {
  const withFormats = (() => {
    if (!formats.length) return questions;

    const bySort = new Map(formats.map((f) => [f.sort_order, f]));

    return questions.map((question) => {
      const meta = bySort.get(question.sort_order);
      if (!meta) return question;
      return {
        ...question,
        format: meta.format,
        reveal_image_url: meta.reveal_image_url ?? null,
        jerseyOptions: meta.jerseyOptions,
      };
    });
  })();

  return applyClassicQuestionImagePolicy(withFormats, quizDate);
}

/** Pregunta 1 sin imagen a partir de QUIZ_CLASSIC_NO_IMAGE_FROM_DATE. */
export function applyClassicQuestionImagePolicy(
  questions: QuizQuestionPlay[],
  quizDate?: string | null
): QuizQuestionPlay[] {
  if (!quizDate || classicQuizQuestionShowsImage(quizDate)) return questions;

  return questions.map((question) =>
    question.sort_order === 1 ? { ...question, image_url: null } : question
  );
}

export function defaultClassicPlayFormats(questionCount: number): QuizPlayFormatMeta[] {
  return Array.from({ length: questionCount }, (_, index) => ({
    sort_order: index + 1,
    format: "classic" as const,
  }));
}

import type { DrillQuestionPick } from "@/lib/quiz/compose-drill-session";

/** Aplica formatos y política de imagen por quiz origen (modo entrenar). */
export function enrichDrillQuestions(
  questions: QuizQuestionPlay[],
  picks: DrillQuestionPick[]
): QuizQuestionPlay[] {
  const byQuestionId = new Map(picks.map((pick) => [pick.questionId, pick]));

  const withFormats = questions.map((question) => {
    const pick = byQuestionId.get(question.id);
    if (!pick) return question;
    return {
      ...question,
      sort_order: pick.displaySortOrder,
      format: pick.format,
      reveal_image_url: pick.revealImageUrl,
    };
  });

  return withFormats.map((question) => {
    const pick = byQuestionId.get(question.id);
    if (!pick || question.format !== "classic") return question;
    const showImage = classicQuizQuestionShowsImage(pick.quizDate);
    if (showImage || question.sort_order !== 1) return question;
    return { ...question, image_url: null };
  });
}

export function labOptionIdsToSeed(
  options: Array<{ id: string; label: string }>,
  correctOptionId: string
): { options: Array<{ id: string; label: string }>; correct_option_id: string } {
  const mapped = options.slice(0, 4).map((option, index) => ({
    id: OPTION_IDS[index] ?? `opt_${index + 1}`,
    label: option.label,
  }));

  const correctIndex = options.findIndex((option) => option.id === correctOptionId);
  const correct_option_id = mapped[correctIndex >= 0 ? correctIndex : 0]?.id ?? "a";

  return { options: mapped, correct_option_id };
}
