import { getLatestSubmittedAttemptId } from "@/lib/quiz/queries";
import {
  formatQuizSlotStatusLabel,
  getQuizSlotStatus,
  type QuizSlotStatus,
} from "@/lib/quiz/slot-status";
import type { QuizDayHub, QuizScoringMode } from "@/lib/quiz/types";

export type HomeQuizSlide = {
  status: QuizSlotStatus;
  statusLabel: string;
  scoringMode: QuizScoringMode;
  competitive: boolean;
  headline: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
};

function ctaForStatus(
  status: QuizSlotStatus,
  resultHref: string | null
): { label: string; href: string } {
  if (status === "completed" && resultHref) {
    return { label: "Ver resultado", href: resultHref };
  }
  if (status === "in_progress") {
    return { label: "Continuar", href: "/quiz/play" };
  }
  if (status === "expired") {
    return { label: "Nuevo intento", href: "/quiz/play" };
  }
  return { label: "Jugar", href: "/quiz/play" };
}

function headlineForSlide(status: QuizSlotStatus, score: number | null): string {
  if (status === "completed") {
    if (score !== null && score > 0) return `${score} pts`;
    return "Completado";
  }
  if (status === "in_progress") return "En curso";
  if (status === "expired") return "Sesion expirada";
  return "3 preguntas";
}

function descriptionForSlide(scoringMode: QuizScoringMode, competitive: boolean): string {
  if (scoringMode === "training" || !competitive) {
    return "Modo entrenamiento — las respuestas se revelan al final";
  }
  return "Hasta 3 puntos si aciertas las 3 del dia";
}

export function homeQuizSlideFromHub(hub: QuizDayHub): HomeQuizSlide | null {
  if (!hub.official) return null;

  const status = getQuizSlotStatus(hub.official);
  const resultId = getLatestSubmittedAttemptId(hub.official);
  const resultHref = resultId ? `/quiz/result?attempt=${resultId}` : null;
  const cta = ctaForStatus(status, resultHref);
  const score =
    hub.official.attempt?.status === "submitted"
      ? (hub.official.attempt.score ?? null)
      : null;

  return {
    status,
    statusLabel: formatQuizSlotStatusLabel(status),
    scoringMode: hub.official.quiz.scoring_mode,
    competitive: hub.competitive,
    headline: headlineForSlide(status, score),
    description: descriptionForSlide(hub.official.quiz.scoring_mode, hub.competitive),
    ctaLabel: cta.label,
    ctaHref: cta.href,
  };
}
