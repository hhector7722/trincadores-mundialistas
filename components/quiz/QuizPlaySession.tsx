"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { startQuiz, submitQuiz } from "@/actions/quiz";
import { QuizQuestionStage } from "@/components/quiz/QuizQuestionStage";
import { Button } from "@/components/ui/button";
import type { QuizKind, QuizStartSession } from "@/lib/quiz/types";

type QuizPlaySessionProps = {
  poolId: string;
  quizId: string;
  kind: QuizKind;
};

function formatCountdown(expiresAt: string): string {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return "0:00";
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${String(sec).padStart(2, "0")}`;
}

export function QuizPlaySession({ poolId, quizId, kind }: QuizPlaySessionProps) {
  const router = useRouter();
  const [session, setSession] = useState<QuizStartSession | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [confirming, setConfirming] = useState(false);
  const [countdown, setCountdown] = useState("");
  const [loading, startLoading] = useTransition();
  const [submitting, startSubmitting] = useTransition();

  useEffect(() => {
    startLoading(async () => {
      const result = await startQuiz(poolId, quizId);
      if (!result.ok) {
        setLoadError(result.error);
        return;
      }
      setSession(result.data);
      setLoadError(null);
    });
  }, [poolId, quizId]);

  useEffect(() => {
    if (!session?.expires_at) return;
    const tick = () => setCountdown(formatCountdown(session.expires_at));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [session?.expires_at]);

  const questions = session?.questions ?? [];
  const currentQuestion = questions[step] ?? null;
  const allAnswered = useMemo(
    () => questions.every((q) => Boolean(answers[q.id])),
    [questions, answers]
  );

  function handleSelect(optionId: string) {
    if (!currentQuestion || confirming) return;
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: optionId }));

    if (step < questions.length - 1) {
      window.setTimeout(() => setStep((s) => s + 1), 180);
    } else {
      setConfirming(true);
    }
  }

  function handleSubmit() {
    if (!session) return;
    setSubmitError(null);
    startSubmitting(async () => {
      const result = await submitQuiz(poolId, session.attempt_id, answers);
      if (!result.ok) {
        setSubmitError(result.error);
        return;
      }
      router.push(`/quiz/result?attempt=${session.attempt_id}`);
      router.refresh();
    });
  }

  if (loadError) {
    return (
      <CardMessage
        title="No se pudo iniciar"
        body={loadError}
        actionHref="/quiz"
        actionLabel="Volver al quiz"
      />
    );
  }

  if (loading || !session) {
    return (
      <div className="tm-quiz-stage rounded-2xl border border-[var(--tm-border)] bg-[var(--tm-surface)] p-6 text-center text-sm text-[var(--tm-muted)]">
        Preparando preguntas...
      </div>
    );
  }

  if (confirming) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="tm-quiz-stage space-y-4 rounded-2xl border border-[var(--tm-border)] bg-[var(--tm-surface)] p-5">
          <p className="font-display text-lg uppercase tracking-wide text-[var(--tm-fg)]">
            ¿Enviar respuestas?
          </p>
          <p className="text-sm text-[var(--tm-muted)]">
            Revisaste las {questions.length} preguntas. Las respuestas correctas se
            revelan al final.
          </p>
          {submitError && (
            <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {submitError}
            </p>
          )}
        </div>
        <div className="tm-quiz-actions mt-4 flex flex-col gap-2">
          <Button
            type="button"
            className="w-full"
            disabled={submitting || !allAnswered}
            onClick={handleSubmit}
          >
            {submitting ? "Enviando..." : "Confirmar y ver resultado"}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={submitting}
            onClick={() => {
              setConfirming(false);
              setStep(questions.length - 1);
            }}
          >
            Revisar última pregunta
          </Button>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <CardMessage
        title="Sin preguntas"
        body="Este quiz no tiene preguntas publicadas."
        actionHref="/quiz"
        actionLabel="Volver"
      />
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex shrink-0 items-center justify-between gap-3">
        <Link href="/quiz" className="text-sm font-medium text-[var(--tm-primary)]">
          Volver
        </Link>
        <p className="text-xs text-[var(--tm-muted)]">
          {kind === "bonus" ? "Bonus" : "Oficial"} · {countdown || "--:--"}
        </p>
      </div>

      <div className="tm-quiz-stage-scroll flex min-h-0 flex-1 flex-col gap-4">
        <QuizQuestionStage
          question={currentQuestion}
          questionIndex={step}
          totalQuestions={questions.length}
          selectedOptionId={answers[currentQuestion.id] ?? null}
          locked={Boolean(answers[currentQuestion.id])}
          onSelect={handleSelect}
        />

        {step > 0 && !answers[currentQuestion.id] && (
          <Button
            type="button"
            variant="ghost"
            className="w-full shrink-0"
            onClick={() => setStep((s) => s - 1)}
          >
            Pregunta anterior
          </Button>
        )}
      </div>
    </div>
  );
}

function CardMessage({
  title,
  body,
  actionHref,
  actionLabel,
}: {
  title: string;
  body: string;
  actionHref: string;
  actionLabel: string;
}) {
  return (
    <div className="space-y-4 rounded-2xl border border-[var(--tm-border)] bg-[var(--tm-surface)] p-5">
      <p className="font-display text-lg uppercase tracking-wide text-[var(--tm-fg)]">
        {title}
      </p>
      <p className="text-sm text-[var(--tm-muted)]">{body}</p>
      <Link href={actionHref} className="inline-flex min-h-12 items-center text-sm font-medium text-[var(--tm-primary)]">
        {actionLabel}
      </Link>
    </div>
  );
}
