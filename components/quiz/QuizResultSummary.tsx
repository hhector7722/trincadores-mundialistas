import Link from "next/link";
import { Card } from "@/components/ui/card";
import { QuizReplayButton } from "@/components/quiz/QuizReplayButton";

type QuizResultSummaryProps = {
  score: number;
  maxPoints: number;
  scoringMode: "training" | "competitive";
  kind: "official" | "bonus";
  canReplay: boolean;
};

export function QuizResultSummary({
  score,
  maxPoints,
  scoringMode,
  kind,
  canReplay,
}: QuizResultSummaryProps) {
  const countsForScore = kind === "official" && scoringMode === "competitive";

  return (
    <div className="space-y-4">
      <Card className="space-y-3 p-5 text-center">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--tm-muted)]">
          Resultado
        </p>
        {countsForScore ? (
          <p className="font-display text-4xl text-[var(--tm-accent)]">
            {score}/{maxPoints}
          </p>
        ) : (
          <p className="font-display text-2xl text-[var(--tm-fg)]">Entrenamiento</p>
        )}
        <p className="text-sm text-[var(--tm-muted)]">
          {countsForScore
            ? "Puntos sumados al ranking del quiz"
            : "Este intento no suma puntos"}
        </p>
        {countsForScore && (
          <p className="text-xs text-[var(--tm-muted)]">
            {score === maxPoints
              ? "Pleno — las tres correctas"
              : score > 0
                ? `${score} acierto${score === 1 ? "" : "s"}`
                : "Sin aciertos esta vez"}
          </p>
        )}
      </Card>

      <div className="tm-quiz-actions flex flex-col gap-2">
        {canReplay && <QuizReplayButton />}
        <Link
          href="/quiz"
          className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[var(--tm-border)] bg-[var(--tm-surface)] px-5 text-sm font-semibold text-[var(--tm-fg)]"
        >
          Volver al quiz
        </Link>
        {kind === "official" && (
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
