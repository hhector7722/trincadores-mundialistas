import {
  getLatestSubmittedAttemptId,
  getQuizPlayCta,
  getQuizSlotStatus,
  shouldShowQuizAlreadyPlayedModal,
} from "@/lib/quiz/slot-status";
import type { QuizDayHub } from "@/lib/quiz/types";

export type QuizEntryAction =
  | { type: "coming_soon" }
  | { type: "already_played" }
  | { type: "navigate"; href: string }
  | { type: "confirm_start"; href: string };

/** Decide qué hacer al pulsar Quiz o Jugar desde cualquier ruta. */
export function resolveQuizEntryAction(hub: QuizDayHub): QuizEntryAction {
  if (hub.publishHeld) {
    return { type: "coming_soon" };
  }

  if (!hub.official) {
    return { type: "navigate", href: "/quiz" };
  }

  const slot = hub.official;

  if (shouldShowQuizAlreadyPlayedModal(slot)) {
    return { type: "already_played" };
  }

  const playCta = getQuizPlayCta(slot, {
    resultAttemptId: getLatestSubmittedAttemptId(slot),
  });

  if (!playCta?.entersPlay) {
    return { type: "navigate", href: playCta?.href ?? "/quiz" };
  }

  const status = getQuizSlotStatus(slot);
  if (status === "in_progress") {
    return { type: "navigate", href: playCta.href };
  }

  return { type: "confirm_start", href: playCta.href };
}
