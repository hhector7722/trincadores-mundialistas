import Link from "next/link";
import { Card } from "@/components/ui/card";
import type { QuizResultResponse } from "@/lib/quiz/types";
import { cn } from "@/lib/utils";

type QuizResultSummaryProps = {
  result: QuizResultResponse;
};

export function QuizResultSummary({ result }: QuizResultSummaryProps) {
  const countsForScore =
    result.kind === "official" && result.scoringMode === "competitive";

  return (
    <div className="space-y-4">
      <Card className="space-y-2 p-5 text-center">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--tm-muted)]">
          Resultado
        </p>
        {countsForScore ? (
          <p className="font-display text-4xl text-[var(--tm-accent)]">
            {result.score}/{result.maxPoints}
          </p>
        ) : (
          <p className="font-display text-2xl text-[var(--tm-fg)]">Entrenamiento</p>
        )}
        <p className="text-sm text-[var(--tm-muted)]">
          {countsForScore
            ? "Puntos sumados al ranking del quiz"
            : "Este intento no suma puntos"}
        </p>
      </Card>

      <div className="space-y-3">
        {result.responses.map((row, index) => (
          <Card key={row.questionId} className="space-y-2 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--tm-muted)]">
              Pregunta {index + 1}
            </p>
            <p className="text-sm text-[var(--tm-fg)]">{row.prompt}</p>
            <p
              className={cn(
                "text-sm font-medium",
                row.isCorrect ? "text-[var(--tm-positive)]" : "text-red-300"
              )}
            >
              {row.isCorrect ? "Correcta" : "Incorrecta"}
              {countsForScore && row.isCorrect ? ` · +${row.pointsAwarded} pt` : ""}
            </p>
          </Card>
        ))}
      </div>

      <div className="tm-quiz-actions flex flex-col gap-2">
        <Link
          href="/quiz"
          className="inline-flex min-h-12 items-center justify-center rounded-full bg-[var(--tm-accent)] px-5 text-sm font-semibold text-[var(--tm-primary-fg)]"
        >
          Volver al quiz
        </Link>
        {result.kind === "official" && (
          <Link
            href="/quiz/leaderboard"
            className="inline-flex min-h-12 items-center justify-center text-sm font-medium text-[var(--tm-primary)]"
          >
            Ver ranking del quiz
          </Link>
        )}
      </div>
    </div>
  );
}
