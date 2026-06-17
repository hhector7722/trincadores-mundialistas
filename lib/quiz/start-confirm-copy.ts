import { getQuizSlotStatus } from "@/lib/quiz/slot-status";
import type { QuizDayHub } from "@/lib/quiz/types";

export function buildQuizStartConfirmCopy(hub: QuizDayHub): { title: string; body: string } {
  const inProgress =
    hub.official != null && getQuizSlotStatus(hub.official) === "in_progress";

  if (inProgress) {
    return {
      title: "Continuar quiz",
      body: "Tienes un intento en curso. ¿Seguimos donde lo dejaste?",
    };
  }

  const competitive =
    hub.competitive && hub.official?.quiz.scoring_mode === "competitive";

  if (competitive) {
    return {
      title: "Quiz diario",
      body:
        "3 preguntas con 10 segundos cada una. Solo tienes un intento al día y cuenta para el ranking.",
    };
  }

  return {
    title: "Quiz diario",
    body: "3 preguntas con 10 segundos cada una. Modo entrenamiento.",
  };
}
