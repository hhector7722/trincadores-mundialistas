"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { startQuiz, submitQuiz } from "@/actions/quiz";
import { QuizQuestionStage } from "@/components/quiz/QuizQuestionStage";
import type { QuestionPhase } from "@/lib/quiz/play-flow";
import {
  FEEDBACK_DELAY_MS,
  nextStepAfterFeedback,
  pickWrongOptionId,
  QUESTION_TIME_SEC,
  shouldAutoSubmit,
} from "@/lib/quiz/play-flow";
import type { QuizStartSession } from "@/lib/quiz/types";

type QuizPlaySessionProps = {
  poolId: string;
  quizId: string;
};

function formatCountdown(expiresAt: string): string {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return "0:00";
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${String(sec).padStart(2, "0")}`;
}

export function QuizPlaySession({ poolId, quizId }: QuizPlaySessionProps) {
  const router = useRouter();
  const [session, setSession] = useState<QuizStartSession | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [phase, setPhase] = useState<QuestionPhase>("answering");
  const [secondsLeft, setSecondsLeft] = useState(QUESTION_TIME_SEC);
  const [sessionCountdown, setSessionCountdown] = useState("");
  const [loading, startLoading] = useTransition();
  const [submitting, startSubmitting] = useTransition();

  const submittedRef = useRef(false);
  const advancingRef = useRef(false);
  const feedbackTimerRef = useRef<number | null>(null);
  const questionTimerRef = useRef<number | null>(null);

  const clearTimers = useCallback(() => {
    if (feedbackTimerRef.current !== null) {
      window.clearTimeout(feedbackTimerRef.current);
      feedbackTimerRef.current = null;
    }
    if (questionTimerRef.current !== null) {
      window.clearInterval(questionTimerRef.current);
      questionTimerRef.current = null;
    }
  }, []);

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
    const tick = () => setSessionCountdown(formatCountdown(session.expires_at));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [session?.expires_at]);

  const questions = session?.questions ?? [];
  const currentQuestion = questions[step] ?? null;

  const handleSubmit = useCallback(
    (finalAnswers: Record<string, string>) => {
      if (!session || submittedRef.current) return;
      submittedRef.current = true;
      setSubmitError(null);

      startSubmitting(async () => {
        const result = await submitQuiz(poolId, session.attempt_id, finalAnswers);
        if (!result.ok) {
          submittedRef.current = false;
          setSubmitError(result.error);
          return;
        }
        router.push(`/quiz/result?attempt=${session.attempt_id}`);
        router.refresh();
      });
    },
    [poolId, router, session]
  );

  const scheduleAdvance = useCallback(
    (nextAnswers: Record<string, string>) => {
      if (advancingRef.current) return;
      advancingRef.current = true;

      feedbackTimerRef.current = window.setTimeout(() => {
        advancingRef.current = false;
        feedbackTimerRef.current = null;

        if (!session) return;

        if (shouldAutoSubmit(step, questions.length)) {
          handleSubmit(nextAnswers);
          return;
        }

        const next = nextStepAfterFeedback(step, questions.length);
        if (next !== null) {
          setStep(next);
          setPhase("answering");
          setSecondsLeft(QUESTION_TIME_SEC);
        }
      }, FEEDBACK_DELAY_MS);
    },
    [handleSubmit, questions.length, session, step]
  );

  const resolveAnswer = useCallback(
    (optionId: string) => {
      if (!currentQuestion || phase !== "answering" || advancingRef.current) return;

      clearTimers();
      setAnswers((prev) => {
        const next = { ...prev, [currentQuestion.id]: optionId };
        setPhase("feedback");
        scheduleAdvance(next);
        return next;
      });
    },
    [clearTimers, currentQuestion, phase, scheduleAdvance]
  );

  const handleTimeout = useCallback(() => {
    if (!currentQuestion || phase !== "answering" || advancingRef.current) return;

    clearTimers();
    const wrongId = pickWrongOptionId(
      currentQuestion.options,
      currentQuestion.correct_option_id
    );

    setAnswers((prev) => {
      const next = { ...prev, [currentQuestion.id]: wrongId };
      setPhase("feedback");
      scheduleAdvance(next);
      return next;
    });
  }, [clearTimers, currentQuestion, phase, scheduleAdvance]);

  useEffect(() => {
    if (!currentQuestion || phase !== "answering") return;

    setSecondsLeft(QUESTION_TIME_SEC);
    clearTimers();

    questionTimerRef.current = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          if (questionTimerRef.current !== null) {
            window.clearInterval(questionTimerRef.current);
            questionTimerRef.current = null;
          }
          window.setTimeout(() => handleTimeout(), 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return clearTimers;
  }, [clearTimers, currentQuestion?.id, phase, step, handleTimeout]);

  useEffect(() => () => clearTimers(), [clearTimers]);

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

  if (submitError) {
    return (
      <CardMessage
        title="Error al enviar"
        body={submitError}
        actionHref="/quiz"
        actionLabel="Volver al quiz"
      />
    );
  }

  if (submitting) {
    return (
      <div className="tm-quiz-stage rounded-2xl border border-[var(--tm-border)] bg-[var(--tm-surface)] p-6 text-center text-sm text-[var(--tm-muted)]">
        Calculando resultado...
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

  const locked = phase === "feedback";

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex shrink-0 items-center justify-between gap-3">
        <Link href="/quiz" className="text-sm font-medium text-[var(--tm-primary)]">
          Volver
        </Link>
        <p className="text-xs text-[var(--tm-muted)]">
          Sesion · {sessionCountdown || "--:--"}
        </p>
      </div>

      <div className="tm-quiz-stage-scroll flex min-h-0 flex-1 flex-col gap-4">
        <QuizQuestionStage
          question={currentQuestion}
          questionIndex={step}
          totalQuestions={questions.length}
          selectedOptionId={answers[currentQuestion.id] ?? null}
          phase={phase}
          secondsLeft={secondsLeft}
          locked={locked}
          onSelect={resolveAnswer}
        />
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
