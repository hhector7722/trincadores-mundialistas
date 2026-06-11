import { getLatestSubmittedAttemptId } from "@/lib/quiz/queries";
import {
  formatQuizSlotStatusLabel,
  getQuizPlayCta,
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

function headlineForSlide(
  status: QuizSlotStatus,
  score: number | null,
  replayable: boolean
): string {
  if (status === "completed") {
    if (replayable) return "Vuelve a jugar";
    if (score !== null && score > 0) return `${score} pts`;
    return "Completado";
  }
  if (status === "in_progress") return "En curso";
  if (status === "expired") return "Sesion expirada";
  return "3 preguntas";
}

function descriptionForSlide(scoringMode: QuizScoringMode, competitive: boolean): string {
  if (scoringMode === "training" || !competitive) {
    return "10 segundos por pregunta — modo entrenamiento";
  }
  return "10 segundos por pregunta — hasta 3 puntos";
}

export function homeQuizSlideFromHub(hub: QuizDayHub): HomeQuizSlide | null {
  if (!hub.official) return null;

  const access = { isOwner: hub.isOwner };
  const status = getQuizSlotStatus(hub.official);
  const resultId = getLatestSubmittedAttemptId(hub.official);
  const cta =
    getQuizPlayCta(hub.official, {
      ...access,
      resultAttemptId: resultId,
    }) ?? { label: "Ir al quiz", href: "/quiz", entersPlay: false };
  const replayable = status === "completed" && cta.entersPlay;
  const score =
    hub.official.attempt?.status === "submitted"
      ? (hub.official.attempt.score ?? null)
      : null;

  return {
    status,
    statusLabel: formatQuizSlotStatusLabel(status),
    scoringMode: hub.official.quiz.scoring_mode,
    competitive: hub.competitive,
    headline: headlineForSlide(status, score, replayable),
    description: descriptionForSlide(hub.official.quiz.scoring_mode, hub.competitive),
    ctaLabel: cta.label,
    ctaHref: cta.href,
  };
}
