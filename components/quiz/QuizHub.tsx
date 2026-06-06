import Link from "next/link";
import { QuizModeBadge } from "@/components/quiz/QuizModeBadge";
import { QuizSlotCard } from "@/components/quiz/QuizSlotCard";
import { Card } from "@/components/ui/card";
import { getLatestSubmittedAttemptId } from "@/lib/quiz/queries";
import type { QuizDayHub } from "@/lib/quiz/types";

type QuizHubProps = {
  hub: QuizDayHub;
};

function formatQuizDate(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export function QuizHub({ hub }: QuizHubProps) {
  const officialScoring = hub.official?.quiz.scoring_mode ?? "training";
  const bonusAuthor =
    typeof hub.bonus?.quiz.settings_json?.author_display_name === "string"
      ? hub.bonus.quiz.settings_json.author_display_name
      : null;

  const officialResultId = getLatestSubmittedAttemptId(hub.official);
  const bonusResultId = getLatestSubmittedAttemptId(hub.bonus);

  const hasAnyQuiz = Boolean(hub.official || hub.bonus);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <QuizModeBadge competitive={hub.competitive} scoringMode={officialScoring} />
        <span className="text-xs text-[var(--tm-muted)] capitalize">
          {formatQuizDate(hub.quizDate)}
        </span>
      </div>

      {!hasAnyQuiz ? (
        <Card>
          <p className="text-sm text-[var(--tm-muted)]">
            Todavia no hay quiz publicado para hoy. Vuelve mas tarde.
          </p>
        </Card>
      ) : (
        <>
          <QuizSlotCard
            title="Oficial"
            subtitle="3 preguntas del dia"
            slot={hub.official}
            playHref="/quiz/play"
            resultHref={
              officialResultId ? `/quiz/result?attempt=${officialResultId}` : null
            }
            pointsLabel={
              officialScoring === "training"
                ? "Modo entrenamiento — no suma puntos"
                : "Hasta 3 puntos si aciertas las 3"
            }
          />

          {hub.bonus && (
            <QuizSlotCard
              title="Bonus del grupo"
              subtitle={
                bonusAuthor
                  ? `Pregunta de ${bonusAuthor} — no puntua`
                  : "Pregunta extra — no puntua"
              }
              slot={hub.bonus}
              playHref="/quiz/play?kind=bonus"
              resultHref={
                bonusResultId ? `/quiz/result?attempt=${bonusResultId}` : null
              }
              pointsLabel="Solo por diversion. No afecta al ranking."
            />
          )}
        </>
      )}

      <Link
        href="/quiz/leaderboard"
        className="block text-center text-sm font-medium text-[var(--tm-primary)]"
      >
        Ver ranking del quiz
      </Link>
    </div>
  );
}
