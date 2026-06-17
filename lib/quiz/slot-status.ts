import { isQuizWindowOpen } from "@/lib/quiz/date";
import {
  QUIZ_DRILL_PLAY_HREF,
  QUIZ_DRILL_PLAY_RESUME_HREF,
  QUIZ_PLAY_HREF,
  QUIZ_PLAY_RESUME_HREF,
} from "@/lib/quiz/play-routes";
import type { QuizDayHub, QuizDaySlot, QuizScoringMode } from "@/lib/quiz/types";

export type QuizSlotStatus =
  | "unavailable"
  | "ready"
  | "in_progress"
  | "expired"
  | "completed";

export function getQuizSlotStatus(slot: QuizDaySlot | null): QuizSlotStatus {
  if (!slot) return "unavailable";

  if (!isQuizWindowOpen(slot.quiz)) {
    if (slot.attempt?.status === "submitted") return "completed";
    if (slot.attempt?.status === "in_progress") return "expired";
    return "unavailable";
  }

  if (!slot.attempt) return "ready";

  if (slot.attempt.status === "submitted") return "completed";

  if (slot.attempt.status === "in_progress") {
    if (
      slot.attempt.expires_at &&
      Date.now() >= new Date(slot.attempt.expires_at).getTime()
    ) {
      return "expired";
    }
    return "in_progress";
  }

  if (slot.attempt.status === "expired") return "expired";

  return "ready";
}

export type QuizPlayOptions = {
  resultAttemptId?: string | null;
};

export function getLatestSubmittedAttemptId(slot: QuizDaySlot | null): string | null {
  if (!slot) return null;
  if (slot.countingSubmittedAttemptId) return slot.countingSubmittedAttemptId;
  if (!slot.attempt || slot.attempt.status !== "submitted") return null;
  if (slot.attempt.counts_for_score === false) return null;
  return slot.attempt.id;
}

export function canOpenQuizPlay(
  slot: QuizDaySlot | null,
  scoringMode?: QuizScoringMode,
): boolean {
  if (!slot) return false;
  const mode = scoringMode ?? slot.quiz.scoring_mode;
  const status = getQuizSlotStatus(slot);

  if (status === "completed") {
    return mode === "training";
  }

  return status === "ready" || status === "in_progress" || status === "expired";
}

export function canReplayQuiz(slot: QuizDaySlot | null): boolean {
  if (!slot) return false;
  if (getQuizSlotStatus(slot) !== "completed") return false;
  return canOpenQuizPlay(slot);
}

export type QuizPlayCta = {
  label: string;
  href: string;
  entersPlay: boolean;
};

export function getQuizPlayCta(
  slot: QuizDaySlot | null,
  options?: QuizPlayOptions
): QuizPlayCta | null {
  if (!slot) return null;

  const status = getQuizSlotStatus(slot);
  const canPlay = canOpenQuizPlay(slot);

  if (canPlay) {
    if (status === "in_progress") {
      return {
        label: "Continuar",
        href: QUIZ_PLAY_RESUME_HREF,
        entersPlay: true,
      };
    }
    if (status === "completed") {
      return {
        label: "Jugar de nuevo",
        href: QUIZ_PLAY_HREF,
        entersPlay: true,
      };
    }
    if (status === "expired") {
      return {
        label: "Nuevo intento",
        href: QUIZ_PLAY_HREF,
        entersPlay: true,
      };
    }
    return { label: "Jugar", href: QUIZ_PLAY_HREF, entersPlay: true };
  }

  if (status === "completed") {
    const attemptId = options?.resultAttemptId?.trim();
    if (attemptId) {
      return {
        label: "Jugar",
        href: `/quiz/result?attempt=${attemptId}`,
        entersPlay: false,
      };
    }
    return { label: "Ya jugado", href: "/quiz", entersPlay: false };
  }

  return { label: "Ir al quiz", href: "/quiz", entersPlay: false };
}

export function canOpenQuizDrill(slot: QuizDaySlot | null): boolean {
  if (!slot) return false;
  if (!isQuizWindowOpen(slot.quiz)) return false;
  return Boolean(slot.countingSubmittedAttemptId);
}

export function canStartQuizDrill(
  hub: Pick<QuizDayHub, "drillAvailable" | "official">,
): boolean {
  return hub.drillAvailable && hub.official != null && canOpenQuizDrill(hub.official);
}

export type QuizHubAction = QuizPlayCta & {
  action: "play" | "drill" | "result" | "hub";
};

/** CTAs del hub cuando el diario ya esta jugado o listo para jugar/entrenar. */
export function getQuizHubActions(
  hub: Pick<QuizDayHub, "drillAvailable" | "official">,
): QuizHubAction[] {
  const slot = hub.official;
  if (!slot) {
    return [{ action: "hub", label: "Ir al quiz", href: "/quiz", entersPlay: false }];
  }

  const status = getQuizSlotStatus(slot);
  const resultAttemptId = getLatestSubmittedAttemptId(slot);

  if (canStartQuizDrill(hub)) {
    const drillInProgress =
      slot.drillAttempt?.status === "in_progress" &&
      slot.drillAttempt.expires_at &&
      Date.now() < new Date(slot.drillAttempt.expires_at).getTime();

    const actions: QuizHubAction[] = [
      {
        action: "drill",
        label: drillInProgress ? "Continuar entreno" : "Entrenar",
        href: drillInProgress ? QUIZ_DRILL_PLAY_RESUME_HREF : QUIZ_DRILL_PLAY_HREF,
        entersPlay: true,
      },
    ];

    if (resultAttemptId) {
      actions.push({
        action: "result",
        label: "Ver resultado",
        href: `/quiz/result?attempt=${resultAttemptId}`,
        entersPlay: false,
      });
    }

    return actions;
  }

  const playCta = getQuizPlayCta(slot, { resultAttemptId });
  if (!playCta) {
    return [{ action: "hub", label: "Ir al quiz", href: "/quiz", entersPlay: false }];
  }

  if (playCta.entersPlay) {
    return [{ action: "play", ...playCta }];
  }

  if (status === "completed" && resultAttemptId) {
    return [
      {
        action: "result",
        label: "Ver resultado",
        href: `/quiz/result?attempt=${resultAttemptId}`,
        entersPlay: false,
      },
    ];
  }

  return [{ action: playCta.href.startsWith("/quiz/result") ? "result" : "hub", ...playCta }];
}

/** Modal "ya jugado hoy" — competitivo completado sin rejugada. */
export function shouldShowQuizAlreadyPlayedModal(
  slot: QuizDaySlot | null,
): boolean {
  if (!slot) return false;
  return (
    getQuizSlotStatus(slot) === "completed" &&
    !canOpenQuizPlay(slot)
  );
}

export function formatQuizSlotStatusLabel(status: QuizSlotStatus): string {
  switch (status) {
    case "unavailable":
      return "No disponible";
    case "ready":
      return "Pendiente";
    case "in_progress":
      return "En curso";
    case "expired":
      return "Sesion expirada";
    case "completed":
      return "Completado";
  }
}
